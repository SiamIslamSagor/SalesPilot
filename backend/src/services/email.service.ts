/* eslint-disable no-console */
import { Resend } from "resend";
import EmailTemplate from "../models/emailTemplate.model";
import { defaultTemplates } from "./emailTemplateDefaults.service";
import AppSettings from "../models/appSettings.model";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Escape HTML special characters to prevent XSS in email templates.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Load template HTML from DB, falling back to hardcoded default.
 * Returns null if the template has been explicitly disabled by the user.
 */
async function loadTemplate(templateKey: string): Promise<{
  subject: string;
  htmlBody: string;
  recipientEmail?: string;
} | null> {
  console.log(`[loadTemplate] Loading template: ${templateKey}`);
  try {
    const doc = await EmailTemplate.findOne({ templateKey });
    if (doc) {
      console.log(
        `[loadTemplate] Found in DB — enabled: ${doc.enabled}, recipientEmail: "${doc.recipientEmail || ""}"`,
      );
      // Template exists in DB — respect the enabled flag
      if (!doc.enabled) {
        console.log(
          `[loadTemplate] Template ${templateKey} is DISABLED — returning null`,
        );
        return null;
      }
      return {
        subject: doc.subject,
        htmlBody: doc.htmlBody,
        recipientEmail: doc.recipientEmail,
      };
    }
    console.log(`[loadTemplate] Not found in DB, using hardcoded default`);
  } catch (err) {
    console.error(`[loadTemplate] DB error:`, err);
    // DB might not be reachable during early boot — fall through
  }
  // No DB record yet — use hardcoded default
  const fallback = defaultTemplates.find((d) => d.templateKey === templateKey);
  if (!fallback) {
    console.log(`[loadTemplate] No default found for ${templateKey}`);
  }
  return fallback
    ? {
        subject: fallback.subject,
        htmlBody: fallback.htmlBody,
        recipientEmail: fallback.recipientEmail,
      }
    : null;
}

/**
 * Simple {{key}} replacement in a string.
 */
function interpolate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((html, [key, value]) => {
    // First, replace any wrapper row: <tr><td ...>{{key}}</td></tr>
    const rowPattern = new RegExp(
      `<tr><td[^>]*>\\{\\{${key}\\}\\}</td></tr>`,
      "g",
    );
    const replaced = html.replace(rowPattern, value ?? "");
    // Then replace any remaining inline {{key}} occurrences
    return replaced.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value ?? "");
  }, template);
}

/**
 * Fetch global admin CC email if ccGlobalAdmin is enabled and email is set.
 * Returns the email string or undefined.
 */
async function getGlobalAdminCc(): Promise<string | undefined> {
  try {
    const settings = await AppSettings.findOne();
    console.log("[getGlobalAdminCc] Settings found:", {
      ccGlobalAdmin: settings?.ccGlobalAdmin,
      globalAdminEmail: settings?.globalAdminEmail,
    });
    if (settings?.ccGlobalAdmin && settings.globalAdminEmail?.trim()) {
      const email = settings.globalAdminEmail.trim();
      console.log(`[getGlobalAdminCc] CC enabled — will CC: ${email}`);
      return email;
    }
    console.log("[getGlobalAdminCc] CC not active (disabled or no email set)");
  } catch (err) {
    console.error("[getGlobalAdminCc] Error fetching app settings:", err);
  }
  return undefined;
}

interface SendPasswordResetEmailParams {
  to: string;
  resetUrl: string;
}

interface SendOrderConfirmationEmailParams {
  to: string;
  orderNumber: string;
  customerName: string;
  contactPerson?: string;
  items: Array<{
    productName: string;
    productNumber: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    markingCost: number;
    internalMarkingCost?: number;
    imageUrl?: string;
    mockupImage?: string;
  }>;
  specialCosts?: Array<{
    name: string;
    amount: number;
  }>;
  totalAmount: number;
  salesperson?: string;
  createdAt: string;
}

interface SendOfferEmailParams {
  to: string;
  accessCode: string;
  offerNumber: string;
  customerName: string;
  contactPerson: string;
  items: Array<{
    productName: string;
    productNumber: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    markingCost: number;
    internalMarkingCost?: number;
    imageUrl?: string;
    mockupImage?: string;
  }>;
  totalAmount: number;
  validUntil?: string;
  additionalTerms?: string;
  specialCosts?: Array<{
    name: string;
    amount: number;
  }>;
  version?: number;
}

// ---- Helpers to build dynamic table rows ----

function buildItemsHtml(
  items: Array<{
    productName: string;
    productNumber: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    markingCost: number;
    internalMarkingCost?: number;
    imageUrl?: string;
    mockupImage?: string;
  }>,
): string {
  return items
    .map((item) => {
      const discounted = item.unitPrice * (1 - item.discount / 100);
      const lineTotal = (discounted + item.markingCost) * item.quantity;
      const displayImage = item.mockupImage || item.imageUrl;
      const safeProductName = escapeHtml(item.productName);
      const safeProductNumber = escapeHtml(item.productNumber);
      const imageCell = displayImage
        ? `<td style="padding:8px;border-bottom:1px solid #e5e7eb;width:60px;vertical-align:middle;"><img src="${encodeURI(displayImage)}" alt="${safeProductName}" style="width:56px;height:56px;object-fit:cover;border-radius:6px;display:block;" /></td>`
        : `<td style="padding:8px;border-bottom:1px solid #e5e7eb;width:60px;vertical-align:middle;"><div style="width:56px;height:56px;background:#f3f4f6;border-radius:6px;"></div></td>`;
      return `<tr>
        ${imageCell}
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:14px;vertical-align:middle;">${safeProductName}<br/><span style="color:#6b7280;font-size:12px;">${safeProductNumber}</span></td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:14px;vertical-align:middle;">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:14px;vertical-align:middle;">€${discounted.toFixed(2).replace(".", ",")}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:14px;vertical-align:middle;">€${lineTotal.toFixed(2).replace(".", ",")}</td>
      </tr>`;
    })
    .join("");
}

function buildSpecialCostsHtml(
  specialCosts?: Array<{ name: string; amount: number }>,
): string {
  if (!specialCosts || specialCosts.length === 0) return "";
  return specialCosts
    .map(
      (cost) => `<tr>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;"></td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:14px;">${escapeHtml(cost.name)}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:14px;">1</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:14px;">€${cost.amount.toFixed(2).replace(".", ",")}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:14px;">€${cost.amount.toFixed(2).replace(".", ",")}</td>
      </tr>`,
    )
    .join("");
}

class EmailService {
  async sendPasswordResetEmail({
    to,
    resetUrl,
  }: SendPasswordResetEmailParams): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.error("RESEND_API_KEY is not configured");
        return { success: false, message: "Email service is not configured" };
      }

      const tpl = await loadTemplate("password_reset");
      if (!tpl)
        return { success: false, message: "Password reset email is disabled" };

      const vars: Record<string, string> = {
        resetUrl,
        year: new Date().getFullYear().toString(),
      };
      const subject = interpolate(tpl.subject, vars);
      const html = interpolate(tpl.htmlBody, vars);

      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || "onboarding@resend.dev",
        to,
        subject,
        html,
      });

      if (result.error) {
        console.error("Password reset email Resend error:", result.error);
        return { success: false, message: result.error.message };
      }

      console.log("Email sent successfully:", result.data?.id);
      return {
        success: true,
        message: "Password reset email sent successfully",
      };
    } catch (error) {
      console.error("Error sending password reset email:", error);
      return {
        success: false,
        message: "Failed to send password reset email",
      };
    }
  }

  async sendOfferEmail({
    to,
    accessCode,
    offerNumber,
    customerName,
    contactPerson,
    items,
    totalAmount,
    validUntil,
    additionalTerms,
    specialCosts,
    version,
  }: SendOfferEmailParams): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.error("RESEND_API_KEY is not configured");
        return { success: false, message: "Email service is not configured" };
      }

      const offerUrl = `${process.env.FRONTEND_URL || "http://localhost:8080"}/offers/${accessCode}`;
      const itemsHtml = buildItemsHtml(items);
      const specialCostsHtml = buildSpecialCostsHtml(specialCosts);

      const tpl = await loadTemplate("offer_sent");
      if (!tpl) return { success: false, message: "Offer email is disabled" };

      const validUntilBlock = validUntil
        ? new Date(validUntil).toLocaleDateString()
        : "";

      const additionalTermsBlock = additionalTerms
        ? escapeHtml(additionalTerms).replace(/\n/g, "<br/>")
        : "";

      const versionLabel = version
        ? `<span style="font-size:16px;color:#6b7280;margin-left:8px;">(v${version})</span>`
        : "";

      const vars: Record<string, string> = {
        offerNumber: escapeHtml(offerNumber),
        version: versionLabel,
        customerName: escapeHtml(customerName),
        contactPerson: escapeHtml(contactPerson),
        itemsTable: itemsHtml,
        specialCostsTable: specialCostsHtml,
        totalAmount: totalAmount.toFixed(2).replace(".", ","),
        validUntil: validUntilBlock,
        additionalTerms: additionalTermsBlock,
        offerUrl,
        year: new Date().getFullYear().toString(),
      };

      const subject = interpolate(tpl.subject, vars);
      const html = interpolate(tpl.htmlBody, vars);

      const globalCc = await getGlobalAdminCc();
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || "onboarding@resend.dev",
        to,
        ...(globalCc && globalCc !== to ? { cc: globalCc } : {}),
        subject,
        html,
      });

      if (result.error) {
        console.error("Offer email Resend error:", result.error);
        return { success: false, message: result.error.message };
      }

      console.log("Offer email sent successfully:", result.data?.id);
      return { success: true, message: "Offer email sent successfully" };
    } catch (error) {
      console.error("Error sending offer email:", error);
      return { success: false, message: "Failed to send offer email" };
    }
  }

  async sendOrderConfirmationEmail({
    to,
    orderNumber,
    customerName,
    contactPerson,
    items,
    specialCosts,
    totalAmount,
    salesperson,
    createdAt,
  }: SendOrderConfirmationEmailParams): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.error("RESEND_API_KEY is not configured");
        return { success: false, message: "Email service is not configured" };
      }

      const itemsHtml = buildItemsHtml(items);
      const specialCostsHtml = buildSpecialCostsHtml(specialCosts);

      const orderDate = new Date(createdAt).toLocaleDateString("fi-FI", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const tpl = await loadTemplate("order_confirmation");
      if (!tpl)
        return {
          success: false,
          message: "Order confirmation email is disabled",
        };

      const contactPersonBlock = contactPerson || "";
      const salespersonBlock = salesperson || "";

      const vars: Record<string, string> = {
        orderNumber: escapeHtml(orderNumber),
        orderDate,
        customerName: escapeHtml(customerName),
        contactPerson: escapeHtml(contactPersonBlock),
        salesperson: escapeHtml(salespersonBlock),
        itemsTable: itemsHtml,
        specialCostsTable: specialCostsHtml,
        totalAmount: totalAmount.toFixed(2).replace(".", ","),
        year: new Date().getFullYear().toString(),
      };

      const subject = interpolate(tpl.subject, vars);
      const html = interpolate(tpl.htmlBody, vars);

      const globalCc = await getGlobalAdminCc();
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || "onboarding@resend.dev",
        to,
        ...(globalCc && globalCc !== to ? { cc: globalCc } : {}),
        subject,
        html,
      });

      if (result.error) {
        console.error("Order confirmation email Resend error:", result.error);
        return { success: false, message: result.error.message };
      }

      console.log(
        "Order confirmation email sent successfully:",
        result.data?.id,
      );
      return {
        success: true,
        message: "Order confirmation email sent successfully",
      };
    } catch (error) {
      console.error("Error sending order confirmation email:", error);
      return {
        success: false,
        message: "Failed to send order confirmation email",
      };
    }
  }

  async sendOrderStatusUpdateEmail({
    to,
    orderNumber,
    customerName,
    contactPerson,
    salesperson,
    previousStatus,
    newStatus,
    createdAt,
  }: {
    to: string;
    orderNumber: string;
    customerName: string;
    contactPerson?: string;
    salesperson?: string;
    previousStatus: string;
    newStatus: string;
    createdAt: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      if (!process.env.RESEND_API_KEY) {
        return { success: false, message: "Email service is not configured" };
      }

      const tpl = await loadTemplate("order_status_update");
      if (!tpl) {
        return {
          success: false,
          message: "Order status update email is disabled",
        };
      }

      const statusMessages: Record<string, string> = {
        processing:
          "Your order is now being processed. We are preparing your products with the specified markings.",
        completed:
          "Great news! Your order has been completed and is ready for delivery. Thank you for your business!",
        cancelled:
          "Your order has been cancelled. If you have any questions, please contact us.",
        pending:
          "Your order status has been updated to pending. We will notify you of further changes.",
      };

      const orderDate = new Date(createdAt).toLocaleDateString("fi-FI", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const vars: Record<string, string> = {
        orderNumber: escapeHtml(orderNumber),
        orderDate,
        customerName: escapeHtml(customerName),
        contactPerson: escapeHtml(contactPerson || ""),
        salesperson: escapeHtml(salesperson || ""),
        previousStatus: escapeHtml(previousStatus),
        newStatus: escapeHtml(newStatus),
        statusMessage:
          statusMessages[newStatus] || "Your order status has been updated.",
        year: new Date().getFullYear().toString(),
      };

      const subject = interpolate(tpl.subject, vars);
      const html = interpolate(tpl.htmlBody, vars);

      const globalCc = await getGlobalAdminCc();
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || "onboarding@resend.dev",
        to,
        ...(globalCc && globalCc !== to ? { cc: globalCc } : {}),
        subject,
        html,
      });

      if (result.error) {
        console.error("Order status update email Resend error:", result.error);
        return { success: false, message: result.error.message };
      }

      console.log(
        "Order status update email sent successfully:",
        result.data?.id,
      );
      return {
        success: true,
        message: "Order status update email sent successfully",
      };
    } catch (error) {
      console.error("Error sending order status update email:", error);
      return {
        success: false,
        message: "Failed to send order status update email",
      };
    }
  }

  async sendOfferResponseAdminEmail({
    fallbackEmail,
    offerNumber,
    customerName,
    contactPerson,
    customerComment,
    customerResponse,
  }: {
    fallbackEmail: string;
    offerNumber: string;
    customerName: string;
    contactPerson: string;
    customerComment: string;
    customerResponse: "accepted" | "rejected";
  }): Promise<{ success: boolean; message: string }> {
    console.log(
      `[sendOfferResponseAdminEmail] START — offerNumber: ${offerNumber}, response: ${customerResponse}, fallbackEmail: "${fallbackEmail}"`,
    );
    try {
      if (!process.env.RESEND_API_KEY) {
        console.error(
          "[sendOfferResponseAdminEmail] RESEND_API_KEY is not configured",
        );
        return { success: false, message: "Email service is not configured" };
      }

      const templateKey =
        customerResponse === "accepted"
          ? "offer_accepted_admin"
          : "offer_rejected_admin";

      console.log(
        `[sendOfferResponseAdminEmail] Loading template: ${templateKey}`,
      );
      const tpl = await loadTemplate(templateKey);
      if (!tpl) {
        console.error(
          `[sendOfferResponseAdminEmail] Template ${templateKey} returned null (disabled or missing)`,
        );
        return {
          success: false,
          message: `Admin ${customerResponse} notification email is disabled`,
        };
      }

      // Use template's configured recipientEmail, fall back to the salesperson email
      const adminEmail = tpl.recipientEmail || fallbackEmail;
      console.log(
        `[sendOfferResponseAdminEmail] Resolved adminEmail: "${adminEmail}" (template.recipientEmail: "${tpl.recipientEmail || ""}", fallback: "${fallbackEmail}")`,
      );
      if (!adminEmail) {
        console.error(
          "[sendOfferResponseAdminEmail] No admin recipient email configured — skipping send",
        );
        return {
          success: false,
          message: "No admin recipient email configured",
        };
      }

      const vars: Record<string, string> = {
        offerNumber: escapeHtml(offerNumber),
        customerName: escapeHtml(customerName),
        contactPerson: escapeHtml(contactPerson || ""),
        customerComment: escapeHtml(customerComment || "No comment provided"),
        respondedAt: new Date().toLocaleString(),
        year: new Date().getFullYear().toString(),
      };

      const subject = interpolate(tpl.subject, vars);
      const html = interpolate(tpl.htmlBody, vars);

      const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";
      console.log(
        `[sendOfferResponseAdminEmail] Sending email — from: "${fromEmail}", to: "${adminEmail}", subject: "${subject}"`,
      );

      const globalCc = await getGlobalAdminCc();
      const result = await resend.emails.send({
        from: fromEmail,
        to: adminEmail,
        ...(globalCc && globalCc !== adminEmail ? { cc: globalCc } : {}),
        subject,
        html,
      });

      if (result.error) {
        console.error(
          `[sendOfferResponseAdminEmail] Resend API ERROR:`,
          JSON.stringify(result.error),
        );
        return {
          success: false,
          message: `Resend error: ${result.error.message}`,
        };
      }

      console.log(
        `[sendOfferResponseAdminEmail] SUCCESS — id:`,
        result.data?.id,
      );
      return {
        success: true,
        message: `Admin notification sent for ${customerResponse} offer`,
      };
    } catch (error) {
      console.error("[sendOfferResponseAdminEmail] EXCEPTION:", error);
      return {
        success: false,
        message: "Failed to send admin notification email",
      };
    }
  }

  async sendOfferResponseCustomerEmail({
    customerEmail,
    offerNumber,
    customerName,
    contactPerson,
    customerResponse,
  }: {
    customerEmail: string;
    offerNumber: string;
    customerName: string;
    contactPerson: string;
    customerResponse: "accepted" | "rejected";
  }): Promise<{ success: boolean; message: string }> {
    try {
      if (!process.env.RESEND_API_KEY) {
        return { success: false, message: "Email service is not configured" };
      }

      const templateKey =
        customerResponse === "accepted"
          ? "offer_accepted_customer"
          : "offer_rejected_customer";

      const tpl = await loadTemplate(templateKey);
      if (!tpl)
        return {
          success: false,
          message: `Customer ${customerResponse} follow-up email is disabled`,
        };

      const vars: Record<string, string> = {
        offerNumber: escapeHtml(offerNumber),
        customerName: escapeHtml(customerName),
        contactPerson: escapeHtml(contactPerson || ""),
        year: new Date().getFullYear().toString(),
      };

      const subject = interpolate(tpl.subject, vars);
      const html = interpolate(tpl.htmlBody, vars);

      const globalCc = await getGlobalAdminCc();
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || "onboarding@resend.dev",
        to: customerEmail,
        ...(globalCc && globalCc !== customerEmail ? { cc: globalCc } : {}),
        subject,
        html,
      });

      if (result.error) {
        console.error("Customer follow-up email Resend error:", result.error);
        return { success: false, message: result.error.message };
      }

      return {
        success: true,
        message: `Customer follow-up sent for ${customerResponse} offer`,
      };
    } catch (error) {
      console.error("Error sending offer response customer email:", error);
      return {
        success: false,
        message: "Failed to send customer follow-up email",
      };
    }
  }
}

export default new EmailService();
