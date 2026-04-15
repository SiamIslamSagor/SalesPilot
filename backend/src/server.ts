import "dotenv/config";
import app from "./app";
import { connectDatabase } from "./utils/database";

const PORT = process.env.PORT || 5000;

async function main() {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

main();
