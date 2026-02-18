"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { NewTimeEntryModal } from "@/components/NewTimeEntryModal";
import { CreateBoardFromProjectModal } from "@/components/CreateBoardFromProjectModal";
import { GenerateInvoiceFromTasksModal } from "@/components/GenerateInvoiceFromTasksModal";
import type { ProjectStatus } from "@/lib/types";
import { format } from "date-fns";

const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
};

const PROJECT_STATUS_CLASS: Record<ProjectStatus, string> = {
  planning: "bg-blue-500/20 text-blue-400",
  active: "bg-emerald-500/20 text-emerald-400",
  on_hold: "bg-amber-500/20 text-amber-400",
  completed: "bg-neutral-500/20 text-neutral-400",
};

function formatDateSafe(dateStr: string | undefined, fmt: string, fallback = "—") {
  if (dateStr == null || dateStr === "") return fallback;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return fallback;
  return format(d, fmt);
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [createBoardModalOpen, setCreateBoardModalOpen] = useState(false);
  const [generateInvoiceModalOpen, setGenerateInvoiceModalOpen] = useState(false);

  const project = useStore((s) => s.projects.find((p) => p.id === projectId));
  const clients = useStore((s) => s.clients);
  const settings = useStore((s) => s.settings);
  const timeEntries = useStore((s) => s.timeEntries);
  const getBoardsByProject = useStore((s) => s.getBoardsByProject);
  const getBoardTasksForProject = useStore((s) => s.getBoardTasksForProject);
  const updateProject = useStore((s) => s.updateProject);
  const getTeamMember = useStore((s) => s.getTeamMember);
  const teamMembers = useStore((s) => s.settings?.teamMembers ?? []);
  const projectManagerLabel = settings?.projectLeadLabels?.projectManager ?? "Project Manager";
  const leadDeveloperLabel = settings?.projectLeadLabels?.leadDeveloper ?? "Lead Developer";
  const getBillableSummaryForProject = useStore((s) => s.getBillableSummaryForProject);

  const projectTimeEntries = useMemo(
    () => timeEntries.filter((e) => e.projectId === projectId).sort((a, b) => b.date.localeCompare(a.date)),
    [timeEntries, projectId]
  );
  const boards = useMemo(() => getBoardsByProject(projectId), [getBoardsByProject, projectId]);
  const boardTasks = useMemo(() => getBoardTasksForProject(projectId), [getBoardTasksForProject, projectId]);
  const primaryBoard = boards[0];

  const client = project ? clients.find((c) => c.id === project.clientId) : null;
  const projectBillingSummary = project ? getBillableSummaryForProject(projectId) : null;

  useEffect(() => {
    if (projectId && !project) {
      router.replace("/dashboard/projects");
    }
  }, [projectId, project, router]);

  if (!project) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <p className="text-neutral-400">Project not found.</p>
        <Link href="/dashboard/projects" className="mt-2 inline-block text-orange-400 hover:underline">
          Back to Projects
        </Link>
      </div>
    );
  }

  const inputClass =
    "rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500";

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/dashboard/projects"
            className="mb-2 inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-orange-400"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Projects
          </Link>
          <h1 className="text-2xl font-semibold text-white">{project.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Link
              href={`/dashboard/clients/${project.clientId}`}
              className="text-sm text-neutral-400 hover:text-orange-400 hover:underline"
            >
              {client?.companyName}
            </Link>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                PROJECT_STATUS_CLASS[project.status] ?? "bg-neutral-500/20 text-neutral-400"
              }`}
            >
              {PROJECT_STATUS_LABELS[project.status] ?? project.status}
            </span>
            {project.totalValue != null && (
              <span className="text-sm text-neutral-400">
                Budget: {project.totalValue.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {primaryBoard ? (
            <Link
              href={`/dashboard/task-boards/${primaryBoard.id}`}
              className="rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-400"
            >
              Open Board ({boardTasks.length} tasks)
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setCreateBoardModalOpen(true)}
              className="rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-400"
            >
              Create Board from Project
            </button>
          )}
          {boards.length > 1 && (
            <Link
              href="/dashboard/task-boards"
              className="rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-200 hover:bg-neutral-700"
            >
              View all {boards.length} boards
            </Link>
          )}
          <button
            onClick={() => setTimeModalOpen(true)}
            className="rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-200 hover:bg-neutral-700"
          >
            Log Time
          </button>
          <Link
            href={`/dashboard/time?project=${projectId}`}
            className="rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-200 hover:bg-neutral-700"
          >
            Time ({projectTimeEntries.length})
          </Link>
          <Link
            href={`/dashboard/invoices?project=${projectId}`}
            className="rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-200 hover:bg-neutral-700"
          >
            View Invoices
          </Link>
          <button
            type="button"
            onClick={() => setGenerateInvoiceModalOpen(true)}
            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Generate Invoice
            {projectBillingSummary && projectBillingSummary.tasksUnbilled > 0 && (
              <span className="ml-1.5 text-emerald-200">
                ({projectBillingSummary.tasksUnbilled} task{projectBillingSummary.tasksUnbilled !== 1 ? "s" : ""})
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Project team */}
      <div className="mb-6 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
        <h3 className="mb-3 text-sm font-medium text-white">Project team</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-neutral-400">{projectManagerLabel}</label>
            <select
              value={project.projectManagerId ?? ""}
              onChange={(e) => updateProject(projectId, { projectManagerId: e.target.value || undefined })}
              className={inputClass + " mt-1 w-full"}
            >
              <option value="">None</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400">{leadDeveloperLabel}</label>
            <select
              value={project.leadDeveloperId ?? ""}
              onChange={(e) => updateProject(projectId, { leadDeveloperId: e.target.value || undefined })}
              className={inputClass + " mt-1 w-full"}
            >
              <option value="">None</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-xs font-medium text-neutral-400">Team members on this project</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {(project.memberIds ?? []).map((memberId) => {
              const m = getTeamMember(memberId);
              return m ? (
                <span
                  key={memberId}
                  className="inline-flex items-center gap-1 rounded-full bg-neutral-700 px-3 py-1 text-sm text-white"
                >
                  {m.name}
                  <button
                    type="button"
                    onClick={() => updateProject(projectId, { memberIds: (project.memberIds ?? []).filter((id) => id !== memberId) })}
                    className="rounded-full p-0.5 hover:bg-neutral-600"
                    aria-label={`Remove ${m.name}`}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </span>
              ) : null;
            })}
            <select
              value=""
              onChange={(e) => {
                const id = e.target.value;
                e.target.value = "";
                if (!id) return;
                const current = project.memberIds ?? [];
                if (current.includes(id)) return;
                updateProject(projectId, { memberIds: [...current, id] });
              }}
              className={inputClass + " max-w-[180px] py-1.5 text-sm"}
            >
              <option value="">Add member</option>
              {teamMembers
                .filter((m) => !(project.memberIds ?? []).includes(m.id))
                .map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {projectTimeEntries.length > 0 && (
        <div className="mb-6 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Time logged</h3>
            <div className="flex items-center gap-4">
              <span className="text-sm text-neutral-400">
                {projectTimeEntries.reduce((a, e) => a + e.hours, 0).toFixed(1)} hrs total
              </span>
              <span className="text-sm text-emerald-400">
                {projectTimeEntries
                  .filter((e) => e.billable)
                  .reduce((a, e) => a + e.amount, 0)
                  .toLocaleString("en-US", { style: "currency", currency: "USD" })}{" "}
                billable
              </span>
              <Link
                href={`/dashboard/time?project=${projectId}`}
                className="text-sm text-orange-400 hover:underline"
              >
                View all
              </Link>
            </div>
          </div>
        </div>
      )}

      {project.description && (
        <p className="mb-6 text-sm text-neutral-400">{project.description}</p>
      )}

      <NewTimeEntryModal
        isOpen={timeModalOpen}
        onClose={() => setTimeModalOpen(false)}
        defaultProjectId={projectId}
      />

      <CreateBoardFromProjectModal
        isOpen={createBoardModalOpen}
        onClose={() => setCreateBoardModalOpen(false)}
        defaultProjectId={projectId}
      />

      <GenerateInvoiceFromTasksModal
        isOpen={generateInvoiceModalOpen}
        onClose={() => setGenerateInvoiceModalOpen(false)}
        defaultClientId={project.clientId}
        defaultProjectId={projectId}
      />
    </div>
  );
}
