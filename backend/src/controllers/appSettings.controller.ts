import { Request, Response, NextFunction } from "express";
import appSettingsService from "../services/appSettings.service";

class AppSettingsController {
  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await appSettingsService.get();
      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        customMarginPercentage,
        marginMode,
        globalAdminEmail,
        ccGlobalAdmin,
      } = req.body;

      if (
        customMarginPercentage !== undefined &&
        (typeof customMarginPercentage !== "number" ||
          customMarginPercentage < 0 ||
          customMarginPercentage > 100)
      ) {
        res.status(400).json({
          success: false,
          message: "customMarginPercentage must be a number between 0 and 100",
        });
        return;
      }

      if (
        marginMode !== undefined &&
        !["fallback", "override"].includes(marginMode)
      ) {
        res.status(400).json({
          success: false,
          message: "marginMode must be 'fallback' or 'override'",
        });
        return;
      }

      if (
        globalAdminEmail !== undefined &&
        typeof globalAdminEmail !== "string"
      ) {
        res.status(400).json({
          success: false,
          message: "globalAdminEmail must be a string",
        });
        return;
      }

      if (ccGlobalAdmin !== undefined && typeof ccGlobalAdmin !== "boolean") {
        res.status(400).json({
          success: false,
          message: "ccGlobalAdmin must be a boolean",
        });
        return;
      }

      const settings = await appSettingsService.update({
        customMarginPercentage,
        marginMode,
        globalAdminEmail,
        ccGlobalAdmin,
      });
      res.status(200).json({
        success: true,
        message: "Settings updated",
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AppSettingsController();
