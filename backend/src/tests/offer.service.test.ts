import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockOfferRepo, mockProduct } = vi.hoisted(() => ({
  mockOfferRepo: {
    create: vi.fn(),
    findById: vi.fn(),
    findByIdLean: vi.fn(),
    findByAccessCode: vi.fn(),
    findAll: vi.fn(),
    findByCustomerId: vi.fn(),
    updateStatus: vi.fn(),
    update: vi.fn(),
    bulkExpireByIds: vi.fn(),
    delete: vi.fn(),
  },
  mockProduct: {
    find: vi.fn(),
  },
}));

vi.mock("../repositories/offer.repository", () => ({
  default: mockOfferRepo,
}));
vi.mock("../models/product.model", () => ({
  default: mockProduct,
}));
vi.mock("../services/email.service", () => ({
  default: {
    sendOfferResponseAdminEmail: vi.fn().mockResolvedValue({ success: true }),
    sendOfferResponseCustomerEmail: vi
      .fn()
      .mockResolvedValue({ success: true }),
  },
}));
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({ emails: { send: vi.fn() } })),
}));

import offerService from "../services/offer.service";

describe("offer.service", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("createOffer", () => {
    it("creates offer with calculated total", async () => {
      const offerDoc = {
        toObject: () => ({ _id: "o1", offerNumber: "O-001" }),
      };
      mockOfferRepo.create.mockResolvedValue(offerDoc);

      const result = await offerService.createOffer({
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
            markingCost: 0,
            internalMarkingCost: 0,
            showUnitPrice: true,
            showTotalPrice: true,
            hideMarkingCost: false,
            generateMockup: false,
          },
        ],
        totalAmount: 200,
        itemCount: 1,
        offerDetails: {
          validUntil: "2099-12-31",
          validDays: "30",
          showTotalPrice: true,
          additionalTermsEnabled: false,
          additionalTerms: "",
          specialCosts: [],
        },
      });

      expect(result.success).toBe(true);
      expect(mockOfferRepo.create).toHaveBeenCalled();
    });

    it("throws when no items provided", async () => {
      await expect(
        offerService.createOffer({
          customerId: "c1",
          customerName: "Acme",
          contactPerson: "John",
          email: "j@a.com",
          phone: "123",
          address: "Addr",
          items: [],
          totalAmount: 0,
          itemCount: 0,
          offerDetails: {
            validUntil: "",
            validDays: "0",
            showTotalPrice: true,
            additionalTermsEnabled: false,
            additionalTerms: "",
            specialCosts: [],
          },
        }),
      ).rejects.toThrow("At least one item is required");
    });

    it("throws when no customerId", async () => {
      await expect(
        offerService.createOffer({
          customerId: "",
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
              quantity: 1,
              unitPrice: 10,
              discount: 0,
              markingCost: 0,
              internalMarkingCost: 0,
              showUnitPrice: true,
              showTotalPrice: true,
              hideMarkingCost: false,
              generateMockup: false,
            },
          ],
          totalAmount: 10,
          itemCount: 1,
          offerDetails: {
            validUntil: "",
            validDays: "0",
            showTotalPrice: true,
            additionalTermsEnabled: false,
            additionalTerms: "",
            specialCosts: [],
          },
        }),
      ).rejects.toThrow("Customer ID is required");
    });
  });

  describe("getOfferById", () => {
    it("returns offer with product images", async () => {
      const offerDoc = {
        _id: "o1",
        status: "draft",
        offerDetails: {},
        items: [{ productId: "p1" }],
      };
      mockOfferRepo.findByIdLean.mockResolvedValue(offerDoc);
      mockProduct.find.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi
            .fn()
            .mockResolvedValue([{ _id: "p1", images: ["https://img.jpg"] }]),
        }),
      });

      const result = await offerService.getOfferById("o1");
      expect(result.success).toBe(true);
      expect(result.data.items[0].imageUrl).toBe("https://img.jpg");
    });

    it("throws when offer not found", async () => {
      mockOfferRepo.findByIdLean.mockResolvedValue(null);
      await expect(offerService.getOfferById("bad")).rejects.toThrow(
        "Offer not found",
      );
    });
  });

  describe("getAllOffers", () => {
    it("returns paginated offers", async () => {
      mockOfferRepo.findAll.mockResolvedValue({
        offers: [{ _id: "o1", status: "draft", offerDetails: {} }],
        total: 1,
        page: 1,
        pages: 1,
      });

      const result = await offerService.getAllOffers(1, 10);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe("updateOfferStatus", () => {
    it("updates status successfully", async () => {
      const updated = {
        _id: { toString: () => "o1" },
        offerNumber: "O-001",
        status: "sent",
        createdAt: new Date(),
      };
      mockOfferRepo.updateStatus.mockResolvedValue(updated);

      const result = await offerService.updateOfferStatus("o1", "sent");
      expect(result.success).toBe(true);
    });

    it("throws when offer not found", async () => {
      mockOfferRepo.updateStatus.mockResolvedValue(null);
      await expect(
        offerService.updateOfferStatus("bad", "sent"),
      ).rejects.toThrow("Offer not found");
    });
  });
});
