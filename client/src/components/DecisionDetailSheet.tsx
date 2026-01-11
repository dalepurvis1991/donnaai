import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { formatDistanceToNow } from "date-fns";

interface DecisionDetailSheetProps {
    decision: any; // Type strictly if possible
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onResolve: (id: number, action: string) => void;
}

export function DecisionDetailSheet({ decision, open, onOpenChange, onResolve }: DecisionDetailSheetProps) {
    if (!decision) return null;

    const confScore = Math.round((decision.confidence || 0) * 100);
    let confColor = "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20";
    if (confScore < 85) confColor = "text-orange-400 bg-orange-500/10 border border-orange-500/20";
    if (confScore < 70) confColor = "text-red-400 bg-red-500/10 border border-red-500/20";

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl bg-[#111a22] border-l border-border-dark overflow-y-auto">
                <SheetHeader className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${decision.meta?.color === 'red' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            decision.meta?.color === 'primary' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                'bg-orange-500/10 text-orange-400 border-orange-500/20'
                            }`}>
                            {decision.meta?.label || "Review"}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${confColor}`}>
                            {confScore}% Confidence
                        </span>
                    </div>
                    <SheetTitle className="text-white text-2xl font-display font-bold leading-tight">
                        {decision.title}
                    </SheetTitle>
                    <SheetDescription className="text-[#92adc9] text-sm">
                        Created {formatDistanceToNow(new Date(decision.timestamp), { addSuffix: true })}
                        {decision.subtitle && ` • ${decision.subtitle}`}
                    </SheetDescription>
                </SheetHeader>

                <div className="flex flex-col gap-8">
                    {/* Donna's Analysis */}
                    <section className="flex flex-col gap-3">
                        <h3 className="text-white text-sm font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[18px]">psychology</span>
                            Donna's Analysis
                        </h3>
                        <div className="bg-[#192633] p-4 rounded-xl border border-border-dark relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                            <p className="text-[#92adc9] text-sm italic leading-relaxed">
                                "{decision.aiReasoning || decision.reasoning || "I have flagged this for your review based on established priority protocols."}"
                            </p>
                        </div>
                    </section>

                    {/* Context / Risk */}
                    <section className="flex flex-col gap-3">
                        <h3 className="text-white text-sm font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-accent-amber text-[18px]">info</span>
                            Context & Impact
                        </h3>
                        <div className="flex flex-col gap-4 text-sm text-slate-300 leading-relaxed">
                            <p>{decision.description}</p>

                            {decision.riskNotes && (
                                <div className="flex gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10 items-start">
                                    <span className="material-symbols-outlined text-red-400 text-[18px] mt-0.5">warning</span>
                                    <div className="flex flex-col">
                                        <span className="text-red-400 font-bold text-xs uppercase mb-1">Potential Risk</span>
                                        <span className="text-red-200/80 text-xs">{decision.riskNotes}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Alternatives (Placeholder for now) */}
                    <section className="flex flex-col gap-3">
                        <h3 className="text-white text-sm font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#556980] text-[18px]">alt_route</span>
                            Considered Alternatives
                        </h3>
                        <p className="text-[#556980] text-sm">
                            Donna considered auto-resolving but confidence ({confScore}%) was below the autonomous threshold (95%).
                        </p>
                    </section>

                    <div className="h-px w-full bg-border-dark my-2"></div>

                    {/* Action Footer */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => onResolve(decision.id, 'approve')}
                            className="w-full py-3 bg-primary hover:bg-blue-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">check_circle</span>
                            Approve & Execute
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => onResolve(decision.id, 'snooze')}
                                className="py-3 bg-[#192633] hover:bg-[#233648] text-[#92adc9] hover:text-white rounded-xl font-bold transition-colors border border-border-dark flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">schedule</span>
                                Snooze
                            </button>
                            <button
                                onClick={() => onResolve(decision.id, 'reject')}
                                className="py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl font-bold transition-colors border border-red-500/20 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">cancel</span>
                                Reject
                            </button>
                        </div>
                    </div>

                </div>
            </SheetContent>
        </Sheet>
    );
}
