import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserRole } from "../types/user.types";

import {
  isManager,
  isSuperAdmin,
  requireRoles,
  requireManager,
  requireSuperAdmin,
} from "../middlewares/authorization.middleware";
import { AuthPayload } from "../middlewares/auth.middleware";

const mockRes = () => {
  const r = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return r as unknown as import("express").Response;
};
const mockNext = vi.fn();

const adminPayload: AuthPayload = {
  userId: "u1",
  email: "admin@test.com",
  role: UserRole.ADMIN,
};
const superPayload: AuthPayload = {
  userId: "u2",
  email: "super@test.com",
  role: UserRole.SUPERADMIN,
};

describe("authorization.middleware", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("isManager", () => {
    it("returns true for admin", () => {
      expect(isManager(adminPayload)).toBe(true);
    });
    it("returns true for superadmin", () => {
      expect(isManager(superPayload)).toBe(true);
    });
    it("returns false for undefined", () => {
      expect(isManager(undefined)).toBe(false);
    });
  });

  describe("isSuperAdmin", () => {
    it("returns true for superadmin", () => {
      expect(isSuperAdmin(superPayload)).toBe(true);
    });
    it("returns false for admin", () => {
      expect(isSuperAdmin(adminPayload)).toBe(false);
    });
  });

  describe("requireRoles", () => {
    it("calls next when user has required role", () => {
      const req = {
        user: adminPayload,
      } as unknown as import("express").Request;
      requireRoles(UserRole.ADMIN)(req, mockRes(), mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it("returns 401 when no user", () => {
      const req = { user: undefined } as unknown as import("express").Request;
      const res = mockRes();
      requireRoles(UserRole.ADMIN)(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("returns 403 when role not allowed", () => {
      const req = {
        user: adminPayload,
      } as unknown as import("express").Request;
      const res = mockRes();
      requireRoles(UserRole.SUPERADMIN)(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("requireManager", () => {
    it("allows admin", () => {
      const req = {
        user: adminPayload,
      } as unknown as import("express").Request;
      requireManager(req, mockRes(), mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
    it("allows superadmin", () => {
      const req = {
        user: superPayload,
      } as unknown as import("express").Request;
      requireManager(req, mockRes(), mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("requireSuperAdmin", () => {
    it("allows superadmin", () => {
      const req = {
        user: superPayload,
      } as unknown as import("express").Request;
      requireSuperAdmin(req, mockRes(), mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
    it("rejects admin", () => {
      const req = {
        user: adminPayload,
      } as unknown as import("express").Request;
      const res = mockRes();
      requireSuperAdmin(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
