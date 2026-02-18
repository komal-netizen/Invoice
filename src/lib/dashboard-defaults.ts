/**
 * Default Dashboard Layouts and Widget Configurations
 */

import { v4 as uuid } from "uuid";
import type {
  DashboardLayout,
  DashboardWidget,
  WidgetMetadata,
  StatCardConfig,
  RevenueChartConfig,
  RecentInvoicesConfig,
  ActionCenterConfig,
  ActivityFeedConfig,
  QuickActionsConfig,
  ActiveProjectsConfig,
  UnbilledWorkConfig,
} from "./dashboard-types";

// Widget metadata for library display
export const WIDGET_METADATA: Record<string, WidgetMetadata> = {
  "action-center": {
    type: "action-center",
    name: "Action Center",
    description: "Shows urgent items requiring your attention",
    icon: "alert-circle",
    category: "actions",
    defaultSize: { w: 12, h: 4 },
    minSize: { w: 6, h: 3 },
    defaultConfig: {
      showOverdue: true,
      showUnbilled: true,
      showPending: true,
      maxItems: 10,
      showHeader: true,
    } as ActionCenterConfig,
  },
  "activity-feed": {
    type: "activity-feed",
    name: "Activity Feed",
    description: "Timeline of recent events and updates",
    icon: "activity",
    category: "feeds",
    defaultSize: { w: 6, h: 6 },
    minSize: { w: 4, h: 4 },
    defaultConfig: {
      maxItems: 10,
      groupByDate: true,
      showHeader: true,
    } as ActivityFeedConfig,
  },
  "stat-card": {
    type: "stat-card",
    name: "Stat Card",
    description: "Display a single key metric",
    icon: "bar-chart",
    category: "metrics",
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 6, h: 4 },
    defaultConfig: {
      metric: "total-paid",
      compact: false,
      showTrend: false,
      showHeader: false,
    } as StatCardConfig,
  },
  "revenue-chart": {
    type: "revenue-chart",
    name: "Revenue Chart",
    description: "Visual chart of revenue over time",
    icon: "trending-up",
    category: "charts",
    defaultSize: { w: 12, h: 6 },
    minSize: { w: 6, h: 4 },
    defaultConfig: {
      view: "weekly",
      showDataLabels: false,
      showGrid: true,
      showHeader: true,
    } as RevenueChartConfig,
  },
  "recent-invoices": {
    type: "recent-invoices",
    name: "Recent Invoices",
    description: "Table of your most recent invoices",
    icon: "file-text",
    category: "tables",
    defaultSize: { w: 12, h: 6 },
    minSize: { w: 6, h: 4 },
    defaultConfig: {
      rowCount: 8,
      showColumns: ["invoiceNumber", "client", "dueDate", "amount", "status"],
      showHeader: true,
    } as RecentInvoicesConfig,
  },
  "quick-actions": {
    type: "quick-actions",
    name: "Quick Actions",
    description: "Fast access to common tasks",
    icon: "zap",
    category: "actions",
    defaultSize: { w: 12, h: 2 },
    minSize: { w: 4, h: 2 },
    defaultConfig: {
      actions: ["new-invoice", "log-time", "add-task"],
      buttonSize: "medium",
      layout: "horizontal",
      showHeader: false,
    } as QuickActionsConfig,
  },
  "active-projects": {
    type: "active-projects",
    name: "Active Projects",
    description: "Overview of your current projects",
    icon: "folder",
    category: "tables",
    defaultSize: { w: 6, h: 6 },
    minSize: { w: 4, h: 4 },
    defaultConfig: {
      layout: "grid",
      showProgress: true,
      maxProjects: 6,
      showHeader: true,
    } as ActiveProjectsConfig,
  },
  "unbilled-work": {
    type: "unbilled-work",
    name: "Unbilled Work",
    description: "Tasks ready to be invoiced",
    icon: "dollar-sign",
    category: "actions",
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    defaultConfig: {
      groupByClient: true,
      showCreateInvoice: true,
      minAmount: 0,
      showHeader: true,
    } as UnbilledWorkConfig,
  },
};

// Helper function to create a widget with default config
function createWidget(
  type: DashboardWidget["type"],
  position: DashboardWidget["position"],
  configOverrides?: Partial<DashboardWidget["config"]>
): DashboardWidget {
  const metadata = WIDGET_METADATA[type];
  return {
    id: uuid(),
    type,
    position,
    config: { ...metadata.defaultConfig, ...configOverrides },
    visible: true,
  };
}

// Default Layout: Action-Oriented (Default for new users)
export function createActionOrientedLayout(): DashboardLayout {
  return {
    id: uuid(),
    name: "Action-Oriented",
    presetType: "action-oriented",
    isDefault: true,
    lastModified: new Date().toISOString(),
    widgets: [
      // Action Center - full width at top
      createWidget("action-center", { x: 0, y: 0, w: 12, h: 4 }),
      
      // Quick Actions bar
      createWidget("quick-actions", { x: 0, y: 4, w: 12, h: 2 }),
      
      // Three stat cards in a row
      createWidget("stat-card", { x: 0, y: 6, w: 4, h: 3 }, { metric: "total-paid" }),
      createWidget("stat-card", { x: 4, y: 6, w: 4, h: 3 }, { metric: "total-outstanding" }),
      createWidget("stat-card", { x: 8, y: 6, w: 4, h: 3 }, { metric: "unbilled-work" }),
      
      // Activity feed on left, Recent invoices on right
      createWidget("activity-feed", { x: 0, y: 9, w: 6, h: 6 }),
      createWidget("recent-invoices", { x: 6, y: 9, w: 6, h: 6 }),
    ],
  };
}

// Financial Focus Layout
export function createFinancialFocusLayout(): DashboardLayout {
  return {
    id: uuid(),
    name: "Financial Focus",
    presetType: "financial-focus",
    isDefault: false,
    lastModified: new Date().toISOString(),
    widgets: [
      // Revenue chart spanning full width
      createWidget("revenue-chart", { x: 0, y: 0, w: 12, h: 6 }),
      
      // Four financial stat cards
      createWidget("stat-card", { x: 0, y: 6, w: 3, h: 3 }, { metric: "total-paid" }),
      createWidget("stat-card", { x: 3, y: 6, w: 3, h: 3 }, { metric: "total-outstanding" }),
      createWidget("stat-card", { x: 6, y: 6, w: 3, h: 3 }, { metric: "unbilled-work" }),
      createWidget("stat-card", { x: 9, y: 6, w: 3, h: 3 }, { metric: "total-invoices" }),
      
      // Unbilled work and Recent invoices
      createWidget("unbilled-work", { x: 0, y: 9, w: 6, h: 5 }),
      createWidget("recent-invoices", { x: 6, y: 9, w: 6, h: 5 }),
    ],
  };
}

// Project Manager Layout
export function createProjectManagerLayout(): DashboardLayout {
  return {
    id: uuid(),
    name: "Project Manager",
    presetType: "project-manager",
    isDefault: false,
    lastModified: new Date().toISOString(),
    widgets: [
      // Quick actions at top
      createWidget("quick-actions", { x: 0, y: 0, w: 12, h: 2 }),
      
      // Active projects taking main space
      createWidget("active-projects", { x: 0, y: 2, w: 8, h: 6 }),
      
      // Activity feed on right
      createWidget("activity-feed", { x: 8, y: 2, w: 4, h: 6 }),
      
      // Three stat cards at bottom
      createWidget("stat-card", { x: 0, y: 8, w: 4, h: 3 }, { metric: "total-projects" }),
      createWidget("stat-card", { x: 4, y: 8, w: 4, h: 3 }, { metric: "total-hours" }),
      createWidget("stat-card", { x: 8, y: 8, w: 4, h: 3 }, { metric: "overdue-tasks" }),
    ],
  };
}

// Minimalist Layout
export function createMinimalistLayout(): DashboardLayout {
  return {
    id: uuid(),
    name: "Minimalist",
    presetType: "minimalist",
    isDefault: false,
    lastModified: new Date().toISOString(),
    widgets: [
      // Quick actions centered
      createWidget("quick-actions", { x: 2, y: 0, w: 8, h: 2 }),
      
      // Three key metrics with space between
      createWidget("stat-card", { x: 1, y: 3, w: 3, h: 4 }, { metric: "total-paid" }),
      createWidget("stat-card", { x: 5, y: 3, w: 3, h: 4 }, { metric: "total-outstanding" }),
      createWidget("stat-card", { x: 9, y: 3, w: 3, h: 4 }, { metric: "unbilled-work" }),
      
      // Action center at bottom for things needing attention
      createWidget("action-center", { x: 2, y: 8, w: 8, h: 4 }),
    ],
  };
}

// Get default layout based on preset type
export function getDefaultLayout(presetType?: string): DashboardLayout {
  switch (presetType) {
    case "financial-focus":
      return createFinancialFocusLayout();
    case "project-manager":
      return createProjectManagerLayout();
    case "minimalist":
      return createMinimalistLayout();
    case "action-oriented":
    default:
      return createActionOrientedLayout();
  }
}

// Get all available preset layouts
export function getAllPresetLayouts(): DashboardLayout[] {
  return [
    createActionOrientedLayout(),
    createFinancialFocusLayout(),
    createProjectManagerLayout(),
    createMinimalistLayout(),
  ];
}
