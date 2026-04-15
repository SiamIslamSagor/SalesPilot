import { Router } from "express";
import rateLimit from "express-rate-limit";
import offerController from "../controllers/offer.controller";
import { createOfferValidation } from "../validators/offer.validator";
import { authenticate } from "../middlewares/auth.middleware";
import { requireManager } from "../middlewares/authorization.middleware";

const router = Router();

// View limiter: generous — admin previews + customer refreshes are normal
const publicOfferViewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
});

// Response limiter: tight — a customer only needs to accept/reject once
const publicOfferResponseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
});

/**
 * @route   GET /api/offers/public/:accessCode
 * @desc    Get offer by access code (public customer endpoint)
 * @access  Public
 */
router.get(
  "/public/:accessCode",
  publicOfferViewLimiter,
  offerController.getOfferByAccessCode,
);

/**
 * @route   PATCH /api/offers/public/:accessCode/response
 * @desc    Update customer response by access code (public customer endpoint)
 * @access  Public
 */
router.patch(
  "/public/:accessCode/response",
  publicOfferResponseLimiter,
  offerController.updateCustomerResponseByAccessCode,
);

// --- All routes below require authentication ---
router.use(authenticate);

/**
 * @route   POST /api/offers
 * @desc    Create a new offer
 * @access  Private (manager)
 */
router.post(
  "/",
  requireManager,
  createOfferValidation,
  offerController.createOffer,
);

/**
 * @route   POST /api/offers/generate-mockup
 * @desc    Generate a mockup image using product image and logo
 * @access  Private (manager)
 */
router.post("/generate-mockup", requireManager, offerController.generateMockup);

/**
 * @route   POST /api/offers/generate-mockup-batch
 * @desc    Generate mockup images for multiple products (logo parsed once)
 * @access  Private (manager)
 */
router.post(
  "/generate-mockup-batch",
  requireManager,
  offerController.generateMockupBatch,
);

/**
 * @route   GET /api/offers/:id
 * @desc    Get offer by ID
 * @access  Private
 */
router.get("/:id", offerController.getOfferById);

/**
 * @route   GET /api/offers/customer/:customerId
 * @desc    Get offers by customer ID
 * @access  Public (or add authentication middleware as needed)
 */
router.get(
  "/customer/:customerId",
  requireManager,
  offerController.getOffersByCustomerId,
);

/**
 * @route   GET /api/offers
 * @desc    Get all offers
 * @access  Public (or add authentication middleware as needed)
 */
router.get("/", offerController.getAllOffers);

/**
 * @route   PATCH /api/offers/:id/status
 * @desc    Update offer status
 * @access  Public (or add authentication middleware as needed)
 */
router.patch("/:id/status", requireManager, offerController.updateOfferStatus);

/**
 * @route   PATCH /api/offers/:id/response
 * @desc    Update customer response to offer
 * @access  Public (or add authentication middleware as needed)
 */
router.patch(
  "/:id/response",
  requireManager,
  offerController.updateCustomerResponse,
);

/**
 * @route   DELETE /api/offers/:id
 * @desc    Delete offer
 * @access  Public (or add authentication middleware as needed)
 */
router.delete("/:id", requireManager, offerController.deleteOffer);

/**
 * @route   POST /api/offers/:id/resend
 * @desc    Resend offer (for rejected offers)
 * @access  Public (or add authentication middleware as needed)
 */
router.post("/:id/resend", requireManager, offerController.resendOffer);

/**
 * @route   POST /api/offers/:id/send
 * @desc    Send a draft offer
 * @access  Public (or add authentication middleware as needed)
 */
router.post("/:id/send", requireManager, offerController.sendOffer);

/**
 * @route   PUT /api/offers/:id
 * @desc    Update offer details (for admin to modify before resending)
 * @access  Public (or add authentication middleware as needed)
 */
router.put("/:id", requireManager, offerController.updateOffer);

/**
 * @route   POST /api/offers/:id/duplicate
 * @desc    Duplicate offer
 * @access  Public (or add authentication middleware as needed)
 */
router.post("/:id/duplicate", requireManager, offerController.duplicateOffer);

export default router;
