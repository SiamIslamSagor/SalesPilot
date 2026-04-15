import { Request, Response, NextFunction } from "express";
import emailTemplateService from "../services/emailTemplate.service";

class EmailTemplateController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const templates = await emailTemplateService.getAllTemplates();
      res.status(200).json({
        success: true,
        data: templates,
      });
    } catch (error) {
      next(error);
    }
  }

  async getByKey(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { key } = req.params;
      const template = await emailTemplateService.getByKey(key);
      res.status(200).json({
        success: true,
        data: template,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { key } = req.params;
      const { subject, htmlBody, enabled, recipientEmail } = req.body;
      const template = await emailTemplateService.updateTemplate(key, {
        subject,
        htmlBody,
        enabled,
        recipientEmail,
      });
      res.status(200).json({
        success: true,
        message: "Template updated successfully",
        data: template,
      });
    } catch (error) {
      next(error);
    }
  }

  async resetToDefault(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { key } = req.params;
      const template = await emailTemplateService.resetToDefault(key);
      res.status(200).json({
        success: true,
        message: "Template reset to default",
        data: template,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new EmailTemplateController();
