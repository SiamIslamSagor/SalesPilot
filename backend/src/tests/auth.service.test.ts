import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockUserModel, mockEmailService } = vi.hoisted(() => ({
  mockUserModel: {
    findOne: vi.fn(),
  },
  mockEmailService: {
    sendPasswordResetEmail: vi.fn(),
  },
}));

vi.mock("../models/user.model", () => ({ default: mockUserModel }));
vi.mock("../services/email.service", () => ({ default: mockEmailService }));
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({ emails: { send: vi.fn() } })),
}));

import authService from "../services/auth.service";

describe("AuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("returns success with user data on valid credentials", async () => {
      mockUserModel.findOne.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          _id: { toString: () => "u1" },
          name: "Admin",
          email: "admin@test.com",
          role: "admin",
          comparePassword: vi.fn().mockResolvedValue(true),
        }),
      });

      const result = await authService.login({
        email: "admin@test.com",
        password: "pass123",
      });

      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        _id: "u1",
        name: "Admin",
        email: "admin@test.com",
        role: "admin",
      });
    });

    it("returns failure when user not found", async () => {
      mockUserModel.findOne.mockReturnValue({
        select: vi.fn().mockResolvedValue(null),
      });

      const result = await authService.login({
        email: "nonexistent@test.com",
        password: "pass",
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe("User not found");
    });

    it("returns failure when password is invalid", async () => {
      mockUserModel.findOne.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          _id: { toString: () => "u1" },
          name: "Admin",
          email: "admin@test.com",
          role: "admin",
          comparePassword: vi.fn().mockResolvedValue(false),
        }),
      });

      const result = await authService.login({
        email: "admin@test.com",
        password: "wrongpass",
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe("Invalid email or password");
    });

    it("returns failure on unexpected error", async () => {
      mockUserModel.findOne.mockReturnValue({
        select: vi.fn().mockRejectedValue(new Error("DB error")),
      });

      const result = await authService.login({
        email: "admin@test.com",
        password: "pass",
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("Login failed");
    });
  });

  describe("forgotPassword", () => {
    it("returns success even when user not found (anti-enumeration)", async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      const result = await authService.forgotPassword("nobody@test.com");

      expect(result.success).toBe(true);
      expect(result.message).toContain("If an account exists");
    });

    it("generates reset token and sends email when user found", async () => {
      const mockUser = {
        email: "user@test.com",
        resetPasswordToken: undefined as string | undefined,
        resetPasswordExpire: undefined as Date | undefined,
        save: vi.fn(),
      };
      mockUserModel.findOne.mockResolvedValue(mockUser);
      mockEmailService.sendPasswordResetEmail.mockResolvedValue({
        success: true,
      });

      const result = await authService.forgotPassword("user@test.com");

      expect(result.success).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockUser.resetPasswordToken).toBeDefined();
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it("returns success even when email sending fails", async () => {
      const mockUser = {
        email: "user@test.com",
        save: vi.fn(),
      };
      mockUserModel.findOne.mockResolvedValue(mockUser);
      mockEmailService.sendPasswordResetEmail.mockRejectedValue(
        new Error("SMTP error"),
      );

      const result = await authService.forgotPassword("user@test.com");

      expect(result.success).toBe(true);
    });
  });

  describe("resetPassword", () => {
    it("resets password for valid token", async () => {
      const mockUser = {
        password: "old",
        resetPasswordToken: "hash",
        resetPasswordExpire: new Date(Date.now() + 60000),
        lastPasswordReset: undefined as Date | undefined,
        save: vi.fn(),
      };
      mockUserModel.findOne.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser),
      });

      const result = await authService.resetPassword("validtoken", "newpass");

      expect(result.success).toBe(true);
      expect(mockUser.password).toBe("newpass");
      expect(mockUser.resetPasswordToken).toBeUndefined();
      expect(mockUser.save).toHaveBeenCalled();
    });

    it("returns failure for expired/invalid token", async () => {
      mockUserModel.findOne.mockReturnValue({
        select: vi.fn().mockResolvedValue(null),
      });

      const result = await authService.resetPassword("badtoken", "newpass");

      expect(result.success).toBe(false);
      expect(result.message).toContain("Invalid or expired");
    });

    it("returns failure on unexpected error", async () => {
      mockUserModel.findOne.mockReturnValue({
        select: vi.fn().mockRejectedValue(new Error("DB error")),
      });

      const result = await authService.resetPassword("token", "pass");

      expect(result.success).toBe(false);
      expect(result.message).toContain("Failed to reset");
    });
  });
});
