import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Check, X, AlertCircle, Info } from "lucide-react";
import type { Decision } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export function DecisionQueueCard() {
    const { toast } = useToast();

    const { data: decisions, isLoading } = useQuery<Decision[]>({
        queryKey: ["/api/decisions"],
        refetchInterval: 30000,
    });

    const resolveMutation = useMutation({
        mutationFn: async ({ id, status }: { id: number; status: "approved" | "rejected" }) => {
            const response = await apiRequest("POST", `/api/decisions/${id}/resolve`, { status });
            return response.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["/api/decisions"] });
            toast({
                title: data.status === "approved" ? "Decision Approved" : "Decision Rejected",
                description: "The action has been processed.",
            });
        },
        onError: (error) => {
            toast({
                title: "Resolution Failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    if (isLoading) return null;
    if (!decisions || decisions.length === 0) return null;

    return (
        <Card className="border-primary/20 bg-primary/5 backdrop-blur-xl shadow-glow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
            <CardHeader className="border-b border-primary/10 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-glow-sm">
                        <ShieldCheck className="size-5" />
                    </div>
                    <div>
                        <CardTitle className="text-xl italic font-black text-white">DECISION QUEUE</CardTitle>
                        <CardDescription className="text-slate-400">Gated actions requiring orchestrator approval</CardDescription>
                    </div>
                </div>
                <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 uppercase tracking-widest text-[10px] font-black italic">
                    {decisions.length} PENDING
                </Badge>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-white/5">
                {decisions.map((decision) => (
                    <div key={decision.id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-white/5 transition-colors group">
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                                <Badge className="bg-white/10 text-white border-white/20 capitalize text-[10px] font-black italic">
                                    {decision.type.replace('_', ' ')}
                                </Badge>
                                <span className="text-xs text-slate-500 font-mono italic">
                                    {decision.createdAt ? formatDistanceToNow(new Date(decision.createdAt)) + " ago" : "Just now"}
                                </span>
                            </div>
                            <p className="text-white font-bold leading-tight">{decision.summary}</p>
                            {decision.riskNotes && (
                                <div className="flex items-center gap-2 text-red-400 text-xs italic">
                                    <AlertCircle className="size-3" />
                                    {decision.riskNotes}
                                </div>
                            )}
                            {decision.recommendedOption && (
                                <div className="flex items-center gap-2 text-emerald-400 text-xs italic">
                                    <Info className="size-3" />
                                    Recommendation: {decision.recommendedOption}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl border-white/10 hover:bg-red-500/20 hover:text-red-400 border-red-500/30 text-slate-400 h-10 px-4"
                                onClick={() => resolveMutation.mutate({ id: decision.id, status: "rejected" })}
                                disabled={resolveMutation.isPending}
                            >
                                <X className="mr-2 size-4" />
                                Reject
                            </Button>
                            <Button
                                size="sm"
                                className="rounded-xl bg-primary hover:bg-primary/90 text-white shadow-glow-sm h-10 px-6 font-black italic"
                                onClick={() => resolveMutation.mutate({ id: decision.id, status: "approved" })}
                                disabled={resolveMutation.isPending}
                            >
                                <Check className="mr-2 size-4" />
                                Approve Action
                            </Button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
