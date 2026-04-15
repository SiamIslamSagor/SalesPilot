import { body } from "express-validator";

export const createCostConfigValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 200 })
    .withMessage("Name cannot exceed 200 characters"),
  body("type")
    .notEmpty()
    .withMessage("Type is required")
    .isIn(["fixed", "percentage"])
    .withMessage("Type must be 'fixed' or 'percentage'"),
  body("value")
    .notEmpty()
    .withMessage("Value is required")
    .isFloat({ min: 0, max: 100000 })
    .withMessage("Value must be between 0 and 100,000")
    .custom((value, { req }) => {
      if (req.body.type === "percentage" && value > 100) {
        throw new Error("Percentage value cannot exceed 100");
      }
      return true;
    }),
  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isIn(["cost", "margin"])
    .withMessage("Category must be 'cost' or 'margin'"),
  body("enabled").optional().isBoolean().withMessage("Enabled must be boolean"),
  body("sortOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Sort order must be a non-negative integer"),
];

export const updateCostConfigValidation = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty")
    .isLength({ max: 200 })
    .withMessage("Name cannot exceed 200 characters"),
  body("type")
    .optional()
    .isIn(["fixed", "percentage"])
    .withMessage("Type must be 'fixed' or 'percentage'"),
  body("value")
    .optional()
    .isFloat({ min: 0, max: 100000 })
    .withMessage("Value must be between 0 and 100,000")
    .custom((value, { req }) => {
      const type = req.body.type;
      if (type === "percentage" && value > 100) {
        throw new Error("Percentage value cannot exceed 100");
      }
      return true;
    }),
  body("category")
    .optional()
    .isIn(["cost", "margin"])
    .withMessage("Category must be 'cost' or 'margin'"),
  body("enabled").optional().isBoolean().withMessage("Enabled must be boolean"),
  body("sortOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Sort order must be a non-negative integer"),
];

export const bulkSaveCostConfigValidation = [
  body("items").isArray({ min: 0 }).withMessage("Items must be an array"),
  body("items.*.name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 200 })
    .withMessage("Name cannot exceed 200 characters"),
  body("items.*.type")
    .notEmpty()
    .withMessage("Type is required")
    .isIn(["fixed", "percentage"])
    .withMessage("Type must be 'fixed' or 'percentage'"),
  body("items.*.value")
    .notEmpty()
    .withMessage("Value is required")
    .isFloat({ min: 0, max: 100000 })
    .withMessage("Value must be between 0 and 100,000"),
  // Note: percentage cap for bulk items is enforced at service level
  body("items.*.category")
    .notEmpty()
    .withMessage("Category is required")
    .isIn(["cost", "margin"])
    .withMessage("Category must be 'cost' or 'margin'"),
  body("items.*.enabled")
    .optional()
    .isBoolean()
    .withMessage("Enabled must be boolean"),
  body("items.*.sortOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Sort order must be a non-negative integer"),
];
