import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  CustomerTypeDropdown,
  CustomerType,
} from "@/components/CustomerTypeDropdown";

describe("CustomerTypeDropdown", () => {
  const mockOnTypeChange = vi.fn();

  beforeEach(() => {
    mockOnTypeChange.mockClear();
  });

  it("renders the current customer type", () => {
    render(
      <CustomerTypeDropdown
        currentType="prospect"
        customerId="123"
        onTypeChange={mockOnTypeChange}
      />,
    );

    expect(screen.getByText("prospect")).toBeInTheDocument();
  });

  it("opens dropdown when clicked", async () => {
    const user = userEvent.setup();
    render(
      <CustomerTypeDropdown
        currentType="prospect"
        customerId="123"
        onTypeChange={mockOnTypeChange}
      />,
    );

    const dropdown = screen.getByText("prospect");
    await user.click(dropdown);

    await waitFor(() => {
      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText("VIP")).toBeInTheDocument();
    });
  });

  it("calls onTypeChange when a new type is selected", async () => {
    const user = userEvent.setup();
    render(
      <CustomerTypeDropdown
        currentType="prospect"
        customerId="123"
        onTypeChange={mockOnTypeChange}
      />,
    );

    const dropdown = screen.getByText("prospect");
    await user.click(dropdown);

    await waitFor(() => {
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    const activeOption = screen.getByText("Active");
    await user.click(activeOption);

    await waitFor(() => {
      expect(mockOnTypeChange).toHaveBeenCalledWith("123", "active");
    });
  });

  it("does not call onTypeChange when same type is selected", async () => {
    const user = userEvent.setup();
    render(
      <CustomerTypeDropdown
        currentType="prospect"
        customerId="123"
        onTypeChange={mockOnTypeChange}
      />,
    );

    const dropdown = screen.getByText("prospect");
    await user.click(dropdown);

    await waitFor(() => {
      expect(screen.getByText("Prospect")).toBeInTheDocument();
    });

    const prospectOption = screen.getByText("Prospect");
    await user.click(prospectOption);

    await waitFor(() => {
      expect(mockOnTypeChange).not.toHaveBeenCalled();
    });
  });

  it("shows loading state while updating", async () => {
    const user = userEvent.setup();
    mockOnTypeChange.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100)),
    );

    render(
      <CustomerTypeDropdown
        currentType="prospect"
        customerId="123"
        onTypeChange={mockOnTypeChange}
      />,
    );

    const dropdown = screen.getByText("prospect");
    await user.click(dropdown);

    const activeOption = screen.getByText("Active");
    await user.click(activeOption);

    // Check for loading spinner
    await waitFor(() => {
      const loadingSpinner = document.querySelector(".animate-spin");
      expect(loadingSpinner).toBeInTheDocument();
    });
  });

  it("is disabled when disabled prop is true", () => {
    render(
      <CustomerTypeDropdown
        currentType="prospect"
        customerId="123"
        onTypeChange={mockOnTypeChange}
        disabled={true}
      />,
    );

    const dropdown = screen.getByText("prospect");
    expect(dropdown).not.toHaveClass("cursor-pointer");
    expect(dropdown).toBeDisabled();
  });

  it("displays correct color for each customer type", () => {
    const { rerender } = render(
      <CustomerTypeDropdown
        currentType="prospect"
        customerId="123"
        onTypeChange={mockOnTypeChange}
      />,
    );

    expect(screen.getByText("prospect")).toHaveClass("status-draft");

    rerender(
      <CustomerTypeDropdown
        currentType="active"
        customerId="123"
        onTypeChange={mockOnTypeChange}
      />,
    );

    expect(screen.getByText("active")).toHaveClass("status-sent");

    rerender(
      <CustomerTypeDropdown
        currentType="vip"
        customerId="123"
        onTypeChange={mockOnTypeChange}
      />,
    );

    expect(screen.getByText("vip")).toHaveClass("status-approved");
  });
});
