import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL,
  resend_api_key: process.env.RESEND_API_KEY,
  email_from: process.env.EMAIL_FROM,
  frontend_url: process.env.FRONTEND_URL,
  jwt_secret: process.env.JWT_SECRET,
};
