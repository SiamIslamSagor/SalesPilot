/**
 * Dashboard Types
 * Type definitions for dashboard statistics and data
 */

/**
 * Basic dashboard statistics
 */
export interface DashboardStats {
  totalOffers: number;
  activeOrders: number;
  totalSales: number;
  pendingApproval: number;
}

/**
 * Detailed offer statistics
 */
export interface OfferStats {
  total: number;
  byStatus: {
    draft: number;
    sent: number;
    accepted: number;
    rejected: number;
    expired: number;
    completed: number;
  };
  totalValue: number;
  valueByStatus: {
    draft: number;
    sent: number;
    accepted: number;
    rejected: number;
    expired: number;
    completed: number;
  };
  averageValue: number;
  conversionRate: number; // accepted / sent
  responseRate: number; // responded / sent
  totalItems: number;
  averageItemsPerOffer: number;
  recentOffers: DashboardOfferSummary[];
  topOffersByValue: DashboardOfferSummary[];
  offersByCustomer: Array<{
    customerId: string;
    customerName: string;
    count: number;
    totalValue: number;
  }>;
  offersOverTime: Array<{
    date: string;
    count: number;
    value: number;
  }>;
  averageResponseTime: number; // in hours
}

/**
 * Detailed order statistics
 */
export interface OrderStats {
  total: number;
  byStatus: {
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
  };
  totalValue: number;
  valueByStatus: {
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
  };
  totalMargin: number;
  averageMargin: number;
  marginPercentage: number; // margin / value * 100
  averageValue: number;
  totalItems: number;
  averageItemsPerOrder: number;
  recentOrders: DashboardOrderSummary[];
  topOrdersByValue: DashboardOrderSummary[];
  ordersByCustomer: Array<{
    customerId: string;
    customerName: string;
    count: number;
    totalValue: number;
    totalMargin: number;
  }>;
  ordersBySalesperson: Array<{
    salesperson: string;
    count: number;
    totalValue: number;
    totalMargin: number;
  }>;
  ordersOverTime: Array<{
    date: string;
    count: number;
    value: number;
    margin: number;
  }>;
}

/**
 * Detailed customer statistics
 */
export interface CustomerStats {
  total: number;
  totalSales: number;
  totalMargin: number;
  averageSalesPerCustomer: number;
  averageMarginPerCustomer: number;
  topCustomersBySales: Array<{
    customerId: string;
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    totalSales: number;
    totalMargin: number;
  }>;
  customersOverTime: Array<{
    date: string;
    count: number;
  }>;
}

/**
 * Detailed product statistics
 */
export interface ProductStats {
  total: number;
  byStatus: {
    active: number;
    inactive: number;
  };
  byCategory: Array<{
    category: string;
    count: number;
  }>;
  byBrand: Array<{
    brand: string;
    count: number;
  }>;
  byGender: Array<{
    gender: string;
    count: number;
  }>;
  averageMargin: number;
  topProductsByMargin: Array<{
    productId: string;
    productNumber: string;
    name: string;
    brand: string;
    category: string;
    purchasePrice: number;
    salesPrice: number;
    margin: number;
    status: string;
  }>;
  productsWithVariants: number;
  totalVariants: number;
}

/**
 * Detailed printing sheet statistics
 */
export interface PrintingSheetStats {
  total: number;
  byPrintMethod: Array<{
    method: string;
    count: number;
  }>;
  totalQuantity: number;
  averageQuantityPerSheet: number;
  byProduct: Array<{
    productId: string;
    productNumber: string;
    productName: string;
    count: number;
    totalQuantity: number;
  }>;
  recentSheets: Array<{
    _id: string;
    productNumber: string;
    productName: string;
    customerName: string;
    printMethod: string;
    totalQuantity: number;
    createdAt: Date;
  }>;
}

/**
 * Financial statistics
 */
export interface FinancialStats {
  totalRevenue: number;
  totalMargin: number;
  profitMarginPercentage: number;
  averageOrderValue: number;
  revenueByStatus: {
    pending: number;
    processing: number;
    completed: number;
  };
  revenueOverTime: Array<{
    date: string;
    revenue: number;
    margin: number;
  }>;
  revenueByOfferStatus: {
    draft: number;
    sent: number;
    accepted: number;
    rejected: number;
    expired: number;
    completed: number;
  };
}

/**
 * Offer summary for dashboard lists
 */
export interface DashboardOfferSummary {
  _id: string;
  offerNumber: string;
  customerId: string;
  customerName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  totalAmount: number;
  itemCount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  customerResponse?: string;
  respondedAt?: Date;
}

/**
 * Order summary for dashboard lists
 */
export interface DashboardOrderSummary {
  _id: string;
  orderNumber: string;
  offerId: string;
  customerId: string;
  customerName: string;
  contactPerson: string;
  email: string;
  phone: string;
  totalAmount: number;
  totalMargin: number;
  itemCount: number;
  status: string;
  salesperson?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Offers grouped by status
 */
export interface OffersByStatus {
  sent: DashboardOfferSummary[];
  accepted: DashboardOfferSummary[];
  rejected: DashboardOfferSummary[];
  draft: DashboardOfferSummary[];
  completed: DashboardOfferSummary[];
}

/**
 * Complete dashboard data response
 */
export interface DashboardData {
  stats: DashboardStats;
  offerStats: OfferStats;
  orderStats: OrderStats;
  customerStats: CustomerStats;
  productStats: ProductStats;
  printingSheetStats: PrintingSheetStats;
  financialStats: FinancialStats;
  offersByStatus: OffersByStatus;
}

/**
 * Dashboard API response
 */
export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
  message?: string;
}
