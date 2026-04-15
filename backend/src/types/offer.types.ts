/**
 * Offer Types
 */

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

export interface OfferDetails {
  validUntil?: string;
  validDays?: string;
  showTotalPrice: boolean;
  additionalTermsEnabled: boolean;
  additionalTerms?: string;
  specialCosts?: SpecialCost[];
}

export interface CreateOfferRequest {
  ownerUserId?: string;
  ownerUserName?: string;
  ownerUserEmail?: string;
  customerId: string;
  customerName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  items: OfferItem[];
  offerDetails: OfferDetails;
  totalAmount: number;
  itemCount: number;
}

export interface OfferResponse {
  success: boolean;
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any; // may contain full offer document or summary depending on endpoint
}
