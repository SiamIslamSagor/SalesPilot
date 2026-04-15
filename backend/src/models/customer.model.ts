import mongoose, { Schema, Model } from "mongoose";
import { ICustomerDocument } from "../types/customer.types";

const customerSchema: Schema<ICustomerDocument> = new Schema(
  {
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      minlength: [2, "Company name must be at least 2 characters"],
      maxlength: [200, "Company name cannot exceed 200 characters"],
    },
    businessId: {
      type: String,
      trim: true,
      sparse: true,
    },
    contactPerson: {
      type: String,
      required: [true, "Contact person is required"],
      trim: true,
      minlength: [2, "Contact person must be at least 2 characters"],
      maxlength: [100, "Contact person cannot exceed 100 characters"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
      maxlength: [500, "Address cannot exceed 500 characters"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      minlength: [2, "City must be at least 2 characters"],
      maxlength: [100, "City cannot exceed 100 characters"],
    },
    postcode: {
      type: String,
      required: [true, "Postcode is required"],
      trim: true,
      minlength: [2, "Postcode must be at least 2 characters"],
      maxlength: [20, "Postcode cannot exceed 20 characters"],
    },
    country: {
      type: String,
      default: "",
      trim: true,
      maxlength: [100, "Country cannot exceed 100 characters"],
    },
    notes: {
      type: String,
      default: "",
      maxlength: [5000, "Notes cannot exceed 5000 characters"],
    },
    companyLogo: {
      type: String,
      default: "",
    },
    totalSales: {
      type: Number,
      default: 0,
      min: [0, "Total sales cannot be negative"],
    },
    totalMargin: {
      type: Number,
      default: 0,
      min: [0, "Total margin cannot be negative"],
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: [0, "Discount percent cannot be negative"],
      max: [100, "Discount percent cannot exceed 100"],
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for query performance
customerSchema.index({ createdAt: -1 }); // list sort
customerSchema.index({ companyName: 1 }); // name search / sort
customerSchema.index({ email: 1 }); // email lookup
customerSchema.index({ businessId: 1 }, { sparse: true }); // unique-ish lookup
customerSchema.index({ totalSales: -1 }); // dashboard stats sort
customerSchema.index(
  {
    companyName: "text",
    contactPerson: "text",
    businessId: "text",
    email: "text",
    city: "text",
  },
  { name: "customer_text_search" },
);

const Customer: Model<ICustomerDocument> =
  mongoose.models.Customer ||
  mongoose.model<ICustomerDocument>("Customer", customerSchema);

export default Customer;
