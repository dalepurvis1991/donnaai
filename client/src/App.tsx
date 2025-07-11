import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/pages/dashboard";
import Landing from "@/pages/landing";
import Settings from "@/pages/settings";
import EmailDetail from "@/pages/email-detail";
import Chat from "@/pages/chat";
import Memories from "@/pages/memories";
import Folders from "@/pages/folders";
import Digest from "@/pages/digest";
import BulkProcessing from "@/pages/bulk-processing";
import Tasks from "@/pages/tasks";
import Correlations from "@/pages/correlations";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  console.log('Router - Auth State:', { isAuthenticated, isLoading, hasUser: !!user });

  // Global auto-refresh functionality - refresh emails every 15 minutes when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    const autoRefreshEmails = async () => {
      try {
        await apiRequest("POST", "/api/emails/refresh", {});
        queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
        console.log("Auto-refresh: Emails updated successfully");
      } catch (error) {
        console.error("Auto-refresh failed:", error);
      }
    };

    // Initial fetch and then every 15 minutes
    const interval = setInterval(autoRefreshEmails, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  return (
    <Switch>
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-lg">Loading...</div>
        </div>
      ) : !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
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
        </>
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
