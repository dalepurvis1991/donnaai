import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import EmailCard from "./EmailCard";

interface Email {
  id: number;
  subject: string;
  sender: string;
  senderEmail: string;
  date: string;
  category: string;
  isRead?: boolean;
}

interface EmailColumnProps {
  title: string;
  description: string;
  color: "blue" | "amber" | "emerald";
  emails: Email[];
  count: number;
  isLoading: boolean;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (order: 'asc' | 'desc') => void;
}

export default function EmailColumn({
  title,
  color,
  emails,
  count,
  isLoading,
  sortOrder = 'desc',
  onSortChange
}: EmailColumnProps) {
  const handleSortToggle = () => {
    if (onSortChange) {
      onSortChange(sortOrder === 'asc' ? 'desc' : 'asc');
    }
  };

  const [visibleCount, setVisibleCount] = useState(20);

  const sortedEmails = [...emails].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const displayEmails = sortedEmails.slice(0, visibleCount);
  const hasMore = sortedEmails.length > visibleCount;

  return (
    <div className="flex flex-col gap-4">
      {/* Column Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${color === 'blue' ? 'bg-primary shadow-[0_0_12px_rgba(25,79,240,0.6)]' : color === 'amber' ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]' : 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]'}`}></div>
          <h2 className="text-lg font-bold tracking-tight text-white">{title}</h2>
          <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs font-bold text-slate-500 border border-white/5">{count}</span>
        </div>
        {onSortChange && (
          <button
            onClick={handleSortToggle}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">{sortOrder === 'asc' ? 'south' : 'north'}</span>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 min-h-[400px]">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <Skeleton className="h-4 w-3/4 bg-white/10 mb-3" />
              <Skeleton className="h-3 w-1/2 bg-white/10 mb-4" />
              <Skeleton className="h-6 w-20 bg-white/10 rounded-full" />
            </div>
          ))
        ) : sortedEmails.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 rounded-3xl bg-white/[0.02] border border-dashed border-white/10 text-center">
            <div className="size-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-600 mb-4">
              <span className="material-symbols-outlined">inbox</span>
            </div>
            <p className="text-slate-500 text-sm font-medium">All clear for now</p>
          </div>
        ) : (
          <>
            {displayEmails.map((email) => (
              <EmailCard key={email.id} email={email} color={color} />
            ))}

            {hasMore && (
              <button
                onClick={() => setVisibleCount(prev => prev + 20)}
                className="w-full py-4 mt-2 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-all font-bold text-xs uppercase tracking-widest italic"
              >
                See More Intelligence (+20)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
