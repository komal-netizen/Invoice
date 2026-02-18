import type { Client, LineItem } from "./types";

export interface ParsedCommand {
  type: "create_invoice" | "unclear";
  clientId?: string;
  clients: Client[];
  amount?: number;
  description?: string;
  lineItems?: { description: string; quantity: number; unit: string; price: number }[];
  needClient?: boolean;
  needAmount?: boolean;
  message?: string;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchClientByName(clients: Client[], nameInput: string): Client[] {
  if (!nameInput || nameInput.length < 2) return [];
  const norm = normalize(nameInput);
  const words = norm.split(" ").filter(Boolean);
  return clients.filter((c) => {
    const company = normalize(c.companyName);
    const contact = normalize(c.contactName);
    if (company.includes(norm) || norm.includes(company)) return true;
    if (contact.includes(norm) || norm.includes(contact)) return true;
    if (words.every((w) => company.includes(w) || contact.includes(w))) return true;
    return false;
  });
}

function extractAmount(text: string): number | undefined {
  const cleaned = text.replace(/,/g, "");
  const match = cleaned.match(/\$?\s*(\d+(?:\.\d{1,2})?)\s*(?:dollars?|usd|eur|gbp)?/i) ?? cleaned.match(/\b(\d+(?:\.\d{1,2})?)\s*(?:dollars?|usd)/i);
  if (match) return parseFloat(match[1]);
  const onlyNum = cleaned.match(/(\d+(?:\.\d{1,2})?)/);
  return onlyNum ? parseFloat(onlyNum[1]) : undefined;
}

/**
 * Parse natural language invoice command and match client.
 * Examples:
 * - "Create invoice for Acme for $5,000"
 * - "Invoice Sarah's Bakery for February consulting"
 * - "Bill TechStart Inc $3,500 for website design"
 */
export function parseInvoiceCommand(text: string, clients: Client[]): ParsedCommand {
  const t = text.trim();
  if (!t) return { type: "unclear", clients: [], message: "Type a command like: Create an invoice for Acme Corp for $5,000" };

  const lower = t.toLowerCase();
  const isInvoiceIntent =
    lower.includes("invoice") ||
    lower.includes("bill") ||
    lower.includes("create") && (lower.includes("invoice") || lower.includes("for"));

  if (!isInvoiceIntent) {
    return {
      type: "unclear",
      clients: [],
      message: "I can help create invoices. Try: \"Create an invoice for [Client] for $[amount]\" or \"Invoice [Client] for [service]\"",
    };
  }

  // Try to extract amount ($X or X dollars)
  const amount = extractAmount(t);

  // Try to find client name: "invoice [X] for $..." or "for [X] for $..."
  let clientName = "";
  const forAmountMatch = t.match(/(?:invoice|bill|create\s+invoice)\s+(?:for\s+)?(.+?)\s+for\s+(?:\$|\d)/i);
  if (forAmountMatch) clientName = forAmountMatch[1].trim();
  if (!clientName) {
    const forEndMatch = t.match(/(?:invoice|bill|create\s+invoice)\s+(?:for\s+)?(.+?)(?:\s*$)/i);
    if (forEndMatch) clientName = forEndMatch[1].trim();
  }
  if (!clientName) {
    const billMatch = t.match(/bill\s+(.+?)(?:\s+\$|\s+for\s+\$|$)/i);
    if (billMatch) clientName = billMatch[1].trim();
  }
  if (!clientName && amount !== undefined) {
    const beforeAmount = t.split(/\$\d|for\s+\$|\s+for\s+\d/i)[0]?.trim() ?? "";
    const parts = beforeAmount.split(/\s+for\s+/);
    if (parts.length >= 1)
      clientName = parts[parts.length - 1].replace(/^(invoice|bill|create)\s+/i, "").trim();
  }
  if (!clientName) {
    return {
      type: "create_invoice",
      clients: [],
      needClient: true,
      message: "Which client is this invoice for? Name the company or contact.",
    };
  }

  const matched = matchClientByName(clients, clientName);
  if (matched.length === 0) {
    return {
      type: "create_invoice",
      clients: [],
      needClient: true,
      message: `I couldn't find a client matching "${clientName}". Check the name or add the client first.`,
    };
  }
  if (matched.length > 1) {
    return {
      type: "create_invoice",
      clients: matched,
      needClient: true,
      message: `I found ${matched.length} clients: ${matched.map((c) => c.companyName).join(", ")}. Which one? (Reply with the exact company name.)`,
    };
  }

  const client = matched[0];
  if (amount === undefined) {
    return {
      type: "create_invoice",
      clientId: client.id,
      clients: [client],
      needAmount: true,
      message: `Got it, invoice for ${client.companyName}. What amount or line items should I add? (e.g. "$5,000" or "10 hours at $150/hour")`,
    };
  }

  // Single line item: amount as total (1 × amount)
  const lineItems: { description: string; quantity: number; unit: string; price: number }[] = [
    { description: "Services", quantity: 1, unit: "project", price: amount },
  ];

  return {
    type: "create_invoice",
    clientId: client.id,
    clients: [client],
    amount,
    description: "Services",
    lineItems,
    message: undefined,
  };
}

export function buildDraftLineItems(
  items: { description: string; quantity: number; unit: string; price: number }[]
): LineItem[] {
  return items.map((item) => ({
    id: crypto.randomUUID(),
    items: item.description,
    itemDescription: undefined,
    quantity: item.quantity,
    unit: item.unit,
    price: item.price,
    total: item.quantity * item.price,
  }));
}
