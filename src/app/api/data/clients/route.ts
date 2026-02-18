import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function toClient(client: {
  id: string;
  code: string | null;
  companyName: string;
  contactName: string;
  email: string;
  logo: string | null;
  tags: string;
  status: string | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  paymentTerms: string | null;
  currency: string | null;
  taxId: string | null;
  customFieldValues: string | null;
  boardToken: string | null;
  boardEnabled: boolean;
  boardWelcomeMessage: string | null;
  boardTokenCreatedAt: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: client.id,
    code: client.code ?? undefined,
    companyName: client.companyName,
    contactName: client.contactName,
    email: client.email,
    logo: client.logo ?? undefined,
    tags: JSON.parse(client.tags || "[]"),
    status: client.status ?? "active",
    website: client.website ?? undefined,
    phone: client.phone ?? undefined,
    address: client.address ? JSON.parse(client.address) : undefined,
    paymentTerms: client.paymentTerms ?? undefined,
    currency: client.currency ?? undefined,
    taxId: client.taxId ?? undefined,
    customFieldValues: client.customFieldValues ? JSON.parse(client.customFieldValues) : [],
    boardToken: client.boardToken ?? undefined,
    boardEnabled: client.boardEnabled,
    boardWelcomeMessage: client.boardWelcomeMessage ?? undefined,
    boardTokenCreatedAt: client.boardTokenCreatedAt ?? undefined,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
  };
}

export async function GET() {
  try {
    const clients = await prisma.client.findMany({ orderBy: { updatedAt: "desc" } });
    return NextResponse.json(clients.map(toClient));
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to list clients", details: String(e) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      companyName,
      contactName,
      email,
      code,
      logo,
      tags = [],
      status = "active",
      website,
      phone,
      address,
      paymentTerms,
      currency,
      taxId,
      customFieldValues = [],
    } = body;

    if (!companyName || !contactName || !email) {
      return NextResponse.json(
        { error: "companyName, contactName, and email are required" },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: {
        code: code ?? null,
        companyName,
        contactName,
        email,
        logo: logo ?? null,
        tags: JSON.stringify(Array.isArray(tags) ? tags : []),
        status: status ?? "active",
        website: website ?? null,
        phone: phone ?? null,
        address: address ? JSON.stringify(address) : null,
        paymentTerms: paymentTerms ?? null,
        currency: currency ?? null,
        taxId: taxId ?? null,
        customFieldValues: JSON.stringify(Array.isArray(customFieldValues) ? customFieldValues : []),
      },
    });

    return NextResponse.json(toClient(client));
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to create client", details: String(e) },
      { status: 500 }
    );
  }
}
