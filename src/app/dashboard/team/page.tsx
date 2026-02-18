"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import type { TeamMember, TeamRoleDefinition } from "@/lib/types";
import { defaultSettings } from "@/lib/defaults";
import { ConfirmDialog } from "@/components/ConfirmDialog";

/** Legacy: map member.role (enum) to default role id when roleId is not set */
function getEffectiveRoleId(member: TeamMember): string | undefined {
  if (member.roleId) return member.roleId;
  if (member.role) return `role-${member.role}`;
  return undefined;
}

export default function TeamPage() {
  const [mounted, setMounted] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  useEffect(() => setMounted(true), []);

  const teamMembers = useStore((s) => s.settings?.teamMembers ?? []);
  const teamRoles = useStore((s) => s.settings?.teamRoles ?? defaultSettings.teamRoles ?? []);
  const teamSectionLabel = useStore((s) => s.settings?.teamSectionLabel ?? "Team");
  const myTasksLabel = useStore((s) => s.settings?.myTasksLabel ?? "My Tasks");
  const addTeamMember = useStore((s) => s.addTeamMember);
  const updateTeamMember = useStore((s) => s.updateTeamMember);
  const deleteTeamMember = useStore((s) => s.deleteTeamMember);
  const boardTasks = useStore((s) => s.boardTasks);
  const projects = useStore((s) => s.projects);

  const getRoleForMember = useCallback(
    (member: TeamMember): TeamRoleDefinition | undefined => {
      const roleId = getEffectiveRoleId(member);
      return roleId ? teamRoles.find((r) => r.id === roleId) : undefined;
    },
    [teamRoles]
  );

  const memberTaskCount = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of boardTasks) {
      if (!t.archivedAt && t.assigneeId) map[t.assigneeId] = (map[t.assigneeId] ?? 0) + 1;
    }
    return map;
  }, [boardTasks]);

  const memberProjectCount = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of projects) {
      const assigned = new Set<string>();
      if (p.projectManagerId) assigned.add(p.projectManagerId);
      if (p.leadDeveloperId) assigned.add(p.leadDeveloperId);
      for (const mid of p.memberIds ?? []) assigned.add(mid);
      for (const mid of assigned) {
        map[mid] = (map[mid] ?? 0) + 1;
      }
    }
    return map;
  }, [projects]);

  const filtered = useMemo(() => {
    let list = teamMembers;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.email?.toLowerCase().includes(q) ?? false) ||
          (getRoleForMember(m)?.name?.toLowerCase().includes(q) ?? false)
      );
    }
    if (roleFilter !== "all") list = list.filter((m) => getEffectiveRoleId(m) === roleFilter);
    return list;
  }, [teamMembers, search, roleFilter, getRoleForMember]);

  const inputClass =
    "rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500";
  const selectClass =
    "rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500";

  if (!mounted) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold text-white">{teamSectionLabel}</h1>
        <div className="mt-8 space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-10 w-48 animate-pulse rounded-lg bg-neutral-800" />
            <div className="h-10 w-36 animate-pulse rounded-lg bg-neutral-800" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-xl bg-neutral-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-white">{teamSectionLabel}</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-neutral-600 bg-neutral-800/50 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                viewMode === "grid" ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-white"
              }`}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                viewMode === "list" ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-white"
              }`}
            >
              List
            </button>
          </div>
          <Link
            href="/dashboard/team/settings"
            className="rounded-lg border border-neutral-600 bg-neutral-800 p-2.5 text-neutral-400 hover:bg-neutral-700 hover:text-white"
            aria-label="Team settings"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
          <button
            onClick={() => setAddModalOpen(true)}
            className="rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-400"
          >
            Add Team Member
          </button>
          <Link
            href="/dashboard/my-tasks"
            className="rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-200 hover:bg-neutral-700"
          >
            {myTasksLabel}
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Search by name, email, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={inputClass}
          aria-label="Search team members"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className={selectClass}
          aria-label="Filter by role"
        >
          <option value="all">All roles</option>
          {teamRoles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-12 rounded-xl border border-dashed border-neutral-700 bg-neutral-900/50 py-16 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800">
              <svg className="h-8 w-8 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-medium text-white">
            {teamMembers.length === 0 ? "No team members yet" : "No members found"}
          </h3>
          <p className="mt-2 text-sm text-neutral-400 max-w-md mx-auto">
            {teamMembers.length === 0
              ? "Build your team by adding members. Assign them to projects and track their work."
              : "No team members match your current filters. Try adjusting your search or role filter."}
          </p>
          {teamMembers.length === 0 && (
            <button
              onClick={() => setAddModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-orange-400"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Your First Team Member
            </button>
          )}
        </div>
      ) : viewMode === "list" ? (
        <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-700 bg-neutral-800/50">
                <th className="p-3 font-medium text-neutral-300">Name</th>
                <th className="p-3 font-medium text-neutral-300">Role</th>
                <th className="p-3 font-medium text-neutral-300">Email</th>
                <th className="p-3 font-medium text-neutral-300">Rate</th>
                <th className="p-3 font-medium text-neutral-300">Tasks</th>
                <th className="p-3 font-medium text-neutral-300">Projects</th>
                <th className="p-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-neutral-800 hover:bg-neutral-800/50"
                >
                  <td className="p-3 font-medium text-white">{member.name}</td>
                  <td className="p-3">
                    {(() => {
                      const roleDef = getRoleForMember(member);
                      return (
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            roleDef?.color ? "" : "bg-neutral-500/20 text-neutral-400"
                          }`}
                          style={
                            roleDef?.color
                              ? { backgroundColor: `${roleDef.color}20`, color: roleDef.color }
                              : undefined
                          }
                        >
                          {roleDef?.name ?? "—"}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="p-3 text-neutral-400">{member.email ?? "—"}</td>
                  <td className="p-3 text-neutral-400">
                    {member.defaultHourlyRate != null
                      ? `$${member.defaultHourlyRate}/hr`
                      : "—"}
                  </td>
                  <td className="p-3 text-neutral-400">
                    {memberTaskCount[member.id] ?? 0} tasks
                  </td>
                  <td className="p-3 text-neutral-400">
                    {memberProjectCount[member.id] ?? 0} projects
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingMember(member)}
                        className="text-orange-400 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setMemberToDelete(member)}
                        className="text-red-400 hover:underline"
                        aria-label={`Remove ${member.name}`}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((member) => (
            <div
              key={member.id}
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                  {(() => {
                    const roleDef = getRoleForMember(member);
                    return (
                      <span
                        className={`mt-1.5 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          roleDef?.color ? "" : "bg-neutral-500/20 text-neutral-400"
                        }`}
                        style={
                          roleDef?.color
                            ? { backgroundColor: `${roleDef.color}20`, color: roleDef.color }
                            : undefined
                        }
                      >
                        {roleDef?.name ?? "—"}
                      </span>
                    );
                  })()}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingMember(member)}
                    className="rounded p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-orange-400"
                    aria-label="Edit"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemberToDelete(member)}
                    className="rounded p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-red-400"
                    aria-label={`Remove ${member.name}`}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              {member.email && (
                <p className="mt-2 text-sm text-neutral-400">{member.email}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-3 border-t border-neutral-800 pt-3 text-xs">
                <span className="flex items-center gap-1.5 text-neutral-400">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  {memberTaskCount[member.id] ?? 0} tasks
                </span>
                <span className="flex items-center gap-1.5 text-neutral-400">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                  {memberProjectCount[member.id] ?? 0} projects
                </span>
                {member.defaultHourlyRate != null && (
                  <span className="flex items-center gap-1.5 text-neutral-400">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    ${member.defaultHourlyRate}/hr
                  </span>
                )}
              </div>
              <div className="mt-3">
                <Link
                  href={`/dashboard/my-tasks?member=${member.id}`}
                  className="inline-flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-300"
                >
                  View tasks
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {addModalOpen && (
<AddTeamMemberModal
        teamRoles={teamRoles}
        onClose={() => setAddModalOpen(false)}
        onSave={(data) => {
          addTeamMember(data);
          setAddModalOpen(false);
        }}
      />
      )}

      {editingMember && (
        <EditTeamMemberModal
        member={editingMember}
        teamRoles={teamRoles}
        onClose={() => setEditingMember(null)}
        onSave={(data) => {
          updateTeamMember(editingMember.id, data);
          setEditingMember(null);
        }}
      />
      )}

      <ConfirmDialog
        isOpen={!!memberToDelete}
        onClose={() => setMemberToDelete(null)}
        onConfirm={() => {
          if (memberToDelete) {
            deleteTeamMember(memberToDelete.id);
          }
        }}
        title="Remove Team Member"
        message={`Remove ${memberToDelete?.name ?? "this member"}? They will be unassigned from all tasks and projects.`}
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
}

function AddTeamMemberModal({
  teamRoles,
  onClose,
  onSave,
}: {
  teamRoles: TeamRoleDefinition[];
  onClose: () => void;
  onSave: (data: Omit<TeamMember, "id">) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState<string>("");
  const [defaultHourlyRate, setDefaultHourlyRate] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Invalid email format";
    if (defaultHourlyRate && parseFloat(defaultHourlyRate) <= 0) e.rate = "Rate must be positive";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      name: name.trim(),
      email: email.trim() || undefined,
      roleId: roleId || undefined,
      role: undefined,
      defaultHourlyRate: defaultHourlyRate ? parseFloat(defaultHourlyRate) : undefined,
      phone: phone.trim() || undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.target instanceof HTMLInputElement && e.target.type !== "textarea") {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-member-title"
    >
      <div 
        className="w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h2 id="add-member-title" className="text-lg font-semibold text-white">Add Team Member</h2>
        <p className="mt-1 text-sm text-neutral-400">Add a new team member and set their role</p>

        <div className="mt-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Personal Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300">Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  placeholder="e.g. Jane Smith"
                  autoFocus
                />
                {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  placeholder="jane@company.com"
                />
                {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Role & Rate</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300">Role</label>
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="">Select role</option>
                  {teamRoles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300">Default hourly rate ($)</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={defaultHourlyRate}
                  onChange={(e) => setDefaultHourlyRate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  placeholder="Used for time tracking"
                />
                {errors.rate && <p className="mt-1 text-xs text-red-400">{errors.rate}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400"
          >
            Add Member
          </button>
        </div>
      </div>
    </div>
  );
}

function EditTeamMemberModal({
  member,
  teamRoles,
  onClose,
  onSave,
}: {
  member: TeamMember;
  teamRoles: TeamRoleDefinition[];
  onClose: () => void;
  onSave: (data: Partial<TeamMember>) => void;
}) {
  const [name, setName] = useState(member.name);
  const [email, setEmail] = useState(member.email ?? "");
  const [roleId, setRoleId] = useState<string>(member.roleId ?? (member.role ? `role-${member.role}` : ""));
  const [defaultHourlyRate, setDefaultHourlyRate] = useState(
    member.defaultHourlyRate != null ? String(member.defaultHourlyRate) : ""
  );
  const [phone, setPhone] = useState(member.phone ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Invalid email format";
    if (defaultHourlyRate && parseFloat(defaultHourlyRate) <= 0) e.rate = "Rate must be positive";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      name: name.trim(),
      email: email.trim() || undefined,
      roleId: roleId || undefined,
      role: undefined,
      defaultHourlyRate: defaultHourlyRate ? parseFloat(defaultHourlyRate) : undefined,
      phone: phone.trim() || undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.target instanceof HTMLInputElement && e.target.type !== "textarea") {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-member-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white">Edit Team Member</h2>
        <p className="mt-1 text-sm text-neutral-400">Update profile and role</p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300">Role</label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="">Select role</option>
              {teamRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300">Default hourly rate ($)</label>
            <input
              type="number"
              min={0}
              step={1}
              value={defaultHourlyRate}
              onChange={(e) => setDefaultHourlyRate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
