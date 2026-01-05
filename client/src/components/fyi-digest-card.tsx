import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Wallet, Newspaper, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface FyiDigest {
    id: number;
    groupKey: string;
    title: string;
    summary: string;
    count: number;
    metrics: any;
    lastEmailAt: string;
}

export function FyiDigestCard() {
    const [dismissedId, setDismissedId] = useState<number | null>(null);

    const { data: digests, isLoading } = useQuery<FyiDigest[]>({
        queryKey: ["/api/digests/fyi"],
        refetchInterval: 60000,
    });

    const dismissMutation = useMutation({
        mutationFn: async (id: number) => {
            setDismissedId(id);
            await apiRequest("POST", `/api/digests/fyi/${id}/dismiss`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/digests/fyi"] });
            // Also refresh stats as they might change
            queryClient.invalidateQueries({ queryKey: ["/api/emails/stats"] });
        },
        onSettled: () => setDismissedId(null)
    });

    if (isLoading) return null;
    if (!digests || digests.length === 0) return null;

    return (
        <Card className="border-0 bg-transparent shadow-none mb-6">
            <div className="flex items-center gap-2 mb-4 px-1">
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                    Donna AI Summary
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20">
                    {digests.length} Updates
                </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {digests.map((digest) => (
                    <div
                        key={digest.id}
                        className={cn(
                            "group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-5 transition-all hover:bg-white/10 hover:shadow-glow-sm",
                            dismissedId === digest.id && "opacity-50 pointer-events-none"
                        )}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "size-10 rounded-xl flex items-center justify-center border",
                                    digest.metrics.currency
                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                        : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                                )}>
                                    {digest.metrics.currency ? <Wallet className="size-5" /> : <Newspaper className="size-5" />}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm text-white leading-none mb-1">{digest.title}</h4>
                                    <p className="text-xs text-slate-400">{new Date(digest.lastEmailAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 text-slate-500 hover:text-white -mr-1 -mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => dismissMutation.mutate(digest.id)}
                                disabled={dismissMutation.isPending}
                            >
                                <X className="size-4" />
                            </Button>
                        </div>

                        <p className="text-sm text-slate-300 leading-relaxed mb-4">
                            {digest.summary}
                        </p>

                        {digest.metrics.currency && (
                            <div className="flex items-center gap-2 mt-auto">
                                <div className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold">
                                    {digest.metrics.currency}{Number(digest.metrics.totalValue).toFixed(2)}
                                </div>
                                <span className="text-xs text-slate-500">{digest.count} receipts</span>
                            </div>
                        )}

                        {!digest.metrics.currency && (
                            <div className="flex items-center gap-2 mt-auto">
                                <div className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
                                    {digest.count} Updates
                                </div>
                            </div>
                        )}

                        <div className="absolute bottom-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                            <ArrowRight className="size-4 text-slate-400" />
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
