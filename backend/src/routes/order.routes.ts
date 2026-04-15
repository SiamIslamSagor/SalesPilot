import { Router } from "express";
import orderController from "../controllers/order.controller";
import { authenticate } from "../middlewares/auth.middleware";
import {
  requireManager,
  requireSuperAdmin,
} from "../middlewares/authorization.middleware";

const router = Router();
router.use(authenticate);

// POST /api/orders - Create order from quote
router.post("/", requireManager, orderController.createOrderFromQuote);

// GET /api/orders - Get orders with pagination and filters
router.get("/", orderController.getOrders);

// GET /api/orders/sales-report - Get sales report aggregation
router.get("/sales-report", requireSuperAdmin, orderController.getSalesReport);

// GET /api/orders/:id - Get single order
router.get("/:id", orderController.getOrderById);

// PUT /api/orders/:id/status - Update order status
router.put("/:id/status", requireManager, orderController.updateOrderStatus);

// POST /api/orders/:id/send-confirmation - Send order confirmation email
router.post(
  "/:id/send-confirmation",
  requireManager,
  orderController.sendConfirmationEmail,
);

// DELETE /api/orders/:id - Delete order
router.delete("/:id", requireManager, orderController.deleteOrder);

export default router;
