import { Router } from "express";
import productController from "../controllers/product.controller";
import upload from "../middlewares/multer.middleware";
import { handleMulterError } from "../middlewares/multer.middleware";
import { authenticate } from "../middlewares/auth.middleware";
import { requireManager } from "../middlewares/authorization.middleware";

const router = Router();
router.use(authenticate);
router.use(requireManager);

/**
 * @route   POST /api/products/import
 * @desc    Import products from Excel file
 * @access  Public (or add authentication middleware as needed)
 */
router.post(
  "/import",
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      handleMulterError(err, req, res, next);
    });
  },
  productController.importProducts,
);

/**
 * @route   GET /api/products
 * @desc    Get all products
 * @access  Public (or add authentication middleware as needed)
 */
router.get("/", productController.getAllProducts);

/**
 * @route   GET /api/products/categories
 * @desc    Get all distinct categories
 * @access  Public (or add authentication middleware as needed)
 */
router.get("/categories", productController.getCategories);

/**
 * @route   GET /api/products/brands
 * @desc    Get all distinct brands
 * @access  Public (or add authentication middleware as needed)
 */
router.get("/brands", productController.getBrands);

/**
 * @route   GET /api/products/genders
 * @desc    Get all distinct genders
 * @access  Public (or add authentication middleware as needed)
 */
router.get("/genders", productController.getGenders);

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Public (or add authentication middleware as needed)
 */
router.get("/:id", productController.getProductById);

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Public (or add authentication middleware as needed)
 */
router.post("/", productController.createProduct);

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product
 * @access  Public (or add authentication middleware as needed)
 */
router.put("/:id", productController.updateProduct);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product
 * @access  Public (or add authentication middleware as needed)
 */
router.delete("/:id", productController.deleteProduct);

export default router;
