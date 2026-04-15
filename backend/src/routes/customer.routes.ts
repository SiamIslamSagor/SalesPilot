import { Router } from "express";
import customerController from "../controllers/customer.controller";
import {
  createCustomerValidation,
  updateCustomerValidation,
} from "../validators/customer.validator";
import { authenticate } from "../middlewares/auth.middleware";
import { requireManager } from "../middlewares/authorization.middleware";

const router = Router();
router.use(authenticate);
router.use(requireManager);

// Seed demo customers
router.post("/seed", customerController.seedCustomers);

// Create a new customer
router.post("/", createCustomerValidation, customerController.createCustomer);

// Get all customers with pagination
router.get("/", customerController.getAllCustomers);

// Get a single customer by ID
router.get("/:id", customerController.getCustomerById);

// Update a customer
router.put("/:id", updateCustomerValidation, customerController.updateCustomer);

// Delete a customer
router.delete("/:id", customerController.deleteCustomer);

export default router;
