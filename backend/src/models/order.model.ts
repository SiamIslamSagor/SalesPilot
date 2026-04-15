import mongoose, { Schema, Document } from "mongoose";

export interface IOrderItem {
  productId: string;
  productNumber: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  markingCost: number;
  internalMarkingCost: number;
  selectedColor?: string;
  selectedSize?: string;
  printingMethod?: string;
  showUnitPrice: boolean;
  showTotalPrice: boolean;
  hideMarkingCost: boolean;
  generateMockup: boolean;
}

export interface IOrderSpecialCost {
  name: string;
  amount: number;
}

export interface IOrderAppliedCostConfig {
  name: string;
  type: "fixed" | "percentage";
  category: "cost" | "margin";
  value: number;
  calculatedAmount: number;
}

export interface IOrder extends Document {
  orderNumber: string;
  offerId: string; // Reference to the Offer
  offerNumber: string;
  ownerUserId?: string;
  ownerUserName?: string;
  ownerUserEmail?: string;
  customerId: string;
  customerName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  items: IOrderItem[];
  specialCosts: IOrderSpecialCost[];
  appliedCostConfig: IOrderAppliedCostConfig[];
  totalAmount: number;
  totalMargin: number;
  costConfigAdjustment: number;
  salesperson?: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  productId: { type: String, required: true },
  productNumber: { type: String, required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  markingCost: { type: Number, default: 0 },
  internalMarkingCost: { type: Number, default: 0 },
  selectedColor: { type: String },
  selectedSize: { type: String },
  printingMethod: { type: String },
  showUnitPrice: { type: Boolean, default: true },
  showTotalPrice: { type: Boolean, default: true },
  hideMarkingCost: { type: Boolean, default: false },
  generateMockup: { type: Boolean, default: false },
});

const OrderSpecialCostSchema = new Schema<IOrderSpecialCost>(
  {
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false },
);

const OrderAppliedCostConfigSchema = new Schema<IOrderAppliedCostConfig>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: ["fixed", "percentage"] },
    category: { type: String, required: true, enum: ["cost", "margin"] },
    value: { type: Number, required: true },
    calculatedAmount: { type: Number, required: true },
  },
  { _id: false },
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    offerId: { type: String, required: true },
    offerNumber: { type: String, default: "" },
    ownerUserId: { type: String, index: true },
    ownerUserName: { type: String },
    ownerUserEmail: { type: String, lowercase: true, index: true },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    contactPerson: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    items: [OrderItemSchema],
    specialCosts: { type: [OrderSpecialCostSchema], default: [] },
    appliedCostConfig: { type: [OrderAppliedCostConfigSchema], default: [] },
    totalAmount: { type: Number, required: true },
    totalMargin: { type: Number, required: true },
    costConfigAdjustment: { type: Number, default: 0 },
    salesperson: { type: String },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for performance
OrderSchema.index({ customerId: 1 });
OrderSchema.index({ ownerUserId: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
// Compound indexes for offer-lookup and customer-status queries
OrderSchema.index({ offerId: 1 });
OrderSchema.index({ customerId: 1, status: 1 });

export default mongoose.model<IOrder>("Order", OrderSchema);
