/**
 * Dashboard Routes
 * Defines API endpoints for dashboard data
 */

import { Router } from "express";
import dashboardController from "../controllers/dashboard.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireManager } from "../middlewares/authorization.middleware";

const router = Router();
router.use(authenticate);
router.use(requireManager);

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics and offer lists
 * @access  Private (add auth middleware if needed)
 */
router.get("/stats", dashboardController.getDashboardStats);

export default router;
