import { NextRequest, NextResponse } from "next/server";
import { setClientBoardSnapshot, type ClientBoardSnapshot } from "@/lib/client-board-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, data } = body as { token: string; data: ClientBoardSnapshot };
    
    if (!token || !data) {
      return NextResponse.json({ error: "Missing token or data" }, { status: 400 });
    }

    setClientBoardSnapshot(token, data);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sync client board error:', error);
    return NextResponse.json({ error: "Failed to sync board data" }, { status: 500 });
  }
}
