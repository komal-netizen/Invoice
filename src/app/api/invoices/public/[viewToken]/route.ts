import { NextRequest, NextResponse } from "next/server";
import { getPublicInvoice, appendActivity } from "@/lib/invoice-store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ viewToken: string }> }
) {
  const { viewToken } = await params;
  if (!viewToken) {
    return NextResponse.json({ error: "Missing viewToken" }, { status: 400 });
  }

  const snap = getPublicInvoice(viewToken);
  if (!snap) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const activities = snap.activities;
  const lastOpen = activities.filter((a) => a.type === "opened" || a.type === "reopened").pop();
  const now = new Date().toISOString();
  if (!lastOpen) {
    appendActivity(viewToken, { type: "opened", at: now });
  } else {
    appendActivity(viewToken, { type: "reopened", at: now });
  }

  return NextResponse.json({
    invoice: snap.invoice,
    clientEmail: snap.clientEmail,
    clientName: snap.clientName,
    businessName: snap.businessName ?? null,
    businessAddress: snap.businessAddress ?? null,
    businessEmail: snap.businessEmail ?? null,
    paymentLinkUrl: snap.paymentLinkUrl ?? null,
  });
}
