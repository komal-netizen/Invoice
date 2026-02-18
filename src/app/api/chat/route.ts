import { NextRequest, NextResponse } from "next/server";

/**
 * Optional Claude-backed chat for invoice intent.
 * Set ANTHROPIC_API_KEY in .env.local to enable; otherwise returns 204 and client uses rule-based parser.
 */

const SYSTEM_PROMPT = `You are an invoice assistant. The user will send a short message about creating an invoice. Extract intent and return ONLY valid JSON (no markdown, no explanation) in this exact shape:

{
  "type": "create_invoice" | "unclear",
  "clientId": "id from the list below, or omit if unclear/ambiguous",
  "amount": number or null,
  "lineItems": [{"description": "string", "quantity": number, "unit": "string", "price": number}] or null,
  "needClient": true if we need to ask which client,
  "needAmount": true if we need to ask amount,
  "message": "short reply to show the user, or null"
}

Rules:
- Match the user's client name to one of the provided clients by id. Use the "clients" list: each item is { "id", "companyName", "contactName" }. Pick the best match by company or contact name; if multiple matches or no match, set needClient true and put a helpful message.
- If the user mentions a dollar amount or number, set "amount" to that number and create a single lineItem: { "description": "Services", "quantity": 1, "unit": "project", "price": amount }.
- If the user says something like "10 hours at $150" create a lineItem: { "description": "Services", "quantity": 10, "unit": "hours", "price": 150 }.
- If intent is not about creating an invoice, set type "unclear" and a friendly message.
- Always return valid JSON only.`;

export interface ChatApiBody {
  message: string;
  clients: { id: string; companyName: string; contactName: string }[];
}

export interface ChatApiResponse {
  type: "create_invoice" | "unclear";
  clientId?: string;
  amount?: number;
  lineItems?: { description: string; quantity: number; unit: string; price: number }[];
  needClient?: boolean;
  needAmount?: boolean;
  message?: string;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return new NextResponse(null, { status: 204 });
  }

  let body: ChatApiBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { message, clients } = body;
  if (typeof message !== "string" || !Array.isArray(clients)) {
    return NextResponse.json({ error: "message (string) and clients (array) required" }, { status: 400 });
  }

  const clientList = clients
    .slice(0, 50)
    .map((c) => ({ id: c.id, companyName: c.companyName || "", contactName: c.contactName || "" }));

  const userContent = `Clients (use these ids):\n${JSON.stringify(clientList)}\n\nUser message: ${message}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2024-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Anthropic API error:", res.status, err);
      return new NextResponse(null, { status: 204 });
    }

    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = data.content?.find((c) => c.type === "text")?.text?.trim();
    if (!text) return new NextResponse(null, { status: 204 });

    const jsonStr = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(jsonStr) as ChatApiResponse;
    if (!parsed || typeof parsed.type !== "string") return new NextResponse(null, { status: 204 });

    return NextResponse.json(parsed);
  } catch (e) {
    console.error("Chat API error:", e);
    return new NextResponse(null, { status: 204 });
  }
}
