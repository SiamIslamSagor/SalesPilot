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
      getOrders: vi.fn().mockResolvedValue({
        success: true,
        data: [
          {
            _id: "order1",
            orderNumber: "SO-1",
            offerId: "offer1",
            customerId: "cust1",
            customerName: "Customer A",
            items: [
              {
                productId: "prod1",
                productNumber: "PN1",
                productName: "Test item",
                quantity: 2,
                unitPrice: 10,
                discount: 0,
                markingCost: 1,
                showUnitPrice: true,
                showTotalPrice: true,
                hideMarkingCost: false,
                generateMockup: false,
              },
            ],
            totalAmount: 22,
            totalMargin: 5,
            status: "pending",
            createdAt: "2026-01-01",
            updatedAt: "2026-01-01",
          },
        ],
        pagination: { pages: 1 },
      }),
      getPrintingSheets: vi.fn().mockImplementation(({ orderId }) => {
        if (orderId === "order1") {
          return Promise.resolve({
            success: true,
            data: [
              {
                _id: "sheet1",
                productId: "prod1",
                productName: "P1",
                productNumber: "PN1",
              },
            ],
          });
        }
        return Promise.resolve({ success: true, data: [] });
      }),
      getOrderById: vi.fn().mockResolvedValue({
        success: true,
        data: {
          _id: "order1",
          orderNumber: "SO-1",
          offerId: "offer1",
          customerId: "cust1",
          customerName: "Customer A",
          items: [],
          totalAmount: 22,
          totalMargin: 5,
          status: "pending",
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        },
      }),
      getOfferById: vi.fn().mockResolvedValue({
        success: true,
        data: {
          _id: "offer1",
          offerNumber: "OF-1",
          customerName: "Customer A",
          status: "approved",
          items: [
            {
              productId: "prod1",
              productName: "Test item",
              quantity: 2,
              unitPrice: 10,
            },
          ],
        },
      }),
      getPrintingSheetsByOrderIds: vi.fn().mockResolvedValue({
        success: true,
        data: {
          order1: [
            {
              _id: "sheet1",
              productId: "prod1",
              productName: "P1",
              productNumber: "PN1",
              groupId: "grp-1",
            },
          ],
        },
      }),
      updateOrderStatus: vi.fn().mockResolvedValue({ success: true }),
      deleteOrder: vi.fn().mockResolvedValue({ success: true }),
    },
  };
});

// mock html2canvas and jsPDF so download logic can be exercised
vi.mock("html2canvas", () => {
  return { default: vi.fn() };
});

const addImageSpy = vi.fn();
const saveSpy = vi.fn();
const getImagePropsSpy = vi.fn(() => ({ width: 100, height: 200 }));

vi.mock("jspdf", () => {
  return {
    jsPDF: vi.fn().mockImplementation(() => ({
      internal: { pageSize: { getWidth: () => 595, getHeight: () => 842 } },
      getImageProperties: getImagePropsSpy,
      addImage: addImageSpy,
      addPage: vi.fn(),
      save: saveSpy,
    })),
  };
});

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

import Orders from "@/pages/Orders";
import OrderConfirmation from "@/pages/OrderConfirmation";
import { LanguageProvider } from "@/i18n/LanguageContext";

describe("Orders page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders orders list with order data", async () => {
    render(
      <MemoryRouter initialEntries={["/orders"]}>
        <LanguageProvider>
          <Routes>
            <Route path="/orders" element={<Orders />} />
          </Routes>
        </LanguageProvider>
      </MemoryRouter>,
    );

    // wait for heading
    await screen.findByText(/tilaukset|orders/i);

    // Order number should be visible
    expect(screen.getByText("SO-1")).toBeInTheDocument();
    // Customer name
    expect(screen.getByText("Customer A")).toBeInTheDocument();
  });

  it("renders order confirmation page with order details", async () => {
    render(
      <MemoryRouter initialEntries={["/orders/confirm/order1"]}>
        <LanguageProvider>
          <Routes>
            <Route
              path="/orders/confirm/:orderId"
              element={<OrderConfirmation />}
            />
          </Routes>
        </LanguageProvider>
      </MemoryRouter>,
    );

    // Wait for order details heading (may appear more than once)
    await waitFor(() => {
      const headings = screen.getAllByText(/tilaustiedot|order details/i);
      expect(headings.length).toBeGreaterThan(0);
    });
    expect(screen.getByText("SO-1")).toBeInTheDocument();
  });

  it("order confirmation shows download PDF button", async () => {
    const html2canvasMock = vi.mocked(html2canvas);
    html2canvasMock.mockResolvedValue({
      toDataURL: () => "data:image/png;base64,xxx",
    } as unknown as HTMLCanvasElement);

    render(
      <MemoryRouter initialEntries={["/orders/confirm/order1"]}>
        <LanguageProvider>
          <Routes>
            <Route
              path="/orders/confirm/:orderId"
              element={<OrderConfirmation />}
            />
          </Routes>
        </LanguageProvider>
      </MemoryRouter>,
    );

    // Wait for the page to render with order details
    await waitFor(() => {
      const headings = screen.getAllByText(/tilaustiedot|order details/i);
      expect(headings.length).toBeGreaterThan(0);
    });

    const downloadBtn = await screen.findByRole("button", {
      name: /Download PDF|Lataa PDF/i,
    });
    expect(downloadBtn).toBeInTheDocument();
  });
});
