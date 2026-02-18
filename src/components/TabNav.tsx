"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function TabNav() {
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";
  const isInvoiceSection = pathname.startsWith("/dashboard/invoices") || pathname.startsWith("/dashboard/settings");
  const isClients = pathname.startsWith("/dashboard/clients");

  return (
    <nav className="border-b border-black/8 bg-surface-elevated">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center gap-1 py-3">
          <Link
            href="/dashboard"
            className="mr-6 text-lg font-medium text-ink hover:text-accent"
          >
            Invoice
          </Link>
          <Link
            href="/dashboard"
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isDashboard
                ? "bg-accent-muted text-accent"
                : "text-ink-muted hover:bg-surface-muted hover:text-ink"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/invoices"
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isInvoiceSection
                ? "bg-accent-muted text-accent"
                : "text-ink-muted hover:bg-surface-muted hover:text-ink"
            }`}
          >
            Invoice
          </Link>
          <Link
            href="/dashboard/clients"
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isClients
                ? "bg-accent-muted text-accent"
                : "text-ink-muted hover:bg-surface-muted hover:text-ink"
            }`}
          >
            Clients
          </Link>
        </div>
        {isInvoiceSection && (
          <div className="flex gap-1 border-t border-black/6 pb-3 pt-1">
            <Link
              href="/dashboard/invoices"
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname.startsWith("/dashboard/invoices")
                  ? "bg-accent-muted text-accent"
                  : "text-ink-muted hover:bg-surface-muted hover:text-ink"
              }`}
            >
              Invoices
            </Link>
            <Link
              href="/dashboard/settings"
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname.startsWith("/dashboard/settings")
                  ? "bg-accent-muted text-accent"
                  : "text-ink-muted hover:bg-surface-muted hover:text-ink"
              }`}
            >
              Settings
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
