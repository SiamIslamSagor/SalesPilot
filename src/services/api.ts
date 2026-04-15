import axios, { AxiosInstance, AxiosError } from "axios";
import type { DashboardData } from "@/types/dashboard.types";

export type OfferStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired"
  | "completed";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginUser {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data: LoginUser;
  token?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ field?: string; message: string }>;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "superadmin";
  createdAt: string;
  updatedAt: string;
}

interface UsersResponse {
  success: boolean;
  message?: string;
  data: User[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

interface FetchUsersParams {
  page?: number;
  limit?: number;
  role?: "admin" | "superadmin";
}

interface ResetPasswordParams {
  userId: string;
  newPassword: string;
}

interface ResetPasswordResponse {
  success: boolean;
  message: string;
  data?: User;
}

interface ProductVariant {
  id?: string;
  size?: string;
  color?: string;
  colorCode?: string;
  sku?: string;
  price?: number;
}

interface Product {
  _id?: string;
  id: string;
  productNumber: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  gender: string;
  fabrics: string;
  purchasePrice: number;
  salesPrice: number;
  margin: number;
  status: "active" | "inactive";
  images: string[];
  imageUrl?: string;
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

interface ProductsResponse {
  success: boolean;
  message?: string;
  data: Product[];
  pagination?: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

interface FetchProductsParams {
  page?: number;
  limit?: number;
  category?: string;
  brand?: string;
  gender?: string;
  search?: string;
  ids?: string[];
  productNumbers?: string[];
}

export interface OfferItem {
  productId: string;
  productNumber: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  markingCost: number;
  internalMarkingCost: number;
  showUnitPrice: boolean;
  showTotalPrice: boolean;
  hideMarkingCost: boolean;
  generateMockup: boolean;
  mockupImage?: string;
}

export interface SpecialCost {
  name: string;
  amount: number;
}

export interface Offer {
  _id: string;
  offerNumber: string;
  customerId: string;
  customerName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  items: OfferItem[];
  offerDetails: {
    validUntil?: string;
    validDays?: string;
    showTotalPrice: boolean;
    additionalTermsEnabled: boolean;
    additionalTerms?: string;
    specialCosts?: SpecialCost[];
  };
  totalAmount: number;
  itemCount: number;
  status: OfferStatus;
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  productId: string;
  productNumber: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  markingCost: number;
  internalMarkingCost: number;
  selectedColor?: string;
  selectedSize?: string;
  printingMethod?: string;
  showUnitPrice: boolean;
  showTotalPrice: boolean;
  hideMarkingCost: boolean;
  generateMockup: boolean;
}

export interface Order {
  _id: string;
  orderNumber: string;
  offerId: string;
  offerNumber?: string;
  customerId: string;
  customerName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  items: OrderItem[];
  specialCosts?: SpecialCost[];
  totalAmount: number;
  totalMargin: number;
  salesperson?: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

interface OrdersResponse {
  success: boolean;
  message?: string;
  data: Order[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

interface CreateOrderFromQuoteParams {
  offerId: string;
  items: Array<{
    productId: string;
    selectedColor?: string;
    selectedSize?: string;
    printingMethod?: string;
    quantity?: number;
  }>;
  salesperson?: string;
}

// printing sheet types
export interface PrintingSheet {
  _id?: string;
  productId: string;
  productNumber: string;
  productName: string;
  productImage?: string;
  mockupImage?: string;
  orderDate: string;
  reference: string;
  seller: string;
  deliveryDate: string;
  deliveryTime: string;
  customerName: string;
  printMethod: string;
  printMethodOther?: string;
  sizeQuantities: Record<string, string>;
  workInstructions?: string;
  totalQuantity: number;
  offerId: string;
  orderId?: string;
  groupId?: string; // groups sheets created together for multi-page PDF
  createdAt?: string;
  updatedAt?: string;
}

// input type for creating/saving sheets (doesn't include backend-generated fields)
interface PrintingSheetInput {
  productId: string;
  productNumber: string;
  productName: string;
  productImage?: string;
  mockupImage?: string;
  orderDate: string;
  reference: string;
  seller: string;
  deliveryDate: string;
  deliveryTime: string;
  customerName: string;
  printMethod: string;
  printMethodOther?: string;
  sizeQuantities: Record<string, string>;
  workInstructions?: string;
  totalQuantity: number;
  groupId?: string; // groups sheets created together for multi-page PDF
}

interface CreatePrintingSheetsParams {
  offerId: string;
  orderId?: string;
  sheets: PrintingSheetInput[];
}

interface PrintingSheetsResponse {
  success: boolean;
  message?: string;
  data: PrintingSheet[];
}

interface GetPrintingSheetsParams {
  offerId?: string;
  orderId?: string;
}

export interface Customer {
  _id: string;
  id: string;
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
  createdAt: string;
  updatedAt: string;
}

interface CustomersResponse {
  success: boolean;
  message?: string;
  data: Customer[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

interface FetchCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
}

interface CreateCustomerParams {
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

interface UpdateCustomerParams {
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

/**
 * Convert an image URL to a base64 data URI.
 * Returns the original string unchanged if it's already base64/data URI.
 */
async function imageUrlToBase64(input: string): Promise<string> {
  if (!input.startsWith("http")) return input;
  const response = await fetch(input);
  if (!response.ok)
    throw new Error(`Failed to fetch image: ${response.status}`);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

class ApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor to include auth token
    this.axiosInstance.interceptors.request.use(
      config => {
        const token = localStorage.getItem("qt_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      },
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      response => response,
      (error: AxiosError) => {
        if (error.response) {
          // Auto-logout on 401 (expired/invalid token)
          if (error.response.status === 401) {
            localStorage.removeItem("qt_token");
            localStorage.removeItem("qt_user");
          }
        }
        return Promise.reject(error);
      },
    );
  }

  async login(
    credentials: LoginCredentials,
  ): Promise<LoginUser | { success: false; message: string }> {
    try {
      const response = await this.axiosInstance.post<LoginResponse>(
        "/auth/login",
        credentials,
      );

      if (response.data.success && response.data.data) {
        // Store JWT token if present
        if (response.data.token) {
          localStorage.setItem("qt_token", response.data.token);
        }
        return response.data.data;
      }

      return {
        success: false,
        message: response.data.message || "Login failed",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Login failed. Please try again later.",
      };

      return {
        success: false,
        message: errorData.message || "Login failed. Please try again later.",
      };
    }
  }

  async fetchUsers(
    params?: FetchUsersParams,
  ): Promise<UsersResponse | { success: false; message: string }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.role) queryParams.append("role", params.role);

      const url = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await this.axiosInstance.get<UsersResponse>(url);

      if (response.data.success) {
        return response.data;
      }

      return {
        success: false,
        message: response.data.message || "Failed to fetch users",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to fetch users. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message || "Failed to fetch users. Please try again later.",
      };
    }
  }

  async createUser(userData: {
    name: string;
    email: string;
    role: "admin" | "superadmin";
    password?: string;
  }): Promise<ApiResponse<User>> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<User>>(
        "/users",
        userData,
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
        errors?: Array<{
          field?: string;
          path?: string;
          msg?: string;
          message?: string;
        }>;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to create user. Please try again later.",
      };
      return {
        success: false,
        message:
          errorData.message || "Failed to create user. Please try again later.",
        errors: errorData.errors?.map(e => ({
          field: e.field || e.path,
          message: e.message || e.msg || "Invalid value",
        })),
      };
    }
  }

  async deleteUser(
    id: string,
  ): Promise<
    { success: true; message: string } | { success: false; message: string }
  > {
    try {
      const response = await this.axiosInstance.delete<{
        success: true;
        message: string;
      }>(`/users/${id}`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      return {
        success: false,
        message:
          axiosError.response?.data?.message ||
          "Failed to delete user. Please try again later.",
      };
    }
  }

  async resetPassword(
    params: ResetPasswordParams,
  ): Promise<ResetPasswordResponse | { success: false; message: string }> {
    try {
      const response = await this.axiosInstance.post<ResetPasswordResponse>(
        `/auth/reset-password`,
        params,
      );

      if (response.data.success) {
        return response.data;
      }

      return {
        success: false,
        message: response.data.message || "Failed to reset password",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to reset password. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to reset password. Please try again later.",
      };
    }
  }

  async forgotPassword(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.axiosInstance.post<{
        success: boolean;
        message: string;
      }>("/auth/forgot-password", { email });

      return {
        success: response.data.success,
        message: response.data.message || "Password reset email sent",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to send password reset email. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to send password reset email. Please try again later.",
      };
    }
  }

  async resetPasswordWithToken(
    token: string,
    password: string,
    confirmPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.axiosInstance.post<{
        success: boolean;
        message: string;
      }>("/auth/reset-password", { token, password, confirmPassword });

      return {
        success: response.data.success,
        message: response.data.message || "Password reset successful",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
        errors?: Array<{ field?: string; message: string }>;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to reset password. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to reset password. Please try again later.",
      };
    }
  }

  async fetchProducts(
    params?: FetchProductsParams,
  ): Promise<ProductsResponse | { success: false; message: string }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.category) queryParams.append("category", params.category);
      if (params?.brand) queryParams.append("brand", params.brand);
      if (params?.gender) queryParams.append("gender", params.gender);
      if (params?.search) queryParams.append("search", params.search);
      if (params?.ids && params.ids.length > 0)
        queryParams.append("ids", params.ids.join(","));
      if (params?.productNumbers && params.productNumbers.length > 0)
        queryParams.append("productNumbers", params.productNumbers.join(","));

      const url = `/products${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await this.axiosInstance.get<ProductsResponse>(url);

      if (response.data.success) {
        // Map _id to id for frontend compatibility
        const mappedProducts = response.data.data.map(product => ({
          ...product,
          id: product._id || product.id,
        }));
        return {
          ...response.data,
          data: mappedProducts,
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to fetch products",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to fetch products. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to fetch products. Please try again later.",
      };
    }
  }

  async fetchProductById(
    id: string,
  ): Promise<
    { success: true; data: Product } | { success: false; message: string }
  > {
    try {
      const response = await this.axiosInstance.get<{
        success: boolean;
        data?: Product;
        message?: string;
      }>(`/products/${id}`);

      if (response.data.success && response.data.data) {
        const product = {
          ...response.data.data,
          id: response.data.data._id || response.data.data.id,
        };
        return { success: true, data: product };
      }

      return {
        success: false,
        message: response.data.message || "Failed to fetch product",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to fetch product.",
      };

      return {
        success: false,
        message: errorData.message || "Failed to fetch product.",
      };
    }
  }

  async fetchCategories(): Promise<
    { success: true; data: string[] } | { success: false; message: string }
  > {
    try {
      const response = await this.axiosInstance.get<{
        success: boolean;
        data?: string[];
        message?: string;
      }>("/products/categories");

      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data,
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to fetch categories",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to fetch categories. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to fetch categories. Please try again later.",
      };
    }
  }

  async fetchBrands(): Promise<
    { success: true; data: string[] } | { success: false; message: string }
  > {
    try {
      const response = await this.axiosInstance.get<{
        success: boolean;
        data?: string[];
        message?: string;
      }>("/products/brands");

      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data,
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to fetch brands",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to fetch brands. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to fetch brands. Please try again later.",
      };
    }
  }

  async fetchGenders(): Promise<
    { success: true; data: string[] } | { success: false; message: string }
  > {
    try {
      const response = await this.axiosInstance.get<{
        success: boolean;
        data?: string[];
        message?: string;
      }>("/products/genders");

      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data,
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to fetch genders",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to fetch genders. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to fetch genders. Please try again later.",
      };
    }
  }

  async updateProduct(
    id: string,
    productData: Partial<Product>,
  ): Promise<
    | { success: true; data: Product; message: string }
    | { success: false; message: string }
  > {
    try {
      const response = await this.axiosInstance.put<{
        success: boolean;
        data?: Product;
        message?: string;
      }>(`/products/${id}`, productData);

      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || "Product updated successfully",
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to update product",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to update product. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to update product. Please try again later.",
      };
    }
  }

  async createProduct(
    productData: Partial<Product>,
  ): Promise<
    | { success: true; data: Product; message: string }
    | { success: false; message: string }
  > {
    try {
      const response = await this.axiosInstance.post<{
        success: boolean;
        data?: Product;
        message?: string;
      }>("/products", productData);

      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || "Product created successfully",
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to create product",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to create product. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to create product. Please try again later.",
      };
    }
  }

  async deleteProduct(
    id: string,
  ): Promise<
    { success: true; message: string } | { success: false; message: string }
  > {
    try {
      const response = await this.axiosInstance.delete<{
        success: boolean;
        message?: string;
      }>(`/products/${id}`);

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || "Product deleted successfully",
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to delete product",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to delete product. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to delete product. Please try again later.",
      };
    }
  }

  async fetchCustomers(
    params?: FetchCustomersParams,
  ): Promise<CustomersResponse | { success: false; message: string }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.search) queryParams.append("search", params.search);
      if (params?.createdAtFrom)
        queryParams.append("createdAtFrom", params.createdAtFrom);
      if (params?.createdAtTo)
        queryParams.append("createdAtTo", params.createdAtTo);

      const url = `/customers${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await this.axiosInstance.get<CustomersResponse>(url);

      if (response.data.success) {
        // Map _id to id for frontend compatibility
        const mappedCustomers = response.data.data.map(customer => ({
          ...customer,
          id: customer._id,
          notes: customer.notes || "",
        }));
        return {
          ...response.data,
          data: mappedCustomers,
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to fetch customers",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to fetch customers. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to fetch customers. Please try again later.",
      };
    }
  }

  async createCustomer(
    customerData: CreateCustomerParams,
  ): Promise<
    | { success: true; data: Customer; message: string }
    | { success: false; message: string }
  > {
    try {
      const response = await this.axiosInstance.post<{
        success: boolean;
        data?: Customer;
        message?: string;
      }>("/customers", customerData);

      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: {
            ...response.data.data,
            id: response.data.data._id,
            notes: response.data.data.notes || "",
          },
          message: response.data.message || "Customer created successfully",
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to create customer",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
        errors?: Array<{ field?: string; msg?: string; message?: string }>;
      }>;
      const errorData = axiosError.response?.data;

      let message = "Failed to create customer. Please try again later.";
      if (errorData?.errors?.length) {
        message = errorData.errors
          .map(e => e.msg || e.message)
          .filter(Boolean)
          .join(". ");
      } else if (errorData?.message) {
        message = errorData.message;
      }

      return {
        success: false,
        message,
      };
    }
  }

  async getCustomerById(
    id: string,
  ): Promise<
    | { success: true; data: Customer; message: string }
    | { success: false; message: string }
  > {
    try {
      const response = await this.axiosInstance.get<{
        success: boolean;
        data?: Customer;
        message?: string;
      }>(`/customers/${id}`);

      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: {
            ...response.data.data,
            id: response.data.data._id,
            notes: response.data.data.notes || "",
          },
          message: response.data.message || "Customer fetched successfully",
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to fetch customer",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to fetch customer. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to fetch customer. Please try again later.",
      };
    }
  }

  async updateCustomer(
    id: string,
    customerData: UpdateCustomerParams,
  ): Promise<
    | { success: true; data: Customer; message: string }
    | { success: false; message: string }
  > {
    try {
      const response = await this.axiosInstance.put<{
        success: boolean;
        data?: Customer;
        message?: string;
      }>(`/customers/${id}`, customerData);

      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: {
            ...response.data.data,
            id: response.data.data._id,
            notes: response.data.data.notes || "",
          },
          message: response.data.message || "Customer updated successfully",
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to update customer",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
        errors?: Array<{
          field?: string;
          path?: string;
          msg?: string;
          message?: string;
        }>;
      }>;
      const errorData = axiosError.response?.data;

      let message = "Failed to update customer. Please try again later.";
      if (errorData?.errors?.length) {
        message = errorData.errors
          .map(e => e.msg || e.message)
          .filter(Boolean)
          .join(". ");
      } else if (errorData?.message) {
        message = errorData.message;
      }

      return {
        success: false,
        message,
      };
    }
  }

  async deleteCustomer(
    id: string,
  ): Promise<
    | { success: true; data: Customer; message: string }
    | { success: false; message: string }
  > {
    try {
      const response = await this.axiosInstance.delete<{
        success: boolean;
        data?: Customer;
        message?: string;
      }>(`/customers/${id}`);

      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: {
            ...response.data.data,
            id: response.data.data._id,
          },
          message: response.data.message || "Customer deleted successfully",
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to delete customer",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to delete customer. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to delete customer. Please try again later.",
      };
    }
  }

  async seedCustomers(): Promise<
    | { success: true; data: Customer[]; message: string }
    | { success: false; message: string }
  > {
    try {
      const response = await this.axiosInstance.post<{
        success: boolean;
        data?: Customer[];
        message?: string;
      }>("/customers/seed");

      if (response.data.success) {
        const mappedCustomers = (response.data.data || []).map(customer => ({
          ...customer,
          id: customer._id,
          notes: customer.notes || "",
        }));
        return {
          success: true,
          data: mappedCustomers,
          message:
            response.data.message || "Demo customers seeded successfully",
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to seed customers",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to seed customers. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to seed customers. Please try again later.",
      };
    }
  }

  async createOffer(offerData: {
    customerId: string;
    customerName: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    items: Array<{
      productId: string;
      productNumber: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      discount: number;
      markingCost: number;
      internalMarkingCost: number;
      showUnitPrice: boolean;
      showTotalPrice: boolean;
      hideMarkingCost: boolean;
      generateMockup: boolean;
      mockupImage?: string;
    }>;
    offerDetails: {
      validUntil?: string;
      validDays?: string;
      showTotalPrice: boolean;
      additionalTermsEnabled: boolean;
      additionalTerms?: string;
      specialCosts?: SpecialCost[];
    };
    totalAmount: number;
    itemCount: number;
  }): Promise<
    | {
        success: true;
        data: Record<string, unknown>; // full offer object
        message: string;
      }
    | { success: false; message: string }
  > {
    try {
      const response = await this.axiosInstance.post<{
        success: boolean;
        data?: Record<string, unknown>;
        message?: string;
      }>("/offers", offerData);

      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || "Offer created successfully",
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to create offer",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to create offer. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to create offer. Please try again later.",
      };
    }
  }

  async duplicateOffer(
    offerId: string,
  ): Promise<
    | { success: true; data: Offer; message: string }
    | { success: false; message: string }
  > {
    try {
      const response = await this.axiosInstance.post<{
        success: boolean;
        data?: Offer;
        message?: string;
      }>(`/offers/${offerId}/duplicate`);

      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || "Offer duplicated successfully",
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to duplicate offer",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to duplicate offer. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to duplicate offer. Please try again later.",
      };
    }
  }

  async generateMockupImage(data: {
    productImageUrl: string;
    logoImage: string;
  }): Promise<
    | { success: true; mockupImageUrl: string; message: string }
    | { success: false; message: string }
  > {
    try {
      const logoImage = await imageUrlToBase64(data.logoImage);
      const response = await this.axiosInstance.post<{
        success: boolean;
        data?: { mockupImageUrl: string };
        message?: string;
      }>(
        "/offers/generate-mockup",
        { ...data, logoImage },
        { timeout: 300000 },
      );

      if (response.data.success && response.data.data?.mockupImageUrl) {
        return {
          success: true,
          mockupImageUrl: response.data.data.mockupImageUrl,
          message: response.data.message || "Mockup generated successfully",
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to generate mockup",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to generate mockup. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to generate mockup. Please try again later.",
      };
    }
  }

  async generateMockupBatch(data: {
    logoImage: string;
    items: { index: number; productImageUrl: string }[];
  }): Promise<
    | {
        success: true;
        results: {
          index: number;
          success: boolean;
          mockupImageUrl?: string;
          message?: string;
        }[];
      }
    | { success: false; message: string }
  > {
    try {
      const logoImage = await imageUrlToBase64(data.logoImage);
      const response = await this.axiosInstance.post<{
        success: boolean;
        data?: {
          index: number;
          success: boolean;
          mockupImageUrl?: string;
          message?: string;
        }[];
        message?: string;
      }>(
        "/offers/generate-mockup-batch",
        { ...data, logoImage },
        { timeout: 0 },
      );

      if (response.data.success && response.data.data) {
        return {
          success: true,
          results: response.data.data,
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to generate mockup batch",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to generate mockup batch. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to generate mockup batch. Please try again later.",
      };
    }
  }

  async getOffers(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<
    | {
        success: true;
        data: Offer[];
        message: string;
        pagination: {
          total: number;
          page: number;
          pages: number;
          limit: number;
        };
      }
    | { success: false; message: string }
  > {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.status) queryParams.append("status", params.status);
      if (params?.search) queryParams.append("search", params.search);

      const url = `/offers${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await this.axiosInstance.get<{
        success: boolean;
        data?: Offer[];
        message?: string;
        pagination?: {
          total: number;
          page: number;
          pages: number;
          limit: number;
        };
      }>(url);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data || [],
          message: response.data.message || "Offers fetched successfully",
          pagination: response.data.pagination || {
            total: 0,
            page: 1,
            pages: 1,
            limit: 10,
          },
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to fetch offers",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to fetch offers. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to fetch offers. Please try again later.",
      };
    }
  }

  async getOfferById(id: string) {
    try {
      const response = await this.axiosInstance.get<{
        success: boolean;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data?: any;
        message?: string;
      }>(`/offers/${id}`);

      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || "Offer fetched successfully",
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to fetch offer",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to fetch offer. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message || "Failed to fetch offer. Please try again later.",
      };
    }
  }

  async deleteOffer(id: string) {
    try {
      const response = await this.axiosInstance.delete<{
        success: boolean;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data?: any;
        message?: string;
      }>(`/offers/${id}`);

      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || "Offer deleted successfully",
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to delete offer",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to delete offer. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to delete offer. Please try again later.",
      };
    }
  }

  async resendOffer(id: string) {
    try {
      const response = await this.axiosInstance.post<{
        success: boolean;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data?: any;
        message?: string;
        warning?: string;
      }>(`/offers/${id}/resend`);

      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || "Offer resent successfully",
          warning: response.data.warning,
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to resend offer",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to resend offer. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to resend offer. Please try again later.",
      };
    }
  }

  async getOffersByCustomerId(
    customerId: string,
    params?: { page?: number; limit?: number },
  ): Promise<
    | {
        success: true;
        data: Offer[];
        message: string;
        pagination?: {
          total: number;
          page: number;
          pages: number;
          limit: number;
        };
      }
    | { success: false; message: string }
  > {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());

      const url = `/offers/customer/${customerId}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await this.axiosInstance.get<{
        success: boolean;
        data?: Offer[];
        message?: string;
        pagination?: {
          total: number;
          page: number;
          pages: number;
          limit: number;
        };
      }>(url);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data || [],
          message: response.data.message || "Offers fetched successfully",
          pagination: response.data.pagination,
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to fetch offers",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to fetch offers. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to fetch offers. Please try again later.",
      };
    }
  }

  async sendOffer(id: string) {
    try {
      const response = await this.axiosInstance.post<{
        success: boolean;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data?: any;
        message?: string;
        warning?: string;
      }>(`/offers/${id}/send`);

      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || "Offer sent successfully",
          warning: response.data.warning,
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to send offer",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to send offer. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message || "Failed to send offer. Please try again later.",
      };
    }
  }

  async updateCustomerResponse(
    id: string,
    customerResponse: "accepted" | "rejected",
    customerComment?: string,
  ): Promise<
    | {
        success: true;
        data: {
          offerId: string;
          offerNumber: string;
          customerResponse: "accepted" | "rejected";
          customerComments?: Array<{ comment: string; timestamp: string }>;
          respondedAt: string;
          createdAt: string;
        };
        message: string;
      }
    | { success: false; message: string }
  > {
    try {
      const response = await this.axiosInstance.patch<{
        success: boolean;
        data?: {
          offerId: string;
          offerNumber: string;
          customerResponse: "accepted" | "rejected";
          customerComments?: Array<{ comment: string; timestamp: string }>;
          respondedAt: string;
          createdAt: string;
        };
        message?: string;
      }>(`/offers/${id}/response`, {
        customerResponse,
        customerComment,
      });

      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data,
          message:
            response.data.message || "Customer response updated successfully",
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to update customer response",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to update customer response. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to update customer response. Please try again later.",
      };
    }
  }

  async getOfferByAccessCode(accessCode: string) {
    try {
      const response = await this.axiosInstance.get<{
        success: boolean;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data?: any;
        message?: string;
      }>(`/offers/public/${accessCode}`);

      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || "Offer fetched successfully",
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to fetch offer",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Offer not found.",
      };

      return {
        success: false,
        message: errorData.message || "Offer not found.",
      };
    }
  }

  async updateCustomerResponseByAccessCode(
    accessCode: string,
    customerResponse: "accepted" | "rejected",
    customerComment?: string,
  ): Promise<
    | {
        success: true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: any;
        message: string;
      }
    | { success: false; message: string }
  > {
    try {
      const response = await this.axiosInstance.patch<{
        success: boolean;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data?: any;
        message?: string;
      }>(`/offers/public/${accessCode}/response`, {
        customerResponse,
        customerComment,
      });

      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data,
          message:
            response.data.message || "Customer response updated successfully",
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to update customer response",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to update customer response. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to update customer response. Please try again later.",
      };
    }
  }

  async updateOffer(
    id: string,
    offerData: {
      items?: Array<{
        productId: string;
        productNumber: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        discount: number;
        markingCost: number;
        internalMarkingCost: number;
        showUnitPrice: boolean;
        showTotalPrice: boolean;
        hideMarkingCost: boolean;
        generateMockup: boolean;
        mockupImage?: string;
      }>;
      offerDetails?: {
        validUntil?: string;
        validDays?: string;
        showTotalPrice?: boolean;
        additionalTermsEnabled?: boolean;
        additionalTerms?: string;
        specialCosts?: SpecialCost[];
      };
    },
  ): Promise<
    | {
        success: true;
        data: {
          offerId: string;
          offerNumber: string;
          version: number;
          status: string;
          customerComments?: Array<{ comment: string; timestamp: string }>;
          email: string;
          customerName: string;
          contactPerson: string;
          items: Array<{
            productId: string;
            productNumber: string;
            productName: string;
            quantity: number;
            unitPrice: number;
            discount: number;
            markingCost: number;
            internalMarkingCost: number;
            showUnitPrice: boolean;
            showTotalPrice: boolean;
            hideMarkingCost: boolean;
            generateMockup: boolean;
          }>;
          totalAmount: number;
          offerDetails?: {
            validUntil?: string;
            validDays?: string;
            showTotalPrice?: boolean;
            additionalTermsEnabled?: boolean;
            additionalTerms?: string;
            specialCosts?: SpecialCost[];
          };
          createdAt: string;
        };
        message: string;
      }
    | { success: false; message: string }
  > {
    try {
      const response = await this.axiosInstance.put<{
        success: boolean;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data?: any;
        message?: string;
      }>(`/offers/${id}`, offerData);

      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || "Offer updated successfully",
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to update offer",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to update offer. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to update offer. Please try again later.",
      };
    }
  }

  async createOrderFromQuote(params: CreateOrderFromQuoteParams): Promise<
    | {
        success: true;
        data: Order;
        message: string;
      }
    | { success: false; message: string }
  > {
    try {
      const response = await this.axiosInstance.post<{
        success: boolean;
        data?: Order;
        message?: string;
      }>("/orders", params);

      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || "Order created successfully",
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to create order",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to create order. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to create order. Please try again later.",
      };
    }
  }

  // -------------------- printing sheets --------------------

  async savePrintingSheets(
    params: CreatePrintingSheetsParams,
  ): Promise<
    | { success: true; data: PrintingSheet[]; message: string }
    | { success: false; message: string }
  > {
    try {
      const response = await this.axiosInstance.post<{
        success: boolean;
        data?: PrintingSheet[];
        message?: string;
      }>(`/printingsheets`, params);

      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data,
          message:
            response.data.message || "Printing sheets saved successfully",
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to save printing sheets",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to save printing sheets. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to save printing sheets. Please try again later.",
      };
    }
  }

  async getPrintingSheets(
    params: GetPrintingSheetsParams,
  ): Promise<
    | { success: true; data: PrintingSheet[]; message: string }
    | { success: false; message: string }
  > {
    try {
      let response;
      if (params.orderId) {
        response = await this.axiosInstance.get<{
          success: boolean;
          data?: PrintingSheet[];
          message?: string;
        }>(`/printingsheets/order/${params.orderId}`);
      } else if (params.offerId) {
        response = await this.axiosInstance.get<{
          success: boolean;
          data?: PrintingSheet[];
          message?: string;
        }>(`/printingsheets/offer/${params.offerId}`);
      } else {
        return { success: false, message: "No identifier provided" };
      }

      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data,
          message:
            response.data.message || "Printing sheets fetched successfully",
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to fetch printing sheets",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to fetch printing sheets. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to fetch printing sheets. Please try again later.",
      };
    }
  }

  async updateOfferStatus(
    id: string,
    status: OfferStatus,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.axiosInstance.patch<{
        success: boolean;
        message?: string;
      }>(`/offers/${id}/status`, { status });

      return {
        success: response.data.success,
        message: response.data.message || "Offer status updated successfully",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to update offer status. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to update offer status. Please try again later.",
      };
    }
  }

  async deletePrintingSheetGroup(
    groupId: string,
  ): Promise<
    { success: true; message: string } | { success: false; message: string }
  > {
    try {
      const response = await this.axiosInstance.delete<{
        success: boolean;
        message?: string;
        deletedCount?: number;
      }>(`/printingsheets/group/${groupId}`);

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || "Printing sheets deleted",
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to delete printing sheets",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to delete printing sheets. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to delete printing sheets. Please try again later.",
      };
    }
  }

  async getPrintingSheetsByOrderIds(
    orderIds: string[],
  ): Promise<
    | { success: true; data: Record<string, PrintingSheet[]>; message: string }
    | { success: false; message: string }
  > {
    try {
      if (orderIds.length === 0)
        return { success: true, data: {}, message: "No orders" };
      const response = await this.axiosInstance.get<{
        success: boolean;
        data?: Record<string, PrintingSheet[]>;
        message?: string;
      }>(`/printingsheets/orders/batch?orderIds=${orderIds.join(",")}`);
      if (response.data.success && response.data.data) {
        return { success: true, data: response.data.data, message: "OK" };
      }
      return {
        success: false,
        message: response.data.message || "Failed to fetch",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return {
        success: false,
        message:
          axiosError.response?.data?.message ||
          "Failed to fetch printing sheets",
      };
    }
  }

  async getOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    customerId?: string;
    search?: string;
    orderNumber?: string;
    customerName?: string;
    amountMin?: string;
    amountMax?: string;
    marginMin?: string;
    marginMax?: string;
    dateFrom?: string;
    dateTo?: string;
    salesperson?: string;
  }): Promise<
    | {
        success: true;
        data: Order[];
        message: string;
        pagination: {
          total: number;
          page: number;
          pages: number;
          limit: number;
        };
      }
    | { success: false; message: string }
  > {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.status) queryParams.append("status", params.status);
      if (params?.customerId)
        queryParams.append("customerId", params.customerId);
      if (params?.search) queryParams.append("search", params.search);
      if (params?.orderNumber)
        queryParams.append("orderNumber", params.orderNumber);
      if (params?.customerName)
        queryParams.append("customerName", params.customerName);
      if (params?.amountMin) queryParams.append("amountMin", params.amountMin);
      if (params?.amountMax) queryParams.append("amountMax", params.amountMax);
      if (params?.marginMin) queryParams.append("marginMin", params.marginMin);
      if (params?.marginMax) queryParams.append("marginMax", params.marginMax);
      if (params?.dateFrom) queryParams.append("dateFrom", params.dateFrom);
      if (params?.dateTo) queryParams.append("dateTo", params.dateTo);
      if (params?.salesperson)
        queryParams.append("salesperson", params.salesperson);

      const url = `/orders${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await this.axiosInstance.get<{
        success: boolean;
        data?: Order[];
        message?: string;
        pagination?: {
          total: number;
          page: number;
          pages: number;
          limit: number;
        };
      }>(url);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data || [],
          message: response.data.message || "Orders fetched successfully",
          pagination: response.data.pagination || {
            total: 0,
            page: 1,
            pages: 1,
            limit: 10,
          },
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to fetch orders",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to fetch orders. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to fetch orders. Please try again later.",
      };
    }
  }

  async getSalesReport(params?: {
    dateFrom?: string;
    dateTo?: string;
    customerId?: string;
    salesperson?: string;
  }): Promise<
    | {
        success: true;
        data: {
          totals: {
            totalSales: number;
            totalMargin: number;
            orderCount: number;
          };
          byCustomer: Array<{
            customerId: string;
            customerName: string;
            totalSales: number;
            totalMargin: number;
            orderCount: number;
          }>;
          bySalesperson: Array<{
            salesperson: string;
            totalSales: number;
            totalMargin: number;
            orderCount: number;
          }>;
        };
      }
    | { success: false; message: string }
  > {
    try {
      const queryParams = new URLSearchParams();
      if (params?.dateFrom) queryParams.append("dateFrom", params.dateFrom);
      if (params?.dateTo) queryParams.append("dateTo", params.dateTo);
      if (params?.customerId)
        queryParams.append("customerId", params.customerId);
      if (params?.salesperson)
        queryParams.append("salesperson", params.salesperson);

      const url = `/orders/sales-report${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await this.axiosInstance.get(url);

      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      return {
        success: false,
        message: response.data.message || "Failed to fetch sales report",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return {
        success: false,
        message:
          axiosError.response?.data?.message || "Failed to fetch sales report",
      };
    }
  }

  async getOrderById(id: string): Promise<
    | {
        success: true;
        data: Order;
        message: string;
      }
    | { success: false; message: string }
  > {
    try {
      const response = await this.axiosInstance.get<{
        success: boolean;
        data?: Order;
        message?: string;
      }>(`/orders/${id}`);

      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || "Order fetched successfully",
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to fetch order",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to fetch order. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message || "Failed to fetch order. Please try again later.",
      };
    }
  }

  async updateOrderStatus(
    id: string,
    status: "pending" | "processing" | "completed" | "cancelled",
  ): Promise<
    | {
        success: true;
        data: Order;
        message: string;
      }
    | { success: false; message: string }
  > {
    try {
      const response = await this.axiosInstance.put<{
        success: boolean;
        data?: Order;
        message?: string;
      }>(`/orders/${id}/status`, { status });

      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || "Order status updated successfully",
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to update order status",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to update order status. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to update order status. Please try again later.",
      };
    }
  }

  async sendOrderConfirmationEmail(id: string): Promise<
    | {
        success: true;
        data: Order;
        message: string;
      }
    | { success: false; message: string }
  > {
    try {
      const response = await this.axiosInstance.post<{
        success: boolean;
        data?: Order;
        message?: string;
      }>(`/orders/${id}/send-confirmation`);

      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data,
          message:
            response.data.message ||
            "Order confirmation email sent successfully",
        };
      }

      return {
        success: false,
        message:
          response.data.message || "Failed to send order confirmation email",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message:
          "Failed to send order confirmation email. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to send order confirmation email. Please try again later.",
      };
    }
  }

  async deleteOrder(id: string): Promise<
    | {
        success: true;
        message: string;
      }
    | { success: false; message: string }
  > {
    try {
      const response = await this.axiosInstance.delete<{
        success: boolean;
        message?: string;
      }>(`/orders/${id}`);

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || "Order deleted successfully",
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to delete order",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to delete order. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to delete order. Please try again later.",
      };
    }
  }

  async getDashboardStats(): Promise<
    | { success: true; data: DashboardData; message: string }
    | { success: false; message: string }
  > {
    try {
      const response = await this.axiosInstance.get<{
        success: boolean;
        data?: DashboardData;
        message?: string;
      }>("/dashboard/stats");

      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data,
          message:
            response.data.message || "Dashboard data fetched successfully",
        };
      }

      return {
        success: false,
        message: response.data.message || "Failed to fetch dashboard data",
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
      }>;
      const errorData = axiosError.response?.data || {
        success: false,
        message: "Failed to fetch dashboard data. Please try again later.",
      };

      return {
        success: false,
        message:
          errorData.message ||
          "Failed to fetch dashboard data. Please try again later.",
      };
    }
  }

  // ==================== EMAIL TEMPLATES ====================

  async getEmailTemplates(): Promise<{
    success: boolean;
    data?: Array<{
      _id: string;
      templateKey: string;
      subject: string;
      htmlBody: string;
      enabled: boolean;
      description?: string;
      recipientEmail?: string;
      updatedAt: string;
    }>;
    message?: string;
  }> {
    try {
      const response = await this.axiosInstance.get("/email-templates");
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return {
        success: false,
        message:
          axiosError.response?.data?.message ||
          "Failed to fetch email templates",
      };
    }
  }

  async getEmailTemplate(key: string): Promise<{
    success: boolean;
    data?: {
      _id: string;
      templateKey: string;
      subject: string;
      htmlBody: string;
      enabled: boolean;
      description?: string;
      recipientEmail?: string;
      updatedAt: string;
    };
    message?: string;
  }> {
    try {
      const response = await this.axiosInstance.get(
        `/email-templates/${encodeURIComponent(key)}`,
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return {
        success: false,
        message:
          axiosError.response?.data?.message ||
          "Failed to fetch email template",
      };
    }
  }

  async updateEmailTemplate(
    key: string,
    data: {
      subject?: string;
      htmlBody?: string;
      enabled?: boolean;
      recipientEmail?: string;
    },
  ): Promise<{
    success: boolean;
    data?: {
      _id: string;
      templateKey: string;
      subject: string;
      htmlBody: string;
      enabled: boolean;
      description?: string;
      recipientEmail?: string;
      updatedAt: string;
    };
    message?: string;
  }> {
    try {
      const response = await this.axiosInstance.put(
        `/email-templates/${encodeURIComponent(key)}`,
        data,
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return {
        success: false,
        message:
          axiosError.response?.data?.message ||
          "Failed to update email template",
      };
    }
  }

  async resetEmailTemplate(key: string): Promise<{
    success: boolean;
    data?: {
      _id: string;
      templateKey: string;
      subject: string;
      htmlBody: string;
      enabled: boolean;
      description?: string;
      recipientEmail?: string;
      updatedAt: string;
    };
    message?: string;
  }> {
    try {
      const response = await this.axiosInstance.post(
        `/email-templates/${encodeURIComponent(key)}/reset`,
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return {
        success: false,
        message:
          axiosError.response?.data?.message ||
          "Failed to reset email template",
      };
    }
  }

  // ==================== APP SETTINGS ====================

  async getAppSettings(): Promise<{
    success: boolean;
    data?: {
      _id: string;
      customMarginPercentage: number;
      marginMode: "fallback" | "override";
      globalAdminEmail: string;
      ccGlobalAdmin: boolean;
      updatedAt: string;
    };
    message?: string;
  }> {
    try {
      const response = await this.axiosInstance.get("/app-settings");
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return {
        success: false,
        message:
          axiosError.response?.data?.message || "Failed to fetch app settings",
      };
    }
  }

  async updateAppSettings(data: {
    customMarginPercentage?: number;
    marginMode?: "fallback" | "override";
    globalAdminEmail?: string;
    ccGlobalAdmin?: boolean;
  }): Promise<{
    success: boolean;
    data?: {
      _id: string;
      customMarginPercentage: number;
      marginMode: "fallback" | "override";
      globalAdminEmail: string;
      ccGlobalAdmin: boolean;
      updatedAt: string;
    };
    message?: string;
  }> {
    try {
      const response = await this.axiosInstance.put("/app-settings", data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return {
        success: false,
        message:
          axiosError.response?.data?.message || "Failed to update app settings",
      };
    }
  }
}

export default new ApiService();
