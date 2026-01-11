import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DecisionQueueCard } from "@/components/DecisionQueueCard";
import { FlashQuestions } from "@/components/FlashQuestions";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const today = new Date();

  // Fetch email statistics
  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/emails/stats"],
    refetchInterval: 60000,
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/emails/refresh");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orchestrator/brief"] });
      queryClient.invalidateQueries({ queryKey: ["/api/flash-questions"] });
      toast({
        title: "Briefing Refreshed",
        description: "Donna has updated your daily summary.",
      });
    },
  });

  // Fetch orchestrator brief
  const { data: brief, isLoading: briefLoading } = useQuery<any>({
    queryKey: ["/api/orchestrator/brief"],
    refetchInterval: 30000,
  });

  // Fetch pending decisions for the "Waiting Approval" section
  const { data: decisions, isLoading: decisionsLoading } = useQuery<any>({
    queryKey: ["/api/decisions", { status: "pending" }],
  });

  const isLoading = briefLoading || decisionsLoading;

  // Derived stats
  const activePriorities = brief?.priorities || [];
  const decisionCount = brief?.decisionsCount || 0;
  const delegationCount = brief?.delegationsCount || 0;
  const emailCount = brief?.emailCount || 0;

  return (
    <div className="w-full max-w-[1200px] mx-auto p-6 md:p-8 flex flex-col gap-6 pb-20 font-body">
      {/* Flash Questions Carousel */}
      <FlashQuestions />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-primary mb-1">
            <span className="material-symbols-outlined text-lg">auto_awesome</span>
            <span className="text-sm font-bold uppercase tracking-wider">Donna's Daily Brief</span>
          </div>
          <h2 className="text-white text-4xl font-black leading-tight tracking-[-0.02em] font-display">
            Good Morning, {user?.firstName || "Alex"}
          </h2>
          <div className="flex items-center gap-2 text-[#556980] text-xs font-medium mb-2 border border-[#233648] bg-[#111a22] px-2 py-1 rounded w-fit">
            <span className="material-symbols-outlined text-[14px]">analytics</span>
            <span>Based on analysis of {emailCount} emails and {delegationCount} active delegations</span>
          </div>
          <p className="text-[#92adc9] text-base font-normal leading-relaxed max-w-2xl">
            {brief?.donnaVoice || `Here is your summary for ${format(today, "EEEE, MMMM d")}`}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            className="flex items-center justify-center gap-2 bg-[#233648] hover:bg-[#2d445a] text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-all border border-border-dark disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[18px] ${refreshMutation.isPending ? "animate-spin" : ""}`}>refresh</span>
            Refresh Brief
          </button>
          <Link href="/tasks">
            <button className="flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg shadow-blue-500/20">
              <span className="material-symbols-outlined text-[20px]">add</span>
              New Task
            </button>
          </Link>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col rounded-xl border border-primary/30 bg-gradient-to-br from-card-dark to-[#131d27] p-6 relative overflow-hidden group hover:border-primary/50 transition-colors shadow-glow-sm">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined">target</span>
              <span className="text-sm font-bold uppercase">Focus Today</span>
            </div>
            <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded">{activePriorities.length} Items</span>
          </div>
          <h3 className="text-white text-xl font-bold mb-2 relative z-10 font-display">
            {activePriorities.length > 0 ? "Strategic Priorities" : "Clear Schedule"}
          </h3>
          <p className="text-[#92adc9] text-sm relative z-10">
            {activePriorities.length > 0
              ? `You have ${activePriorities.length} key priorities identified by Donna for today.`
              : "No manual priorities set. Donna is handling routine operations."}
          </p>
          <div className="absolute -bottom-4 -right-4 text-primary/5">
            <span className="material-symbols-outlined text-9xl">target</span>
          </div>
        </div>

        <Link href="/decision-feed">
          <div className="flex flex-col h-full cursor-pointer rounded-xl border border-accent-amber/30 bg-gradient-to-br from-card-dark to-[#131d27] p-6 relative overflow-hidden group hover:border-accent-amber/50 transition-colors">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="flex items-center gap-2 text-accent-amber">
                <span className="material-symbols-outlined">rate_review</span>
                <span className="text-sm font-bold uppercase">Needs Input</span>
              </div>
              <span className="bg-accent-amber/10 text-accent-amber text-xs font-bold px-2 py-1 rounded">{decisionCount} Pending</span>
            </div>
            <h3 className="text-white text-xl font-bold mb-2 relative z-10 font-display">Approvals Waiting</h3>
            <p className="text-[#92adc9] text-sm relative z-10">
              {decisionCount > 0
                ? `You have ${decisionCount} items in your decision queue requiring sign-off.`
                : "Your decision queue is empty. Great job!"}
            </p>
            <div className="absolute -bottom-4 -right-4 text-accent-amber/5">
              <span className="material-symbols-outlined text-9xl">rate_review</span>
            </div>
          </div>
        </Link>

        <div className="flex flex-col rounded-xl border border-accent-purple/30 bg-gradient-to-br from-card-dark to-[#131d27] p-6 relative overflow-hidden group hover:border-accent-purple/50 transition-colors">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="flex items-center gap-2 text-accent-purple">
              <span className="material-symbols-outlined">history</span>
              <span className="text-sm font-bold uppercase">Activity</span>
            </div>
            <span className="bg-accent-purple/10 text-accent-purple text-xs font-bold px-2 py-1 rounded">{delegationCount} Active</span>
          </div>
          <h3 className="text-white text-xl font-bold mb-2 relative z-10 font-display">System Status</h3>
          <p className="text-[#92adc9] text-sm relative z-10">
            Donna has processed {emailCount} emails and is managing {delegationCount} active delegations.
          </p>
          <div className="absolute -bottom-4 -right-4 text-accent-purple/5">
            <span className="material-symbols-outlined text-9xl">history</span>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Priorities & Risks) */}
        <div className="flex flex-col gap-8 lg:col-span-2">

          {/* Priorities Section */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-lg font-bold flex items-center gap-2 font-display">
                <span className="material-symbols-outlined text-primary">check_circle</span>
                Today's Priorities
              </h3>
              <span className="text-[#92adc9] text-xs font-medium uppercase tracking-wider">Strategic Focus</span>
            </div>

            <div className="flex flex-col gap-3">
              {activePriorities.length === 0 ? (
                <div className="p-8 rounded-xl border border-border-dark bg-card-dark flex flex-col items-center justify-center text-center opacity-70">
                  <span className="material-symbols-outlined text-4xl text-[#556980] mb-2">event_available</span>
                  <p className="text-[#92adc9]">No high-level priorities identified yet.</p>
                </div>
              ) : (
                activePriorities.map((p: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 p-4 rounded-xl border border-border-dark bg-card-dark hover:border-primary/50 transition-all group cursor-pointer relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <span className="material-symbols-outlined">priority_high</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-bold truncate">{p}</h4>
                        <span className="bg-primary/20 text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded">Top Priority</span>
                      </div>
                      <p className="text-[#92adc9] text-xs truncate">Donna is actively driving this outcome.</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column (Decisions & Suggestions) */}
        <div className="flex flex-col gap-8 lg:col-span-1">
          {/* Waiting Approval - Replaced by Dynamic DecisionQueueCard wrapper but visually similar */}
          {/* Waiting Approval */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-lg font-bold flex items-center gap-2 font-display">
                <span className="material-symbols-outlined text-accent-amber">gavel</span>
                Waiting Approval
              </h3>
              <span className="bg-accent-amber/10 text-accent-amber text-xs font-bold px-2 py-1 rounded-full">{decisions?.length || 0}</span>
            </div>

            <div className="rounded-xl border border-border-dark bg-card-dark p-4 flex flex-col gap-4">
              <p className="text-[#92adc9] text-xs">These items require your specific sign-off before Donna proceeds.</p>

              {decisions?.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {decisions.slice(0, 3).map((d: any) => (
                    <div key={d.id} className="p-3 rounded-lg bg-[#233648] border border-border-dark flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <span className="text-white text-sm font-bold truncate">{d.summary}</span>
                        <span className="text-[10px] text-accent-amber uppercase font-bold border border-accent-amber/20 px-1 rounded">{d.type}</span>
                      </div>
                      <p className="text-[#92adc9] text-xs line-clamp-2">{d.reasoning}</p>
                    </div>
                  ))}
                  {decisions.length > 3 && (
                    <div className="text-center text-[#556980] text-xs font-medium">+{decisions.length - 3} More</div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-4 text-center opacity-50">
                  <span className="material-symbols-outlined text-3xl text-green-500 mb-2">check_circle</span>
                  <p className="text-[#92adc9] text-sm">All clear!</p>
                </div>
              )}

              <Link href="/decision-feed">
                <button className="w-full py-2 rounded-lg bg-[#233648] hover:bg-[#2d445a] text-white text-xs font-bold transition-colors">Review All Pending</button>
              </Link>
            </div>
          </section>

          {/* Suggested Actions */}
          <section className="flex flex-col gap-4">
            <h3 className="text-white text-lg font-bold flex items-center gap-2 font-display">
              <span className="material-symbols-outlined text-accent-emerald">lightbulb</span>
              Suggested Actions
            </h3>
            <div className="flex flex-col gap-3">
              {/* This could also be fetched from an API in the future */}
              <div className="p-4 rounded-xl border border-border-dark bg-card-dark hover:bg-[#1f2e3d] transition-colors cursor-pointer group">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-accent-emerald">
                    <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-white text-sm font-bold group-hover:text-primary transition-colors">Connect more Data Sources</h4>
                    <p className="text-[#92adc9] text-xs mt-1">Donna works best with more context. Add your Calendar or Drive.</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-border-dark bg-card-dark hover:bg-[#1f2e3d] transition-colors cursor-pointer group">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-primary">
                    <span className="material-symbols-outlined text-[20px]">tune</span>
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-white text-sm font-bold group-hover:text-primary transition-colors">Review Confidence Thresholds</h4>
                    <p className="text-[#92adc9] text-xs mt-1">Adjust how aggressive Donna is with autonomous actions in Settings.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
