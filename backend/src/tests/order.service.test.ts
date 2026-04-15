import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockOrderRepo,
  mockOfferRepo,
  mockProductRepo,
  mockCustomerRepo,
  mockPrintingSheetService,
  mockAppSettingsService,
} = vi.hoisted(() => ({
  mockOrderRepo: {
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findByOrderNumber: vi.fn(),
    count: vi.fn(),
    updateById: vi.fn(),
    deleteById: vi.fn(),
  },
  mockOfferRepo: {
    findById: vi.fn(),
    update: vi.fn(),
  },
  mockProductRepo: {
    findByIds: vi.fn(),
  },
  mockCustomerRepo: {
    incrementTotals: vi.fn(),
  },
  mockPrintingSheetService: {
    linkSheetsToOrder: vi.fn(),
  },
  mockAppSettingsService: {
    get: vi.fn(),
  },
}));

vi.mock("../repositories/order.repository", () => ({
  default: mockOrderRepo,
}));
vi.mock("../repositories/offer.repository", () => ({
  default: mockOfferRepo,
}));
vi.mock("../repositories/product.repository", () => ({
  default: mockProductRepo,
}));
vi.mock("../repositories/customer.repository", () => ({
  default: mockCustomerRepo,
}));
vi.mock("../services/printingSheet.service", () => ({
  default: mockPrintingSheetService,
}));
vi.mock("../services/appSettings.service", () => ({
  default: mockAppSettingsService,
}));

import orderService from "../services/order.service";

describe("order.service", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("createOrderFromQuote", () => {
    const validOffer = {
      _id: "off1",
      offerNumber: "O-001",
      customerResponse: "accepted",
      ownerUserId: "u1",
      ownerUserName: "Admin",
      ownerUserEmail: "a@b.com",
      customerId: "c1",
      customerName: "Acme",
      contactPerson: "John",
      email: "j@a.com",
      phone: "123",
      address: "Addr",
      items: [
        {
          productId: "p1",
          productName: "Shirt",
          productNumber: "PN001",
          quantity: 10,
          unitPrice: 20,
          discount: 0,
          markingCost: 2,
          internalMarkingCost: 1,
        },
      ],
      offerDetails: { specialCosts: [] },
    };

    it("creates order from accepted offer", async () => {
      mockOfferRepo.findById.mockResolvedValue(validOffer);
      mockOrderRepo.findByOrderNumber.mockResolvedValue(null);
      mockOrderRepo.find.mockResolvedValue([]);
      mockProductRepo.findByIds.mockResolvedValue([{ _id: "p1", margin: 20 }]);
      mockAppSettingsService.get.mockResolvedValue({
        customMarginPercentage: 0,
        marginMode: "fallback",
      });
      const created = { _id: "ord1", orderNumber: "SO-2025-001" };
      mockOrderRepo.create.mockResolvedValue(created);
      mockPrintingSheetService.linkSheetsToOrder.mockResolvedValue(undefined);
      mockOfferRepo.update.mockResolvedValue({});

      const result = await orderService.createOrderFromQuote({
        offerId: "off1",
        items: [{ productId: "p1", selectedColor: "Red", selectedSize: "M" }],
      });

      expect(result).toEqual(created);
      expect(mockOfferRepo.update).toHaveBeenCalled();
    });

    it("throws when offer not found", async () => {
      mockOfferRepo.findById.mockResolvedValue(null);
      await expect(
        orderService.createOrderFromQuote({
          offerId: "bad",
          items: [{ productId: "p1" }],
        }),
      ).rejects.toThrow("Offer not found");
    });

    it("throws when offer not accepted", async () => {
      mockOfferRepo.findById.mockResolvedValue({
        ...validOffer,
        customerResponse: "pending",
      });
      await expect(
        orderService.createOrderFromQuote({
          offerId: "off1",
          items: [{ productId: "p1" }],
        }),
      ).rejects.toThrow("non-accepted");
    });

    it("throws when order already exists for offer", async () => {
      mockOfferRepo.findById.mockResolvedValue(validOffer);
      mockOrderRepo.findByOrderNumber.mockResolvedValue({ _id: "existing" });
      await expect(
        orderService.createOrderFromQuote({
          offerId: "off1",
          items: [{ productId: "p1" }],
        }),
      ).rejects.toThrow("already exists");
    });
  });

  describe("getOrders", () => {
    it("returns orders with pagination", async () => {
      mockOrderRepo.find.mockResolvedValue([{ _id: "ord1" }]);
      mockOrderRepo.count.mockResolvedValue(1);

      const result = await orderService.getOrders({}, { page: 1, limit: 10 });
      expect(result.orders).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe("getOrderById", () => {
    it("returns order", async () => {
      const order = { _id: "ord1", orderNumber: "SO-2025-001" };
      mockOrderRepo.findById.mockResolvedValue(order);

      const result = await orderService.getOrderById("ord1");
      expect(result).toEqual(order);
    });
  });

  describe("updateOrderStatus", () => {
    it("transitions pending → processing", async () => {
      const order = {
        _id: "ord1",
        status: "pending",
        customerId: "c1",
        totalAmount: 100,
        totalMargin: 20,
      };
      mockOrderRepo.findById.mockResolvedValue(order);
      mockOrderRepo.updateById.mockResolvedValue({
        ...order,
        status: "processing",
      });

      const result = await orderService.updateOrderStatus("ord1", "processing");
      expect(result?.status).toBe("processing");
    });

    it("increments customer totals on completion", async () => {
      const order = {
        _id: "ord1",
        status: "processing",
        customerId: "c1",
        totalAmount: 100,
        totalMargin: 20,
      };
      mockOrderRepo.findById.mockResolvedValue(order);
      mockOrderRepo.updateById.mockResolvedValue({
        ...order,
        status: "completed",
      });

      await orderService.updateOrderStatus("ord1", "completed");
      expect(mockCustomerRepo.incrementTotals).toHaveBeenCalledWith(
        "c1",
        100,
        20,
      );
    });

    it("throws on invalid status", async () => {
      await expect(
        orderService.updateOrderStatus("ord1", "invalid"),
      ).rejects.toThrow("Invalid status");
    });

    it("throws on invalid transition (completed → pending)", async () => {
      const order = {
        _id: "ord1",
        status: "completed",
        customerId: "c1",
        totalAmount: 100,
        totalMargin: 20,
      };
      mockOrderRepo.findById.mockResolvedValue(order);

      await expect(
        orderService.updateOrderStatus("ord1", "pending"),
      ).rejects.toThrow("Cannot transition");
    });

    it("throws when order not found", async () => {
      mockOrderRepo.findById.mockResolvedValue(null);
      await expect(
        orderService.updateOrderStatus("bad", "processing"),
      ).rejects.toThrow("Order not found");
    });
  });

  describe("deleteOrder", () => {
    it("deletes order and returns true", async () => {
      mockOrderRepo.findById.mockResolvedValue({
        _id: "ord1",
        status: "pending",
        customerId: "c1",
        totalAmount: 100,
        totalMargin: 20,
      });
      mockOrderRepo.deleteById.mockResolvedValue(true);

      const result = await orderService.deleteOrder("ord1");
      expect(result).toBe(true);
    });

    it("reverses customer totals when deleting completed order", async () => {
      mockOrderRepo.findById.mockResolvedValue({
        _id: "ord1",
        status: "completed",
        customerId: "c1",
        totalAmount: 100,
        totalMargin: 20,
      });
      mockOrderRepo.deleteById.mockResolvedValue(true);

      await orderService.deleteOrder("ord1");
      expect(mockCustomerRepo.incrementTotals).toHaveBeenCalledWith(
        "c1",
        -100,
        -20,
      );
    });

    it("returns false when order not found", async () => {
      mockOrderRepo.findById.mockResolvedValue(null);
      const result = await orderService.deleteOrder("bad");
      expect(result).toBe(false);
    });
  });
});
