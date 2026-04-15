import { body } from "express-validator";

export const loginValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address"),
  body("password")
    .trim()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];
