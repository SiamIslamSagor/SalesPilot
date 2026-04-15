import mongoose, { Schema, Document } from "mongoose";

export interface IAppSettings {
  customMarginPercentage: number;
  marginMode: "fallback" | "override";
  globalAdminEmail: string;
  ccGlobalAdmin: boolean;
}

export interface IAppSettingsDocument extends IAppSettings, Document {}

const appSettingsSchema: Schema<IAppSettingsDocument> = new Schema(
  {
    customMarginPercentage: {
      type: Number,
      default: 0,
      min: [0, "Margin percentage cannot be negative"],
      max: [100, "Margin percentage cannot exceed 100"],
    },
    marginMode: {
      type: String,
      enum: ["fallback", "override"],
      default: "fallback",
    },
    globalAdminEmail: {
      type: String,
      trim: true,
      default: "",
    },
    ccGlobalAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const AppSettings = mongoose.model<IAppSettingsDocument>(
  "AppSettings",
  appSettingsSchema,
);

export default AppSettings;
