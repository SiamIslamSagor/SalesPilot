import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import authService from "../services/auth.service";
import { signToken } from "../middlewares/auth.middleware";

class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Validation Error",
          errors: errors.array(),
        });
        return;
      }

      const { email, password } = req.body;
      const result = await authService.login({ email, password });

      if (!result.success) {
        res.status(401).json({
          success: false,
          message: result.message,
        });
        return;
      }

      const token = signToken({
        userId: result.user!._id,
        name: result.user!.name,
        email: result.user!.email,
        role: result.user!.role,
      });

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.user,
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Validation Error",
          errors: errors.array(),
        });
        return;
      }

      const { email } = req.body;
      const result = await authService.forgotPassword(email);

      res.status(200).json({
        success: result.success,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Validation Error",
          errors: errors.array(),
        });
        return;
      }

      const { token, password } = req.body;
      const result = await authService.resetPassword(token, password);

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.message,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
