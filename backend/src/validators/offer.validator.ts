import { body, ValidationChain } from "express-validator";

export const createOfferValidation: ValidationChain[] = [
  // Customer information
  body("customerId").trim().notEmpty().withMessage("Customer ID is required"),

  body("customerName")
    .trim()
    .notEmpty()
    .withMessage("Customer name is required")
    .isLength({ min: 2, max: 200 })
    .withMessage("Customer name must be between 2 and 200 characters"),

  body("contactPerson")
    .trim()
    .notEmpty()
    .withMessage("Contact person is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Contact person must be between 2 and 100 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail()
    .toLowerCase(),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^\+?\d[\d\s-]{8,}$/)
    .withMessage("Please provide a valid phone number"),

  body("address")
    .trim()
    .notEmpty()
    .withMessage("Address is required")
    .isLength({ max: 500 })
    .withMessage("Address cannot exceed 500 characters"),

  // Items array validation
  body("items")
    .isArray({ min: 1, max: 200 })
    .withMessage("Must have between 1 and 200 items"),

  body("items.*.productId")
    .trim()
    .notEmpty()
    .withMessage("Product ID is required"),

  body("items.*.productNumber")
    .trim()
    .notEmpty()
    .withMessage("Product number is required"),

  body("items.*.productName")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ max: 200 })
    .withMessage("Product name cannot exceed 200 characters"),

  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),

  body("items.*.unitPrice")
    .isFloat({ min: 0 })
    .withMessage("Unit price must be a non-negative number"),

  body("items.*.discount")
    .isFloat({ min: 0, max: 100 })
    .withMessage("Discount must be between 0 and 100"),

  body("items.*.markingCost")
    .isFloat({ min: 0 })
    .withMessage("Marking cost must be a non-negative number"),

  body("items.*.internalMarkingCost")
    .isFloat()
    .withMessage("Internal marking cost must be a number"),

  body("items.*.showUnitPrice")
    .isBoolean()
    .withMessage("Show unit price must be a boolean"),

  body("items.*.showTotalPrice")
    .isBoolean()
    .withMessage("Show total price must be a boolean"),

  body("items.*.hideMarkingCost")
    .isBoolean()
    .withMessage("Hide marking cost must be a boolean"),

  body("items.*.generateMockup")
    .isBoolean()
    .withMessage("Generate mockup must be a boolean"),

  // Offer details validation
  body("offerDetails.validUntil")
    .optional()
    .trim()
    .isISO8601()
    .withMessage("Valid until must be a valid date"),

  body("offerDetails.validDays")
    .optional()
    .trim()
    .isInt({ min: 1 })
    .withMessage("Valid days must be a positive integer"),

  body("offerDetails.showTotalPrice")
    .isBoolean()
    .withMessage("Show total price must be a boolean"),

  body("offerDetails.additionalTermsEnabled")
    .isBoolean()
    .withMessage("Additional terms enabled must be a boolean"),

  body("offerDetails.additionalTerms")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Additional terms cannot exceed 2000 characters"),

  body("offerDetails.specialCosts")
    .optional()
    .isArray()
    .withMessage("Special costs must be an array"),

  body("offerDetails.specialCosts.*.name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Special cost name is required")
    .isLength({ max: 200 })
    .withMessage("Special cost name cannot exceed 200 characters"),

  body("offerDetails.specialCosts.*.amount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Special cost amount must be a non-negative number"),

  // Totals validation
  body("totalAmount")
    .isFloat({ min: 0 })
    .withMessage("Total amount must be a non-negative number"),

  body("itemCount")
    .isInt({ min: 1 })
    .withMessage("Item count must be at least 1"),
];
