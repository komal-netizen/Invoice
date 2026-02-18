import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { appendActivity, getPublicInvoice } from "@/lib/invoice-store";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = Stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid signature" },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const viewToken = session.metadata?.viewToken;
    if (viewToken) {
      const snap = getPublicInvoice(viewToken);
      if (snap && !snap.activities.some((a) => a.type === "paid")) {
        appendActivity(viewToken, {
          type: "paid",
          at: new Date().toISOString(),
          metadata: { sessionId: session.id },
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
