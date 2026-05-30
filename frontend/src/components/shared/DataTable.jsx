import React from 'react';
import Skeleton from '../ui/Skeleton';
import { cn } from '../../utils/cn';

const DataTable = ({
  headers = [],
  data = [],
  isLoading = false,
  renderRow,
  emptyMessage = "No records found.",
  className,
}) => {
  return (
    <div className={cn("w-full overflow-hidden border border-slate-800 rounded-xl bg-slate-900/40 shadow-glass", className)}>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {headers.map((header, idx) => (
                <th key={idx} className="px-5 py-4 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {isLoading ? (
              // Render 4 Shimmer Rows if loading
              Array.from({ length: 4 }).map((_, rIdx) => (
                <tr key={rIdx} className="hover:bg-transparent">
                  {headers.map((_, hIdx) => (
                    <td key={hIdx} className="px-5 py-4.5">
                      <Skeleton className="h-4 w-4/5" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-5 py-8 text-center text-slate-500 font-medium">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, idx) => renderRow(item, idx))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
