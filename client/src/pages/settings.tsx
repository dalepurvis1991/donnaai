import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserPreferences } from "@shared/schema";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [autonomyLevel, setAutonomyLevel] = useState(2); // 0: Manual, 1: Assisted, 2: Autonomous

  const { data: preferences, isLoading } = useQuery<UserPreferences>({
    queryKey: ["/api/user/preferences"],
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPrefs: Partial<UserPreferences>) => {
      const res = await apiRequest("PATCH", "/api/user/preferences", newPrefs);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Preferences Updated",
        description: "Donna's core behavior has been adjusted.",
      });
    },
  });

  // Trial Activation mutation
  const startTrialMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/billing/start-trial");
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Trial Activated!",
        description: `Your Pro trial ends on ${new Date(data.trialEndsAt).toLocaleDateString()}`,
      });
      // Force reload or query invalidation would be ideal here
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: "Activation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return (
    <div className="w-full max-w-[1200px] mx-auto p-6 md:p-8 flex flex-col gap-8 pb-20 font-body">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-white text-4xl font-black leading-tight tracking-[-0.02em] font-display">Memory & Preferences</h2>
        <p className="text-[#92adc9] text-base font-normal">Configure Donna's behavior, knowledge retention, and tool access.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Navigation/Summary */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* Plan / Subscription Card */}
          <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-[#192633] to-[#137fec]/10 p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-8xl text-primary">diamond</span>
            </div>
            <h3 className="text-white text-lg font-bold mb-4 font-display flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">verified</span>
              Subscription
            </h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[#92adc9] text-sm">Current Plan</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${user?.planType === 'free' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                  'bg-primary/20 text-blue-300 border-primary/30'
                  }`}>
                  {user?.planType || 'Free'}
                </span>
              </div>
              {user?.trialEndsAt && user?.planType === 'trial' && (
                <div className="flex flex-col gap-1">
                  <span className="text-[#92adc9] text-xs">Trial Ends</span>
                  <span className="text-white text-sm font-mono">{new Date(user.trialEndsAt).toLocaleDateString()}</span>
                </div>
              )}

              {user?.planType === 'free' ? (
                <button
                  onClick={() => startTrialMutation.mutate()}
                  disabled={startTrialMutation.isPending}
                  className="w-full mt-2 py-2.5 rounded-lg bg-primary hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  {startTrialMutation.isPending ? 'Activating...' : 'Start 7-Day Pro Trial'}
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              ) : (
                <button className="w-full mt-2 py-2 rounded-lg border border-border-dark text-[#92adc9] hover:text-white hover:bg-[#233648] transition-colors text-xs font-bold">
                  Manage Subscription
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border-dark bg-card-dark p-6">
            <h3 className="text-white text-lg font-bold mb-4 font-display">System Status</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[#92adc9] text-sm">Memory Usage</span>
                <span className="text-white text-sm font-mono">2.4 GB / 5 TB</span>
              </div>
              <div className="w-full bg-[#111a22] rounded-full h-1.5">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: "2%" }}></div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border-dark">
                <span className="text-[#92adc9] text-sm">Uptime</span>
                <span className="text-white text-sm font-mono">99.9%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#92adc9] text-sm">Learning Rate</span>
                <span className="text-emerald-400 text-sm font-bold">High</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border-dark bg-card-dark p-6">
            <h3 className="text-white text-lg font-bold mb-4 font-display">Integrations</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center p-1.5">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" alt="Gmail" />
                  </div>
                  <span className="text-white text-sm font-medium">Gmail</span>
                </div>
                <span className="text-emerald-400 text-xs font-bold uppercase">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center p-1.5">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Calendar" />
                  </div>
                  <span className="text-white text-sm font-medium">Calendar</span>
                </div>
                <span className="text-emerald-400 text-xs font-bold uppercase">Active</span>
              </div>
            </div>
            <button className="w-full mt-4 py-2 rounded-lg border border-border-dark text-[#92adc9] hover:text-white hover:bg-[#233648] transition-colors text-xs font-bold">
              + Add New Integration
            </button>
          </div>
        </div>

        {/* Right Column: Settings Forms */}
        <div className="flex flex-col gap-8 lg:col-span-2">

          {/* Core Behavior Section */}
          <section className="flex flex-col gap-4">
            <h3 className="text-white text-xl font-bold font-display flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">psychology</span>
              Core Behavior
            </h3>
            <div className="rounded-xl border border-border-dark bg-card-dark p-6">
              <div className="flex flex-col gap-4">
                <label className="text-white text-sm font-bold">System Prompt / Persona</label>
                <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg mb-1">
                  <span className="material-symbols-outlined text-amber-500 text-[18px] mt-0.5">warning</span>
                  <p className="text-amber-500/90 text-xs leading-relaxed">
                    <strong>Caution:</strong> Modifying the core persona can lead to unpredictable behavior. Only edit if you are an advanced user.
                  </p>
                </div>
                <p className="text-[#92adc9] text-xs">Define how Donna should act. This overrides default behaviors.</p>
                <textarea
                  className="w-full h-32 bg-[#111a22] border border-border-dark rounded-lg p-3 text-sm text-white focus:outline-none focus:border-primary transition-colors resize-none font-mono"
                  placeholder="You are Donna, a proactive Chief of Staff..."
                  defaultValue="You are Donna, a proactive Chief of Staff for a high-end custom flooring business. You prioritize aesthetic quality and customer satisfaction. You are authorized to make decisions on small inventory restocks but must ask for approval on pricing changes."
                ></textarea>
                <div className="flex justify-end">
                  <button className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-xs transition-colors">
                    Save Behavior
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Autonomy Level */}
          <section className="flex flex-col gap-4">
            <h3 className="text-white text-xl font-bold font-display flex items-center gap-2">
              <span className="material-symbols-outlined text-accent-amber">tune</span>
              Autonomy Level
            </h3>
            <div className="rounded-xl border border-border-dark bg-card-dark p-6">
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <span className="text-white text-sm font-bold">Current Mode</span>
                  <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold uppercase">
                    {autonomyLevel === 0 ? "Manual Approval" : autonomyLevel === 1 ? "Assisted Mode" : "High Autonomy"}
                  </span>
                </div>

                <div className="px-2">
                  <Slider
                    defaultValue={[2]}
                    max={2}
                    step={1}
                    onValueChange={(vals) => setAutonomyLevel(vals[0])}
                    className="py-4"
                  />
                  <div className="flex justify-between text-[#55708c] text-xs font-medium mt-2">
                    <span>Human-in-the-loop</span>
                    <span>Assisted</span>
                    <span>Autonomous</span>
                  </div>
                </div>

                <div className="bg-[#111a22] rounded-lg p-4 border border-border-dark">
                  <h4 className="text-white text-sm font-bold mb-2">
                    {autonomyLevel === 0 ? "Strict Control" : autonomyLevel === 1 ? "Balanced Collaboration" : "Proactive Execution"}
                  </h4>
                  <p className="text-[#92adc9] text-xs leading-relaxed">
                    {autonomyLevel === 0
                      ? "Donna will draft emails and queue tasks but will NEVEER execute an action without your explicit click. Safe, but slower."
                      : autonomyLevel === 1
                        ? "Donna handles routine scheduling and low-risk replies automatically. Strategic decisions and specialized emails require approval."
                        : "Donna independently manages inventory, customer drafts, and initial design generation. Only specifically gated actions (Pricing, Refunds > $500) trigger alerts."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Memory Retention */}
          <section className="flex flex-col gap-4">
            <h3 className="text-white text-xl font-bold font-display flex items-center gap-2">
              <span className="material-symbols-outlined text-accent-purple">memory</span>
              Memory Management
            </h3>
            <div className="rounded-xl border border-border-dark bg-card-dark p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-white text-sm font-bold">Operational Memory</span>
                    <span className="text-[#92adc9] text-xs">Remember task context and project details</span>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between border-t border-border-dark pt-4">
                  <div className="flex flex-col">
                    <span className="text-white text-sm font-bold">Long-term Retention</span>
                    <span className="text-[#92adc9] text-xs">Store interactions forever to learn preferences</span>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between border-t border-border-dark pt-4">
                  <div className="flex flex-col">
                    <span className="text-white text-sm font-bold">Vector Database Indexing</span>
                    <span className="text-[#92adc9] text-xs">Allow semantic search across all files (RAG)</span>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex justify-end mt-2">
                  <button className="text-red-400 hover:text-red-300 text-xs font-bold transition-colors">
                    Reset Memory Layer...
                  </button>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}