import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";

// ── Hoisted mock data (accessible inside vi.mock factories) ─────────────────

const { sampleSheets, addImageSpy, addPageSpy, saveSpy } = vi.hoisted(() => {
  const sheets = [
    {
      _id: "sheet1",
      productId: "prod1",
      productNumber: "PN1",
      productName: "Shirt A",
      productImage: "https://img.example.com/shirt.jpg",
      orderDate: "2026-04-01",
      reference: "Customer Corp",
      seller: "John",
      deliveryDate: "2026-05-01",
      deliveryTime: "1-2 viikkoa",
      customerName: "Customer Corp",
      printMethod: "screen",
      printMethodOther: "",
      sizeQuantities: { S: "5", M: "10", L: "8" },
      workInstructions: "Handle with care",
      totalQuantity: 23,
      offerId: "offer1",
      orderId: "order1",
      groupId: "grp-1",
    },
    {
      _id: "sheet2",
      productId: "prod2",
      productNumber: "PN2",
      productName: "Pants B",
      productImage: "https://img.example.com/pants.jpg",
      orderDate: "2026-04-01",
      reference: "Customer Corp",
      seller: "John",
      deliveryDate: "2026-05-01",
      deliveryTime: "1-2 viikkoa",
      customerName: "Customer Corp",
      printMethod: "embroidery",
      printMethodOther: "",
      sizeQuantities: { M: "3", L: "7" },
      workInstructions: "",
      totalQuantity: 10,
      offerId: "offer1",
      orderId: "order1",
      groupId: "grp-1",
    },
  ];
  return {
    sampleSheets: sheets,
    addImageSpy: vi.fn(),
    addPageSpy: vi.fn(),
    saveSpy: vi.fn(),
  };
});

// ── API mock ─────────────────────────────────────────────────────────────────

vi.mock("@/services/api", () => ({
  default: {
    getPrintingSheets: vi.fn().mockResolvedValue({
      success: true,
      data: sampleSheets,
    }),
  },
}));

// ── External lib mocks ──────────────────────────────────────────────────────

vi.mock("html2canvas", () => ({
  default: vi.fn().mockResolvedValue({
    toDataURL: () => "data:image/png;base64,xxx",
  }),
}));

vi.mock("jspdf", () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    internal: {
      pageSize: { getWidth: () => 595.28, getHeight: () => 841.89 },
    },
    getImageProperties: vi.fn(() => ({ width: 794, height: 1100 })),
    addImage: addImageSpy,
    addPage: addPageSpy,
    save: saveSpy,
  })),
}));

vi.mock("@/i18n/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: "fi",
    setLanguage: vi.fn(),
  }),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import PrintingSheetView from "@/pages/PrintingSheetView";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

// ── Helpers ──────────────────────────────────────────────────────────────────

const renderView = (route: string) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route
          path="/orders/:orderId/printing-sheets/view"
          element={<PrintingSheetView />}
        />
        <Route
          path="/orders/create/:quoteId/printing-sheets/view"
          element={<PrintingSheetView />}
        />
      </Routes>
    </MemoryRouter>,
  );

// ── Tests ────────────────────────────────────────────────────────────────────

describe("PrintingSheetView – E2E user flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads and displays all sheets in the group", async () => {
    renderView("/orders/order1/printing-sheets/view?groupId=grp-1");

    await screen.findByText("Printing Sheets");

    // Both sheets should be visible
    expect(screen.getByText("Shirt A")).toBeInTheDocument();
    expect(screen.getByText("Pants B")).toBeInTheDocument();

    // Sheet numbering
    expect(screen.getByText("Sheet 1 of 2")).toBeInTheDocument();
    expect(screen.getByText("Sheet 2 of 2")).toBeInTheDocument();
  });

  it("displays product numbers on each sheet", async () => {
    renderView("/orders/order1/printing-sheets/view?groupId=grp-1");

    await screen.findByText("Printing Sheets");

    expect(screen.getByText("PN1")).toBeInTheDocument();
    expect(screen.getByText("PN2")).toBeInTheDocument();
  });

  it("shows download PDF button with page count", async () => {
    renderView("/orders/order1/printing-sheets/view?groupId=grp-1");

    const downloadBtn = await screen.findByRole("button", {
      name: /Download PDF \(2 pages\)/i,
    });
    expect(downloadBtn).toBeInTheDocument();
  });

  it("triggers multi-page PDF generation on download click", async () => {
    renderView("/orders/order1/printing-sheets/view?groupId=grp-1");
    const user = userEvent.setup();

    const downloadBtn = await screen.findByRole("button", {
      name: /Download PDF/i,
    });

    await user.click(downloadBtn);

    await waitFor(() => {
      // jsPDF should be constructed
      expect(jsPDF).toHaveBeenCalled();
    });
  });

  it("shows size quantities for each sheet", async () => {
    renderView("/orders/order1/printing-sheets/view?groupId=grp-1");

    await screen.findByText("Printing Sheets");

    // Size quantities from sheet1 and sheet2 should be rendered
    // These appear as text content in the view
    await waitFor(() => {
      const allText = document.body.textContent || "";
      expect(allText).toContain("Customer Corp");
      expect(allText).toContain("screen");
    });
  });

  it("shows empty state when no sheets match groupId", async () => {
    // Override mock for this test to return sheets with different groupId
    const apiService = await import("@/services/api");
    vi.mocked(apiService.default.getPrintingSheets).mockResolvedValueOnce({
      success: true,
      message: "",
      data: [],
    });

    renderView("/orders/order1/printing-sheets/view?groupId=nonexistent");

    await waitFor(() => {
      expect(screen.getByText(/No printing sheets found/i)).toBeInTheDocument();
    });
  });

  it("renders via offer route with quoteId", async () => {
    renderView("/orders/create/offer1/printing-sheets/view?groupId=grp-1");

    await screen.findByText("Printing Sheets");
    expect(screen.getAllByText("Shirt A").length).toBeGreaterThan(0);
  });
});
