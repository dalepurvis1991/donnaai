import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/pages/dashboard";
import Landing from "@/pages/landing";
import Onboarding from "@/pages/onboarding";
import Settings from "@/pages/settings";
import EmailDetail from "@/pages/email-detail";
import Chat from "@/pages/chat";
import Memories from "@/pages/memories";
import Folders from "@/pages/folders";
import Digest from "@/pages/digest";
import BulkProcessing from "@/pages/bulk-processing";
import Tasks from "@/pages/tasks";
import Correlations from "@/pages/correlations";
import TeamMembers from "@/pages/team-members";
import NotFound from "@/pages/not-found";
import { AppShell } from "@/components/AppShell";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [location, setLocation] = useLocation();

  const { data: onboarding, isLoading: isOnboardingLoading } = useQuery<{ completed: boolean, step: number }>({
    queryKey: ["/api/onboarding/status"],
    enabled: isAuthenticated && !!user,
  });

  useEffect(() => {
    if (isAuthenticated && !isLoading && !isOnboardingLoading && onboarding && !onboarding.completed) {
      if (location !== "/onboarding") {
        setLocation("/onboarding");
      }
    }
  }, [isAuthenticated, isLoading, isOnboardingLoading, onboarding, location, setLocation]);

  console.log('Router - Auth State:', { isAuthenticated, isLoading, hasUser: !!user });



  return (
    <Switch>
      {isLoading || isOnboardingLoading ? (
        <div className="min-h-screen flex items-center justify-center bg-[#030711]">
          <div className="text-lg text-white">Initializing Neural Core...</div>
        </div>
      ) : (
        <Switch>
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/*">
            <AppShell>
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/settings" component={Settings} />
                <Route path="/email/:id" component={EmailDetail} />
                <Route path="/chat" component={Chat} />
                <Route path="/memories" component={Memories} />
                <Route path="/folders" component={Folders} />
                <Route path="/digest" component={Digest} />
                <Route path="/tasks" component={Tasks} />
                <Route path="/correlations" component={Correlations} />
                <Route path="/bulk-processing" component={BulkProcessing} />
                <Route path="/team" component={TeamMembers} />
                <Route path="/decision-feed" component={Dashboard} /> {/* Temporary until created */}
                <Route path="/audit" component={Dashboard} /> {/* Temporary until created */}
                <Route component={NotFound} />
              </Switch>
            </AppShell>
          </Route>
        </Switch>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
