import type { Client, Project, TimeEntry, TeamMember, Invoice, Product, Board, BoardList, BoardTask } from "./types";

const now = () => new Date().toISOString();

// Premade services for creative agencies (categoryIds match defaultServiceCategories in defaults.ts)
export const seedProducts: Product[] = [
  { id: "seed-svc-brand", name: "Brand identity", description: "Logo, guidelines, visual system", defaultPrice: 3500, pricingType: "flat", categoryId: "cat-design", customFieldValues: [], createdAt: now(), updatedAt: now() },
  { id: "seed-svc-web-design", name: "Website design", description: "UI/UX design and mockups", defaultPrice: 125, pricingType: "per hour", categoryId: "cat-design", customFieldValues: [], createdAt: now(), updatedAt: now() },
  { id: "seed-svc-dev", name: "Web development", description: "Front-end and back-end development", defaultPrice: 150, pricingType: "per hour", categoryId: "cat-development", customFieldValues: [], createdAt: now(), updatedAt: now() },
  { id: "seed-svc-strategy", name: "Strategy & discovery", description: "Workshops and strategy sessions", defaultPrice: 2500, pricingType: "flat", categoryId: "cat-strategy", customFieldValues: [], createdAt: now(), updatedAt: now() },
  { id: "seed-svc-content", name: "Content writing", description: "Blog posts, web copy", defaultPrice: 0.25, pricingType: "per word", categoryId: "cat-content", customFieldValues: [], createdAt: now(), updatedAt: now() },
  { id: "seed-svc-copy", name: "Copywriting", description: "Ad copy, landing pages, emails", defaultPrice: 150, pricingType: "per hour", categoryId: "cat-copywriting", customFieldValues: [], createdAt: now(), updatedAt: now() },
  { id: "seed-svc-social", name: "Social media management", description: "Monthly content and posting", defaultPrice: 1200, pricingType: "per month", categoryId: "cat-content", customFieldValues: [], createdAt: now(), updatedAt: now() },
  { id: "seed-svc-retainer", name: "Creative retainer", description: "Dedicated hours per month", defaultPrice: 125, pricingType: "per hour", categoryId: "cat-consulting", customFieldValues: [], createdAt: now(), updatedAt: now() },
];

// Fixed IDs so invoices can reference clients and projects
export const SEED_CLIENT_IDS = {
  acme: "seed-client-acme",
  globex: "seed-client-globex",
  initech: "seed-client-initech",
  umbrellacorp: "seed-client-umbrellacorp",
} as const;

export const SEED_PROJECT_IDS = {
  website: "seed-project-website",
  branding: "seed-project-branding",
  app: "seed-project-app",
} as const;

export const SEED_TEAM_MEMBER_IDS = {
  sarah: "seed-team-sarah",
  mike: "seed-team-mike",
} as const;

export const seedTeamMembers: TeamMember[] = [
  { id: SEED_TEAM_MEMBER_IDS.sarah, name: "Sarah Chen", email: "sarah@company.com", role: "project_manager", defaultHourlyRate: 125 },
  { id: SEED_TEAM_MEMBER_IDS.mike, name: "Mike Johnson", email: "mike@company.com", role: "lead_developer", defaultHourlyRate: 150 },
];

export const SEED_INVOICE_IDS = {
  inv1: "seed-inv-001",
  inv2: "seed-inv-002",
  inv3: "seed-inv-003",
  inv4: "seed-inv-004",
} as const;

export const seedClients: Client[] = [
  {
    id: SEED_CLIENT_IDS.acme,
    code: "C-001",
    companyName: "Acme Corp",
    contactName: "Jane Smith",
    email: "jane.smith@acme.com",
    tags: ["VIP", "Retainer"],
    status: "active",
    website: "https://acme.example.com",
    phone: "+1 (555) 100-2000",
    address: { street: "123 Main St", city: "New York", state: "NY", zip: "10001", country: "USA" },
    paymentTerms: "Net 30",
    currency: "USD",
    taxId: "12-3456789",
    customFieldValues: [],
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: SEED_CLIENT_IDS.globex,
    code: "C-002",
    status: "active",
    companyName: "Globex Industries",
    contactName: "Homer Simpson",
    email: "homer@globex.com",
    tags: ["Regular"],
    website: "https://globex.com",
    phone: "+1 (555) 200-3000",
    address: { street: "456 Oak Ave", city: "Springfield", state: "IL", zip: "62701", country: "USA" },
    paymentTerms: "Net 15",
    currency: "USD",
    customFieldValues: [],
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: SEED_CLIENT_IDS.initech,
    code: "C-003",
    status: "active",
    companyName: "Initech",
    contactName: "Bill Lumbergh",
    email: "bill@initech.com",
    tags: ["Retainer", "One-time"],
    paymentTerms: "Net 60",
    currency: "USD",
    customFieldValues: [],
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: SEED_CLIENT_IDS.umbrellacorp,
    code: "C-004",
    status: "active",
    companyName: "Umbrella Corp",
    contactName: "Albert Wesker",
    email: "wesker@umbrellacorp.com",
    tags: ["VIP"],
    website: "https://umbrellacorp.com",
    paymentTerms: "Due on Receipt",
    currency: "EUR",
    customFieldValues: [],
    createdAt: now(),
    updatedAt: now(),
  },
];

// Board-based task management (Sprint 1)
export const SEED_BOARD_IDS = {
  websiteBoard: "seed-board-website",
} as const;

export const SEED_BOARD_LIST_IDS = {
  backlog: "seed-list-backlog",
  todo: "seed-list-todo",
  inProgress: "seed-list-inprogress",
  qa: "seed-list-qa",
  done: "seed-list-done",
} as const;

export const SEED_BOARD_TASK_IDS = {
  bt1: "seed-bt-1",
  bt2: "seed-bt-2",
  bt3: "seed-bt-3",
  bt4: "seed-bt-4",
} as const;

export const seedBoards: Board[] = [
  {
    id: SEED_BOARD_IDS.websiteBoard,
    name: "Website Redesign",
    description: "Tasks for website redesign project",
    projectId: SEED_PROJECT_IDS.website,
    isSaved: true,
    createdAt: now(),
    updatedAt: now(),
  },
];

export const seedBoardLists: BoardList[] = [
  { id: SEED_BOARD_LIST_IDS.backlog, boardId: SEED_BOARD_IDS.websiteBoard, name: "Backlog", order: 0, createdAt: now(), updatedAt: now() },
  { id: SEED_BOARD_LIST_IDS.todo, boardId: SEED_BOARD_IDS.websiteBoard, name: "To Do", order: 1, createdAt: now(), updatedAt: now() },
  { id: SEED_BOARD_LIST_IDS.inProgress, boardId: SEED_BOARD_IDS.websiteBoard, name: "In Progress", order: 2, wipLimit: 3, createdAt: now(), updatedAt: now() },
  { id: SEED_BOARD_LIST_IDS.qa, boardId: SEED_BOARD_IDS.websiteBoard, name: "QA", order: 3, createdAt: now(), updatedAt: now() },
  { id: SEED_BOARD_LIST_IDS.done, boardId: SEED_BOARD_IDS.websiteBoard, name: "Done", order: 4, createdAt: now(), updatedAt: now() },
];

// Website board uses project website -> client acme
export const seedBoardTasks: BoardTask[] = [
  { id: SEED_BOARD_TASK_IDS.bt1, listId: SEED_BOARD_LIST_IDS.done, boardId: SEED_BOARD_IDS.websiteBoard, title: "Discovery & requirements", description: "Initial client kickoff", priority: "high", order: 0, assigneeId: SEED_TEAM_MEMBER_IDS.sarah, assignee: "Sarah Chen", clientId: SEED_CLIENT_IDS.acme, projectId: SEED_PROJECT_IDS.website, labels: ["Discovery"], checklist: [{ id: "c1", text: "Kickoff call", completed: true }, { id: "c2", text: "Requirements doc", completed: true }], commentCount: 0, attachmentCount: 0, billable: true, createdAt: now(), updatedAt: now() },
  { id: SEED_BOARD_TASK_IDS.bt2, listId: SEED_BOARD_LIST_IDS.inProgress, boardId: SEED_BOARD_IDS.websiteBoard, title: "UI Design", description: "High-fidelity mockups", priority: "high", order: 0, assigneeId: SEED_TEAM_MEMBER_IDS.sarah, assignee: "Sarah Chen", clientId: SEED_CLIENT_IDS.acme, projectId: SEED_PROJECT_IDS.website, labels: ["Design"], checklist: [{ id: "c3", text: "Homepage", completed: true }, { id: "c4", text: "Inner pages", completed: false }], commentCount: 2, attachmentCount: 1, billable: true, createdAt: now(), updatedAt: now() },
  { id: SEED_BOARD_TASK_IDS.bt3, listId: SEED_BOARD_LIST_IDS.todo, boardId: SEED_BOARD_IDS.websiteBoard, title: "Development", description: "Frontend implementation", priority: "high", order: 0, assigneeId: SEED_TEAM_MEMBER_IDS.mike, assignee: "Mike Johnson", clientId: SEED_CLIENT_IDS.acme, projectId: SEED_PROJECT_IDS.website, labels: ["Dev"], dueDate: "2026-03-01", estimatedHours: 40, billable: true, createdAt: now(), updatedAt: now() },
  { id: SEED_BOARD_TASK_IDS.bt4, listId: SEED_BOARD_LIST_IDS.backlog, boardId: SEED_BOARD_IDS.websiteBoard, title: "Content migration", priority: "medium", order: 0, clientId: SEED_CLIENT_IDS.acme, projectId: SEED_PROJECT_IDS.website, createdAt: now(), updatedAt: now() },
];

export const SEED_TIME_ENTRY_IDS = {
  te1: "seed-te-1",
  te2: "seed-te-2",
  te3: "seed-te-3",
} as const;

export const seedTimeEntries: TimeEntry[] = [
  { id: SEED_TIME_ENTRY_IDS.te1, projectId: SEED_PROJECT_IDS.website, teamMemberId: SEED_TEAM_MEMBER_IDS.sarah, date: "2026-01-15", hours: 4, notes: "Discovery call and requirements doc", billable: true, billingRate: 125, amount: 500, currency: "USD", createdAt: now(), updatedAt: now() },
  { id: SEED_TIME_ENTRY_IDS.te2, projectId: SEED_PROJECT_IDS.website, teamMemberId: SEED_TEAM_MEMBER_IDS.sarah, date: "2026-02-01", hours: 6, notes: "UI mockups for homepage", billable: true, billingRate: 125, amount: 750, currency: "USD", createdAt: now(), updatedAt: now() },
  { id: SEED_TIME_ENTRY_IDS.te3, projectId: SEED_PROJECT_IDS.app, teamMemberId: SEED_TEAM_MEMBER_IDS.mike, date: "2026-02-10", hours: 3, notes: "Internal planning - non-billable", billable: false, billingRate: 150, amount: 0, currency: "USD", createdAt: now(), updatedAt: now() },
];

export const seedProjects: Project[] = [
  {
    id: SEED_PROJECT_IDS.website,
    clientId: SEED_CLIENT_IDS.acme,
    name: "Website Redesign",
    status: "active",
    totalValue: 15000,
    invoicedAmount: 7500,
    paidAmount: 7500,
    defaultBillingRate: 125,
    billingCurrency: "USD",
    projectManagerId: SEED_TEAM_MEMBER_IDS.sarah,
    leadDeveloperId: SEED_TEAM_MEMBER_IDS.mike,
    memberIds: [SEED_TEAM_MEMBER_IDS.sarah, SEED_TEAM_MEMBER_IDS.mike],
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: SEED_PROJECT_IDS.branding,
    clientId: SEED_CLIENT_IDS.globex,
    name: "Brand Identity",
    status: "completed",
    totalValue: 5000,
    invoicedAmount: 5000,
    paidAmount: 5000,
    defaultBillingRate: 150,
    billingCurrency: "USD",
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: SEED_PROJECT_IDS.app,
    clientId: SEED_CLIENT_IDS.initech,
    name: "Mobile App",
    status: "active",
    totalValue: 25000,
    invoicedAmount: 12500,
    paidAmount: 0,
    defaultBillingRate: 150,
    billingCurrency: "USD",
    projectManagerId: SEED_TEAM_MEMBER_IDS.sarah,
    leadDeveloperId: SEED_TEAM_MEMBER_IDS.mike,
    memberIds: [SEED_TEAM_MEMBER_IDS.mike],
    createdAt: now(),
    updatedAt: now(),
  },
];

const issueDate1 = "2026-01-15";
const dueDate1 = "2026-02-14";
const issueDate2 = "2026-02-01";
const dueDate2 = "2026-02-16";
const issueDate3 = "2026-01-20";
const dueDate3 = "2026-03-21";
const issueDate4 = "2026-02-05";
const dueDate4 = "2026-02-05";

export const seedInvoices: Invoice[] = [
  {
    id: SEED_INVOICE_IDS.inv1,
    invoiceNumber: "INV-2026-001",
    clientId: SEED_CLIENT_IDS.acme,
    projectId: SEED_PROJECT_IDS.website,
    status: "paid",
    issueDate: issueDate1,
    dueDate: dueDate1,
    lineItems: [
      { id: "seed-li-1a", items: "Design & wireframes", quantity: 1, unit: "project", price: 3000, total: 3000 },
      { id: "seed-li-1b", items: "Development", quantity: 40, unit: "hours", price: 112.5, total: 4500 },
    ],
    subtotal: 7500,
    taxRate: 0,
    taxName: "Tax",
    taxAmount: 0,
    discountType: "none",
    discountValue: 0,
    discountAmount: 0,
    total: 7500,
    currency: "USD",
    paymentMethods: ["Bank Transfer", "Check"],
    lateFeeEnabled: false,
    showLogo: true,
    showHeaderImage: false,
    applyTax: false,
    displayTaxId: true,
    shippingAddress: false,
    showReferenceNumber: false,
    createdAt: now(),
    updatedAt: now(),
    paidAt: "2026-02-10T12:00:00.000Z",
  },
  {
    id: SEED_INVOICE_IDS.inv2,
    invoiceNumber: "INV-2026-002",
    clientId: SEED_CLIENT_IDS.globex,
    projectId: SEED_PROJECT_IDS.branding,
    status: "paid",
    issueDate: issueDate2,
    dueDate: dueDate2,
    lineItems: [
      { id: "seed-li-2a", items: "Logo design", quantity: 1, unit: "project", price: 2000, total: 2000 },
      { id: "seed-li-2b", items: "Brand guidelines", quantity: 1, unit: "project", price: 3000, total: 3000 },
    ],
    subtotal: 5000,
    taxRate: 8,
    taxName: "Sales Tax",
    taxAmount: 400,
    discountType: "none",
    discountValue: 0,
    discountAmount: 0,
    total: 5400,
    currency: "USD",
    paymentMethods: ["Bank Transfer"],
    lateFeeEnabled: false,
    showLogo: true,
    showHeaderImage: false,
    applyTax: true,
    displayTaxId: true,
    shippingAddress: false,
    showReferenceNumber: false,
    createdAt: now(),
    updatedAt: now(),
    paidAt: "2026-02-12T09:00:00.000Z",
  },
  {
    id: SEED_INVOICE_IDS.inv3,
    invoiceNumber: "INV-2026-003",
    clientId: SEED_CLIENT_IDS.initech,
    projectId: SEED_PROJECT_IDS.app,
    status: "pending",
    issueDate: issueDate3,
    dueDate: dueDate3,
    lineItems: [
      { id: "seed-li-3a", items: "Phase 1 - Discovery & UX", quantity: 1, unit: "project", price: 5000, total: 5000 },
      { id: "seed-li-3b", items: "Development (sprint 1)", quantity: 80, unit: "hours", price: 93.75, total: 7500 },
    ],
    subtotal: 12500,
    taxRate: 0,
    taxName: "Tax",
    taxAmount: 0,
    discountType: "none",
    discountValue: 0,
    discountAmount: 0,
    total: 12500,
    currency: "USD",
    paymentMethods: ["Bank Transfer", "PayPal"],
    lateFeeEnabled: true,
    lateFeePercent: 5,
    lateFeePolicy: "5% late fee applied after 60 days",
    showLogo: true,
    showHeaderImage: false,
    applyTax: false,
    displayTaxId: true,
    shippingAddress: false,
    showReferenceNumber: false,
    createdAt: now(),
    updatedAt: now(),
    sentAt: "2026-01-22T14:00:00.000Z",
  },
  {
    id: SEED_INVOICE_IDS.inv4,
    invoiceNumber: "INV-2026-004",
    clientId: SEED_CLIENT_IDS.umbrellacorp,
    status: "draft",
    issueDate: issueDate4,
    dueDate: dueDate4,
    lineItems: [
      { id: "seed-li-4a", items: "Consulting", quantity: 20, unit: "hours", price: 150, total: 3000 },
    ],
    subtotal: 3000,
    taxRate: 20,
    taxName: "VAT",
    taxAmount: 600,
    discountType: "percent",
    discountValue: 10,
    discountAmount: 300,
    total: 3300,
    currency: "EUR",
    paymentMethods: ["Bank Transfer", "Stripe"],
    lateFeeEnabled: false,
    showLogo: true,
    showHeaderImage: false,
    applyTax: true,
    displayTaxId: true,
    shippingAddress: false,
    showReferenceNumber: false,
    createdAt: now(),
    updatedAt: now(),
  },
];
