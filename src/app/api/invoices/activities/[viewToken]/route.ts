import { NextRequest, NextResponse } from "next/server";
import { getPublicInvoice } from "@/lib/invoice-store";

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

  return NextResponse.json({ activities: snap.activities });
}
