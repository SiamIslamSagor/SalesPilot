import { IOrder } from "../models/order.model";

export class OrderRepository {
  async create(orderData: Partial<IOrder>): Promise<IOrder> {
    const Order = (await import("../models/order.model")).default;
    const order = new Order(orderData);
    return order.save();
  }

  async findById(id: string): Promise<IOrder | null> {
    const Order = (await import("../models/order.model")).default;
    return Order.findById(id).lean() as Promise<IOrder | null>;
  }

  async find(
    query: Record<string, unknown> = {},
    options: {
      page?: number;
      limit?: number;
      sort?: Record<string, 1 | -1>;
    } = {},
  ): Promise<IOrder[]> {
    const Order = (await import("../models/order.model")).default;
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;
    return Order.find(query).sort(sort).skip(skip).limit(limit).lean() as Promise<IOrder[]>;
  }

  async count(query: Record<string, unknown> = {}): Promise<number> {
    const Order = (await import("../models/order.model")).default;
    return Order.countDocuments(query);
  }

  async updateById(
    id: string,
    updateData: Partial<IOrder>,
  ): Promise<IOrder | null> {
    const Order = (await import("../models/order.model")).default;
    return Order.findByIdAndUpdate(id, updateData, { new: true });
  }

  async deleteById(id: string): Promise<boolean> {
    const Order = (await import("../models/order.model")).default;
    const result = await Order.findByIdAndDelete(id);
    return !!result;
  }

  async findByOrderNumber(orderNumber: string): Promise<IOrder | null> {
    const Order = (await import("../models/order.model")).default;
    return Order.findOne({ orderNumber });
  }

  async updateManyByCustomerId(
    customerId: string,
    customerFields: {
      customerName?: string;
      contactPerson?: string;
      email?: string;
      phone?: string;
      address?: string;
    },
  ): Promise<number> {
    const Order = (await import("../models/order.model")).default;
    const result = await Order.updateMany(
      { customerId },
      { $set: customerFields },
    );
    return result.modifiedCount;
  }
}

export default new OrderRepository();
