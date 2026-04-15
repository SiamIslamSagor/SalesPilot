import { Request, Response, NextFunction } from "express";
import printingSheetService, {
  PrintingSheetInput,
} from "../services/printingSheet.service";
import { AppError as ApiError } from "../middlewares/errorHandler.middleware";
import offerRepository from "../repositories/offer.repository";
import orderRepository from "../repositories/order.repository";
import printingSheetRepository from "../repositories/printingSheet.repository";
import { canAccessOwnedEntity } from "../utils/ownership";

const ensureOfferAccess = async (req: Request, offerId: string) => {
  const offer = await offerRepository.findById(offerId);
  if (!offer) {
    throw new ApiError("Offer not found", 404);
  }
  if (!canAccessOwnedEntity(req.user, offer)) {
    throw new ApiError(
      "You do not have permission to access these printing sheets",
      403,
    );
  }

  return offer;
};

const ensureOrderAccess = async (req: Request, orderId: string) => {
  const order = await orderRepository.findById(orderId);
  if (!order) {
    throw new ApiError("Order not found", 404);
  }
  if (!canAccessOwnedEntity(req.user, order)) {
    throw new ApiError(
      "You do not have permission to access these printing sheets",
      403,
    );
  }

  return order;
};

class PrintingSheetController {
  async createSheets(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { offerId, orderId, sheets } = req.body as {
        offerId: string;
        orderId?: string;
        sheets: PrintingSheetInput[];
      };

      if (!offerId || !Array.isArray(sheets) || sheets.length === 0) {
        throw new ApiError("Invalid request data", 400);
      }

      await ensureOfferAccess(req, offerId);
      if (orderId) {
        await ensureOrderAccess(req, orderId);
      }

      const result = await printingSheetService.createPrintingSheets({
        offerId,
        orderId,
        sheets,
      });

      res.status(201).json({
        success: true,
        data: result,
        message: "Printing sheets saved",
      });
    } catch (error) {
      next(error);
    }
  }

  async getByOfferId(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { offerId } = req.params;
      await ensureOfferAccess(req, offerId);
      const sheets = await printingSheetService.getSheetsByOffer(offerId);
      res.json({ success: true, data: sheets });
    } catch (error) {
      next(error);
    }
  }

  async getByOrderId(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { orderId } = req.params;
      await ensureOrderAccess(req, orderId);
      const sheets = await printingSheetService.getSheetsByOrder(orderId);
      res.json({ success: true, data: sheets });
    } catch (error) {
      next(error);
    }
  }

  async getByOrderIds(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { orderIds } = req.query;
      if (!orderIds || typeof orderIds !== "string") {
        throw new ApiError("orderIds query param is required", 400);
      }
      const ids = orderIds.split(",").filter(Boolean);
      if (ids.length === 0) {
        res.json({ success: true, data: {} });
        return;
      }
      // Verify access for each unique order (skip inaccessible ones rather than 403)
      const accessibleIds: string[] = [];
      for (const id of ids) {
        try {
          await ensureOrderAccess(req, id);
          accessibleIds.push(id);
        } catch {
          // skip inaccessible
        }
      }
      const sheets =
        await printingSheetRepository.findByOrderIds(accessibleIds);
      // Group by orderId for easy client-side lookup
      const grouped: Record<string, typeof sheets> = {};
      for (const sheet of sheets) {
        const oid = sheet.orderId as string;
        if (!grouped[oid]) grouped[oid] = [];
        grouped[oid].push(sheet);
      }
      res.json({ success: true, data: grouped });
    } catch (error) {
      next(error);
    }
  }

  async deleteGroup(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { groupId } = req.params;
      if (!groupId) {
        throw new ApiError("Group ID is required", 400);
      }
      const sheets = await printingSheetRepository.findByGroupIdOrId(groupId);
      if (sheets.length === 0) {
        throw new ApiError("Printing sheets not found", 404);
      }

      const orderIds = [
        ...new Set(sheets.map((sheet) => sheet.orderId).filter(Boolean)),
      ];
      const offerIds = [
        ...new Set(sheets.map((sheet) => sheet.offerId).filter(Boolean)),
      ];

      for (const orderId of orderIds) {
        await ensureOrderAccess(req, orderId as string);
      }
      for (const offerId of offerIds) {
        await ensureOfferAccess(req, offerId as string);
      }

      const deletedCount =
        await printingSheetService.deleteSheetsByGroup(groupId);
      res.json({
        success: true,
        deletedCount,
        message: "Printing sheets deleted",
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PrintingSheetController();
