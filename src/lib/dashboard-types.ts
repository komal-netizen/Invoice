/**
 * Dashboard Widget System Types
 * Defines the type system for customizable dashboard widgets
 */

export type WidgetType =
  | "stat-card" // Single metric (revenue, clients, etc.)
  | "revenue-chart" // Financial charts
  | "recent-invoices" // Table of recent invoices
  | "action-center" // Urgent items needing attention
  | "activity-feed" // Recent activity timeline
  | "active-projects" // Project cards with progress
  | "unbilled-work" // Tasks ready to invoice
  | "quick-actions" // CTA buttons
  | "task-summary" // Task board overview
  | "client-list" // Recent clients
  | "time-tracker"; // Quick time entry widget

export type StatMetric =
  | "total-invoices"
  | "total-paid"
  | "total-outstanding"
  | "unbilled-work"
  | "overdue-tasks"
  | "total-clients"
  | "total-projects"
  | "total-hours"
  | "total-services";

export type QuickAction =
  | "new-invoice"
  | "log-time"
  | "add-task"
  | "add-client"
  | "add-project"
  | "create-board";

export type ChartView = "weekly" | "monthly" | "quarterly";

export type ActivityEventType =
  | "invoice_created"
  | "invoice_paid"
  | "invoice_sent"
  | "project_created"
  | "project_updated"
  | "time_logged"
  | "task_created"
  | "task_completed"
  | "client_added"
  | "payment_received";

// Base widget config that all widgets extend
export interface BaseWidgetConfig {
  title?: string;
  showHeader?: boolean;
}

// Specific config types for each widget
export interface StatCardConfig extends BaseWidgetConfig {
  metric: StatMetric;
  compact?: boolean;
  showTrend?: boolean;
}

export interface RevenueChartConfig extends BaseWidgetConfig {
  view: ChartView;
  showDataLabels?: boolean;
  showGrid?: boolean;
}

export interface RecentInvoicesConfig extends BaseWidgetConfig {
  rowCount: number;
  showColumns: Array<"invoiceNumber" | "client" | "dueDate" | "amount" | "status">;
  filterStatus?: string[];
}

export interface ActionCenterConfig extends BaseWidgetConfig {
  showOverdue?: boolean;
  showUnbilled?: boolean;
  showPending?: boolean;
  maxItems?: number;
}

export interface ActivityFeedConfig extends BaseWidgetConfig {
  maxItems: number;
  eventTypes?: ActivityEventType[];
  groupByDate?: boolean;
}

export interface ActiveProjectsConfig extends BaseWidgetConfig {
  layout: "grid" | "list";
  showProgress?: boolean;
  filterStatus?: string[];
  maxProjects?: number;
}

export interface UnbilledWorkConfig extends BaseWidgetConfig {
  groupByClient?: boolean;
  showCreateInvoice?: boolean;
  minAmount?: number;
}

export interface QuickActionsConfig extends BaseWidgetConfig {
  actions: QuickAction[];
  buttonSize: "small" | "medium" | "large";
  layout: "horizontal" | "grid";
}

export interface TaskSummaryConfig extends BaseWidgetConfig {
  showByBoard?: boolean;
  showByStatus?: boolean;
  maxTasks?: number;
}

export interface ClientListConfig extends BaseWidgetConfig {
  maxClients: number;
  showAvatar?: boolean;
  sortBy: "recent" | "name" | "revenue";
}

export interface TimeTrackerConfig extends BaseWidgetConfig {
  showRunningTimer?: boolean;
  quickEntry?: boolean;
}

// Union type for all widget configs
export type WidgetConfig =
  | StatCardConfig
  | RevenueChartConfig
  | RecentInvoicesConfig
  | ActionCenterConfig
  | ActivityFeedConfig
  | ActiveProjectsConfig
  | UnbilledWorkConfig
  | QuickActionsConfig
  | TaskSummaryConfig
  | ClientListConfig
  | TimeTrackerConfig;

// Widget position and size for grid layout
export interface WidgetPosition {
  x: number; // Grid column position (0-11)
  y: number; // Grid row position
  w: number; // Width in grid columns (1-12)
  h: number; // Height in grid rows
  minW?: number; // Minimum width
  minH?: number; // Minimum height
  maxW?: number; // Maximum width
  maxH?: number; // Maximum height
}

// Main widget interface
export interface DashboardWidget {
  id: string;
  type: WidgetType;
  position: WidgetPosition;
  config: WidgetConfig;
  visible: boolean;
}

// Layout preset types
export type LayoutPresetType =
  | "action-oriented"
  | "financial-focus"
  | "project-manager"
  | "minimalist"
  | "custom";

// Dashboard layout definition
export interface DashboardLayout {
  id: string;
  name: string;
  presetType: LayoutPresetType;
  widgets: DashboardWidget[];
  isDefault: boolean;
  lastModified: string;
  userId?: string; // Future: per-user layouts
}

// Activity feed event interface
export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  timestamp: string;
  title: string;
  description: string;
  metadata?: {
    invoiceId?: string;
    invoiceNumber?: string;
    projectId?: string;
    projectName?: string;
    clientId?: string;
    clientName?: string;
    amount?: number;
    currency?: string;
    hours?: number;
    taskId?: string;
    taskTitle?: string;
    userId?: string;
    userName?: string;
  };
}

// Widget metadata for library display
export interface WidgetMetadata {
  type: WidgetType;
  name: string;
  description: string;
  icon: string; // SVG path or icon name
  category: "metrics" | "charts" | "tables" | "actions" | "feeds";
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  maxSize?: { w: number; h: number };
  defaultConfig: WidgetConfig;
}

// Responsive breakpoints
export interface ResponsiveBreakpoint {
  breakpoint: string; // 'lg', 'md', 'sm', 'xs'
  cols: number;
  layouts: Array<{ i: string; x: number; y: number; w: number; h: number }>;
}

// Edit mode state
export interface EditModeState {
  enabled: boolean;
  selectedWidgetId: string | null;
  showWidgetLibrary: boolean;
  showWidgetConfig: boolean;
}

// Widget library filters
export interface WidgetLibraryFilters {
  category?: "metrics" | "charts" | "tables" | "actions" | "feeds";
  searchQuery?: string;
}
