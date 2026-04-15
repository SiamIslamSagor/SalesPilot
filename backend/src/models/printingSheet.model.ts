import mongoose, { Schema, Document } from "mongoose";

export interface IPrintingSheet extends Document {
  productId: string;
  productNumber: string;
  productName: string;
  productImage?: string; // url of product image at time of sheet creation
  mockupImage?: string; // url of mockup image (product with logo) if available
  orderDate: string;
  reference: string;
  seller: string;
  deliveryDate: string;
  deliveryTime: string;
  customerName: string;
  printMethod: string;
  printMethodOther: string;
  sizeQuantities: Record<string, string>;
  workInstructions: string;
  totalQuantity: number;
  offerId: string;
  orderId?: string;
  groupId?: string; // tracks sheets created together as a group for multi-page PDF
}

const PrintingSheetSchema = new Schema<IPrintingSheet>(
  {
    productId: { type: String, required: true },
    productNumber: { type: String, required: true },
    productName: { type: String, required: true },
    productImage: { type: String },
    mockupImage: { type: String },
    orderDate: { type: String, required: true },
    reference: { type: String, required: true },
    seller: { type: String, required: true },
    deliveryDate: { type: String, required: true },
    deliveryTime: { type: String, required: true },
    customerName: { type: String, required: true },
    printMethod: { type: String, required: true },
    printMethodOther: { type: String },
    sizeQuantities: { type: Schema.Types.Mixed, required: true },
    workInstructions: { type: String }, // optional now
    totalQuantity: { type: Number, required: true },
    offerId: { type: String, required: true, index: true },
    orderId: { type: String, index: true },
    groupId: { type: String, index: true }, // groups sheets created together for multi-page PDF
  },
  { timestamps: true },
);

// compute totalQuantity before save if not provided
PrintingSheetSchema.pre<IPrintingSheet>("save", function (next) {
  if (this.isModified("sizeQuantities") || this.isNew) {
    const qtys = this.sizeQuantities || {};
    this.totalQuantity = Object.values(qtys).reduce(
      (sum: number, v: string) => sum + (parseInt(v) || 0),
      0,
    );
  }
  next();
});

export default mongoose.models.PrintingSheet ||
  mongoose.model<IPrintingSheet>("PrintingSheet", PrintingSheetSchema);
