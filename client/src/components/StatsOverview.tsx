import { Card, CardContent } from "@/components/ui/card";
import { Mail, Zap, TrendingUp, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { EmailStats } from "@shared/schema";

interface StatsOverviewProps {
  stats?: EmailStats;
  totalTraces?: number;
  isLoading: boolean;
}

export default function StatsOverview({ stats, totalTraces, isLoading }: StatsOverviewProps) {
  // Use either the dedicated totalTraces or fallback to stats.totalEmails
  const displayTotal = totalTraces ?? stats?.totalEmails ?? 0;

  const cards = [
    {
      label: "Total Traces Indexed",
      value: displayTotal,
      icon: <Mail className="w-5 h-5" />,
      color: "blue",
      trend: "+12% this week"
    },
    {
      label: "AI Categorized",
      value: (stats?.fyiCount || 0) + (stats?.draftCount || 0) + (stats?.forwardCount || 0),
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      color: "amber",
      trend: "4.2s avg processing"
    },
    {
      label: "Productivity Score",
      value: "94%",
      icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
      color: "emerald",
      trend: "Top 5% of users"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-24 bg-white/10" />
              <Skeleton className="h-10 w-10 rounded-xl bg-white/10" />
            </div>
            <Skeleton className="h-10 w-16 bg-white/10" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {cards.map((card, i) => (
        <div key={i} className="group p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>

          <div className="flex items-center justify-between mb-4 relative z-10">
            <p className="text-sm font-medium text-slate-400">{card.label}</p>
            <div className={`size-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-300 group-hover:scale-110 transition-transform`}>
              {card.icon}
            </div>
          </div>

          <div className="relative z-10">
            <p className="text-4xl font-bold tracking-tight mb-2">{card.value}</p>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${card.color === 'emerald' ? 'bg-emerald-500' : card.color === 'amber' ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
              {card.trend}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
