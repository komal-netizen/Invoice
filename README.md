# Simplified Invoice Platform

A minimal dashboard for managing **clients** and **invoices**: two main tabs (Clients, Invoices) plus Settings.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Data is stored in the browser (localStorage) via Zustand persist.

## Features

### Clients tab
- **Dashboard**: List/grid of clients with search and tag filter; "New Client" button.
- **New Client** (modal): Company name, contact name, email (validated), tags (VIP, Regular, Retainer, One-time). "Save & Close" or "Save & Add Details" (opens full profile).
- **Client profile**: Website, phone, address, payment terms, currency, tax ID, tags. **Custom fields**: add fields (text, long text, number, email, phone, URL, date, dropdown, checkbox, currency) that apply to all client profiles.

### Invoices tab
- **Dashboard**: "New Invoice" CTA; filters by status, client, project, date range; search by number/client. Table with invoice #, client, project, dates, amount, status, and quick actions (Edit, Duplicate, Mark paid, Delete). Sidebars: clients and projects with totals.
- **New Invoice** (3 steps): (1) Single or Recurring (frequency, start/end, auto-send), (2) Select or add client, (3) Select/create project or "No Project". Then "Create Invoice" opens the editor.
- **Invoice editor**: Main canvas with header (logo, business info), Bill To, dates, project, line items (add/remove, qty, units, price), subtotal/tax/discount/total, payment details, late fees, notes. **Sidebar**: toggles (show logo, late fees, header image, apply tax, display tax ID, shipping address, reference number), status & issue/due dates, discount, currency & notes, payment details. Actions: Save as Draft, Preview, Download PDF, Send Invoice, Save & Close. Send opens an email modal (status set to Pending; real SMTP is not implemented).

### Settings tab
- **Invoice template**: Choose template (Modern Minimal, Classic Professional, etc.), primary/secondary color, header/footer text.
- **Business information**: Name, address, email, phone, website, tax ID, logo URL.
- **Invoice defaults**: Number format, next number, default payment terms, currency, late fee %, tax rate/name, display tax ID.
- **Email templates**: Subject/body for invoice, reminder, thank-you; signature.
- **Payment methods**: Enable/disable and add details for Bank Transfer, PayPal, Stripe, Check, Cash, Other.

## Stack

- **Next.js 14** (App Router), **TypeScript**, **Tailwind CSS**
- **Zustand** (state + localStorage persistence)
- **date-fns**, **uuid**

## Build

```bash
npm run build
npm start
```
