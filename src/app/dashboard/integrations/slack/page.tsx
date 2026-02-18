"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function SlackSettingsPage() {
  const router = useRouter();
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const slack = settings.slackIntegration;
  const [copying, setCopying] = useState<string | null>(null);

  const handleDisconnect = () => {
    if (confirm("Disconnect Slack? You can reconnect anytime, but slash commands will stop working.")) {
      updateSettings({ slackIntegration: undefined });
      router.push("/dashboard/integrations");
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopying(label);
    setTimeout(() => setCopying(null), 2000);
  };

  if (!slack?.enabled) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/dashboard/integrations"
            className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white"
            aria-label="Back to integrations"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-semibold text-white">Slack Integration</h1>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800">
            <svg className="h-8 w-8 text-neutral-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-semibold text-white">Connect Slack</h2>
          <p className="mt-2 text-sm text-neutral-400">
            Connect your Slack workspace to create tasks directly from client messages
          </p>
          <button
            onClick={() => router.push("/dashboard/integrations")}
            className="mt-6 rounded-lg bg-orange-500 px-6 py-3 text-sm font-medium text-white hover:bg-orange-400"
          >
            Go to Integrations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard/integrations"
          className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          aria-label="Back to integrations"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-white">Slack Integration</h1>
          <p className="mt-1 text-sm text-neutral-400">Manage your Slack workspace connection</p>
        </div>
      </div>

      {/* Connection Status */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-medium text-white">Connected Workspace</h2>
            <p className="mt-2 text-xl font-semibold text-orange-400">{slack.workspaceName}</p>
            <p className="mt-1 text-sm text-neutral-500">
              Connected on {new Date(slack.connectedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <span className="rounded-full bg-emerald-900/40 px-3 py-1 text-xs font-medium text-emerald-300">
            Active
          </span>
        </div>
      </div>

      {/* Available Commands */}
      <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-lg font-medium text-white">Slash Commands</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Use these commands in any Slack channel to interact with your tasks
        </p>
        
        <div className="mt-4 space-y-4">
          <div className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <code className="rounded bg-neutral-800 px-2 py-1 text-sm font-mono text-orange-400">
                  /create-task [description]
                </code>
                <p className="mt-2 text-sm text-neutral-300">
                  Quickly create a task with optional description
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  Example: <code className="text-neutral-400">/create-task Update homepage design</code>
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <code className="rounded bg-neutral-800 px-2 py-1 text-sm font-mono text-orange-400">
                  /my-tasks
                </code>
                <p className="mt-2 text-sm text-neutral-300">
                  View your assigned tasks (coming soon)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Actions */}
      <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-lg font-medium text-white">Message Actions</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Convert any Slack message into a task
        </p>
        
        <div className="mt-4 rounded-lg border border-neutral-700 bg-neutral-800/50 p-4">
          <h3 className="text-sm font-medium text-white">Create Task from Message</h3>
          <ol className="mt-3 space-y-2 text-sm text-neutral-300">
            <li className="flex gap-2">
              <span className="font-medium text-orange-400">1.</span>
              <span>Hover over any message in Slack</span>
            </li>
            <li className="flex gap-2">
              <span className="font-medium text-orange-400">2.</span>
              <span>Click the three dots menu</span>
            </li>
            <li className="flex gap-2">
              <span className="font-medium text-orange-400">3.</span>
              <span>Select "Create Task from Message"</span>
            </li>
            <li className="flex gap-2">
              <span className="font-medium text-orange-400">4.</span>
              <span>Fill in details and click Create</span>
            </li>
          </ol>
          <p className="mt-3 text-xs text-neutral-500">
            The original message content will be pre-filled in the task description
          </p>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-lg font-medium text-white">Setup Instructions</h2>
        <p className="mt-1 text-sm text-neutral-400">
          To enable message actions, configure your Slack app settings
        </p>
        
        <div className="mt-4 space-y-3">
          <div>
            <p className="text-sm font-medium text-neutral-300">1. Go to Slack API settings</p>
            <a
              href="https://api.slack.com/apps"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm text-orange-400 hover:underline"
            >
              api.slack.com/apps →
            </a>
          </div>
          
          <div>
            <p className="text-sm font-medium text-neutral-300">2. Add Interactivity</p>
            <p className="mt-1 text-xs text-neutral-500">Enable Interactivity & Shortcuts</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 rounded bg-neutral-800 px-3 py-2 text-xs text-neutral-300 font-mono">
                {typeof window !== "undefined" ? window.location.origin : ""}/api/slack/interactions
              </code>
              <button
                onClick={() => handleCopy(
                  `${typeof window !== "undefined" ? window.location.origin : ""}/api/slack/interactions`,
                  "interaction-url"
                )}
                className="rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-neutral-400 hover:text-white"
              >
                {copying === "interaction-url" ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-neutral-300">3. Add Message Action</p>
            <p className="mt-1 text-xs text-neutral-500">Name: "Create Task from Message"</p>
            <p className="mt-1 text-xs text-neutral-500">Callback ID: "create_task_from_message"</p>
          </div>

          <div>
            <p className="text-sm font-medium text-neutral-300">4. Add Slash Commands</p>
            <p className="mt-1 text-xs text-neutral-500">Command: /create-task</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 rounded bg-neutral-800 px-3 py-2 text-xs text-neutral-300 font-mono">
                {typeof window !== "undefined" ? window.location.origin : ""}/api/slack/commands/create-task
              </code>
              <button
                onClick={() => handleCopy(
                  `${typeof window !== "undefined" ? window.location.origin : ""}/api/slack/commands/create-task`,
                  "command-url"
                )}
                className="rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-neutral-400 hover:text-white"
              >
                {copying === "command-url" ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Examples */}
      <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-lg font-medium text-white">How to Use</h2>
        
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-white">Quick Task Creation</h3>
            <p className="mt-2 text-sm text-neutral-400">
              In any Slack channel, type:
            </p>
            <div className="mt-2 rounded-lg bg-neutral-800 p-3">
              <code className="text-sm text-orange-400">/create-task Design new homepage banner</code>
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              A modal will open where you can add more details and set priority
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-white">From Client Message</h3>
            <p className="mt-2 text-sm text-neutral-400">
              When a client sends a request in Slack:
            </p>
            <ol className="mt-2 space-y-1 text-sm text-neutral-400">
              <li>1. Right-click on their message</li>
              <li>2. Select "Create Task from Message"</li>
              <li>3. The message content auto-fills the task</li>
              <li>4. Add project, assignee, and priority</li>
              <li>5. Click Create - task appears in your dashboard!</li>
            </ol>
          </div>

          <div className="rounded-lg border border-orange-500/30 bg-orange-950/20 p-4">
            <div className="flex gap-3">
              <svg className="h-5 w-5 shrink-0 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-orange-400">Pro Tip</p>
                <p className="mt-1 text-sm text-neutral-300">
                  Tasks created from Slack include a link back to the original message, so you never lose context!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Details */}
      <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-lg font-medium text-white">Connection Details</h2>
        
        <div className="mt-4 space-y-3">
          <div>
            <p className="text-xs font-medium text-neutral-400">Workspace ID</p>
            <p className="mt-1 font-mono text-sm text-neutral-300">{slack.workspaceId}</p>
          </div>
          
          <div>
            <p className="text-xs font-medium text-neutral-400">Bot User ID</p>
            <p className="mt-1 font-mono text-sm text-neutral-300">{slack.botUserId}</p>
          </div>
          
          <div>
            <p className="text-xs font-medium text-neutral-400">Scopes</p>
            <p className="mt-1 font-mono text-xs text-neutral-400">{slack.scope}</p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mt-6 rounded-xl border border-red-900/50 bg-red-950/20 p-6">
        <h2 className="text-lg font-medium text-red-400">Danger Zone</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Disconnect your Slack workspace. This will disable all slash commands and message actions.
        </p>
        <button
          onClick={handleDisconnect}
          className="mt-4 rounded-lg border border-red-600 bg-red-950/30 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-950/50"
        >
          Disconnect Slack
        </button>
      </div>
    </div>
  );
}
