import Offer from "../models/offer.model";
import { IOfferDocument } from "../models/offer.model";
import { CreateOfferRequest } from "../types/offer.types";

class OfferRepository {
  /**
   * Generate the next sequential offer number in O-XXX format
   */
  private async generateNextOfferNumber(): Promise<string> {
    // Find the last offer with O-NNN... format, sorted by creation time
    const lastOffer = await Offer.findOne({
      offerNumber: /^O-\d+$/,
    }).sort({ createdAt: -1 });

    let nextNumber = 1;
    if (lastOffer) {
      const lastNumber = parseInt(lastOffer.offerNumber.split("-")[1]);
      nextNumber = lastNumber + 1;
    }

    return `O-${nextNumber.toString().padStart(3, "0")}`;
  }

  async create(offerData: CreateOfferRequest): Promise<IOfferDocument> {
    // Generate unique offer number in O-XXX format
    const offerNumber = await this.generateNextOfferNumber();

    const offer = await Offer.create({
      ...offerData,
      offerNumber,
      status: "draft",
    });
    return offer;
  }

  async findById(id: string): Promise<IOfferDocument | null> {
    return await Offer.findById(id);
  }

  async findByIdLean(id: string): Promise<IOfferDocument | null> {
    return (await Offer.findById(id).lean()) as IOfferDocument | null;
  }

  async findByAccessCode(accessCode: string): Promise<IOfferDocument | null> {
    return await Offer.findOne({ accessCode });
  }

  async findByOfferNumber(offerNumber: string): Promise<IOfferDocument | null> {
    return await Offer.findOne({ offerNumber });
  }

  async findByCustomerId(
    customerId: string,
    page: number = 1,
    limit: number = 10,
    baseFilter: Record<string, unknown> = {},
  ): Promise<{
    offers: IOfferDocument[];
    total: number;
    page: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {
      ...baseFilter,
      customerId,
    };

    const [offers, total] = await Promise.all([
      Offer.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Offer.countDocuments(filter),
    ]);

    return {
      offers,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: string,
    search?: string,
    baseFilter: Record<string, unknown> = {},
  ): Promise<{
    offers: IOfferDocument[];
    total: number;
    page: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { ...baseFilter };
    const andClauses: Record<string, unknown>[] = [];
    if (status) {
      filter.status = status;
    }
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      andClauses.push({
        $or: [
          { offerNumber: { $regex: escapedSearch, $options: "i" } },
          { customerName: { $regex: escapedSearch, $options: "i" } },
        ],
      });
    }

    if (filter.$and && Array.isArray(filter.$and)) {
      andClauses.unshift(...(filter.$and as Record<string, unknown>[]));
      delete filter.$and;
    }

    if (andClauses.length > 0) {
      filter.$and = andClauses;
    }

    // Project only the fields needed for the list view – skip the
    // heavy embedded `items` sub-documents (unit prices, mockups, etc.)
    // but keep productName so the UI can show "first item + N more".
    const listProjection = {
      offerNumber: 1,
      ownerUserId: 1,
      customerId: 1,
      customerName: 1,
      contactPerson: 1,
      email: 1,
      phone: 1,
      address: 1,
      itemCount: 1,
      totalAmount: 1,
      status: 1,
      customerResponse: 1,
      customerComments: 1,
      respondedAt: 1,
      version: 1,
      "items.productName": 1,
      "offerDetails.validUntil": 1,
      "offerDetails.validDays": 1,
      createdAt: 1,
      updatedAt: 1,
    };

    const [offers, total] = await Promise.all([
      Offer.find(filter, listProjection)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Offer.countDocuments(filter),
    ]);

    return {
      offers: offers as unknown as IOfferDocument[],
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async update(
    id: string,
    updateData: Partial<IOfferDocument>,
  ): Promise<IOfferDocument | null> {
    const offer = await Offer.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    return offer;
  }

  async updateStatus(
    id: string,
    status:
      | "draft"
      | "sent"
      | "accepted"
      | "rejected"
      | "expired"
      | "completed",
  ): Promise<IOfferDocument | null> {
    const offer = await Offer.findByIdAndUpdate(
      id,
      { status },
      {
        new: true,
        runValidators: true,
      },
    );
    return offer;
  }

  async bulkExpireByIds(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const result = await Offer.updateMany(
      { _id: { $in: ids } },
      { $set: { status: "expired" } },
    );
    return result.modifiedCount;
  }

  async delete(id: string): Promise<IOfferDocument | null> {
    const offer = await Offer.findByIdAndDelete(id);
    return offer;
  }

  async count(): Promise<number> {
    return await Offer.countDocuments();
  }

  async countByStatus(status: string): Promise<number> {
    return await Offer.countDocuments({ status });
  }

  async updateManyByCustomerId(
    customerId: string,
    customerFields: {
      customerName?: string;
      contactPerson?: string;
      email?: string;
      phone?: string;
      address?: string;
    },
  ): Promise<number> {
    const result = await Offer.updateMany(
      { customerId },
      { $set: customerFields },
    );
    return result.modifiedCount;
  }

  async createDuplicate(
    offerData: Partial<IOfferDocument>,
  ): Promise<IOfferDocument> {
    // Generate unique offer number in O-XXX format
    const offerNumber = await this.generateNextOfferNumber();

    const offer = await Offer.create({
      ...offerData,
      offerNumber,
      status: "draft",
    });
    return offer;
  }
}

export default new OfferRepository();
