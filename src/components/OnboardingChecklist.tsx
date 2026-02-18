"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: "add_client",
    label: "Add your first client",
    description: "Start by adding a client to your system",
    href: "/dashboard/clients",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    id: "create_invoice",
    label: "Create your first invoice",
    description: "Generate a professional invoice and send it to your client",
    href: "/dashboard/invoices",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    id: "setup_payment",
    label: "Configure payment methods",
    description: "Add your payment details so clients know how to pay",
    href: "/dashboard/settings",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
  },
  {
    id: "customize_brand",
    label: "Customize your brand",
    description: "Add your logo and brand colors to invoices",
    href: "/dashboard/settings",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
      </svg>
    ),
  },
  {
    id: "create_project",
    label: "Create a project",
    description: "Organize your work by creating a project",
    href: "/dashboard/projects",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
      </svg>
    ),
  },
];

export function OnboardingChecklist() {
  const [isVisible, setIsVisible] = useState(false);
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    const savedCompleted = localStorage.getItem("onboardingCompleted");
    
    if (!hasSeenOnboarding) {
      setIsVisible(true);
    }
    
    if (savedCompleted) {
      try {
        setCompletedItems(JSON.parse(savedCompleted));
      } catch {
        // ignore parsing errors
      }
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setIsVisible(false);
  };

  const handleToggleItem = (itemId: string) => {
    const newCompleted = completedItems.includes(itemId)
      ? completedItems.filter((id) => id !== itemId)
      : [...completedItems, itemId];
    
    setCompletedItems(newCompleted);
    localStorage.setItem("onboardingCompleted", JSON.stringify(newCompleted));
  };

  if (!isVisible) return null;

  const completedCount = completedItems.length;
  const totalCount = CHECKLIST_ITEMS.length;
  const progress = (completedCount / totalCount) * 100;

  return (
    <div className="rounded-xl border border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50 p-6 shadow-sm dark:border-orange-900 dark:from-orange-950/30 dark:to-amber-950/20">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                {completedCount === totalCount ? "All done! 🎉" : "Get Started"}
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {completedCount === totalCount
                  ? "You've completed all the essential steps!"
                  : `Complete ${totalCount - completedCount} more ${totalCount - completedCount === 1 ? 'step' : 'steps'} to get the most out of the platform`}
              </p>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div className="mt-4 mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  {completedCount} of {totalCount} completed
                </span>
                <span className="text-neutral-600 dark:text-neutral-400">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-orange-100 dark:bg-orange-950/50">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <ul className="mt-5 space-y-3">
                {CHECKLIST_ITEMS.map((item) => {
                  const isCompleted = completedItems.includes(item.id);
                  return (
                    <li key={item.id} className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggleItem(item.id)}
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all ${
                          isCompleted
                            ? "border-orange-500 bg-orange-500 text-white"
                            : "border-neutral-300 bg-white hover:border-orange-400 dark:border-neutral-600 dark:bg-neutral-800"
                        }`}
                        aria-label={isCompleted ? "Mark as incomplete" : "Mark as complete"}
                      >
                        {isCompleted && (
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <Link
                        href={item.href}
                        className={`group flex-1 ${isCompleted ? "opacity-60" : ""}`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 text-orange-600 dark:text-orange-400">{item.icon}</span>
                          <div>
                            <p className={`text-sm font-medium transition-colors ${
                              isCompleted
                                ? "text-neutral-600 line-through dark:text-neutral-500"
                                : "text-neutral-900 group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400"
                            }`}>
                              {item.label}
                            </p>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">{item.description}</p>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="rounded p-1.5 text-neutral-600 hover:bg-orange-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-orange-950/50 dark:hover:text-white transition-colors"
            aria-label={isMinimized ? "Expand checklist" : "Minimize checklist"}
          >
            <svg className={`h-5 w-5 transition-transform ${isMinimized ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded p-1.5 text-neutral-600 hover:bg-orange-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-orange-950/50 dark:hover:text-white transition-colors"
            aria-label="Dismiss checklist"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
