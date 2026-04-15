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

// mock api service
vi.mock("@/services/api", () => {
  return {
    default: {
      getOffers: vi.fn().mockResolvedValue({
        success: true,
        data: [
          {
            _id: "offer1",
            offerNumber: "O-123",
            customerId: "cust1",
            customerName: "Customer A",
            contactPerson: "John Doe",
            email: "john@example.com",
            phone: "123456",
            address: "123 Street",
            items: [],
            offerDetails: { showTotalPrice: true },
            totalAmount: 0,
            itemCount: 0,
            status: "draft",
            createdAt: "",
            updatedAt: "",
          },
        ],
        pagination: { total: 1, page: 1, pages: 1, limit: 10 },
      }),
      getOfferById: vi.fn().mockResolvedValue({
        success: true,
        data: {
          _id: "offer1",
          offerNumber: "O-123",
          customerId: "cust1",
          customerName: "Customer A",
          contactPerson: "John Doe",
          email: "john@example.com",
          phone: "123456",
          address: "123 Street",
          items: [
            {
              productId: "prod1",
              productNumber: "P1",
              productName: "Product 1",
              quantity: 2,
              unitPrice: 10,
              discount: 0,
              markingCost: 0,
              showUnitPrice: true,
              showTotalPrice: true,
              hideMarkingCost: false,
              generateMockup: false,
            },
          ],
          offerDetails: { showTotalPrice: true },
          totalAmount: 20,
          itemCount: 1,
          status: "draft",
          createdAt: "",
          updatedAt: "",
        },
      }),
      deleteOffer: vi.fn().mockResolvedValue({ success: true }),
      updateOfferStatus: vi.fn().mockResolvedValue({ success: true }),
    },
  };
});

import Quotes from "@/pages/Quotes";
import QuoteDuplicate from "@/pages/QuoteDuplicate";
import { LanguageProvider } from "@/i18n/LanguageContext";

describe("Quote duplication flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders quotes list and shows offer data", async () => {
    render(
      <LanguageProvider>
        <MemoryRouter initialEntries={["/quotes"]}>
          <Routes>
            <Route path="/quotes" element={<Quotes />} />
            <Route path="/quotes/duplicate/:id" element={<QuoteDuplicate />} />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>,
    );

    // wait for offer row to appear
    await screen.findByText("O-123");

    // Customer name should be visible
    expect(screen.getByText("Customer A")).toBeInTheDocument();
  });
});
