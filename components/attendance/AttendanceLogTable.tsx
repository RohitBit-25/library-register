'use client';

import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import { CalendarDays, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

interface AttendanceLog {
  date: string;
  day: number;
  month: number;
  dayOfWeek: number;
  count: number;
  rate: number;
}

export function AttendanceLogTable({ data }: { data: AttendanceLog[] }) {
  const columns = useMemo<ColumnDef<AttendanceLog>[]>(() => [
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => {
        const val = row.getValue('date') as string;
        try {
          const dateObj = parseISO(val);
          return (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-accent/10 flex items-center justify-center text-blue-accent">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-text-primary dark:text-text-primary-dark">
                  {format(dateObj, 'EEE, MMM d, yyyy')}
                </span>
              </div>
            </div>
          );
        } catch {
          return val;
        }
      },
    },
    {
      accessorKey: 'count',
      header: 'Check-ins',
      cell: ({ row }) => {
        const count = row.getValue('count') as number;
        return (
          <div className="flex items-center gap-2 font-bold text-text-primary dark:text-text-primary-dark">
            <Users className="w-4 h-4 text-text-tertiary" />
            {count}
          </div>
        );
      },
    },
    {
      accessorKey: 'rate',
      header: 'Turnout Rate',
      cell: ({ row }) => {
        const rate = row.getValue('rate') as number;
        let colorClass = "text-text-secondary dark:text-text-secondary-dark";
        let barClass = "bg-surface-active dark:bg-surface-active-dark";
        
        if (rate >= 80) {
          colorClass = "text-green-500 dark:text-green-400";
          barClass = "bg-green-500";
        } else if (rate >= 40) {
          colorClass = "text-orange-500 dark:text-orange-400";
          barClass = "bg-orange-500";
        } else if (rate > 0) {
          colorClass = "text-red-500 dark:text-red-400";
          barClass = "bg-red-500";
        }

        return (
          <div className="flex items-center gap-3">
            <div className="flex-1 max-w-[100px] h-2 bg-surface-active dark:bg-card-border-dark rounded-full overflow-hidden">
              <div 
                className={cn("h-full rounded-full transition-all duration-500", barClass)}
                style={{ width: `${rate}%` }}
              />
            </div>
            <div className={cn("flex items-center gap-1 font-bold min-w-[50px] justify-end", colorClass)}>
              {rate}%
            </div>
          </div>
        );
      },
    }
  ], []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-text-primary dark:text-text-primary-dark">Attendance History</h3>
          <p className="text-xs font-semibold text-text-tertiary mt-0.5">Detailed view of the last 30 days</p>
        </div>
      </div>
      <DataTable 
        columns={columns} 
        data={data} 
        searchPlaceholder="Search by date..."
      />
    </div>
  );
}
