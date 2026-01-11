import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, ListChecks, ShieldAlert, Target, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface BriefData {
    priorities: string[];
    decisionsCount: number;
    delegationsCount: number;
    projectsCount: number;
    emailCount: number;
    donnaVoice: string;
}

export function DailyBrief() {
    const { data: brief, isLoading } = useQuery<BriefData>({
        queryKey: ["/api/orchestrator/brief"],
        refetchInterval: 30000,
    });

    if (isLoading) {
        return <Skeleton className="h-[300px] w-full rounded-3xl" />;
    }

    if (!brief) return null;

    return (
        <div className="space-y-6">
            {/* Donna Voice Header */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-primary font-medium tracking-wide uppercase text-xs">
                    <Sparkles className="size-4 animate-pulse" />
                    Donna AI Orchestrator
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white italic">
                    {brief.donnaVoice.split('Based on')[0].trim() || "Your business intelligence is fully synchronized."}
                </h1>
                <div className="text-[#92adc9] text-sm font-medium flex items-center gap-2 mt-1">
                    <span className="material-symbols-outlined text-[18px]">analytics</span>
                    Based on {brief.emailCount} emails and {brief.delegationsCount} active delegations.
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Top Priorities */}
                <Card className="md:col-span-2 border-primary/20 bg-gradient-to-br from-white/5 to-primary/5 backdrop-blur-xl border-l-4 border-l-primary rounded-3xl shadow-glow-sm overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2 font-bold italic">
                            <Target className="size-5 text-primary" />
                            TOP PRIORITIES
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {brief.priorities.length > 0 ? (
                            <div className="grid gap-3">
                                {brief.priorities.slice(0, 5).map((priority, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all group">
                                        <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black italic">
                                            {i + 1}
                                        </div>
                                        <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                                            {priority}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400 italic py-4">
                                No specific priorities detected. Focus on clearing the pending decision queue.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Focus Items / Quick Stats */}
                <div className="space-y-4">
                    <Card className="border-amber-500/20 bg-amber-500/5 backdrop-blur-xl rounded-2xl p-4 flex items-center justify-between group hover:border-amber-500/40 transition-all cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-glow-sm">
                                <ShieldAlert className="size-6" />
                            </div>
                            <div>
                                <p className="text-xs text-amber-500/70 font-bold uppercase tracking-wider">Review Required</p>
                                <h3 className="text-2xl font-black italic">{brief.decisionsCount} Decisions</h3>
                            </div>
                        </div>
                        <ArrowRight className="size-5 text-amber-500/40 group-hover:translate-x-1 transition-transform" />
                    </Card>

                    <Card className="border-emerald-500/20 bg-emerald-500/5 backdrop-blur-xl rounded-2xl p-4 flex items-center justify-between group hover:border-emerald-500/40 transition-all cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-glow-sm">
                                <ListChecks className="size-6" />
                            </div>
                            <div>
                                <p className="text-xs text-emerald-500/70 font-bold uppercase tracking-wider">Active Status</p>
                                <h3 className="text-2xl font-black italic">{brief.delegationsCount} Delegations</h3>
                            </div>
                        </div>
                        <ArrowRight className="size-5 text-emerald-500/40 group-hover:translate-x-1 transition-transform" />
                    </Card>

                    <Card className="border-blue-500/20 bg-blue-500/5 backdrop-blur-xl rounded-2xl p-4 flex items-center justify-between group hover:border-blue-500/40 transition-all cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-glow-sm">
                                <Zap className="size-6" />
                            </div>
                            <div>
                                <p className="text-xs text-blue-500/70 font-bold uppercase tracking-wider">Operating On</p>
                                <h3 className="text-2xl font-black italic">{brief.projectsCount} Projects</h3>
                            </div>
                        </div>
                        <ArrowRight className="size-5 text-blue-500/40 group-hover:translate-x-1 transition-transform" />
                    </Card>
                </div>
            </div>
        </div>
    );
}
