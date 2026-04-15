import { Router } from "express";
import printingSheetController from "../controllers/printingSheet.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireManager } from "../middlewares/authorization.middleware";

const router = Router();
router.use(authenticate);

// POST /api/printingsheets
router.post("/", requireManager, printingSheetController.createSheets);
// GET sheets by offer
router.get("/offer/:offerId", printingSheetController.getByOfferId);
// GET sheets by order
router.get("/order/:orderId", printingSheetController.getByOrderId);
// GET sheets for multiple orders in one request: ?orderIds=id1,id2,...
router.get("/orders/batch", printingSheetController.getByOrderIds);
// DELETE sheets by group
router.delete("/group/:groupId", requireManager, printingSheetController.deleteGroup);

export default router;
