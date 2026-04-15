/**
 * Dashboard Service
 * Handles aggregation of dashboard statistics and data
 */

import { PipelineStage } from "mongoose";
import CustomerModel from "../models/customer.model";
import OfferModel from "../models/offer.model";
import OrderModel from "../models/order.model";
import PrintingSheetModel from "../models/printingSheet.model";
import ProductModel from "../models/product.model";
import { AuthPayload } from "../middlewares/auth.middleware";
import { getOwnershipFilter } from "../utils/ownership";
import {
  CustomerStats,
  DashboardData,
  DashboardOfferSummary,
  DashboardOrderSummary,
  DashboardStats,
  FinancialStats,
  OffersByStatus,
  OfferStats,
  OrderStats,
  PrintingSheetStats,
  ProductStats,
} from "../types/dashboard.types";
import logger from "../utils/logger";

const EMPTY_CUSTOMER_STATS: CustomerStats = {
  total: 0,
  totalSales: 0,
  totalMargin: 0,
  averageSalesPerCustomer: 0,
  averageMarginPerCustomer: 0,
  topCustomersBySales: [],
  customersOverTime: [],
};

const EMPTY_PRODUCT_STATS: ProductStats = {
  total: 0,
  byStatus: { active: 0, inactive: 0 },
  byCategory: [],
  byBrand: [],
  byGender: [],
  averageMargin: 0,
  topProductsByMargin: [],
  productsWithVariants: 0,
  totalVariants: 0,
};

const EMPTY_PRINTING_SHEET_STATS: PrintingSheetStats = {
  total: 0,
  byPrintMethod: [],
  totalQuantity: 0,
  averageQuantityPerSheet: 0,
  byProduct: [],
  recentSheets: [],
};

/**
 * Get basic dashboard statistics
 */
const getDashboardStats = async (
  user?: AuthPayload,
): Promise<DashboardStats> => {
  try {
    const offerFilter = getOwnershipFilter(user);
    const orderFilter = getOwnershipFilter(user);

    // Get total offers count
    const totalOffers = await OfferModel.countDocuments(offerFilter);

    // Get active orders (orders that are not completed or cancelled)
    const activeOrders = await OrderModel.countDocuments({
      ...orderFilter,
      status: { $in: ["pending", "processing"] },
    });

    // Get total sales from completed orders
    const totalSalesResult = await OrderModel.aggregate([
      {
        $match: {
          ...orderFilter,
          status: { $in: ["pending", "processing", "completed"] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalSales =
      totalSalesResult.length > 0 ? totalSalesResult[0].total : 0;

    // Get pending approval offers (sent offers)
    const pendingApproval = await OfferModel.countDocuments({
      ...offerFilter,
      status: "sent",
    });

    return {
      totalOffers,
      activeOrders,
      totalSales,
      pendingApproval,
    };
  } catch (error) {
    logger.error("Error fetching dashboard stats:", error);
    throw new Error("Failed to fetch dashboard statistics");
  }
};

/**
 * Get detailed offer statistics
 */
const getOfferStats = async (user?: AuthPayload): Promise<OfferStats> => {
  try {
    const ownershipFilter = getOwnershipFilter(user);

    // Get total offers count
    const total = await OfferModel.countDocuments(ownershipFilter);

    // Get offers by status
    const offersByStatus = await OfferModel.aggregate([
      ...(Object.keys(ownershipFilter).length > 0
        ? [{ $match: ownershipFilter }]
        : []),
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalValue: { $sum: "$totalAmount" },
        },
      },
    ]);

    const statusMap = {
      draft: { count: 0, value: 0 },
      sent: { count: 0, value: 0 },
      accepted: { count: 0, value: 0 },
      rejected: { count: 0, value: 0 },
      expired: { count: 0, value: 0 },
      completed: { count: 0, value: 0 },
    };

    let totalValue = 0;
    offersByStatus.forEach((item) => {
      const rawStatus =
        typeof item._id === "string" ? item._id.toLowerCase() : "";
      if (rawStatus in statusMap) {
        const key = rawStatus as keyof typeof statusMap;
        statusMap[key] = {
          count: item.count,
          value: item.totalValue,
        };
        totalValue += item.totalValue;
      }
    });

    // Calculate average value
    const averageValue = total > 0 ? totalValue / total : 0;

    // Calculate conversion and response rates using customer responses
    const responseCounts = await OfferModel.aggregate([
      ...(Object.keys(ownershipFilter).length > 0
        ? [{ $match: ownershipFilter }]
        : []),
      {
        $match: {
          customerResponse: { $in: ["accepted", "rejected"] },
        },
      },
      {
        $group: {
          _id: "$customerResponse",
          count: { $sum: 1 },
        },
      },
    ]);

    const responseMap = {
      accepted: 0,
      rejected: 0,
    };

    responseCounts.forEach((item) => {
      const responseKey =
        typeof item._id === "string" ? item._id.toLowerCase() : "";
      if (responseKey in responseMap) {
        responseMap[responseKey as keyof typeof responseMap] = item.count;
      }
    });

    const respondedCount = responseMap.accepted + responseMap.rejected;
    const conversionRate =
      respondedCount > 0 ? (responseMap.accepted / respondedCount) * 100 : 0;

    const totalRespondable =
      statusMap.sent.count +
      statusMap.accepted.count +
      statusMap.rejected.count +
      statusMap.completed.count;
    const responseRate =
      totalRespondable > 0 ? (respondedCount / totalRespondable) * 100 : 0;

    // Get total items and average items per offer
    const itemsResult = await OfferModel.aggregate([
      ...(Object.keys(ownershipFilter).length > 0
        ? [{ $match: ownershipFilter }]
        : []),
      {
        $group: {
          _id: null,
          totalItems: { $sum: "$itemCount" },
        },
      },
    ]);

    const totalItems = itemsResult.length > 0 ? itemsResult[0].totalItems : 0;
    const averageItemsPerOffer = total > 0 ? totalItems / total : 0;

    // Get recent offers
    const recentOffers = await OfferModel.find(ownershipFilter)
      .sort({ createdAt: -1 })
      .limit(10)
      .select(
        "_id offerNumber customerId customerName contactPerson email phone address totalAmount itemCount status createdAt updatedAt customerResponse respondedAt",
      )
      .lean();

    // Get top offers by value
    const topOffersByValue = await OfferModel.find(ownershipFilter)
      .sort({ totalAmount: -1 })
      .limit(10)
      .select(
        "_id offerNumber customerId customerName contactPerson email phone address totalAmount itemCount status createdAt updatedAt customerResponse respondedAt",
      )
      .lean();

    // Get offers by customer
    const offersByCustomer = await OfferModel.aggregate([
      ...(Object.keys(ownershipFilter).length > 0
        ? [{ $match: ownershipFilter }]
        : []),
      {
        $group: {
          _id: {
            customerId: "$customerId",
            customerName: "$customerName",
          },
          count: { $sum: 1 },
          totalValue: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: { totalValue: -1 },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          customerId: "$_id.customerId",
          customerName: "$_id.customerName",
          count: 1,
          totalValue: 1,
          _id: 0,
        },
      },
    ]);

    // Get offers over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const offersOverTimeRaw = await OfferModel.aggregate([
      {
        $match: {
          ...ownershipFilter,
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
          value: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const offersOverTime = offersOverTimeRaw.map((item) => ({
      date: item._id,
      count: item.count,
      value: item.value,
    }));

    // Calculate average response time (in hours)
    const responseTimeResult = await OfferModel.aggregate([
      {
        $match: {
          ...ownershipFilter,
          status: { $in: ["accepted", "rejected"] },
          respondedAt: { $exists: true },
        },
      },
      {
        $project: {
          responseTime: {
            $divide: [
              { $subtract: ["$respondedAt", "$createdAt"] },
              1000 * 60 * 60, // Convert milliseconds to hours
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: "$responseTime" },
        },
      },
    ]);

    const averageResponseTime =
      responseTimeResult.length > 0 ? responseTimeResult[0].avgResponseTime : 0;

    return {
      total,
      byStatus: {
        draft: statusMap.draft.count,
        sent: statusMap.sent.count,
        accepted: statusMap.accepted.count,
        rejected: statusMap.rejected.count,
        expired: statusMap.expired.count,
        completed: statusMap.completed.count,
      },
      totalValue,
      valueByStatus: {
        draft: statusMap.draft.value,
        sent: statusMap.sent.value,
        accepted: statusMap.accepted.value,
        rejected: statusMap.rejected.value,
        expired: statusMap.expired.value,
        completed: statusMap.completed.value,
      },
      averageValue,
      conversionRate,
      responseRate,
      totalItems,
      averageItemsPerOffer,
      recentOffers: recentOffers as unknown as DashboardOfferSummary[],
      topOffersByValue: topOffersByValue as unknown as DashboardOfferSummary[],
      offersByCustomer,
      offersOverTime,
      averageResponseTime,
    };
  } catch (error) {
    logger.error("Error fetching offer stats:", error);
    throw new Error("Failed to fetch offer statistics");
  }
};

/**
 * Get detailed order statistics
 */
const getOrderStats = async (user?: AuthPayload): Promise<OrderStats> => {
  try {
    const ownershipFilter = getOwnershipFilter(user);

    // Get total orders count
    const total = await OrderModel.countDocuments(ownershipFilter);

    // Get orders by status
    const ordersByStatus = await OrderModel.aggregate([
      ...(Object.keys(ownershipFilter).length > 0
        ? [{ $match: ownershipFilter }]
        : []),
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalValue: { $sum: "$totalAmount" },
          totalMargin: { $sum: "$totalMargin" },
        },
      },
    ]);

    const statusMap = {
      pending: { count: 0, value: 0, margin: 0 },
      processing: { count: 0, value: 0, margin: 0 },
      completed: { count: 0, value: 0, margin: 0 },
      cancelled: { count: 0, value: 0, margin: 0 },
    };

    let totalValue = 0;
    let totalMargin = 0;

    ordersByStatus.forEach((item) => {
      if (statusMap[item._id as keyof typeof statusMap]) {
        statusMap[item._id as keyof typeof statusMap] = {
          count: item.count,
          value: item.totalValue,
          margin: item.totalMargin,
        };
        totalValue += item.totalValue;
        totalMargin += item.totalMargin;
      }
    });

    // Calculate average margin and margin percentage
    const averageMargin = total > 0 ? totalMargin / total : 0;
    const marginPercentage =
      totalValue > 0 ? (totalMargin / totalValue) * 100 : 0;

    // Calculate average value
    const averageValue = total > 0 ? totalValue / total : 0;

    // Get total items and average items per order
    const itemsResult = await OrderModel.aggregate([
      ...(Object.keys(ownershipFilter).length > 0
        ? [{ $match: ownershipFilter }]
        : []),
      {
        $group: {
          _id: null,
          totalItems: { $sum: { $size: "$items" } },
        },
      },
    ]);

    const totalItems = itemsResult.length > 0 ? itemsResult[0].totalItems : 0;
    const averageItemsPerOrder = total > 0 ? totalItems / total : 0;

    // Get recent orders
    const recentOrders = await OrderModel.find(ownershipFilter)
      .sort({ createdAt: -1 })
      .limit(10)
      .select(
        "_id orderNumber offerId customerId customerName contactPerson email phone totalAmount totalMargin status salesperson items createdAt updatedAt",
      )
      .lean();

    // Get top orders by value
    const topOrdersByValue = await OrderModel.find(ownershipFilter)
      .sort({ totalAmount: -1 })
      .limit(10)
      .select(
        "_id orderNumber offerId customerId customerName contactPerson email phone totalAmount totalMargin status salesperson items createdAt updatedAt",
      )
      .lean();

    // Get orders by customer
    const ordersByCustomer = await OrderModel.aggregate([
      ...(Object.keys(ownershipFilter).length > 0
        ? [{ $match: ownershipFilter }]
        : []),
      {
        $group: {
          _id: {
            customerId: "$customerId",
            customerName: "$customerName",
          },
          count: { $sum: 1 },
          totalValue: { $sum: "$totalAmount" },
          totalMargin: { $sum: "$totalMargin" },
        },
      },
      {
        $sort: { totalValue: -1 },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          customerId: "$_id.customerId",
          customerName: "$_id.customerName",
          count: 1,
          totalValue: 1,
          totalMargin: 1,
          _id: 0,
        },
      },
    ]);

    // Get orders by salesperson
    const ordersBySalesperson = await OrderModel.aggregate([
      {
        $match: {
          ...ownershipFilter,
          salesperson: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$salesperson",
          count: { $sum: 1 },
          totalValue: { $sum: "$totalAmount" },
          totalMargin: { $sum: "$totalMargin" },
        },
      },
      {
        $sort: { totalValue: -1 },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          salesperson: "$_id",
          count: 1,
          totalValue: 1,
          totalMargin: 1,
          _id: 0,
        },
      },
    ]);

    // Get orders over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const ordersOverTime = await OrderModel.aggregate([
      {
        $match: {
          ...ownershipFilter,
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
          value: { $sum: "$totalAmount" },
          margin: { $sum: "$totalMargin" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return {
      total,
      byStatus: {
        pending: statusMap.pending.count,
        processing: statusMap.processing.count,
        completed: statusMap.completed.count,
        cancelled: statusMap.cancelled.count,
      },
      totalValue,
      valueByStatus: {
        pending: statusMap.pending.value,
        processing: statusMap.processing.value,
        completed: statusMap.completed.value,
        cancelled: statusMap.cancelled.value,
      },
      totalMargin,
      averageMargin,
      marginPercentage,
      averageValue,
      totalItems,
      averageItemsPerOrder,
      recentOrders: recentOrders.map((order) => ({
        ...order,
        itemCount: order.items ? order.items.length : 0,
      })) as unknown as DashboardOrderSummary[],
      topOrdersByValue: topOrdersByValue.map((order) => ({
        ...order,
        itemCount: order.items ? order.items.length : 0,
      })) as unknown as DashboardOrderSummary[],
      ordersByCustomer,
      ordersBySalesperson,
      ordersOverTime,
    };
  } catch (error) {
    logger.error("Error fetching order stats:", error);
    throw new Error("Failed to fetch order statistics");
  }
};

/**
 * Get detailed customer statistics
 */
const getCustomerStats = async (): Promise<CustomerStats> => {
  try {
    // Get total customers count
    const total = await CustomerModel.countDocuments();

    // Get total sales and margin from customers
    const salesResult = await CustomerModel.aggregate([
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalSales" },
          totalMargin: { $sum: "$totalMargin" },
        },
      },
    ]);

    const totalSales = salesResult.length > 0 ? salesResult[0].totalSales : 0;
    const totalMargin = salesResult.length > 0 ? salesResult[0].totalMargin : 0;

    // Calculate averages
    const averageSalesPerCustomer = total > 0 ? totalSales / total : 0;
    const averageMarginPerCustomer = total > 0 ? totalMargin / total : 0;

    // Get top customers by sales
    const topCustomersBySales = await CustomerModel.find()
      .sort({ totalSales: -1 })
      .limit(10)
      .select(
        "_id businessId companyName contactPerson email phone totalSales totalMargin",
      )
      .lean();

    // Get customers over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const customersOverTime = await CustomerModel.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return {
      total,
      totalSales,
      totalMargin,
      averageSalesPerCustomer,
      averageMarginPerCustomer,
      topCustomersBySales: topCustomersBySales.map((customer) => ({
        customerId: customer._id.toString(),
        companyName: customer.companyName,
        contactPerson: customer.contactPerson,
        email: customer.email,
        phone: customer.phone,
        totalSales: customer.totalSales,
        totalMargin: customer.totalMargin,
      })),
      customersOverTime,
    };
  } catch (error) {
    logger.error("Error fetching customer stats:", error);
    throw new Error("Failed to fetch customer statistics");
  }
};

/**
 * Get detailed product statistics
 */
const getProductStats = async (): Promise<ProductStats> => {
  try {
    // Get total products count
    const total = await ProductModel.countDocuments();

    // Get products by status
    const productsByStatus = await ProductModel.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const statusMap = {
      active: 0,
      inactive: 0,
    };

    productsByStatus.forEach((item) => {
      if (statusMap[item._id as keyof typeof statusMap] !== undefined) {
        statusMap[item._id as keyof typeof statusMap] = item.count;
      }
    });

    // Get products by category
    const productsByCategory = await ProductModel.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Get products by brand
    const productsByBrand = await ProductModel.aggregate([
      {
        $group: {
          _id: "$brand",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Get products by gender
    const productsByGender = await ProductModel.aggregate([
      {
        $group: {
          _id: "$gender",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Get average margin
    const marginResult = await ProductModel.aggregate([
      {
        $group: {
          _id: null,
          avgMargin: { $avg: "$margin" },
        },
      },
    ]);

    const averageMargin =
      marginResult.length > 0 ? marginResult[0].avgMargin : 0;

    // Get top products by margin
    const topProductsByMargin = await ProductModel.find()
      .sort({ margin: -1 })
      .limit(10)
      .select(
        "_id productNumber name brand category purchasePrice salesPrice margin status",
      )
      .lean();

    // Get products with variants count
    const productsWithVariants = await ProductModel.aggregate([
      {
        $match: {
          variants: { $exists: true, $ne: [] },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      },
    ]);

    const withVariantsCount =
      productsWithVariants.length > 0 ? productsWithVariants[0].count : 0;

    // Get total variants count
    const variantsResult = await ProductModel.aggregate([
      {
        $group: {
          _id: null,
          totalVariants: { $sum: { $size: "$variants" } },
        },
      },
    ]);

    const totalVariants =
      variantsResult.length > 0 ? variantsResult[0].totalVariants : 0;

    return {
      total,
      byStatus: {
        active: statusMap.active,
        inactive: statusMap.inactive,
      },
      byCategory: productsByCategory.map((item) => ({
        category: item._id,
        count: item.count,
      })),
      byBrand: productsByBrand.map((item) => ({
        brand: item._id,
        count: item.count,
      })),
      byGender: productsByGender.map((item) => ({
        gender: item._id,
        count: item.count,
      })),
      averageMargin,
      topProductsByMargin: topProductsByMargin.map((product) => ({
        productId: product._id.toString(),
        productNumber: product.productNumber,
        name: product.name,
        brand: product.brand,
        category: product.category,
        purchasePrice: product.purchasePrice,
        salesPrice: product.salesPrice,
        margin: product.margin,
        status: product.status,
      })),
      productsWithVariants: withVariantsCount,
      totalVariants,
    };
  } catch (error) {
    logger.error("Error fetching product stats:", error);
    throw new Error("Failed to fetch product statistics");
  }
};

/**
 * Get detailed printing sheet statistics
 */
const getPrintingSheetStats = async (): Promise<PrintingSheetStats> => {
  try {
    // Get total printing sheets count
    const total = await PrintingSheetModel.countDocuments();

    // Get printing sheets by print method
    const sheetsByMethod = await PrintingSheetModel.aggregate([
      {
        $group: {
          _id: "$printMethod",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Get total quantity
    const quantityResult = await PrintingSheetModel.aggregate([
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: "$totalQuantity" },
        },
      },
    ]);

    const totalQuantity =
      quantityResult.length > 0 ? quantityResult[0].totalQuantity : 0;
    const averageQuantityPerSheet = total > 0 ? totalQuantity / total : 0;

    // Get printing sheets by product
    const sheetsByProduct = await PrintingSheetModel.aggregate([
      {
        $group: {
          _id: {
            productId: "$productId",
            productNumber: "$productNumber",
            productName: "$productName",
          },
          count: { $sum: 1 },
          totalQuantity: { $sum: "$totalQuantity" },
        },
      },
      {
        $sort: { totalQuantity: -1 },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          productId: "$_id.productId",
          productNumber: "$_id.productNumber",
          productName: "$_id.productName",
          count: 1,
          totalQuantity: 1,
          _id: 0,
        },
      },
    ]);

    // Get recent printing sheets
    const recentSheets = await PrintingSheetModel.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select(
        "_id productNumber productName customerName printMethod totalQuantity createdAt",
      )
      .lean();

    return {
      total,
      byPrintMethod: sheetsByMethod.map((item) => ({
        method: item._id,
        count: item.count,
      })),
      totalQuantity,
      averageQuantityPerSheet,
      byProduct: sheetsByProduct,
      recentSheets: recentSheets.map((sheet) => ({
        _id: String((sheet as { _id: { toString(): string } })._id.toString()),
        productNumber: sheet.productNumber,
        productName: sheet.productName,
        customerName: sheet.customerName,
        printMethod: sheet.printMethod,
        totalQuantity: sheet.totalQuantity,
        createdAt: sheet.createdAt,
      })),
    };
  } catch (error) {
    logger.error("Error fetching printing sheet stats:", error);
    throw new Error("Failed to fetch printing sheet statistics");
  }
};

/**
 * Get financial statistics
 */
const getFinancialStats = async (
  user?: AuthPayload,
): Promise<FinancialStats> => {
  try {
    const ownershipFilter = getOwnershipFilter(user);

    // Get total revenue from orders
    const revenueResult = await OrderModel.aggregate([
      {
        $match: {
          ...ownershipFilter,
          status: { $in: ["pending", "processing", "completed"] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalMargin: { $sum: "$totalMargin" },
        },
      },
    ]);

    const totalRevenue =
      revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
    const totalMargin =
      revenueResult.length > 0 ? revenueResult[0].totalMargin : 0;

    // Calculate profit margin percentage
    const profitMarginPercentage =
      totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;

    // Calculate average order value
    const orderCount = await OrderModel.countDocuments({
      ...ownershipFilter,
      status: { $in: ["pending", "processing", "completed"] },
    });
    const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

    // Get revenue by status
    const revenueByStatusResult = await OrderModel.aggregate([
      {
        $match: {
          ...ownershipFilter,
          status: { $in: ["pending", "processing", "completed"] },
        },
      },
      {
        $group: {
          _id: "$status",
          revenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    const revenueByStatusMap = {
      pending: 0,
      processing: 0,
      completed: 0,
    };

    revenueByStatusResult.forEach((item) => {
      if (
        revenueByStatusMap[item._id as keyof typeof revenueByStatusMap] !==
        undefined
      ) {
        revenueByStatusMap[item._id as keyof typeof revenueByStatusMap] =
          item.revenue;
      }
    });

    // Get revenue over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenueOverTimeRaw = await OrderModel.aggregate([
      {
        $match: {
          ...ownershipFilter,
          createdAt: { $gte: thirtyDaysAgo },
          status: { $in: ["pending", "processing", "completed"] },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
          margin: { $sum: "$totalMargin" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const revenueOverTime = revenueOverTimeRaw.map((item) => ({
      date: item._id,
      revenue: item.revenue,
      margin: item.margin,
    }));

    // Get revenue by offer status
    const revenueByOfferStatusResult = await OfferModel.aggregate([
      ...(Object.keys(ownershipFilter).length > 0
        ? [{ $match: ownershipFilter }]
        : []),
      {
        $group: {
          _id: "$status",
          revenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    const revenueByOfferStatusMap = {
      draft: 0,
      sent: 0,
      accepted: 0,
      rejected: 0,
      expired: 0,
      completed: 0,
    };

    revenueByOfferStatusResult.forEach((item) => {
      if (
        revenueByOfferStatusMap[
          item._id as keyof typeof revenueByOfferStatusMap
        ] !== undefined
      ) {
        revenueByOfferStatusMap[
          item._id as keyof typeof revenueByOfferStatusMap
        ] = item.revenue;
      }
    });

    return {
      totalRevenue,
      totalMargin,
      profitMarginPercentage,
      averageOrderValue,
      revenueByStatus: revenueByStatusMap,
      revenueOverTime,
      revenueByOfferStatus: revenueByOfferStatusMap,
    };
  } catch (error) {
    logger.error("Error fetching financial stats:", error);
    throw new Error("Failed to fetch financial statistics");
  }
};

/**
 * Get offers by status — single $facet aggregation replaces 5 separate queries
 */
const getOffersByStatus = async (
  user?: AuthPayload,
): Promise<OffersByStatus> => {
  try {
    const ownershipFilter = getOwnershipFilter(user);

    const statusProject: Record<string, 1> = {
      _id: 1, offerNumber: 1, customerId: 1, customerName: 1,
      contactPerson: 1, email: 1, phone: 1, address: 1,
      totalAmount: 1, itemCount: 1, status: 1,
      createdAt: 1, updatedAt: 1, customerResponse: 1, respondedAt: 1,
    };

    const facetBranch = (s: string): PipelineStage.FacetPipelineStage[] => [
      { $match: { status: s } },
      { $sort: { createdAt: -1 } },
      { $limit: 10 },
      { $project: statusProject },
    ];

    const matchStage: PipelineStage[] = Object.keys(ownershipFilter).length > 0
      ? [{ $match: ownershipFilter }]
      : [];

    const pipeline: PipelineStage[] = [
      ...matchStage,
      {
        $facet: {
          sent:      facetBranch("sent"),
          accepted:  facetBranch("accepted"),
          rejected:  facetBranch("rejected"),
          draft:     facetBranch("draft"),
          completed: facetBranch("completed"),
        },
      },
    ];

    const results = await OfferModel.aggregate(pipeline);

    const data = results[0] ?? { sent: [], accepted: [], rejected: [], draft: [], completed: [] };
    return {
      sent:      data.sent      as unknown as DashboardOfferSummary[],
      accepted:  data.accepted  as unknown as DashboardOfferSummary[],
      rejected:  data.rejected  as unknown as DashboardOfferSummary[],
      draft:     data.draft     as unknown as DashboardOfferSummary[],
      completed: data.completed as unknown as DashboardOfferSummary[],
    };
  } catch (error) {
    logger.error("Error fetching offers by status:", error);
    throw new Error("Failed to fetch offers by status");
  }
};

// Simple in-memory TTL cache keyed by userId (or "global" for superadmin)
const _dashboardCache = new Map<string, { data: DashboardData; expiresAt: number }>();
const DASHBOARD_CACHE_TTL_MS = 30_000; // 30 seconds

/**
 * Get complete dashboard data
 */
const getDashboardData = async (user?: AuthPayload): Promise<DashboardData> => {
  const cacheKey = user?.userId ?? "global";
  const cached = _dashboardCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  try {
    if (user && Object.keys(getOwnershipFilter(user)).length > 0) {
      const [stats, offerStats, orderStats, financialStats, offersByStatus] =
        await Promise.all([
          getDashboardStats(user),
          getOfferStats(user),
          getOrderStats(user),
          getFinancialStats(user),
          getOffersByStatus(user),
        ]);

      const result: DashboardData = {
        stats,
        offerStats,
        orderStats,
        customerStats: EMPTY_CUSTOMER_STATS,
        productStats: EMPTY_PRODUCT_STATS,
        printingSheetStats: EMPTY_PRINTING_SHEET_STATS,
        financialStats,
        offersByStatus,
      };
      _dashboardCache.set(cacheKey, { data: result, expiresAt: Date.now() + DASHBOARD_CACHE_TTL_MS });
      return result;
    }

    // Fetch all stats in parallel for better performance
    const [
      stats,
      offerStats,
      orderStats,
      customerStats,
      productStats,
      printingSheetStats,
      financialStats,
      offersByStatus,
    ] = await Promise.all([
      getDashboardStats(user),
      getOfferStats(user),
      getOrderStats(user),
      getCustomerStats(),
      getProductStats(),
      getPrintingSheetStats(),
      getFinancialStats(user),
      getOffersByStatus(user),
    ]);

    const result: DashboardData = {
      stats,
      offerStats,
      orderStats,
      customerStats,
      productStats,
      printingSheetStats,
      financialStats,
      offersByStatus,
    };
    _dashboardCache.set(cacheKey, { data: result, expiresAt: Date.now() + DASHBOARD_CACHE_TTL_MS });
    return result;
  } catch (error) {
    logger.error("Error fetching dashboard data:", error);
    throw new Error("Failed to fetch dashboard data");
  }
};

const dashboardService = {
  getDashboardStats,
  getOfferStats,
  getOrderStats,
  getCustomerStats,
  getProductStats,
  getPrintingSheetStats,
  getFinancialStats,
  getOffersByStatus,
  getDashboardData,
};

export default dashboardService;
