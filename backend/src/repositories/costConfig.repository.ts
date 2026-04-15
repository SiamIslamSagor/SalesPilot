import { ICostConfigDocument } from "../models/costConfig.model";

export class CostConfigRepository {
  async create(
    data: Partial<ICostConfigDocument>,
  ): Promise<ICostConfigDocument> {
    const CostConfig = (await import("../models/costConfig.model")).default;
    const item = new CostConfig(data);
    return item.save();
  }

  async findAll(): Promise<ICostConfigDocument[]> {
    const CostConfig = (await import("../models/costConfig.model")).default;
    return CostConfig.find().sort({ sortOrder: 1, createdAt: 1 });
  }

  async findEnabled(): Promise<ICostConfigDocument[]> {
    const CostConfig = (await import("../models/costConfig.model")).default;
    return CostConfig.find({ enabled: true }).sort({
      sortOrder: 1,
      createdAt: 1,
    });
  }

  async findById(id: string): Promise<ICostConfigDocument | null> {
    const CostConfig = (await import("../models/costConfig.model")).default;
    return CostConfig.findById(id);
  }

  async updateById(
    id: string,
    data: Partial<ICostConfigDocument>,
  ): Promise<ICostConfigDocument | null> {
    const CostConfig = (await import("../models/costConfig.model")).default;
    return CostConfig.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteById(id: string): Promise<boolean> {
    const CostConfig = (await import("../models/costConfig.model")).default;
    const result = await CostConfig.findByIdAndDelete(id);
    return !!result;
  }

  async bulkUpsert(
    items: Array<Partial<ICostConfigDocument> & { _id?: string }>,
  ): Promise<ICostConfigDocument[]> {
    const CostConfig = (await import("../models/costConfig.model")).default;

    const ops = items.map((item) => {
      if (item._id) {
        return {
          updateOne: {
            filter: { _id: item._id },
            update: {
              $set: {
                name: item.name,
                type: item.type,
                value: item.value,
                category: item.category,
                enabled: item.enabled,
                sortOrder: item.sortOrder,
              },
            },
            upsert: true,
          },
        };
      }
      return {
        insertOne: {
          document: item,
        },
      };
    });

    if (ops.length > 0) {
      await CostConfig.bulkWrite(ops);
    }

    return this.findAll();
  }
}

export default new CostConfigRepository();
