"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import type { DashboardWidget, StatMetric, QuickAction, ChartView } from "@/lib/dashboard-types";

interface WidgetConfigModalProps {
  widgetId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function WidgetConfigModal({ widgetId, isOpen, onClose }: WidgetConfigModalProps) {
  const dashboardLayout = useStore((s) => s.dashboardLayout);
  const updateWidgetConfig = useStore((s) => s.updateWidgetConfig);
  const toggleWidgetVisibility = useStore((s) => s.toggleWidgetVisibility);

  const widget = widgetId
    ? dashboardLayout.widgets.find((w) => w.id === widgetId)
    : null;

  const [config, setConfig] = useState<any>(widget?.config || {});

  useEffect(() => {
    if (widget) {
      setConfig(widget.config);
    }
  }, [widget]);

  if (!isOpen || !widget) return null;

  const handleSave = () => {
    if (widgetId) {
      updateWidgetConfig(widgetId, config);
      onClose();
    }
  };

  const handleToggleVisibility = () => {
    if (widgetId) {
      toggleWidgetVisibility(widgetId);
      onClose();
    }
  };

  const renderConfigFields = () => {
    switch (widget.type) {
      case "stat-card":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Metric to Display
              </label>
              <select
                value={config.metric || "total-paid"}
                onChange={(e) => setConfig({ ...config, metric: e.target.value as StatMetric })}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
              >
                <option value="total-invoices">Total Invoices</option>
                <option value="total-paid">Total Paid</option>
                <option value="total-outstanding">Outstanding</option>
                <option value="unbilled-work">Unbilled Work</option>
                <option value="overdue-tasks">Overdue Tasks</option>
                <option value="total-clients">Total Clients</option>
                <option value="total-projects">Total Projects</option>
                <option value="total-hours">Total Hours</option>
                <option value="total-services">Total Services</option>
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={config.compact || false}
                  onChange={(e) => setConfig({ ...config, compact: e.target.checked })}
                  className="rounded border-neutral-300 text-orange-500 focus:ring-orange-500 dark:border-neutral-600"
                />
                Compact view
              </label>
            </div>
          </div>
        );

      case "revenue-chart":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Default View
              </label>
              <select
                value={config.view || "weekly"}
                onChange={(e) => setConfig({ ...config, view: e.target.value as ChartView })}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={config.showGrid !== false}
                  onChange={(e) => setConfig({ ...config, showGrid: e.target.checked })}
                  className="rounded border-neutral-300 text-orange-500 focus:ring-orange-500 dark:border-neutral-600"
                />
                Show grid lines
              </label>
            </div>
          </div>
        );

      case "recent-invoices":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Number of Rows
              </label>
              <input
                type="number"
                min="5"
                max="20"
                value={config.rowCount || 8}
                onChange={(e) => setConfig({ ...config, rowCount: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
              />
            </div>
          </div>
        );

      case "action-center":
        return (
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={config.showOverdue !== false}
                  onChange={(e) => setConfig({ ...config, showOverdue: e.target.checked })}
                  className="rounded border-neutral-300 text-orange-500 focus:ring-orange-500 dark:border-neutral-600"
                />
                Show overdue invoices
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={config.showUnbilled !== false}
                  onChange={(e) => setConfig({ ...config, showUnbilled: e.target.checked })}
                  className="rounded border-neutral-300 text-orange-500 focus:ring-orange-500 dark:border-neutral-600"
                />
                Show unbilled work
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={config.showPending !== false}
                  onChange={(e) => setConfig({ ...config, showPending: e.target.checked })}
                  className="rounded border-neutral-300 text-orange-500 focus:ring-orange-500 dark:border-neutral-600"
                />
                Show pending approvals
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Maximum Items
              </label>
              <input
                type="number"
                min="5"
                max="20"
                value={config.maxItems || 10}
                onChange={(e) => setConfig({ ...config, maxItems: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
              />
            </div>
          </div>
        );

      case "activity-feed":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Maximum Items
              </label>
              <input
                type="number"
                min="5"
                max="20"
                value={config.maxItems || 10}
                onChange={(e) => setConfig({ ...config, maxItems: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={config.groupByDate !== false}
                  onChange={(e) => setConfig({ ...config, groupByDate: e.target.checked })}
                  className="rounded border-neutral-300 text-orange-500 focus:ring-orange-500 dark:border-neutral-600"
                />
                Group by date
              </label>
            </div>
          </div>
        );

      case "quick-actions":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Button Size
              </label>
              <select
                value={config.buttonSize || "medium"}
                onChange={(e) => setConfig({ ...config, buttonSize: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Layout
              </label>
              <select
                value={config.layout || "horizontal"}
                onChange={(e) => setConfig({ ...config, layout: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
              >
                <option value="horizontal">Horizontal</option>
                <option value="grid">Grid</option>
              </select>
            </div>
          </div>
        );

      default:
        return (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            No configuration options available for this widget type.
          </p>
        );
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
        {/* Header */}
        <div className="border-b border-neutral-200 p-6 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
              Configure Widget
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400 capitalize">
            {widget.type.replace("-", " ")} settings
          </p>
        </div>

        {/* Content */}
        <div className="p-6">{renderConfigFields()}</div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-200 p-6 dark:border-neutral-800">
          <button
            onClick={handleToggleVisibility}
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
          >
            {widget.visible ? "Hide Widget" : "Show Widget"}
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
