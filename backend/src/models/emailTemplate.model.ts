import mongoose, { Schema, Document } from "mongoose";

export interface IEmailTemplate {
  templateKey: string;
  subject: string;
  htmlBody: string;
  enabled: boolean;
  description?: string;
  recipientEmail?: string;
}

export interface IEmailTemplateDocument extends IEmailTemplate, Document {}

const emailTemplateSchema: Schema<IEmailTemplateDocument> = new Schema(
  {
    templateKey: {
      type: String,
      required: [true, "Template key is required"],
      unique: true,
      trim: true,
      enum: [
        "password_reset",
        "offer_sent",
        "order_confirmation",
        "order_status_update",
        "offer_accepted_admin",
        "offer_rejected_admin",
        "offer_accepted_customer",
        "offer_rejected_customer",
      ],
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      maxlength: [500, "Subject cannot exceed 500 characters"],
    },
    htmlBody: {
      type: String,
      required: [true, "HTML body is required"],
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
    },
    recipientEmail: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const EmailTemplate = mongoose.model<IEmailTemplateDocument>(
  "EmailTemplate",
  emailTemplateSchema,
);

export default EmailTemplate;
