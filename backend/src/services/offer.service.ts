import offerRepository from "../repositories/offer.repository";
import {
  CreateOfferRequest,
  OfferItem,
  OfferResponse,
} from "../types/offer.types";
import { IOfferDocument } from "../models/offer.model";
import Product from "../models/product.model";
import Order from "../models/order.model";
import emailService from "./email.service";

// Extend IOfferDocument to include Mongoose properties
interface IOfferDocumentWithTimestamps extends IOfferDocument {
  _id: {
    toString(): string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/** Plain JS object shape returned by .lean() or .toObject() */
interface OfferPlainObject {
  _id: string | { toString(): string };
  offerNumber: string;
  accessCode: string;
  ownerUserId?: string;
  ownerUserName?: string;
  ownerUserEmail?: string;
  customerId: string;
  customerName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  items: (OfferItem & { imageUrl?: string | null })[];
  offerDetails: IOfferDocument["offerDetails"];
  totalAmount: number;
  itemCount: number;
  status: IOfferDocument["status"];
  customerResponse?: IOfferDocument["customerResponse"];
  customerComments?: IOfferDocument["customerComments"];
  version: number;
  respondedAt?: Date;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

class OfferService {
  private getOfferExpiryDate(offer: IOfferDocument): Date | null {
    const validUntil = offer.offerDetails?.validUntil;

    if (!validUntil) {
      return null;
    }

    const parsedDate = new Date(validUntil);
    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate;
  }

  private isOfferExpired(offer: IOfferDocument): boolean {
    if (
      offer.status === "accepted" ||
      offer.status === "rejected" ||
      offer.status === "completed" ||
      offer.status === "expired"
    ) {
      return false;
    }

    const expiryDate = this.getOfferExpiryDate(offer);
    if (!expiryDate) {
      return false;
    }

    const endOfExpiryDate = new Date(expiryDate);
    endOfExpiryDate.setHours(23, 59, 59, 999);

    return endOfExpiryDate.getTime() < Date.now();
  }

  private async expireOfferIfNeeded(
    offer: IOfferDocument,
  ): Promise<IOfferDocument> {
    if (!this.isOfferExpired(offer)) {
      return offer;
    }

    const expiredOffer = await offerRepository.updateStatus(
      (offer as unknown as IOfferDocumentWithTimestamps)._id.toString(),
      "expired",
    );

    return expiredOffer || offer;
  }

  /**
   * Bulk-expire offers that have passed their validUntil date.
   * Uses a single updateMany instead of N individual updates.
   */
  private async expireOffersIfNeeded(
    offers: IOfferDocument[],
  ): Promise<IOfferDocument[]> {
    const expiredIds: string[] = [];
    for (const offer of offers) {
      if (this.isOfferExpired(offer)) {
        expiredIds.push(
          (offer as unknown as IOfferDocumentWithTimestamps)._id.toString(),
        );
      }
    }

    if (expiredIds.length > 0) {
      await offerRepository.bulkExpireByIds(expiredIds);
      // Patch the in-memory objects so we don't need to re-fetch
      return offers.map((o) => {
        const id = (
          o as unknown as IOfferDocumentWithTimestamps
        )._id.toString();
        if (expiredIds.includes(id)) {
          // For lean objects, mutate directly; for documents, use set
          if ("set" in o && typeof o.set === "function") {
            o.set("status", "expired");
          } else {
            (o as unknown as { status: string }).status = "expired";
          }
        }
        return o;
      });
    }

    return offers;
  }

  private calculateSpecialCostsTotal(
    specialCosts: CreateOfferRequest["offerDetails"]["specialCosts"] = [],
  ): number {
    return (specialCosts || []).reduce(
      (sum, cost) => sum + (Number(cost.amount) || 0),
      0,
    );
  }

  private calculateOfferTotal(offerData: {
    items: CreateOfferRequest["items"];
    offerDetails?: CreateOfferRequest["offerDetails"];
  }): number {
    const itemsTotal = offerData.items.reduce((sum, item) => {
      const discounted = item.unitPrice * (1 - item.discount / 100);
      return (
        sum +
        Math.round((discounted + item.markingCost) * item.quantity * 100) / 100
      );
    }, 0);

    return (
      Math.round(
        (itemsTotal +
          this.calculateSpecialCostsTotal(
            offerData.offerDetails?.specialCosts,
          )) *
          100,
      ) / 100
    );
  }

  async createOffer(offerData: CreateOfferRequest): Promise<OfferResponse> {
    // Validate that at least one item is present
    if (!offerData.items || offerData.items.length === 0) {
      throw new Error("At least one item is required");
    }

    // Validate that customer ID is provided
    if (!offerData.customerId) {
      throw new Error("Customer ID is required");
    }

    // Validate total amount matches calculated amount
    const calculatedTotal = this.calculateOfferTotal(offerData);

    // Allow small floating point differences
    if (Math.abs(calculatedTotal - offerData.totalAmount) > 0.01) {
      console.warn(
        `Total amount mismatch. Calculated: ${calculatedTotal.toFixed(2)}, Provided: ${offerData.totalAmount.toFixed(2)}`,
      );
    }

    // Create offer in database
    const offer = await offerRepository.create({
      ...offerData,
      totalAmount: calculatedTotal,
      itemCount: offerData.items.length,
    });

    return {
      success: true,
      message: "Offer created successfully",
      data: offer.toObject(), // return full offer data
    };
  }

  async getOfferById(
    id: string,
    prefetchedOffer?: IOfferDocument | null,
  ): Promise<OfferResponse> {
    // Re-use the lean offer already loaded by the controller when available
    const offer = prefetchedOffer ?? (await offerRepository.findByIdLean(id));
    if (!offer) {
      throw new Error("Offer not found");
    }

    // For lean objects, check expiry and do a single status update if needed
    const offerObj: OfferPlainObject =
      "toObject" in offer && typeof offer.toObject === "function"
        ? (offer.toObject() as unknown as OfferPlainObject)
        : { ...(offer as unknown as OfferPlainObject) };

    if (this.isOfferExpired(offer)) {
      await offerRepository.updateStatus(String(offerObj._id), "expired");
      offerObj.status = "expired";
    }

    // Fetch product details to include image URLs
    const productIds: string[] = offerObj.items.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } })
      .select("_id images")
      .lean();

    // Create a map for quick lookup
    const productMap = new Map<string, string>();
    products.forEach((product: { _id: unknown; images?: string[] }) => {
      const imageUrl = product.images?.[0] || null;
      if (imageUrl) {
        productMap.set(String(product._id), imageUrl);
      }
    });

    // Add imageUrl to each item
    offerObj.items = offerObj.items.map((item) => ({
      ...item,
      imageUrl: productMap.get(String(item.productId)) || null,
    }));

    return {
      success: true,
      message: "Offer retrieved successfully",
      data: offerObj,
    };
  }

  async getOffersByCustomerId(
    customerId: string,
    page: number = 1,
    limit: number = 10,
    baseFilter: Record<string, unknown> = {},
  ) {
    const result = await offerRepository.findByCustomerId(
      customerId,
      page,
      limit,
      baseFilter,
    );
    const offers = await this.expireOffersIfNeeded(result.offers);
    return {
      success: true,
      message: "Offers retrieved successfully",
      data: offers,
      pagination: {
        total: result.total,
        page: result.page,
        pages: result.pages,
        limit,
      },
    };
  }

  async getAllOffers(
    page: number = 1,
    limit: number = 10,
    status?: string,
    search?: string,
    baseFilter: Record<string, unknown> = {},
  ) {
    const result = await offerRepository.findAll(
      page,
      limit,
      status,
      search,
      baseFilter,
    );
    const offers = await this.expireOffersIfNeeded(result.offers);
    return {
      success: true,
      message: "Offers retrieved successfully",
      data: offers,
      pagination: {
        total: result.total,
        page: result.page,
        pages: result.pages,
        limit,
      },
    };
  }

  async getOfferByAccessCode(accessCode: string): Promise<OfferResponse> {
    const offer = await offerRepository.findByAccessCode(accessCode);
    if (!offer) {
      throw new Error("Offer not found");
    }

    const currentOffer = await this.expireOfferIfNeeded(offer);

    const offerObj: OfferPlainObject = (
      currentOffer as unknown as { toObject(): OfferPlainObject }
    ).toObject();

    // Fetch product images
    const productIds = offerObj.items.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } })
      .select("_id images")
      .lean();

    const productMap = new Map<string, string>();
    products.forEach((product: { _id: unknown; images?: string[] }) => {
      const imageUrl = product.images?.[0] || null;
      if (imageUrl) {
        productMap.set(String(product._id), imageUrl);
      }
    });

    offerObj.items = offerObj.items.map((item) => ({
      ...item,
      imageUrl: productMap.get(String(item.productId)) || null,
    }));

    return {
      success: true,
      message: "Offer retrieved successfully",
      data: offerObj,
    };
  }

  async updateCustomerResponseByAccessCode(
    accessCode: string,
    customerResponse: "accepted" | "rejected",
    customerComment?: string,
  ): Promise<OfferResponse> {
    const offer = await offerRepository.findByAccessCode(accessCode);
    if (!offer) {
      throw new Error("Offer not found");
    }

    const existingComments = offer.customerComments || [];
    const newComments = [
      ...existingComments,
      {
        comment: customerComment || "",
        timestamp: new Date(),
      },
    ];

    const updateData: Partial<IOfferDocument> = {
      customerResponse,
      status: customerResponse,
      respondedAt: new Date(),
      customerComments: newComments,
    };

    const updatedOffer = await offerRepository.update(
      (offer as unknown as IOfferDocumentWithTimestamps)._id.toString(),
      updateData,
    );
    if (!updatedOffer) {
      throw new Error("Offer not found");
    }

    const offerWithTimestamps =
      updatedOffer as unknown as IOfferDocumentWithTimestamps;

    // Send notification emails (fire-and-forget — don't block the response)
    // Admin email is resolved in the email service from template recipientEmail,
    // falling back to ADMIN_EMAIL env var
    console.log(
      `[updateCustomerResponseByAccessCode] Triggering admin email for offer ${updatedOffer.offerNumber}, response: ${customerResponse}`,
    );
    emailService
      .sendOfferResponseAdminEmail({
        fallbackEmail: process.env.ADMIN_EMAIL || "",
        offerNumber: updatedOffer.offerNumber,
        customerName: updatedOffer.customerName,
        contactPerson: updatedOffer.contactPerson,
        customerComment: customerComment || "",
        customerResponse,
      })
      .then((result) => {
        if (!result.success) {
          console.error(
            `[updateCustomerResponseByAccessCode] Admin email FAILED: ${result.message}`,
          );
        } else {
          console.log(
            `[updateCustomerResponseByAccessCode] Admin email sent successfully`,
          );
        }
      })
      .catch((err) => {
        console.error(
          "[updateCustomerResponseByAccessCode] Admin email EXCEPTION:",
          err,
        );
      });

    if (offer.email) {
      emailService
        .sendOfferResponseCustomerEmail({
          customerEmail: offer.email,
          offerNumber: updatedOffer.offerNumber,
          customerName: updatedOffer.customerName,
          contactPerson: updatedOffer.contactPerson,
          customerResponse,
        })
        .catch((err) => {
          console.error("Failed to send customer follow-up email:", err);
        });
    }

    return {
      success: true,
      message: `Offer ${customerResponse} successfully`,
      data: {
        offerId: offerWithTimestamps._id.toString(),
        offerNumber: updatedOffer.offerNumber,
        customerResponse: updatedOffer.customerResponse,
        customerComments: updatedOffer.customerComments,
        respondedAt: updatedOffer.respondedAt?.toISOString(),
        createdAt:
          offerWithTimestamps.createdAt?.toISOString() ||
          new Date().toISOString(),
      },
    };
  }

  /**
   * Valid one-way offer status transitions – no going back.
   *   draft    → sent
   *   sent     → accepted, rejected, expired
   *   accepted → completed
   *   rejected → (terminal)
   *   expired  → (terminal)
   *   completed→ (terminal)
   */
  private static ALLOWED_TRANSITIONS: Record<string, string[]> = {
    draft: ["sent"],
    sent: ["accepted", "rejected", "expired"],
    accepted: ["completed"],
    rejected: [],
    expired: [],
    completed: [],
  };

  async updateOfferStatus(
    id: string,
    status:
      | "draft"
      | "sent"
      | "accepted"
      | "rejected"
      | "expired"
      | "completed",
  ): Promise<OfferResponse> {
    // Fetch current offer to validate transition
    const currentOffer = await offerRepository.findById(id);
    if (!currentOffer) {
      throw new Error("Offer not found");
    }

    const currentStatus = currentOffer.status;
    const allowed = OfferService.ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(status)) {
      throw new Error(
        `Cannot transition offer from "${currentStatus}" to "${status}"`,
      );
    }

    // accepted → completed requires a sales order to exist
    if (currentStatus === "accepted" && status === "completed") {
      const orderExists = await Order.exists({ offerId: id });
      if (!orderExists) {
        throw new Error(
          "Cannot complete offer without a sales order. Please create a sales order first.",
        );
      }
    }

    const offer = await offerRepository.updateStatus(id, status);
    if (!offer) {
      throw new Error("Offer not found");
    }

    const offerWithTimestamps =
      offer as unknown as IOfferDocumentWithTimestamps;
    return {
      success: true,
      message: `Offer status updated to ${status}`,
      data: {
        offerId: offerWithTimestamps._id.toString(),
        offerNumber: offer.offerNumber,
        createdAt:
          offerWithTimestamps.createdAt?.toISOString() ||
          new Date().toISOString(),
      },
    };
  }

  async updateCustomerResponse(
    id: string,
    customerResponse: "pending" | "accepted" | "rejected",
    customerComment?: string,
  ): Promise<OfferResponse> {
    const offer = await offerRepository.findById(id);
    if (!offer) {
      throw new Error("Offer not found");
    }

    // Always add a new comment to the customerComments array
    const existingComments = offer.customerComments || [];
    const newComments = [
      ...existingComments,
      {
        comment: customerComment || "",
        timestamp: new Date(),
      },
    ];

    const updateData: Partial<IOfferDocument> = {
      customerResponse,
      respondedAt: new Date(),
      customerComments: newComments,
    };

    const updatedOffer = await offerRepository.update(id, updateData);
    if (!updatedOffer) {
      throw new Error("Offer not found");
    }

    const offerWithTimestamps =
      updatedOffer as unknown as IOfferDocumentWithTimestamps;
    return {
      success: true,
      message: `Offer ${customerResponse} successfully`,
      data: {
        offerId: offerWithTimestamps._id.toString(),
        offerNumber: updatedOffer.offerNumber,
        customerResponse: updatedOffer.customerResponse,
        customerComments: updatedOffer.customerComments,
        respondedAt: updatedOffer.respondedAt?.toISOString(),
        createdAt:
          offerWithTimestamps.createdAt?.toISOString() ||
          new Date().toISOString(),
      },
    };
  }

  async deleteOffer(id: string): Promise<OfferResponse> {
    const offer = await offerRepository.delete(id);
    if (!offer) {
      throw new Error("Offer not found");
    }

    const offerWithTimestamps =
      offer as unknown as IOfferDocumentWithTimestamps;
    return {
      success: true,
      message: "Offer deleted successfully",
      data: {
        offerId: offerWithTimestamps._id.toString(),
        offerNumber: offer.offerNumber,
        createdAt:
          offerWithTimestamps.createdAt?.toISOString() ||
          new Date().toISOString(),
      },
    };
  }

  async resendOffer(id: string): Promise<OfferResponse> {
    const offer = await offerRepository.findById(id);
    if (!offer) {
      throw new Error("Offer not found");
    }

    // Allow resending if offer is rejected or has been previously responded to
    if (
      offer.customerResponse !== "rejected" &&
      offer.customerResponse !== "accepted"
    ) {
      throw new Error("Only offers with a customer response can be resent");
    }

    // Increment version, reset status, and set customer response to pending
    const updateData: Partial<IOfferDocument> = {
      version: offer.version + 1,
      status: "sent",
      customerResponse: "pending",
      respondedAt: undefined,
    };

    const updatedOffer = await offerRepository.update(id, updateData);
    if (!updatedOffer) {
      throw new Error("Failed to update offer");
    }

    const offerWithTimestamps =
      updatedOffer as unknown as IOfferDocumentWithTimestamps;

    return {
      success: true,
      message: "Offer resent successfully",
      data: {
        _id: offerWithTimestamps._id.toString(),
        offerId: offerWithTimestamps._id.toString(),
        accessCode: updatedOffer.accessCode,
        offerNumber: updatedOffer.offerNumber,
        version: updatedOffer.version,
        status: updatedOffer.status,
        customerResponse: updatedOffer.customerResponse,
        customerComments: updatedOffer.customerComments,
        email: updatedOffer.email,
        customerName: updatedOffer.customerName,
        contactPerson: updatedOffer.contactPerson,
        items: updatedOffer.items,
        totalAmount: updatedOffer.totalAmount,
        offerDetails: updatedOffer.offerDetails,
        createdAt:
          offerWithTimestamps.createdAt?.toISOString() ||
          new Date().toISOString(),
      },
    };
  }

  async sendOffer(id: string): Promise<OfferResponse> {
    const offer = await offerRepository.findById(id);
    if (!offer) {
      throw new Error("Offer not found");
    }

    if (offer.status !== "draft") {
      throw new Error("Only draft offers can be sent");
    }

    const updatedOffer = await offerRepository.update(id, {
      status: "sent",
    });
    if (!updatedOffer) {
      throw new Error("Failed to update offer");
    }

    const offerWithTimestamps =
      updatedOffer as unknown as IOfferDocumentWithTimestamps;

    return {
      success: true,
      message: "Offer sent successfully",
      data: {
        _id: offerWithTimestamps._id.toString(),
        offerId: offerWithTimestamps._id.toString(),
        accessCode: updatedOffer.accessCode,
        offerNumber: updatedOffer.offerNumber,
        version: updatedOffer.version,
        status: updatedOffer.status,
        customerResponse: updatedOffer.customerResponse,
        customerComments: updatedOffer.customerComments,
        email: updatedOffer.email,
        customerName: updatedOffer.customerName,
        contactPerson: updatedOffer.contactPerson,
        items: updatedOffer.items,
        totalAmount: updatedOffer.totalAmount,
        offerDetails: updatedOffer.offerDetails,
        createdAt:
          offerWithTimestamps.createdAt?.toISOString() ||
          new Date().toISOString(),
      },
    };
  }

  async updateOffer(
    id: string,
    offerData: Partial<IOfferDocument>,
  ): Promise<OfferResponse> {
    const offer = await offerRepository.findById(id);
    if (!offer) {
      throw new Error("Offer not found");
    }

    // Recalculate total amount based on items
    const nextItems = offerData.items || offer.items;
    const nextOfferDetails = {
      ...(offer.offerDetails || {}),
      ...offerData.offerDetails,
    };
    const calculatedTotal = this.calculateOfferTotal({
      items: nextItems,
      offerDetails: nextOfferDetails,
    });

    const updateDataWithTotal = {
      ...offerData,
      totalAmount: calculatedTotal,
      itemCount: nextItems.length,
    };

    const updatedOffer = await offerRepository.update(id, updateDataWithTotal);
    if (!updatedOffer) {
      throw new Error("Failed to update offer");
    }

    const offerWithTimestamps =
      updatedOffer as unknown as IOfferDocumentWithTimestamps;

    return {
      success: true,
      message: "Offer updated successfully",
      data: {
        _id: offerWithTimestamps._id.toString(),
        offerId: offerWithTimestamps._id.toString(),
        offerNumber: updatedOffer.offerNumber,
        version: updatedOffer.version,
        status: updatedOffer.status,
        customerComments: updatedOffer.customerComments,
        email: updatedOffer.email,
        customerName: updatedOffer.customerName,
        contactPerson: updatedOffer.contactPerson,
        items: updatedOffer.items,
        totalAmount: updatedOffer.totalAmount,
        offerDetails: updatedOffer.offerDetails,
        createdAt:
          offerWithTimestamps.createdAt?.toISOString() ||
          new Date().toISOString(),
      },
    };
  }

  async duplicateOffer(offerId: string): Promise<OfferResponse> {
    // Fetch source offer
    const sourceOffer = await offerRepository.findById(offerId);
    if (!sourceOffer) {
      throw new Error("Offer not found");
    }

    // Create new offer with copied data (offer number will be generated by repository in O-XXX format)
    // Note: accessCode is intentionally NOT copied — the pre-save hook generates a new unique one
    const newOfferData: Partial<IOfferDocument> = {
      ownerUserId: sourceOffer.ownerUserId,
      ownerUserName: sourceOffer.ownerUserName,
      ownerUserEmail: sourceOffer.ownerUserEmail,
      customerId: sourceOffer.customerId,
      customerName: sourceOffer.customerName,
      contactPerson: sourceOffer.contactPerson,
      email: sourceOffer.email,
      phone: sourceOffer.phone,
      address: sourceOffer.address,
      items: sourceOffer.items.map((item) => ({
        productId: item.productId,
        productNumber: item.productNumber,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        markingCost: item.markingCost,
        internalMarkingCost: item.internalMarkingCost,
        showUnitPrice: item.showUnitPrice,
        showTotalPrice: item.showTotalPrice,
        hideMarkingCost: item.hideMarkingCost,
        generateMockup: item.generateMockup,
        mockupImage: item.mockupImage,
      })),
      offerDetails: sourceOffer.offerDetails,
      totalAmount: sourceOffer.totalAmount,
      itemCount: sourceOffer.itemCount,
      status: "draft",
      customerResponse: "pending",
      customerComments: [],
      version: 1,
      respondedAt: undefined,
    };

    // Create duplicated offer using repository method (generates O-XXX format)
    const duplicatedOffer = await offerRepository.createDuplicate(newOfferData);

    // Return duplicated offer data
    const offerWithTimestamps =
      duplicatedOffer as unknown as IOfferDocumentWithTimestamps;

    return {
      success: true,
      message: "Offer duplicated successfully",
      data: offerWithTimestamps,
    };
  }
}

export default new OfferService();
