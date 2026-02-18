import type { LineItem } from "./types";

export function recalc(
  lineItems: LineItem[],
  taxRate: number,
  discountType: "none" | "percent" | "fixed",
  discountValue: number
) {
  const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.price, 0);
  const taxAmount = subtotal * (taxRate / 100);
  let discountAmount = 0;
  if (discountType === "percent") discountAmount = subtotal * (discountValue / 100);
  else if (discountType === "fixed") discountAmount = discountValue;
  const total = Math.max(0, subtotal + taxAmount - discountAmount);
  return { subtotal, taxAmount, discountAmount, total };
}
