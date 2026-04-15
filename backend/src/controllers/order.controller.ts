import { Request, Response, NextFunction } from "express";
import orderService, {
  CreateOrderFromQuoteData,
} from "../services/order.service";
import emailService from "../services/email.service";
import { AppError as ApiError } from "../middlewares/errorHandler.middleware";
import Order from "../models/order.model";
import Product from "../models/product.model";
import offerRepository from "../repositories/offer.repository";
import { canAccessOwnedEntity, getOwnershipFilter } from "../utils/ownership";

/** Enrich order items with product image URLs for email */
async function enrichItemsWithImages<
  T extends { productId: string; mockupImage?: string },
>(items: T[]) {
  const productIds = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds } })
    .select("_id images")
    .lean();
  const imageMap = new Map<string, string>();
  products.forEach((p: { _id: unknown; images?: string[] }) => {
    const url = p.images?.[0];
    if (url) imageMap.set(String(p._id), url);
  });
  return items.map((item) => {
    const plain =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof (item as any).toObject === "function"
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (item as any).toObject()
        : item;
    return {
      ...plain,
      imageUrl: imageMap.get(String(plain.productId)) || undefined,
    };
  });
}

const ensureOrderAccess = async (req: Request, id: string) => {
  const order = await orderService.getOrderById(id);
  if (!order) {
    throw new ApiError("Order not found", 404);
  }

  if (!canAccessOwnedEntity(req.user, order)) {
    throw new ApiError("You do not have permission to access this order", 403);
  }

  return order;
};

export class OrderController {
  async createOrderFromQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateOrderFromQuoteData = req.body;
      const offer = await offerRepository.findById(data.offerId);
      if (!offer) {
        throw new ApiError("Offer not found", 404);
      }
      if (!canAccessOwnedEntity(req.user, offer)) {
        throw new ApiError(
          "You do not have permission to create an order from this offer",
          403,
        );
      }
      const order = await orderService.createOrderFromQuote(data);
      res.status(201).json({
        success: true,
        data: order,
        message: "Order created successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        customerId,
        search,
        orderNumber,
        customerName,
        amountMin,
        amountMax,
        marginMin,
        marginMax,
        dateFrom,
        dateTo,
        salesperson,
      } = req.query;
      const query: Record<string, unknown> = {};
      const andClauses: Record<string, unknown>[] = [];
      const ownershipFilter = getOwnershipFilter(req.user);
      if (Object.keys(ownershipFilter).length > 0) {
        andClauses.push(ownershipFilter);
      }
      if (status && typeof status === "string") query.status = status;
      if (customerId && typeof customerId === "string")
        query.customerId = customerId;
      if (search && typeof search === "string") {
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = { $regex: escaped, $options: "i" };
        andClauses.push({
          $or: [
            { orderNumber: regex },
            { offerNumber: regex },
            { offerId: regex },
          ],
        });
      } else if (orderNumber && typeof orderNumber === "string") {
        query.orderNumber = {
          $regex: orderNumber.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          $options: "i",
        };
      }
      if (customerName && typeof customerName === "string") {
        query.customerName = {
          $regex: customerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          $options: "i",
        };
      }
      // Advanced numeric/date filters
      if (amountMin) andClauses.push({ totalAmount: { $gte: Number(amountMin) } });
      if (amountMax) andClauses.push({ totalAmount: { $lte: Number(amountMax) } });
      if (marginMin) andClauses.push({ totalMargin: { $gte: Number(marginMin) } });
      if (marginMax) andClauses.push({ totalMargin: { $lte: Number(marginMax) } });
      if (dateFrom && typeof dateFrom === "string") {
        andClauses.push({ createdAt: { $gte: new Date(dateFrom) } });
      }
      if (dateTo && typeof dateTo === "string") {
        andClauses.push({ createdAt: { $lte: new Date(dateTo + "T23:59:59") } });
      }
      if (salesperson && typeof salesperson === "string") {
        andClauses.push({
          salesperson: {
            $regex: salesperson.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            $options: "i",
          },
        });
      }
      if (andClauses.length > 0) {
        query.$and = andClauses;
      }

      const options = { page: Number(page), limit: Number(limit) };
      const result = await orderService.getOrders(query, options);
      res.json({
        success: true,
        data: result.orders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await ensureOrderAccess(req, id);
      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const currentOrder = await ensureOrderAccess(req, id);
      const previousStatus = currentOrder.status;
      // Pass pre-fetched order to avoid a second findById inside the service
      const order = await orderService.updateOrderStatus(id, status, currentOrder);
      if (!order) {
        throw new ApiError("Order not found", 404);
      }

      // Send status update email to customer (fire-and-forget)
      if (order.email && previousStatus !== status) {
        emailService
          .sendOrderStatusUpdateEmail({
            to: order.email,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            contactPerson: order.contactPerson,
            salesperson: order.salesperson,
            previousStatus,
            newStatus: status,
            createdAt: order.createdAt.toISOString(),
          })
          .catch((err) =>
            console.error("Failed to send order status update email:", err),
          );
      }

      res.json({
        success: true,
        data: order,
        message: "Order status updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async sendConfirmationEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await ensureOrderAccess(req, id);
      if (!order.email) {
        throw new ApiError(
          "No customer email address available for this order",
          400,
        );
      }

      const emailItems = await enrichItemsWithImages(order.items);
      const result = await emailService.sendOrderConfirmationEmail({
        to: order.email,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        contactPerson: order.contactPerson,
        items: emailItems.map((item) => ({
          productName: item.productName,
          productNumber: item.productNumber,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          markingCost: item.markingCost,
          imageUrl: item.imageUrl,
          mockupImage: item.mockupImage,
        })),
        specialCosts: order.specialCosts || [],
        totalAmount: order.totalAmount,
        salesperson: order.salesperson,
        createdAt: order.createdAt.toISOString(),
      });

      if (!result.success) {
        throw new ApiError(result.message, 500);
      }

      // Update order status to processing after sending confirmation.
      // Skip if already processing (idempotent re-send).
      if (order.status === "pending") {
        await orderService.updateOrderStatus(id, "processing");
      }
      const updatedOrder = await orderService.getOrderById(id);

      res.json({
        success: true,
        data: updatedOrder,
        message: "Order confirmation email sent successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await ensureOrderAccess(req, id);
      const deleted = await orderService.deleteOrder(id);
      if (!deleted) {
        throw new ApiError("Order not found", 404);
      }
      res.json({
        success: true,
        message: "Order deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async getSalesReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { dateFrom, dateTo, customerId, salesperson } = req.query;

      const match: Record<string, unknown> = {
        status: { $nin: ["cancelled"] },
      };

      if (dateFrom || dateTo) {
        match.createdAt = {} as Record<string, Date>;
        if (dateFrom && typeof dateFrom === "string") {
          (match.createdAt as Record<string, Date>).$gte = new Date(dateFrom);
        }
        if (dateTo && typeof dateTo === "string") {
          (match.createdAt as Record<string, Date>).$lte = new Date(dateTo);
        }
      }
      if (customerId && typeof customerId === "string") {
        match.customerId = customerId;
      }
      if (salesperson && typeof salesperson === "string") {
        match.salesperson = {
          $regex: salesperson.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          $options: "i",
        };
      }

      const [totals, byCustomer, bySalesperson] = await Promise.all([
        Order.aggregate([
          { $match: match },
          {
            $group: {
              _id: null,
              totalSales: { $sum: "$totalAmount" },
              totalMargin: { $sum: "$totalMargin" },
              orderCount: { $sum: 1 },
            },
          },
        ]),
        Order.aggregate([
          { $match: match },
          {
            $group: {
              _id: "$customerId",
              customerName: { $first: "$customerName" },
              totalSales: { $sum: "$totalAmount" },
              totalMargin: { $sum: "$totalMargin" },
              orderCount: { $sum: 1 },
            },
          },
          { $sort: { totalSales: -1 } },
        ]),
        Order.aggregate([
          { $match: match },
          {
            $group: {
              _id: "$salesperson",
              totalSales: { $sum: "$totalAmount" },
              totalMargin: { $sum: "$totalMargin" },
              orderCount: { $sum: 1 },
            },
          },
          { $sort: { totalSales: -1 } },
        ]),
      ]);

      res.json({
        success: true,
        data: {
          totals: totals[0] || { totalSales: 0, totalMargin: 0, orderCount: 0 },
          byCustomer: byCustomer.map((c) => ({
            customerId: c._id,
            customerName: c.customerName,
            totalSales: c.totalSales,
            totalMargin: c.totalMargin,
            orderCount: c.orderCount,
          })),
          bySalesperson: bySalesperson.map((s) => ({
            salesperson: s._id || "Unassigned",
            totalSales: s.totalSales,
            totalMargin: s.totalMargin,
            orderCount: s.orderCount,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new OrderController();
