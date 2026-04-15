import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "../middlewares/errorHandler.middleware";

// ── Mocks ────────────────────────────────────────────────────────────────────

const {
  mockOfferRepository,
  mockOrderRepository,
  mockPrintingSheetRepository,
} = vi.hoisted(() => ({
  mockOfferRepository: {
    findById: vi.fn(),
  },
  mockOrderRepository: {
    findById: vi.fn(),
  },
  mockPrintingSheetRepository: {
    createMany: vi.fn(),
    findByOfferId: vi.fn(),
    findByOrderId: vi.fn(),
    deleteByGroupId: vi.fn(),
    updateOrderIdByOfferId: vi.fn(),
  },
}));

vi.mock("../repositories/offer.repository", () => ({
  default: mockOfferRepository,
}));
vi.mock("../repositories/order.repository", () => ({
  default: mockOrderRepository,
}));
vi.mock("../repositories/printingSheet.repository", () => ({
  default: mockPrintingSheetRepository,
}));

import { PrintingSheetService } from "../services/printingSheet.service";

// ── Helpers ──────────────────────────────────────────────────────────────────

const sampleSheet = (overrides = {}) => ({
  productId: "prod1",
  productNumber: "PN-001",
  productName: "T-Shirt",
  productImage: "https://img.example.com/tshirt.jpg",
  orderDate: "2026-04-01",
  reference: "REF-100",
  seller: "John",
  deliveryDate: "2026-05-01",
  deliveryTime: "morning",
  customerName: "Acme Corp",
  printMethod: "screen",
  sizeQuantities: { M: "10", L: "5" },
  totalQuantity: 15,
  ...overrides,
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("PrintingSheetService", () => {
  let service: PrintingSheetService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PrintingSheetService();
  });

  // ─── createPrintingSheets ───────────────────────────────────────────────

  describe("createPrintingSheets", () => {
    it("creates sheets when offer exists and no orderId", async () => {
      mockOfferRepository.findById.mockResolvedValue({ _id: "offer1" });
      const created = [{ _id: "s1", ...sampleSheet(), offerId: "offer1" }];
      mockPrintingSheetRepository.createMany.mockResolvedValue(created);

      const result = await service.createPrintingSheets({
        offerId: "offer1",
        sheets: [sampleSheet()],
      });

      expect(mockOfferRepository.findById).toHaveBeenCalledWith("offer1");
      expect(mockOrderRepository.findById).not.toHaveBeenCalled();
      expect(mockPrintingSheetRepository.createMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ offerId: "offer1", orderId: undefined }),
        ]),
      );
      expect(result).toEqual(created);
    });

    it("creates sheets when both offer and order exist and match", async () => {
      mockOfferRepository.findById.mockResolvedValue({ _id: "offer1" });
      mockOrderRepository.findById.mockResolvedValue({
        _id: "order1",
        offerId: "offer1",
      });
      mockPrintingSheetRepository.createMany.mockResolvedValue([]);

      await service.createPrintingSheets({
        offerId: "offer1",
        orderId: "order1",
        sheets: [sampleSheet()],
      });

      expect(mockOrderRepository.findById).toHaveBeenCalledWith("order1");
      expect(mockPrintingSheetRepository.createMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ offerId: "offer1", orderId: "order1" }),
        ]),
      );
    });

    it("throws 404 when offer not found", async () => {
      mockOfferRepository.findById.mockResolvedValue(null);

      await expect(
        service.createPrintingSheets({
          offerId: "missing",
          sheets: [sampleSheet()],
        }),
      ).rejects.toThrow(AppError);

      await expect(
        service.createPrintingSheets({
          offerId: "missing",
          sheets: [sampleSheet()],
        }),
      ).rejects.toThrow("Offer not found");
    });

    it("throws 404 when order not found", async () => {
      mockOfferRepository.findById.mockResolvedValue({ _id: "offer1" });
      mockOrderRepository.findById.mockResolvedValue(null);

      await expect(
        service.createPrintingSheets({
          offerId: "offer1",
          orderId: "missing",
          sheets: [sampleSheet()],
        }),
      ).rejects.toThrow("Order not found");
    });

    it("throws 400 when order does not belong to the offer", async () => {
      mockOfferRepository.findById.mockResolvedValue({ _id: "offer1" });
      mockOrderRepository.findById.mockResolvedValue({
        _id: "order1",
        offerId: "different-offer",
      });

      await expect(
        service.createPrintingSheets({
          offerId: "offer1",
          orderId: "order1",
          sheets: [sampleSheet()],
        }),
      ).rejects.toThrow("Order does not belong to the specified offer");
    });

    it("preserves groupId on sheets", async () => {
      mockOfferRepository.findById.mockResolvedValue({ _id: "offer1" });
      mockPrintingSheetRepository.createMany.mockResolvedValue([]);

      await service.createPrintingSheets({
        offerId: "offer1",
        sheets: [sampleSheet({ groupId: "group-abc" })],
      });

      expect(mockPrintingSheetRepository.createMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ groupId: "group-abc" }),
        ]),
      );
    });
  });

  // ─── getSheetsByOffer ───────────────────────────────────────────────────

  describe("getSheetsByOffer", () => {
    it("delegates to repository", async () => {
      const sheets = [{ _id: "s1", offerId: "offer1" }];
      mockPrintingSheetRepository.findByOfferId.mockResolvedValue(sheets);

      const result = await service.getSheetsByOffer("offer1");

      expect(mockPrintingSheetRepository.findByOfferId).toHaveBeenCalledWith(
        "offer1",
      );
      expect(result).toEqual(sheets);
    });
  });

  // ─── getSheetsByOrder ───────────────────────────────────────────────────

  describe("getSheetsByOrder", () => {
    it("delegates to repository", async () => {
      const sheets = [{ _id: "s1", orderId: "order1" }];
      mockPrintingSheetRepository.findByOrderId.mockResolvedValue(sheets);

      const result = await service.getSheetsByOrder("order1");

      expect(mockPrintingSheetRepository.findByOrderId).toHaveBeenCalledWith(
        "order1",
      );
      expect(result).toEqual(sheets);
    });
  });

  // ─── deleteSheetsByGroup ────────────────────────────────────────────────

  describe("deleteSheetsByGroup", () => {
    it("returns deleted count from repository", async () => {
      mockPrintingSheetRepository.deleteByGroupId.mockResolvedValue({
        deletedCount: 3,
      });

      const result = await service.deleteSheetsByGroup("group1");

      expect(mockPrintingSheetRepository.deleteByGroupId).toHaveBeenCalledWith(
        "group1",
      );
      expect(result).toBe(3);
    });

    it("returns 0 when nothing deleted", async () => {
      mockPrintingSheetRepository.deleteByGroupId.mockResolvedValue({
        deletedCount: 0,
      });

      const result = await service.deleteSheetsByGroup("nonexistent");
      expect(result).toBe(0);
    });
  });

  // ─── linkSheetsToOrder ─────────────────────────────────────────────────

  describe("linkSheetsToOrder", () => {
    it("delegates to repository updateOrderIdByOfferId", async () => {
      const updateResult = { modifiedCount: 2, matchedCount: 2 };
      mockPrintingSheetRepository.updateOrderIdByOfferId.mockResolvedValue(
        updateResult,
      );

      const result = await service.linkSheetsToOrder("offer1", "order1");

      expect(
        mockPrintingSheetRepository.updateOrderIdByOfferId,
      ).toHaveBeenCalledWith("offer1", "order1");
      expect(result).toEqual(updateResult);
    });
  });
});
