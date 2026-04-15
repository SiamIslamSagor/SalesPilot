import { Router } from "express";
import appSettingsController from "../controllers/appSettings.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireSuperAdmin } from "../middlewares/authorization.middleware";

const router = Router();
router.use(authenticate);
router.use(requireSuperAdmin);

router.get("/", appSettingsController.get);
router.put("/", appSettingsController.update);

export default router;
