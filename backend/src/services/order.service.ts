import { Types } from "mongoose";
import { IOrder, IOrderItem } from "../models/order.model";
import orderRepository from "../repositories/order.repository";
import offerRepository from "../repositories/offer.repository";
import productRepository from "../repositories/product.repository";
import customerRepository from "../repositories/customer.repository";
import printingSheetService from "./printingSheet.service";
import appSettingsService from "./appSettings.service";
import { AppError as ApiError } from "../middlewares/errorHandler.middleware";

export interface CreateOrderFromQuoteData {
  offerId: string;
  items: Array<{
    productId: string;
    selectedColor?: string;
    selectedSize?: string;
    printingMethod?: string;
    quantity?: number;
  }>;
  salesperson?: string;
}

export class OrderService {
  async createOrderFromQuote(data: CreateOrderFromQuoteData): Promise<IOrder> {
    // Validate offer exists and is accepted
    const offer = await offerRepository.findById(data.offerId);
    if (!offer) {
      throw new ApiError("Offer not found", 404);
    }
    if (offer.customerResponse !== "accepted") {
      throw new ApiError("Cannot create order from non-accepted offer", 400);
    }

    // Check if order already exists for this offer
    const existingOrder = await orderRepository.findByOrderNumber(
      `SO-${offer.offerNumber}`,
    );
    if (existingOrder) {
      throw new ApiError("Order already exists for this offer", 400);
    }

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Build order items from offer items, merging with provided data
    const orderItems: IOrderItem[] = offer.items.map((offerItem) => {
      const itemData = data.items.find(
        (item) => item.productId === offerItem.productId,
      );
      if (!itemData) {
        throw new ApiError(
          `Missing order details for product ${offerItem.productId}`,
          400,
        );
      }
      // Convert Mongoose subdocument to plain object
      const plainOfferItem = JSON.parse(JSON.stringify(offerItem));
      return {
        ...plainOfferItem,
        selectedColor: itemData.selectedColor,
        selectedSize: itemData.selectedSize,
        printingMethod: itemData.printingMethod,
        quantity: itemData.quantity || plainOfferItem.quantity,
      };
    });

    // Calculate totals with proper handling of numeric values
    const totalAmount = orderItems.reduce((sum, item) => {
      // Ensure all numeric values are valid numbers
      const unitPrice = Number(item.unitPrice) || 0;
      const discount = Number(item.discount) || 0;
      const quantity = Number(item.quantity) || 0;
      const markingCost = Number(item.markingCost) || 0;

      // Calculate discounted price (discount is a percentage)
      const discountedPrice = unitPrice * (1 - discount / 100);

      // Calculate item total: (discounted price + marking cost) * quantity
      const itemTotal = (discountedPrice + markingCost) * quantity;

      return sum + itemTotal;
    }, 0);

    // Fetch all products to get their margin percentages (batch query)
    const productIds = orderItems.map((item) => item.productId);
    const products = await productRepository.findByIds(productIds);

    // Create map of productId -> margin percentage
    const productMarginMap: Record<string, number> = {};
    products.forEach((product) => {
      if (product) {
        const pid = (product._id as Types.ObjectId).toString();
        productMarginMap[pid] = product.margin || 0;
      }
    });

    // Fetch custom margin percentage and mode from app settings
    let customMarginPercentage = 0;
    let marginMode: "fallback" | "override" = "fallback";
    try {
      const appSettings = await appSettingsService.get();
      customMarginPercentage = appSettings.customMarginPercentage || 0;
      marginMode = appSettings.marginMode || "fallback";
    } catch {
      // If settings fetch fails, fall back to product margins only
    }

    const totalMargin = orderItems.reduce((sum, item) => {
      // Ensure all numeric values are valid numbers
      const unitPrice = Number(item.unitPrice) || 0;
      const quantity = Number(item.quantity) || 0;

      // Determine margin based on mode:
      // - "override": always use custom margin for all products
      // - "fallback": use custom margin only when product has no margin (0 or undefined)
      const productMargin = productMarginMap[item.productId] || 0;
      let marginPercentage: number;
      if (marginMode === "override") {
        marginPercentage = customMarginPercentage / 100;
      } else {
        // fallback: use custom margin only if product margin is 0
        marginPercentage =
          productMargin > 0
            ? productMargin / 100
            : customMarginPercentage / 100;
      }
      const itemMargin = unitPrice * marginPercentage * quantity;
      const markingProfit = (Number(item.markingCost) || 0) * quantity;

      return sum + itemMargin + markingProfit;
    }, 0);

    const specialCostsTotal =
      offer.offerDetails?.specialCosts?.reduce(
        (sum, cost) => sum + (Number(cost.amount) || 0),
        0,
      ) || 0;

    // Validate that totals are valid numbers
    if (isNaN(totalAmount) || isNaN(totalMargin)) {
      throw new ApiError(
        "Invalid order totals calculation. Please check item prices and quantities.",
        400,
      );
    }

    // Create order
    const orderData: Partial<IOrder> = {
      orderNumber,
      offerId: (offer._id as Types.ObjectId).toString(),
      offerNumber: offer.offerNumber || "",
      ownerUserId: offer.ownerUserId,
      ownerUserName: offer.ownerUserName,
      ownerUserEmail: offer.ownerUserEmail,
      customerId: offer.customerId,
      customerName: offer.customerName,
      contactPerson: offer.contactPerson,
      email: offer.email,
      phone: offer.phone,
      address: offer.address,
      items: orderItems,
      specialCosts: offer.offerDetails?.specialCosts || [],
      totalAmount: totalAmount + specialCostsTotal,
      totalMargin,
      salesperson: data.salesperson,
      status: "pending",
    };

    const order = await orderRepository.create(orderData);

    // link any printing sheets that belong to this offer so they reference the order
    await printingSheetService.linkSheetsToOrder(
      (offer._id as Types.ObjectId).toString(),
      (order._id as Types.ObjectId).toString(),
    );

    // Update offer status to completed
    await offerRepository.update((offer._id as Types.ObjectId).toString(), {
      status: "completed",
    });

    return order;
  }

  async getOrders(
    query: Record<string, unknown> = {},
    options: {
      page?: number;
      limit?: number;
      sort?: Record<string, 1 | -1>;
    } = {},
  ): Promise<{ orders: IOrder[]; total: number; pages: number }> {
    const orders = await orderRepository.find(query, options);
    const total = await orderRepository.count(query);
    const pages = Math.ceil(total / (options.limit || 10));
    return { orders, total, pages };
  }

  async getOrderById(id: string): Promise<IOrder | null> {
    return orderRepository.findById(id);
  }

  /**
   * Valid order status transitions:
   *   pending    → processing, cancelled
   *   processing → completed, cancelled
   *   completed  → (terminal – no transitions)
   *   cancelled  → (terminal – no transitions)
   */
  private static ALLOWED_TRANSITIONS: Record<string, string[]> = {
    pending: ["processing", "cancelled"],
    processing: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  };

  async updateOrderStatus(
    id: string,
    status: string,
    currentOrder?: IOrder | null,
  ): Promise<IOrder | null> {
    const validStatuses = ["pending", "processing", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      throw new ApiError("Invalid status", 400);
    }

    // Use pre-fetched order if provided to avoid a redundant DB round-trip
    const order = currentOrder ?? (await orderRepository.findById(id));
    if (!order) {
      throw new ApiError("Order not found", 404);
    }

    // Enforce state machine transitions
    const allowed = OrderService.ALLOWED_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      throw new ApiError(
        `Cannot transition from "${order.status}" to "${status}"`,
        400,
      );
    }

    // Update customer totals when transitioning to completed
    if (status === "completed") {
      await customerRepository.incrementTotals(
        order.customerId,
        order.totalAmount,
        order.totalMargin,
      );
    }

    return orderRepository.updateById(id, {
      status: status as "pending" | "processing" | "completed" | "cancelled",
    });
  }

  async deleteOrder(id: string): Promise<boolean> {
    const order = await orderRepository.findById(id);
    if (!order) {
      return false;
    }

    // If the order was completed, reverse customer totals before deleting
    if (order.status === "completed") {
      await customerRepository.incrementTotals(
        order.customerId,
        -order.totalAmount,
        -order.totalMargin,
      );
    }

    return orderRepository.deleteById(id);
  }

  private async generateOrderNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `SO-${currentYear}-`;
    const lastOrder = await orderRepository.find(
      { orderNumber: new RegExp(`^${prefix}`) },
      { sort: { createdAt: -1 }, limit: 1 },
    );
    let nextNumber = 1;
    if (lastOrder.length > 0) {
      const lastNumber = parseInt(lastOrder[0].orderNumber.split("-")[2]);
      nextNumber = lastNumber + 1;
    }
    return `${prefix}${nextNumber.toString().padStart(3, "0")}`;
  }
}

export default new OrderService();
