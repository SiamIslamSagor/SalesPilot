import express, { Application, Request, Response } from "express";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import userRoutes from "./routes/user.routes";
import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import customerRoutes from "./routes/customer.routes";
import offerRoutes from "./routes/offer.routes";
import orderRoutes from "./routes/order.routes";
import printingSheetRoutes from "./routes/printingSheet.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import emailTemplateRoutes from "./routes/emailTemplate.routes";
import appSettingsRoutes from "./routes/appSettings.routes";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/errorHandler.middleware";

const app: Application = express();

/* ----------- MIDDLEWARE / PARSERS ----------- */
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: "10mb" }));
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:8080",
  "http://localhost:5173",
].filter(Boolean) as string[];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

/* ----------- ROUTES ----------- */
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/email-templates", emailTemplateRoutes);
app.use("/api/app-settings", appSettingsRoutes);

// printing sheet route
app.use("/api/printingsheets", printingSheetRoutes);

/* ----------- HEALTH CHECK ----------- */
app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

/* ----------- ERROR HANDLING ----------- */
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
