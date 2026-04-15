import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Parse a number string that may use comma as decimal separator (European format). */
export function parseEuroNumber(value: string): number {
  if (!value || typeof value !== "string") return 0;
  // Replace comma with dot so parseFloat works correctly
  const normalized = value.replace(",", ".");
  const result = parseFloat(normalized);
  return isNaN(result) ? 0 : result;
}

/** Format a number for Euro display: replaces dot with comma as decimal separator. */
export function formatEuro(value: number, decimals = 2): string {
  return value.toFixed(decimals).replace(".", ",");
}

/** Regex pattern for validating Euro-style numeric input (allows both , and . as decimal). */
export const euroNumericPattern = /^\d*[.,]?\d*$/;

/**
 * Test if a string is a valid Euro-style numeric input.
 * Allows digits, and either a comma or dot as optional decimal separator.
 */
export function isValidEuroNumericInput(value: string): boolean {
  return value === "" || euroNumericPattern.test(value);
}
