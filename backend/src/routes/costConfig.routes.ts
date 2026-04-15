import { Router } from "express";
import costConfigController from "../controllers/costConfig.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireManager } from "../middlewares/authorization.middleware";
import {
  createCostConfigValidation,
  updateCostConfigValidation,
  bulkSaveCostConfigValidation,
} from "../validators/costConfig.validator";

const router = Router();
router.use(authenticate);
router.use(requireManager);

// Get all cost config items
router.get("/", costConfigController.getAll);

// Bulk save (upsert) all cost config items — must be before /:id
router.post(
  "/bulk-save",
  bulkSaveCostConfigValidation,
  costConfigController.bulkSave,
);

// Create a new cost config item
router.post("/", createCostConfigValidation, costConfigController.create);

// Get single cost config item
router.get("/:id", costConfigController.getById);

// Update a cost config item
router.put("/:id", updateCostConfigValidation, costConfigController.update);

// Delete a cost config item
router.delete("/:id", costConfigController.delete);

export default router;
