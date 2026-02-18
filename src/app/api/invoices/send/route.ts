import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import { getPublicInvoice, setPublicInvoice, appendActivity, setPaymentLink } from "@/lib/invoice-store";
import type { Invoice } from "@/lib/types";

const ZERO_DECIMAL_CURRENCIES = new Set(["JPY", "KRW", "VND", "CLP", "PYG", "JPY", "HUF"]);

function amountForStripe(amount: number, currency: string): number {
  if (ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase())) return Math.round(amount);
  return Math.round(amount * 100);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      invoice,
      clientEmail,
      clientName,
      businessName,
      businessAddress,
      businessEmail,
      subject,
      body: emailBody,
    } = body as {
      invoice: Invoice;
      clientEmail: string;
      clientName?: string;
      businessName?: string;
      businessAddress?: string;
      businessEmail?: string;
      subject?: string;
      body?: string;
    };

    if (!invoice || !clientEmail) {
      return NextResponse.json(
        { error: "invoice and clientEmail are required" },
        { status: 400 }
      );
    }

    const viewToken = crypto.randomUUID();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const viewUrl = `${baseUrl}/view-invoice/${viewToken}`;

    setPublicInvoice(viewToken, {
      invoice: { ...invoice, viewToken },
      clientEmail,
      clientName,
      businessName,
      businessAddress,
      businessEmail,
    });
    appendActivity(viewToken, { type: "sent", at: new Date().toISOString() });

    let paymentLinkUrl: string | undefined;
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey && invoice.total != null && invoice.total > 0) {
      const stripe = new Stripe(stripeKey);
      const amount = amountForStripe(invoice.total, invoice.currency || "USD");
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: (invoice.currency || "USD").toLowerCase(),
              unit_amount: amount,
              product_data: {
                name: `Invoice ${invoice.invoiceNumber}`,
                description: invoice.notes || undefined,
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${viewUrl}?paid=1`,
        cancel_url: viewUrl,
        metadata: { viewToken },
        customer_email: clientEmail,
      });
      paymentLinkUrl = session.url ?? undefined;
      if (paymentLinkUrl) setPaymentLink(viewToken, paymentLinkUrl);
    }

    let sentEmail = false;
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey && clientEmail) {
      const resend = new Resend(resendKey);
      const from = process.env.RESEND_FROM_EMAIL || "invoices@resend.dev";
      const sub = subject ?? `Invoice ${invoice.invoiceNumber}`;
      const text = emailBody
        ? `${emailBody}\n\nView invoice: ${viewUrl}${paymentLinkUrl ? `\nPay now: ${paymentLinkUrl}` : ""}`
        : `View your invoice: ${viewUrl}${paymentLinkUrl ? `\nPay now: ${paymentLinkUrl}` : ""}`;
      const { error } = await resend.emails.send({
        from,
        to: clientEmail,
        subject: sub,
        text,
      });
      sentEmail = !error;
    }

    return NextResponse.json({
      viewToken,
      viewUrl,
      paymentLinkUrl: paymentLinkUrl ?? null,
      sentEmail,
    });
  } catch (e) {
    console.error("POST /api/invoices/send", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Send failed" },
      { status: 500 }
    );
  }
}
