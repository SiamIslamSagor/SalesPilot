import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";

// ── Hoisted mock user ───────────────────────────────────────────────────────

const { mockUser } = vi.hoisted(() => ({
  mockUser: {
    id: "u1",
    name: "Admin",
    email: "admin@test.com",
    role: "admin",
    createdAt: "2026-01-01",
  },
}));

// ── Auth context mock ───────────────────────────────────────────────────────

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
    users: [],
    login: vi.fn(),
    logout: vi.fn(),
    addUser: vi.fn(),
    updateUser: vi.fn(),
    removeUser: vi.fn(),
    isSuperAdmin: false,
    isPrivilegedUser: true,
    isAuthenticated: true,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// mock api service to provide offer, sheets and products
vi.mock("@/services/api", () => {
  return {
    default: {
      getOfferById: vi.fn().mockResolvedValue({
        success: true,
        data: {
          _id: "offer1",
          offerNumber: "OF-123",
          customerName: "Cust",
          customerResponse: "accepted",
          items: [
            {
              productId: "prod1",
              productNumber: "PN1",
              productName: "Test product",
              quantity: 1,
              unitPrice: 10,
              discount: 0,
              markingCost: 0,
              showUnitPrice: true,
              showTotalPrice: true,
              hideMarkingCost: false,
              generateMockup: false,
            },
          ],
          offerDetails: {
            validUntil: "2099-12-31",
            validDays: 30,
            additionalTerms: "",
            specialCosts: [],
          },
          totalAmount: 10,
          itemCount: 1,
        },
      }),
      getPrintingSheets: vi.fn().mockResolvedValue({
        success: true,
        data: [
          {
            _id: "sheet1",
            productId: "prod1",
            productName: "Test product",
            productNumber: "PN1",
          },
        ],
      }),
      fetchProducts: vi.fn().mockResolvedValue({
        success: true,
        data: [
          {
            _id: "prod1",
            id: "prod1",
            productNumber: "PN1",
            name: "Test product",
            description: "",
            category: "",
            brand: "",
            gender: "",
            fabrics: "",
            purchasePrice: 0,
            salesPrice: 0,
            margin: 0,
            status: "active",
            images: [],
          },
        ],
      }),
      createOrderFromQuote: vi.fn().mockResolvedValue({ success: true }),
    },
  };
});

// mock html2canvas and jsPDF exactly as in printingSheet tests
vi.mock("html2canvas", () => {
  return {
    default: vi.fn(),
  };
});

const addImageSpy = vi.fn();
const saveSpy = vi.fn();
const getImagePropsSpy = vi.fn(() => ({ width: 100, height: 200 }));

vi.mock("jspdf", () => {
  return {
    jsPDF: vi.fn().mockImplementation(() => ({
      internal: { pageSize: { getWidth: () => 595 } },
      getImageProperties: getImagePropsSpy,
      addImage: addImageSpy,
      save: saveSpy,
    })),
  };
});

import OrderCreate from "@/pages/OrderCreate";
import { LanguageProvider } from "@/i18n/LanguageContext";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

describe("OrderCreate component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders order creation page with offer data", async () => {
    render(
      <LanguageProvider>
        <MemoryRouter initialEntries={["/orders/create/offer1"]}>
          <Routes>
            <Route path="/orders/create/:quoteId" element={<OrderCreate />} />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>,
    );

    // wait for loading to finish and the page to render
    await waitFor(() => {
      const matches = screen.getAllByText(/(Create Order|Luo tilaus)/i);
      expect(matches.length).toBeGreaterThan(0);
    });

    // Should show the product from the offer (may appear more than once)
    await waitFor(() => {
      const products = screen.getAllByText(/Test product/i);
      expect(products.length).toBeGreaterThan(0);
    });
  });
});
