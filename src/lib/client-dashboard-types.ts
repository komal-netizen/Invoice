/**
 * Client Dashboard Block System Types
 * Defines types for customizable client dashboard blocks
 */

export type ClientDashboardBlockType =
  | "uploads"
  | "notes" 
  | "activities"
  | "text-section"
  | "table"
  | "chart"
  | "gallery"
  | "links"
  | "embedded-content"
  | "custom-fields"
  | "timeline"
  | "kanban";

export interface BaseBlockConfig {
  title?: string;
  showHeader?: boolean;
  isCollapsible?: boolean;
  defaultCollapsed?: boolean;
}

export interface UploadsBlockConfig extends BaseBlockConfig {
  groupByType?: boolean;
  showUploadButton?: boolean;
  maxItems?: number;
}

export interface NotesBlockConfig extends BaseBlockConfig {
  showAddButton?: boolean;
  maxNotes?: number;
}

export interface ActivitiesBlockConfig extends BaseBlockConfig {
  maxItems?: number;
  showIcons?: boolean;
  groupByDate?: boolean;
}

export interface TextSectionBlockConfig extends BaseBlockConfig {
  allowMarkdown?: boolean;
  editable?: boolean;
}

export interface TableBlockConfig extends BaseBlockConfig {
  columns: Array<{
    id: string;
    label: string;
    type: "text" | "number" | "date" | "currency";
    width?: string;
  }>;
  editable?: boolean;
  showAddRow?: boolean;
}

export interface ChartBlockConfig extends BaseBlockConfig {
  chartType: "line" | "bar" | "pie" | "area";
  dataSource: "revenue" | "projects" | "time" | "custom";
  showLegend?: boolean;
}

export interface GalleryBlockConfig extends BaseBlockConfig {
  layout: "grid" | "masonry" | "carousel";
  columns?: number;
  showCaptions?: boolean;
}

export interface LinksBlockConfig extends BaseBlockConfig {
  showIcons?: boolean;
  openInNewTab?: boolean;
}

export interface EmbeddedContentBlockConfig extends BaseBlockConfig {
  url?: string;
  height?: string;
}

export interface CustomFieldsBlockConfig extends BaseBlockConfig {
  fieldIds?: string[];
  layout: "list" | "grid";
}

export interface TimelineBlockConfig extends BaseBlockConfig {
  maxEvents?: number;
  eventTypes?: string[];
}

export interface KanbanBlockConfig extends BaseBlockConfig {
  boardId?: string;
  showCompletedTasks?: boolean;
}

export type BlockConfig =
  | UploadsBlockConfig
  | NotesBlockConfig
  | ActivitiesBlockConfig
  | TextSectionBlockConfig
  | TableBlockConfig
  | ChartBlockConfig
  | GalleryBlockConfig
  | LinksBlockConfig
  | EmbeddedContentBlockConfig
  | CustomFieldsBlockConfig
  | TimelineBlockConfig
  | KanbanBlockConfig;

export interface ClientDashboardBlock {
  id: string;
  type: ClientDashboardBlockType;
  order: number;
  config: BlockConfig;
  visible: boolean;
  createdAt: string;
}

export interface ClientDashboardTemplate {
  id: string;
  name: string;
  blocks: ClientDashboardBlock[];
  isDefault: boolean;
  lastModified: string;
}

export interface ClientDashboardBlockData {
  id: string;
  clientId: string;
  blockId: string;
  data: any; // JSON data specific to block type
  createdAt: string;
  updatedAt: string;
}

// Block metadata for the block library UI
export interface BlockMetadata {
  type: ClientDashboardBlockType;
  name: string;
  description: string;
  icon: string;
  category: "content" | "data" | "media" | "tools";
  defaultConfig: BlockConfig;
}

// Available block metadata
export const BLOCK_METADATA: BlockMetadata[] = [
  {
    type: "uploads",
    name: "Uploads",
    description: "Display and manage uploaded files",
    icon: "upload",
    category: "media",
    defaultConfig: { title: "Uploads", groupByType: true, showUploadButton: true }
  },
  {
    type: "notes",
    name: "Notes",
    description: "Internal notes about the client",
    icon: "note",
    category: "content",
    defaultConfig: { title: "Notes", showAddButton: true }
  },
  {
    type: "activities",
    name: "Recent Activity",
    description: "Timeline of client activities",
    icon: "activity",
    category: "data",
    defaultConfig: { title: "Recent Activity", maxItems: 10, showIcons: true }
  },
  {
    type: "text-section",
    name: "Text Section",
    description: "Custom text content",
    icon: "text",
    category: "content",
    defaultConfig: { title: "Custom Section", allowMarkdown: true, editable: true }
  },
  {
    type: "table",
    name: "Table",
    description: "Custom data table",
    icon: "table",
    category: "data",
    defaultConfig: {
      title: "Data Table",
      columns: [
        { id: "col1", label: "Column 1", type: "text" },
        { id: "col2", label: "Column 2", type: "text" }
      ],
      editable: true,
      showAddRow: true
    }
  },
  {
    type: "chart",
    name: "Chart",
    description: "Visual data charts",
    icon: "chart",
    category: "data",
    defaultConfig: { title: "Chart", chartType: "bar", dataSource: "revenue", showLegend: true }
  },
  {
    type: "gallery",
    name: "Gallery",
    description: "Image and video gallery",
    icon: "gallery",
    category: "media",
    defaultConfig: { title: "Gallery", layout: "grid", columns: 3, showCaptions: true }
  },
  {
    type: "links",
    name: "Links",
    description: "Collection of important links",
    icon: "link",
    category: "content",
    defaultConfig: { title: "Important Links", showIcons: true, openInNewTab: true }
  },
  {
    type: "embedded-content",
    name: "Embedded Content",
    description: "Embed external content",
    icon: "embed",
    category: "media",
    defaultConfig: { title: "Embedded Content", height: "400px" }
  },
  {
    type: "custom-fields",
    name: "Custom Fields",
    description: "Display custom client fields",
    icon: "fields",
    category: "data",
    defaultConfig: { title: "Custom Fields", layout: "list" }
  },
  {
    type: "timeline",
    name: "Timeline",
    description: "Project timeline view",
    icon: "timeline",
    category: "data",
    defaultConfig: { title: "Timeline", maxEvents: 20 }
  },
  {
    type: "kanban",
    name: "Kanban Board",
    description: "Mini kanban board view",
    icon: "kanban",
    category: "tools",
    defaultConfig: { title: "Tasks", showCompletedTasks: false }
  }
];
