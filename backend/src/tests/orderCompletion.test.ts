import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import Customer from "../models/customer.model";
import Order from "../models/order.model";
import orderService from "../services/order.service";
import customerRepository from "../repositories/customer.repository";

describe("Order Completion - Customer Totals Update", () => {
  let testCustomerId: string;
  let testOrderId: string;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGODB_URI || "mongodb://localhost:27017/test",
      );
    }

    // Create a test customer
    const customer = await Customer.create({
      companyName: "Test Company",
      businessId: "1234567-8",
      contactPerson: "John Doe",
      phone: "+1234567890",
      email: "test@example.com",
      address: "123 Test Street",
      totalSales: 1000,
      totalMargin: 200,
    });
    testCustomerId = customer._id.toString();

    // Create a test order
    const order = await Order.create({
      orderNumber: "SO-2025-001",
      offerId: new mongoose.Types.ObjectId().toString(),
      customerId: testCustomerId,
      customerName: "Test Company",
      contactPerson: "John Doe",
      email: "test@example.com",
      phone: "+1234567890",
      address: "123 Test Street",
      items: [],
      totalAmount: 500,
      totalMargin: 100,
      status: "pending",
    });
    testOrderId = (order._id as mongoose.Types.ObjectId).toString();
  });

  afterAll(async () => {
    // Clean up test data
    await Order.deleteMany({});
    await Customer.deleteMany({});
    await mongoose.connection.close();
  });

  it("should increment customer totals when order is completed", async () => {
    // Get initial customer totals
    const initialCustomer = await customerRepository.findById(testCustomerId);
    expect(initialCustomer?.totalSales).toBe(1000);
    expect(initialCustomer?.totalMargin).toBe(200);

    // Update order status to completed
    await orderService.updateOrderStatus(testOrderId, "completed");

    // Verify customer totals were incremented
    const updatedCustomer = await customerRepository.findById(testCustomerId);
    expect(updatedCustomer?.totalSales).toBe(1500); // 1000 + 500
    expect(updatedCustomer?.totalMargin).toBe(300); // 200 + 100
  });

  it("should decrement customer totals when order status changes from completed", async () => {
    // First, verify current totals
    const customerBefore = await customerRepository.findById(testCustomerId);
    expect(customerBefore?.totalSales).toBe(1500);
    expect(customerBefore?.totalMargin).toBe(300);

    // Change order status from completed to cancelled
    await orderService.updateOrderStatus(testOrderId, "cancelled");

    // Verify customer totals were decremented
    const customerAfter = await customerRepository.findById(testCustomerId);
    expect(customerAfter?.totalSales).toBe(1000); // 1500 - 500
    expect(customerAfter?.totalMargin).toBe(200); // 300 - 100
  });

  it("should not update customer totals when order status changes between non-completed states", async () => {
    // Reset order to pending
    await orderService.updateOrderStatus(testOrderId, "pending");

    // Get current customer totals
    const customerBefore = await customerRepository.findById(testCustomerId);
    const initialSales = customerBefore?.totalSales || 0;
    const initialMargin = customerBefore?.totalMargin || 0;

    // Change order status from pending to processing
    await orderService.updateOrderStatus(testOrderId, "processing");

    // Verify customer totals were not changed
    const customerAfter = await customerRepository.findById(testCustomerId);
    expect(customerAfter?.totalSales).toBe(initialSales);
    expect(customerAfter?.totalMargin).toBe(initialMargin);
  });

  it("should not increment totals multiple times when order is set to completed again", async () => {
    // Set order to completed
    await orderService.updateOrderStatus(testOrderId, "completed");

    // Get customer totals after first completion
    const customerAfterFirst =
      await customerRepository.findById(testCustomerId);
    const salesAfterFirst = customerAfterFirst?.totalSales || 0;
    const marginAfterFirst = customerAfterFirst?.totalMargin || 0;

    // Set order to completed again (should not increment)
    await orderService.updateOrderStatus(testOrderId, "completed");

    // Verify customer totals were not incremented again
    const customerAfterSecond =
      await customerRepository.findById(testCustomerId);
    expect(customerAfterSecond?.totalSales).toBe(salesAfterFirst);
    expect(customerAfterSecond?.totalMargin).toBe(marginAfterFirst);
  });
});
