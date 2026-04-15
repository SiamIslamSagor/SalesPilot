import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../middlewares/errorHandler.middleware";

// ── Mocks ────────────────────────────────────────────────────────────────────

const {
  mockPrintingSheetService,
  mockOfferRepository,
  mockOrderRepository,
  mockPrintingSheetRepository,
  mockCanAccessOwnedEntity,
} = vi.hoisted(() => ({
  mockPrintingSheetService: {
    createPrintingSheets: vi.fn(),
    getSheetsByOffer: vi.fn(),
    getSheetsByOrder: vi.fn(),
    deleteSheetsByGroup: vi.fn(),
  },
  mockOfferRepository: {
    findById: vi.fn(),
  },
  mockOrderRepository: {
    findById: vi.fn(),
  },
  mockPrintingSheetRepository: {
    findByGroupIdOrId: vi.fn(),
    findByOrderIds: vi.fn(),
  },
  mockCanAccessOwnedEntity: vi.fn(),
}));

vi.mock("../services/printingSheet.service", () => ({
  default: mockPrintingSheetService,
  PrintingSheetInput: {},
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
vi.mock("../utils/ownership", () => ({
  canAccessOwnedEntity: (...args: unknown[]) =>
    mockCanAccessOwnedEntity(...args),
}));

// Import after mocks
import printingSheetController from "../controllers/printingSheet.controller";

// ── Helpers ──────────────────────────────────────────────────────────────────

const mockReq = (overrides: Partial<Request> = {}): Request =>
  ({
    params: {},
    query: {},
    body: {},
    user: { userId: "user1", email: "user@test.com", role: "admin" },
    ...overrides,
  }) as unknown as Request;

const mockRes = (): Response => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
};

const mockNext: NextFunction = vi.fn();

const sampleSheet = () => ({
  productId: "prod1",
  productNumber: "PN-001",
  productName: "T-Shirt",
  orderDate: "2026-04-01",
  reference: "REF-100",
  seller: "John",
  deliveryDate: "2026-05-01",
  deliveryTime: "morning",
  customerName: "Acme Corp",
  printMethod: "screen",
  sizeQuantities: { M: "10" },
  totalQuantity: 10,
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("PrintingSheetController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCanAccessOwnedEntity.mockReturnValue(true);
  });

  // ─── createSheets ──────────────────────────────────────────────────────

  describe("createSheets", () => {
    it("returns 201 with created sheets on success", async () => {
      const req = mockReq({
        body: { offerId: "offer1", sheets: [sampleSheet()] },
      });
      const res = mockRes();

      mockOfferRepository.findById.mockResolvedValue({
        _id: "offer1",
        ownerUserId: "user1",
      });
      const created = [{ _id: "s1", ...sampleSheet() }];
      mockPrintingSheetService.createPrintingSheets.mockResolvedValue(created);

      await printingSheetController.createSheets(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: created,
        message: "Printing sheets saved",
      });
    });

    it("calls next with error when offerId is missing", async () => {
      const req = mockReq({
        body: { sheets: [sampleSheet()] },
      });
      const res = mockRes();

      await printingSheetController.createSheets(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("Invalid request data");
      expect(error.statusCode).toBe(400);
    });

    it("calls next with error when sheets is empty array", async () => {
      const req = mockReq({
        body: { offerId: "offer1", sheets: [] },
      });
      const res = mockRes();

      await printingSheetController.createSheets(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it("calls next with error when sheets is not an array", async () => {
      const req = mockReq({
        body: { offerId: "offer1", sheets: "invalid" },
      });
      const res = mockRes();

      await printingSheetController.createSheets(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it("checks offer access before creating", async () => {
      const req = mockReq({
        body: { offerId: "offer1", sheets: [sampleSheet()] },
      });
      const res = mockRes();

      mockOfferRepository.findById.mockResolvedValue(null);

      await printingSheetController.createSheets(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("Offer not found");
    });

    it("checks order access when orderId is provided", async () => {
      const req = mockReq({
        body: { offerId: "offer1", orderId: "order1", sheets: [sampleSheet()] },
      });
      const res = mockRes();

      mockOfferRepository.findById.mockResolvedValue({
        _id: "offer1",
        ownerUserId: "user1",
      });
      mockOrderRepository.findById.mockResolvedValue(null);

      await printingSheetController.createSheets(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("Order not found");
    });

    it("returns 403 when user lacks offer access", async () => {
      const req = mockReq({
        body: { offerId: "offer1", sheets: [sampleSheet()] },
      });
      const res = mockRes();

      mockOfferRepository.findById.mockResolvedValue({
        _id: "offer1",
        ownerUserId: "other-user",
      });
      mockCanAccessOwnedEntity.mockReturnValue(false);

      await printingSheetController.createSheets(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.statusCode).toBe(403);
    });
  });

  // ─── getByOfferId ──────────────────────────────────────────────────────

  describe("getByOfferId", () => {
    it("returns sheets for the offer", async () => {
      const req = mockReq({ params: { offerId: "offer1" } });
      const res = mockRes();

      mockOfferRepository.findById.mockResolvedValue({
        _id: "offer1",
        ownerUserId: "user1",
      });
      const sheets = [{ _id: "s1", offerId: "offer1" }];
      mockPrintingSheetService.getSheetsByOffer.mockResolvedValue(sheets);

      await printingSheetController.getByOfferId(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: sheets });
    });

    it("calls next on offer not found", async () => {
      const req = mockReq({ params: { offerId: "missing" } });
      const res = mockRes();

      mockOfferRepository.findById.mockResolvedValue(null);

      await printingSheetController.getByOfferId(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  // ─── getByOrderId ─────────────────────────────────────────────────────

  describe("getByOrderId", () => {
    it("returns sheets for the order", async () => {
      const req = mockReq({ params: { orderId: "order1" } });
      const res = mockRes();

      mockOrderRepository.findById.mockResolvedValue({
        _id: "order1",
        ownerUserId: "user1",
      });
      const sheets = [{ _id: "s1", orderId: "order1" }];
      mockPrintingSheetService.getSheetsByOrder.mockResolvedValue(sheets);

      await printingSheetController.getByOrderId(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: sheets });
    });

    it("calls next on order not found", async () => {
      const req = mockReq({ params: { orderId: "missing" } });
      const res = mockRes();

      mockOrderRepository.findById.mockResolvedValue(null);

      await printingSheetController.getByOrderId(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  // ─── getByOrderIds (batch) ─────────────────────────────────────────────

  describe("getByOrderIds", () => {
    it("returns grouped sheets for accessible orders", async () => {
      const req = mockReq({ query: { orderIds: "order1,order2" } });
      const res = mockRes();

      mockOrderRepository.findById
        .mockResolvedValueOnce({ _id: "order1", ownerUserId: "user1" })
        .mockResolvedValueOnce({ _id: "order2", ownerUserId: "user1" });

      const sheets = [
        { _id: "s1", orderId: "order1", productName: "A" },
        { _id: "s2", orderId: "order2", productName: "B" },
      ];
      mockPrintingSheetRepository.findByOrderIds.mockResolvedValue(sheets);

      await printingSheetController.getByOrderIds(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          order1: [sheets[0]],
          order2: [sheets[1]],
        },
      });
    });

    it("returns 400 when orderIds query param missing", async () => {
      const req = mockReq({ query: {} });
      const res = mockRes();

      await printingSheetController.getByOrderIds(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("orderIds query param is required");
    });

    it("returns empty object for empty orderIds string", async () => {
      const req = mockReq({ query: { orderIds: "," } });
      const res = mockRes();

      await printingSheetController.getByOrderIds(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: {} });
    });

    it("skips inaccessible orders silently", async () => {
      const req = mockReq({ query: { orderIds: "order1,order2" } });
      const res = mockRes();

      mockOrderRepository.findById
        .mockResolvedValueOnce({ _id: "order1", ownerUserId: "user1" })
        .mockResolvedValueOnce(null); // order2 not found → skipped

      mockPrintingSheetRepository.findByOrderIds.mockResolvedValue([
        { _id: "s1", orderId: "order1" },
      ]);

      await printingSheetController.getByOrderIds(req, res, mockNext);

      expect(mockPrintingSheetRepository.findByOrderIds).toHaveBeenCalledWith([
        "order1",
      ]);
    });
  });

  // ─── deleteGroup ───────────────────────────────────────────────────────

  describe("deleteGroup", () => {
    it("deletes sheets and returns count", async () => {
      const req = mockReq({ params: { groupId: "group1" } });
      const res = mockRes();

      mockPrintingSheetRepository.findByGroupIdOrId.mockResolvedValue([
        { _id: "s1", offerId: "offer1", orderId: "order1", groupId: "group1" },
      ]);
      mockOfferRepository.findById.mockResolvedValue({
        _id: "offer1",
        ownerUserId: "user1",
      });
      mockOrderRepository.findById.mockResolvedValue({
        _id: "order1",
        ownerUserId: "user1",
      });
      mockPrintingSheetService.deleteSheetsByGroup.mockResolvedValue(1);

      await printingSheetController.deleteGroup(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        deletedCount: 1,
        message: "Printing sheets deleted",
      });
    });

    it("calls next with 404 when no sheets found for group", async () => {
      const req = mockReq({ params: { groupId: "nonexistent" } });
      const res = mockRes();

      mockPrintingSheetRepository.findByGroupIdOrId.mockResolvedValue([]);

      await printingSheetController.deleteGroup(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.message).toBe("Printing sheets not found");
      expect(error.statusCode).toBe(404);
    });

    it("verifies access to all related offers and orders", async () => {
      const req = mockReq({ params: { groupId: "group1" } });
      const res = mockRes();

      mockPrintingSheetRepository.findByGroupIdOrId.mockResolvedValue([
        { _id: "s1", offerId: "offer1", orderId: "order1", groupId: "group1" },
        { _id: "s2", offerId: "offer2", orderId: "order2", groupId: "group1" },
      ]);
      mockOfferRepository.findById.mockResolvedValue({
        _id: "offer1",
        ownerUserId: "user1",
      });
      mockOrderRepository.findById.mockResolvedValue({
        _id: "order1",
        ownerUserId: "user1",
      });
      mockPrintingSheetService.deleteSheetsByGroup.mockResolvedValue(2);

      await printingSheetController.deleteGroup(req, res, mockNext);

      // Should check both offers and both orders
      expect(mockOfferRepository.findById).toHaveBeenCalledTimes(2);
      expect(mockOrderRepository.findById).toHaveBeenCalledTimes(2);
    });
  });
});
