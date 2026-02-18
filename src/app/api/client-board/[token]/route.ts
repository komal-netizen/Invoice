import { NextRequest, NextResponse } from "next/server";
import { getClientBoardSnapshot } from "@/lib/client-board-store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const snapshot = getClientBoardSnapshot(token);
  
  if (!snapshot) {
    return NextResponse.json({ error: "Board not found or access disabled" }, { status: 404 });
  }

  return NextResponse.json(snapshot);
}
