import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Zap, Shield, ArrowRight, Star } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const { toast } = useToast();

  const demoLoginMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/demo-login", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Demo Login Successful",
        description: "You're now logged in with a demo account to test Donna AI.",
      });
      window.location.href = '/';
    },
    onError: () => {
      toast({
        title: "Demo Login Failed",
        description: "Please try again or use Google login.",
        variant: "destructive",
      });
    },
  });

  const handleLogin = async () => {
    try {
      window.location.href = window.location.origin + '/api/login/google';
    } catch (error) {
      console.error('Login redirect failed:', error);
      alert('Failed to redirect. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#101522] text-white selection:bg-primary/30 relative overflow-hidden">
      {/* Mesh Gradients */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 blur-[120px] rounded-full -mr-96 -mt-96 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/10 blur-[100px] rounded-full -ml-48 -mb-48 pointer-events-none"></div>

      <main className="container mx-auto px-6 pt-32 pb-24 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-2 animate-fade-in">
              <span className="size-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-sm font-medium text-slate-300">New: Multi-stage task tracking</span>
            </div>
          </div>

          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
              Your Intelligent Assistant <br />
              <span className="text-gradient">That Knows You</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-12">
              The only AI inbox assistant that doesn't just categorize your email, but handles your business operations autonomously.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={handleLogin}
                size="lg"
                className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 text-white rounded-xl shadow-glow transition-all active:scale-95 flex items-center gap-3 w-full sm:w-auto"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Connect Gmail
              </Button>
              <Button
                onClick={() => demoLoginMutation.mutate()}
                disabled={demoLoginMutation.isPending}
                variant="outline"
                size="lg"
                className="h-14 px-8 text-lg bg-white/5 hover:bg-white/10 text-white border-white/10 rounded-xl backdrop-blur-md transition-all active:scale-95 w-full sm:w-auto"
              >
                {demoLoginMutation.isPending ? "Logging in..." : "Try Demo Version"}
              </Button>
            </div>

            {/* Social Proof */}
            <div className="mt-12 flex items-center justify-center gap-8 grayscale opacity-50">
              <div className="font-bold text-2xl tracking-tighter">Fast Company</div>
              <div className="font-bold text-2xl tracking-tighter">Wired</div>
              <div className="font-bold text-2xl tracking-tighter">The Verge</div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-24">
            {[
              {
                icon: <Mail className="text-blue-400" />,
                title: "FYI",
                desc: "Intelligent summarization for newsletters, updates, and informational threads."
              },
              {
                icon: <Zap className="text-amber-400" />,
                title: "Draft",
                desc: "AI-generated drafts based on your tone and business context, ready for your sign-off."
              },
              {
                icon: <ArrowRight className="text-emerald-400" />,
                title: "Forward",
                desc: "Proactive task assignment. Forwards emails to team and tracks them automatically."
              }
            ].map((feature, i) => (
              <div key={i} className="group p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all">
                <div className="size-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Stats Bar */}
          <div className="p-12 rounded-3xl bg-primary/5 border border-primary/10 backdrop-blur-xl grid grid-cols-2 md:grid-cols-4 gap-8 text-center italic">
            <div>
              <div className="text-4xl font-bold text-primary mb-1">10k+</div>
              <div className="text-sm text-slate-500 uppercase tracking-widest">Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-1">2M+</div>
              <div className="text-sm text-slate-500 uppercase tracking-widest">Processed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-1">45%</div>
              <div className="text-sm text-slate-500 uppercase tracking-widest">Time Saved</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-1">99.9%</div>
              <div className="text-sm text-slate-500 uppercase tracking-widest">Accuracy</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 border-t border-white/5 text-center">
        <p className="text-slate-500 text-sm">© 2025 Donna AI. Built for the modern workforce.</p>
      </footer>
    </div>
  );
}
