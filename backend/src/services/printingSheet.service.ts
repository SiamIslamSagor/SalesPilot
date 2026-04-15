import printingSheetRepository from "../repositories/printingSheet.repository";
import offerRepository from "../repositories/offer.repository";
import orderRepository from "../repositories/order.repository";
import { AppError as ApiError } from "../middlewares/errorHandler.middleware";
import { IPrintingSheet } from "../models/printingSheet.model";
import { UpdateWriteOpResult } from "mongoose";

export interface PrintingSheetInput {
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
}

export class PrintingSheetService {
  async createPrintingSheets(data: {
    offerId: string;
    orderId?: string;
    sheets: PrintingSheetInput[];
  }): Promise<IPrintingSheet[]> {
    // check that offer exists
    const offer = await offerRepository.findById(data.offerId);
    if (!offer) {
      throw new ApiError("Offer not found", 404);
    }

    // if orderId provided, ensure order exists
    if (data.orderId) {
      const order = await orderRepository.findById(data.orderId);
      if (!order) {
        throw new ApiError("Order not found", 404);
      }
      if (order.offerId !== data.offerId) {
        throw new ApiError("Order does not belong to the specified offer", 400);
      }
    }

    // map to documents (preserve image and groupId if provided)
    const docs = data.sheets.map((s) => ({
      ...s,
      productImage: s.productImage,
      offerId: data.offerId,
      orderId: data.orderId,
      groupId: s.groupId, // preserve groupId for multi-page PDF grouping
    }));

    const created = await printingSheetRepository.createMany(
      docs as Partial<IPrintingSheet>[],
    );
    return created;
  }

  async getSheetsByOffer(offerId: string): Promise<IPrintingSheet[]> {
    return printingSheetRepository.findByOfferId(offerId);
  }

  async getSheetsByOrder(orderId: string): Promise<IPrintingSheet[]> {
    return printingSheetRepository.findByOrderId(orderId);
  }

  async deleteSheetsByGroup(groupId: string): Promise<number> {
    const result = await printingSheetRepository.deleteByGroupId(groupId);
    return result.deletedCount || 0;
  }

  async linkSheetsToOrder(
    offerId: string,
    orderId: string,
  ): Promise<UpdateWriteOpResult> {
    return printingSheetRepository.updateOrderIdByOfferId(offerId, orderId);
  }
}

export default new PrintingSheetService();
