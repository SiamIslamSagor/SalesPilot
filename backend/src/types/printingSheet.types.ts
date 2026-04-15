export interface CreatePrintingSheetRequest {
  offerId: string;
  orderId?: string;
  sheets: Array<{
    productId: string;
    productNumber: string;
    productName: string;
    productImage?: string;
    orderDate: string;
    reference: string;
    seller: string;
    deliveryDate: string;
    deliveryTime: string;
    customerName: string;
    printMethod: string;
    printMethodOther?: string;
    sizeQuantities: Record<string, string>;
    workInstructions?: string;
    totalQuantity: number;
    groupId?: string; // groups sheets created together for multi-page PDF
  }>;
}

export interface PrintingSheetResponse {
  _id: string;
  productId: string;
  productNumber: string;
  productName: string;
  productImage?: string;
  orderDate: string;
  reference: string;
  seller: string;
  deliveryDate: string;
  deliveryTime: string;
  customerName: string;
  printMethod: string;
  printMethodOther?: string;
  sizeQuantities: Record<string, string>;
  workInstructions: string;
  totalQuantity: number;
  offerId: string;
  orderId?: string;
  groupId?: string; // groups sheets created together for multi-page PDF
  createdAt: string;
  updatedAt: string;
}

export interface GetPrintingSheetsResponse {
  success: boolean;
  data: PrintingSheetResponse[];
}
