import { body, ValidationChain } from "express-validator";
import { FinnishBusinessIds } from "finnish-business-ids";

export const createCustomerValidation: ValidationChain[] = [
  body("companyName")
    .trim()
    .notEmpty()
    .withMessage("Company name is required")
    .isLength({ min: 2, max: 200 })
    .withMessage("Company name must be between 2 and 200 characters"),

  body("businessId")
    .optional({ values: "falsy" })
    .trim()
    .custom((value: string) => {
      if (!FinnishBusinessIds.isValidBusinessId(value)) {
        throw new Error(
          "Invalid Finnish Business ID (Y-tunnus). Format: XXXXXXX-X",
        );
      }
      return true;
    }),

  body("contactPerson")
    .trim()
    .notEmpty()
    .withMessage("Contact person is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Contact person must be between 2 and 100 characters"),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^\+?\d[\d\s-]{8,}$/)
    .withMessage("Please provide a valid phone number"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail()
    .toLowerCase(),

  body("address")
    .trim()
    .notEmpty()
    .withMessage("Address is required")
    .isLength({ max: 500 })
    .withMessage("Address cannot exceed 500 characters"),

  body("city")
    .trim()
    .notEmpty()
    .withMessage("City is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("City must be between 2 and 100 characters"),

  body("postcode")
    .trim()
    .notEmpty()
    .withMessage("Postcode is required")
    .matches(/^[A-Za-z0-9 -]{2,20}$/)
    .withMessage(
      "Postcode must be between 2 and 20 characters and may include letters, numbers, spaces, or hyphens",
    ),

  body("country")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Country cannot exceed 100 characters"),

  body("notes")
    .optional()
    .isString()
    .withMessage("Notes must be a string")
    .isLength({ max: 5000 })
    .withMessage("Notes cannot exceed 5000 characters"),

  body("companyLogo")
    .optional()
    .isString()
    .withMessage("Company logo must be a string"),

  body("totalSales")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Total sales must be a non-negative number"),

  body("totalMargin")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Total margin must be a non-negative number"),

  body("discountPercent")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Discount percent must be between 0 and 100"),
];

export const updateCustomerValidation: ValidationChain[] = [
  body("companyName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Company name cannot be empty")
    .isLength({ min: 2, max: 200 })
    .withMessage("Company name must be between 2 and 200 characters"),

  body("businessId")
    .optional({ values: "falsy" })
    .trim()
    .custom((value: string) => {
      if (!FinnishBusinessIds.isValidBusinessId(value)) {
        throw new Error(
          "Invalid Finnish Business ID (Y-tunnus). Format: XXXXXXX-X",
        );
      }
      return true;
    }),

  body("contactPerson")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Contact person cannot be empty")
    .isLength({ min: 2, max: 100 })
    .withMessage("Contact person must be between 2 and 100 characters"),

  body("phone")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Phone number cannot be empty")
    .matches(/^\+?\d[\d\s-]{8,}$/)
    .withMessage("Please provide a valid phone number"),

  body("email")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Email cannot be empty")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail()
    .toLowerCase(),

  body("address")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Address cannot be empty")
    .isLength({ max: 500 })
    .withMessage("Address cannot exceed 500 characters"),

  body("city")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("City cannot be empty")
    .isLength({ min: 2, max: 100 })
    .withMessage("City must be between 2 and 100 characters"),

  body("postcode")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Postcode cannot be empty")
    .matches(/^[A-Za-z0-9 -]{2,20}$/)
    .withMessage(
      "Postcode must be between 2 and 20 characters and may include letters, numbers, spaces, or hyphens",
    ),

  body("country")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Country cannot exceed 100 characters"),

  body("notes")
    .optional()
    .isString()
    .withMessage("Notes must be a string")
    .isLength({ max: 5000 })
    .withMessage("Notes cannot exceed 5000 characters"),

  body("companyLogo")
    .optional()
    .isString()
    .withMessage("Company logo must be a string"),

  body("totalSales")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Total sales must be a non-negative number"),

  body("totalMargin")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Total margin must be a non-negative number"),

  body("discountPercent")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Discount percent must be between 0 and 100"),
];
