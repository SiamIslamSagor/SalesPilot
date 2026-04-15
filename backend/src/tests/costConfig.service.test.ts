import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCostConfigRepo } = vi.hoisted(() => ({
  mockCostConfigRepo: {
    findAll: vi.fn(),
    findEnabled: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    updateById: vi.fn(),
    deleteById: vi.fn(),
    bulkUpsert: vi.fn(),
  },
}));

vi.mock("../repositories/costConfig.repository", () => ({
  default: mockCostConfigRepo,
}));

import costConfigService from "../services/costConfig.service";
import { AppError } from "../middlewares/errorHandler.middleware";

describe("CostConfigService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("delegates to repository", async () => {
      mockCostConfigRepo.findAll.mockResolvedValue([]);
      const result = await costConfigService.getAll();
      expect(result).toEqual([]);
      expect(mockCostConfigRepo.findAll).toHaveBeenCalled();
    });
  });

  describe("getById", () => {
    it("returns item when found", async () => {
      mockCostConfigRepo.findById.mockResolvedValue({
        _id: "cc1",
        name: "Shipping",
      });
      const result = await costConfigService.getById("cc1");
      expect(result.name).toBe("Shipping");
    });

    it("throws AppError 404 when not found", async () => {
      mockCostConfigRepo.findById.mockResolvedValue(null);
      await expect(costConfigService.getById("bad")).rejects.toThrow(AppError);
    });
  });

  describe("create", () => {
    it("creates cost config item", async () => {
      const data = {
        name: "Handling",
        type: "fixed" as const,
        value: 10,
        category: "cost" as const,
      };
      mockCostConfigRepo.create.mockResolvedValue({ _id: "cc1", ...data });
      const result = await costConfigService.create(data);
      expect(result.name).toBe("Handling");
    });
  });

  describe("update", () => {
    it("updates item when found", async () => {
      mockCostConfigRepo.updateById.mockResolvedValue({
        _id: "cc1",
        name: "Updated",
      });
      const result = await costConfigService.update("cc1", {
        name: "Updated",
      });
      expect(result.name).toBe("Updated");
    });

    it("throws AppError 404 when not found", async () => {
      mockCostConfigRepo.updateById.mockResolvedValue(null);
      await expect(
        costConfigService.update("bad", { name: "X" }),
      ).rejects.toThrow(AppError);
    });
  });

  describe("delete", () => {
    it("deletes item when found", async () => {
      mockCostConfigRepo.deleteById.mockResolvedValue(true);
      await expect(costConfigService.delete("cc1")).resolves.toBeUndefined();
    });

    it("throws AppError 404 when not found", async () => {
      mockCostConfigRepo.deleteById.mockResolvedValue(null);
      await expect(costConfigService.delete("bad")).rejects.toThrow(AppError);
    });
  });

  describe("calculateAdjustments", () => {
    it("calculates fixed cost deduction", () => {
      const configs = [
        {
          name: "Shipping",
          type: "fixed" as const,
          value: 50,
          category: "cost" as const,
          enabled: true,
        },
      ];
      const result = costConfigService.calculateAdjustments(
        configs as never,
        1000,
      );
      expect(result.marginAdjustment).toBe(-50);
      expect(result.appliedCosts).toHaveLength(1);
      expect(result.appliedCosts[0].calculatedAmount).toBe(-50);
    });

    it("calculates percentage margin addition", () => {
      const configs = [
        {
          name: "Markup",
          type: "percentage" as const,
          value: 10,
          category: "margin" as const,
          enabled: true,
        },
      ];
      const result = costConfigService.calculateAdjustments(
        configs as never,
        1000,
      );
      expect(result.marginAdjustment).toBe(100);
    });

    it("caps percentage at 100%", () => {
      const configs = [
        {
          name: "OverCharge",
          type: "percentage" as const,
          value: 200,
          category: "margin" as const,
          enabled: true,
        },
      ];
      const result = costConfigService.calculateAdjustments(
        configs as never,
        500,
      );
      expect(result.marginAdjustment).toBe(500);
    });

    it("handles invalid order total", () => {
      const configs = [
        {
          name: "Pct",
          type: "percentage" as const,
          value: 10,
          category: "cost" as const,
          enabled: true,
        },
      ];
      const result = costConfigService.calculateAdjustments(
        configs as never,
        NaN,
      );
      expect(result.marginAdjustment).toBe(0);
    });

    it("combines multiple configs", () => {
      const configs = [
        {
          name: "Ship",
          type: "fixed" as const,
          value: 30,
          category: "cost" as const,
          enabled: true,
        },
        {
          name: "Markup",
          type: "percentage" as const,
          value: 5,
          category: "margin" as const,
          enabled: true,
        },
      ];
      const result = costConfigService.calculateAdjustments(
        configs as never,
        1000,
      );
      // -30 (cost) + 50 (5% of 1000 margin)
      expect(result.marginAdjustment).toBe(20);
      expect(result.appliedCosts).toHaveLength(2);
    });
  });
});
