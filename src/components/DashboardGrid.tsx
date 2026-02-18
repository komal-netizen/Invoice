"use client";

import { useState, useCallback, useMemo } from "react";
import RGL from "react-grid-layout";
import { useStore } from "@/lib/store";
import type { DashboardWidget } from "@/lib/dashboard-types";
import "react-grid-layout/css/styles.css";

// @ts-ignore - react-grid-layout types are inconsistent
const ResponsiveGridLayout = RGL.Responsive ? RGL.Responsive : RGL;
type Layout = { i: string; x: number; y: number; w: number; h: number; minW?: number; minH?: number; maxW?: number; maxH?: number };

interface DashboardGridProps {
  editMode: boolean;
  onEditWidget: (widgetId: string) => void;
  onDeleteWidget: (widgetId: string) => void;
  children: React.ReactNode[];
}

export function DashboardGrid({
  editMode,
  onEditWidget,
  onDeleteWidget,
  children,
}: DashboardGridProps) {
  const dashboardLayout = useStore((s) => s.dashboardLayout);
  const updateWidgetPosition = useStore((s) => s.updateWidgetPosition);

  // Convert widgets to react-grid-layout format
  const layouts = useMemo(() => {
    const lgLayout: Layout[] = dashboardLayout.widgets
      .filter((w) => w.visible)
      .map((w) => ({
        i: w.id,
        x: w.position.x,
        y: w.position.y,
        w: w.position.w,
        h: w.position.h,
        minW: w.position.minW ?? 2,
        minH: w.position.minH ?? 2,
        maxW: w.position.maxW,
        maxH: w.position.maxH,
      }));

    // Responsive layouts for different breakpoints
    const mdLayout = lgLayout.map((item) => ({
      ...item,
      w: Math.min(item.w, 8), // Reduce width slightly on medium screens
    }));

    const smLayout = lgLayout.map((item) => ({
      ...item,
      x: 0, // Single column on small screens
      w: 6,
    }));

    const xsLayout = lgLayout.map((item) => ({
      ...item,
      x: 0, // Single column on mobile
      w: 4,
    }));

    return {
      lg: lgLayout,
      md: mdLayout,
      sm: smLayout,
      xs: xsLayout,
    };
  }, [dashboardLayout.widgets]);

  const handleLayoutChange = useCallback(
    (currentLayout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
      if (!editMode) return;

      // Update widget positions in the store
      currentLayout.forEach((item) => {
        const widget = dashboardLayout.widgets.find((w) => w.id === item.i);
        if (widget) {
          const newPosition = {
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
            minW: widget.position.minW,
            minH: widget.position.minH,
            maxW: widget.position.maxW,
            maxH: widget.position.maxH,
          };

          // Only update if position actually changed
          if (
            widget.position.x !== newPosition.x ||
            widget.position.y !== newPosition.y ||
            widget.position.w !== newPosition.w ||
            widget.position.h !== newPosition.h
          ) {
            updateWidgetPosition(widget.id, newPosition);
          }
        }
      });
    },
    [editMode, dashboardLayout.widgets, updateWidgetPosition]
  );

  return (
    <ResponsiveGridLayout
      className="dashboard-grid"
      layouts={layouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
      cols={{ lg: 12, md: 8, sm: 6, xs: 4 }}
      rowHeight={60}
      isDraggable={editMode}
      isResizable={editMode}
      compactType="vertical"
      preventCollision={false}
      onLayoutChange={handleLayoutChange}
      draggableHandle=".widget-drag-handle"
      margin={[16, 16]}
      containerPadding={[0, 0]}
    >
      {children}
    </ResponsiveGridLayout>
  );
}

interface WidgetContainerProps {
  widgetId: string;
  editMode: boolean;
  onEdit: () => void;
  onDelete: () => void;
  children: React.ReactNode;
  title?: string;
  showHeader?: boolean;
}

export function WidgetContainer({
  widgetId,
  editMode,
  onEdit,
  onDelete,
  children,
  title,
  showHeader = true,
}: WidgetContainerProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      key={widgetId}
      className="relative h-full rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Edit Mode Controls */}
      {editMode && isHovered && (
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          <button
            onClick={onEdit}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-neutral-600 shadow-md hover:bg-neutral-50 hover:text-orange-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-orange-400 transition-colors"
            title="Configure widget"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-neutral-600 shadow-md hover:bg-red-50 hover:text-red-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-red-950 dark:hover:text-red-400 transition-colors"
            title="Remove widget"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Drag Handle */}
      {editMode && (
        <div className="widget-drag-handle absolute top-2 left-2 z-10 flex h-8 w-8 cursor-move items-center justify-center rounded-lg bg-white text-neutral-400 shadow-md hover:text-neutral-600 dark:bg-neutral-800 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
          </svg>
        </div>
      )}

      {/* Widget Header */}
      {showHeader && title && (
        <div className={`border-b border-neutral-200 px-5 py-3 dark:border-neutral-800 ${editMode ? 'pl-12' : ''}`}>
          <h3 className="text-sm font-medium text-neutral-900 dark:text-white">{title}</h3>
        </div>
      )}

      {/* Widget Content */}
      <div className={`flex-1 overflow-auto ${editMode && !showHeader ? 'pt-12' : ''}`}>
        {children}
      </div>
    </div>
  );
}
