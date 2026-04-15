import EmailTemplate, {
  IEmailTemplateDocument,
} from "../models/emailTemplate.model";
import {
  defaultTemplates,
  DefaultTemplate,
} from "./emailTemplateDefaults.service";

class EmailTemplateService {
  /**
   * Get all email templates. If a template doesn't exist in DB yet,
   * return the hardcoded default.
   */
  async getAllTemplates(): Promise<IEmailTemplateDocument[]> {
    const dbTemplates = await EmailTemplate.find().sort({ templateKey: 1 });

    // Patch DB templates that have the broken itemsTable/specialCostsTable wrapping
    await this.patchBrokenTableTemplates(dbTemplates);

    // Seed any missing defaults
    const existingKeys = new Set(dbTemplates.map((t) => t.templateKey));
    const missing = defaultTemplates.filter(
      (d: DefaultTemplate) => !existingKeys.has(d.templateKey),
    );

    if (missing.length > 0) {
      await EmailTemplate.insertMany(missing);
      const allTemplates = await EmailTemplate.find().sort({ templateKey: 1 });
      return this.enforceAdminRecipientConstraint(allTemplates);
    }

    return this.enforceAdminRecipientConstraint(dbTemplates);
  }

  /**
   * One-time patch: fix DB templates where {{itemsTable}} / {{specialCostsTable}}
   * were incorrectly wrapped in <tr><td colspan="5">…</td></tr>, breaking the
   * table layout. Replaces those templates with the current factory defaults.
   */
  private async patchBrokenTableTemplates(
    templates: IEmailTemplateDocument[],
  ): Promise<void> {
    const brokenPattern = /colspan="5"[^>]*>{{itemsTable}}/;
    const keysToFix = ["offer_sent", "order_confirmation"];

    for (const tpl of templates) {
      if (
        keysToFix.includes(tpl.templateKey) &&
        brokenPattern.test(tpl.htmlBody)
      ) {
        const defaultTpl = defaultTemplates.find(
          (d: DefaultTemplate) => d.templateKey === tpl.templateKey,
        );
        if (defaultTpl) {
          tpl.htmlBody = defaultTpl.htmlBody;
          await tpl.save();
          // eslint-disable-next-line no-console
          console.log(
            `[emailTemplate] Patched broken table layout in "${tpl.templateKey}"`,
          );
        }
      }
    }
  }

  /**
   * Auto-disable admin templates that have no recipientEmail set.
   */
  private async enforceAdminRecipientConstraint(
    templates: IEmailTemplateDocument[],
  ): Promise<IEmailTemplateDocument[]> {
    for (const tpl of templates) {
      if (
        this.isAdminTemplate(tpl.templateKey) &&
        tpl.enabled &&
        !tpl.recipientEmail?.trim()
      ) {
        tpl.enabled = false;
        await tpl.save();
      }
    }
    return templates;
  }

  /**
   * Get a single template by key. Falls back to default if not in DB yet.
   */
  async getByKey(templateKey: string): Promise<IEmailTemplateDocument> {
    let template = await EmailTemplate.findOne({ templateKey });

    if (!template) {
      const defaultTpl = defaultTemplates.find(
        (d: DefaultTemplate) => d.templateKey === templateKey,
      );
      if (defaultTpl) {
        template = await EmailTemplate.create(defaultTpl);
      }
    }

    if (!template) {
      throw new Error(`Email template '${templateKey}' not found`);
    }

    return template;
  }

  /**
   * Update a template's subject, body, and enabled status.
   */
  private isAdminTemplate(templateKey: string): boolean {
    return ["offer_accepted_admin", "offer_rejected_admin"].includes(
      templateKey,
    );
  }

  async updateTemplate(
    templateKey: string,
    data: {
      subject?: string;
      htmlBody?: string;
      enabled?: boolean;
      recipientEmail?: string;
    },
  ): Promise<IEmailTemplateDocument> {
    let template = await EmailTemplate.findOne({ templateKey });

    if (!template) {
      // Auto-create from default first
      const defaultTpl = defaultTemplates.find(
        (d: DefaultTemplate) => d.templateKey === templateKey,
      );
      if (defaultTpl) {
        template = await EmailTemplate.create(defaultTpl);
      } else {
        throw new Error(`Email template '${templateKey}' not found`);
      }
    }

    if (data.subject !== undefined) template.subject = data.subject;
    if (data.htmlBody !== undefined) template.htmlBody = data.htmlBody;
    if (data.recipientEmail !== undefined)
      template.recipientEmail = data.recipientEmail;

    // For admin templates: cannot enable without recipientEmail,
    // and cannot clear recipientEmail while enabled
    if (this.isAdminTemplate(templateKey)) {
      const finalEnabled =
        data.enabled !== undefined ? data.enabled : template.enabled;
      const finalRecipient = template.recipientEmail?.trim() || "";

      if (finalEnabled && !finalRecipient) {
        throw new Error(
          "Recipient email is required to enable admin notification templates.",
        );
      }
    }

    if (data.enabled !== undefined) template.enabled = data.enabled;

    await template.save();
    return template;
  }

  /**
   * Reset a template back to its factory default.
   */
  async resetToDefault(templateKey: string): Promise<IEmailTemplateDocument> {
    const defaultTpl = defaultTemplates.find(
      (d: DefaultTemplate) => d.templateKey === templateKey,
    );
    if (!defaultTpl) {
      throw new Error(`No default template for '${templateKey}'`);
    }

    const template = await EmailTemplate.findOneAndUpdate(
      { templateKey },
      {
        subject: defaultTpl.subject,
        htmlBody: defaultTpl.htmlBody,
        enabled: defaultTpl.enabled,
        description: defaultTpl.description,
        recipientEmail: defaultTpl.recipientEmail || "",
      },
      { upsert: true, new: true },
    );

    return template!;
  }
}

export default new EmailTemplateService();
