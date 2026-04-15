import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import userService from "../services/user.service";
import { ICreateUserDto } from "../types/user.types";

class UserController {
  async createUser(
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
          errors: errors.array(),
        });
        return;
      }

      const userData: ICreateUserDto = req.body;
      const user = await userService.createUser(userData);

      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllUsers(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const role = req.query.role as string;

      const filter: Record<string, unknown> = {};
      if (role) {
        filter.role = role;
      }

      const result = await userService.getAllUsers(filter, page, limit);

      res.status(200).json({
        success: true,
        data: result.users,
        pagination: {
          total: result.total,
          page: result.page,
          pages: result.pages,
          limit,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errors: errors.array(),
        });
        return;
      }

      const { id } = req.params;
      const updateData: Partial<ICreateUserDto> = req.body;

      const user = await userService.updateUser(id, updateData);

      res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const user = await userService.deleteUser(id);

      res.status(200).json({
        success: true,
        message: "User deleted successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
