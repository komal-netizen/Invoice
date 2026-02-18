import type { Settings, BusinessInfo, InvoiceDefaults, EmailSettings, ReminderSettings, TimeTrackingSettings, ClientCodeSettings, ServiceCategory, CustomBlock, TeamRoleDefinition } from "./types";

export const defaultAddress = {
  street: "",
  city: "",
  state: "",
  zip: "",
  country: "",
};

export const defaultBusiness: BusinessInfo = {
  name: "",
  address: { ...defaultAddress },
  email: "",
  phone: "",
  website: "",
  taxId: "",
  logoUrl: undefined,
};

export const defaultInvoiceDefaults: InvoiceDefaults = {
  numberFormat: "INV-{YYYY}-{000}",
  prefix: "INV-",
  nextNumber: 1,
  defaultPaymentTerms: "Net 30",
  defaultLateFeePercent: 5,
  defaultCurrency: "USD",
  defaultTaxRate: 0,
  defaultTaxName: "Tax",
  displayTaxId: true,
  defaultTermsAndConditions: "",
};

export const defaultEmailSettings: EmailSettings = {
  invoiceSubject: "Invoice #{invoiceNumber} from {businessName}",
  invoiceBody: "Please find your invoice attached. Thank you for your business.",
  reminderSubject: "Reminder: Invoice #{invoiceNumber} is overdue",
  reminderBody: "This is a friendly reminder that the following invoice is overdue.",
  thankYouSubject: "Thank you for your payment",
  thankYouBody: "We have received your payment. Thank you!",
  signature: "",
};

export const defaultReminderSettings: ReminderSettings = {
  firstReminderDaysAfterDue: 3,
  reminderRepeatDays: 7,
  autoRemindersEnabled: true,
};

export const defaultTimeTrackingSettings: TimeTrackingSettings = {
  defaultHourlyRate: 125,
  defaultCurrency: "USD",
};

export const defaultSettings: Settings = {
  template: "modern-minimal",
  primaryColor: "#0f766e",
  secondaryColor: "#0d9488",
  fontFamily: "system-ui",
  headerText: "",
  footerText: "",
  business: defaultBusiness,
  invoiceDefaults: defaultInvoiceDefaults,
  email: defaultEmailSettings,
  reminders: defaultReminderSettings,
  clientTags: ["VIP", "Regular", "Retainer", "One-time"],
  serviceCategories: [
    { id: "cat-design", name: "Design", color: "#6366f1" },
    { id: "cat-development", name: "Development", color: "#22c55e" },
    { id: "cat-strategy", name: "Strategy", color: "#f59e0b" },
    { id: "cat-content", name: "Content", color: "#ec4899" },
    { id: "cat-copywriting", name: "Copywriting", color: "#8b5cf6" },
    { id: "cat-consulting", name: "Consulting", color: "#0ea5e9" },
    { id: "cat-other", name: "Other", color: "#64748b" },
  ] as ServiceCategory[],
  clientCode: { format: "C-{000}", nextNumber: 1 } as ClientCodeSettings,
  invoiceListColumns: ["issuedOn", "dueDate", "invoiceNumber", "project", "client", "total", "paid", "status", "actions"],
  clientListFields: ["company", "contact", "email", "status"],
  paymentMethods: [
    { id: "bank", name: "Bank Transfer", details: "", enabled: true },
    { id: "paypal", name: "PayPal", details: "", enabled: false },
    { id: "wise", name: "Wise", details: "", enabled: false },
    { id: "stripe", name: "Stripe", details: "", enabled: false },
    { id: "check", name: "Check", enabled: false },
    { id: "cash", name: "Cash", enabled: false },
    { id: "other", name: "Other", details: "", enabled: false },
  ],
  bankAccounts: [],
  customTemplates: [],
  timeTracking: defaultTimeTrackingSettings,
  teamMembers: [],
  teamRoles: [
    { id: "role-project_manager", name: "Project Manager", color: "#8b5cf6" },
    { id: "role-lead_developer", name: "Lead Developer", color: "#f59e0b" },
    { id: "role-developer", name: "Developer", color: "#22c55e" },
    { id: "role-designer", name: "Designer", color: "#ec4899" },
    { id: "role-other", name: "Other", color: "#64748b" },
  ] as TeamRoleDefinition[],
};

/** Default block order for new blank-template invoices. Ids are placeholders; real ids set when creating. */
export function getDefaultBlankBlocks(): CustomBlock[] {
  return [
    { id: "b-heading", type: "heading", order: 0, settings: { headingFontSize: 28, headingText: "INVOICE" } },
    { id: "b-from", type: "from", order: 1 },
    { id: "b-billTo", type: "billTo", order: 2 },
    { id: "b-lineItems", type: "lineItems", order: 3 },
    { id: "b-totals", type: "totals", order: 4 },
    { id: "b-paymentDetails", type: "paymentDetails", order: 5 },
    { id: "b-paymentTerms", type: "paymentTerms", order: 6, settings: { content: "Payment is due within 30 days." } },
    { id: "b-notes", type: "notes", order: 7 },
    { id: "b-terms", type: "terms", order: 8 },
  ];
}
