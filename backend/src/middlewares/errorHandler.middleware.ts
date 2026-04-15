import { Request, Response, NextFunction } from "express";
import { Result, ValidationError } from "express-validator";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError | Result<ValidationError>,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let statusCode = 500;
  let message = "Internal Server Error";
  let errors: unknown[] = [];

  // Handle Mongoose validation errors
  if ("name" in err && err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation Error";
    const mongooseErr = err as {
      errors?: Record<string, { path: string; message: string }>;
    };
    if (mongooseErr.errors) {
      errors = Object.values(mongooseErr.errors).map((e) => ({
        field: e.path,
        message: e.message,
      }));
    }
  }

  // Handle Mongoose duplicate key error
  if ("code" in err && (err as { code?: number }).code === 11000) {
    statusCode = 409;
    message = "Duplicate field value entered";
    const duplicateErr = err as { keyValue?: Record<string, unknown> };
    const field = Object.keys(duplicateErr.keyValue || {})[0];
    errors = [{ field, message: `${field} already exists` }];
  }

  // Handle Mongoose cast error
  if ("name" in err && err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  }

  // Handle express-validator errors
  if (err instanceof Result && !err.isEmpty()) {
    statusCode = 400;
    message = "Validation Error";
    errors = err.array();
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Handle duplicate email error (from service)
  if (
    err instanceof Error &&
    err.message === "User with this email already exists"
  ) {
    statusCode = 409;
    message = err.message;
  }

  // Log error for debugging
  console.error("Error:", {
    message: (err as Error).message,
    statusCode,
    stack: (err as Error).stack,
  });

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};
