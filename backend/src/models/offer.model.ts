import mongoose, {
  Schema,
  Document,
  Model,
  CallbackWithoutResultAndOptionalError,
} from "mongoose";
import crypto from "crypto";

/* ============================
   Offer Item Interface
   ============================ */
interface OfferItem {
  productId: string;
  productNumber: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  markingCost: number;
  internalMarkingCost: number;
  showUnitPrice: boolean;
  showTotalPrice: boolean;
  hideMarkingCost: boolean;
  generateMockup: boolean;
  mockupImage?: string;
}

interface SpecialCost {
  name: string;
  amount: number;
}

/* ============================
   Offer Details Interface
   ============================ */
interface OfferDetails {
  validUntil?: string;
  validDays?: string;
  showTotalPrice: boolean;
  additionalTermsEnabled: boolean;
  additionalTerms?: string;
  specialCosts?: SpecialCost[];
}

/* ============================
    Customer Comment Interface
    ============================ */
interface CustomerComment {
  comment?: string;
  timestamp: Date;
}

/* ============================
    Offer Interface
    ============================ */
export interface IOfferDocument extends Document {
  offerNumber: string;
  accessCode: string;
  ownerUserId?: string;
  ownerUserName?: string;
  ownerUserEmail?: string;
  customerId: string;
  customerName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  items: OfferItem[];
  offerDetails: OfferDetails;
  totalAmount: number;
  itemCount: number;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired" | "completed";
  customerResponse?: "pending" | "accepted" | "rejected";
  customerComments?: CustomerComment[];
  version: number;
  respondedAt?: Date;
}

/* ============================
   Offer Item Schema
   ============================ */
const OfferItemSchema = new Schema<OfferItem>(
  {
    productId: {
      type: String,
      required: true,
    },
    productNumber: {
      type: String,
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    markingCost: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    internalMarkingCost: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    showUnitPrice: {
      type: Boolean,
      required: true,
      default: true,
    },
    showTotalPrice: {
      type: Boolean,
      required: true,
      default: true,
    },
    hideMarkingCost: {
      type: Boolean,
      required: true,
      default: false,
    },
    generateMockup: {
      type: Boolean,
      required: true,
      default: false,
    },
    mockupImage: {
      type: String,
      default: undefined,
    },
  },
  { _id: false },
);

/* ============================
   Offer Details Schema
   ============================ */
const OfferDetailsSchema = new Schema<OfferDetails>(
  {
    validUntil: {
      type: String,
    },
    validDays: {
      type: String,
    },
    showTotalPrice: {
      type: Boolean,
      required: true,
      default: true,
    },
    additionalTermsEnabled: {
      type: Boolean,
      required: true,
      default: false,
    },
    additionalTerms: {
      type: String,
      trim: true,
    },
    specialCosts: {
      type: [
        new Schema<SpecialCost>(
          {
            name: {
              type: String,
              required: true,
              trim: true,
            },
            amount: {
              type: Number,
              required: true,
              min: 0,
              default: 0,
            },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
  },
  { _id: false },
);

/* ============================
   Offer Schema
   ============================ */
const OfferSchema = new Schema<IOfferDocument>(
  {
    offerNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    accessCode: {
      type: String,
      unique: true,
      index: true,
    },

    ownerUserId: {
      type: String,
      index: true,
    },

    ownerUserName: {
      type: String,
      trim: true,
    },

    ownerUserEmail: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },

    customerId: {
      type: String,
      required: true,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    items: {
      type: [OfferItemSchema],
      required: true,
      validate: {
        validator: (v: OfferItem[]) => v.length > 0,
        message: "At least one item is required",
      },
    },

    offerDetails: {
      type: OfferDetailsSchema,
      required: true,
      default: {},
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    itemCount: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: ["draft", "sent", "accepted", "rejected", "expired", "completed"],
      default: "draft",
    },

    customerResponse: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },

    customerComments: {
      type: [
        {
          comment: {
            type: String,
            trim: true,
            required: false,
          },
          timestamp: {
            type: Date,
            required: true,
          },
        },
      ],
      default: [],
    },

    version: {
      type: Number,
      default: 1,
    },

    respondedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

/* ============================
   Indexes
   ============================ */
OfferSchema.index({ offerNumber: 1 }, { unique: true });
OfferSchema.index({ accessCode: 1 }, { unique: true });
OfferSchema.index({ ownerUserId: 1, createdAt: -1 });
OfferSchema.index({ customerId: 1 });
OfferSchema.index({ status: 1 });
OfferSchema.index({ createdAt: -1 });
// Compound index for status-filtered listing sorted by date
OfferSchema.index({ status: 1, createdAt: -1 });
// Compound index for owner + status filtered listing
OfferSchema.index({ ownerUserId: 1, status: 1, createdAt: -1 });
// Compound indexes for customer-status and owner-email-status queries
OfferSchema.index({ customerId: 1, status: 1 });
OfferSchema.index({ ownerUserEmail: 1, status: 1 });
// Text index for search queries on offerNumber / customerName
OfferSchema.index({ offerNumber: "text", customerName: "text" });

// Auto-generate accessCode before saving if not present
OfferSchema.pre(
  "save",
  function (this: IOfferDocument, next: CallbackWithoutResultAndOptionalError) {
    if (!this.accessCode) {
      this.accessCode = crypto.randomBytes(32).toString("hex");
    }
    next();
  },
);

/* ============================
   Model Export
   ============================ */
const OfferModel: Model<IOfferDocument> =
  mongoose.models.Offer || mongoose.model<IOfferDocument>("Offer", OfferSchema);

export default OfferModel;
