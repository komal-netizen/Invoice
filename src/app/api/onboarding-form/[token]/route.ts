import { NextResponse } from "next/server";
import type { OnboardingForm } from "@/lib/types";

// Server-side in-memory store for form data
const formStore = new Map<string, OnboardingForm>();

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    
    // Get form from store
    const form = formStore.get(token);
    
    if (!form || !form.tokenEnabled) {
      return NextResponse.json(
        { error: "Form not found or unavailable" },
        { status: 404 }
      );
    }

    return NextResponse.json(form);
  } catch (error) {
    console.error("Error fetching form:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
