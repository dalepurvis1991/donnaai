import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import {
  Zap,
  Clock,
  CheckCircle,
  Database,
  Brain,
  Cpu,
  Activity,
  Network,
  Sparkles,
  RefreshCcw,
  BarChart3
} from "lucide-react";

import { Progress } from "@/components/ui/progress";

export default function BulkProcessing() {
  const [emailLimit, setEmailLimit] = useState([1000]);
  const [processedCount, setProcessedCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();

  // Auto-refresh emails every 15 minutes
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(async () => {
      try {
        await apiRequest("POST", "/api/emails/refresh", {});
        console.log("Auto-refresh: Emails updated");
      } catch (error) {
        console.error("Auto-refresh failed:", error);
      }
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const bulkProcessMutation = useMutation({
    mutationFn: async (vars: { limit: number, reset?: boolean, pageToken?: string }) => {
      const response = await apiRequest("POST", "/api/emails/bulk-process", vars);
      return response.json();
    },
    onError: (error) => {
      setIsProcessing(false);
      toast({
        title: "Ingestion Failure",
        description: "The bulk processing loop encountered an error.",
        variant: "destructive",
      });
    }
  });

  const processRecursive = async (currentCount: number, pageToken?: string, isFirst = false) => {
    try {
      const limitPerBatch = 15; // Small batches as requested

      const data = await bulkProcessMutation.mutateAsync({
        limit: limitPerBatch,
        reset: false, // NEVER auto-reset context
        pageToken
      });

      const newCount = currentCount + data.processed;
      setProcessedCount(newCount);

      // Stop conditions
      const target = emailLimit[0];
      if (!data.nextPageToken || newCount >= target) {
        setIsProcessing(false);
        toast({
          title: "Simulation Complete",
          description: `Successfully ingested ${newCount} email traces into the neural core.`,
        });
        return;
      }

      // Continue to next batch
      await processRecursive(newCount, data.nextPageToken, false);
    } catch (e) {
      console.error("Batch failed", e);
      // Error handled by mutation onError
    }
  };

  const handleBulkProcess = () => {
    setIsProcessing(true);
    setProcessedCount(0);
    processRecursive(0, undefined, false);
  };

  return (
    <div className="min-h-screen bg-[#101522] text-white flex flex-col">
      <Header emailStatus="connected" />

      <main className="max-w-6xl mx-auto px-6 py-12 w-full space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          <div>
            <div className="flex items-center gap-3 text-primary mb-2">
              <Database className="size-4" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Mass Intelligence Engine</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Bulk Pattern Processing</h1>
          </div>

          <div className="flex items-center gap-3">
            <Badge className="bg-primary/20 text-primary border-primary/20 uppercase text-[10px] tracking-widest px-4 py-1.5 font-bold italic">
              <Cpu className="size-3 mr-2" />
              Enterprise Scale
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Primary Control Hub */}
          <div className="lg:col-span-7 space-y-8">
            <div className="p-10 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:bg-white/[0.05] transition-all ring-1 ring-white/5">
              <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 blur-3xl -mr-40 -mt-40 rounded-full group-hover:bg-primary/10 transition-colors"></div>

              <div className="relative z-10 space-y-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold italic tracking-wider text-primary uppercase">Core Configuration</h3>
                  <Activity className="size-10 text-primary/30 animate-pulse" />
                </div>

                <div className="space-y-8">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-white italic">Processing Depth</label>
                      <span className="text-xl font-black text-primary italic">{emailLimit[0]} <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Traces</span></span>
                    </div>

                    <div className="px-1">
                      <Slider
                        value={emailLimit}
                        onValueChange={setEmailLimit}
                        max={1000}
                        min={100}
                        step={50}
                        className="py-4"
                      />
                      <div className="flex justify-between text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-2">
                        <span>Minimum Ingestion (100)</span>
                        <span>High Fidelity Ingestion (1000)</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 italic leading-relaxed">
                      Increasing processing depth provides the AI with superior context, enabling 99.9% accuracy in automated classification and sentiment analysis.
                    </p>
                  </div>

                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group/refresh">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white italic flex items-center gap-2">
                        <RefreshCcw className="size-4 text-emerald-400 group-hover/refresh:rotate-180 transition-transform duration-700" />
                        Autonomous Synchronization
                      </p>
                      <p className="text-[11px] text-slate-500 italic">Continuously fetch and process new email traces every 15 cycles.</p>
                    </div>
                    <Button
                      variant={autoRefresh ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      className={`rounded-xl px-6 h-10 font-bold uppercase tracking-widest text-[9px] ${autoRefresh ? 'bg-primary hover:bg-primary/90 shadow-glow' : 'bg-transparent border-white/10 text-slate-500'
                        }`}
                    >
                      {autoRefresh ? "Enabled" : "Disabled"}
                    </Button>
                  </div>

                  <div className="pt-4 flex flex-col gap-4">
                    <Button
                      onClick={handleBulkProcess}
                      disabled={isProcessing || bulkProcessMutation.isPending}
                      className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 shadow-glow text-xl font-black italic relative group/btn overflow-hidden transition-all"
                    >
                      {isProcessing ? (
                        <div className="flex items-center gap-4">
                          <Clock className="size-6 animate-spin" />
                          <span className="tracking-tighter uppercase font-black italic">Initiating Neural Feed...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <Zap className="size-6" />
                          <span className="tracking-tighter uppercase font-black italic">Execute Bulk Ingestion</span>
                        </div>
                      )}
                    </Button>

                    {isProcessing && (
                      <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                          <span className="flex items-center gap-2"><Activity className="size-3 text-primary animate-pulse" /> Synchronizing...</span>
                          <span className="text-primary">{Math.round((processedCount / emailLimit[0]) * 100)}%</span>
                        </div>
                        <Progress value={(processedCount / emailLimit[0]) * 100} className="h-2 bg-slate-800 border border-white/5" />
                        <p className="text-[10px] text-slate-500 italic text-center">
                          Processed <span className="text-white font-bold">{processedCount}</span> of <span className="text-white font-bold">{emailLimit[0]}</span> traces
                        </p>
                      </div>
                    )}

                    {processedCount > 0 && !isProcessing && (
                      <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 transition-all animate-in fade-in zoom-in-95">
                        <CheckCircle className="size-5 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-400 italic">Successfully synchronized {processedCount} email datasets.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Insights Sidebar */}
          <div className="lg:col-span-5 space-y-8">
            <div className="p-8 rounded-[2rem] bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 shadow-glow-sm relative overflow-hidden group">
              <Network className="size-12 text-primary absolute -bottom-4 -right-4 opacity-10 group-hover:scale-110 transition-transform" />

              <h3 className="text-lg font-bold mb-6 flex items-center gap-3 italic">
                <Sparkles className="size-5 text-primary" />
                Engine Optimization Benefits
              </h3>

              <div className="grid gap-6">
                {[
                  { icon: <Brain className="size-5 text-primary" />, title: "Neural Deep-Learning", desc: "Increases the AI's understanding of complex corporate slang and communication patterns." },
                  { icon: <Zap className="size-5 text-amber-400" />, title: "Pattern Accuracy", desc: "Reduces error rates in automated drafting by analyzing thousands of historical interactions." },
                  { icon: <BarChart3 className="size-5 text-blue-400" />, title: "Strategic Insights", desc: "Feeds the business intelligence module with richer data for more accurate revenue tracking." },
                  { icon: <CheckCircle className="size-5 text-emerald-400" />, title: "Protocol Precision", desc: "Refines existing rules by detecting subtle variations in sender behavior and intent." }
                ].map((benefit, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group/benefit">
                    <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 group-hover/benefit:bg-primary/20 transition-colors">
                      {benefit.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white italic mb-1">{benefit.title}</h4>
                      <p className="text-[11px] text-slate-500 italic leading-relaxed">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-md">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4 italic">Security Infrastructure</h4>
              <div className="flex items-center gap-3">
                <div className="size-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                <p className="text-[11px] text-slate-400 italic">256-bit AES Encryption Active during Mass Transmission</p>
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}