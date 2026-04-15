import { Router } from "express";
import userController from "../controllers/user.controller";
import { createUserValidation } from "../validators/user.validator";
import { authenticate } from "../middlewares/auth.middleware";
import { requireSuperAdmin } from "../middlewares/authorization.middleware";

const router = Router();
router.use(authenticate);
router.use(requireSuperAdmin);

// Create a new user
router.post("/", createUserValidation, userController.createUser);

// Get all users with pagination
router.get("/", userController.getAllUsers);

// Get a single user by ID
router.get("/:id", userController.getUserById);

// Update a user
router.put("/:id", userController.updateUser);

// Delete a user
router.delete("/:id", userController.deleteUser);

export default router;
