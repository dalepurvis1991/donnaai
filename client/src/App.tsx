import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
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
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  console.log('Router - Auth State:', { isAuthenticated, isLoading, hasUser: !!user });

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
