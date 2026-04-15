import mongoose, { Schema, Document, Model } from "mongoose";

/* ============================
   Variant Interface
   ============================ */
interface ProductVariant {
  size: string; // Size name
  color?: string; // optional
  colorCode: string; // required
  price?: number; // optional price for this variant
}

/* ============================
   Product Interface
   ============================ */
export interface IProductDocument extends Document {
  productNumber: string;
  name: string;
  brand: string;
  category: string;
  gender: string;
  description: string;
  fabrics: string;
  images: string[];
  purchasePrice: number;
  salesPrice: number;
  margin: number;
  useCustomMargin: boolean;
  status: "active" | "inactive";
  variants: ProductVariant[];
  countryOfOrigin?: string;
}

/* ============================
   Variant Schema
   ============================ */
const ProductVariantSchema = new Schema<ProductVariant>(
  {
    size: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
    },
    colorCode: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
    },
  },
  { _id: false },
);

/* ============================
   Product Schema
   ============================ */
const ProductSchema = new Schema<IProductDocument>(
  {
    productNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    brand: {
      type: String,
      trim: true,
      default: "Unknown",
    },

    category: {
      type: String,
      trim: true,
      default: "Uncategorized",
    },

    gender: {
      type: String,
      trim: true,
      default: "Unisex",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    fabrics: {
      type: String,
      trim: true,
      default: "",
    },

    images: {
      type: [String],
      default: [],
    },

    purchasePrice: {
      type: Number,
      min: 0,
      default: 0,
    },

    salesPrice: {
      type: Number,
      min: 0,
      default: 0,
    },

    margin: {
      type: Number,
      default: 0,
    },

    useCustomMargin: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    variants: {
      type: [ProductVariantSchema],
      required: true,
      default: [],
      validate: {
        validator: (v: ProductVariant[]) => v.length > 0,
        message: "At least one variant is required",
      },
    },

    countryOfOrigin: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

/* ============================
   Hooks
   ============================ */
ProductSchema.pre("save", function (next) {
  this.margin =
    ((this.salesPrice - this.purchasePrice) / this.salesPrice) * 100;
  next();
});

/* ============================
   Indexes
   ============================ */
ProductSchema.index({ productNumber: 1 }, { unique: true });
ProductSchema.index({ name: "text", description: "text" });
ProductSchema.index({ category: 1 });
ProductSchema.index({ gender: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ status: 1 });

/* ============================
   Model Export
   ============================ */
const ProductModel: Model<IProductDocument> =
  mongoose.models.Product ||
  mongoose.model<IProductDocument>("Product", ProductSchema);

export default ProductModel;
