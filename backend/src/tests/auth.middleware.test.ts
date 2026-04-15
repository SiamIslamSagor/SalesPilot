import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserRole } from "../types/user.types";

// Test authenticate and signToken
const { mockJwt } = vi.hoisted(() => ({
  mockJwt: {
    verify: vi.fn(),
    sign: vi.fn(),
  },
}));

vi.mock("jsonwebtoken", () => ({
  default: mockJwt,
}));

import { authenticate, signToken } from "../middlewares/auth.middleware";

const mockReq = (headers: Record<string, string> = {}) =>
  ({ headers, user: undefined }) as never;
const mockRes = () => {
  const r = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return r as never;
};
const mockNext = vi.fn();

describe("auth.middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("JWT_SECRET", "test-secret");
  });

  describe("authenticate", () => {
    it("returns 401 when no Authorization header", () => {
      const req = mockReq({});
      const res = mockRes();

      authenticate(req, res, mockNext);

      expect(
        (res as { status: ReturnType<typeof vi.fn> }).status,
      ).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("returns 401 when header does not start with Bearer", () => {
      const req = mockReq({ authorization: "Basic abc" });
      const res = mockRes();

      authenticate(req, res, mockNext);

      expect(
        (res as { status: ReturnType<typeof vi.fn> }).status,
      ).toHaveBeenCalledWith(401);
    });

    it("sets req.user and calls next on valid token", () => {
      const payload = {
        userId: "u1",
        email: "admin@test.com",
        role: UserRole.ADMIN,
      };
      mockJwt.verify.mockReturnValue(payload);
      const req = mockReq({ authorization: "Bearer validtoken" });
      const res = mockRes();

      authenticate(req, res, mockNext);

      expect((req as { user?: unknown }).user).toEqual(payload);
      expect(mockNext).toHaveBeenCalled();
    });

    it("returns 401 on invalid token", () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error("invalid");
      });
      const req = mockReq({ authorization: "Bearer badtoken" });
      const res = mockRes();

      authenticate(req, res, mockNext);

      expect(
        (res as { status: ReturnType<typeof vi.fn> }).status,
      ).toHaveBeenCalledWith(401);
    });
  });

  describe("signToken", () => {
    it("signs a JWT with the provided payload", () => {
      mockJwt.sign.mockReturnValue("signed-token");

      const token = signToken({
        userId: "u1",
        email: "a@b.com",
        role: UserRole.ADMIN,
      });

      expect(token).toBe("signed-token");
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: "u1", email: "a@b.com", role: UserRole.ADMIN },
        "test-secret",
        { expiresIn: "7d" },
      );
    });
  });
});
