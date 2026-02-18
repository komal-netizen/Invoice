/**
 * Server-side store for client board data.
 * When a board token is generated, client data is snapshotted here for public access.
 * In production, this would be a database.
 */
import type { Client, Project, BoardTask, ClientResource, FormSubmission } from "./types";

export interface ClientBoardSnapshot {
  client: {
    companyName: string;
    contactName: string;
    boardWelcomeMessage?: string;
  };
  projects: Array<{
    id: string;
    name: string;
    description?: string;
    status: string;
    startDate?: string;
    dueDate?: string;
  }>;
  tasks: Array<{
    id: string;
    projectId?: string;
    title: string;
    description?: string;
    priority: string;
    dueDate?: string;
    completedAt?: string;
    listName?: string;
  }>;
  resources: ClientResource[];
  onboardingSubmission?: FormSubmission; // Onboarding form submission data
  lastUpdated: string;
}

const store = new Map<string, ClientBoardSnapshot>();

export function setClientBoardSnapshot(token: string, data: ClientBoardSnapshot) {
  store.set(token, data);
}

export function getClientBoardSnapshot(token: string): ClientBoardSnapshot | undefined {
  return store.get(token);
}

export function updateClientBoardSnapshot(token: string, data: Partial<ClientBoardSnapshot>) {
  const existing = store.get(token);
  if (!existing) return;
  store.set(token, {
    ...existing,
    ...data,
    lastUpdated: new Date().toISOString(),
  });
}

export function deleteClientBoardSnapshot(token: string) {
  store.delete(token);
}
