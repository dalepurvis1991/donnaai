import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp,
  Mail,
  DollarSign,
  Package,
  Settings,
  BarChart3,
  Zap,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingDown,
  History,
  Target,
  BrainCircuit,
  PieChart,
  Clock
} from "lucide-react";

interface DigestData {
  date: string;
  period: string;
  metrics: {
    salesOrders: {
      count: number;
      totalValue: number;
      currency: string;
      products: Record<string, number>;
      averageOrderValue: number;
    };
    emailCounts: {
      total: number;
      byCategory: Record<string, number>;
      topSenders: Array<{ sender: string; count: number }>;
    };
  };
  summary: string;
  insights: string[];
  recommendations: string[];
}

interface NotificationSettings {
  id?: number;
  digestEnabled: boolean;
  digestTime: string;
  timezone: string;
  includeSalesMetrics: boolean;
  includeEmailCounts: boolean;
  includeTopSenders: boolean;
  customKeywords: string[];
}

export default function Digest() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hoursBack, setHoursBack] = useState(24);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch digest history
  const { data: digestHistory = [], isLoading: historyLoading } = useQuery<DigestData[]>({
    queryKey: ["/api/digest/history"]
  });

  // Fetch notification settings
  const { data: notificationSettings } = useQuery<NotificationSettings>({
    queryKey: ["/api/notifications/settings"]
  });

  // Generate digest mutation
  const generateDigestMutation = useMutation({
    mutationFn: async (hoursBack: number) => {
      const response = await apiRequest("POST", "/api/digest/generate", { hoursBack });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/digest/history"] });
      toast({
        title: "Intelligence Synthesized",
        description: "New business insights have been extrapolated from the data core.",
      });
    },
    onError: () => {
      toast({
        title: "Synthesis Error",
        description: "Failed to extrapolate intelligence from the current data dataset.",
        variant: "destructive",
      });
    }
  });

  // Update notification settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<NotificationSettings>) => {
      const response = await apiRequest("PUT", "/api/notifications/settings", settings);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/settings"] });
      setIsSettingsOpen(false);
      toast({
        title: "Protocols Updated",
        description: "Digest transmission schedules have been synchronized.",
      });
    },
    onError: () => {
      toast({
        title: "Synchronization Error",
        description: "Failed to transmit protocol update to the terminal.",
        variant: "destructive",
      });
    }
  });

  const handleGenerateDigest = () => {
    generateDigestMutation.mutate(hoursBack);
  };

  const handleUpdateSettings = (settings: Partial<NotificationSettings>) => {
    updateSettingsMutation.mutate(settings);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency}${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  const latestDigest = digestHistory[0];

  return (
    <div className="min-h-screen bg-[#101522] text-white flex flex-col">
      <Header emailStatus="connected" />

      <main className="max-w-7xl mx-auto px-6 py-12 w-full space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-white/5">
          <div>
            <div className="flex items-center gap-3 text-primary mb-2">
              <Sparkles className="size-4" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Business Intelligence Lab</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Executive Intelligence Digest</h1>
          </div>

          <div className="flex items-center gap-4">
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl italic px-6 font-bold">
                  <Settings className="size-4 mr-2" />
                  Transmission Protocols
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#101522]/95 border-white/10 text-white backdrop-blur-2xl rounded-3xl p-8 ring-1 ring-white/5 max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold italic tracking-tight">Calibration Center</DialogTitle>
                  <DialogDescription className="text-slate-500 italic">
                    Configure your autonomous intelligence delivery cycles.
                  </DialogDescription>
                </DialogHeader>
                <NotificationSettingsForm
                  settings={notificationSettings}
                  onSave={handleUpdateSettings}
                  isLoading={updateSettingsMutation.isPending}
                />
              </DialogContent>
            </Dialog>

            <div className="flex items-center gap-3 p-1.5 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-center gap-2 pl-3">
                <Clock className="size-3.5 text-slate-500" />
                <Input
                  type="number"
                  value={hoursBack}
                  onChange={(e) => setHoursBack(Number(e.target.value))}
                  className="w-14 bg-transparent border-none text-sm font-black p-0 focus-visible:ring-0 text-primary italic"
                  min="1"
                  max="168"
                />
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mr-2">Cycles</span>
              </div>
              <Button
                onClick={handleGenerateDigest}
                disabled={generateDigestMutation.isPending}
                className="bg-primary hover:bg-primary/90 shadow-glow rounded-xl px-4 h-9 text-[10px] font-black uppercase tracking-widest italic"
              >
                <Zap className="size-3 mr-2" />
                {generateDigestMutation.isPending ? "Analyzing..." : "Extrapolate"}
              </Button>
            </div>
          </div>
        </div>

        {/* Latest Insight Command Center */}
        {latestDigest && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Sales Revenue", value: formatCurrency(latestDigest.metrics.salesOrders.totalValue, latestDigest.metrics.salesOrders.currency), icon: <DollarSign className="size-5" />, color: "emerald", trend: "+12.5%" },
                { label: "Pipeline Velocity", value: `${latestDigest.metrics.salesOrders.count} Orders`, icon: <Package className="size-5" />, color: "blue", trend: "+4 Units" },
                { label: "Avg Unit Value", value: formatCurrency(latestDigest.metrics.salesOrders.averageOrderValue, latestDigest.metrics.salesOrders.currency), icon: <TrendingUp className="size-5" />, color: "primary", trend: "+2.1%" },
                { label: "Signal Density", value: `${latestDigest.metrics.emailCounts.total} Traces`, icon: <Mail className="size-5" />, color: "amber", trend: "High Frequency" },
              ].map((kpi, i) => (
                <div key={i} className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:bg-white/[0.05] transition-all ring-1 ring-white/5">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-3xl -mr-12 -mt-12 group-hover:bg-primary/10 transition-colors"></div>
                  <div className="relative z-10">
                    <div className={`size-10 rounded-xl flex items-center justify-center mb-4 bg-white/5 text-slate-400 group-hover:bg-primary group-hover:text-white transition-all`}>
                      {kpi.icon}
                    </div>
                    <p className="text-2xl font-black mb-1 italic tracking-tight">{kpi.value}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{kpi.label}</p>
                      <span className={`text-[10px] font-black italic ${kpi.trend.includes('+') ? 'text-emerald-400' : 'text-slate-400'}`}>{kpi.trend}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* Strategic Analysis */}
              <div className="lg:col-span-8 p-10 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-2xl relative overflow-hidden ring-1 ring-white/5">
                <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 blur-3xl -ml-48 -mt-48 rounded-full"></div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <Target className="size-6 text-primary" />
                      <h3 className="text-xl font-black italic tracking-tight uppercase">Intelligence Synthesis</h3>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] italic px-4">Period: {latestDigest.period}</Badge>
                  </div>

                  <p className="text-lg text-slate-300 italic leading-relaxed mb-10 max-w-4xl">"{latestDigest.summary}"</p>

                  <div className="space-y-10">
                    {latestDigest.insights.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {latestDigest.insights.map((insight, index) => (
                          <div key={index} className="flex items-start gap-4 p-5 rounded-3xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/[0.08] transition-all group">
                            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary transition-all">
                              <BrainCircuit className="size-4 text-primary group-hover:text-white" />
                            </div>
                            <p className="text-sm text-slate-400 italic leading-relaxed">{insight}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-10">
                      {/* Product Distribution */}
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-6 italic">Market Penetration</h4>
                        <div className="space-y-4">
                          {Object.entries(latestDigest.metrics.salesOrders.products).map(([product, count], i) => (
                            <div key={i} className="flex items-center justify-between group cursor-default">
                              <div className="flex items-center gap-3">
                                <div className="size-1.5 bg-primary rounded-full shadow-glow"></div>
                                <span className="text-xs font-bold text-slate-400 italic group-hover:text-white transition-colors">{product}</span>
                              </div>
                              <span className="text-xs font-black text-primary italic">{count} Units</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Category Density */}
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-6 italic">Communication Density</h4>
                        <div className="space-y-4">
                          {Object.entries(latestDigest.metrics.emailCounts.byCategory).map(([cat, count], i) => (
                            <div key={i} className="flex items-center justify-between group cursor-default">
                              <div className="flex items-center gap-3">
                                <div className="size-1.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                                <span className="text-xs font-bold text-slate-400 italic group-hover:text-white transition-colors">{cat} Priority</span>
                              </div>
                              <span className="text-xs font-black text-amber-500 italic">{count} Traces</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations Sidebar */}
              <div className="lg:col-span-4 space-y-8">
                <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 shadow-glow-sm">
                  <h3 className="text-lg font-black italic tracking-tight mb-6 flex items-center gap-3">
                    <PieChart className="size-5 text-primary" />
                    AI Recommendations
                  </h3>
                  <div className="space-y-4">
                    {latestDigest.recommendations?.length ? latestDigest.recommendations.map((rec, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 italic text-sm text-slate-400 relative group overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors"></div>
                        {rec}
                      </div>
                    )) : (
                      <div className="py-8 text-center text-slate-600 text-xs italic">Awaiting high-fidelity data patterns for strategic forecasting...</div>
                    )}
                  </div>
                </div>

                <div className="p-8 rounded-[2rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl flex flex-col items-center text-center">
                  <TrendingDown className="size-10 text-slate-800 mb-4" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">System monitoring active for potential market disruptions</p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Intelligence Timeline */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <History className="size-5 text-slate-600" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 italic">Extrapolation History</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {digestHistory.map((digest, index) => (
              <div key={index} className="group p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-primary italic">{new Date(digest.date).toLocaleDateString()}</span>
                  <Badge className="bg-white/5 text-slate-500 border-none text-[8px] tracking-widest uppercase">{digest.period}</Badge>
                </div>
                <p className="text-sm text-slate-400 italic line-clamp-3 mb-6">"{digest.summary}"</p>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="size-3 text-emerald-500" />
                    <span className="text-xs font-bold text-white">{formatCurrency(digest.metrics.salesOrders.totalValue, digest.metrics.salesOrders.currency)}</span>
                  </div>
                  <ArrowRight className="size-4 text-slate-800 group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}

            {!historyLoading && digestHistory.length === 0 && (
              <div className="col-span-full py-24 text-center rounded-[3rem] border border-dashed border-white/5 bg-white/[0.01]">
                <BarChart3 className="size-16 text-slate-800 mx-auto mb-6" />
                <h3 className="text-xl font-bold italic mb-2">Neural Cache Empty</h3>
                <p className="text-slate-500 max-w-xs mx-auto text-sm italic mb-8">Initiate your first intelligence extrapolation to populate the history core.</p>
                <Button onClick={handleGenerateDigest} disabled={generateDigestMutation.isPending} className="bg-primary hover:bg-primary/90 shadow-glow rounded-xl px-8 h-12 font-bold italic uppercase tracking-widest text-[10px]">Generate First Cycle</Button>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}

function NotificationSettingsForm({
  settings,
  onSave,
  isLoading
}: {
  settings?: NotificationSettings;
  onSave: (settings: Partial<NotificationSettings>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<Partial<NotificationSettings>>({
    digestEnabled: settings?.digestEnabled ?? true,
    digestTime: settings?.digestTime ?? "09:00",
    timezone: settings?.timezone ?? "UTC",
    includeSalesMetrics: settings?.includeSalesMetrics ?? true,
    includeEmailCounts: settings?.includeEmailCounts ?? true,
    includeTopSenders: settings?.includeTopSenders ?? true,
    customKeywords: settings?.customKeywords ?? [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 mt-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
          <div className="space-y-1">
            <Label className="text-sm font-bold italic">Autonomous Delivery</Label>
            <p className="text-[10px] text-slate-500 italic leading-relaxed">Automated intelligence transmission enabled.</p>
          </div>
          <Switch
            checked={formData.digestEnabled}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, digestEnabled: checked })
            }
            className="data-[state=checked]:bg-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-1">Cycle Time</Label>
            <Input
              type="time"
              value={formData.digestTime}
              onChange={(e) =>
                setFormData({ ...formData, digestTime: e.target.value })
              }
              className="bg-white/5 border-white/10 rounded-xl focus:ring-primary italic px-3"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-1">Region</Label>
            <Select
              value={formData.timezone}
              onValueChange={(value) =>
                setFormData({ ...formData, timezone: value })
              }
            >
              <SelectTrigger className="bg-white/5 border-white/10 rounded-xl focus:ring-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black/95 border-white/10 text-white backdrop-blur-2xl">
                <SelectItem value="UTC">UTC Terminal</SelectItem>
                <SelectItem value="Europe/London">London Core</SelectItem>
                <SelectItem value="America/New_York">NY Datacenter</SelectItem>
                <SelectItem value="America/Los_Angeles">LA Datacenter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] ml-1">Dataset Priority</Label>

          {[
            { label: "Sales & Marketplace Signals", key: "includeSalesMetrics" },
            { label: "Communication Density Traces", key: "includeEmailCounts" },
            { label: "High Volume Entity Analysis", key: "includeTopSenders" }
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between group">
              <Label className="text-xs font-bold text-slate-400 italic group-hover:text-white transition-colors">{item.label}</Label>
              <Switch
                checked={(formData as any)[item.key]}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, [item.key]: checked })
                }
                className="data-[state=checked]:bg-primary scale-75"
              />
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 shadow-glow h-12 rounded-xl font-black italic uppercase tracking-widest text-[10px]">
        {isLoading ? "Synchronizing..." : "Sync Protocols"}
      </Button>
    </form>
  );
}