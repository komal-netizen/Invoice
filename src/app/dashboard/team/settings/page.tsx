"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { defaultSettings } from "@/lib/defaults";
import type { TeamRoleDefinition } from "@/lib/types";

const inputClass =
  "mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500";
const labelClass = "block text-sm font-medium text-neutral-300";

export default function TeamSettingsPage() {
  const settings = useStore((s) => s.settings ?? defaultSettings);
  const updateSettings = useStore((s) => s.updateSettings);
  const addTeamRole = useStore((s) => s.addTeamRole);
  const updateTeamRole = useStore((s) => s.updateTeamRole);
  const deleteTeamRole = useStore((s) => s.deleteTeamRole);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/team"
          className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          aria-label="Back to team"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-white">Team Settings</h1>
          <p className="mt-1 text-sm text-neutral-400">Configure team roles, project labels, and display names.</p>
        </div>
      </div>

      <div className="space-y-8">
        <TeamRolesSection
          roles={settings.teamRoles ?? defaultSettings.teamRoles ?? []}
          onAdd={(name, color) => addTeamRole({ name, color })}
          onUpdate={(id, data) => updateTeamRole(id, data)}
          onDelete={(id) => deleteTeamRole(id)}
          inputClass={inputClass}
          labelClass={labelClass}
        />

        <section>
          <h2 className="text-lg font-medium text-white">Project team labels</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Custom labels for the two lead slots on project detail (e.g. &quot;Account lead&quot;, &quot;Creative lead&quot;). Leave blank to use defaults.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>First lead role label</label>
              <input
                type="text"
                value={settings.projectLeadLabels?.projectManager ?? ""}
                onChange={(e) =>
                  updateSettings({
                    projectLeadLabels: {
                      ...settings.projectLeadLabels,
                      projectManager: e.target.value.trim() || undefined,
                    },
                  })
                }
                className={inputClass}
                placeholder="Project Manager"
              />
            </div>
            <div>
              <label className={labelClass}>Second lead role label</label>
              <input
                type="text"
                value={settings.projectLeadLabels?.leadDeveloper ?? ""}
                onChange={(e) =>
                  updateSettings({
                    projectLeadLabels: {
                      ...settings.projectLeadLabels,
                      leadDeveloper: e.target.value.trim() || undefined,
                    },
                  })
                }
                className={inputClass}
                placeholder="Lead Developer"
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white">Display names</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Customize section labels in the sidebar and page titles (e.g. &quot;Studio&quot; instead of &quot;Team&quot;). Leave blank to use defaults.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Team section name</label>
              <input
                type="text"
                value={settings.teamSectionLabel ?? ""}
                onChange={(e) =>
                  updateSettings({
                    teamSectionLabel: e.target.value.trim() || undefined,
                  })
                }
                className={inputClass}
                placeholder="Team"
              />
            </div>
            <div>
              <label className={labelClass}>My Tasks link name</label>
              <input
                type="text"
                value={settings.myTasksLabel ?? ""}
                onChange={(e) =>
                  updateSettings({
                    myTasksLabel: e.target.value.trim() || undefined,
                  })
                }
                className={inputClass}
                placeholder="My Tasks"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function TeamRolesSection({
  roles,
  onAdd,
  onUpdate,
  onDelete,
  inputClass,
  labelClass,
}: {
  roles: TeamRoleDefinition[];
  onAdd: (name: string, color?: string) => void;
  onUpdate: (id: string, data: Partial<Pick<TeamRoleDefinition, "name" | "color">>) => void;
  onDelete: (id: string) => void;
  inputClass: string;
  labelClass: string;
}) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6366f1");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    onAdd(name, newColor || undefined);
    setNewName("");
    setNewColor("#6366f1");
  };

  const startEdit = (r: TeamRoleDefinition) => {
    setEditingId(r.id);
    setEditName(r.name);
    setEditColor(r.color ?? "");
  };

  const saveEdit = () => {
    if (editingId) {
      onUpdate(editingId, { name: editName.trim() || undefined, color: editColor.trim() || undefined });
      setEditingId(null);
    }
  };

  return (
    <section>
      <h2 className="text-lg font-medium text-white">Team roles</h2>
      <p className="mt-1 text-sm text-neutral-400">
        Roles shown when adding or editing team members (e.g. Creative Director, Designer). Add, edit, or remove. Optional color is used on the Team page.
      </p>
      <div className="mt-4 space-y-2">
        {roles.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-3 rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2"
          >
            {editingId === r.id ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={inputClass + " flex-1"}
                  placeholder="Role name"
                />
                <input
                  type="text"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className={inputClass + " w-24"}
                  placeholder="#hex"
                />
                <button type="button" onClick={saveEdit} className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm text-white hover:bg-orange-400">
                  Save
                </button>
                <button type="button" onClick={() => setEditingId(null)} className="rounded-lg border border-neutral-600 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-700">
                  Cancel
                </button>
              </>
            ) : (
              <>
                {r.color && (
                  <span
                    className="h-4 w-4 shrink-0 rounded-full border border-neutral-600"
                    style={{ backgroundColor: r.color }}
                    title={r.color}
                  />
                )}
                <span className="flex-1 font-medium text-white">{r.name}</span>
                <button type="button" onClick={() => startEdit(r)} className="text-sm text-orange-400 hover:underline">
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => typeof window !== "undefined" && window.confirm(`Remove "${r.name}"? Team members with this role will have their role cleared.`) && onDelete(r.id)}
                  className="text-sm text-red-400 hover:underline"
                >
                  Remove
                </button>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
          className={inputClass}
          placeholder="New role name"
        />
        <input
          type="text"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          className={inputClass + " w-24"}
          placeholder="#color"
        />
        <button type="button" onClick={handleAdd} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400">
          Add role
        </button>
      </div>
    </section>
  );
}
