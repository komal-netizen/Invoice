// Client & custom fields
export const CLIENT_TAGS = ["VIP", "Regular", "Retainer", "One-time"] as const;
export type ClientTag = (typeof CLIENT_TAGS)[number];

export const PAYMENT_TERMS_OPTIONS = [
  "Net 15",
  "Net 30",
  "Net 60",
  "Due on Receipt",
  "Custom",
] as const;
export type PaymentTerm = (typeof PAYMENT_TERMS_OPTIONS)[number];

export const CURRENCIES = ["USD", "EUR", "GBP", "INR", "CAD", "AUD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CUSTOM_FIELD_TYPES = [
  "text",
  "longtext",
  "number",
  "email",
  "phone",
  "url",
  "date",
  "dropdown",
  "checkbox",
  "currency",
] as const;
export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];

export interface CustomFieldDefinition {
  id: string;
  name: string;
  type: CustomFieldType;
  required: boolean;
  defaultValue?: string;
  options?: string[]; // for dropdown
}

export interface CustomFieldValue {
  fieldId: string;
  value: string | number | boolean;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export type ClientStatus = "active" | "archived";

export interface ClientNote {
  id: string;
  clientId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientDashboardBlockData {
  id: string;
  clientId: string;
  blockId: string;
  data: any; // JSON data specific to block type (tables, text sections, etc.)
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  /** Short unique reference code for this client, e.g. C-001 */
  code?: string;
  companyName: string;
  contactName: string;
  email: string;
  logo?: string;                 // Client logo as base64 data URL
  tags: ClientTag[];
  status?: ClientStatus; // default "active"
  website?: string;
  phone?: string;
  address?: Address;
  paymentTerms?: PaymentTerm;
  currency?: Currency;
  taxId?: string;
  customFieldValues: CustomFieldValue[];
  notes?: ClientNote[];          // Client notes for internal documentation
  // Client Board fields
  boardToken?: string;           // Unique token for shareable URL
  boardEnabled?: boolean;         // Toggle board visibility
  boardWelcomeMessage?: string;   // Custom welcome message
  boardTokenCreatedAt?: string;   // When token was generated
  createdAt: string;
  updatedAt: string;
}

// Client Resources (for client board portal)
export interface ClientResource {
  id: string;
  clientId: string;
  type: 'file' | 'link' | 'note' | 'image' | 'video';
  title: string;
  description?: string;
  url?: string;              // For files and links
  content?: string;          // For notes (markdown)
  fileSize?: number;         // For files
  mimeType?: string;         // For files
  isPinned?: boolean;        // Pin to top
  order: number;
  // Gallery-specific fields
  thumbnailUrl?: string;     // For gallery images/videos
  category?: string;         // e.g., "Logo Design", "Web Design", "Branding"
  projectId?: string;        // Link to project
  createdAt: string;
  updatedAt: string;
}

// Project Gallery Item (for showcasing work)
export interface ProjectGalleryItem {
  id: string;
  clientId: string;
  projectId?: string;
  title: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  category?: string;
  order: number;
  createdAt: string;
}

// Onboarding Form System
export const FORM_FIELD_TYPES = [
  "text",
  "textarea",
  "multiple-choice",
  "checkboxes",
  "dropdown",
  "email",
  "phone",
  "date",
  "file-upload",
] as const;
export type FormFieldType = (typeof FORM_FIELD_TYPES)[number];

export const FORM_SUBMISSION_STATUS = ["pending", "reviewed", "accepted", "rejected"] as const;
export type FormSubmissionStatus = (typeof FORM_SUBMISSION_STATUS)[number];

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: string[];          // For multiple-choice, checkboxes, dropdown
  order: number;
}

export interface OnboardingForm {
  id: string;
  name: string;                // e.g., "Web Design Onboarding"
  description?: string;
  fields: FormField[];
  isTemplate: boolean;         // true for built-in templates
  createdAt: string;
  updatedAt: string;
  // Shareable link
  token?: string;              // Unique token for public access
  tokenEnabled?: boolean;      // Toggle form availability
  tokenCreatedAt?: string;
}

export interface FormSubmission {
  id: string;
  formId: string;
  formName: string;            // Snapshot of form name
  responses: FormResponse[];   // Submitted values
  status: FormSubmissionStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;         // Team member ID
  reviewNotes?: string;
  // Client info from submission
  submitterEmail?: string;
  submitterName?: string;
  // If accepted, link to created entities
  createdClientId?: string;
  createdProjectId?: string;
}

export interface FormResponse {
  fieldId: string;
  fieldLabel: string;          // Snapshot of label
  fieldType: FormFieldType;
  value: string | string[] | boolean;  // Single value or array for checkboxes
  fileUrl?: string;            // For file uploads
}

// Projects
export type ProjectStatus = "active" | "completed" | "on_hold" | "planning";

export interface Project {
  id: string;
  clientId: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  totalValue?: number;
  invoicedAmount?: number;
  paidAmount?: number;
  startDate?: string;
  dueDate?: string;
  /** Default hourly billing rate for this project (used by time tracking) */
  defaultBillingRate?: number;
  /** Currency for project billing (falls back to client/invoice currency) */
  billingCurrency?: Currency;
  /** Team member ID assigned as project manager */
  projectManagerId?: string;
  /** Team member ID assigned as lead developer */
  leadDeveloperId?: string;
  /** Team member IDs assigned to this project (can work on tasks) */
  memberIds?: string[];
  createdAt: string;
  updatedAt: string;
}

// Team member roles (legacy enum; prefer settings.teamRoles + roleId for customization)
export const TEAM_ROLES = [
  "project_manager",
  "lead_developer",
  "developer",
  "designer",
  "other",
] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

/** User-defined team role (id, name, optional color) - like ServiceCategory */
export interface TeamRoleDefinition {
  id: string;
  name: string;
  color?: string;
}

// Team members (for time tracking and project/task assignment)
export interface TeamMember {
  id: string;
  name: string;
  email?: string;
  /** Role id from settings.teamRoles (preferred). Used when team roles are customizable. */
  roleId?: string;
  /** Legacy: fixed role enum. Map to roleId for display when present. */
  role?: TeamRole;
  /** Default hourly rate for this team member (overridden by project/default) */
  defaultHourlyRate?: number;
  phone?: string;
}

// Time entries (time tracking)
export interface TimeEntry {
  id: string;
  projectId: string;
  taskId?: string;
  teamMemberId: string;
  date: string; // YYYY-MM-DD
  hours: number;
  notes?: string;
  billable: boolean;
  /** Billing rate per hour (from project default, team member default, or override) */
  billingRate: number;
  /** Amount = hours * billingRate (for billable entries) */
  amount: number;
  currency: Currency;
  /** When added to an invoice */
  invoiceId?: string;
  createdAt: string;
  updatedAt: string;
}

// Project tasks (for project management)
export const TASK_STATUSES = ["todo", "in_progress", "review", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

// Approval workflow for creative businesses
export const APPROVAL_STATUSES = ["not_required", "pending_review", "changes_requested", "approved"] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  /** Team member ID this task is assigned to */
  assigneeId?: string;
  /** Display name (resolved from assigneeId or legacy free text) */
  assignee?: string;
  estimatedHours?: number;
  order: number; // for Kanban column ordering
  createdAt: string;
  updatedAt: string;
}

// Board-based task management (Sprint 1)
export interface Board {
  id: string;
  name: string;
  description?: string;
  /** CSS color or image URL for board background */
  background?: string;
  projectId?: string;
  isSaved?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BoardList {
  id: string;
  boardId: string;
  name: string;
  order: number;
  /** WIP limit (optional); 0 or undefined = no limit */
  wipLimit?: number;
  createdAt: string;
  updatedAt: string;
}

/** Checklist item on a task */
export interface TaskChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  /** Assignee (team member id) */
  assigneeId?: string;
  /** Due date YYYY-MM-DD or ISO */
  dueDate?: string;
  order?: number;
}

/** Board-level label (name + color, shared across tasks on board) */
export interface BoardLabel {
  id: string;
  boardId: string;
  name: string;
  color: string; // hex e.g. #3B82F6
}

/** Comment on a task */
export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  body: string; // plain or simple HTML
  createdAt: string;
  updatedAt: string;
}

/** Attachment on a task (client: store as dataUrl/base64 or blob URL; 10MB limit) */
export interface TaskAttachment {
  id: string;
  taskId: string;
  name: string;
  mimeType: string;
  size: number;
  /** Data URL (data:...) or blob URL for preview */
  url: string;
  createdAt: string;
}

/** Activity log entry for a task */
export type TaskActivityType =
  | "created"
  | "moved"
  | "updated"
  | "comment"
  | "assignee"
  | "due_date"
  | "priority"
  | "archived"
  | "time_tracked"
  | "checklist_completed"
  | "invoice_generated";

export interface TaskActivity {
  id: string;
  type: TaskActivityType;
  at: string; // ISO
  text: string;
  /** For comment: commentId, authorId. For moved: fromListId, toListId, listName */
  metadata?: Record<string, unknown>;
}

/** Max attachment size 10MB */
export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;
/** Comment edit window (ms) */
export const COMMENT_EDIT_WINDOW_MS = 5 * 60 * 1000;

export interface BoardTask {
  id: string;
  listId: string;
  boardId: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string;
  assigneeId?: string;
  assignee?: string;
  /** Multiple assignees (Sprint 2); primary is assigneeId */
  assigneeIds?: string[];
  estimatedHours?: number;
  order: number;
  /** When set, task is archived */
  archivedAt?: string;
  /** When set, task is completed (show line-through on card) */
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  /** Client/project for display and filtering; project can auto-fill client */
  clientId?: string;
  projectId?: string;
  /** Label ids (board-level labels) */
  labelIds?: string[];
  /** Legacy: label names when no board labels; prefer labelIds */
  labels?: string[];
  checklist?: TaskChecklistItem[];
  commentCount?: number;
  attachmentCount?: number;
  /** Due date with optional time (ISO string) */
  dueDateTime?: string;
  billable?: boolean;
  /** Product/service id for billing (rate from Product.defaultPrice) */
  serviceId?: string;
  /** When set, task is linked to an invoice */
  invoiceId?: string;
  /** Activity log (moved, updated, etc.) */
  activities?: TaskActivity[];
  /** Parent task id when this is a subtask */
  parentTaskId?: string;
  /** Approval workflow status (for creative businesses) */
  approvalStatus?: ApprovalStatus;
  /** Review notes from client or team lead */
  reviewNotes?: string;
  /** URL to design file or mockup (for creative projects) */
  designFileUrl?: string;
}

/** Board template for creating boards with predefined lists */
export interface BoardTemplate {
  id: string;
  name: string;
  description?: string;
  /** false for built-in templates, true for user-created */
  isCustom: boolean;
  /** Ordered list of column/list names */
  listNames: string[];
  createdAt: string;
  updatedAt: string;
}

/** List template types for "Create from Project" (legacy, kept for backward compatibility) */
export const BOARD_LIST_TEMPLATES = ["design", "dev", "content"] as const;
export type BoardListTemplateType = (typeof BOARD_LIST_TEMPLATES)[number];

/** Default list names per template */
export const LIST_TEMPLATE_NAMES: Record<BoardListTemplateType, string[]> = {
  design: ["Brief", "Concept", "Design", "Review", "Approved"],
  dev: ["Backlog", "To Do", "In Progress", "QA", "Done"],
  content: ["Ideas", "Draft", "Review", "Scheduled", "Published"],
};

// Invoices
export const INVOICE_STATUSES = [
  "draft",
  "pending",
  "paid",
  "overdue",
  "outstanding",
  "scheduled",
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const RECURRENCE_FREQUENCIES = [
  "weekly",
  "monthly",
  "quarterly",
  "annually",
  "custom",
] as const;
export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];

export interface RecurringConfig {
  frequency: RecurrenceFrequency;
  startDate: string;
  endDate?: string;
  noEndDate: boolean;
  autoSend: boolean;
}

export interface LineItem {
  id: string;
  items: string; // item name
  itemDescription?: string; // optional description under item name
  quantity: number;
  unit: string;
  price: number;
  total: number;
  productRef?: string;
}

// Services (catalog for invoice line items — service industry)
export const SERVICE_PRICING_TYPES = [
  "flat",
  "per hour",
  "per day",
  "per item",
  "per word",
  "per week",
  "per month",
  "per quarter",
  "per year",
] as const;
export type ServicePricingType = (typeof SERVICE_PRICING_TYPES)[number];

/** Maps pricing type to default unit for invoice line items */
export const SERVICE_PRICING_TO_UNIT: Record<ServicePricingType, string> = {
  flat: "each",
  "per hour": "hours",
  "per day": "days",
  "per item": "pieces",
  "per word": "words",
  "per week": "weeks",
  "per month": "months",
  "per quarter": "quarters",
  "per year": "years",
};

export interface Product {
  id: string;
  name: string;
  description?: string;
  defaultPrice: number;
  /** How this service is priced; determines default unit on invoice */
  pricingType: ServicePricingType;
  /** Category id from settings.serviceCategories */
  categoryId?: string;
  /** @deprecated Use categoryId. Kept for backward compat. */
  category?: string;
  customFieldValues: CustomFieldValue[];
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  projectId?: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  lineItems: LineItem[];
  subtotal: number;
  taxRate: number;
  taxName: string;
  taxAmount: number;
  discountType: "none" | "percent" | "fixed";
  discountValue: number;
  discountAmount: number;
  total: number;
  currency: Currency;
  paymentMethods: string[];
  paymentDetails?: string;
  lateFeeEnabled: boolean;
  lateFeePercent?: number;
  lateFeePolicy?: string;
  notes?: string;
  referenceNumber?: string;
  // Display toggles
  showLogo: boolean;
  showHeaderImage: boolean;
  headerImageUrl?: string;
  applyTax: boolean;
  displayTaxId: boolean;
  shippingAddress: boolean;
  showReferenceNumber: boolean;
  /** Show Units column in line items (customization toggle). Default true. */
  showUnits?: boolean;
  // Design freedom
  backgroundColor?: string;
  backgroundImageUrl?: string;
  headingFontSize?: number; // px, default e.g. 24
  headingAlignment?: "left" | "center" | "right"; // invoice title placement
  headingColor?: string; // hex, for non-blank template title
  headingBackgroundColor?: string; // hex, for title box background
  logoUrl?: string; // override per invoice
  sectionOrder?: string[]; // e.g. ["header", "billTo", "lineItems", "totals", "payment", "notes"]
  template?: InvoiceTemplate; // layout (logo position etc.); defaults to settings.template when creating
  recurringConfig?: RecurringConfig;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  paidAt?: string;
  lastReminderAt?: string; // ISO date of last payment reminder sent
  /** Token for public view link and activity tracking (set when sending from platform) */
  viewToken?: string;
  /** Terms and conditions (default from settings, editable per invoice) */
  termsAndConditions?: string;
  /** Header text (default from settings, editable per invoice) */
  headerText?: string;
  /** Footer text (default from settings, editable per invoice) */
  footerText?: string;
  /** For template "blank": ordered blocks to render (add/reorder/remove in Design tab) */
  customBlocks?: CustomBlock[];
}

/** Activity event for invoice timeline (stored server-side per viewToken) */
export interface InvoiceActivity {
  type: "sent" | "opened" | "reopened" | "paid";
  at: string; // ISO
  metadata?: Record<string, string>;
}

// Settings & invoice templates
export const LOGO_POSITIONS = ["left", "right", "topCenter"] as const;
export type LogoPosition = (typeof LOGO_POSITIONS)[number];

export const INVOICE_TEMPLATES = [
  "modern-minimal",
  "classic-professional",
  "creative-bold",
  "tech-startup",
  "elegant",
  "corporate",
  "landscape",
  "blank",
] as const;
export type InvoiceTemplate = (typeof INVOICE_TEMPLATES)[number];

/** Logo position for each template: left, right, or top center */
export const TEMPLATE_LOGO_POSITION: Record<InvoiceTemplate, LogoPosition> = {
  "modern-minimal": "left",
  "classic-professional": "right",
  "creative-bold": "topCenter",
  "tech-startup": "left",
  elegant: "right",
  corporate: "topCenter",
  landscape: "left",
  blank: "left",
};

/** Block types for the blank/custom invoice template */
export const CUSTOM_BLOCK_TYPES = [
  "heading",
  "from",
  "billTo",
  "shipTo",
  "lineItems",
  "totals",
  "paymentTerms",
  "paymentDetails",
  "notes",
  "terms",
  "customText",
  "divider",
] as const;
export type CustomBlockType = (typeof CUSTOM_BLOCK_TYPES)[number];

/** A single block in a blank/custom invoice layout */
export interface CustomBlock {
  id: string;
  type: CustomBlockType;
  order: number;
  /** Block-specific: headingFontSize (number), headingText (string), content (string for customText/paymentTerms), etc. */
  settings?: Record<string, unknown>;
}

/** User-saved custom template (blank layout with blocks) */
export interface CustomTemplate {
  id: string;
  name: string;
  blocks: CustomBlock[];
}

export interface BusinessInfo {
  name: string;
  address: Address;
  email: string;
  phone: string;
  website: string;
  taxId: string;
  logoUrl?: string;
}

export interface InvoiceDefaults {
  /** e.g. "INV-{YYYY}-{000}". Use {YYYY} for year, {000} for zero-padded number. */
  numberFormat: string;
  prefix: string;
  nextNumber: number;
  defaultPaymentTerms: PaymentTerm;
  defaultLateFeePercent: number;
  defaultCurrency: Currency;
  defaultTaxRate: number;
  defaultTaxName: string;
  displayTaxId: boolean;
  /** Default terms and conditions applied to new invoices */
  defaultTermsAndConditions: string;
}

/** Bank account details shown on invoices when Bank Transfer is enabled */
export interface BankAccount {
  id: string;
  accountName: string;
  bankName: string;
  accountNumber?: string;
  sortCode?: string;
  iban?: string;
  swift?: string;
  routingNumber?: string;
  otherDetails?: string;
}

/** User-defined structure for client codes. e.g. "C-{000}" or "CL-{YYYY}-{000}". */
export interface ClientCodeSettings {
  /** Format string: {000} = number, {YYYY} = year */
  format: string;
  nextNumber: number;
}

export interface ServiceCategory {
  id: string;
  name: string;
  color: string;
}

export interface EmailSettings {
  invoiceSubject: string;
  invoiceBody: string;
  reminderSubject: string;
  reminderBody: string;
  thankYouSubject: string;
  thankYouBody: string;
  signature: string;
}

export interface ReminderSettings {
  firstReminderDaysAfterDue: number; // e.g. 3 = send first reminder 3 days after due
  reminderRepeatDays: number; // e.g. 7 = send again every 7 days
  autoRemindersEnabled: boolean;
}

export interface TimeTrackingSettings {
  defaultHourlyRate: number;
  defaultCurrency: Currency;
}

export interface Settings {
  template: InvoiceTemplate;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  headerText: string;
  footerText: string;
  business: BusinessInfo;
  invoiceDefaults: InvoiceDefaults;
  email: EmailSettings;
  reminders: ReminderSettings;
  paymentMethods: { id: string; name: string; details?: string; enabled: boolean }[];
  /** Bank accounts to display on invoices when Bank Transfer is enabled */
  bankAccounts: BankAccount[];
  /** Managed in User profile → Client tags. Used for client tag options. */
  clientTags: string[];
  /** Service categories: created when user adds a category to a service; managed in Services → Categories. */
  serviceCategories: ServiceCategory[];
  /** Client code structure; managed in User profile. */
  clientCode: ClientCodeSettings;
  /** Invoice list columns (dashboard): order and visibility. Ids: issuedOn, dueDate, invoiceNumber, project, client, total, paid, status, actions */
  invoiceListColumns: string[];
  /** Client list fields: which fields to show in the client list. Ids: code, company, contact, email, tags, invoices, outstanding */
  clientListFields?: string[];
  /** User-saved custom invoice templates (blank layout + blocks) */
  customTemplates: CustomTemplate[];
  /** Time tracking: default rate and currency */
  timeTracking: TimeTrackingSettings;
  /** Team members for time tracking */
  teamMembers: TeamMember[];
  /** Customizable team roles (name + color). Managed in Account → Team roles. */
  teamRoles: TeamRoleDefinition[];
  /** Optional labels for project lead slots (e.g. "Account lead", "Creative lead"). */
  projectLeadLabels?: { projectManager?: string; leadDeveloper?: string };
  /** Optional display names for nav/page (e.g. "Studio", "My work"). */
  /** Client dashboard template configuration */
  clientDashboardTemplate?: import("./client-dashboard-types").ClientDashboardTemplate;
  teamSectionLabel?: string;
  myTasksLabel?: string;
  /** Webhook endpoints for external integrations */
  webhookEndpoints?: WebhookEndpoint[];
  /** API keys for API access */
  apiKeys?: ApiKey[];
  /** Slack integration settings */
  slackIntegration?: SlackIntegration;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: ('invoice.created' | 'invoice.sent' | 'invoice.paid' | 'invoice.overdue' | 'client.created' | 'project.completed')[];
  secret: string;
  enabled: boolean;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  lastUsed?: string;
  createdAt: string;
}

export interface SlackIntegration {
  workspaceId: string;
  workspaceName: string;
  teamId: string;
  botToken: string;
  botUserId: string;
  accessToken: string;
  scope: string;
  connectedAt: string;
  connectedBy?: string;
  enabled: boolean;
  channelId?: string;
}

export const INVOICE_LIST_COLUMN_IDS = [
  "issuedOn",
  "dueDate",
  "invoiceNumber",
  "project",
  "client",
  "total",
  "paid",
  "status",
  "actions",
] as const;
export type InvoiceListColumnId = (typeof INVOICE_LIST_COLUMN_IDS)[number];

export const INVOICE_LIST_COLUMN_LABELS: Record<string, string> = {
  issuedOn: "Issued on",
  dueDate: "Due date",
  invoiceNumber: "Invoice number",
  project: "Project",
  client: "Client",
  total: "Total",
  paid: "Paid",
  status: "Status",
  actions: "Actions",
};
