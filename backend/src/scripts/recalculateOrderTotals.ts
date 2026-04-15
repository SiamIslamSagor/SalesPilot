import mongoose from "mongoose";
import Order from "../models/order.model";
import { IOrderItem } from "../models/order.model";

/**
 * Migration script to recalculate totalAmount and totalMargin for existing orders
 * Run this script to fix orders that have 0 values for totals
 */

async function recalculateOrderTotals() {
  try {
    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/prod-pros";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Find all orders with totalAmount = 0
    const orders = await Order.find({ totalAmount: 0 });
    console.log(`Found ${orders.length} orders with totalAmount = 0`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const order of orders) {
      try {
        console.log(`\nProcessing order: ${order.orderNumber}`);

        // Recalculate totals
        const totalAmount = order.items.reduce(
          (sum: number, item: IOrderItem) => {
            const unitPrice = Number(item.unitPrice) || 0;
            const discount = Number(item.discount) || 0;
            const quantity = Number(item.quantity) || 0;
            const markingCost = Number(item.markingCost) || 0;

            const discountedPrice = unitPrice * (1 - discount / 100);
            const itemTotal =
              (discountedPrice + markingCost) * quantity;

            console.log(`  Item: ${item.productName}`);
            console.log(
              `    unitPrice: ${unitPrice}, discount: ${discount}%, quantity: ${quantity}, markingCost: ${markingCost}`,
            );
            console.log(
              `    discountedPrice: ${discountedPrice}, itemTotal: ${itemTotal}`,
            );

            return sum + itemTotal;
          },
          0,
        );

        const totalMargin = order.items.reduce(
          (sum: number, item: IOrderItem) => {
            const unitPrice = Number(item.unitPrice) || 0;
            const quantity = Number(item.quantity) || 0;
            const markingCost = Number(item.markingCost) || 0;

            const marginPercentage = 0.3;
            const itemMargin = unitPrice * marginPercentage * quantity;
            const markingProfit = markingCost * quantity;

            console.log(
              `  Margin for ${item.productName}: ${itemMargin + markingProfit}`,
            );

            return sum + itemMargin + markingProfit;
          },
          0,
        );

        console.log(
          `  Calculated totals: totalAmount: ${totalAmount}, totalMargin: ${totalMargin}`,
        );

        // Update the order
        order.totalAmount = totalAmount;
        order.totalMargin = totalMargin;
        await order.save();

        console.log(`  ✓ Updated order ${order.orderNumber}`);
        updatedCount++;
      } catch (error) {
        console.error(`  ✗ Error updating order ${order.orderNumber}:`, error);
        errorCount++;
      }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Total orders processed: ${orders.length}`);
    console.log(`Orders updated: ${updatedCount}`);
    console.log(`Errors: ${errorCount}`);

    if (updatedCount > 0) {
      console.log(`\n✓ Successfully updated ${updatedCount} orders`);
    } else if (orders.length > 0) {
      console.log(
        `\n⚠ No orders were updated. Check the logs above for errors.`,
      );
    } else {
      console.log(`\n✓ No orders with totalAmount = 0 found`);
    }
  } catch (error) {
    console.error("Error running migration:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
    process.exit(0);
  }
}

// Run the migration
recalculateOrderTotals();
