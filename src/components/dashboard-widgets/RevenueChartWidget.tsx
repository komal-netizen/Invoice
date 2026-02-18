"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useStore } from "@/lib/store";
import type { RevenueChartConfig } from "@/lib/dashboard-types";
import { format, startOfWeek, subWeeks, startOfMonth, subMonths, startOfQuarter, subQuarters } from "date-fns";

interface RevenueChartWidgetProps {
  config: RevenueChartConfig;
}

export function RevenueChartWidget({ config }: RevenueChartWidgetProps) {
  const invoices = useStore((s) => s.invoices);
  const [view, setView] = useState(config.view);

  const chartData = useMemo(() => {
    const now = new Date();
    let data: { start: Date; label: string; revenue: number }[] = [];

    if (view === "weekly") {
      // Last 12 weeks
      for (let i = 11; i >= 0; i--) {
        const start = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
        data.push({
          start,
          label: format(start, "MMM d"),
          revenue: 0,
        });
      }
    } else if (view === "monthly") {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const start = startOfMonth(subMonths(now, i));
        data.push({
          start,
          label: format(start, "MMM yy"),
          revenue: 0,
        });
      }
    } else if (view === "quarterly") {
      // Last 8 quarters
      for (let i = 7; i >= 0; i--) {
        const start = startOfQuarter(subQuarters(now, i));
        data.push({
          start,
          label: format(start, "QQQ yy"),
          revenue: 0,
        });
      }
    }

    // Aggregate revenue
    const paidInvoices = invoices.filter((i) => i.status === "paid");
    paidInvoices.forEach((inv) => {
      const date = inv.paidAt ? new Date(inv.paidAt) : new Date(inv.issueDate);
      let periodStart: Date;

      if (view === "weekly") {
        periodStart = startOfWeek(date, { weekStartsOn: 1 });
      } else if (view === "monthly") {
        periodStart = startOfMonth(date);
      } else {
        periodStart = startOfQuarter(date);
      }

      const slot = data.find((d) => d.start.getTime() === periodStart.getTime());
      if (slot) slot.revenue += inv.total;
    });

    return data;
  }, [invoices, view]);

  const totalRevenue = useMemo(() => {
    return chartData.reduce((sum, d) => sum + d.revenue, 0);
  }, [chartData]);

  return (
    <div className="flex h-full flex-col p-5">
      {/* Header with view selector */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Revenue</h3>
          <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-white">
            {totalRevenue.toLocaleString("en-US", { style: "currency", currency: "USD" })}
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-neutral-200 p-1 dark:border-neutral-700">
          <button
            onClick={() => setView("weekly")}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              view === "weekly"
                ? "bg-orange-500 text-white"
                : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setView("monthly")}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              view === "monthly"
                ? "bg-orange-500 text-white"
                : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setView("quarterly")}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              view === "quarterly"
                ? "bg-orange-500 text-white"
                : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            }`}
          >
            Quarterly
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(234 88 12)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="rgb(234 88 12)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "currentColor" }}
              axisLine={{ stroke: "rgb(115 115 115)", opacity: 0.5 }}
              tickLine={false}
              className="text-neutral-500 dark:text-neutral-400"
            />
            <YAxis
              tick={{ fontSize: 11, fill: "currentColor" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (v >= 1000 ? `$${v / 1000}k` : `$${v}`)}
              className="text-neutral-500 dark:text-neutral-400"
              width={40}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid rgb(229 229 229)",
                backgroundColor: "white",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              labelStyle={{ color: "rgb(38 38 38)" }}
              formatter={(value: number) => [
                value.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                }),
                "Revenue",
              ]}
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.start
                  ? format(new Date(payload[0].payload.start), "MMM d, yyyy")
                  : ""
              }
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="rgb(234 88 12)"
              strokeWidth={2}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
