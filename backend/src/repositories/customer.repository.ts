import { FilterQuery } from "mongoose";
import Customer from "../models/customer.model";
import {
  ICustomerDocument,
  ICreateCustomerDto,
  IUpdateCustomerDto,
  ICustomerResponseDto,
} from "../types/customer.types";

class CustomerRepository {
  async create(
    customerData: ICreateCustomerDto,
  ): Promise<ICustomerResponseDto> {
    const customer = await Customer.create(customerData);
    return this.toResponseDto(customer);
  }

  async createMany(
    customersData: ICreateCustomerDto[],
  ): Promise<ICustomerResponseDto[]> {
    const customers = await Customer.insertMany(customersData, {
      ordered: false,
    });
    return customers.map((c) => this.toResponseDto(c as ICustomerDocument));
  }

  async findById(id: string): Promise<ICustomerResponseDto | null> {
    const customer = await Customer.findById(id).lean();
    return customer ? this.toResponseDto(customer as ICustomerDocument) : null;
  }

  async findByBusinessId(
    businessId: string,
  ): Promise<ICustomerDocument | null> {
    return await Customer.findOne({ businessId });
  }

  async findAll(
    filter: FilterQuery<ICustomerDocument> = {},
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    customers: ICustomerResponseDto[];
    total: number;
    page: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;

    // Handle search filter
    let searchFilter: FilterQuery<ICustomerDocument> = {};
    if (filter.search && typeof filter.search === "string") {
      const searchTerm = filter.search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (searchTerm) {
        searchFilter = {
          $or: [
            { companyName: { $regex: searchTerm, $options: "i" } },
            { contactPerson: { $regex: searchTerm, $options: "i" } },
            { businessId: { $regex: searchTerm, $options: "i" } },
            { email: { $regex: searchTerm, $options: "i" } },
            { city: { $regex: searchTerm, $options: "i" } },
            { postcode: { $regex: searchTerm, $options: "i" } },
            { phone: { $regex: searchTerm, $options: "i" } },
            { address: { $regex: searchTerm, $options: "i" } },
            { country: { $regex: searchTerm, $options: "i" } },
          ],
        };
      }
    }

    // Handle date range filter
    const dateFilter: FilterQuery<ICustomerDocument> = {};
    if (filter.createdAtFrom || filter.createdAtTo) {
      dateFilter.createdAt = {};
      if (filter.createdAtFrom && typeof filter.createdAtFrom === "string") {
        (dateFilter.createdAt as Record<string, Date>).$gte = new Date(
          filter.createdAtFrom,
        );
      }
      if (filter.createdAtTo && typeof filter.createdAtTo === "string") {
        (dateFilter.createdAt as Record<string, Date>).$lte = new Date(
          filter.createdAtTo,
        );
      }
    }

    // Remove search and date params from filter to avoid conflicts
    const baseFilter = Object.fromEntries(
      Object.entries(filter).filter(
        ([key]) => !["search", "createdAtFrom", "createdAtTo"].includes(key),
      ),
    );

    // Combine base filter with search filter and date filter
    const finalFilter: FilterQuery<ICustomerDocument> = {
      ...baseFilter,
      ...searchFilter,
      ...dateFilter,
    };

    const [customers, total] = await Promise.all([
      Customer.find(finalFilter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      Customer.countDocuments(finalFilter),
    ]);

    return {
      customers: customers.map((customer) =>
        this.toResponseDto(customer as ICustomerDocument),
      ),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async update(
    id: string,
    updateData: Partial<IUpdateCustomerDto>,
    fieldsToUnset?: string[],
  ): Promise<ICustomerResponseDto | null> {
    const updateOp: Record<string, unknown> = {};
    if (Object.keys(updateData).length > 0) {
      updateOp.$set = updateData;
    }
    if (fieldsToUnset && fieldsToUnset.length > 0) {
      updateOp.$unset = Object.fromEntries(fieldsToUnset.map((f) => [f, ""]));
    }
    const customer = await Customer.findByIdAndUpdate(id, updateOp, {
      new: true,
      runValidators: true,
    });
    return customer ? this.toResponseDto(customer) : null;
  }

  async delete(id: string): Promise<ICustomerResponseDto | null> {
    const customer = await Customer.findByIdAndDelete(id);
    return customer ? this.toResponseDto(customer) : null;
  }

  async existsByBusinessId(businessId: string): Promise<boolean> {
    if (!businessId || !businessId.trim()) return false;
    const count = await Customer.countDocuments({ businessId });
    return count > 0;
  }

  async count(): Promise<number> {
    return await Customer.countDocuments();
  }

  async incrementTotals(
    customerId: string,
    salesAmount: number,
    marginAmount: number,
  ): Promise<ICustomerResponseDto | null> {
    const customer = await Customer.findByIdAndUpdate(
      customerId,
      {
        $inc: {
          totalSales: salesAmount,
          totalMargin: marginAmount,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );
    return customer ? this.toResponseDto(customer) : null;
  }

  private toResponseDto(customer: ICustomerDocument): ICustomerResponseDto {
    return {
      _id: customer._id.toString(),
      companyName: customer.companyName,
      businessId: customer.businessId,
      contactPerson: customer.contactPerson,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      city: customer.city,
      postcode: customer.postcode,
      country: customer.country,
      notes: customer.notes || "",
      companyLogo: customer.companyLogo || "",
      totalSales: customer.totalSales,
      totalMargin: customer.totalMargin,
      discountPercent: customer.discountPercent,
      createdAt: customer.createdAt || new Date(),
      updatedAt: customer.updatedAt || new Date(),
    };
  }
}

export default new CustomerRepository();
