'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Search, ChevronDown, ChevronUp, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  /**
   * Optional render function for an expandable sub-component.
   * Renders below the row when the row is clicked.
   */
  renderSubComponent?: (row: TData) => React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = 'Search...',
  renderSubComponent,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [expandedRowIds, setExpandedRowIds] = React.useState<Set<string>>(new Set());

  // Clear expanded rows if data changes to prevent memory leaks from stale IDs
  React.useEffect(() => {
    setExpandedRowIds(new Set());
  }, [data]);

  const toggleRow = (rowId: string) => {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      globalFilter,
    },
  });

  return (
    <div className="space-y-4">
      {/* ToolBar */}
      <div className="flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            placeholder={searchPlaceholder}
            value={globalFilter ?? ''}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-[var(--border-default)] rounded-xl bg-[var(--bg-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--sapphire-500)]/30 focus:border-transparent transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden shadow-[var(--shadow-sm)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left relative">
            <thead className="text-xs text-[var(--text-secondary)] uppercase bg-[var(--bg-base)] border-b border-[var(--border-default)]">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <th
                        key={header.id}
                        className={cn(
                          "px-6 py-4 font-medium whitespace-nowrap",
                          header.column.getCanSort() && "cursor-pointer select-none hover:bg-[var(--bg-base)]/80 transition-colors"
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-2">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                          {header.column.getCanSort() && (
                            <span className="text-[var(--text-tertiary)]">
                              {{
                                asc: <ChevronUp className="w-3.5 h-3.5" />,
                                desc: <ChevronDown className="w-3.5 h-3.5" />,
                              }[header.column.getIsSorted() as string] ?? (
                                <ChevronsUpDown className="w-3.5 h-3.5" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)] relative z-0">
              <AnimatePresence initial={false}>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <React.Fragment key={row.id}>
                      <motion.tr
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        onClick={() => { if (renderSubComponent) toggleRow(row.id); }}
                        className={cn(
                          "transition-colors duration-300 relative",
                          renderSubComponent && "hover:bg-[var(--bg-base)]/40 cursor-pointer",
                          expandedRowIds.has(row.id) ? "z-10 shadow-sm bg-[var(--bg-base)]/20" : "z-0 border-b border-[var(--border-subtle)]"
                        )}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="py-4 px-6 border-none">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </motion.tr>
                      {renderSubComponent && (
                        <AnimatePresence mode="wait">
                          {expandedRowIds.has(row.id) && (
                            <tr
                              className="bg-gradient-to-b from-[var(--bg-base)]/50 to-transparent border-none"
                            >
                              <td colSpan={columns.length} className="p-0 border-none">
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-6 py-4 border-b border-[var(--border-subtle)] shadow-[inset_0_4px_6px_-6px_rgba(0,0,0,0.1)]">
                                    {renderSubComponent(row.original)}
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-8 text-center text-[var(--text-secondary)]">
                      No results found.
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-[var(--text-tertiary)]">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{' '}
          of {table.getFilteredRowModel().rows.length} entries
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer border border-transparent hover:border-[var(--border-subtle)]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer border border-transparent hover:border-[var(--border-subtle)]"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
