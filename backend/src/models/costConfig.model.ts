import mongoose, { Schema, Document } from "mongoose";

export interface ICostConfig {
  name: string;
  type: "fixed" | "percentage";
  value: number;
  category: "cost" | "margin";
  enabled: boolean;
  sortOrder: number;
}

export interface ICostConfigDocument extends ICostConfig, Document {}

const costConfigSchema: Schema<ICostConfigDocument> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [200, "Name cannot exceed 200 characters"],
    },
    type: {
      type: String,
      required: [true, "Type is required"],
      enum: ["fixed", "percentage"],
    },
    value: {
      type: Number,
      required: [true, "Value is required"],
      default: 0,
      min: [0, "Value cannot be negative"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["cost", "margin"],
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

costConfigSchema.index({ enabled: 1 });
costConfigSchema.index({ sortOrder: 1 });

const CostConfig = mongoose.model<ICostConfigDocument>(
  "CostConfig",
  costConfigSchema,
);

export default CostConfig;
