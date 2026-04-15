import customerRepository from "../repositories/customer.repository";
import offerRepository from "../repositories/offer.repository";
import orderRepository from "../repositories/order.repository";
import Offer from "../models/offer.model";
import Order from "../models/order.model";
import {
  ICreateCustomerDto,
  IUpdateCustomerDto,
  ICustomerResponseDto,
} from "../types/customer.types";
import { uploadToCloudinary } from "../utils/cloudinary";
import { AppError } from "../middlewares/errorHandler.middleware";

// Set to true once demo customers have been seeded so we don't hit the DB
// on every list request for the count check.
let _demoSeeded = false;

class CustomerService {
  async createCustomer(
    customerData: ICreateCustomerDto,
  ): Promise<ICustomerResponseDto> {
    // Strip empty businessId so it's not stored (sparse unique index requires missing, not "")
    if (!customerData.businessId?.trim()) {
      delete customerData.businessId;
    }

    // Check if customer with this business ID already exists (only if provided)
    if (customerData.businessId) {
      const businessIdExists = await customerRepository.existsByBusinessId(
        customerData.businessId,
      );
      if (businessIdExists) {
        throw new Error("Customer with this business ID already exists");
      }
    }

    // Upload company logo to Cloudinary if provided as base64
    if (
      customerData.companyLogo &&
      customerData.companyLogo.startsWith("data:")
    ) {
      const logoUrl = await uploadToCloudinary(customerData.companyLogo);
      if (logoUrl) {
        customerData.companyLogo = logoUrl;
      }
    }

    return await customerRepository.create(customerData);
  }

  async getCustomerById(id: string): Promise<ICustomerResponseDto> {
    const customer = await customerRepository.findById(id);
    if (!customer) {
      throw new Error("Customer not found");
    }
    return customer;
  }

  async getAllCustomers(
    filter: Record<string, unknown> = {},
    page: number = 1,
    limit: number = 10,
  ) {
    // Only query the DB for the seeding check once per process lifetime.
    if (!_demoSeeded) {
      const customerCount = await customerRepository.count();
      if (customerCount === 0) {
        await this.seedDemoCustomers();
      } else {
        _demoSeeded = true;
      }
    }
    return await customerRepository.findAll(filter, page, limit);
  }

  async updateCustomer(
    id: string,
    updateData: Partial<IUpdateCustomerDto>,
  ): Promise<ICustomerResponseDto> {
    // Check if customer exists
    const existingCustomer = await customerRepository.findById(id);
    if (!existingCustomer) {
      throw new Error("Customer not found");
    }

    // If businessId is empty, unset it so the sparse unique index ignores it
    const fieldsToUnset: string[] = [];
    if ("businessId" in updateData && !updateData.businessId?.trim()) {
      delete updateData.businessId;
      fieldsToUnset.push("businessId");
    }

    // Upload company logo to Cloudinary if provided as base64
    if (updateData.companyLogo && updateData.companyLogo.startsWith("data:")) {
      const logoUrl = await uploadToCloudinary(updateData.companyLogo);
      if (logoUrl) {
        updateData.companyLogo = logoUrl;
      }
    } else if ("companyLogo" in updateData && !updateData.companyLogo) {
      // Logo was explicitly removed — clear it
      updateData.companyLogo = "";
    }

    // If business ID is being updated, check if it's already taken by another customer
    if (
      updateData.businessId &&
      updateData.businessId !== existingCustomer.businessId
    ) {
      const businessIdExists = await customerRepository.existsByBusinessId(
        updateData.businessId,
      );
      if (businessIdExists) {
        throw new Error("Business ID already in use");
      }
    }

    const updatedCustomer = await customerRepository.update(
      id,
      updateData,
      fieldsToUnset,
    );
    if (!updatedCustomer) {
      throw new Error("Failed to update customer");
    }

    // Cascade customer info changes to denormalized fields in offers and orders
    const customerFields: Record<string, string> = {};
    if (updateData.companyName !== undefined)
      customerFields.customerName = updateData.companyName;
    if (updateData.contactPerson !== undefined)
      customerFields.contactPerson = updateData.contactPerson;
    if (updateData.email !== undefined) customerFields.email = updateData.email;
    if (updateData.phone !== undefined) customerFields.phone = updateData.phone;
    if (updateData.address !== undefined)
      customerFields.address = updateData.address;

    if (Object.keys(customerFields).length > 0) {
      try {
        await Promise.all([
          offerRepository.updateManyByCustomerId(id, customerFields),
          orderRepository.updateManyByCustomerId(id, customerFields),
        ]);
      } catch (cascadeError) {
        console.error(
          "Failed to cascade customer updates to offers/orders:",
          cascadeError,
        );
      }
    }

    return updatedCustomer;
  }

  async deleteCustomer(id: string): Promise<ICustomerResponseDto> {
    const customer = await customerRepository.findById(id);
    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    // Cascade check: prevent deletion if customer has related offers or orders
    const [offerCount, orderCount] = await Promise.all([
      Offer.countDocuments({ customerId: id }),
      Order.countDocuments({ customerId: id }),
    ]);
    if (offerCount > 0 || orderCount > 0) {
      const parts: string[] = [];
      if (offerCount > 0) parts.push(`${offerCount} offer(s)`);
      if (orderCount > 0) parts.push(`${orderCount} order(s)`);
      throw new AppError(
        `Cannot delete customer with ${parts.join(" and ")}. Remove related records first.`,
        409,
      );
    }

    const deletedCustomer = await customerRepository.delete(id);
    if (!deletedCustomer) {
      throw new AppError("Failed to delete customer", 500);
    }
    return deletedCustomer;
  }

  async seedDemoCustomers(): Promise<ICustomerResponseDto[]> {
    // Check if customers already exist
    const customerCount = await customerRepository.count();
    if (customerCount > 0) {
      return [];
    }

    const demoCustomers: ICreateCustomerDto[] = [
      {
        companyName: "Yritys ABC Oy",
        businessId: "2912646-7",
        contactPerson: "Patricia Virtanen",
        phone: "+358 40 123 4567",
        email: "patricia@yritysabc.fi",
        address: "Vaunukatu 11, 20100 Turku",
        city: "Turku",
        postcode: "20100",
        country: "Finland",
        totalSales: 45200,
        totalMargin: 28600,
        discountPercent: 5,
      },
      {
        companyName: "Br�ndivaate Oy",
        businessId: "1234567-8",
        contactPerson: "Mikko Lahtinen",
        phone: "+358 50 987 6543",
        email: "mikko@brandivaate.fi",
        address: "H�meenkatu 5, 33100 Tampere",
        city: "Tampere",
        postcode: "33100",
        country: "Finland",
        totalSales: 18900,
        totalMargin: 12400,
        discountPercent: 3,
      },
      {
        companyName: "Tech Solutions Finland",
        businessId: "9876543-2",
        contactPerson: "Anna Korhonen",
        phone: "+358 44 555 1234",
        email: "anna@techsolutions.fi",
        address: "Mannerheimintie 22, 00100 Helsinki",
        city: "Helsinki",
        postcode: "00100",
        country: "Finland",
        totalSales: 12300,
        totalMargin: 7800,
        discountPercent: 0,
      },
      {
        companyName: "Green Events Oy",
        businessId: "5555555-1",
        contactPerson: "Jari M�kinen",
        phone: "+358 41 222 3333",
        email: "jari@greenevents.fi",
        address: "Kauppakatu 8, 40100 Jyv�skyl�",
        city: "Helsinki",
        postcode: "40100",
        country: "Finland",
        totalSales: 0,
        totalMargin: 0,
        discountPercent: 0,
      },
      {
        companyName: "Digital Marketing Pro",
        businessId: "1111111-1",
        contactPerson: "Sofia Lindberg",
        phone: "+358 45 111 2222",
        email: "sofia@digitalpro.fi",
        address: "Aleksanterinkatu 15, 00100 Helsinki",
        city: "Helsinki",
        postcode: "00100",
        country: "Finland",
        totalSales: 25600,
        totalMargin: 18200,
        discountPercent: 2,
      },
      {
        companyName: "Nordic Design Studio",
        businessId: "2222222-2",
        contactPerson: "Erik Johansson",
        phone: "+358 46 333 4444",
        email: "erik@nordicdesign.fi",
        address: "Erottajankatu 7, 00100 Helsinki",
        city: "Helsinki",
        postcode: "00100",
        country: "Finland",
        totalSales: 67800,
        totalMargin: 42500,
        discountPercent: 8,
      },
      {
        companyName: "Suomi Tech Solutions",
        businessId: "3333333-3",
        contactPerson: "Laura Virtanen",
        phone: "+358 47 555 6666",
        email: "laura@suomitech.fi",
        address: "It�merenkatu 3, 00100 Helsinki",
        city: "Helsinki",
        postcode: "00100",
        country: "Finland",
        totalSales: 34500,
        totalMargin: 22100,
        discountPercent: 4,
      },
      {
        companyName: "Event Planning Oy",
        businessId: "4444444-4",
        contactPerson: "Markus Niemi",
        phone: "+358 48 777 8888",
        email: "markus@eventplanning.fi",
        address: "Porthaninkatu 9, 00500 Helsinki",
        city: "Helsinki",
        postcode: "00500",
        country: "Finland",
        totalSales: 0,
        totalMargin: 0,
        discountPercent: 0,
      },
      {
        companyName: "Finnish Logistics Group",
        businessId: "5555556-5",
        contactPerson: "Heikki Kallio",
        phone: "+358 49 999 0000",
        email: "heikki@logistics.fi",
        address: "Teollisuuskatu 21, 00500 Helsinki",
        city: "Helsinki",
        postcode: "00500",
        country: "Finland",
        totalSales: 52300,
        totalMargin: 34800,
        discountPercent: 6,
      },
      {
        companyName: "Creative Solutions Finland",
        businessId: "6666666-6",
        contactPerson: "Tiina Laine",
        phone: "+358 50 111 2222",
        email: "tiina@creative.fi",
        address: "L�nnrotinkatu 27, 00100 Helsinki",
        city: "Helsinki",
        postcode: "00100",
        country: "Finland",
        totalSales: 89400,
        totalMargin: 56700,
        discountPercent: 10,
      },
    ];

    const createdCustomers = await customerRepository.createMany(demoCustomers);
    _demoSeeded = true;
    return createdCustomers;
  }
}

export default new CustomerService();
