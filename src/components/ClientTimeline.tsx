"use client";

import { format } from "date-fns";

interface TimelineProject {
  id: string;
  name: string;
  status: string;
  startDate?: string;
  dueDate?: string;
}

interface TimelineTask {
  id: string;
  projectId?: string;
  title: string;
  completedAt?: string;
  dueDate?: string;
}

interface ClientTimelineProps {
  projects: TimelineProject[];
  tasks: TimelineTask[];
}

function formatDateSafe(dateStr: string | undefined, fmt: string, fallback = "—") {
  if (!dateStr) return fallback;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return fallback;
  return format(d, fmt);
}

export function ClientTimeline({ projects, tasks }: ClientTimelineProps) {
  const now = Date.now();

  // Group tasks by completion status
  const completedTasks = tasks.filter((t) => t.completedAt);
  const upcomingTasks = tasks.filter((t) => !t.completedAt && t.dueDate);

  // Get upcoming milestones (project due dates)
  const upcomingMilestones = projects
    .filter((p) => p.dueDate && p.status !== "completed")
    .map((p) => ({
      ...p,
      dueTime: new Date(p.dueDate!).getTime(),
    }))
    .sort((a, b) => a.dueTime - b.dueTime);

  // Get recent completions (last 30 days)
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const recentCompletions = completedTasks
    .filter((t) => {
      if (!t.completedAt) return false;
      const time = new Date(t.completedAt).getTime();
      return time >= thirtyDaysAgo;
    })
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Upcoming Milestones */}
      {upcomingMilestones.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Upcoming Milestones
          </h3>
          <div className="space-y-2">
            {upcomingMilestones.map((project) => (
              <div
                key={project.id}
                className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                  <svg
                    className="h-5 w-5 text-blue-600 dark:text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 dark:text-white">
                    {project.name}
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Due {formatDateSafe(project.dueDate, "MMM d, yyyy")}
                  </p>
                </div>
                {project.status === "active" && (
                  <span className="flex-shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    In Progress
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Completions */}
      {recentCompletions.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Recently Completed
          </h3>
          <div className="space-y-2">
            {recentCompletions.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20"
              >
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {task.title}
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Completed {formatDateSafe(task.completedAt, "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Projects Progress */}
      {projects.filter((p) => p.status === "active" || p.status === "planning").length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Current Work
          </h3>
          <div className="space-y-3">
            {projects
              .filter((p) => p.status === "active" || p.status === "planning")
              .map((project) => {
                const projectTasks = tasks.filter((t) => t.projectId === project.id);
                const completedCount = projectTasks.filter((t) => t.completedAt).length;
                const totalCount = projectTasks.length;
                const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

                return (
                  <div
                    key={project.id}
                    className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">
                          {project.name}
                        </p>
                        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                          {completedCount} of {totalCount} tasks completed
                        </p>
                      </div>
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {project.dueDate && (
                      <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                        Target: {formatDateSafe(project.dueDate, "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {upcomingMilestones.length === 0 &&
        recentCompletions.length === 0 &&
        projects.filter((p) => p.status === "active" || p.status === "planning").length === 0 && (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white/50 py-12 text-center dark:border-neutral-700 dark:bg-neutral-900/50">
            <svg
              className="mx-auto h-12 w-12 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              No timeline data available
            </p>
          </div>
        )}
    </div>
  );
}
