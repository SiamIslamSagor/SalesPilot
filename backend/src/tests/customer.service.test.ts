import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "../middlewares/errorHandler.middleware";

const {
  mockCustomerRepo,
  mockOfferRepo,
  mockOrderRepo,
  mockOfferModel,
  mockOrderModel,
  mockUploadToCloudinary,
} = vi.hoisted(() => ({
  mockCustomerRepo: {
    create: vi.fn(),
    createMany: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    existsByBusinessId: vi.fn(),
    count: vi.fn(),
  },
  mockOfferRepo: {
    updateManyByCustomerId: vi.fn(),
  },
  mockOrderRepo: {
    updateManyByCustomerId: vi.fn(),
  },
  mockOfferModel: {
    countDocuments: vi.fn(),
  },
  mockOrderModel: {
    countDocuments: vi.fn(),
  },
  mockUploadToCloudinary: vi.fn(),
}));

vi.mock("../repositories/customer.repository", () => ({
  default: mockCustomerRepo,
}));
vi.mock("../repositories/offer.repository", () => ({
  default: mockOfferRepo,
}));
vi.mock("../repositories/order.repository", () => ({
  default: mockOrderRepo,
}));
vi.mock("../models/offer.model", () => ({
  default: mockOfferModel,
}));
vi.mock("../models/order.model", () => ({
  default: mockOrderModel,
}));
vi.mock("../utils/cloudinary", () => ({
  uploadToCloudinary: mockUploadToCloudinary,
}));

import customerService from "../services/customer.service";

describe("CustomerService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createCustomer", () => {
    it("creates customer when businessId is unique", async () => {
      mockCustomerRepo.existsByBusinessId.mockResolvedValue(false);
      mockCustomerRepo.create.mockResolvedValue({
        _id: "c1",
        companyName: "Test Oy",
      });

      const result = await customerService.createCustomer({
        companyName: "Test Oy",
        businessId: "1234567-8",
        contactPerson: "John",
        phone: "123",
        email: "john@test.fi",
        address: "Street 1",
        city: "Helsinki",
        postcode: "00100",
      });

      expect(result._id).toBe("c1");
    });

    it("throws when businessId already exists", async () => {
      mockCustomerRepo.existsByBusinessId.mockResolvedValue(true);

      await expect(
        customerService.createCustomer({
          companyName: "Test Oy",
          businessId: "1234567-8",
          contactPerson: "John",
          phone: "123",
          email: "john@test.fi",
          address: "Street 1",
          city: "Helsinki",
          postcode: "00100",
        }),
      ).rejects.toThrow("already exists");
    });

    it("uploads base64 logo to cloudinary", async () => {
      mockCustomerRepo.existsByBusinessId.mockResolvedValue(false);
      mockUploadToCloudinary.mockResolvedValue("https://cdn.com/logo.png");
      mockCustomerRepo.create.mockResolvedValue({ _id: "c1" });

      await customerService.createCustomer({
        companyName: "Test",
        businessId: "",
        contactPerson: "J",
        phone: "1",
        email: "j@test.fi",
        address: "St",
        city: "Espoo",
        postcode: "02100",
        companyLogo: "data:image/png;base64,abc123",
      });

      expect(mockUploadToCloudinary).toHaveBeenCalledWith(
        "data:image/png;base64,abc123",
      );
    });

    it("strips empty businessId before create (no uniqueness check)", async () => {
      mockCustomerRepo.create.mockResolvedValue({ _id: "c1" });

      await customerService.createCustomer({
        companyName: "Test",
        businessId: "",
        contactPerson: "J",
        phone: "1",
        email: "j@test.fi",
        address: "St",
        city: "Espoo",
        postcode: "02100",
      });

      expect(mockCustomerRepo.existsByBusinessId).not.toHaveBeenCalled();
      const createArg = mockCustomerRepo.create.mock.calls[0][0];
      expect(createArg.businessId).toBeUndefined();
    });

    it("strips whitespace-only businessId before create", async () => {
      mockCustomerRepo.create.mockResolvedValue({ _id: "c1" });

      await customerService.createCustomer({
        companyName: "Test",
        businessId: "   ",
        contactPerson: "J",
        phone: "1",
        email: "j@test.fi",
        address: "St",
        city: "Espoo",
        postcode: "02100",
      });

      expect(mockCustomerRepo.existsByBusinessId).not.toHaveBeenCalled();
      const createArg = mockCustomerRepo.create.mock.calls[0][0];
      expect(createArg.businessId).toBeUndefined();
    });

    it("creates customer without businessId (undefined)", async () => {
      mockCustomerRepo.create.mockResolvedValue({ _id: "c1" });

      await customerService.createCustomer({
        companyName: "Test",
        contactPerson: "J",
        phone: "1",
        email: "j@test.fi",
        address: "St",
        city: "Espoo",
        postcode: "02100",
      });

      expect(mockCustomerRepo.existsByBusinessId).not.toHaveBeenCalled();
      expect(mockCustomerRepo.create).toHaveBeenCalledTimes(1);
    });
  });

  describe("getCustomerById", () => {
    it("returns customer when found", async () => {
      mockCustomerRepo.findById.mockResolvedValue({
        _id: "c1",
        companyName: "Test",
      });
      const result = await customerService.getCustomerById("c1");
      expect(result.companyName).toBe("Test");
    });

    it("throws when customer not found", async () => {
      mockCustomerRepo.findById.mockResolvedValue(null);
      await expect(customerService.getCustomerById("bad")).rejects.toThrow(
        "not found",
      );
    });
  });

  describe("updateCustomer", () => {
    it("cascades name/email updates to offers and orders", async () => {
      mockCustomerRepo.findById.mockResolvedValue({
        _id: "c1",
        businessId: "123",
      });
      mockCustomerRepo.update.mockResolvedValue({
        _id: "c1",
        companyName: "New Name",
      });
      mockOfferRepo.updateManyByCustomerId.mockResolvedValue(undefined);
      mockOrderRepo.updateManyByCustomerId.mockResolvedValue(undefined);

      await customerService.updateCustomer("c1", {
        companyName: "New Name",
      });

      expect(mockOfferRepo.updateManyByCustomerId).toHaveBeenCalledWith("c1", {
        customerName: "New Name",
      });
      expect(mockOrderRepo.updateManyByCustomerId).toHaveBeenCalledWith("c1", {
        customerName: "New Name",
      });
    });

    it("throws when changing to existing businessId", async () => {
      mockCustomerRepo.findById.mockResolvedValue({
        _id: "c1",
        businessId: "111",
      });
      mockCustomerRepo.existsByBusinessId.mockResolvedValue(true);

      await expect(
        customerService.updateCustomer("c1", { businessId: "222" }),
      ).rejects.toThrow("already in use");
    });

    it("throws when customer not found", async () => {
      mockCustomerRepo.findById.mockResolvedValue(null);

      await expect(
        customerService.updateCustomer("bad-id", { companyName: "New" }),
      ).rejects.toThrow("Customer not found");
    });

    it("unsets businessId when updated to empty string", async () => {
      mockCustomerRepo.findById.mockResolvedValue({
        _id: "c1",
        businessId: "1234567-8",
      });
      mockCustomerRepo.update.mockResolvedValue({
        _id: "c1",
        companyName: "Test",
      });

      await customerService.updateCustomer("c1", { businessId: "" });

      expect(mockCustomerRepo.update).toHaveBeenCalledWith(
        "c1",
        expect.not.objectContaining({ businessId: expect.anything() }),
        ["businessId"],
      );
      expect(mockCustomerRepo.existsByBusinessId).not.toHaveBeenCalled();
    });

    it("unsets businessId when updated to whitespace-only", async () => {
      mockCustomerRepo.findById.mockResolvedValue({
        _id: "c1",
        businessId: "1234567-8",
      });
      mockCustomerRepo.update.mockResolvedValue({ _id: "c1" });

      await customerService.updateCustomer("c1", { businessId: "   " });

      expect(mockCustomerRepo.update).toHaveBeenCalledWith(
        "c1",
        expect.not.objectContaining({ businessId: expect.anything() }),
        ["businessId"],
      );
    });

    it("skips businessId uniqueness check when businessId not changed", async () => {
      mockCustomerRepo.findById.mockResolvedValue({
        _id: "c1",
        businessId: "1234567-8",
      });
      mockCustomerRepo.update.mockResolvedValue({
        _id: "c1",
        companyName: "Updated",
      });

      await customerService.updateCustomer("c1", {
        companyName: "Updated",
        businessId: "1234567-8",
      });

      expect(mockCustomerRepo.existsByBusinessId).not.toHaveBeenCalled();
    });

    it("allows updating customer without businessId (other fields only)", async () => {
      mockCustomerRepo.findById.mockResolvedValue({
        _id: "c1",
        companyName: "Old",
      });
      mockCustomerRepo.update.mockResolvedValue({
        _id: "c1",
        companyName: "New",
      });

      const result = await customerService.updateCustomer("c1", {
        companyName: "New",
      });

      expect(result.companyName).toBe("New");
      expect(mockCustomerRepo.existsByBusinessId).not.toHaveBeenCalled();
    });

    it("adds businessId to customer that didn't have one", async () => {
      mockCustomerRepo.findById.mockResolvedValue({
        _id: "c1",
        companyName: "Test",
        businessId: undefined,
      });
      mockCustomerRepo.existsByBusinessId.mockResolvedValue(false);
      mockCustomerRepo.update.mockResolvedValue({
        _id: "c1",
        businessId: "9876543-2",
      });

      await customerService.updateCustomer("c1", {
        businessId: "9876543-2",
      });

      expect(mockCustomerRepo.existsByBusinessId).toHaveBeenCalledWith(
        "9876543-2",
      );
      expect(mockCustomerRepo.update).toHaveBeenCalledWith(
        "c1",
        expect.objectContaining({ businessId: "9876543-2" }),
        [],
      );
    });

    it("rejects adding businessId that is already taken by another customer", async () => {
      mockCustomerRepo.findById.mockResolvedValue({
        _id: "c1",
        companyName: "Test",
        businessId: undefined,
      });
      mockCustomerRepo.existsByBusinessId.mockResolvedValue(true);

      await expect(
        customerService.updateCustomer("c1", { businessId: "3333333-8" }),
      ).rejects.toThrow("Business ID already in use");
    });

    it("clears companyLogo when explicitly set to empty string", async () => {
      mockCustomerRepo.findById.mockResolvedValue({
        _id: "c1",
        companyLogo: "https://cdn.com/old-logo.png",
      });
      mockCustomerRepo.update.mockResolvedValue({
        _id: "c1",
        companyLogo: "",
      });

      await customerService.updateCustomer("c1", { companyLogo: "" });

      expect(mockCustomerRepo.update).toHaveBeenCalledWith(
        "c1",
        expect.objectContaining({ companyLogo: "" }),
        [],
      );
    });

    it("uploads new base64 logo on update", async () => {
      mockCustomerRepo.findById.mockResolvedValue({
        _id: "c1",
        companyLogo: "https://cdn.com/old-logo.png",
      });
      mockUploadToCloudinary.mockResolvedValue("https://cdn.com/new-logo.png");
      mockCustomerRepo.update.mockResolvedValue({
        _id: "c1",
        companyLogo: "https://cdn.com/new-logo.png",
      });

      await customerService.updateCustomer("c1", {
        companyLogo: "data:image/png;base64,newdata",
      });

      expect(mockUploadToCloudinary).toHaveBeenCalledWith(
        "data:image/png;base64,newdata",
      );
      expect(mockCustomerRepo.update).toHaveBeenCalledWith(
        "c1",
        expect.objectContaining({
          companyLogo: "https://cdn.com/new-logo.png",
        }),
        [],
      );
    });

    it("does not re-upload existing cloudinary URL", async () => {
      mockCustomerRepo.findById.mockResolvedValue({
        _id: "c1",
        companyLogo: "https://cdn.com/logo.png",
      });
      mockCustomerRepo.update.mockResolvedValue({ _id: "c1" });

      await customerService.updateCustomer("c1", {
        companyLogo: "https://cdn.com/logo.png",
      });

      expect(mockUploadToCloudinary).not.toHaveBeenCalled();
    });
  });

  describe("deleteCustomer", () => {
    it("deletes when customer has no offers or orders", async () => {
      mockCustomerRepo.findById.mockResolvedValue({ _id: "c1" });
      mockOfferModel.countDocuments.mockResolvedValue(0);
      mockOrderModel.countDocuments.mockResolvedValue(0);
      mockCustomerRepo.delete.mockResolvedValue({ _id: "c1" });

      const result = await customerService.deleteCustomer("c1");
      expect(result._id).toBe("c1");
    });

    it("throws AppError 409 when customer has related offers", async () => {
      mockCustomerRepo.findById.mockResolvedValue({ _id: "c1" });
      mockOfferModel.countDocuments.mockResolvedValue(3);
      mockOrderModel.countDocuments.mockResolvedValue(0);

      await expect(customerService.deleteCustomer("c1")).rejects.toThrow(
        AppError,
      );
    });

    it("throws AppError 404 when customer not found", async () => {
      mockCustomerRepo.findById.mockResolvedValue(null);

      await expect(customerService.deleteCustomer("bad")).rejects.toThrow(
        AppError,
      );
    });
  });
});
