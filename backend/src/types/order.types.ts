export interface CreateOrderFromQuoteRequest {
  offerId: string;
  items: Array<{
    productId: string;
    selectedColor?: string;
    selectedSize?: string;
    printingMethod?: string;
  }>;
  salesperson?: string;
}

export interface OrderResponse {
  _id: string;
  orderNumber: string;
  offerId: string;
  offerNumber?: string;
  ownerUserId?: string;
  ownerUserName?: string;
  ownerUserEmail?: string;
  customerId: string;
  customerName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  items: OrderItemResponse[];
  specialCosts: Array<{
    name: string;
    amount: number;
  }>;
  totalAmount: number;
  totalMargin: number;
  salesperson?: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemResponse {
  productId: string;
  productNumber: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  markingCost: number;
  internalMarkingCost: number;
  selectedColor?: string;
  selectedSize?: string;
  printingMethod?: string;
  showUnitPrice: boolean;
  showTotalPrice: boolean;
  hideMarkingCost: boolean;
  generateMockup: boolean;
}

export interface OrdersListResponse {
  orders: OrderResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UpdateOrderStatusRequest {
  status: "pending" | "processing" | "completed" | "cancelled";
}
