import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAppSettingsRepo } = vi.hoisted(() => ({
  mockAppSettingsRepo: {
    get: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("../repositories/appSettings.repository", () => ({
  default: mockAppSettingsRepo,
}));

// Use dynamic import so we get a fresh module each time after resetModules
describe("AppSettingsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe("get", () => {
    it("fetches settings and caches for subsequent calls", async () => {
      const { default: appSettingsService } = await import(
        "../services/appSettings.service"
      );

      mockAppSettingsRepo.get.mockResolvedValue({
        customMarginPercentage: 15,
        marginMode: "fallback",
      });

      const result1 = await appSettingsService.get();
      expect(result1.customMarginPercentage).toBe(15);
      expect(mockAppSettingsRepo.get).toHaveBeenCalledTimes(1);

      // Second call should use cache, no additional repo call
      const result2 = await appSettingsService.get();
      expect(result2.customMarginPercentage).toBe(15);
      expect(mockAppSettingsRepo.get).toHaveBeenCalledTimes(1);
    });
  });

  describe("update", () => {
    it("updates settings and refreshes cache", async () => {
      const { default: appSettingsService } = await import(
        "../services/appSettings.service"
      );

      mockAppSettingsRepo.update.mockResolvedValue({
        customMarginPercentage: 25,
        marginMode: "override",
      });

      const result = await appSettingsService.update({
        customMarginPercentage: 25,
        marginMode: "override",
      });

      expect(result.customMarginPercentage).toBe(25);
      expect(mockAppSettingsRepo.update).toHaveBeenCalledWith({
        customMarginPercentage: 25,
        marginMode: "override",
      });
    });
  });
});
