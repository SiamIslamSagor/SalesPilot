import { Request, Response } from "express";
import { validationResult } from "express-validator";
import OfferService from "../services/offer.service";
import MockupService from "../services/mockup.service";
import EmailService from "../services/email.service";
import offerRepository from "../repositories/offer.repository";
import Product from "../models/product.model";
import {
  canAccessOwnedEntity,
  getOwnershipFields,
  getOwnershipFilter,
} from "../utils/ownership";

/** Enrich offer items with product image URLs for email */
async function enrichItemsWithImages<
  T extends { productId: string; mockupImage?: string },
>(items: T[]) {
  const productIds = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds } })
    .select("_id images")
    .lean();
  const imageMap = new Map<string, string>();
  products.forEach((p: { _id: unknown; images?: string[] }) => {
    const url = p.images?.[0];
    if (url) imageMap.set(String(p._id), url);
  });
  return items.map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plain =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof (item as any).toObject === "function"
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (item as any).toObject()
        : item;
    return {
      ...plain,
      imageUrl: imageMap.get(String(plain.productId)) || undefined,
    };
  });
}

const ensureOfferAccess = async (req: Request, res: Response, id: string) => {
  const offer = await offerRepository.findByIdLean(id);
  if (!offer) {
    res.status(404).json({
      success: false,
      message: "Offer not found",
    });
    return null;
  }

  if (!canAccessOwnedEntity(req.user, offer)) {
    res.status(403).json({
      success: false,
      message: "You do not have permission to access this offer",
    });
    return null;
  }

  return offer;
};

/**
 * Create a new offer
 */
const createOffer = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
      return;
    }

    // Create offer using service
    const result = await OfferService.createOffer({
      ...req.body,
      ...getOwnershipFields(req.user),
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating offer:", error);
    res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create offer",
    });
  }
};

/**
 * Send offer email for a draft offer
 */
const sendOffer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const offer = await ensureOfferAccess(req, res, id);
    if (!offer) {
      return;
    }

    const result = await OfferService.sendOffer(
      (offer._id as { toString(): string }).toString(),
    );

    if (result.success && result.data) {
      try {
        const emailItems = await enrichItemsWithImages(result.data.items);
        await EmailService.sendOfferEmail({
          to: result.data.email,
          accessCode: result.data.accessCode,
          offerNumber: result.data.offerNumber,
          customerName: result.data.customerName,
          contactPerson: result.data.contactPerson,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          items: emailItems as any,
          totalAmount: result.data.totalAmount,
          validUntil: result.data.offerDetails?.validUntil,
          additionalTerms: result.data.offerDetails?.additionalTerms,
          specialCosts: result.data.offerDetails?.specialCosts,
          version: result.data.version || 1,
        });
        console.log("Offer email sent successfully");
      } catch (emailError) {
        console.error("Failed to send offer email:", emailError);
        res.status(200).json({
          ...result,
          warning:
            "Offer status updated but email could not be sent. Please try resending.",
        });
        return;
      }
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error sending offer:", error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to send offer",
    });
  }
};

/**
 * Get offer by ID
 */
const getOfferById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const offer = await ensureOfferAccess(req, res, id);
    if (!offer) {
      return;
    }
    // Pass the already-fetched lean offer to avoid a second DB round-trip
    const result = await OfferService.getOfferById(
      (offer._id as { toString(): string }).toString(),
      offer,
    );
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching offer:", error);
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch offer",
    });
  }
};

/**
 * Get offers by customer ID
 */
const getOffersByCustomerId = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { customerId } = req.params;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 10;

    const result = await OfferService.getOffersByCustomerId(
      customerId,
      page,
      limit,
      getOwnershipFilter(req.user),
    );
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching offers:", error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch offers",
    });
  }
};

/**
 * Get all offers
 */
const getAllOffers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 10;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await OfferService.getAllOffers(
      page,
      limit,
      status,
      search,
      getOwnershipFilter(req.user),
    );
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching offers:", error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch offers",
    });
  }
};

/**
 * Update offer status
 */
const updateOfferStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const offer = await ensureOfferAccess(req, res, id);
    if (!offer) {
      return;
    }

    if (
      !status ||
      ![
        "draft",
        "sent",
        "accepted",
        "rejected",
        "expired",
        "completed",
      ].includes(status)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
      return;
    }

    const result = await OfferService.updateOfferStatus(
      (offer._id as { toString(): string }).toString(),
      status as
        | "draft"
        | "sent"
        | "accepted"
        | "rejected"
        | "expired"
        | "completed",
    );
    res.status(200).json(result);
  } catch (error) {
    console.error("Error updating offer status:", error);
    res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update offer status",
    });
  }
};

/**
 * Update customer response to offer
 */
const updateCustomerResponse = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { customerResponse, customerComment } = req.body;
    const offer = await ensureOfferAccess(req, res, id);
    if (!offer) {
      return;
    }

    if (
      !customerResponse ||
      !["accepted", "rejected"].includes(customerResponse)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid customer response value",
      });
      return;
    }

    const result = await OfferService.updateCustomerResponse(
      (offer._id as { toString(): string }).toString(),
      customerResponse as "accepted" | "rejected",
      customerComment,
    );
    res.status(200).json(result);
  } catch (error) {
    console.error("Error updating customer response:", error);
    res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update customer response",
    });
  }
};

/**
 * Delete offer
 */
const deleteOffer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const offer = await ensureOfferAccess(req, res, id);
    if (!offer) {
      return;
    }
    const result = await OfferService.deleteOffer(
      (offer._id as { toString(): string }).toString(),
    );
    res.status(200).json(result);
  } catch (error) {
    console.error("Error deleting offer:", error);
    res.status(404).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete offer",
    });
  }
};

/**
 * Resend offer (for rejected offers)
 */
const resendOffer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const offer = await ensureOfferAccess(req, res, id);
    if (!offer) {
      return;
    }

    // Resend the offer (increment version, reset status)
    const result = await OfferService.resendOffer(
      (offer._id as { toString(): string }).toString(),
    );

    // Send email with updated offer data (including new version)
    if (result.success && result.data) {
      try {
        const emailItems = await enrichItemsWithImages(result.data.items);
        await EmailService.sendOfferEmail({
          to: result.data.email,
          accessCode: result.data.accessCode,
          offerNumber: result.data.offerNumber,
          customerName: result.data.customerName,
          contactPerson: result.data.contactPerson,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          items: emailItems as any,
          totalAmount: result.data.totalAmount,
          validUntil: result.data.offerDetails?.validUntil,
          additionalTerms: result.data.offerDetails?.additionalTerms,
          specialCosts: result.data.offerDetails?.specialCosts,
          version: result.data.version,
        });
        console.log("Offer email resent successfully");
      } catch (emailError) {
        console.error("Failed to resend offer email:", emailError);
        res.status(200).json({
          ...result,
          warning:
            "Offer status updated but email could not be sent. Please try resending.",
        });
        return;
      }
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error resending offer:", error);
    res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to resend offer",
    });
  }
};

/**
 * Update offer (for admin to modify offer details before resending)
 */
const updateOffer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const offer = await ensureOfferAccess(req, res, id);
    if (!offer) {
      return;
    }

    // Update offer using service
    const result = await OfferService.updateOffer(
      (offer._id as { toString(): string }).toString(),
      req.body,
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Error updating offer:", error);
    res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update offer",
    });
  }
};

/**
 * Duplicate offer
 */
const duplicateOffer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const offer = await ensureOfferAccess(req, res, id);
    if (!offer) {
      return;
    }

    const result = await OfferService.duplicateOffer(
      (offer._id as { toString(): string }).toString(),
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Error duplicating offer:", error);
    res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to duplicate offer",
    });
  }
};

/**
 * Get offer by access code (public endpoint for customers)
 */
const getOfferByAccessCode = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { accessCode } = req.params;
    const result = await OfferService.getOfferByAccessCode(accessCode);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching offer by access code:", error);
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Offer not found",
    });
  }
};

/**
 * Update customer response by access code (public endpoint for customers)
 */
const updateCustomerResponseByAccessCode = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { accessCode } = req.params;
    const { customerResponse, customerComment } = req.body;

    if (
      !customerResponse ||
      !["accepted", "rejected"].includes(customerResponse)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid customer response value",
      });
      return;
    }

    const result = await OfferService.updateCustomerResponseByAccessCode(
      accessCode,
      customerResponse as "accepted" | "rejected",
      customerComment,
    );
    res.status(200).json(result);
  } catch (error) {
    console.error("Error updating customer response:", error);
    res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update customer response",
    });
  }
};

/**
 * Generate a mockup image using product image and logo
 */
const generateMockup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productImageUrl, logoImage } = req.body;

    if (!productImageUrl || typeof productImageUrl !== "string") {
      res.status(400).json({
        success: false,
        message: "productImageUrl is required and must be a string",
      });
      return;
    }

    if (!logoImage || typeof logoImage !== "string") {
      res.status(400).json({
        success: false,
        message:
          "logoImage is required and must be a string (base64 or data URI)",
      });
      return;
    }

    const result = await MockupService.generateMockup({
      productImageUrl,
      logoImage,
    });

    if (!result.success) {
      res.status(422).json({
        success: false,
        message: result.message || "Failed to generate mockup",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Mockup generated successfully",
      data: {
        mockupImageUrl: result.mockupImageUrl,
      },
    });
  } catch (error) {
    console.error("Error generating mockup:", error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to generate mockup",
    });
  }
};

/**
 * Generate mockup images for multiple products in a single request.
 * Logo is shared and parsed once for all items.
 */
const generateMockupBatch = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { logoImage, items } = req.body;

    if (!logoImage || typeof logoImage !== "string") {
      res.status(400).json({
        success: false,
        message:
          "logoImage is required and must be a string (base64 or data URI)",
      });
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        message: "items must be a non-empty array",
      });
      return;
    }

    if (items.length > 20) {
      res.status(400).json({
        success: false,
        message: "Maximum 20 items per batch request",
      });
      return;
    }

    for (const item of items) {
      if (!item.productImageUrl || typeof item.productImageUrl !== "string") {
        res.status(400).json({
          success: false,
          message: "Each item must have a productImageUrl string",
        });
        return;
      }
    }

    const result = await MockupService.generateMockupBatch({
      logoImage,
      items,
    });

    res.status(200).json({
      success: true,
      message: "Batch mockup generation completed",
      data: result.results,
    });
  } catch (error) {
    console.error("Error generating mockup batch:", error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate mockup batch",
    });
  }
};

const offerController = {
  createOffer,
  getOfferById,
  getOffersByCustomerId,
  getAllOffers,
  updateOfferStatus,
  updateCustomerResponse,
  deleteOffer,
  resendOffer,
  duplicateOffer,
  sendOffer,
  updateOffer,
  getOfferByAccessCode,
  updateCustomerResponseByAccessCode,
  generateMockup,
  generateMockupBatch,
};

export default offerController;
