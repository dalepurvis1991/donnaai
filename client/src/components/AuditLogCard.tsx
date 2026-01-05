import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { History, Search, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface AuditLog {
    id: number;
    action: string;
    details: string;
    timestamp: string;
    emailId?: number;
    taskId?: number;
    decisionId?: number;
}

export function AuditLogCard() {
    const { data: logs, isLoading } = useQuery<AuditLog[]>({
        queryKey: ["/api/audit-logs"],
        refetchInterval: 60000,
    });

    if (isLoading) {
        return <Skeleton className="h-[400px] w-full rounded-3xl" />;
    }

    return (
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl rounded-3xl overflow-hidden">
            <CardHeader className="pb-2 border-b border-white/5">
                <CardTitle className="text-lg flex items-center justify-between font-bold italic">
                    <div className="flex items-center gap-2">
                        <History className="size-5 text-slate-400" />
                        ACTIVITY LOG
                    </div>
                    <Badge variant="outline" className="text-[10px] font-black tracking-tighter border-white/20 text-slate-400 uppercase">
                        Read Only
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                    {logs && logs.length > 0 ? (
                        <div className="divide-y divide-white/5">
                            {logs.map((log) => (
                                <div key={log.id} className="p-4 hover:bg-white/5 transition-colors group">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-white uppercase tracking-tight">
                                                    {log.action}
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-medium">
                                                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                                                {log.details}
                                            </p>
                                        </div>
                                        {/* Reference indicators */}
                                        <div className="flex gap-1">
                                            {log.emailId && (
                                                <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 text-[9px] border-none px-1.5 py-0">
                                                    E-{log.emailId}
                                                </Badge>
                                            )}
                                            {log.taskId && (
                                                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 text-[9px] border-none px-1.5 py-0">
                                                    T-{log.taskId}
                                                </Badge>
                                            )}
                                            {log.decisionId && (
                                                <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 text-[9px] border-none px-1.5 py-0">
                                                    D-{log.decisionId}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-500 gap-2">
                            <Info className="size-5 opacity-20" />
                            <p className="text-xs italic">No activity recorded yet.</p>
                        </div>
                    )}
                </ScrollArea>
                <div className="p-4 bg-white/5 border-t border-white/5 flex items-center gap-2">
                    <Search className="size-3 text-slate-500" />
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        Search system traces...
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
