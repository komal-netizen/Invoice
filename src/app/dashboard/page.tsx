"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { DashboardGrid, WidgetContainer } from "@/components/DashboardGrid";
import { WidgetLibrary } from "@/components/WidgetLibrary";
import { WidgetConfigModal } from "@/components/WidgetConfigModal";
import { WidgetRenderer } from "@/components/dashboard-widgets/WidgetRenderer";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { LoadingSkeleton } from "@/components/LoadingState";
import { getAllPresetLayouts } from "@/lib/dashboard-defaults";

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [showPresetSelector, setShowPresetSelector] = useState(false);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);

  const dashboardLayout = useStore((s) => s.dashboardLayout);
  const removeWidget = useStore((s) => s.removeWidget);
  const resetDashboardLayout = useStore((s) => s.resetDashboardLayout);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <LoadingSkeleton className="h-8 w-48 mb-2" />
            <LoadingSkeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="mt-8">
          <LoadingSkeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const visibleWidgets = dashboardLayout.widgets.filter((w) => w.visible);

  const handleEditWidget = (widgetId: string) => {
    setSelectedWidgetId(widgetId);
  };

  const handleDeleteWidget = (widgetId: string) => {
    if (confirm("Are you sure you want to remove this widget?")) {
      removeWidget(widgetId);
    }
  };

  const handleResetLayout = (presetType: string) => {
    if (confirm("This will reset your dashboard to the selected preset. Continue?")) {
      resetDashboardLayout(presetType as any);
      setShowPresetSelector(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            {editMode ? "Drag widgets to rearrange, resize corners to adjust size" : "Your customizable workspace"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setEditMode(!editMode)}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
              editMode
                ? "border-orange-500 bg-orange-500 text-white hover:bg-orange-400"
                : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {editMode ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              )}
            </svg>
            {editMode ? "Done Editing" : "Edit Dashboard"}
          </button>
          {editMode && (
            <>
              <button
                onClick={() => setShowWidgetLibrary(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-400 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Widget
              </button>
              <button
                onClick={() => setShowPresetSelector(!showPresetSelector)}
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 4H5a2 2 0 00-2 2v6a2 2 0 002 2h4m4-10h6a2 2 0 012 2v6a2 2 0 01-2 2h-6m-6 4h6a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2z" />
                </svg>
                Layouts
              </button>
            </>
          )}
        </div>
      </div>

      {/* Preset Selector Dropdown */}
      {showPresetSelector && editMode && (
        <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">
            Choose a Layout Preset
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {getAllPresetLayouts().map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleResetLayout(preset.presetType)}
                className="group rounded-lg border border-neutral-200 bg-white p-4 text-left transition-all hover:border-orange-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:border-orange-700"
              >
                <h4 className="font-medium text-neutral-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  {preset.name}
                </h4>
                <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  {preset.widgets.length} widgets
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Onboarding Checklist */}
      <div className="mt-6">
        <OnboardingChecklist />
      </div>

      {/* Dashboard Grid */}
      {visibleWidgets.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-12 dark:border-neutral-700 dark:bg-neutral-900/50">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950">
            <svg className="h-10 w-10 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 4H5a2 2 0 00-2 2v6a2 2 0 002 2h4m4-10h6a2 2 0 012 2v6a2 2 0 01-2 2h-6m-6 4h6a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
            Customize Your Dashboard
          </h2>
          <p className="mt-2 text-center text-sm text-neutral-600 dark:text-neutral-400 max-w-md">
            Your dashboard is empty. Add widgets to display the information that matters most to you.
          </p>
          <button
            onClick={() => {
              setEditMode(true);
              setShowWidgetLibrary(true);
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-3 text-sm font-medium text-white hover:bg-orange-400 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Your First Widget
          </button>
        </div>
      ) : (
        <div className="mt-8">
          <DashboardGrid
            editMode={editMode}
            onEditWidget={handleEditWidget}
            onDeleteWidget={handleDeleteWidget}
          >
            {visibleWidgets.map((widget) => (
              <div key={widget.id}>
                <WidgetContainer
                  widgetId={widget.id}
                  editMode={editMode}
                  onEdit={() => handleEditWidget(widget.id)}
                  onDelete={() => handleDeleteWidget(widget.id)}
                  title={(widget.config as any).title}
                  showHeader={(widget.config as any).showHeader}
                >
                  <WidgetRenderer widget={widget} />
                </WidgetContainer>
              </div>
            ))}
          </DashboardGrid>
        </div>
      )}

      {/* Widget Library */}
      <WidgetLibrary
        isOpen={showWidgetLibrary}
        onClose={() => setShowWidgetLibrary(false)}
      />

      {/* Widget Config Modal */}
      <WidgetConfigModal
        widgetId={selectedWidgetId}
        isOpen={selectedWidgetId !== null}
        onClose={() => setSelectedWidgetId(null)}
      />
    </div>
  );
}
