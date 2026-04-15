import mongoose, { DeleteResult, UpdateWriteOpResult } from "mongoose";
import { IPrintingSheet } from "../models/printingSheet.model";

export class PrintingSheetRepository {
  async create(data: Partial<IPrintingSheet>): Promise<IPrintingSheet> {
    const PrintingSheet = (await import("../models/printingSheet.model"))
      .default;
    const sheet = new PrintingSheet(data);
    return sheet.save();
  }

  async createMany(
    sheets: Array<Partial<IPrintingSheet>>,
  ): Promise<IPrintingSheet[]> {
    const PrintingSheet = (await import("../models/printingSheet.model"))
      .default;
    return PrintingSheet.insertMany(sheets);
  }

  async findByOfferId(offerId: string): Promise<IPrintingSheet[]> {
    const PrintingSheet = (await import("../models/printingSheet.model"))
      .default;
    return PrintingSheet.find({ offerId }).exec();
  }

  async findByOrderId(orderId: string): Promise<IPrintingSheet[]> {
    const PrintingSheet = (await import("../models/printingSheet.model"))
      .default;
    return PrintingSheet.find({ orderId }).exec();
  }

  async findByOrderIds(orderIds: string[]): Promise<IPrintingSheet[]> {
    const PrintingSheet = (await import("../models/printingSheet.model"))
      .default;
    if (orderIds.length === 0) return [];
    return PrintingSheet.find({ orderId: { $in: orderIds } }).exec();
  }

  async findByGroupIdOrId(groupId: string): Promise<IPrintingSheet[]> {
    const PrintingSheet = (await import("../models/printingSheet.model"))
      .default;
    const filters: Array<Record<string, unknown>> = [{ groupId }];
    if (mongoose.Types.ObjectId.isValid(groupId)) {
      filters.push({ _id: new mongoose.Types.ObjectId(groupId) });
    }
    return PrintingSheet.find({
      $or: filters,
    });
  }

  async updateOrderIdByOfferId(
    offerId: string,
    orderId: string,
  ): Promise<UpdateWriteOpResult> {
    const PrintingSheet = (await import("../models/printingSheet.model"))
      .default;
    return PrintingSheet.updateMany({ offerId }, { orderId });
  }

  async deleteByGroupId(groupId: string): Promise<DeleteResult> {
    const PrintingSheet = (await import("../models/printingSheet.model"))
      .default;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filters: Array<Record<string, any>> = [{ groupId }];
    if (mongoose.Types.ObjectId.isValid(groupId)) {
      filters.push({ _id: new mongoose.Types.ObjectId(groupId) });
    }
    return PrintingSheet.deleteMany({
      $or: filters,
    });
  }
}

export default new PrintingSheetRepository();
