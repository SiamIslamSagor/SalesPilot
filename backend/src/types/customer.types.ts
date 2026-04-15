import { Document } from "mongoose";

export interface ICustomer {
  companyName: string;
  businessId?: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postcode: string;
  country?: string;
  notes: string;
  companyLogo?: string;
  totalSales: number;
  totalMargin: number;
  discountPercent: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICustomerDocument extends ICustomer, Document {
  _id: string;
}

export interface ICreateCustomerDto {
  companyName: string;
  businessId?: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postcode: string;
  country?: string;
  notes?: string;
  companyLogo?: string;
  totalSales?: number;
  totalMargin?: number;
  discountPercent?: number;
}

export interface IUpdateCustomerDto {
  companyName?: string;
  businessId?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  postcode?: string;
  country?: string;
  notes?: string;
  companyLogo?: string;
  totalSales?: number;
  totalMargin?: number;
  discountPercent?: number;
}

export interface ICustomerResponseDto {
  _id: string;
  companyName: string;
  businessId?: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postcode: string;
  country?: string;
  notes: string;
  companyLogo?: string;
  totalSales: number;
  totalMargin: number;
  discountPercent: number;
  createdAt: Date;
  updatedAt: Date;
}
