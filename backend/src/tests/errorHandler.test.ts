import { describe, it, expect, vi } from "vitest";
import { Request, Response, NextFunction } from "express";
import {
  AppError,
  errorHandler,
  notFoundHandler,
} from "../middlewares/errorHandler.middleware";

// ── Helpers ──────────────────────────────────────────────────────────────────

const mockReq = (overrides: Partial<Request> = {}): Request =>
  ({ originalUrl: "/api/test", ...overrides }) as unknown as Request;

const mockRes = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
};

const mockNext: NextFunction = vi.fn();

// ── Tests ────────────────────────────────────────────────────────────────────

describe("AppError", () => {
  it("creates error with default 500 status", () => {
    const err = new AppError("Something broke");
    expect(err.message).toBe("Something broke");
    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(true);
    expect(err).toBeInstanceOf(Error);
  });

  it("creates error with custom status code", () => {
    const err = new AppError("Not found", 404);
    expect(err.statusCode).toBe(404);
  });
});

describe("errorHandler middleware", () => {
  it("handles AppError with custom status code", () => {
    const res = mockRes();
    const err = new AppError("Forbidden", 403);

    errorHandler(err, mockReq(), res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Forbidden",
    });
  });

  it("handles Mongoose ValidationError", () => {
    const res = mockRes();
    const err = Object.assign(new Error("Validation failed"), {
      name: "ValidationError",
      errors: {
        field1: { path: "field1", message: "field1 is required" },
      },
    });

    errorHandler(err, mockReq(), res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Validation Error",
      errors: [{ field: "field1", message: "field1 is required" }],
    });
  });

  it("handles Mongoose duplicate key error (E11000)", () => {
    const res = mockRes();
    const err = Object.assign(new Error("duplicate key"), {
      code: 11000,
      keyValue: { email: "test@test.com" },
    });

    errorHandler(err, mockReq(), res, mockNext);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Duplicate field value entered",
      errors: [{ field: "email", message: "email already exists" }],
    });
  });

  it("handles Mongoose CastError", () => {
    const res = mockRes();
    const err = Object.assign(new Error("Cast error"), {
      name: "CastError",
    });

    errorHandler(err, mockReq(), res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid ID format",
    });
  });

  it("handles generic error with 500", () => {
    const res = mockRes();
    const err = new Error("Unexpected");

    errorHandler(err, mockReq(), res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Internal Server Error",
    });
  });

  it("handles duplicate email error with 409", () => {
    const res = mockRes();
    const err = new Error("User with this email already exists");

    errorHandler(err, mockReq(), res, mockNext);

    expect(res.status).toHaveBeenCalledWith(409);
  });
});

describe("notFoundHandler", () => {
  it("returns 404 with route info", () => {
    const res = mockRes();

    notFoundHandler(mockReq({ originalUrl: "/api/unknown" }), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Route /api/unknown not found",
    });
  });
});
