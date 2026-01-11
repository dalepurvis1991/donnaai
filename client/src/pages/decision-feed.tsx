import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { DecisionDetailSheet } from "@/components/DecisionDetailSheet";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";

export default function DecisionFeed() {
    const { user } = useAuth();
    const { toast } = useToast();

    // Fetch decisions/feed items
    const { data: decisions, isLoading } = useQuery<any>({
        queryKey: ["/api/decisions"],
        refetchInterval: 15000,
    });

    // Mutation for resolving decisions
    const resolveMutation = useMutation({
        mutationFn: async ({ id, status, feedback }: { id: number, status: string, feedback?: string }) => {
            await apiRequest("POST", `/api/decisions/${id}/resolve`, { status, feedback });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/decisions"] });
            queryClient.invalidateQueries({ queryKey: ["/api/orchestrator/brief"] });
            toast({ title: "Decision Processed", description: "The system has been updated successfully." });
            setSelectedDecision(null);
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to resolve decision.", variant: "destructive" });
        }
    });

    // Map API data to Feed Items structure
    const feedItems = decisions?.map((d: any) => ({
        id: d.id,
        type: d.type === 'blocked' ? 'blocked' : 'review',
        title: d.summary || "Pending Decision",
        timestamp: new Date(d.createdAt),
        description: d.description || d.riskNotes || d.reasoning || "Action required.",
        meta: {
            label: d.priority === 'high' ? 'Urgent' : 'Review',
            color: d.priority === 'high' ? 'red' : 'primary'
        },
        confidence: d.metadata?.confidenceUsed || 0,
        reasoning: d.riskNotes ? `Identified risk: ${d.riskNotes}` : "Requires manual approval due to sensitive category.",
        subtitle: d.metadata?.emailSubject || "",
        actions: [
            { label: "Dismiss", variant: "ghost" },
            { label: "Resolve", variant: "primary", icon: "check_circle" }
        ]
    })) || [];

    // State for selected decision
    const [selectedDecision, setSelectedDecision] = useState<any>(null);

    if (isLoading) {
        return <div className="p-12 text-center text-[#92adc9]">Loading feed...</div>;
    }

    return (
        <div className="w-full max-w-3xl mx-auto p-6 md:p-8 flex flex-col gap-6 pb-20 font-body">
            {/* Header */}
            <div className="sticky top-0 z-10 w-full bg-background-dark/95 backdrop-blur-sm border-b border-border-dark px-6 py-4 md:px-8 flex items-center justify-between -mx-6 md:-mx-8">
                <div className="flex flex-col">
                    <h2 className="text-white text-2xl font-bold leading-tight flex items-center gap-3 font-display">
                        Decision Feed
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-mono font-medium border border-blue-500/20">{feedItems.length} Active Items</span>
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <p className="text-[#92adc9] text-xs font-medium">Donna is online & monitoring</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-[#92adc9] hover:text-white hover:bg-[#233648] transition-colors">
                        <span className="material-symbols-outlined text-[18px]">filter_list</span>
                        Filter
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-[#92adc9] hover:text-white hover:bg-[#233648] transition-colors">
                        <span className="material-symbols-outlined text-[18px]">history</span>
                        History
                    </button>
                </div>
            </div>

            {/* Feed Items */}
            <div className="flex flex-col gap-6 pt-4">
                {feedItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center opacity-70">
                        <div className="h-16 w-16 rounded-full bg-[#233648] flex items-center justify-center text-primary mb-4 shadow-glow-sm">
                            <span className="material-symbols-outlined text-3xl animate-pulse">psychology</span>
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1">Donna is Online</h3>
                        <p className="text-[#92adc9] text-sm max-w-sm">
                            I am actively monitoring your business intelligence protocols. No critical decisions require your attention at this moment.
                        </p>
                    </div>
                ) : (
                    feedItems.map((item: any) => {
                        const isBlocked = item.type === 'blocked';
                        const isReview = item.type === 'task_approval' || item.type === 'review';
                        const isLowConf = item.type === 'low_confidence';
                        const isNotif = item.type === 'notification';

                        // Dynamic styles based on type
                        let borderColor = "border-border-dark";
                        let hoverBorder = "hover:border-primary/40";
                        let barColor = "bg-primary";
                        let iconBg = "bg-primary/10";
                        let iconText = "text-primary";
                        let icon = "rate_review";

                        if (isBlocked) {
                            borderColor = "border-red-500/30";
                            hoverBorder = "hover:border-red-500/50";
                            barColor = "bg-red-500";
                            iconBg = "bg-red-500/10";
                            iconText = "text-red-500";
                            icon = "block";
                        } else if (isLowConf) {
                            borderColor = "border-border-dark";
                            hoverBorder = "hover:border-orange-500/40";
                            barColor = "bg-orange-400";
                            iconBg = "bg-orange-500/10";
                            iconText = "text-orange-400";
                            icon = "low_priority";
                        }

                        // Confidence color logic
                        const confScore = Math.round(item.confidence * 100);
                        let confColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                        if (confScore < 85) confColor = "text-orange-400 bg-orange-500/10 border-orange-500/20";
                        if (confScore < 70) confColor = "text-red-400 bg-red-500/10 border-red-500/20";

                        return (
                            <article key={item.id} className={`flex flex-col gap-4 p-5 rounded-xl border ${borderColor} bg-[#192633] relative group shadow-sm transition-all ${hoverBorder}`}>
                                <div className={`absolute left-0 top-4 bottom-4 w-1 ${barColor} rounded-r-full`}></div>

                                {/* Card Header */}
                                <div className="flex items-start justify-between pl-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`h-10 w-10 shrink-0 rounded-full ${iconBg} flex items-center justify-center ${iconText}`}>
                                            <span className="material-symbols-outlined">{icon}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-white text-base font-bold font-display">{item.title}</h3>
                                                {item.meta && (
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${item.meta.color === 'red' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                        item.meta.color === 'primary' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                            'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                                        }`}>
                                                        {item.meta.label}
                                                    </span>
                                                )}
                                                {/* Confidence Badge */}
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${confColor}`}>
                                                    {confScore}% Confidence
                                                </span>
                                            </div>
                                            <p className="text-[#92adc9] text-xs">
                                                {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                                                {item.subtitle && ` • ${item.subtitle}`}
                                            </p>
                                        </div>
                                    </div>
                                    <button className="text-[#556980] hover:text-white transition-colors p-1" title="Dismiss">
                                        <span className="material-symbols-outlined text-[20px]">close</span>
                                    </button>
                                </div>

                                {/* Reasoning / Meta Context */}
                                <div className="pl-[66px] pr-4">
                                    <div className="flex items-start gap-2 mb-2 bg-[#233648]/50 p-2 rounded border border-border-dark/50">
                                        <span className="material-symbols-outlined text-primary text-[16px] mt-0.5">psychology</span>
                                        <p className="text-[#92adc9] text-[11px] italic leading-tight">
                                            "{item.aiReasoning || item.reasoning || "I have flagged this for your review based on established priority protocols."}"
                                        </p>
                                    </div>
                                </div>

                                {/* Content Body */}
                                <div className="pl-[66px] pr-4">
                                    <p className="text-slate-300 text-sm leading-relaxed mb-3">
                                        {item.description}
                                    </p>
                                </div>

                                {/* Footer Actions */}
                                <div className="pl-[66px] flex items-center justify-between mt-1">
                                    {/* View Details triggers Sheet */}
                                    <div
                                        onClick={() => setSelectedDecision(item)}
                                        className="group/why relative flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors"
                                    >
                                        <span className="text-[#556980] text-xs font-medium border-b border-dashed border-[#556980] group-hover:text-primary group-hover:border-primary transition-colors">View Details</span>
                                    </div>

                                    <div className="flex gap-3">
                                        {item.actions.map((action: any, idx: number) => {
                                            let btnClass = "px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors border";
                                            if (action.variant === 'ghost') btnClass += " border-transparent hover:bg-[#233648]";
                                            else if (action.variant === 'danger') btnClass += " bg-red-600 hover:bg-red-500 border-transparent shadow-lg shadow-red-500/20 flex items-center gap-2";
                                            else if (action.variant === 'primary') btnClass += " bg-primary hover:bg-blue-600 border-transparent shadow-lg shadow-blue-500/20 flex items-center gap-2";
                                            else btnClass += " border-border-dark hover:bg-[#233648] hover:border-white/20"; // outline default

                                            return (
                                                <button key={idx} className={btnClass} onClick={() => {
                                                    if (action.label === 'Resolve') setSelectedDecision(item);
                                                }}>
                                                    {action.label}
                                                    {action.icon && <span className="material-symbols-outlined text-[16px]">{action.icon}</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </article>
                        );
                    })
                )}

                <div className="flex flex-col items-center justify-center py-8 text-center opacity-50">
                    <div className="h-12 w-12 rounded-full bg-[#233648] flex items-center justify-center text-[#92adc9] mb-3">
                        <span className="material-symbols-outlined">check</span>
                    </div>
                    <p className="text-[#92adc9] text-sm font-medium">You're all caught up!</p>
                </div>
            </div>

            {/* Decision Details Sheet */}
            <DecisionDetailSheet
                decision={selectedDecision}
                open={!!selectedDecision}
                onOpenChange={(open) => !open && setSelectedDecision(null)}
                onResolve={(id, action) => {
                    if (action === 'snooze') {
                        resolveMutation.mutate({ id, status: 'snoozed' as any, feedback: "Snoozed for later" });
                        setSelectedDecision(null);
                        return;
                    }
                    const status = action === 'approve' ? 'approved' : 'rejected';
                    resolveMutation.mutate({ id, status, feedback: "Resolved via UI" });
                }}
            />
        </div>
    );
}
