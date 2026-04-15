import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockEmailTemplate } = vi.hoisted(() => ({
  mockEmailTemplate: {
    find: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    insertMany: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock("../models/emailTemplate.model", () => ({
  default: mockEmailTemplate,
  __esModule: true,
}));
vi.mock("./emailTemplateDefaults.service", () => ({
  defaultTemplates: [
    {
      templateKey: "offer_sent",
      subject: "Offer {{offerNumber}}",
      htmlBody: "<p>{{offerNumber}}</p>",
      enabled: true,
      description: "Offer sent",
      recipientEmail: "",
    },
    {
      templateKey: "offer_accepted_admin",
      subject: "Accepted",
      htmlBody: "<p>Accepted</p>",
      enabled: false,
      description: "Admin notification",
      recipientEmail: "",
    },
  ],
}));

import emailTemplateService from "../services/emailTemplate.service";

describe("emailTemplate.service", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("getAllTemplates", () => {
    it("returns DB templates and seeds missing defaults", async () => {
      const existingTpl = {
        templateKey: "offer_sent",
        subject: "Offer",
        htmlBody: "<p>OK</p>",
        enabled: true,
        recipientEmail: "",
        save: vi.fn(),
      };

      // First find().sort() returns only one template (missing offer_accepted_admin)
      const sortFn1 = vi.fn().mockResolvedValue([existingTpl]);
      // After insertMany, second find().sort() returns all
      const allTemplates = [
        existingTpl,
        {
          templateKey: "offer_accepted_admin",
          subject: "Accepted",
          htmlBody: "<p>Accepted</p>",
          enabled: false,
          recipientEmail: "",
          save: vi.fn(),
        },
      ];
      const sortFn2 = vi.fn().mockResolvedValue(allTemplates);
      mockEmailTemplate.find
        .mockReturnValueOnce({ sort: sortFn1 })
        .mockReturnValueOnce({ sort: sortFn2 });
      mockEmailTemplate.insertMany.mockResolvedValue([]);

      const result = await emailTemplateService.getAllTemplates();
      expect(mockEmailTemplate.insertMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe("getByKey", () => {
    it("returns template from DB", async () => {
      const tpl = {
        templateKey: "offer_sent",
        subject: "Offer",
        htmlBody: "<p>OK</p>",
        enabled: true,
      };
      mockEmailTemplate.findOne.mockResolvedValue(tpl);

      const result = await emailTemplateService.getByKey("offer_sent");
      expect(result.templateKey).toBe("offer_sent");
    });

    it("creates from default if not in DB", async () => {
      mockEmailTemplate.findOne.mockResolvedValue(null);
      const createdTpl = {
        templateKey: "offer_sent",
        subject: "Offer {{offerNumber}}",
        htmlBody: "<p>{{offerNumber}}</p>",
        enabled: true,
      };
      mockEmailTemplate.create.mockResolvedValue(createdTpl);

      const result = await emailTemplateService.getByKey("offer_sent");
      expect(result.templateKey).toBe("offer_sent");
      expect(mockEmailTemplate.create).toHaveBeenCalled();
    });

    it("throws when template key not found anywhere", async () => {
      mockEmailTemplate.findOne.mockResolvedValue(null);
      await expect(
        emailTemplateService.getByKey("nonexistent"),
      ).rejects.toThrow("not found");
    });
  });

  describe("updateTemplate", () => {
    it("updates existing template", async () => {
      const tpl = {
        templateKey: "offer_sent",
        subject: "Old",
        htmlBody: "<p>old</p>",
        enabled: true,
        recipientEmail: "",
        save: vi.fn().mockResolvedValue(undefined),
      };
      mockEmailTemplate.findOne.mockResolvedValue(tpl);

      const result = await emailTemplateService.updateTemplate("offer_sent", {
        subject: "New Subject",
      });
      expect(result.subject).toBe("New Subject");
      expect(tpl.save).toHaveBeenCalled();
    });

    it("throws when enabling admin template without recipientEmail", async () => {
      const tpl = {
        templateKey: "offer_accepted_admin",
        subject: "Accepted",
        htmlBody: "<p>Accepted</p>",
        enabled: false,
        recipientEmail: "",
        save: vi.fn(),
      };
      mockEmailTemplate.findOne.mockResolvedValue(tpl);

      await expect(
        emailTemplateService.updateTemplate("offer_accepted_admin", {
          enabled: true,
        }),
      ).rejects.toThrow("Recipient email is required");
    });
  });

  describe("resetToDefault", () => {
    it("resets template to factory default", async () => {
      const resetTpl = {
        templateKey: "offer_sent",
        subject: "Offer {{offerNumber}}",
        htmlBody: "<p>{{offerNumber}}</p>",
        enabled: true,
      };
      mockEmailTemplate.findOneAndUpdate.mockResolvedValue(resetTpl);

      const result = await emailTemplateService.resetToDefault("offer_sent");
      expect(result.subject).toBe("Offer {{offerNumber}}");
    });

    it("throws when no default exists", async () => {
      await expect(
        emailTemplateService.resetToDefault("nonexistent"),
      ).rejects.toThrow("No default template");
    });
  });
});
