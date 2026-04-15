import { Router } from "express";
import rateLimit from "express-rate-limit";
import authController from "../controllers/auth.controller";
import { loginValidation } from "../validators/login.validator";
import {
  forgotPasswordValidation,
  resetPasswordValidation,
} from "../validators/password-reset.validator";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts, please try again later",
  },
});

// Login endpoint
router.post("/login", authLimiter, loginValidation, authController.login);

// Password reset endpoints
router.post(
  "/forgot-password",
  authLimiter,
  forgotPasswordValidation,
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  authLimiter,
  resetPasswordValidation,
  authController.resetPassword,
);

export default router;
