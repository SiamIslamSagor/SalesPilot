import multer, { MulterError } from "multer";
import { Request, Response, NextFunction } from "express";
import type { Express } from "express";

// Configure multer to use memory storage for Vercel compatibility
// Vercel's serverless environment doesn't support persistent disk storage
const storage = multer.memoryStorage();

// File filter to only accept Excel files
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  // Accept .xlsx and .xls files
  const allowedMimeTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
  ];

  const allowedExtensions = [".xlsx", ".xls"];
  const fileExtension = file.originalname
    .toLowerCase()
    .slice(file.originalname.lastIndexOf("."));

  if (
    allowedMimeTypes.includes(file.mimetype) ||
    allowedExtensions.includes(fileExtension)
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only Excel files (.xlsx, .xls) are allowed"));
  }
};

// Configure multer with memory storage and file filter
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Only allow one file at a time
  },
});

// Middleware to handle file upload errors
export const handleMulterError = (
  err: Error | MulterError | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // If no error, proceed to next middleware
  if (!err) {
    return next();
  }

  if (err instanceof MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size exceeds the 5MB limit",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Only one file can be uploaded at a time",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Unexpected file field",
      });
    }
  }

  if (err.message === "Only Excel files (.xlsx, .xls) are allowed") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  next(err);
};

export default upload;
