import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";

// ── Hoisted spies ───────────────────────────────────────────────────────────

const {
  savePrintingSheetsSpy,
  deletePrintingSheetGroupSpy,
  mockUser,
  mockLoginFn,
  mockLogoutFn,
  mockAddUserFn,
  mockUpdateUserFn,
  mockRemoveUserFn,
} = vi.hoisted(() => ({
  savePrintingSheetsSpy: vi.fn().mockResolvedValue({
    success: true,
    data: [
      {
        _id: "saved1",
        productId: "prod1",
        productNumber: "PN1",
        productName: "Test product",
        groupId: "grp-1",
        offerId: "offer1",
      },
    ],
    message: "Printing sheets saved",
  }),
  deletePrintingSheetGroupSpy: vi.fn().mockResolvedValue({
    success: true,
    message: "Deleted",
  }),
  mockUser: {
    id: "u1",
    name: "Admin User",
    email: "admin@test.com",
    role: "admin",
    createdAt: "2026-01-01",
  },
  mockLoginFn: vi.fn(),
  mockLogoutFn: vi.fn(),
  mockAddUserFn: vi.fn(),
  mockUpdateUserFn: vi.fn(),
  mockRemoveUserFn: vi.fn(),
}));

vi.mock("@/services/api", () => {
  return {
    default: {
      getPrintingSheets: vi.fn().mockResolvedValue({
        success: true,
        data: [
          {
            _id: "existing1",
            productId: "prod1",
            productNumber: "PN1",
            productName: "Test product",
            groupId: "grp-existing",
            offerId: "offer1",
            orderDate: "2026-01-01",
            reference: "REF1",
            seller: "John",
            deliveryDate: "2026-02-01",
            deliveryTime: "1-2 viikkoa",
            customerName: "Test Customer",
            printMethod: "screen",
            printMethodOther: "",
            sizeQuantities: { M: "5", L: "3" },
            workInstructions: "",
            totalQuantity: 8,
          },
        ],
      }),
      getOfferById: vi.fn().mockResolvedValue({
        success: true,
        data: {
          _id: "offer1",
          offerNumber: "OF-100",
          customerId: "cust1",
          customerName: "Test Customer",
          contactPerson: "Contact",
          email: "test@test.com",
          phone: "123",
          address: "Addr",
          salesperson: "Sales Person",
          items: [
            {
              productId: "prod1",
              productNumber: "PN1",
              productName: "Test product",
              quantity: 10,
              unitPrice: 15,
              discount: 0,
              markingCost: 0,
              showUnitPrice: true,
              showTotalPrice: true,
              hideMarkingCost: false,
              generateMockup: false,
            },
          ],
          offerDetails: { showTotalPrice: true },
          totalAmount: 150,
          itemCount: 1,
          status: "approved",
          createdAt: "",
          updatedAt: "",
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
            purchasePrice: 5,
            salesPrice: 15,
            margin: 10,
            status: "active",
            images: ["https://img.example.com/prod1.jpg"],
          },
        ],
      }),
      savePrintingSheets: savePrintingSheetsSpy,
      deletePrintingSheetGroup: deletePrintingSheetGroupSpy,
    },
  };
});

// ── External lib mocks ──────────────────────────────────────────────────────

vi.mock("html2canvas", () => ({
  default: vi.fn().mockResolvedValue({
    toDataURL: () => "data:image/png;base64,xxx",
  }),
}));

vi.mock("jspdf", () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    internal: { pageSize: { getWidth: () => 595, getHeight: () => 842 } },
    getImageProperties: vi.fn(() => ({ width: 100, height: 200 })),
    addImage: vi.fn(),
    addPage: vi.fn(),
    save: vi.fn(),
  })),
}));

// ── Auth context mock ───────────────────────────────────────────────────────

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
    users: [],
    login: mockLoginFn,
    logout: mockLogoutFn,
    addUser: mockAddUserFn,
    updateUser: mockUpdateUserFn,
    removeUser: mockRemoveUserFn,
    isSuperAdmin: false,
    isPrivilegedUser: true,
    isAuthenticated: true,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import PrintingSheet from "@/pages/PrintingSheet";
import { LanguageProvider } from "@/i18n/LanguageContext";

// ── Test helpers ─────────────────────────────────────────────────────────────

const renderPage = (route = "/print/offer1/prod1") =>
  render(
    <LanguageProvider>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/print/:quoteId/:itemId" element={<PrintingSheet />} />
          <Route
            path="/orders/create/:quoteId/print-sheet"
            element={<PrintingSheet />}
          />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  );

// ── Tests ────────────────────────────────────────────────────────────────────

describe("PrintingSheet – E2E user flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads and renders product info from the offer", async () => {
    renderPage();
    // Wait for data to fully load - saved sheets section appears after loading
    await waitFor(() => {
      expect(screen.getByText(/Aiemmin tallennettu/i)).toBeInTheDocument();
    });
    // Product info should be visible
    const matches = screen.getAllByText(/Test product/i);
    expect(matches.length).toBeGreaterThan(0);
    expect(screen.getByText("PN1")).toBeInTheDocument();
  });

  it("shows existing printing sheets loaded from the offer", async () => {
    renderPage();
    await screen.findAllByText(/Test product/i);

    // Existing sheets section should be displayed (Finnish: "Aiemmin tallennettu työkortti")
    await waitFor(() => {
      expect(
        screen.getByText(/Previously saved|Aiemmin tallennettu/i),
      ).toBeInTheDocument();
    });
  });

  it("renders saved sheet details in read-only view", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Aiemmin tallennettu/i)).toBeInTheDocument();
    });

    // Saved sheet should display size quantities table
    expect(screen.getByText(/Kokomäärät/i)).toBeInTheDocument();
  });

  it("renders the PDF download button", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Aiemmin tallennettu/i)).toBeInTheDocument();
    });

    // PDF download button should be available
    expect(screen.getByRole("button", { name: /PDF/i })).toBeInTheDocument();
  });

  it("renders back navigation link", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Aiemmin tallennettu/i)).toBeInTheDocument();
    });

    // Back link should navigate to order create page
    const backLink = screen.getByRole("link", { name: /Takaisin/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/orders/create/offer1");
  });
});
