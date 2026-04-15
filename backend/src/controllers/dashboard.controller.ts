/**
 * Dashboard Controller
 * Handles HTTP requests for dashboard data
 */

import { Request, Response } from "express";
import dashboardService from "../services/dashboard.service";
import logger from "../utils/logger";

/**
 * Get dashboard statistics and data
 * GET /api/dashboard/stats
 */
const getDashboardStats = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const dashboardData = await dashboardService.getDashboardData(req.user);

    res.status(200).json({
      success: true,
      data: dashboardData,
      message: "Dashboard data fetched successfully",
    });
  } catch (error) {
    logger.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch dashboard data",
    });
  }
};

const dashboardController = {
  getDashboardStats,
};

export default dashboardController;
