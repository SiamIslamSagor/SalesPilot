import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "../types/user.types";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return secret;
}

export interface AuthPayload {
  userId: string;
  name?: string;
  email: string;
  role: UserRole;
}

// Extend Express Request to carry the authenticated user
declare module "express-serve-static-core" {
  interface Request {
    user?: AuthPayload;
  }
}

/**
 * Middleware that verifies a JWT from the Authorization header.
 * Expects: Authorization: Bearer <token>
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const token = header.split(" ")[1];

  try {
    const payload = jwt.verify(token, getJwtSecret()) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}

/**
 * Helper to sign a JWT for a given user.
 */
export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}
