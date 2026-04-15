import { Router } from "express";
import emailTemplateController from "../controllers/emailTemplate.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireSuperAdmin } from "../middlewares/authorization.middleware";

const router = Router();
router.use(authenticate);
router.use(requireSuperAdmin);

// Get all email templates
router.get("/", emailTemplateController.getAll);

// Get a single template by key
router.get("/:key", emailTemplateController.getByKey);

// Update a template
router.put("/:key", emailTemplateController.update);

// Reset a template to factory default
router.post("/:key/reset", emailTemplateController.resetToDefault);

export default router;
