import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";
import StatsOverview from "@/components/StatsOverview";
import EmailColumn from "@/components/EmailColumn";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Calendar, ArrowRight } from "lucide-react";
import type { EmailStats, CategorizedEmails } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();

  // Check Google connection status
  const { data: googleStatus, isLoading: googleStatusLoading, error: googleStatusError } = useQuery<{ 
    connected: boolean; 
    hasGmail: boolean; 
    hasCalendar: boolean; 
  }>({
    queryKey: ["/api/auth/google/status"],
    refetchInterval: 30000,
    retry: false,
  });

  // Debug logging
  console.log('Google status:', googleStatus, 'Loading:', googleStatusLoading, 'Error:', googleStatusError);

  // Fetch email statistics
  const { data: stats, isLoading: statsLoading } = useQuery<EmailStats>({
    queryKey: ["/api/emails/stats"],
    refetchInterval: 60000,
  });

  // Fetch categorized emails
  const { data: emails, isLoading: emailsLoading } = useQuery<CategorizedEmails>({
    queryKey: ["/api/emails/categorized"],
    refetchInterval: 60000,
  });

  // Check health status (only if Google connected)
  const { data: healthCheck } = useQuery<{ 
    status: string; 
    emailConnection: string; 
    calendarConnection: string; 
  }>({
    queryKey: ["/api/health"],
    refetchInterval: 30000,
    enabled: googleStatus?.connected === true,
  });

  // Background refresh emails mutation (non-blocking)
  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/emails/refresh");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/emails/categorized"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health"] });
      // Silent success - no toast to avoid interrupting user
    },
    onError: (error) => {
      // Only show error toast for manual refresh, not background refresh
      console.error("Background refresh failed:", error);
    },
  });

  // Determine email status for header
  const getEmailStatus = () => {
    if (refreshMutation.isPending) return "refreshing";
    if (googleStatus?.connected && healthCheck?.emailConnection === "connected") return "connected";
    return "disconnected";
  };

  // Auto-trigger background refresh on initial load if connected
  useEffect(() => {
    if (googleStatus?.connected && !refreshMutation.isPending) {
      refreshMutation.mutate();
    }
  }, [googleStatus?.connected]);

  // Show Google connection screen if not connected
  if (!googleStatusLoading && googleStatus && !googleStatus.connected) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header emailStatus="disconnected" />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-2xl mb-2">Connect Your Google Account</CardTitle>
                <p className="text-gray-600 dark:text-gray-300">
                  Grant access to Gmail and Calendar to start managing your productivity
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col items-center p-4 border rounded-lg">
                    <Mail className="h-8 w-8 text-blue-500 mb-2" />
                    <h3 className="font-semibold">Gmail Access</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                      Read and categorize your emails
                    </p>
                  </div>
                  <div className="flex flex-col items-center p-4 border rounded-lg">
                    <Calendar className="h-8 w-8 text-green-500 mb-2" />
                    <h3 className="font-semibold">Calendar Access</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                      View your upcoming events
                    </p>
                  </div>
                </div>
                
                <Button 
                  size="lg" 
                  className="w-full max-w-md"
                  onClick={() => window.location.href = '/api/auth/google'}
                >
                  Connect Google Services
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                
                <p className="text-xs text-gray-500">
                  You'll be redirected to Google to grant permissions
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const isLoading = statsLoading || emailsLoading;
  const connectionStatus = 
    healthCheck?.emailConnection === "connected" && 
    healthCheck?.calendarConnection === "connected" 
      ? "connected" : "disconnected";

  return (
    <div className="min-h-screen bg-slate-50">
      <Header emailStatus={getEmailStatus()} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StatsOverview 
          stats={stats}
          isLoading={statsLoading}
        />

        {/* Email Categories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <EmailColumn
            title="FYI"
            description="Newsletters, confirmations, updates"
            color="blue"
            emails={emails?.fyi || []}
            count={stats?.fyiCount || 0}
            isLoading={emailsLoading}
          />
          
          <EmailColumn
            title="Draft"
            description="Emails needing action or response"
            color="amber"
            emails={emails?.draft || []}
            count={stats?.draftCount || 0}
            isLoading={emailsLoading}
          />
          
          <EmailColumn
            title="Forward"
            description="Emails to forward or delegate"
            color="emerald"
            emails={emails?.forward || []}
            count={stats?.forwardCount || 0}
            isLoading={emailsLoading}
          />
        </div>

        {/* No blocking loading overlay - app stays interactive */}
      </main>
    </div>
  );
}
