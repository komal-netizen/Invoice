"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { syncSubmissionsFromServer } from "@/lib/sync-forms";
import type { FormSubmission, FormSubmissionStatus } from "@/lib/types";
import { format } from "date-fns";

export default function SubmissionsPage() {
  const formSubmissions = useStore((s) => s.formSubmissions);
  const addFormSubmission = useStore((s) => s.addFormSubmission);
  const updateFormSubmission = useStore((s) => s.updateFormSubmission);
  const acceptFormSubmission = useStore((s) => s.acceptFormSubmission);
  const rejectFormSubmission = useStore((s) => s.rejectFormSubmission);
  const addClient = useStore((s) => s.addClient);
  const addProject = useStore((s) => s.addProject);

  const [statusFilter, setStatusFilter] = useState<FormSubmissionStatus | "all">("all");
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [syncing, setSyncing] = useState(false);

  // Sync submissions from server on mount
  useEffect(() => {
    syncSubmissions();
  }, []);

  const syncSubmissions = async () => {
    setSyncing(true);
    try {
      const serverSubmissions = await syncSubmissionsFromServer();
      // Add new submissions from server
      serverSubmissions.forEach((sub: FormSubmission) => {
        if (!formSubmissions.find((s) => s.id === sub.id)) {
          addFormSubmission(sub as any);
        }
      });
    } catch (error) {
      console.error("Failed to sync submissions:", error);
    } finally {
      setSyncing(false);
    }
  };

  const filteredSubmissions = useMemo(() => {
    if (statusFilter === "all") return formSubmissions;
    return formSubmissions.filter((s) => s.status === statusFilter);
  }, [formSubmissions, statusFilter]);

  const statusCounts = useMemo(() => {
    return {
      all: formSubmissions.length,
      pending: formSubmissions.filter((s) => s.status === "pending").length,
      reviewed: formSubmissions.filter((s) => s.status === "reviewed").length,
      accepted: formSubmissions.filter((s) => s.status === "accepted").length,
      rejected: formSubmissions.filter((s) => s.status === "rejected").length,
    };
  }, [formSubmissions]);

  const handleAccept = () => {
    if (!selectedSubmission) return;

    // Extract client info from responses
    const nameResponse = selectedSubmission.responses.find((r) =>
      r.fieldLabel.toLowerCase().includes("name") && !r.fieldLabel.toLowerCase().includes("company")
    );
    const companyResponse = selectedSubmission.responses.find((r) =>
      r.fieldLabel.toLowerCase().includes("company")
    );
    const emailResponse = selectedSubmission.responses.find((r) => r.fieldType === "email");

    // Create client
    const client = addClient({
      companyName: (companyResponse?.value as string) || (nameResponse?.value as string) || "New Client",
      contactName: (nameResponse?.value as string) || "",
      email: (emailResponse?.value as string) || "",
      tags: [],
      status: "active",
    });

    // Create project
    const project = addProject({
      clientId: client.id,
      name: `${selectedSubmission.formName} - ${client.companyName}`,
      status: "planning",
    });

    // Mark submission as accepted
    acceptFormSubmission(selectedSubmission.id, client.id, project.id, reviewNotes.trim() || undefined);

    setSelectedSubmission(null);
    setReviewNotes("");
  };

  const handleReject = () => {
    if (!selectedSubmission) return;
    if (!reviewNotes.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    rejectFormSubmission(selectedSubmission.id, reviewNotes.trim());
    setSelectedSubmission(null);
    setReviewNotes("");
  };

  const getStatusBadge = (status: FormSubmissionStatus) => {
    switch (status) {
      case "pending":
        return "bg-amber-900/40 text-amber-300";
      case "reviewed":
        return "bg-blue-900/40 text-blue-300";
      case "accepted":
        return "bg-emerald-900/40 text-emerald-300";
      case "rejected":
        return "bg-red-900/40 text-red-300";
      default:
        return "bg-neutral-700 text-neutral-300";
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/onboarding-forms"
              className="text-neutral-400 hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-semibold text-white">Form Submissions</h1>
          </div>
          <p className="mt-1 text-sm text-neutral-400">
            Review and manage onboarding form submissions
          </p>
        </div>
        <button
          type="button"
          onClick={syncSubmissions}
          disabled={syncing}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-200 hover:bg-neutral-700 disabled:opacity-50"
        >
          <svg className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {syncing ? "Syncing..." : "Sync"}
        </button>
      </div>

      {/* Status Tabs */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-neutral-800">
        {(["all", "pending", "reviewed", "accepted", "rejected"] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`relative px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === status
                ? "text-orange-400"
                : "text-neutral-400 hover:text-neutral-300"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {statusCounts[status] > 0 && (
              <span className="ml-2 rounded-full bg-neutral-700 px-2 py-0.5 text-xs">
                {statusCounts[status]}
              </span>
            )}
            {statusFilter === status && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
            )}
          </button>
        ))}
      </div>

      {/* Submissions List */}
      <div className="mt-6">
        {filteredSubmissions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-900/50 py-16 text-center">
            <svg className="mx-auto h-16 w-16 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-white">No submissions</h3>
            <p className="mt-2 text-sm text-neutral-400">
              {statusFilter === "all"
                ? "No form submissions yet"
                : `No ${statusFilter} submissions`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSubmissions
              .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
              .map((submission) => (
                <div
                  key={submission.id}
                  className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 hover:border-neutral-700"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white">{submission.formName}</h3>
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${getStatusBadge(submission.status)}`}>
                          {submission.status}
                        </span>
                      </div>
                      {submission.submitterName && (
                        <p className="mt-1 text-sm text-neutral-400">
                          From: {submission.submitterName}
                          {submission.submitterEmail && ` (${submission.submitterEmail})`}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-neutral-500">
                        Submitted {format(new Date(submission.submittedAt), "PPp")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedSubmission(submission)}
                      className="rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-700"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-3xl rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {selectedSubmission.formName}
                </h2>
                <p className="mt-1 text-sm text-neutral-400">
                  Submitted {format(new Date(selectedSubmission.submittedAt), "PPp")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedSubmission(null);
                  setReviewNotes("");
                }}
                className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="max-h-[60vh] overflow-y-auto p-6">
              <div className="space-y-6">
                {selectedSubmission.responses.map((response) => (
                  <div key={response.fieldId}>
                    <label className="block text-sm font-medium text-neutral-300">
                      {response.fieldLabel}
                    </label>
                    <div className="mt-1">
                      {response.fieldType === "file-upload" ? (
                        <a
                          href={response.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-orange-400 hover:underline"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          {response.value as string}
                        </a>
                      ) : Array.isArray(response.value) ? (
                        <ul className="mt-1 list-inside list-disc text-sm text-white">
                          {response.value.map((val, idx) => (
                            <li key={idx}>{val as string}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-white">
                          {response.value ? response.value.toString() : "—"}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Review Notes */}
              {selectedSubmission.status === "pending" && (
                <div className="mt-6 border-t border-neutral-800 pt-6">
                  <label className="block text-sm font-medium text-neutral-300">
                    Review Notes (optional for accept, required for reject)
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                    placeholder="Add any notes about this submission..."
                    className="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              )}

              {/* Previous Review Notes (if any) */}
              {selectedSubmission.reviewNotes && (
                <div className="mt-6 rounded-lg border border-neutral-700 bg-neutral-800/50 p-4">
                  <p className="text-xs font-medium text-neutral-400">Review Notes:</p>
                  <p className="mt-1 text-sm text-neutral-300">{selectedSubmission.reviewNotes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {selectedSubmission.status === "pending" && (
              <div className="flex items-center justify-end gap-3 border-t border-neutral-800 px-6 py-4">
                <button
                  type="button"
                  onClick={handleReject}
                  className="rounded-lg border border-red-600 bg-red-900/20 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-900/30"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={handleAccept}
                  className="rounded-lg bg-emerald-500 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-400"
                >
                  Accept & Create Client
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
