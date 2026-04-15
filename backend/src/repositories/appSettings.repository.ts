import { IAppSettingsDocument } from "../models/appSettings.model";

export class AppSettingsRepository {
  private async getModel() {
    return (await import("../models/appSettings.model")).default;
  }

  async get(): Promise<IAppSettingsDocument> {
    const AppSettings = await this.getModel();
    let settings = await AppSettings.findOne();
    if (!settings) {
      settings = await AppSettings.create({ customMarginPercentage: 0 });
    }
    return settings;
  }

  async update(data: {
    customMarginPercentage?: number;
    marginMode?: "fallback" | "override";
    globalAdminEmail?: string;
    ccGlobalAdmin?: boolean;
  }): Promise<IAppSettingsDocument> {
    const AppSettings = await this.getModel();
    let settings = await AppSettings.findOne();
    if (!settings) {
      settings = await AppSettings.create(data);
    } else {
      if (data.customMarginPercentage !== undefined) {
        settings.customMarginPercentage = data.customMarginPercentage;
      }
      if (data.marginMode !== undefined) {
        settings.marginMode = data.marginMode;
      }
      if (data.globalAdminEmail !== undefined) {
        settings.globalAdminEmail = data.globalAdminEmail;
      }
      if (data.ccGlobalAdmin !== undefined) {
        settings.ccGlobalAdmin = data.ccGlobalAdmin;
      }
      await settings.save();
    }
    return settings;
  }
}

export default new AppSettingsRepository();
