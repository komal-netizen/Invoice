import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function toBoard(board: {
  id: string;
  name: string;
  description: string | null;
  background: string | null;
  projectId: string | null;
  isSaved: boolean;
  createdAt: Date;
  updatedAt: Date;
  lists?: { id: string; name: string; order: number }[];
}) {
  return {
    id: board.id,
    name: board.name,
    description: board.description ?? undefined,
    background: board.background ?? undefined,
    projectId: board.projectId ?? undefined,
    isSaved: board.isSaved,
    createdAt: board.createdAt.toISOString(),
    updatedAt: board.updatedAt.toISOString(),
    ...(board.lists && {
      lists: board.lists.sort((a, b) => a.order - b.order).map((l) => ({ id: l.id, name: l.name, order: l.order })),
    }),
  };
}

export async function GET() {
  try {
    const boards = await prisma.board.findMany({
      include: { lists: { orderBy: { order: "asc" } } },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(boards.map(toBoard));
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to list boards", details: String(e) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, background, projectId, isSaved = false } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const board = await prisma.board.create({
      data: {
        name,
        description: description ?? null,
        background: background ?? null,
        projectId: projectId ?? null,
        isSaved: !!isSaved,
      },
      include: { lists: true },
    });

    return NextResponse.json(toBoard(board));
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to create board", details: String(e) },
      { status: 500 }
    );
  }
}
