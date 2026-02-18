import type { DashboardWidget } from "@/lib/dashboard-types";
import { ActionCenterWidget } from "./ActionCenterWidget";
import { ActivityFeedWidget } from "./ActivityFeedWidget";
import { StatCardWidget } from "./StatCardWidget";
import { QuickActionsWidget } from "./QuickActionsWidget";
import { RevenueChartWidget } from "./RevenueChartWidget";
import { RecentInvoicesWidget } from "./RecentInvoicesWidget";
import type {
  ActionCenterConfig,
  ActivityFeedConfig,
  StatCardConfig,
  QuickActionsConfig,
  RevenueChartConfig,
  RecentInvoicesConfig,
} from "@/lib/dashboard-types";

interface WidgetRendererProps {
  widget: DashboardWidget;
}

export function WidgetRenderer({ widget }: WidgetRendererProps) {
  switch (widget.type) {
    case "action-center":
      return <ActionCenterWidget config={widget.config as ActionCenterConfig} />;
    
    case "activity-feed":
      return <ActivityFeedWidget config={widget.config as ActivityFeedConfig} />;
    
    case "stat-card":
      return <StatCardWidget config={widget.config as StatCardConfig} />;
    
    case "quick-actions":
      return <QuickActionsWidget config={widget.config as QuickActionsConfig} />;
    
    case "revenue-chart":
      return <RevenueChartWidget config={widget.config as RevenueChartConfig} />;
    
    case "recent-invoices":
      return <RecentInvoicesWidget config={widget.config as RecentInvoicesConfig} />;
    
    case "active-projects":
    case "unbilled-work":
    case "task-summary":
    case "client-list":
    case "time-tracker":
      return (
        <div className="flex h-full items-center justify-center p-8">
          <div className="text-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Widget "{widget.type}" coming soon
            </p>
          </div>
        </div>
      );
    
    default:
      return (
        <div className="flex h-full items-center justify-center p-8">
          <div className="text-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Unknown widget type
            </p>
          </div>
        </div>
      );
  }
}
