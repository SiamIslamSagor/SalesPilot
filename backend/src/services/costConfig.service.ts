import costConfigRepository from "../repositories/costConfig.repository";
import { ICostConfigDocument } from "../models/costConfig.model";
import { AppError } from "../middlewares/errorHandler.middleware";

class CostConfigService {
  async getAll(): Promise<ICostConfigDocument[]> {
    return costConfigRepository.findAll();
  }

  async getEnabled(): Promise<ICostConfigDocument[]> {
    return costConfigRepository.findEnabled();
  }

  async getById(id: string): Promise<ICostConfigDocument> {
    const item = await costConfigRepository.findById(id);
    if (!item) {
      throw new AppError("Cost config item not found", 404);
    }
    return item;
  }

  async create(data: {
    name: string;
    type: "fixed" | "percentage";
    value: number;
    category: "cost" | "margin";
    enabled?: boolean;
    sortOrder?: number;
  }): Promise<ICostConfigDocument> {
    return costConfigRepository.create(data);
  }

  async update(
    id: string,
    data: {
      name?: string;
      type?: "fixed" | "percentage";
      value?: number;
      category?: "cost" | "margin";
      enabled?: boolean;
      sortOrder?: number;
    },
  ): Promise<ICostConfigDocument> {
    const item = await costConfigRepository.updateById(id, data);
    if (!item) {
      throw new AppError("Cost config item not found", 404);
    }
    return item;
  }

  async delete(id: string): Promise<void> {
    const deleted = await costConfigRepository.deleteById(id);
    if (!deleted) {
      throw new AppError("Cost config item not found", 404);
    }
  }

  async bulkSave(
    items: Array<{
      _id?: string;
      name: string;
      type: "fixed" | "percentage";
      value: number;
      category: "cost" | "margin";
      enabled: boolean;
      sortOrder: number;
    }>,
  ): Promise<ICostConfigDocument[]> {
    return costConfigRepository.bulkUpsert(items);
  }

  /**
   * Calculate cost config adjustments for an order.
   * Returns the total adjustment to margin (positive = adds, negative = deducts)
   * and the breakdown of applied items.
   */
  calculateAdjustments(
    enabledConfigs: ICostConfigDocument[],
    orderTotalAmount: number,
  ): {
    marginAdjustment: number;
    appliedCosts: Array<{
      name: string;
      type: "fixed" | "percentage";
      category: "cost" | "margin";
      value: number;
      calculatedAmount: number;
    }>;
  } {
    let marginAdjustment = 0;
    const appliedCosts: Array<{
      name: string;
      type: "fixed" | "percentage";
      category: "cost" | "margin";
      value: number;
      calculatedAmount: number;
    }> = [];

    // Guard against invalid order total
    const safeOrderTotal =
      Number.isFinite(orderTotalAmount) && orderTotalAmount >= 0
        ? orderTotalAmount
        : 0;

    for (const config of enabledConfigs) {
      let calculatedAmount = 0;

      const safeValue =
        Number.isFinite(config.value) && config.value >= 0 ? config.value : 0;

      if (config.type === "fixed") {
        calculatedAmount = safeValue;
      } else {
        // percentage: calculated on order total, capped at 100%
        const cappedPercentage = Math.min(safeValue, 100);
        calculatedAmount = (safeOrderTotal * cappedPercentage) / 100;
      }

      // "cost" items reduce margin, "margin" items increase margin
      if (config.category === "cost") {
        marginAdjustment -= calculatedAmount;
      } else {
        marginAdjustment += calculatedAmount;
      }

      appliedCosts.push({
        name: config.name,
        type: config.type,
        category: config.category,
        value: config.value,
        calculatedAmount:
          config.category === "cost" ? -calculatedAmount : calculatedAmount,
      });
    }

    return { marginAdjustment, appliedCosts };
  }
}

export default new CostConfigService();
