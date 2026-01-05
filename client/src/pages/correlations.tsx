import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  LinkIcon,
  TrendingUp,
  FileText,
  ShoppingCart,
  MessageSquare,
  ChevronRight,
  BrainCircuit,
  Zap,
  Fingerprint,
  Activity,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";

interface CorrelationGroup {
  groupId: string;
  subject: string;
  type: string;
  emails: Array<{
    email: any;
    metadata: any;
  }>;
  analysis?: {
    bestOption?: any;
    comparison?: any;
    recommendation?: string;
  };
}

export default function Correlations() {
  const { isAuthenticated, isLoading: authLoading } = useAuth() as any;
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ["/api/correlations"],
    enabled: isAuthenticated,
  });

  const { data: groupDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ["/api/correlations", selectedGroup],
    enabled: !!selectedGroup,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/correlations/${selectedGroup}`);
      return response.json();
    },
  });

  if (authLoading || groupsLoading) {
    return (
      <div className="min-h-screen bg-[#101522] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-slate-400 font-black italic uppercase tracking-widest text-[10px]">Scanning neural links...</p>
        </div>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "quote":
        return <TrendingUp className="size-5" />;
      case "invoice":
        return <FileText className="size-5" />;
      case "order":
        return <ShoppingCart className="size-5" />;
      default:
        return <MessageSquare className="size-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#101522] text-white flex flex-col">
      <Header emailStatus="connected" />

      <main className="max-w-7xl mx-auto px-6 py-12 w-full space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-white/5">
          <div>
            <div className="flex items-center gap-3 text-primary mb-2">
              <BrainCircuit className="size-4" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Pattern Recognition Lab</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Neural Link Correlations</h1>
          </div>

          <div className="hidden md:flex items-center gap-4 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl ring-1 ring-white/5">
            <Activity className="size-4 text-primary animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Scanning Engine</span>
              <span className="text-[11px] font-black italic text-white uppercase tracking-tighter">Active Correlation Search</span>
            </div>
          </div>
        </div>

        {/* Correlation Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {groups && groups.length > 0 ? (
            groups.map((group: CorrelationGroup) => (
              <div
                key={group.groupId}
                className="group p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl hover:bg-white/[0.06] hover:border-white/20 transition-all relative overflow-hidden ring-1 ring-white/5 cursor-pointer"
                onClick={() => setSelectedGroup(group.groupId)}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-5">
                      <div className="size-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-glow-sm">
                        {getTypeIcon(group.type)}
                      </div>
                      <div>
                        <h3 className="text-xl font-black italic tracking-tight group-hover:text-primary transition-colors line-clamp-1">{group.subject}</h3>
                        <Badge className="bg-white/5 text-slate-500 border-white/10 font-bold italic text-[9px] px-3 py-1 mt-1">
                          {group.type.toUpperCase()} PROTOCOL
                        </Badge>
                      </div>
                    </div>
                    <LinkIcon className="size-4 text-slate-700 group-hover:text-white transition-colors" />
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2">
                      <Fingerprint className="size-3.5 text-primary" />
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest italic">{group.emails.length} Related Neural Traces</span>
                    </div>

                    <div className="space-y-3">
                      {group.emails.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-sm text-slate-400 italic group/item">
                          <div className="size-1 rounded-full bg-slate-700 group-hover/item:bg-primary transition-colors"></div>
                          <span className="line-clamp-1">{item.email.sender}</span>
                        </div>
                      ))}
                      {group.emails.length > 3 && (
                        <div className="text-[10px] text-slate-600 font-bold italic pl-4">
                          + {group.emails.length - 3} ADDITIONAL TRACES DETECTED
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="size-3.5 text-slate-700" />
                      <span className="text-[10px] font-black text-slate-600 italic">Analysis Synchronized</span>
                    </div>
                    <ArrowRight className="size-4 text-slate-800 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-32 text-center rounded-[3rem] border border-dashed border-white/5 bg-white/[0.01]">
              <Activity className="size-16 text-slate-800 mx-auto mb-6" />
              <h3 className="text-xl font-bold italic mb-2">Neural Engine Silent</h3>
              <p className="text-slate-500 max-w-xs mx-auto text-sm italic">
                Donna AI is monitoring incoming transmissions. Related neural links will materialize here upon detection.
              </p>
            </div>
          )}
        </div>

        {/* Group Details Dialog */}
        <Dialog open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
          <DialogContent className="bg-[#101522]/95 border-white/10 text-white backdrop-blur-2xl rounded-3xl p-8 ring-1 ring-white/5 max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-3 text-primary mb-1">
                <Fingerprint className="size-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Trace Analysis</span>
              </div>
              <DialogTitle className="text-3xl font-black italic tracking-tight uppercase">Neural Link Extraction</DialogTitle>
            </DialogHeader>

            {detailsLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20">
                <Loader2 className="size-12 animate-spin text-primary/50 mb-4" />
                <p className="text-slate-500 italic font-bold text-xs uppercase tracking-widest">Reconstructing links...</p>
              </div>
            ) : groupDetails ? (
              <Tabs defaultValue="emails" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="bg-white/5 border border-white/5 p-1 rounded-2xl mb-8 self-start">
                  <TabsTrigger value="emails" className="rounded-xl px-8 data-[state=active]:bg-primary data-[state=active]:text-white italic font-bold uppercase text-[10px] tracking-widest">Related Emails</TabsTrigger>
                  <TabsTrigger value="analysis" className="rounded-xl px-8 data-[state=active]:bg-primary data-[state=active]:text-white italic font-bold uppercase text-[10px] tracking-widest">AI Synthesis</TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-hide">
                  <TabsContent value="emails" className="mt-0 space-y-6">
                    {groupDetails.correlations?.map((correlation: any) => {
                      const email = groups?.find((g: CorrelationGroup) => g.groupId === selectedGroup)
                        ?.emails.find((e: any) => e.email.id === correlation.emailId)?.email;

                      if (!email) return null;

                      return (
                        <div key={correlation.id} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="text-lg font-bold italic text-white flex items-center gap-3">
                                {email.subject}
                                <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-bold uppercase tracking-widest">{correlation.correlationType}</Badge>
                              </h4>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">SOURCE: {email.senderEmail}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Confidence</div>
                              <div className="text-lg font-black italic text-primary">{Math.round((correlation.confidence || 0.9) * 100)}%</div>
                            </div>
                          </div>

                          <p className="text-sm text-slate-400 italic line-clamp-3 leading-relaxed mb-4">"{email.body}"</p>

                          {correlation.metadata && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                              {correlation.metadata.price && (
                                <div className="space-y-1">
                                  <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest block">EXTRACTED PRICE</span>
                                  <span className="text-sm font-black italic text-white">£{correlation.metadata.price}</span>
                                </div>
                              )}
                              {correlation.metadata.vendor && (
                                <div className="space-y-1">
                                  <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest block">IDENTIFIED VENDOR</span>
                                  <span className="text-sm font-black italic text-white">{correlation.metadata.vendor}</span>
                                </div>
                              )}
                              {correlation.metadata.product && (
                                <div className="space-y-1">
                                  <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest block">TARGET PRODUCT</span>
                                  <span className="text-sm font-black italic text-white">{correlation.metadata.product}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </TabsContent>

                  <TabsContent value="analysis" className="mt-0 space-y-8">
                    {groupDetails.analysis ? (
                      <>
                        {groupDetails.analysis.recommendation && (
                          <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/30 shadow-glow flex gap-6 items-start">
                            <div className="size-12 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-glow">
                              <Sparkles className="size-6 text-white" />
                            </div>
                            <div className="space-y-2">
                              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Neural Recommendation</span>
                              <p className="text-lg font-bold italic text-white leading-relaxed">{groupDetails.analysis.recommendation}</p>
                            </div>
                          </div>
                        )}

                        {groupDetails.analysis.comparison && (
                          <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-1">Comparative Vector Analysis</h4>
                            <div className="grid gap-4">
                              {groupDetails.analysis.comparison.quotes?.map((quote: any, idx: number) => (
                                <div key={idx} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                  <div className="space-y-1">
                                    <span className="text-lg font-black italic text-white">{quote.vendor}</span>
                                    <div className="flex flex-wrap gap-3">
                                      {quote.pros?.map((pro: string, i: number) => (
                                        <div key={i} className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 italic uppercase">
                                          <CheckCircle2 className="size-3" />
                                          {pro}
                                        </div>
                                      ))}
                                      {quote.cons?.map((con: string, i: number) => (
                                        <div key={i} className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 italic uppercase">
                                          <AlertCircle className="size-3" />
                                          {con}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center min-w-[120px]">
                                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest block mb-1">TOTAL VALUE</span>
                                    <span className="text-2xl font-black italic text-primary">£{quote.price}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {groupDetails.analysis.bestOption && (
                          <div className="p-8 rounded-[2.5rem] bg-emerald-500/5 border border-emerald-500/20 relative overflow-hidden ring-1 ring-emerald-500/5">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -mr-16 -mt-16"></div>
                            <div className="relative z-10 space-y-6">
                              <div className="flex items-center gap-4">
                                <div className="size-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                                  <ShieldCheck className="size-5 text-emerald-500" />
                                </div>
                                <div>
                                  <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest leading-none">Strategical Optimized Path</h4>
                                  <span className="text-xl font-black italic text-white uppercase">{groupDetails.analysis.bestOption.vendor}</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-1">
                                  <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest block">OPTIMIZED COST</span>
                                  <span className="text-2xl font-black italic text-emerald-500">£{groupDetails.analysis.bestOption.price}</span>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest block">STRATEGIC RATIONALE</span>
                                  <p className="text-xs text-slate-400 italic leading-relaxed">"{groupDetails.analysis.bestOption.reason}"</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="py-20 text-center rounded-[2rem] border border-dashed border-white/5 bg-white/[0.01]">
                        <Zap className="size-12 text-slate-800 mx-auto mb-4" />
                        <p className="text-slate-500 italic max-w-sm mx-auto">
                          Neural engine lacks sufficient context to synthesize analysis. Pattern recognition requires additional related traces.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            ) : null}

            <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
              <Button variant="ghost" onClick={() => setSelectedGroup(null)} className="text-slate-500 hover:text-white italic font-bold">CLOSE PROTOCOL</Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}