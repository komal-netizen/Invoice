"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Client,
  ClientNote,
  ClientResource,
  ClientDashboardBlockData,
  Project,
  TimeEntry,
  TeamMember,
  TeamRoleDefinition,
  Invoice,
  CustomFieldDefinition,
  Settings,
  LineItem,
  Product,
  ServiceCategory,
  Board,
  BoardList,
  BoardTask,
  OnboardingForm,
  FormSubmission,
  FormSubmissionStatus,
  BoardTemplate,
  BoardListTemplateType,
  TaskActivity,
  BoardLabel,
  TaskComment,
  TaskAttachment,
  TaskChecklistItem,
} from "./types";
import type { DashboardLayout, DashboardWidget, LayoutPresetType } from "./dashboard-types";
import type { ClientDashboardTemplate, ClientDashboardBlock } from "./client-dashboard-types";
import { getDefaultLayout } from "./dashboard-defaults";
import { getDefaultClientDashboardTemplate } from "./client-dashboard-defaults";
import { MAX_ATTACHMENT_SIZE_BYTES } from "./types";
import { LIST_TEMPLATE_NAMES, SERVICE_PRICING_TO_UNIT } from "./types";
import {
  defaultSettings,
  defaultBusiness,
  defaultInvoiceDefaults,
  defaultEmailSettings,
  defaultTimeTrackingSettings,
} from "./defaults";
import { seedClients, seedProjects, seedTimeEntries, seedTeamMembers, seedInvoices, seedProducts, seedBoards, seedBoardLists, seedBoardTasks } from "./seedData";
import { v4 as uuid } from "uuid";
import { addMonths, format } from "date-fns";

const STORAGE_KEY = "invoice-platform-store";

interface AppState {
  clients: Client[];
  clientResources: ClientResource[];
  clientDashboardBlockData: ClientDashboardBlockData[];
  projects: Project[];
  boards: Board[];
  boardLists: BoardList[];
  boardTasks: BoardTask[];
  boardLabels: BoardLabel[];
  boardTemplates: BoardTemplate[];
  taskComments: TaskComment[];
  taskAttachments: TaskAttachment[];
  timeEntries: TimeEntry[];
  invoices: Invoice[];
  products: Product[];
  customFieldDefinitions: CustomFieldDefinition[];
  serviceCustomFieldDefinitions: CustomFieldDefinition[];
  settings: Settings;
  dashboardLayout: DashboardLayout;

  // Clients
  addClient: (client: Omit<Client, "id" | "createdAt" | "updatedAt" | "customFieldValues">) => Client;
  updateClient: (id: string, data: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  getClient: (id: string) => Client | undefined;
  getNextClientCode: () => string;
  
  // Client Board
  generateClientBoardToken: (clientId: string) => string;
  regenerateClientBoardToken: (clientId: string) => string;
  toggleClientBoard: (clientId: string, enabled: boolean) => void;
  updateClientBoardSettings: (clientId: string, data: { welcomeMessage?: string }) => void;
  
  // Client Resources
  addClientResource: (resource: Omit<ClientResource, "id" | "createdAt" | "updatedAt">) => ClientResource;
  updateClientResource: (id: string, data: Partial<ClientResource>) => void;
  deleteClientResource: (id: string) => void;
  getClientResources: (clientId: string) => ClientResource[];
  reorderClientResources: (clientId: string, resourceIds: string[]) => void;

  // Client Notes
  addClientNote: (clientId: string, content: string) => ClientNote;
  updateClientNote: (clientId: string, noteId: string, content: string) => void;
  deleteClientNote: (clientId: string, noteId: string) => void;
  getClientNotes: (clientId: string) => ClientNote[];

  // Client Dashboard Template Management
  getClientDashboardTemplate: () => ClientDashboardTemplate;
  updateClientDashboardTemplate: (template: ClientDashboardTemplate) => void;
  addDashboardBlock: (block: Omit<ClientDashboardBlock, "id" | "createdAt" | "order">) => ClientDashboardBlock;
  removeDashboardBlock: (blockId: string) => void;
  updateDashboardBlock: (blockId: string, updates: Partial<ClientDashboardBlock>) => void;
  reorderDashboardBlocks: (blockIds: string[]) => void;

  // Client Dashboard Block Data
  getBlockData: (clientId: string, blockId: string) => any;
  updateBlockData: (clientId: string, blockId: string, data: any) => void;
  deleteBlockData: (clientId: string, blockId: string) => void;

  // Onboarding Forms
  onboardingForms: OnboardingForm[];
  formSubmissions: FormSubmission[];
  addOnboardingForm: (form: Omit<OnboardingForm, "id" | "createdAt" | "updatedAt">) => OnboardingForm;
  updateOnboardingForm: (id: string, data: Partial<OnboardingForm>) => void;
  deleteOnboardingForm: (id: string) => void;
  getOnboardingForm: (id: string) => OnboardingForm | undefined;
  generateFormToken: (formId: string) => string;
  regenerateFormToken: (formId: string) => string;
  toggleFormAccess: (formId: string, enabled: boolean) => void;
  duplicateOnboardingForm: (formId: string) => OnboardingForm;
  // Form Submissions
  addFormSubmission: (submission: Omit<FormSubmission, "id" | "submittedAt">) => FormSubmission;
  updateFormSubmission: (id: string, data: Partial<FormSubmission>) => void;
  getFormSubmissionsByStatus: (status: FormSubmissionStatus) => FormSubmission[];
  getFormSubmission: (id: string) => FormSubmission | undefined;
  acceptFormSubmission: (submissionId: string, clientId: string, projectId: string, reviewNotes?: string) => void;
  rejectFormSubmission: (submissionId: string, reviewNotes: string) => void;

  // Services
  addProduct: (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => Product;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProduct: (id: string) => Product | undefined;

  // Custom fields (client form)
  addCustomFieldDefinition: (def: Omit<CustomFieldDefinition, "id">) => void;
  updateCustomFieldDefinition: (id: string, data: Partial<CustomFieldDefinition>) => void;
  deleteCustomFieldDefinition: (id: string) => void;

  // Service custom fields
  addServiceCustomFieldDefinition: (def: Omit<CustomFieldDefinition, "id">) => void;
  updateServiceCustomFieldDefinition: (id: string, data: Partial<CustomFieldDefinition>) => void;
  deleteServiceCustomFieldDefinition: (id: string) => void;

  // Projects
  addProject: (project: Omit<Project, "id" | "createdAt" | "updatedAt">) => Project;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getProjectsByClient: (clientId: string) => Project[];

  // Boards
  addBoard: (board: Omit<Board, "id" | "createdAt" | "updatedAt">) => Board;
  updateBoard: (id: string, data: Partial<Board>) => void;
  deleteBoard: (id: string) => void;
  getBoard: (id: string) => Board | undefined;
  getBoardsByProject: (projectId: string) => Board[];
  linkBoardToProject: (boardId: string, projectId: string | null) => void;
  createBoardFromProject: (projectId: string, templateType: BoardListTemplateType) => Board;
  createBoardFromTemplate: (projectId: string, templateId: string) => Board;
  createBoardForClient: (clientId: string, templateId: string, boardName?: string) => Board;
  toggleBoardSaved: (boardId: string) => void;

  // Board templates
  addBoardTemplate: (template: Omit<BoardTemplate, "id" | "createdAt" | "updatedAt">) => BoardTemplate;
  updateBoardTemplate: (id: string, data: Partial<BoardTemplate>) => void;
  deleteBoardTemplate: (id: string) => void;
  getBoardTemplate: (id: string) => BoardTemplate | undefined;

  // Board lists
  addBoardList: (list: Omit<BoardList, "id" | "createdAt" | "updatedAt">) => BoardList;
  updateBoardList: (id: string, data: Partial<BoardList>) => void;
  deleteBoardList: (id: string) => void;
  getBoardLists: (boardId: string) => BoardList[];
  reorderBoardLists: (boardId: string, listIds: string[]) => void;

  // Board tasks
  addBoardTask: (task: Omit<BoardTask, "id" | "createdAt" | "updatedAt">) => BoardTask;
  updateBoardTask: (id: string, data: Partial<BoardTask>) => void;
  deleteBoardTask: (id: string) => void;
  getBoardTasksByList: (listId: string) => BoardTask[];
  getBoardTasksByBoard: (boardId: string) => BoardTask[];
  getBoardTasksForProject: (projectId: string) => BoardTask[];
  reorderBoardTasksInList: (listId: string, taskIds: string[]) => void;
  moveBoardTaskToList: (taskId: string, targetListId: string) => void;
  duplicateBoardTask: (taskId: string) => BoardTask | undefined;
  reorderChecklistItems: (taskId: string, itemIds: string[]) => void;
  appendTaskActivity: (taskId: string, activity: Omit<TaskActivity, "id">) => void;
  getTimeTrackedForTask: (taskId: string) => number;
  getBoardLabels: (boardId: string) => BoardLabel[];
  addBoardLabel: (boardId: string, data: Omit<BoardLabel, "id" | "boardId">) => BoardLabel;
  updateBoardLabel: (id: string, data: Partial<Pick<BoardLabel, "name" | "color">>) => void;
  deleteBoardLabel: (id: string) => void;
  getCommentsByTask: (taskId: string) => TaskComment[];
  addTaskComment: (taskId: string, authorId: string, body: string) => TaskComment;
  updateTaskComment: (id: string, body: string) => void;
  deleteTaskComment: (id: string) => void;
  getAttachmentsByTask: (taskId: string) => TaskAttachment[];
  addTaskAttachment: (taskId: string, file: { name: string; mimeType: string; size: number; url: string }) => TaskAttachment | null;
  deleteTaskAttachment: (id: string) => void;
  getTimeEntriesByTask: (taskId: string) => TimeEntry[];
  getBillableHoursForTask: (taskId: string) => number;
  /** Running timer (taskId, teamMemberId, startTime); not persisted */
  runningTimer: { taskId: string; teamMemberId: string; startTime: string } | null;
  startTimer: (taskId: string, teamMemberId: string) => void;
  stopTimer: () => TimeEntry | null;

  // Time tracking
  addTimeEntry: (entry: Omit<TimeEntry, "id" | "createdAt" | "updatedAt" | "amount">) => TimeEntry;
  updateTimeEntry: (id: string, data: Partial<TimeEntry>) => void;
  deleteTimeEntry: (id: string) => void;
  getTimeEntriesByProject: (projectId: string) => TimeEntry[];
  getTimeEntriesByDateRange: (start: string, end: string) => TimeEntry[];
  /** Total hours per project (from time entries for tasks in that project) */
  getTotalTimeByProject: (projectId: string) => number;
  /** Total hours per client (from time entries for tasks with that client) */
  getTotalTimeByClient: (clientId: string) => number;
  /** Total hours per team member (from time entries) */
  getTotalTimeByTeamMember: (teamMemberId: string) => number;

  /** Billable tasks not yet invoiced (optionally filtered by client/project). Completed = list name contains done/approved/published */
  getUninvoicedBillableTasks: (opts?: { clientId?: string; projectId?: string; boardId?: string }) => BoardTask[];
  /** Create invoice from selected tasks; links tasks to new invoice. Returns new invoice. */
  createInvoiceFromTasks: (opts: { taskIds: string[]; clientId: string; projectId?: string }) => Invoice | null;
  /** Billing summary for client: unbilled amount, invoiced, task counts */
  getBillableSummaryForClient: (clientId: string) => { totalUnbilled: number; totalInvoiced: number; tasksUnbilled: number; tasksInvoiced: number; totalHoursUnbilled: number; byService: { serviceId: string; serviceName: string; hours: number; amount: number }[] };
  /** Billing summary for project */
  getBillableSummaryForProject: (projectId: string) => { totalUnbilled: number; totalInvoiced: number; tasksUnbilled: number; tasksInvoiced: number; totalHoursUnbilled: number; byService: { serviceId: string; serviceName: string; hours: number; amount: number }[] };
  /** Total unbilled amount across all clients (from completed billable tasks) */
  getTotalUnbilledAmount: () => { amount: number; currency: string; taskCount: number };
  /** Count of board tasks that are overdue (due date passed, not archived, not completed) */
  getOverdueTaskCount: () => number;

  // Team members (stored in settings)
  addTeamMember: (member: Omit<TeamMember, "id">) => TeamMember;
  updateTeamMember: (id: string, data: Partial<TeamMember>) => void;
  deleteTeamMember: (id: string) => void;
  getTeamMember: (id: string) => TeamMember | undefined;

  // Team roles (customizable in Account → Team roles)
  addTeamRole: (role: Omit<TeamRoleDefinition, "id">) => TeamRoleDefinition;
  updateTeamRole: (id: string, data: Partial<Omit<TeamRoleDefinition, "id">>) => void;
  deleteTeamRole: (id: string) => void;

  // Invoices
  addInvoice: (invoice: Omit<Invoice, "id" | "createdAt" | "updatedAt">) => Invoice;
  updateInvoice: (id: string, data: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  getInvoice: (id: string) => Invoice | undefined;
  getNextInvoiceNumber: () => string;

  // Settings
  updateSettings: (data: Partial<Settings>) => void;

  // Service categories (dynamic; created when user adds category to a service)
  addServiceCategory: (category: Omit<ServiceCategory, "id">) => ServiceCategory;
  updateServiceCategory: (id: string, data: Partial<Omit<ServiceCategory, "id">>) => void;
  deleteServiceCategory: (id: string) => void;
  getServiceCategoryById: (id: string) => ServiceCategory | undefined;
  getServiceCategoryByName: (name: string) => ServiceCategory | undefined;

  // Dashboard Layout
  updateDashboardLayout: (layout: DashboardLayout) => void;
  resetDashboardLayout: (presetType?: LayoutPresetType) => void;
  addWidget: (widget: Omit<DashboardWidget, "id">) => void;
  removeWidget: (widgetId: string) => void;
  updateWidget: (widgetId: string, updates: Partial<DashboardWidget>) => void;
  updateWidgetPosition: (widgetId: string, position: DashboardWidget["position"]) => void;
  updateWidgetConfig: (widgetId: string, config: Partial<DashboardWidget["config"]>) => void;
  toggleWidgetVisibility: (widgetId: string) => void;
}

const now = () => new Date().toISOString();

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      clients: seedClients,
      clientResources: [],
      clientDashboardBlockData: [],
      onboardingForms: [],
      formSubmissions: [],
      projects: seedProjects,
      boards: seedBoards,
      boardLists: seedBoardLists,
      boardTasks: seedBoardTasks,
      boardLabels: [],
      dashboardLayout: getDefaultLayout("action-oriented"),
      boardTemplates: [
        {
          id: "tpl_design",
          name: "Design Workflow",
          description: "For design projects: Brief → Concept → Design → Review → Approved",
          isCustom: false,
          listNames: ["Brief", "Concept", "Design", "Review", "Approved"],
          createdAt: now(),
          updatedAt: now(),
        },
        {
          id: "tpl_dev",
          name: "Development",
          description: "For development projects: Backlog → To Do → In Progress → QA → Done",
          isCustom: false,
          listNames: ["Backlog", "To Do", "In Progress", "QA", "Done"],
          createdAt: now(),
          updatedAt: now(),
        },
        {
          id: "tpl_content",
          name: "Content Creation",
          description: "For content projects: Ideas → Draft → Review → Scheduled → Published",
          isCustom: false,
          listNames: ["Ideas", "Draft", "Review", "Scheduled", "Published"],
          createdAt: now(),
          updatedAt: now(),
        },
      ],
      taskComments: [],
      taskAttachments: [],
      timeEntries: seedTimeEntries,
      invoices: seedInvoices,
      products: seedProducts,
      customFieldDefinitions: [],
      serviceCustomFieldDefinitions: [],
      settings: {
        ...defaultSettings,
        invoiceDefaults: {
          ...defaultSettings.invoiceDefaults,
          nextNumber: 5, // seed uses INV-001 to INV-004
        },
        timeTracking: defaultSettings.timeTracking ?? defaultTimeTrackingSettings,
        teamMembers: defaultSettings.teamMembers?.length ? defaultSettings.teamMembers : seedTeamMembers,
      },

      getNextClientCode: () => {
        const { settings } = get();
        const s = settings ?? defaultSettings;
        const fmt = s.clientCode?.format ?? "C-{000}";
        const nextNum = s.clientCode?.nextNumber ?? 1;
        const year = format(new Date(), "yyyy");
        const numStr = String(nextNum).padStart(3, "0");
        const code = fmt.replace(/\{000\}/g, numStr).replace(/\{YYYY\}/g, year);
        set((state) => {
          const prev = state.settings ?? defaultSettings;
          return {
            settings: {
              ...prev,
              clientCode: {
                ...prev.clientCode,
                format: prev.clientCode?.format ?? "C-{000}",
                nextNumber: (prev.clientCode?.nextNumber ?? 1) + 1,
              },
            },
          };
        });
        return code;
      },

      addClient: (data) => {
        const code = data.code || get().getNextClientCode();
        const client: Client = {
          ...data,
          id: uuid(),
          code,
          status: data.status ?? "active",
          customFieldValues: [],
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ clients: [...s.clients, client] }));
        return client;
      },

      updateClient: (id, data) => {
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === id ? { ...c, ...data, updatedAt: now() } : c
          ),
        }));
      },

      deleteClient: (id) => {
        set((s) => ({
          clients: s.clients.filter((c) => c.id !== id),
          projects: s.projects.filter((p) => p.clientId !== id),
          invoices: s.invoices.filter((i) => i.clientId !== id),
        }));
      },

      getClient: (id) => get().clients.find((c) => c.id === id),

      // Client Board methods
      generateClientBoardToken: (clientId) => {
        const token = uuid() + '-' + Date.now().toString(36);
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId
              ? { ...c, boardToken: token, boardEnabled: true, boardTokenCreatedAt: now(), updatedAt: now() }
              : c
          ),
        }));
        return token;
      },

      regenerateClientBoardToken: (clientId) => {
        const token = uuid() + '-' + Date.now().toString(36);
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId
              ? { ...c, boardToken: token, boardTokenCreatedAt: now(), updatedAt: now() }
              : c
          ),
        }));
        return token;
      },

      toggleClientBoard: (clientId, enabled) => {
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId
              ? { ...c, boardEnabled: enabled, updatedAt: now() }
              : c
          ),
        }));
      },

      updateClientBoardSettings: (clientId, data) => {
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId
              ? { ...c, boardWelcomeMessage: data.welcomeMessage, updatedAt: now() }
              : c
          ),
        }));
      },

      // Client Resources methods
      addClientResource: (data) => {
        const resource: ClientResource = {
          ...data,
          id: uuid(),
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ clientResources: [...s.clientResources, resource] }));
        return resource;
      },

      updateClientResource: (id, data) => {
        set((s) => ({
          clientResources: s.clientResources.map((r) =>
            r.id === id ? { ...r, ...data, updatedAt: now() } : r
          ),
        }));
      },

      deleteClientResource: (id) => {
        set((s) => ({
          clientResources: s.clientResources.filter((r) => r.id !== id),
        }));
      },

      getClientResources: (clientId) => {
        return get().clientResources
          .filter((r) => r.clientId === clientId)
          .sort((a, b) => {
            // Pinned first, then by order
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return a.order - b.order;
          });
      },

      reorderClientResources: (clientId, resourceIds) => {
        set((s) => ({
          clientResources: s.clientResources.map((r) => {
            if (r.clientId !== clientId) return r;
            const newOrder = resourceIds.indexOf(r.id);
            if (newOrder === -1) return r;
            return { ...r, order: newOrder, updatedAt: now() };
          }),
        }));
      },

      // Client Notes methods
      addClientNote: (clientId, content) => {
        const note: ClientNote = {
          id: uuid(),
          clientId,
          content,
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId
              ? { ...c, notes: [...(c.notes || []), note], updatedAt: now() }
              : c
          ),
        }));
        return note;
      },

      updateClientNote: (clientId, noteId, content) => {
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId
              ? {
                  ...c,
                  notes: (c.notes || []).map((n) =>
                    n.id === noteId ? { ...n, content, updatedAt: now() } : n
                  ),
                  updatedAt: now(),
                }
              : c
          ),
        }));
      },

      deleteClientNote: (clientId, noteId) => {
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId
              ? {
                  ...c,
                  notes: (c.notes || []).filter((n) => n.id !== noteId),
                  updatedAt: now(),
                }
              : c
          ),
        }));
      },

      getClientNotes: (clientId) => {
        const client = get().clients.find((c) => c.id === clientId);
        return client?.notes || [];
      },

      // Client Dashboard Template Management
      getClientDashboardTemplate: () => {
        const template = get().settings.clientDashboardTemplate;
        return template || getDefaultClientDashboardTemplate();
      },

      updateClientDashboardTemplate: (template) => {
        set((state) => ({
          settings: {
            ...state.settings,
            clientDashboardTemplate: template,
          },
        }));
      },

      addDashboardBlock: (block) => {
        const template = get().getClientDashboardTemplate();
        const newBlock: ClientDashboardBlock = {
          ...block,
          id: uuid(),
          createdAt: new Date().toISOString(),
          order: template.blocks.length,
        };
        
        const updatedTemplate: ClientDashboardTemplate = {
          ...template,
          blocks: [...template.blocks, newBlock],
          lastModified: new Date().toISOString(),
        };
        
        get().updateClientDashboardTemplate(updatedTemplate);
        return newBlock;
      },

      removeDashboardBlock: (blockId) => {
        const template = get().getClientDashboardTemplate();
        const updatedBlocks = template.blocks
          .filter((b) => b.id !== blockId)
          .map((b, index) => ({ ...b, order: index }));
        
        const updatedTemplate: ClientDashboardTemplate = {
          ...template,
          blocks: updatedBlocks,
          lastModified: new Date().toISOString(),
        };
        
        get().updateClientDashboardTemplate(updatedTemplate);
      },

      updateDashboardBlock: (blockId, updates) => {
        const template = get().getClientDashboardTemplate();
        const updatedBlocks = template.blocks.map((b) =>
          b.id === blockId ? { ...b, ...updates } : b
        );
        
        const updatedTemplate: ClientDashboardTemplate = {
          ...template,
          blocks: updatedBlocks,
          lastModified: new Date().toISOString(),
        };
        
        get().updateClientDashboardTemplate(updatedTemplate);
      },

      reorderDashboardBlocks: (blockIds) => {
        const template = get().getClientDashboardTemplate();
        const blockMap = new Map(template.blocks.map((b) => [b.id, b]));
        const reorderedBlocks = blockIds
          .map((id) => blockMap.get(id))
          .filter((b): b is ClientDashboardBlock => b !== undefined)
          .map((b, index) => ({ ...b, order: index }));
        
        const updatedTemplate: ClientDashboardTemplate = {
          ...template,
          blocks: reorderedBlocks,
          lastModified: new Date().toISOString(),
        };
        
        get().updateClientDashboardTemplate(updatedTemplate);
      },

      // Client Dashboard Block Data
      getBlockData: (clientId, blockId) => {
        const blockData = get().clientDashboardBlockData.find(
          (d) => d.clientId === clientId && d.blockId === blockId
        );
        return blockData?.data;
      },

      updateBlockData: (clientId, blockId, data) => {
        set((state) => {
          const existing = state.clientDashboardBlockData.find(
            (d) => d.clientId === clientId && d.blockId === blockId
          );
          
          if (existing) {
            return {
              clientDashboardBlockData: state.clientDashboardBlockData.map((d) =>
                d.clientId === clientId && d.blockId === blockId
                  ? { ...d, data, updatedAt: new Date().toISOString() }
                  : d
              ),
            };
          } else {
            return {
              clientDashboardBlockData: [
                ...state.clientDashboardBlockData,
                {
                  id: uuid(),
                  clientId,
                  blockId,
                  data,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              ],
            };
          }
        });
      },

      deleteBlockData: (clientId, blockId) => {
        set((state) => ({
          clientDashboardBlockData: state.clientDashboardBlockData.filter(
            (d) => !(d.clientId === clientId && d.blockId === blockId)
          ),
        }));
      },

      // Onboarding Forms methods
      addOnboardingForm: (data) => {
        const form: OnboardingForm = {
          ...data,
          id: uuid(),
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ onboardingForms: [...s.onboardingForms, form] }));
        return form;
      },

      updateOnboardingForm: (id, data) => {
        set((s) => ({
          onboardingForms: s.onboardingForms.map((f) =>
            f.id === id ? { ...f, ...data, updatedAt: now() } : f
          ),
        }));
      },

      deleteOnboardingForm: (id) => {
        set((s) => ({
          onboardingForms: s.onboardingForms.filter((f) => f.id !== id),
        }));
      },

      getOnboardingForm: (id) => get().onboardingForms.find((f) => f.id === id),

      generateFormToken: (formId) => {
        const token = `${uuid()}-${Date.now().toString(36)}`;
        get().updateOnboardingForm(formId, {
          token,
          tokenEnabled: true,
          tokenCreatedAt: now(),
        });
        return token;
      },

      regenerateFormToken: (formId) => {
        const token = `${uuid()}-${Date.now().toString(36)}`;
        get().updateOnboardingForm(formId, {
          token,
          tokenCreatedAt: now(),
        });
        return token;
      },

      toggleFormAccess: (formId, enabled) => {
        get().updateOnboardingForm(formId, { tokenEnabled: enabled });
      },

      duplicateOnboardingForm: (formId) => {
        const original = get().onboardingForms.find((f) => f.id === formId);
        if (!original) throw new Error("Form not found");
        const duplicate: OnboardingForm = {
          ...original,
          id: uuid(),
          name: `${original.name} (Copy)`,
          isTemplate: false,
          token: undefined,
          tokenEnabled: false,
          tokenCreatedAt: undefined,
          createdAt: now(),
          updatedAt: now(),
          // Deep clone fields with new IDs
          fields: original.fields.map((f) => ({
            ...f,
            id: uuid(),
          })),
        };
        set((s) => ({ onboardingForms: [...s.onboardingForms, duplicate] }));
        return duplicate;
      },

      // Form Submissions methods
      addFormSubmission: (data) => {
        const submission: FormSubmission = {
          ...data,
          id: uuid(),
          submittedAt: now(),
        };
        set((s) => ({ formSubmissions: [...s.formSubmissions, submission] }));
        return submission;
      },

      updateFormSubmission: (id, data) => {
        set((s) => ({
          formSubmissions: s.formSubmissions.map((sub) =>
            sub.id === id ? { ...sub, ...data } : sub
          ),
        }));
      },

      getFormSubmissionsByStatus: (status) =>
        get().formSubmissions.filter((s) => s.status === status),

      getFormSubmission: (id) => get().formSubmissions.find((s) => s.id === id),

      acceptFormSubmission: (submissionId, clientId, projectId, reviewNotes) => {
        set((s) => ({
          formSubmissions: s.formSubmissions.map((sub) =>
            sub.id === submissionId
              ? {
                  ...sub,
                  status: "accepted" as FormSubmissionStatus,
                  reviewedAt: now(),
                  reviewNotes,
                  createdClientId: clientId,
                  createdProjectId: projectId,
                }
              : sub
          ),
        }));
      },

      rejectFormSubmission: (submissionId, reviewNotes) => {
        set((s) => ({
          formSubmissions: s.formSubmissions.map((sub) =>
            sub.id === submissionId
              ? {
                  ...sub,
                  status: "rejected" as FormSubmissionStatus,
                  reviewedAt: now(),
                  reviewNotes,
                }
              : sub
          ),
        }));
      },

      addProduct: (data) => {
        const product: Product = {
          ...data,
          id: uuid(),
          customFieldValues: data.customFieldValues ?? [],
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ products: [...s.products, product] }));
        return product;
      },

      getProduct: (id) => get().products.find((p) => p.id === id),

      updateProduct: (id, data) => {
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: now() } : p
          ),
        }));
      },

      deleteProduct: (id) => {
        set((s) => ({ products: s.products.filter((p) => p.id !== id) }));
      },

      addCustomFieldDefinition: (def) => {
        const newDef: CustomFieldDefinition = {
          ...def,
          id: uuid(),
        };
        set((s) => ({
          customFieldDefinitions: [...s.customFieldDefinitions, newDef],
        }));
      },

      updateCustomFieldDefinition: (id, data) => {
        set((s) => ({
          customFieldDefinitions: s.customFieldDefinitions.map((d) =>
            d.id === id ? { ...d, ...data } : d
          ),
        }));
      },

      deleteCustomFieldDefinition: (id) => {
        set((s) => ({
          customFieldDefinitions: s.customFieldDefinitions.filter((d) => d.id !== id),
        }));
      },

      addServiceCustomFieldDefinition: (def) => {
        const newDef: CustomFieldDefinition = {
          ...def,
          id: uuid(),
        };
        set((s) => ({
          serviceCustomFieldDefinitions: [...s.serviceCustomFieldDefinitions, newDef],
        }));
      },

      updateServiceCustomFieldDefinition: (id, data) => {
        set((s) => ({
          serviceCustomFieldDefinitions: s.serviceCustomFieldDefinitions.map((d) =>
            d.id === id ? { ...d, ...data } : d
          ),
        }));
      },

      deleteServiceCustomFieldDefinition: (id) => {
        set((s) => ({
          serviceCustomFieldDefinitions: s.serviceCustomFieldDefinitions.filter((d) => d.id !== id),
        }));
      },

      addProject: (data) => {
        const project: Project = {
          ...data,
          id: uuid(),
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ projects: [...s.projects, project] }));
        return project;
      },

      updateProject: (id, data) => {
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: now() } : p
          ),
        }));
      },

      deleteProject: (id) => {
        set((s) => {
          const boardIds = s.boards.filter((b) => b.projectId === id).map((b) => b.id);
          const listIds = s.boardLists.filter((l) => boardIds.includes(l.boardId)).map((l) => l.id);
          return {
            projects: s.projects.filter((p) => p.id !== id),
            boards: s.boards.filter((b) => b.projectId !== id),
            boardLists: s.boardLists.filter((l) => !boardIds.includes(l.boardId)),
            boardTasks: s.boardTasks.filter((t) => !listIds.includes(t.listId)),
            timeEntries: s.timeEntries.filter((t) => t.projectId !== id),
            invoices: s.invoices.map((i) => (i.projectId === id ? { ...i, projectId: undefined } : i)),
          };
        });
      },

      getProjectsByClient: (clientId) =>
        get().projects.filter((p) => p.clientId === clientId),

      // Boards
      addBoard: (data) => {
        const board: Board = {
          ...data,
          id: uuid(),
          isSaved: data.isSaved ?? false,
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ boards: [...s.boards, board] }));
        return board;
      },

      updateBoard: (id, data) => {
        set((s) => ({
          boards: s.boards.map((b) =>
            b.id === id ? { ...b, ...data, updatedAt: now() } : b
          ),
        }));
      },

      deleteBoard: (id) => {
        set((s) => {
          const listIds = s.boardLists.filter((l) => l.boardId === id).map((l) => l.id);
          return {
            boards: s.boards.filter((b) => b.id !== id),
            boardLists: s.boardLists.filter((l) => l.boardId !== id),
            boardTasks: s.boardTasks.filter((t) => t.boardId !== id),
          };
        });
      },

      getBoard: (id) => get().boards.find((b) => b.id === id),

      getBoardsByProject: (projectId) =>
        get().boards.filter((b) => b.projectId === projectId),

      linkBoardToProject: (boardId, projectId) => {
        set((s) => ({
          boards: s.boards.map((b) =>
            b.id === boardId ? { ...b, projectId: projectId ?? undefined, updatedAt: now() } : b
          ),
        }));
      },

      createBoardFromProject: (projectId, templateType) => {
        const project = get().projects.find((p) => p.id === projectId);
        if (!project) throw new Error("Project not found");
        const board: Board = {
          id: uuid(),
          name: project.name,
          description: project.description,
          projectId,
          isSaved: false,
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ boards: [...s.boards, board] }));
        const names = LIST_TEMPLATE_NAMES[templateType];
        const lists: BoardList[] = names.map((name, i) => ({
          id: uuid(),
          boardId: board.id,
          name,
          order: i,
          createdAt: now(),
          updatedAt: now(),
        }));
        set((s) => ({ boardLists: [...s.boardLists, ...lists] }));
        return board;
      },

      createBoardFromTemplate: (projectId, templateId) => {
        const project = get().projects.find((p) => p.id === projectId);
        if (!project) throw new Error("Project not found");
        const template = get().boardTemplates.find((t) => t.id === templateId);
        if (!template) throw new Error("Template not found");
        const board: Board = {
          id: uuid(),
          name: project.name,
          description: project.description,
          projectId,
          isSaved: false,
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ boards: [...s.boards, board] }));
        const lists: BoardList[] = template.listNames.map((name, i) => ({
          id: uuid(),
          boardId: board.id,
          name,
          order: i,
          createdAt: now(),
          updatedAt: now(),
        }));
        set((s) => ({ boardLists: [...s.boardLists, ...lists] }));
        return board;
      },

      createBoardForClient: (clientId, templateId, boardName) => {
        const client = get().clients.find((c) => c.id === clientId);
        if (!client) throw new Error("Client not found");
        const template = get().boardTemplates.find((t) => t.id === templateId);
        if (!template) throw new Error("Template not found");
        const board: Board = {
          id: uuid(),
          name: boardName ?? `${client.companyName} Board`,
          description: undefined,
          projectId: undefined,
          isSaved: false,
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ boards: [...s.boards, board] }));
        const lists: BoardList[] = template.listNames.map((name, i) => ({
          id: uuid(),
          boardId: board.id,
          name,
          order: i,
          createdAt: now(),
          updatedAt: now(),
        }));
        set((s) => ({ boardLists: [...s.boardLists, ...lists] }));
        return board;
      },

      toggleBoardSaved: (boardId) => {
        set((s) => ({
          boards: s.boards.map((b) =>
            b.id === boardId ? { ...b, isSaved: !b.isSaved, updatedAt: now() } : b
          ),
        }));
      },

      // Board templates
      addBoardTemplate: (data) => {
        const template: BoardTemplate = {
          ...data,
          id: uuid(),
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ boardTemplates: [...s.boardTemplates, template] }));
        return template;
      },

      updateBoardTemplate: (id, data) => {
        set((s) => ({
          boardTemplates: s.boardTemplates.map((t) =>
            t.id === id ? { ...t, ...data, updatedAt: now() } : t
          ),
        }));
      },

      deleteBoardTemplate: (id) => {
        set((s) => ({
          boardTemplates: s.boardTemplates.filter((t) => t.id !== id),
        }));
      },

      getBoardTemplate: (id) => get().boardTemplates.find((t) => t.id === id),

      // Board lists
      addBoardList: (data) => {
        const list: BoardList = {
          ...data,
          id: uuid(),
          order: data.order ?? 0,
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ boardLists: [...s.boardLists, list] }));
        return list;
      },

      updateBoardList: (id, data) => {
        set((s) => ({
          boardLists: s.boardLists.map((l) =>
            l.id === id ? { ...l, ...data, updatedAt: now() } : l
          ),
        }));
      },

      deleteBoardList: (id) => {
        set((s) => {
          // Archive tasks in this list (set archivedAt)
          const archiveAt = now();
          return {
            boardLists: s.boardLists.filter((l) => l.id !== id),
            boardTasks: s.boardTasks.map((t) =>
              t.listId === id ? { ...t, archivedAt: archiveAt, updatedAt: archiveAt } : t
            ),
          };
        });
      },

      getBoardLists: (boardId) =>
        get().boardLists.filter((l) => l.boardId === boardId).sort((a, b) => a.order - b.order),

      reorderBoardLists: (boardId, listIds) => {
        set((s) => {
          const lists = [...s.boardLists];
          listIds.forEach((listId, idx) => {
            const i = lists.findIndex((l) => l.id === listId && l.boardId === boardId);
            if (i >= 0) lists[i] = { ...lists[i], order: idx, updatedAt: now() };
          });
          return { boardLists: lists };
        });
      },

      // Board tasks
      addBoardTask: (data) => {
        const task: BoardTask = {
          ...data,
          id: uuid(),
          priority: data.priority ?? "medium",
          order: data.order ?? 0,
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ boardTasks: [...s.boardTasks, task] }));
        return task;
      },

      updateBoardTask: (id, data) => {
        set((s) => ({
          boardTasks: s.boardTasks.map((t) =>
            t.id === id ? { ...t, ...data, updatedAt: now() } : t
          ),
        }));
      },

      deleteBoardTask: (id) => {
        set((s) => ({ boardTasks: s.boardTasks.filter((t) => t.id !== id) }));
      },

      getBoardTasksByList: (listId) =>
        get().boardTasks
          .filter((t) => t.listId === listId && !t.archivedAt)
          .sort((a, b) => a.order - b.order),

      getBoardTasksByBoard: (boardId) =>
        get().boardTasks
          .filter((t) => t.boardId === boardId && !t.archivedAt)
          .sort((a, b) => a.order - b.order),

      getBoardTasksForProject: (projectId) => {
        const boards = get().boards.filter((b) => b.projectId === projectId);
        const boardIds = new Set(boards.map((b) => b.id));
        return get()
          .boardTasks.filter((t) => boardIds.has(t.boardId) && !t.archivedAt)
          .sort((a, b) => a.order - b.order);
      },

      reorderBoardTasksInList: (listId, taskIds) => {
        set((s) => {
          const tasks = [...s.boardTasks];
          taskIds.forEach((taskId, idx) => {
            const i = tasks.findIndex((t) => t.id === taskId && t.listId === listId);
            if (i >= 0) tasks[i] = { ...tasks[i], order: idx, updatedAt: now() };
          });
          return { boardTasks: tasks };
        });
      },

      moveBoardTaskToList: (taskId, targetListId) => {
        set((s) => {
          const task = s.boardTasks.find((t) => t.id === taskId);
          if (!task) return s;
          const targetList = s.boardLists.find((l) => l.id === targetListId);
          if (!targetList || targetList.boardId !== task.boardId) return s;
          const fromList = s.boardLists.find((l) => l.id === task.listId);
          const maxOrder = s.boardTasks
            .filter((t) => t.listId === targetListId && !t.archivedAt)
            .reduce((max, t) => Math.max(max, t.order), -1) + 1;
          const activity: TaskActivity = {
            id: uuid(),
            type: "moved",
            at: now(),
            text: `Moved from ${fromList?.name ?? "list"} to ${targetList.name}`,
            metadata: { fromListId: task.listId, toListId: targetListId, listName: targetList.name },
          };
          const existingActivities = task.activities ?? [];
          return {
            boardTasks: s.boardTasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    listId: targetListId,
                    order: maxOrder,
                    updatedAt: now(),
                    activities: [...existingActivities, activity],
                  }
                : t
            ),
          };
        });
      },

      duplicateBoardTask: (taskId) => {
        const task = get().boardTasks.find((t) => t.id === taskId);
        if (!task || task.archivedAt) return undefined;
        const listTasks = get().boardTasks.filter((t) => t.listId === task.listId && !t.archivedAt);
        const maxOrder = listTasks.length ? Math.max(...listTasks.map((t) => t.order), -1) + 1 : 0;
        const copy: BoardTask = {
          ...task,
          id: uuid(),
          title: `${task.title} (copy)`,
          order: maxOrder,
          activities: [],
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ boardTasks: [...s.boardTasks, copy] }));
        return copy;
      },

      reorderChecklistItems: (taskId, itemIds) => {
        set((s) => ({
          boardTasks: s.boardTasks.map((t) => {
            if (t.id !== taskId || !t.checklist?.length) return t;
            const orderMap = Object.fromEntries(itemIds.map((id, i) => [id, i]));
            const sorted = [...t.checklist].sort((a, b) => (orderMap[a.id] ?? 99) - (orderMap[b.id] ?? 99));
            return { ...t, checklist: sorted.map((it) => ({ ...it, order: orderMap[it.id] })), updatedAt: now() };
          }),
        }));
      },

      appendTaskActivity: (taskId, activity) => {
        const full: TaskActivity = { ...activity, id: uuid() };
        set((s) => ({
          boardTasks: s.boardTasks.map((t) =>
            t.id === taskId
              ? { ...t, activities: [...(t.activities ?? []), full], updatedAt: now() }
              : t
          ),
        }));
      },

      getTimeTrackedForTask: (taskId) => {
        return get().timeEntries
          .filter((e) => e.taskId === taskId)
          .reduce((sum, e) => sum + e.hours, 0);
      },

      getTimeEntriesByTask: (taskId) =>
        get().timeEntries
          .filter((e) => e.taskId === taskId)
          .sort((a, b) => b.date.localeCompare(a.date)),

      getBillableHoursForTask: (taskId) => {
        return get().timeEntries
          .filter((e) => e.taskId === taskId && e.billable)
          .reduce((sum, e) => sum + e.hours, 0);
      },

      getBoardLabels: (boardId) =>
        get().boardLabels.filter((l) => l.boardId === boardId),

      addBoardLabel: (boardId, data) => {
        const label: BoardLabel = { ...data, id: uuid(), boardId };
        set((s) => ({ boardLabels: [...s.boardLabels, label] }));
        return label;
      },

      updateBoardLabel: (id, data) => {
        set((s) => ({
          boardLabels: s.boardLabels.map((l) => (l.id === id ? { ...l, ...data } : l)),
        }));
      },

      deleteBoardLabel: (id) => {
        set((s) => ({
          boardLabels: s.boardLabels.filter((l) => l.id !== id),
          boardTasks: s.boardTasks.map((t) => {
            const ids = t.labelIds ?? [];
            if (!ids.includes(id)) return t;
            return { ...t, labelIds: ids.filter((x) => x !== id), updatedAt: now() };
          }),
        }));
      },

      getCommentsByTask: (taskId) =>
        get().taskComments.filter((c) => c.taskId === taskId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

      addTaskComment: (taskId, authorId, body) => {
        const comment: TaskComment = {
          id: uuid(),
          taskId,
          authorId,
          body,
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({
          taskComments: [...s.taskComments, comment],
          boardTasks: s.boardTasks.map((t) =>
            t.id === taskId ? { ...t, commentCount: (t.commentCount ?? 0) + 1, updatedAt: now() } : t
          ),
        }));
        get().appendTaskActivity(taskId, { type: "comment", at: now(), text: "Comment posted", metadata: { commentId: comment.id, authorId } });
        return comment;
      },

      updateTaskComment: (id, body) => {
        set((s) => ({
          taskComments: s.taskComments.map((c) => (c.id === id ? { ...c, body, updatedAt: now() } : c)),
        }));
      },

      deleteTaskComment: (id) => {
        const comment = get().taskComments.find((c) => c.id === id);
        if (!comment) return;
        set((s) => ({
          taskComments: s.taskComments.filter((c) => c.id !== id),
          boardTasks: s.boardTasks.map((t) =>
            t.id === comment.taskId ? { ...t, commentCount: Math.max(0, (t.commentCount ?? 0) - 1), updatedAt: now() } : t
          ),
        }));
      },

      getAttachmentsByTask: (taskId) =>
        get().taskAttachments.filter((a) => a.taskId === taskId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

      addTaskAttachment: (taskId, file) => {
        if (file.size > MAX_ATTACHMENT_SIZE_BYTES) return null;
        const att: TaskAttachment = {
          id: uuid(),
          taskId,
          name: file.name,
          mimeType: file.mimeType,
          size: file.size,
          url: file.url,
          createdAt: now(),
        };
        set((s) => ({
          taskAttachments: [...s.taskAttachments, att],
          boardTasks: s.boardTasks.map((t) =>
            t.id === taskId ? { ...t, attachmentCount: (t.attachmentCount ?? 0) + 1, updatedAt: now() } : t
          ),
        }));
        return att;
      },

      deleteTaskAttachment: (id) => {
        const att = get().taskAttachments.find((a) => a.id === id);
        if (!att) return;
        set((s) => ({
          taskAttachments: s.taskAttachments.filter((a) => a.id !== id),
          boardTasks: s.boardTasks.map((t) =>
            t.id === att.taskId ? { ...t, attachmentCount: Math.max(0, (t.attachmentCount ?? 0) - 1), updatedAt: now() } : t
          ),
        }));
      },

      runningTimer: null,

      startTimer: (taskId, teamMemberId) => {
        set({ runningTimer: { taskId, teamMemberId, startTime: now() } });
      },

      stopTimer: () => {
        const { runningTimer, boardTasks, projects, addTimeEntry } = get();
        if (!runningTimer) return null;
        const task = boardTasks.find((t) => t.id === runningTimer.taskId);
        const projectId = task?.projectId ?? (task ? get().boards.find((b) => b.id === task.boardId)?.projectId : undefined);
        const project = projectId ? get().projects.find((p) => p.id === projectId) : undefined;
        const teamMember = get().getTeamMember(runningTimer.teamMemberId);
        const timeTracking = get().settings?.timeTracking ?? defaultTimeTrackingSettings;
        const billingRate = project?.defaultBillingRate ?? teamMember?.defaultHourlyRate ?? timeTracking.defaultHourlyRate ?? 0;
        const currency = project?.billingCurrency ?? timeTracking.defaultCurrency ?? "USD";
        const start = new Date(runningTimer.startTime).getTime();
        const end = Date.now();
        const hours = Math.round((end - start) / (1000 * 60 * 15)) * 0.25 || 0.25; // round to nearest 15 min, min 0.25
        const date = format(new Date(), "yyyy-MM-dd");
        set({ runningTimer: null });
        const entry = addTimeEntry({
          projectId: projectId ?? "",
          taskId: runningTimer.taskId,
          teamMemberId: runningTimer.teamMemberId,
          date,
          hours,
          notes: undefined,
          billable: task?.billable ?? true,
          billingRate,
          currency,
        });
        return entry;
      },

      addTimeEntry: (data) => {
        const amount = data.billable ? data.hours * data.billingRate : 0;
        const entry: TimeEntry = {
          ...data,
          id: uuid(),
          amount,
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ timeEntries: [...s.timeEntries, entry] }));
        return entry;
      },

      updateTimeEntry: (id, data) => {
        set((s) => {
          const entries = s.timeEntries.map((e) =>
            e.id === id ? { ...e, ...data, updatedAt: now() } : e
          );
          const entry = entries.find((e) => e.id === id);
          if (entry && (data.hours !== undefined || data.billingRate !== undefined || data.billable !== undefined)) {
            const hours = data.hours ?? entry.hours;
            const rate = data.billingRate ?? entry.billingRate;
            const billable = data.billable ?? entry.billable;
            const i = entries.findIndex((e) => e.id === id);
            if (i >= 0) entries[i] = { ...entries[i], amount: billable ? hours * rate : 0 };
          }
          return { timeEntries: entries };
        });
      },

      deleteTimeEntry: (id) => {
        set((s) => ({ timeEntries: s.timeEntries.filter((e) => e.id !== id) }));
      },

      getTimeEntriesByProject: (projectId) =>
        get().timeEntries.filter((e) => e.projectId === projectId).sort((a, b) => b.date.localeCompare(a.date)),

      getTimeEntriesByDateRange: (start, end) =>
        get().timeEntries.filter((e) => e.date >= start && e.date <= end).sort((a, b) => b.date.localeCompare(a.date)),

      getTotalTimeByProject: (projectId) => {
        return get().timeEntries
          .filter((e) => e.projectId === projectId)
          .reduce((sum, e) => sum + e.hours, 0);
      },

      getTotalTimeByClient: (clientId) => {
        const tasksWithClient = get().boardTasks.filter((t) => t.clientId === clientId);
        const taskIds = new Set(tasksWithClient.map((t) => t.id));
        return get().timeEntries
          .filter((e) => e.taskId && taskIds.has(e.taskId))
          .reduce((sum, e) => sum + e.hours, 0);
      },

      getTotalTimeByTeamMember: (teamMemberId) => {
        return get().timeEntries
          .filter((e) => e.teamMemberId === teamMemberId)
          .reduce((sum, e) => sum + e.hours, 0);
      },

      getUninvoicedBillableTasks: (opts = {}) => {
        const { boardLists, boardTasks, getTimeTrackedForTask } = get();
        const completedListNames = ["done", "approved", "published"];
        const isCompleted = (t: BoardTask) => {
          const list = boardLists.find((l) => l.id === t.listId);
          const name = (list?.name ?? "").toLowerCase();
          return completedListNames.some((k) => name.includes(k));
        };
        return boardTasks.filter((t) => {
          if (t.archivedAt || !t.billable || t.invoiceId) return false;
          if (!isCompleted(t)) return false;
          if (opts.clientId != null && t.clientId !== opts.clientId) return false;
          if (opts.projectId != null && t.projectId !== opts.projectId) return false;
          if (opts.boardId != null && t.boardId !== opts.boardId) return false;
          return true;
        });
      },

      createInvoiceFromTasks: (opts) => {
        const { taskIds, clientId, projectId } = opts;
        const state = get();
        const { boardTasks, products, getTimeTrackedForTask, addInvoice, updateBoardTask, getNextInvoiceNumber, getClient } = state;
        const client = getClient(clientId);
        const currency = client?.currency ?? state.settings?.invoiceDefaults?.defaultCurrency ?? "USD";
        const taxRate = state.settings?.invoiceDefaults?.defaultTaxRate ?? 0;
        const taxName = state.settings?.invoiceDefaults?.defaultTaxName ?? "Tax";
        const lineItems: LineItem[] = [];
        let subtotal = 0;
        for (const taskId of taskIds) {
          const task = boardTasks.find((t) => t.id === taskId);
          if (!task || task.invoiceId) continue;
          const hours = getTimeTrackedForTask(taskId);
          const service = task.serviceId ? products.find((p) => p.id === task.serviceId) : undefined;
          const rate = service?.defaultPrice ?? 0;
          const unit = service ? (SERVICE_PRICING_TO_UNIT[service.pricingType] ?? "hours") : "hours";
          const total = Math.round(hours * rate * 100) / 100;
          lineItems.push({
            id: uuid(),
            items: task.title,
            quantity: hours,
            unit,
            price: rate,
            total,
            productRef: task.serviceId,
          });
          subtotal += total;
        }
        if (lineItems.length === 0) return null;
        const taxAmount = Math.round(subtotal * taxRate * 0.01 * 100) / 100;
        const total = subtotal + taxAmount;
        const invNum = getNextInvoiceNumber();
        const issueDate = format(new Date(), "yyyy-MM-dd");
        const dueDate = format(addMonths(new Date(), 1), "yyyy-MM-dd");
        const invoice = addInvoice({
          invoiceNumber: invNum,
          clientId,
          projectId,
          status: "draft",
          issueDate,
          dueDate,
          lineItems,
          subtotal,
          taxRate,
          taxName,
          taxAmount,
          discountType: "none",
          discountValue: 0,
          discountAmount: 0,
          total,
          currency,
          paymentMethods: (state.settings?.paymentMethods ?? []).filter((p) => p.enabled).map((p) => p.name),
          lateFeeEnabled: false,
          showLogo: true,
          showHeaderImage: false,
          applyTax: taxRate > 0,
          displayTaxId: state.settings?.invoiceDefaults?.displayTaxId ?? true,
          shippingAddress: false,
          showReferenceNumber: false,
        });
        taskIds.forEach((taskId) => {
          state.updateBoardTask(taskId, { invoiceId: invoice.id });
        });
        return invoice;
      },

      getBillableSummaryForClient: (clientId) => {
        const { boardTasks, boardLists, products, getTimeTrackedForTask, invoices } = get();
        const completedListNames = ["done", "approved", "published"];
        const isCompleted = (t: BoardTask) => {
          const list = boardLists.find((l) => l.id === t.listId);
          return completedListNames.some((k) => (list?.name ?? "").toLowerCase().includes(k));
        };
        const clientTasks = boardTasks.filter((t) => t.clientId === clientId && !t.archivedAt);
        const unbilled = clientTasks.filter((t) => t.billable && !t.invoiceId && isCompleted(t));
        const invoiced = clientTasks.filter((t) => t.invoiceId);
        const byService: { serviceId: string; serviceName: string; hours: number; amount: number }[] = [];
        let totalUnbilled = 0;
        let totalHoursUnbilled = 0;
        unbilled.forEach((t) => {
          const hours = getTimeTrackedForTask(t.id);
          const service = t.serviceId ? products.find((p) => p.id === t.serviceId) : undefined;
          const rate = service?.defaultPrice ?? 0;
          const amount = hours * rate;
          totalUnbilled += amount;
          totalHoursUnbilled += hours;
          const sid = t.serviceId ?? "";
          const sname = service?.name ?? "Unspecified";
          const existing = byService.find((s) => s.serviceId === sid);
          if (existing) {
            existing.hours += hours;
            existing.amount += amount;
          } else byService.push({ serviceId: sid, serviceName: sname, hours, amount });
        });
        const totalInvoiced = invoices.filter((i) => i.clientId === clientId).reduce((s, i) => s + i.total, 0);
        return { totalUnbilled, totalInvoiced, tasksUnbilled: unbilled.length, tasksInvoiced: invoiced.length, totalHoursUnbilled, byService };
      },

      getBillableSummaryForProject: (projectId) => {
        const { boardTasks, boardLists, products, getTimeTrackedForTask, invoices } = get();
        const completedListNames = ["done", "approved", "published"];
        const isCompleted = (t: BoardTask) => {
          const list = boardLists.find((l) => l.id === t.listId);
          return completedListNames.some((k) => (list?.name ?? "").toLowerCase().includes(k));
        };
        const projectTasks = boardTasks.filter((t) => t.projectId === projectId && !t.archivedAt);
        const unbilled = projectTasks.filter((t) => t.billable && !t.invoiceId && isCompleted(t));
        const invoiced = projectTasks.filter((t) => t.invoiceId);
        const byService: { serviceId: string; serviceName: string; hours: number; amount: number }[] = [];
        let totalUnbilled = 0;
        let totalHoursUnbilled = 0;
        unbilled.forEach((t) => {
          const hours = getTimeTrackedForTask(t.id);
          const service = t.serviceId ? products.find((p) => p.id === t.serviceId) : undefined;
          const rate = service?.defaultPrice ?? 0;
          const amount = hours * rate;
          totalUnbilled += amount;
          totalHoursUnbilled += hours;
          const sid = t.serviceId ?? "";
          const sname = service?.name ?? "Unspecified";
          const existing = byService.find((s) => s.serviceId === sid);
          if (existing) {
            existing.hours += hours;
            existing.amount += amount;
          } else byService.push({ serviceId: sid, serviceName: sname, hours, amount });
        });
        const totalInvoiced = invoices.filter((i) => i.projectId === projectId).reduce((s, i) => s + i.total, 0);
        return { totalUnbilled, totalInvoiced, tasksUnbilled: unbilled.length, tasksInvoiced: invoiced.length, totalHoursUnbilled, byService };
      },

      getTotalUnbilledAmount: () => {
        const { clients, getBillableSummaryForClient } = get();
        let total = 0;
        const currencies = new Set<string>();
        for (const c of clients) {
          const summary = getBillableSummaryForClient(c.id);
          if (summary.totalUnbilled > 0) {
            total += summary.totalUnbilled;
            currencies.add(c.currency ?? "USD");
          }
        }
        const taskCount = clients.reduce(
          (sum, c) => sum + getBillableSummaryForClient(c.id).tasksUnbilled,
          0
        );
        return {
          amount: total,
          currency: currencies.size === 1 ? [...currencies][0] : "USD",
          taskCount,
        };
      },

      getOverdueTaskCount: () => {
        const { boardTasks } = get();
        const now = Date.now();
        return boardTasks.filter((t) => {
          if (t.archivedAt || t.completedAt) return false;
          const due = t.dueDateTime ?? t.dueDate ?? "";
          if (!due) return false;
          const d = new Date(due).getTime();
          return !Number.isNaN(d) && d < now;
        }).length;
      },

      addTeamMember: (data) => {
        const member: TeamMember = { ...data, id: uuid() };
        set((s) => ({
          settings: {
            ...(s.settings ?? defaultSettings),
            teamMembers: [...(s.settings?.teamMembers ?? []), member],
          },
        }));
        return member;
      },

      updateTeamMember: (id, data) => {
        set((s) => ({
          settings: {
            ...(s.settings ?? defaultSettings),
            teamMembers: (s.settings?.teamMembers ?? []).map((m) =>
              m.id === id ? { ...m, ...data } : m
            ),
          },
        }));
      },

      deleteTeamMember: (id) => {
        set((s) => ({
          settings: {
            ...(s.settings ?? defaultSettings),
            teamMembers: (s.settings?.teamMembers ?? []).filter((m) => m.id !== id),
          },
          boardTasks: s.boardTasks.map((t) => (t.assigneeId === id ? { ...t, assigneeId: undefined, assignee: undefined, updatedAt: now() } : t)),
          projects: s.projects.map((p) => {
            const next = { ...p, updatedAt: now() };
            if (p.projectManagerId === id) next.projectManagerId = undefined;
            if (p.leadDeveloperId === id) next.leadDeveloperId = undefined;
            if (p.memberIds?.length) next.memberIds = p.memberIds.filter((mid) => mid !== id);
            return next;
          }),
        }));
      },

      getTeamMember: (id) =>
        get().settings?.teamMembers?.find((m) => m.id === id),

      addTeamRole: (data) => {
        const role: TeamRoleDefinition = { ...data, id: uuid() };
        set((s) => ({
          settings: {
            ...(s.settings ?? defaultSettings),
            teamRoles: [...(s.settings?.teamRoles ?? defaultSettings.teamRoles ?? []), role],
          },
        }));
        return role;
      },

      updateTeamRole: (id, data) => {
        set((s) => ({
          settings: {
            ...(s.settings ?? defaultSettings),
            teamRoles: (s.settings?.teamRoles ?? []).map((r) =>
              r.id === id ? { ...r, ...data } : r
            ),
          },
        }));
      },

      deleteTeamRole: (id) => {
        set((s) => ({
          settings: {
            ...(s.settings ?? defaultSettings),
            teamRoles: (s.settings?.teamRoles ?? []).filter((r) => r.id !== id),
            teamMembers: (s.settings?.teamMembers ?? []).map((m) =>
              m.roleId === id ? { ...m, roleId: undefined, role: undefined } : m
            ),
          },
        }));
      },

      addInvoice: (data) => {
        const invoice: Invoice = {
          ...data,
          id: uuid(),
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ invoices: [...s.invoices, invoice] }));
        return invoice;
      },

      updateInvoice: (id, data) => {
        set((s) => ({
          invoices: s.invoices.map((i) =>
            i.id === id ? { ...i, ...data, updatedAt: now() } : i
          ),
        }));
      },

      deleteInvoice: (id) => {
        set((s) => ({ invoices: s.invoices.filter((i) => i.id !== id) }));
      },

      getInvoice: (id) => get().invoices.find((i) => i.id === id),

      getNextInvoiceNumber: () => {
        const { settings } = get();
        const s = settings ?? defaultSettings;
        const next = s.invoiceDefaults.nextNumber;
        const year = format(new Date(), "yyyy");
        const num = String(next).padStart(3, "0");
        const formatted = s.invoiceDefaults.numberFormat
          .replace("{YYYY}", year)
          .replace("{000}", num);
        set((state) => {
          const prev = state.settings ?? defaultSettings;
          return {
            settings: {
              ...prev,
              invoiceDefaults: {
                ...prev.invoiceDefaults,
                nextNumber: prev.invoiceDefaults.nextNumber + 1,
              },
            },
          };
        });
        return formatted;
      },

      updateSettings: (data) => {
        set((s) => ({ settings: { ...(s.settings ?? defaultSettings), ...data } }));
      },

      addServiceCategory: (data) => {
        const category: ServiceCategory = {
          ...data,
          id: uuid(),
        };
        set((s) => ({
          settings: {
            ...(s.settings ?? defaultSettings),
            serviceCategories: [...(s.settings?.serviceCategories ?? []), category],
          },
        }));
        return category;
      },

      updateServiceCategory: (id, data) => {
        set((s) => ({
          settings: {
            ...(s.settings ?? defaultSettings),
            serviceCategories: (s.settings?.serviceCategories ?? []).map((c) =>
              c.id === id ? { ...c, ...data } : c
            ),
          },
        }));
      },

      deleteServiceCategory: (id) => {
        set((s) => ({
          settings: {
            ...(s.settings ?? defaultSettings),
            serviceCategories: (s.settings?.serviceCategories ?? []).filter((c) => c.id !== id),
          },
          products: s.products.map((p) => (p.categoryId === id ? { ...p, categoryId: undefined } : p)),
        }));
      },

      getServiceCategoryById: (id) =>
        get().settings?.serviceCategories?.find((c) => c.id === id),

      getServiceCategoryByName: (name) =>
        get().settings?.serviceCategories?.find(
          (c) => c.name.toLowerCase() === name.trim().toLowerCase()
        ) ?? undefined,

      // Dashboard Layout Methods
      updateDashboardLayout: (layout) => {
        set({
          dashboardLayout: {
            ...layout,
            lastModified: new Date().toISOString(),
          },
        });
      },

      resetDashboardLayout: (presetType) => {
        const layout = getDefaultLayout(presetType);
        set({ dashboardLayout: layout });
      },

      addWidget: (widgetData) => {
        const newWidget: DashboardWidget = {
          ...widgetData,
          id: uuid(),
        };
        set((s) => ({
          dashboardLayout: {
            ...s.dashboardLayout,
            widgets: [...s.dashboardLayout.widgets, newWidget],
            lastModified: new Date().toISOString(),
          },
        }));
      },

      removeWidget: (widgetId) => {
        set((s) => ({
          dashboardLayout: {
            ...s.dashboardLayout,
            widgets: s.dashboardLayout.widgets.filter((w) => w.id !== widgetId),
            lastModified: new Date().toISOString(),
          },
        }));
      },

      updateWidget: (widgetId, updates) => {
        set((s) => ({
          dashboardLayout: {
            ...s.dashboardLayout,
            widgets: s.dashboardLayout.widgets.map((w) =>
              w.id === widgetId ? { ...w, ...updates } : w
            ),
            lastModified: new Date().toISOString(),
          },
        }));
      },

      updateWidgetPosition: (widgetId, position) => {
        set((s) => ({
          dashboardLayout: {
            ...s.dashboardLayout,
            widgets: s.dashboardLayout.widgets.map((w) =>
              w.id === widgetId ? { ...w, position } : w
            ),
            lastModified: new Date().toISOString(),
          },
        }));
      },

      updateWidgetConfig: (widgetId, config) => {
        set((s) => ({
          dashboardLayout: {
            ...s.dashboardLayout,
            widgets: s.dashboardLayout.widgets.map((w) =>
              w.id === widgetId ? { ...w, config: { ...w.config, ...config } } : w
            ),
            lastModified: new Date().toISOString(),
          },
        }));
      },

      toggleWidgetVisibility: (widgetId) => {
        set((s) => ({
          dashboardLayout: {
            ...s.dashboardLayout,
            widgets: s.dashboardLayout.widgets.map((w) =>
              w.id === widgetId ? { ...w, visible: !w.visible } : w
            ),
            lastModified: new Date().toISOString(),
          },
        }));
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => {
        const { runningTimer: _r, ...rest } = state as AppState & { runningTimer?: unknown };
        return rest;
      },
      merge: (persisted, current) => {
        const p = persisted as Partial<AppState> | undefined;
        const { tasks: _tasks, ...restP } = (p ?? {}) as Partial<AppState> & { tasks?: unknown };
        return {
          ...current,
          ...restP,
          runningTimer: null,
          boards: p?.boards ?? current.boards,
          boardLists: p?.boardLists ?? current.boardLists,
          boardTasks: p?.boardTasks ?? current.boardTasks,
          boardLabels: p?.boardLabels ?? current.boardLabels,
          taskComments: p?.taskComments ?? current.taskComments,
          taskAttachments: p?.taskAttachments ?? current.taskAttachments,
          dashboardLayout: p?.dashboardLayout ?? current.dashboardLayout,
          settings: {
            ...defaultSettings,
            ...(p?.settings ?? {}),
            teamMembers: p?.settings?.teamMembers ?? current.settings?.teamMembers ?? defaultSettings.teamMembers ?? seedTeamMembers,
            teamRoles: p?.settings?.teamRoles ?? current.settings?.teamRoles ?? defaultSettings.teamRoles ?? [],
          },
        };
      },
    }
  )
);
