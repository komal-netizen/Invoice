"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { generateWebhookSecret } from "@/lib/webhooks";
import type { WebhookEndpoint } from "@/lib/types";

export default function IntegrationsPage() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [webhookForm, setWebhookForm] = useState({
    url: "",
    events: [] as string[],
  });

  const webhooks = settings.webhookEndpoints ?? [];
  const slackIntegration = settings.slackIntegration;

  const availableEvents = [
    { id: 'invoice.created', label: 'Invoice Created' },
    { id: 'invoice.sent', label: 'Invoice Sent' },
    { id: 'invoice.paid', label: 'Invoice Paid' },
    { id: 'invoice.overdue', label: 'Invoice Overdue' },
    { id: 'client.created', label: 'Client Created' },
    { id: 'project.completed', label: 'Project Completed' },
  ];

  const handleAddWebhook = () => {
    if (!webhookForm.url || webhookForm.events.length === 0) return;

    const newWebhook: WebhookEndpoint = {
      id: crypto.randomUUID(),
      url: webhookForm.url,
      events: webhookForm.events as any[],
      secret: generateWebhookSecret(),
      enabled: true,
      createdAt: new Date().toISOString(),
    };

    updateSettings({
      webhookEndpoints: [...webhooks, newWebhook],
    });

    setWebhookForm({ url: "", events: [] });
    setShowWebhookForm(false);
  };

  const handleToggleWebhook = (id: string) => {
    const updated = webhooks.map((w) =>
      w.id === id ? { ...w, enabled: !w.enabled } : w
    );
    updateSettings({ webhookEndpoints: updated });
  };

  const handleDeleteWebhook = (id: string) => {
    if (!confirm("Delete this webhook?")) return;
    const updated = webhooks.filter((w) => w.id !== id);
    updateSettings({ webhookEndpoints: updated });
  };

  const toggleEvent = (event: string) => {
    setWebhookForm((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  };

  const handleConnectSlack = () => {
    const clientId = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID;
    if (!clientId) {
      alert("Slack Client ID not configured. Please add NEXT_PUBLIC_SLACK_CLIENT_ID to your .env.local file.");
      return;
    }
    
    const redirectUri = `${window.location.origin}/api/slack/oauth`;
    const scope = "commands,chat:write,im:history,channels:history,groups:history";
    
    window.location.href = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  };

  const handleDisconnectSlack = () => {
    if (confirm("Disconnect Slack? You can reconnect anytime.")) {
      updateSettings({ slackIntegration: undefined });
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-semibold text-white">Integrations</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Connect external services and manage webhooks
      </p>

      {/* Webhook Management */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-white">Webhooks</h2>
          <button
            type="button"
            onClick={() => setShowWebhookForm(!showWebhookForm)}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500"
          >
            {showWebhookForm ? "Cancel" : "Add Webhook"}
          </button>
        </div>

        {showWebhookForm && (
          <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="text-sm font-medium text-white">New Webhook</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400">
                  Endpoint URL
                </label>
                <input
                  type="url"
                  value={webhookForm.url}
                  onChange={(e) =>
                    setWebhookForm((prev) => ({ ...prev, url: e.target.value }))
                  }
                  placeholder="https://your-server.com/webhook"
                  className="mt-1 w-full rounded border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400">
                  Events
                </label>
                <div className="mt-2 space-y-2">
                  {availableEvents.map((event) => (
                    <label key={event.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={webhookForm.events.includes(event.id)}
                        onChange={() => toggleEvent(event.id)}
                        className="rounded border-neutral-600 bg-neutral-800 text-orange-600"
                      />
                      <span className="text-sm text-neutral-300">{event.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddWebhook}
                disabled={!webhookForm.url || webhookForm.events.length === 0}
                className="w-full rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Webhook
              </button>
            </div>
          </div>
        )}

        {webhooks.length === 0 && !showWebhookForm ? (
          <p className="mt-4 text-sm text-neutral-500">
            No webhooks configured. Add one to receive real-time events.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm text-white">{webhook.url}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${webhook.enabled ? "bg-emerald-900/40 text-emerald-300" : "bg-neutral-700 text-neutral-400"}`}
                      >
                        {webhook.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-400">
                      Events: {webhook.events.join(", ")}
                    </p>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-neutral-500 hover:text-neutral-400">
                        Show secret
                      </summary>
                      <code className="mt-1 block rounded bg-neutral-800 p-2 font-mono text-xs text-neutral-300">
                        {webhook.secret}
                      </code>
                    </details>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleWebhook(webhook.id)}
                      className="text-sm text-neutral-400 hover:text-white"
                    >
                      {webhook.enabled ? "Disable" : "Enable"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteWebhook(webhook.id)}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Popular Integrations */}
      <section className="mt-12">
        <h2 className="text-lg font-medium text-white">Popular Integrations</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {/* Stripe */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-white">Stripe</h3>
                <p className="mt-1 text-sm text-neutral-400">
                  Accept payments and sync invoices
                </p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs ${!!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? "bg-emerald-900/40 text-emerald-300" : "bg-neutral-700 text-neutral-400"}`}>
                {!!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? "Configured" : "Not configured"}
              </span>
            </div>
          </div>

          {/* Zapier */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-white">Zapier</h3>
                <p className="mt-1 text-sm text-neutral-400">
                  Connect 5,000+ apps via webhooks
                </p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs ${webhooks.length > 0 ? "bg-emerald-900/40 text-emerald-300" : "bg-neutral-700 text-neutral-400"}`}>
                {webhooks.length > 0 ? "Ready" : "Setup required"}
              </span>
            </div>
          </div>

          {/* Slack */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-white">Slack</h3>
                <p className="mt-1 text-sm text-neutral-400">
                  Create tasks from Slack messages
                </p>
                {slackIntegration?.enabled && (
                  <p className="mt-2 text-xs text-neutral-500">
                    Connected to {slackIntegration.workspaceName}
                  </p>
                )}
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs ${slackIntegration?.enabled ? "bg-emerald-900/40 text-emerald-300" : "bg-neutral-700 text-neutral-400"}`}>
                {slackIntegration?.enabled ? "Connected" : "Not connected"}
              </span>
            </div>
            <div className="mt-4 flex gap-2">
              {slackIntegration?.enabled ? (
                <>
                  <Link
                    href="/dashboard/integrations/slack"
                    className="rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
                  >
                    Manage
                  </Link>
                  <button
                    type="button"
                    onClick={handleDisconnectSlack}
                    className="rounded-lg border border-red-600/50 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-950/30"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectSlack}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400"
                >
                  Connect Slack
                </button>
              )}
            </div>
          </div>

          {/* Google Drive */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-white">Google Drive</h3>
                <p className="mt-1 text-sm text-neutral-400">
                  Sync invoices and documents
                </p>
              </div>
              <span className="rounded-full px-2 py-0.5 text-xs bg-neutral-700 text-neutral-400">
                Coming soon
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
