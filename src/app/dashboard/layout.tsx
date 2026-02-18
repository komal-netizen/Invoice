"use client";

import { Sidebar } from "@/components/Sidebar";
// import { ChatWidget } from "@/components/AIInvoiceChat/ChatWidget"; // Hidden for now, keeping code for future use
import { useStore } from "@/lib/store";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = useStore((s) => s.settings);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Apply platform-wide branding
  const applyBranding = true;

  return (
    <>
      {mounted && applyBranding && (
        <>
          <style dangerouslySetInnerHTML={{
            __html: `
              :root {
                --brand-primary: ${settings.primaryColor || "#0f766e"};
                --brand-secondary: ${settings.secondaryColor || "#0d9488"};
                --brand-primary-hover: ${adjustBrightness(settings.primaryColor || "#0f766e", -10)};
                --brand-secondary-hover: ${adjustBrightness(settings.secondaryColor || "#0d9488", -10)};
                --brand-font: ${settings.fontFamily || "system-ui"};
              }
              body {
                font-family: var(--brand-font), system-ui, -apple-system, sans-serif;
              }
            `
          }} />
          {settings.fontFamily && !settings.fontFamily.includes('system-ui') && (
            <link
              rel="stylesheet"
              href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(settings.fontFamily)}:wght@300;400;500;600;700&display=swap`}
            />
          )}
        </>
      )}
      <div className="min-h-screen bg-white dark:bg-neutral-950 relative">
        <Sidebar />
        <main className="relative z-0 pt-20 lg:pt-0 lg:pl-64 min-h-screen">
          {children}
        </main>
        {/* <ChatWidget /> */} {/* Hidden for now, keeping code for future use */}
      </div>
    </>
  );
}

// Helper to adjust brightness for hover states
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + percent));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + percent));
  const b = Math.max(0, Math.min(255, (num & 0xff) + percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
