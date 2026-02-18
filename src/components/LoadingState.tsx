export function LoadingSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800 ${className}`} />
  );
}

export function TableLoadingSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/50">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="p-4">
                <LoadingSkeleton className="h-4 w-24" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-neutral-100 dark:border-neutral-800">
              {Array.from({ length: cols }).map((_, colIndex) => (
                <td key={colIndex} className="p-4">
                  <LoadingSkeleton className="h-4 w-32" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardLoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <LoadingSkeleton className="h-4 w-24 mb-3" />
          <LoadingSkeleton className="h-6 w-32 mb-2" />
          <LoadingSkeleton className="h-3 w-40" />
        </div>
      ))}
    </div>
  );
}

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex items-center justify-center p-8" role="status" aria-live="polite">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-neutral-200 border-t-orange-500 dark:border-neutral-700 dark:border-t-orange-400`} />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
