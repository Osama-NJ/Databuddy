import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type RowData,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronRightIcon,
  DatabaseIcon,
  ListFilterIcon,
  Search,
  X,
} from "lucide-react";
import React, { Fragment, useCallback, useMemo, useRef, useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ArrowsOutSimpleIcon, XIcon, CaretDownIcon, CaretRightIcon } from "@phosphor-icons/react";

interface TabConfig<TData> {
  id: string;
  label: string;
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
}

interface DataTableProps<TData extends { name: string | number }, TValue> {
  data?: TData[] | undefined;
  columns?: ColumnDef<TData, TValue>[];
  tabs?: TabConfig<TData>[];
  title: string;
  description?: string;
  isLoading?: boolean;
  initialPageSize?: number;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (field: string, value: string | number) => void;
  minHeight?: string | number;
  showSearch?: boolean;
  getSubRows?: (row: TData) => TData[] | undefined;
  renderSubRow?: (subRow: TData, parentRow: TData, index: number) => React.ReactNode;
  expandable?: boolean;
  renderTooltipContent?: (row: TData) => React.ReactNode;
}

function getRowPercentage(row: any): number {
  if (row.marketShare !== undefined) return Number.parseFloat(row.marketShare) || 0;
  if (row.percentage !== undefined) return Number.parseFloat(row.percentage) || 0;
  if (row.percent !== undefined) return Number.parseFloat(row.percent) || 0;
  if (row.share !== undefined) return Number.parseFloat(row.share) || 0;
  return 0;
}

function getPercentageGradient(percentage: number): {
  background: string;
  hoverBackground: string;
  borderColor: string;
  accentColor: string;
  glowColor: string;
} {
  if (percentage >= 50) {
    return {
      background: `linear-gradient(90deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.15) ${percentage * 0.8}%, rgba(34, 197, 94, 0.12) ${percentage}%, rgba(34, 197, 94, 0.02) ${percentage + 5}%, transparent 100%)`,
      hoverBackground: `linear-gradient(90deg, rgba(34, 197, 94, 0.12) 0%, rgba(34, 197, 94, 0.22) ${percentage * 0.8}%, rgba(34, 197, 94, 0.18) ${percentage}%, rgba(34, 197, 94, 0.04) ${percentage + 5}%, transparent 100%)`,
      borderColor: "rgba(34, 197, 94, 0.3)",
      accentColor: "rgba(34, 197, 94, 0.8)",
      glowColor: "rgba(34, 197, 94, 0.2)",
    };
  }
  if (percentage >= 25) {
    return {
      background: `linear-gradient(90deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.15) ${percentage * 0.8}%, rgba(59, 130, 246, 0.12) ${percentage}%, rgba(59, 130, 246, 0.02) ${percentage + 5}%, transparent 100%)`,
      hoverBackground: `linear-gradient(90deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.22) ${percentage * 0.8}%, rgba(59, 130, 246, 0.18) ${percentage}%, rgba(59, 130, 246, 0.04) ${percentage + 5}%, transparent 100%)`,
      borderColor: "rgba(59, 130, 246, 0.3)",
      accentColor: "rgba(59, 130, 246, 0.8)",
      glowColor: "rgba(59, 130, 246, 0.2)",
    };
  }
  if (percentage >= 10) {
    return {
      background: `linear-gradient(90deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.15) ${percentage * 0.8}%, rgba(245, 158, 11, 0.12) ${percentage}%, rgba(245, 158, 11, 0.02) ${percentage + 5}%, transparent 100%)`,
      hoverBackground: `linear-gradient(90deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.22) ${percentage * 0.8}%, rgba(245, 158, 11, 0.18) ${percentage}%, rgba(245, 158, 11, 0.04) ${percentage + 5}%, transparent 100%)`,
      borderColor: "rgba(245, 158, 11, 0.3)",
      accentColor: "rgba(245, 158, 11, 0.8)",
      glowColor: "rgba(245, 158, 11, 0.2)",
    };
  }
  return {
    background: `linear-gradient(90deg, rgba(107, 114, 128, 0.06) 0%, rgba(107, 114, 128, 0.12) ${percentage * 0.8}%, rgba(107, 114, 128, 0.1) ${percentage}%, rgba(107, 114, 128, 0.02) ${percentage + 5}%, transparent 100%)`,
    hoverBackground: `linear-gradient(90deg, rgba(107, 114, 128, 0.1) 0%, rgba(107, 114, 128, 0.18) ${percentage * 0.8}%, rgba(107, 114, 128, 0.15) ${percentage}%, rgba(107, 114, 128, 0.03) ${percentage + 5}%, transparent 100%)`,
    borderColor: "rgba(107, 114, 128, 0.2)",
    accentColor: "rgba(107, 114, 128, 0.7)",
    glowColor: "rgba(107, 114, 128, 0.15)",
  };
}

const EnhancedSkeleton = ({ minHeight }: { minHeight: string | number }) => (
  <div className="animate-pulse space-y-3" style={{ minHeight }}>
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-24 rounded-md" />
      <Skeleton className="h-8 w-32 rounded-lg" />
    </div>
    <div className="space-y-2">
      {Array.from({ length: 5 }, (_, index) => index).map((itemIndex) => (
        <div
          className="flex animate-pulse items-center space-x-4 rounded-lg bg-muted/20 p-3"
          key={`skeleton-${itemIndex}`}
        >
          <Skeleton className="h-6 w-6 flex-shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full rounded-md" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-3 w-16 rounded-sm" />
              <Skeleton className="h-3 w-12 rounded-sm" />
              <Skeleton className="h-3 w-8 rounded-sm" />
            </div>
          </div>
          <div className="space-y-1 text-right">
            <Skeleton className="h-4 w-12 rounded-md" />
            <Skeleton className="h-3 w-8 rounded-sm" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

function FullScreenTable<TData extends { name: string | number }, TValue>({
  data,
  columns,
  search,
  onClose,
  initialPageSize = 50,
  expandable = false,
  getSubRows,
  renderSubRow,
}: {
  data: TData[];
  columns: any[];
  search: string;
  onClose: () => void;
  initialPageSize?: number;
  expandable?: boolean;
  getSubRows?: (row: TData) => TData[] | undefined;
  renderSubRow?: (subRow: TData, parentRow: TData, index: number) => React.ReactNode;
}) {
  const [globalFilter, setGlobalFilter] = useState(search);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  // Tooltip for truncated cell
  const [tooltip, setTooltip] = useState<{ value: string; x: number; y: number } | null>(null);
  const handleCellMouseEnter = (e: React.MouseEvent, value: string) => {
    const target = e.currentTarget as HTMLElement;
    if (target.scrollWidth > target.clientWidth) {
      const rect = target.getBoundingClientRect();
      setTooltip({ value, x: rect.left + rect.width / 2, y: rect.top });
    }
  };
  const handleCellMouseLeave = () => setTooltip(null);
  const toggleRowExpansion = (rowId: string) => {
    setExpandedRow(prev => (prev === rowId ? null : rowId));
  };
  return (
    <div className="flex flex-col h-full w-full bg-background relative">
      {/* Floating close button */}
      <button
        type="button"
        aria-label="Close full screen"
        title="Close"
        className="absolute top-4 right-4 z-30 flex items-center justify-center rounded bg-muted/30 p-2 text-muted-foreground hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition shadow"
        onClick={onClose}
        tabIndex={0}
      >
        <XIcon size={20} />
      </button>
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background sticky top-0 z-10">
        <input
          aria-label="Search table"
          className="h-9 w-80 border rounded px-4 text-base focus:ring focus:ring-primary/20 bg-muted/20"
          placeholder="Filter data..."
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
        />
      </div>
      <div className="flex-1 overflow-auto">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 bg-background z-10">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, cellIndex) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 border-b border-border font-semibold text-left bg-background select-none cursor-pointer"
                    style={{ position: 'sticky', top: 0, background: 'inherit', zIndex: 2 }}
                    onClick={header.column.getToggleSortingHandler()}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        header.column.getToggleSortingHandler()?.(e as any);
                      }
                    }}
                  >
                    {expandable && cellIndex === 0 && <span className="inline-block w-5" />}
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc' ? ' ▲' : header.column.getIsSorted() === 'desc' ? ' ▼' : ''}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.slice(0, initialPageSize).map((row, rowIndex) => {
              const rowId = row.id;
              const subRows = expandable && getSubRows ? getSubRows(row.original) : undefined;
              const hasSubRows = subRows && subRows.length > 0;
              const isExpanded = expandedRow === rowId;
              return (
                <React.Fragment key={rowId}>
                  <tr
                    className={`transition hover:bg-primary/5 cursor-pointer${selectedRow === rowId ? " bg-primary/10" : ""}`}
                    onClick={e => {
                      setSelectedRow(rowId);
                      if (hasSubRows) {
                        // Don't toggle if the click is on a button (icon)
                        if (!(e.target as HTMLElement).closest('button')) {
                          toggleRowExpansion(rowId);
                        }
                      }
                    }}
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedRow(rowId);
                        if (hasSubRows) {
                          toggleRowExpansion(rowId);
                        }
                      }
                    }}
                  >
                    {row.getVisibleCells().map((cell, cellIndex) => (
                      <td
                        key={cell.id}
                        className="px-4 py-2 border-b border-border truncate max-w-xs relative group"
                        onMouseEnter={e => handleCellMouseEnter(e, String(cell.getValue() ?? ""))}
                        onMouseLeave={handleCellMouseLeave}
                      >
                        <span className="flex items-center gap-1">
                          {expandable && cellIndex === 0 && hasSubRows && (
                            <button
                              type="button"
                              aria-label={isExpanded ? "Collapse row" : "Expand row"}
                              className="mr-1 flex-shrink-0 rounded p-0.5 transition-colors hover:bg-muted"
                              onClick={e => {
                                e.stopPropagation();
                                toggleRowExpansion(rowId);
                              }}
                              tabIndex={0}
                              onKeyDown={e => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  toggleRowExpansion(rowId);
                                }
                              }}
                            >
                              {isExpanded ? (
                                <CaretDownIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              ) : (
                                <CaretRightIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </button>
                          )}
                          <span className="block truncate">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </span>
                        </span>
                      </td>
                    ))}
                  </tr>
                  {hasSubRows && isExpanded && subRows.filter(Boolean).map((subRow, subIndex) => {
                    const subKey = (subRow as any)._uniqueKey || `${rowId}-sub-${subIndex}`;
                    return (
                      <tr key={subKey} className="bg-muted/5">
                        <td colSpan={row.getVisibleCells().length} className="p-0">
                          {renderSubRow
                            ? renderSubRow(subRow, row.original, subIndex)
                            : (
                              <div className="px-6 py-2 text-sm">
                                {JSON.stringify(subRow)}
                              </div>
                            )}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {/* Tooltip for truncated cell */}
        {tooltip && (
          <div
            className="fixed z-50 px-3 py-1 rounded bg-foreground text-background text-xs shadow-lg pointer-events-none"
            style={{ left: tooltip.x, top: tooltip.y - 32, transform: "translateX(-50%)" }}
          >
            {tooltip.value}
          </div>
        )}
      </div>
    </div>
  );
}

export function DataTable<TData extends { name: string | number }, TValue>({
  data,
  columns,
  tabs,
  title,
  description,
  isLoading = false,
  initialPageSize,
  emptyMessage = "No data available",
  className,
  onRowClick,
  minHeight = 200,
  showSearch = true,
  getSubRows,
  renderSubRow,
  expandable = false,
  renderTooltipContent,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [activeTab, setActiveTab] = useState(tabs?.[0]?.id || "");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [tooltipState, setTooltipState] = useState<{
    visible: boolean;
    content: React.ReactNode;
  }>({ visible: false, content: null });
  const [fullScreen, setFullScreen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const lastFocusedElement = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Focus trap and restore
  useEffect(() => {
    if (!fullScreen) return;
    lastFocusedElement.current = document.activeElement as HTMLElement;
    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable?.length) focusable[0].focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullScreen(false);
      if (e.key === "Tab" && focusable && focusable.length) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      lastFocusedElement.current?.focus();
    };
  }, [fullScreen]);

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentTabData = tabs?.find((tab) => tab.id === activeTab);
  const tableData = React.useMemo(
    () => currentTabData?.data || data || [],
    [currentTabData?.data, data]
  );
  const tableColumns = React.useMemo(
    () => currentTabData?.columns || columns || [],
    [currentTabData?.columns, columns]
  );

  const table = useReactTable({
    data: tableData,
    columns: tableColumns,
    getRowId: (row, index) => {
      if ((row as any)._uniqueKey) {
        return (row as any)._uniqueKey;
      }
      return activeTab ? `${activeTab}-${index}` : `row-${index}`;
    },
    state: {
      sorting,
      globalFilter: showSearch ? globalFilter : "",
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const displayData = table.getRowModel().rows;

  const getFieldFromTabId = (tabId: string): string => {
    const mapping: Record<string, string> = {
      errors_by_page: "path",
      errors_by_browser: "browser_name",
      errors_by_os: "os_name",
      errors_by_country: "country",
      errors_by_device: "device_type",
      error_types: "error_message",
    };
    return mapping[tabId] || "name";
  };

  const toggleRowExpansion = useCallback((rowId: string) => {
    setExpandedRow(prev => (prev === rowId ? null : rowId));
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (tooltipRef.current && tableContainerRef.current) {
      const rect = tableContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      requestAnimationFrame(() => {
        if (tooltipRef.current) {
          tooltipRef.current.style.transform = `translate(${x + 16}px, ${y}px) translateY(-50%)`;
        }
      });
    }
  }, []);

  const handleRowMouseEnter = useCallback(
    (row: TData, rowId: string) => {
      if (!renderTooltipContent) return;
      const content = renderTooltipContent(row);
      setTooltipState({ visible: true, content });
      setHoveredRow(rowId);
    },
    [renderTooltipContent]
  );

  const handleMouseLeave = useCallback(() => {
    if (!renderTooltipContent) return;
    setTooltipState({ visible: false, content: null });
    setHoveredRow(null);
  }, [renderTooltipContent]);

  const handleTabChange = React.useCallback(
    (tabId: string) => {
      if (tabId === activeTab) return;

      setIsTransitioning(true);
      setTimeout(() => {
        setActiveTab(tabId);
        setGlobalFilter("");
        setExpandedRow(null);
        setIsTransitioning(false);
      }, 150);
    },
    [activeTab]
  );

  if (isLoading) {
    return (
      <Card
        className={cn(
          "w-full overflow-hidden border bg-card/50 shadow-sm backdrop-blur-sm",
          className
        )}
      >
        <CardHeader className="px-2 pb-2 sm:px-3">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
            <div className="min-w-0 flex-1">
              <Skeleton className="h-5 w-32 rounded-md" />
              {description && <Skeleton className="mt-0.5 h-3 w-48 rounded-sm" />}
            </div>
            {showSearch && (
              <div className="flex-shrink-0">
                <Skeleton className="h-7 w-36 rounded-md" />
              </div>
            )}
          </div>

          {tabs && tabs.length > 1 && (
            <div className="mt-3">
              <div className="flex gap-0.5 rounded-lg bg-muted/20 p-0.5">
                {tabs.map((tab) => (
                  <Skeleton className="h-8 w-20 rounded-md" key={tab.id} />
                ))}
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="px-2 pb-2 sm:px-3">
          <EnhancedSkeleton minHeight={minHeight} />
        </CardContent>
      </Card>
    );
  }

  // Extracted table content for DRYness
  const renderTableContent = () => (
    <>
      <CardHeader className="px-2 pb-2 sm:px-3">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-foreground text-sm">{title}</h3>
            {description && (
              <p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {showSearch && (
              <div className="relative w-full flex-shrink-0 sm:w-auto">
                <Search className="-translate-y-1/2 absolute top-1/2 left-2 h-3 w-3 transform text-muted-foreground/50" />
                <Input
                  aria-label={`Search ${title}`}
                  className="h-7 w-full border-0 bg-muted/30 pr-2 pl-7 text-xs focus:bg-background focus:ring-1 focus:ring-primary/20 sm:w-36"
                  onChange={(event) => setGlobalFilter(event.target.value)}
                  placeholder="Filter data..."
                  value={globalFilter ?? ""}
                />
              </div>
            )}
            {!fullScreen && (
              <button
                type="button"
                aria-label="Full screen"
                title="Full screen"
                className="ml-2 flex items-center justify-center rounded bg-muted/30 p-2 text-muted-foreground hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
                onClick={() => setFullScreen(true)}
              >
                <ArrowsOutSimpleIcon size={18} weight="duotone" />
              </button>
            )}
          </div>
        </div>

        {tabs && tabs.length > 1 && (
          <div className="mt-3 overflow-hidden">
            <div className="-mb-1 overflow-x-auto pb-1">
              <nav
                aria-label="Data view options"
                className="inline-flex gap-0.5 rounded bg-muted/40 p-0.5"
                role="tablist"
              >
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const itemCount = tab?.data?.length || 0;

                  return (
                    <button
                      aria-controls={`tabpanel-${tab.id}`}
                      aria-selected={isActive}
                      className={cn(
                        "flex items-center gap-1 rounded-md px-2.5 py-1.5 font-medium text-xs transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1",
                        "disabled:opacity-60",
                        isActive
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                      )}
                      disabled={isTransitioning}
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      role="tab"
                      tabIndex={isActive ? 0 : -1}
                      type="button"
                    >
                      <span>{tab.label}</span>
                      {itemCount > 0 && (
                        <span
                          className={cn(
                            "inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 font-semibold text-[10px]",
                            isActive
                              ? "bg-primary/15 text-primary"
                              : "bg-muted-foreground/20 text-muted-foreground/70"
                          )}
                        >
                          {itemCount > 99 ? "99+" : itemCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="overflow-hidden px-2 pb-2 sm:px-3">
        <div
          className={cn(
            "relative transition-all duration-300 ease-out",
            isTransitioning && "scale-[0.98] opacity-40"
          )}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
          ref={tableContainerRef}
        >
          <AnimatePresence>
            {renderTooltipContent && tooltipState.visible && (
              <motion.div
                ref={tooltipRef}
                animate={{ opacity: 1, scale: 1 }}
                className="pointer-events-none absolute z-30"
                exit={{ opacity: 0, scale: 0.9 }}
                initial={{ opacity: 0, scale: 0.9 }}
                style={{
                  top: 0,
                  left: 0,
                }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                {tooltipState.content}
              </motion.div>
            )}
          </AnimatePresence>
          {isTransitioning && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
              <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/80 px-3 py-2 shadow-sm">
                <div className="h-3 w-3 animate-pulse rounded-full bg-primary/60" />
                <span className="font-medium text-muted-foreground text-xs">Loading...</span>
              </div>
            </div>
          )}

          {table.getRowModel().rows.length ? (
            <div
              aria-labelledby={`tab-${activeTab}`}
              className="relative overflow-auto rounded-md border border-border/50 bg-background/50 sm:rounded-lg"
              id={`tabpanel-${activeTab}`}
              role="tabpanel"
              style={{ height: minHeight }}
            >
              <Table className="w-full table-fixed">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow
                      className="sticky top-0 z-10 border-border/30 bg-muted/20"
                      key={headerGroup.id}
                    >
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          aria-sort={
                            header.column.getIsSorted() === "asc"
                              ? "ascending"
                              : header.column.getIsSorted() === "desc"
                                ? "descending"
                                : header.column.getCanSort()
                                  ? "none"
                                  : undefined
                          }
                          className={cn(
                            "h-11 bg-muted/20 px-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide backdrop-blur-sm sm:px-4",
                            (header.column.columnDef.meta as any)?.className,
                            header.column.getCanSort()
                              ? "group cursor-pointer select-none transition-all duration-200 hover:bg-muted/30 hover:text-foreground"
                              : "select-none"
                          )}
                          key={header.id}
                          onClick={header.column.getToggleSortingHandler()}
                          role={header.column.getCanSort() ? "button" : undefined}
                          style={{
                            width:
                              header.getSize() !== 150
                                ? `${Math.min(header.getSize(), 300)}px`
                                : undefined,
                            maxWidth: "300px",
                            minWidth: "80px",
                          }}
                          tabIndex={header.column.getCanSort() ? 0 : -1}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="truncate">
                              {header.isPlaceholder
                                ? null
                                : flexRender(header.column.columnDef.header, header.getContext())}
                            </span>
                            {header.column.getCanSort() && (
                              <div className="flex h-3 w-3 flex-col items-center justify-center">
                                {!header.column.getIsSorted() && (
                                  <ArrowUpDown className="h-3 w-3 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground/70" />
                                )}
                                {header.column.getIsSorted() === "asc" && (
                                  <ArrowUp className="h-3 w-3 text-primary" />
                                )}
                                {header.column.getIsSorted() === "desc" && (
                                  <ArrowDown className="h-3 w-3 text-primary" />
                                )}
                              </div>
                            )}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="overflow-hidden">
                  {displayData.map((row, rowIndex) => {
                    const subRows = expandable && getSubRows ? getSubRows(row.original) : undefined;
                    const hasSubRows = subRows && subRows.length > 0;
                    const isExpanded = expandedRow === row.id;
                    const percentage = getRowPercentage(row.original);
                    const gradient = getPercentageGradient(percentage);

                    return (
                      <Fragment key={row.id}>
                        <TableRow
                          className={cn(
                            "relative h-12 border-border/20 transition-all duration-300 ease-in-out",
                            (onRowClick && !hasSubRows) || hasSubRows ? "cursor-pointer" : "",
                            hoveredRow && hoveredRow !== row.id
                              ? "opacity-40 grayscale-[80%]"
                              : "opacity-100",
                            !hoveredRow && (rowIndex % 2 === 0 ? "bg-background/50" : "bg-muted/10")
                          )}
                          onClick={() => {
                            if (hasSubRows) {
                              toggleRowExpansion(row.id);
                            }
                          }}
                          onMouseEnter={() => handleRowMouseEnter(row.original, row.id)}
                          style={{
                            background:
                              !hoveredRow && percentage > 0 ? gradient.background : undefined,
                            boxShadow:
                              !hoveredRow && percentage > 0
                                ? `inset 3px 0 0 0 ${gradient.accentColor}`
                                : undefined,
                          }}
                        >
                          {row.getVisibleCells().map((cell, cellIndex) => (
                            <TableCell
                              className={cn(
                                "px-2 py-3 font-medium text-sm transition-colors duration-150 sm:px-4",
                                cellIndex === 0 && "font-semibold text-foreground",
                                (cell.column.columnDef.meta as any)?.className
                              )}
                              key={cell.id}
                              style={{
                                width:
                                  cell.column.getSize() !== 150
                                    ? `${Math.min(cell.column.getSize(), 300)}px`
                                    : undefined,
                                maxWidth: "300px",
                                minWidth: "80px",
                              }}
                            >
                              <div className="flex items-center gap-2">
                                {cellIndex === 0 && hasSubRows && (
                                  <button
                                    aria-label={isExpanded ? "Collapse row" : "Expand row"}
                                    className="flex-shrink-0 rounded p-0.5 transition-colors hover:bg-muted"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleRowExpansion(row.id);
                                    }}
                                    type="button"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                    ) : (
                                      <ChevronRightIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                    )}
                                  </button>
                                )}
                                <div className="flex-1 overflow-hidden truncate">
                                  <div className="truncate">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          ))}
                        </TableRow>

                        {hasSubRows &&
                          isExpanded &&
                          subRows.map((subRow, subIndex) => (
                            <TableRow
                              className="border-border/10 bg-muted/5 transition-colors hover:bg-muted/10"
                              key={`${row.id}-sub-${subIndex}`}
                            >
                              {renderSubRow ? (
                                <TableCell className="p-0" colSpan={row.getVisibleCells().length}>
                                  {renderSubRow(subRow, row.original, subIndex)}
                                </TableCell>
                              ) : (
                                row.getVisibleCells().map((cell, cellIndex) => (
                                  <TableCell
                                    className={cn(
                                      "py-2 text-muted-foreground text-sm",
                                      cellIndex === 0 ? "pl-8" : "px-3"
                                    )}
                                    key={`sub-${cell.id}`}
                                    style={{
                                      width:
                                        cell.column.getSize() !== 150
                                          ? `${Math.min(cell.column.getSize(), 300)}px`
                                          : undefined,
                                      maxWidth: "300px",
                                      minWidth: "80px",
                                    }}
                                  >
                                    <div className="truncate">
                                      {cellIndex === 0 ? (
                                        <span className="text-xs">
                                          ↳ {(subRow as any)[cell.column.id] || ""}
                                        </span>
                                      ) : (
                                        (subRow as any)[cell.column.id] || ""
                                      )}
                                    </div>
                                  </TableCell>
                                ))
                              )}
                            </TableRow>
                          ))}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-8 text-center sm:py-16"
              style={{ minHeight }}
            >
              <div className="mb-4">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/20">
                  {globalFilter ? (
                    <Search className="h-7 w-7 text-muted-foreground/50" />
                  ) : (
                    <DatabaseIcon className="h-7 w-7 text-muted-foreground/50" />
                  )}
                </div>
              </div>
              <h4 className="mb-2 font-medium text-base text-foreground">
                {globalFilter ? "No results found" : emptyMessage}
              </h4>
              <p className="mb-4 max-w-sm text-muted-foreground text-sm">
                {globalFilter
                  ? `No data matches your search for "${globalFilter}". Try adjusting your search terms.`
                  : "Data will appear here when available and ready to display."}
              </p>
              {globalFilter && (
                <button
                  className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 font-medium text-primary text-sm transition-colors hover:bg-primary/15 hover:text-primary/80"
                  onClick={() => setGlobalFilter("")}
                  type="button"
                >
                  <X className="h-4 w-4" />
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </>
  );

  return (
    <>
      <Card
        className={cn(
          "w-full overflow-hidden border bg-card/50 shadow-sm backdrop-blur-sm",
          className
        )}
      >
        {renderTableContent()}
      </Card>
      {hasMounted && fullScreen && ReactDOM.createPortal(
        <div
          ref={modalRef}
          tabIndex={-1}
          className="fixed inset-0 z-[1000] flex items-center justify-center"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[3px] transition-opacity animate-fadein" />
          {/* Modal */}
          <div className="relative w-[92vw] h-[92vh] bg-background rounded-2xl shadow-2xl flex flex-col scale-100 animate-scalein overflow-hidden border border-border border-[1px]">
            <FullScreenTable
              data={tableData}
              columns={tableColumns}
              search={globalFilter}
              onClose={() => setFullScreen(false)}
              initialPageSize={50}
              expandable={expandable}
              getSubRows={getSubRows}
              renderSubRow={renderSubRow}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}




