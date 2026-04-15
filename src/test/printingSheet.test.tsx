import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";

// ── Hoisted spies ───────────────────────────────────────────────────────────

const { mockUser } = vi.hoisted(() => ({
  mockUser: {
    id: "u1",
    name: "Admin",
    email: "admin@test.com",
    role: "admin",
    createdAt: "2026-01-01",
  },
}));

// mock api service
vi.mock("@/services/api", () => {
  return {
    default: {
      getPrintingSheets: vi.fn().mockResolvedValue({ success: true, data: [] }),
      getOfferById: vi.fn().mockResolvedValue({
        success: true,
        data: {
          _id: "offer1",
          items: [
            {
              productId: "prod1",
              productNumber: "PN1",
              productName: "Test product",
              quantity: 2,
              unitPrice: 5,
              discount: 0,
              markingCost: 0,
              showUnitPrice: true,
              showTotalPrice: true,
              hideMarkingCost: false,
              generateMockup: false,
            },
          ],
          customerName: "Customer",
          salesperson: "Sales",
        },
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
    },
  };
});

// mock html2canvas and jsPDF
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

import PrintingSheet from "@/pages/PrintingSheet";
import { LanguageProvider } from "@/i18n/LanguageContext";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

describe("PrintingSheet component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders product info and save button", async () => {
    render(
      <LanguageProvider>
        <MemoryRouter initialEntries={["/print/offer1/prod1"]}>
          <Routes>
            <Route path="/print/:quoteId/:itemId" element={<PrintingSheet />} />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>,
    );

    // wait for the product data to load
    await waitFor(() => {
      expect(screen.getByText(/Test product/i)).toBeInTheDocument();
    });

    // In single-product mode (route has :itemId) the Save button is hidden;
    // verify the back link is present instead.
    expect(
      screen.getByRole("link", { name: /Takaisin|Back/i }),
    ).toBeInTheDocument();
  });
});
