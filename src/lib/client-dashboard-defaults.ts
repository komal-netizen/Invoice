import type { ClientDashboardTemplate } from "./client-dashboard-types";

/**
 * Get the default client dashboard template
 * This template is used when no custom template is configured
 */
export const getDefaultClientDashboardTemplate = (): ClientDashboardTemplate => ({
  id: "default",
  name: "Default Template",
  isDefault: true,
  lastModified: new Date().toISOString(),
  blocks: [
    {
      id: "activities",
      type: "activities",
      order: 0,
      visible: true,
      createdAt: new Date().toISOString(),
      config: {
        title: "Recent Activity",
        maxItems: 10,
        showIcons: true,
        groupByDate: false
      }
    },
    {
      id: "notes",
      type: "notes",
      order: 1,
      visible: true,
      createdAt: new Date().toISOString(),
      config: {
        title: "Notes",
        showAddButton: true,
        maxNotes: 10
      }
    },
    {
      id: "uploads",
      type: "uploads",
      order: 2,
      visible: true,
      createdAt: new Date().toISOString(),
      config: {
        title: "Uploads",
        groupByType: true,
        showUploadButton: true,
        maxItems: 20
      }
    }
  ]
});
