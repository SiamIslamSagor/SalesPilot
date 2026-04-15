import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import costConfigService from "../services/costConfig.service";

class CostConfigController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await costConfigService.getAll();
      res.status(200).json({
        success: true,
        data: items,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const item = await costConfigService.getById(req.params.id);
      res.status(200).json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
        return;
      }
      const { name, type, value, category, enabled, sortOrder } = req.body;
      const item = await costConfigService.create({
        name,
        type,
        value,
        category,
        enabled,
        sortOrder,
      });
      res.status(201).json({
        success: true,
        message: "Cost config item created",
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
        return;
      }
      const { name, type, value, category, enabled, sortOrder } = req.body;
      const item = await costConfigService.update(req.params.id, {
        name,
        type,
        value,
        category,
        enabled,
        sortOrder,
      });
      res.status(200).json({
        success: true,
        message: "Cost config item updated",
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await costConfigService.delete(req.params.id);
      res.status(200).json({
        success: true,
        message: "Cost config item deleted",
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkSave(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
        return;
      }
      const { items } = req.body;
      const result = await costConfigService.bulkSave(items);
      res.status(200).json({
        success: true,
        message: "Cost config items saved",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CostConfigController();
