import appSettingsRepository from "../repositories/appSettings.repository";
import { IAppSettingsDocument } from "../models/appSettings.model";

const CACHE_TTL_MS = 60_000; // 1 minute

class AppSettingsService {
  private _cache: IAppSettingsDocument | null = null;
  private _cacheExpiresAt = 0;

  async get(): Promise<IAppSettingsDocument> {
    if (this._cache && Date.now() < this._cacheExpiresAt) {
      return this._cache;
    }
    const settings = await appSettingsRepository.get();
    this._cache = settings;
    this._cacheExpiresAt = Date.now() + CACHE_TTL_MS;
    return settings;
  }

  async update(data: {
    customMarginPercentage?: number;
    marginMode?: "fallback" | "override";
    globalAdminEmail?: string;
    ccGlobalAdmin?: boolean;
  }): Promise<IAppSettingsDocument> {
    const settings = await appSettingsRepository.update(data);
    // Refresh cache immediately on write
    this._cache = settings;
    this._cacheExpiresAt = Date.now() + CACHE_TTL_MS;
    return settings;
  }
}

export default new AppSettingsService();
