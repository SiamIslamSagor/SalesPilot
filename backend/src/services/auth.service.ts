import crypto from "crypto";
import User from "../models/user.model";
import emailService from "./email.service";
import { UserRole } from "../types/user.types";

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResult {
  success: boolean;
  message: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

interface ForgotPasswordResult {
  success: boolean;
  message: string;
}

interface ResetPasswordResult {
  success: boolean;
  message: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      // Find user by email
      const user = await User.findOne({
        email: credentials.email.toLowerCase(),
      }).select("+password"); // Explicitly select password field

      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      // Compare password
      const isPasswordValid = await user.comparePassword(credentials.password);

      if (!isPasswordValid) {
        return {
          success: false,
          message: "Invalid email or password",
        };
      }

      // Return user data without password
      return {
        success: true,
        message: "Login successful",
        user: {
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    } catch {
      return {
        success: false,
        message: "Login failed. Please try again later.",
      };
    }
  }

  async forgotPassword(email: string): Promise<ForgotPasswordResult> {
    try {
      // Find user by email
      const user = await User.findOne({
        email: email.toLowerCase(),
      });

      // Always return success to prevent email enumeration
      if (!user) {
        return {
          success: true,
          message:
            "If an account exists with this email, a password reset link has been sent.",
        };
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes from now

      // Hash the token before storing
      const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      // Save token and expiration to user
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpire = new Date(resetPasswordExpire);
      await user.save();

      // Create reset URL using path parameter
      const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:8080"}/reset-password/${resetToken}`;

      // Send email
      await emailService.sendPasswordResetEmail({
        to: user.email,
        resetUrl,
      });

      return {
        success: true,
        message:
          "If an account exists with this email, a password reset link has been sent.",
      };
    } catch (error) {
      console.error("Error in forgotPassword:", error);
      return {
        success: true,
        message:
          "If an account exists with this email, a password reset link has been sent.",
      };
    }
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<ResetPasswordResult> {
    try {
      // Hash the token to compare with stored hash
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      // Find user with valid token
      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() },
      }).select("+password");

      if (!user) {
        return {
          success: false,
          message:
            "Invalid or expired reset token. Please request a new password reset.",
        };
      }

      // Update password
      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      user.lastPasswordReset = new Date();
      await user.save();

      return {
        success: true,
        message:
          "Password has been reset successfully. You can now login with your new password.",
      };
    } catch (error) {
      console.error("Error in resetPassword:", error);
      return {
        success: false,
        message: "Failed to reset password. Please try again.",
      };
    }
  }
}

export default new AuthService();
