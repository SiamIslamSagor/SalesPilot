import mongoose from "mongoose";

let cachedConnection: typeof mongoose | null = null;

const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.DATABASE_URL;

    if (!mongoUri) {
      throw new Error("DATABASE_URL environment variable is not defined");
    }

    // Reuse existing connection if available (serverless optimization)
    if (cachedConnection && mongoose.connection.readyState === 1) {
      console.log("🔄 Using cached MongoDB connection");
      return;
    }

    const options = {
      autoIndex: true,
      maxPoolSize: 10, // Connection pooling for serverless
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(mongoUri, options);
    cachedConnection = mongoose;
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    // Throw error instead of process.exit for serverless compatibility
    throw error;
  }
};

const disconnectDatabase = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      cachedConnection = null;
      console.log("MongoDB disconnected successfully");
    }
  } catch (error) {
    console.error("Error disconnecting from MongoDB:", error);
  }
};

export { connectDatabase, disconnectDatabase };
