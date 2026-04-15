import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import customerService from "../services/customer.service";
import {
  ICreateCustomerDto,
  IUpdateCustomerDto,
} from "../types/customer.types";

class CustomerController {
  async createCustomer(
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

      const customerData: ICreateCustomerDto = req.body;
      const customer = await customerService.createCustomer(customerData);

      res.status(201).json({
        success: true,
        message: "Customer created successfully",
        data: customer,
      });
    } catch (error) {
      if (error instanceof Error) {
        const msg = error.message;
        if (msg.includes("already exists")) {
          res.status(409).json({ success: false, message: msg });
          return;
        }
      }
      next(error);
    }
  }

  async getCustomerById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const customer = await customerService.getCustomerById(id);

      res.status(200).json({
        success: true,
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllCustomers(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const type = req.query.type as string;
      const search = req.query.search as string;
      const createdAtFrom = req.query.createdAtFrom as string;
      const createdAtTo = req.query.createdAtTo as string;

      const filter: Record<string, unknown> = {};
      if (type) {
        filter.type = type;
      }
      if (search) {
        filter.search = search;
      }
      if (createdAtFrom) {
        filter.createdAtFrom = createdAtFrom;
      }
      if (createdAtTo) {
        filter.createdAtTo = createdAtTo;
      }

      const result = await customerService.getAllCustomers(filter, page, limit);

      res.status(200).json({
        success: true,
        data: result.customers,
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

  async updateCustomer(
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
      const updateData: Partial<IUpdateCustomerDto> = req.body;

      const customer = await customerService.updateCustomer(id, updateData);

      res.status(200).json({
        success: true,
        message: "Customer updated successfully",
        data: customer,
      });
    } catch (error) {
      if (error instanceof Error) {
        const msg = error.message;
        if (msg.includes("already in use") || msg.includes("already exists")) {
          res.status(409).json({
            success: false,
            message: msg,
            errors: [{ field: "businessId", message: msg }],
          });
          return;
        }
        if (msg.includes("not found")) {
          res.status(404).json({ success: false, message: msg });
          return;
        }
      }
      next(error);
    }
  }

  async deleteCustomer(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const customer = await customerService.deleteCustomer(id);

      res.status(200).json({
        success: true,
        message: "Customer deleted successfully",
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  async seedCustomers(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const customers = await customerService.seedDemoCustomers();

      res.status(201).json({
        success: true,
        message: customers.length
          ? "Demo customers seeded successfully"
          : "Customers already exist",
        data: customers,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CustomerController();
