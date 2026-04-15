import { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../src/app";
import { connectDatabase } from "../src/utils/database";

// Vercel serverless handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Connect to database before handling request
    await connectDatabase();

    // Handle the request with Express app
    return app(req, res);
  } catch (error) {
    console.error("Error in Vercel handler:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
