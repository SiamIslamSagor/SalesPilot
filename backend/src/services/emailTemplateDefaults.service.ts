/**
 * Default (factory) email templates — extracted from the original
 * hardcoded HTML in email.service.ts.
 *
 * Placeholders use the syntax {{variableName}} so the email service
 * can do a simple string replace at send time.
 */

export interface DefaultTemplate {
  templateKey: string;
  subject: string;
  htmlBody: string;
  enabled: boolean;
  description: string;
  recipientEmail?: string;
}

export const defaultTemplates: DefaultTemplate[] = [
  // ===================== PASSWORD RESET =====================
  {
    templateKey: "password_reset",
    subject: "Reset your password",
    description:
      "Sent when a user requests a password reset. Available variables: {{resetUrl}}",
    enabled: true,
    htmlBody: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Reset</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:12px;padding:32px;box-shadow:0 10px 30px rgba(0,0,0,0.08);">
            <tr>
              <td style="text-align:center;padding-bottom:24px;">
                <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;">QuoteTool Prod-Pros</h1>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:12px;">
                <h2 style="margin:0;font-size:20px;font-weight:600;color:#111827;">Reset your password</h2>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:20px;">
                <p style="margin:0;font-size:15px;line-height:1.6;color:#4b5563;">We received a request to reset your account password. Click the button below to set a new password.</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <a href="{{resetUrl}}" target="_blank" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:14px 28px;font-size:15px;font-weight:600;border-radius:10px;">Reset Password</a>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:24px;">
                <p style="margin:0;font-size:13px;color:#6b7280;">⏱️ This password reset link will expire in <strong>15 minutes</strong>.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 0;"><hr style="border:none;height:1px;background:#e5e7eb;" /></td>
            </tr>
            <tr>
              <td>
                <p style="margin:0;font-size:12px;line-height:1.5;color:#9ca3af;">If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
              </td>
            </tr>
          </table>
          <p style="margin-top:24px;font-size:12px;color:#9ca3af;text-align:center;">© {{year}} QuoteTool Prod-Pros. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  },

  // ===================== OFFER SENT =====================
  {
    templateKey: "offer_sent",
    subject: "New Offer: {{offerNumber}}",
    description:
      "Sent when an offer is emailed to a customer. Available variables: {{offerNumber}}, {{version}}, {{customerName}}, {{contactPerson}}, {{itemsTable}}, {{specialCostsTable}}, {{totalAmount}}, {{validUntil}}, {{additionalTerms}}, {{offerUrl}}, {{year}}",
    enabled: true,
    htmlBody: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>New Offer</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;padding:32px;box-shadow:0 10px 30px rgba(0,0,0,0.08);">
            <tr>
              <td style="text-align:center;padding-bottom:24px;">
                <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;">QuoteTool Prod-Pros</h1>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:12px;">
                <h2 style="margin:0;font-size:20px;font-weight:600;color:#111827;">New Offer: {{offerNumber}} {{version}}</h2>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:20px;">
                <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:16px;">
                  <p style="margin:0 0 4px 0;font-size:14px;font-weight:600;color:#111827;">Customer: {{customerName}}</p>
                  <p style="margin:0;font-size:14px;color:#6b7280;">Contact: {{contactPerson}}</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:20px;">
                <h3 style="margin:0 0 12px 0;font-size:16px;font-weight:600;color:#111827;">Offer Details</h3>
                <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                  <thead>
                    <tr style="background:#f9fafb;">
                      <th style="padding:12px;text-align:left;font-size:14px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;width:60px;">Image</th>
                      <th style="padding:12px;text-align:left;font-size:14px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">Product</th>
                      <th style="padding:12px;text-align:center;font-size:14px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">Qty</th>
                      <th style="padding:12px;text-align:right;font-size:14px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">Price</th>
                      <th style="padding:12px;text-align:right;font-size:14px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {{itemsTable}}
                    {{specialCostsTable}}
                  </tbody>
                  <tfoot>
                    <tr style="background:#f9fafb;">
                      <td colspan="4" style="padding:12px;text-align:right;font-size:16px;font-weight:600;color:#111827;border-top:1px solid #e5e7eb;">Total Amount:</td>
                      <td style="padding:12px;text-align:right;font-size:16px;font-weight:600;color:#111827;border-top:1px solid #e5e7eb;">€{{totalAmount}}</td>
                    </tr>
                  </tfoot>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:16px;"><p style="margin:0;font-size:14px;color:#4b5563;"><strong>Valid Until:</strong> {{validUntil}}</p></td>
            </tr>
            <tr>
              <td style="padding-bottom:20px;"><p style="margin:0;font-size:14px;color:#4b5563;"><strong>Additional Terms:</strong><br/>{{additionalTerms}}</p></td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <a href="{{offerUrl}}" target="_blank" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:14px 28px;font-size:15px;font-weight:600;border-radius:10px;">View & Respond to Offer</a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 0;"><hr style="border:none;height:1px;background:#e5e7eb;" /></td>
            </tr>
            <tr>
              <td>
                <p style="margin:0;font-size:12px;line-height:1.5;color:#9ca3af;">This offer was generated automatically. Please review the details and respond accordingly.</p>
              </td>
            </tr>
          </table>
          <p style="margin-top:24px;font-size:12px;color:#9ca3af;text-align:center;">© {{year}} QuoteTool Prod-Pros. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  },

  // ===================== ORDER CONFIRMATION =====================
  {
    templateKey: "order_confirmation",
    subject: "Order Confirmation: {{orderNumber}}",
    description:
      "Sent when an order is confirmed. Available variables: {{orderNumber}}, {{orderDate}}, {{customerName}}, {{contactPerson}}, {{salesperson}}, {{itemsTable}}, {{specialCostsTable}}, {{totalAmount}}, {{year}}",
    enabled: true,
    htmlBody: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Order Confirmation</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;padding:32px;box-shadow:0 10px 30px rgba(0,0,0,0.08);">
            <tr>
              <td style="text-align:center;padding-bottom:24px;">
                <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;">Brändi vaate</h1>
                <p style="margin:4px 0 0 0;font-size:13px;color:#6b7280;">Vaunukatu 11, 20100 Turku</p>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:20px;">
                <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:16px;text-align:center;">
                  <p style="margin:0;font-size:18px;font-weight:600;color:#065f46;">✓ Order Confirmed</p>
                  <p style="margin:4px 0 0 0;font-size:14px;color:#047857;">Thank you for your order!</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:20px;">
                <div style="background:#f9fafb;border-radius:8px;padding:16px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#6b7280;width:140px;">Order Number:</td>
                      <td style="padding:4px 0;font-size:14px;font-weight:600;color:#111827;">{{orderNumber}}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#6b7280;">Order Date:</td>
                      <td style="padding:4px 0;font-size:14px;color:#111827;">{{orderDate}}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#6b7280;">Customer:</td>
                      <td style="padding:4px 0;font-size:14px;color:#111827;">{{customerName}}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#6b7280;">Contact Person:</td>
                      <td style="padding:4px 0;font-size:14px;color:#111827;">{{contactPerson}}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#6b7280;">Salesperson:</td>
                      <td style="padding:4px 0;font-size:14px;color:#111827;">{{salesperson}}</td>
                    </tr>
                  </table>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:20px;">
                <h3 style="margin:0 0 12px 0;font-size:16px;font-weight:600;color:#111827;">Order Items</h3>
                <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                  <thead>
                    <tr style="background:#f9fafb;">
                      <th style="padding:12px 8px;text-align:left;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;width:60px;">Image</th>
                      <th style="padding:12px 8px;text-align:left;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">Product</th>
                      <th style="padding:12px 8px;text-align:center;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">Qty</th>
                      <th style="padding:12px 8px;text-align:right;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">Unit Price</th>
                      <th style="padding:12px 8px;text-align:right;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {{itemsTable}}
                    {{specialCostsTable}}
                  </tbody>
                  <tfoot>
                    <tr style="background:#f9fafb;">
                      <td colspan="4" style="padding:14px 8px;text-align:right;font-size:16px;font-weight:700;color:#111827;border-top:2px solid #e5e7eb;">Total:</td>
                      <td style="padding:14px 8px;text-align:right;font-size:16px;font-weight:700;color:#111827;border-top:2px solid #e5e7eb;">€{{totalAmount}}</td>
                    </tr>
                  </tfoot>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:20px;">
                <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;">
                  <h4 style="margin:0 0 8px 0;font-size:14px;font-weight:600;color:#1e40af;">What happens next?</h4>
                  <ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.8;color:#1e3a8a;">
                    <li>Your order is now being processed</li>
                    <li>We will prepare your products with the specified markings</li>
                    <li>You will receive a notification when your order is ready for delivery</li>
                  </ul>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0 16px 0;"><hr style="border:none;height:1px;background:#e5e7eb;" /></td>
            </tr>
            <tr>
              <td style="padding-bottom:8px;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;text-align:center;">If you have any questions about your order, please don't hesitate to contact us.<br/><strong>Email:</strong> patricia@brandivaate.fi</p>
              </td>
            </tr>
            <tr>
              <td>
                <p style="margin:0;font-size:12px;line-height:1.5;color:#9ca3af;text-align:center;">This is an automated order confirmation. Please keep this email for your records.</p>
              </td>
            </tr>
          </table>
          <p style="margin-top:24px;font-size:12px;color:#9ca3af;text-align:center;">© {{year}} Brändi vaate. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  },
  // ===================== ORDER STATUS UPDATE =====================
  {
    templateKey: "order_status_update",
    subject: "Order {{orderNumber}} — Status Updated to {{newStatus}}",
    description:
      "Sent when an order status changes. Available variables: {{orderNumber}}, {{orderDate}}, {{customerName}}, {{contactPerson}}, {{salesperson}}, {{previousStatus}}, {{newStatus}}, {{statusMessage}}, {{year}}",
    enabled: true,
    htmlBody: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Order Status Update</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;padding:32px;box-shadow:0 10px 30px rgba(0,0,0,0.08);">
            <tr>
              <td style="text-align:center;padding-bottom:24px;">
                <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;">Brändi vaate</h1>
                <p style="margin:4px 0 0 0;font-size:13px;color:#6b7280;">Vaunukatu 11, 20100 Turku</p>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:20px;">
                <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;text-align:center;">
                  <p style="margin:0;font-size:18px;font-weight:600;color:#1e40af;">📦 Order Status Updated</p>
                  <p style="margin:8px 0 0 0;font-size:14px;color:#1e3a8a;">Your order <strong>{{orderNumber}}</strong> status has changed.</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:20px;">
                <div style="background:#f9fafb;border-radius:8px;padding:16px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#6b7280;width:160px;">Order Number:</td>
                      <td style="padding:4px 0;font-size:14px;font-weight:600;color:#111827;">{{orderNumber}}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#6b7280;">Order Date:</td>
                      <td style="padding:4px 0;font-size:14px;color:#111827;">{{orderDate}}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#6b7280;">Customer:</td>
                      <td style="padding:4px 0;font-size:14px;color:#111827;">{{customerName}}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#6b7280;">Contact Person:</td>
                      <td style="padding:4px 0;font-size:14px;color:#111827;">{{contactPerson}}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#6b7280;">Salesperson:</td>
                      <td style="padding:4px 0;font-size:14px;color:#111827;">{{salesperson}}</td>
                    </tr>
                  </table>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:20px;">
                <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:16px;text-align:center;">
                  <p style="margin:0;font-size:13px;color:#92400e;">Previous Status</p>
                  <p style="margin:4px 0;font-size:16px;font-weight:700;color:#92400e;text-transform:capitalize;">{{previousStatus}}</p>
                  <p style="margin:4px 0;font-size:20px;color:#6b7280;">↓</p>
                  <p style="margin:0;font-size:13px;color:#065f46;">New Status</p>
                  <p style="margin:4px 0;font-size:16px;font-weight:700;color:#065f46;text-transform:capitalize;">{{newStatus}}</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:20px;">
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;">
                  <p style="margin:0;font-size:14px;line-height:1.6;color:#166534;">{{statusMessage}}</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0 16px 0;"><hr style="border:none;height:1px;background:#e5e7eb;" /></td>
            </tr>
            <tr>
              <td style="padding-bottom:8px;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;text-align:center;">If you have any questions about your order, please don't hesitate to contact us.<br/><strong>Email:</strong> patricia@brandivaate.fi</p>
              </td>
            </tr>
            <tr>
              <td>
                <p style="margin:0;font-size:12px;line-height:1.5;color:#9ca3af;text-align:center;">This is an automated notification. Please keep this email for your records.</p>
              </td>
            </tr>
          </table>
          <p style="margin-top:24px;font-size:12px;color:#9ca3af;text-align:center;">© {{year}} Brändi vaate. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  },
  // ===================== OFFER ACCEPTED — ADMIN NOTIFICATION =====================
  {
    templateKey: "offer_accepted_admin",
    subject: "Offer Accepted: {{offerNumber}}",
    description:
      "Sent to the admin when a customer accepts an offer. Available variables: {{offerNumber}}, {{customerName}}, {{contactPerson}}, {{customerComment}}, {{respondedAt}}, {{year}}",
    enabled: false,
    htmlBody: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Offer Accepted</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;padding:32px;box-shadow:0 10px 30px rgba(0,0,0,0.08);">
            <tr>
              <td style="text-align:center;padding-bottom:24px;">
                <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;">QuoteTool Prod-Pros</h1>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:20px;">
                <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:16px;text-align:center;">
                  <p style="margin:0;font-size:18px;font-weight:600;color:#065f46;">✓ Offer Accepted</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:20px;">
                <div style="background:#f9fafb;border-radius:8px;padding:16px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#6b7280;width:140px;">Offer Number:</td>
                      <td style="padding:4px 0;font-size:14px;font-weight:600;color:#111827;">{{offerNumber}}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#6b7280;">Customer:</td>
                      <td style="padding:4px 0;font-size:14px;color:#111827;">{{customerName}}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#6b7280;">Contact Person:</td>
                      <td style="padding:4px 0;font-size:14px;color:#111827;">{{contactPerson}}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#6b7280;">Responded At:</td>
                      <td style="padding:4px 0;font-size:14px;color:#111827;">{{respondedAt}}</td>
                    </tr>
                  </table>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:20px;">
                <h3 style="margin:0 0 8px 0;font-size:16px;font-weight:600;color:#111827;">Customer Comment</h3>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#4b5563;background:#f9fafb;border-radius:8px;padding:12px;">{{customerComment}}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 0;"><hr style="border:none;height:1px;background:#e5e7eb;" /></td>
            </tr>
            <tr>
              <td>
                <p style="margin:0;font-size:12px;line-height:1.5;color:#9ca3af;">This is an automated notification. The customer has accepted the offer — you can now proceed with the order.</p>
              </td>
            </tr>
          </table>
          <p style="margin-top:24px;font-size:12px;color:#9ca3af;text-align:center;">© {{year}} QuoteTool Prod-Pros. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  },

  // ===================== OFFER REJECTED — ADMIN NOTIFICATION =====================
  {
    templateKey: "offer_rejected_admin",
    subject: "Offer Rejected: {{offerNumber}}",
    description:
      "Sent to the admin when a customer rejects an offer. Available variables: {{offerNumber}}, {{customerName}}, {{contactPerson}}, {{customerComment}}, {{respondedAt}}, {{year}}",
    enabled: false,
    htmlBody: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Offer Rejected</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;padding:32px;box-shadow:0 10px 30px rgba(0,0,0,0.08);">
            <tr>
              <td style="text-align:center;padding-bottom:24px;">
                <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;">QuoteTool Prod-Pros</h1>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:20px;">
                <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;text-align:center;">
                  <p style="margin:0;font-size:18px;font-weight:600;color:#991b1b;">✗ Offer Rejected</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:20px;">
                <div style="background:#f9fafb;border-radius:8px;padding:16px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#6b7280;width:140px;">Offer Number:</td>
                      <td style="padding:4px 0;font-size:14px;font-weight:600;color:#111827;">{{offerNumber}}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#6b7280;">Customer:</td>
                      <td style="padding:4px 0;font-size:14px;color:#111827;">{{customerName}}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#6b7280;">Contact Person:</td>
                      <td style="padding:4px 0;font-size:14px;color:#111827;">{{contactPerson}}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#6b7280;">Responded At:</td>
                      <td style="padding:4px 0;font-size:14px;color:#111827;">{{respondedAt}}</td>
                    </tr>
                  </table>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:20px;">
                <h3 style="margin:0 0 8px 0;font-size:16px;font-weight:600;color:#111827;">Customer Comment</h3>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#4b5563;background:#f9fafb;border-radius:8px;padding:12px;">{{customerComment}}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 0;"><hr style="border:none;height:1px;background:#e5e7eb;" /></td>
            </tr>
            <tr>
              <td>
                <p style="margin:0;font-size:12px;line-height:1.5;color:#9ca3af;">This is an automated notification. The customer has rejected the offer. You may want to follow up or revise the offer.</p>
              </td>
            </tr>
          </table>
          <p style="margin-top:24px;font-size:12px;color:#9ca3af;text-align:center;">© {{year}} QuoteTool Prod-Pros. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  },

  // ===================== OFFER ACCEPTED — CUSTOMER FOLLOW-UP =====================
  {
    templateKey: "offer_accepted_customer",
    subject: "Thank you — Offer {{offerNumber}} Accepted",
    description:
      "Sent to the customer after they accept an offer. Available variables: {{offerNumber}}, {{customerName}}, {{contactPerson}}, {{year}}",
    enabled: true,
    htmlBody: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Offer Accepted</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;padding:32px;box-shadow:0 10px 30px rgba(0,0,0,0.08);">
            <tr>
              <td style="text-align:center;padding-bottom:24px;">
                <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;">QuoteTool Prod-Pros</h1>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:20px;">
                <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:16px;text-align:center;">
                  <p style="margin:0;font-size:18px;font-weight:600;color:#065f46;">✓ Thank You for Accepting!</p>
                  <p style="margin:4px 0 0 0;font-size:14px;color:#047857;">Offer {{offerNumber}}</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:20px;">
                <p style="margin:0;font-size:15px;line-height:1.6;color:#4b5563;">Dear {{contactPerson}},</p>
                <p style="margin:12px 0 0 0;font-size:15px;line-height:1.6;color:#4b5563;">Thank you for accepting our offer <strong>{{offerNumber}}</strong>. We have received your response and our team will begin processing your order shortly.</p>
                <p style="margin:12px 0 0 0;font-size:15px;line-height:1.6;color:#4b5563;">You will receive an order confirmation once everything is finalized. If you have any questions in the meantime, please don't hesitate to reach out.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 0;"><hr style="border:none;height:1px;background:#e5e7eb;" /></td>
            </tr>
            <tr>
              <td>
                <p style="margin:0;font-size:12px;line-height:1.5;color:#9ca3af;">This is an automated confirmation of your response. No further action is required at this time.</p>
              </td>
            </tr>
          </table>
          <p style="margin-top:24px;font-size:12px;color:#9ca3af;text-align:center;">© {{year}} QuoteTool Prod-Pros. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  },

  // ===================== OFFER REJECTED — CUSTOMER FOLLOW-UP =====================
  {
    templateKey: "offer_rejected_customer",
    subject: "Offer {{offerNumber}} — Response Received",
    description:
      "Sent to the customer after they reject an offer. Available variables: {{offerNumber}}, {{customerName}}, {{contactPerson}}, {{year}}",
    enabled: true,
    htmlBody: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Offer Response Received</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;padding:32px;box-shadow:0 10px 30px rgba(0,0,0,0.08);">
            <tr>
              <td style="text-align:center;padding-bottom:24px;">
                <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;">QuoteTool Prod-Pros</h1>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:20px;">
                <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;text-align:center;">
                  <p style="margin:0;font-size:18px;font-weight:600;color:#374151;">Response Received</p>
                  <p style="margin:4px 0 0 0;font-size:14px;color:#6b7280;">Offer {{offerNumber}}</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:20px;">
                <p style="margin:0;font-size:15px;line-height:1.6;color:#4b5563;">Dear {{contactPerson}},</p>
                <p style="margin:12px 0 0 0;font-size:15px;line-height:1.6;color:#4b5563;">We have received your response regarding offer <strong>{{offerNumber}}</strong>. We understand that this offer did not meet your needs at this time.</p>
                <p style="margin:12px 0 0 0;font-size:15px;line-height:1.6;color:#4b5563;">If you'd like to discuss alternative options or have any feedback, please feel free to contact us. We're always happy to work with you on finding the right solution.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 0;"><hr style="border:none;height:1px;background:#e5e7eb;" /></td>
            </tr>
            <tr>
              <td>
                <p style="margin:0;font-size:12px;line-height:1.5;color:#9ca3af;">This is an automated confirmation of your response. Thank you for taking the time to review our offer.</p>
              </td>
            </tr>
          </table>
          <p style="margin-top:24px;font-size:12px;color:#9ca3af;text-align:center;">© {{year}} QuoteTool Prod-Pros. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  },
];
