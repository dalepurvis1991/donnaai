import { useQuery, useMutation } from "@tanstack/react-query";
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
  const { data: googleStatus, isLoading: googleStatusLoading } = useQuery<{ 
    connected: boolean; 
    hasGmail: boolean; 
    hasCalendar: boolean; 
  }>({
    queryKey: ["/api/auth/google/status"],
    refetchInterval: 30000,
  });

  // Fetch email statistics (only if Google connected)
  const { data: stats, isLoading: statsLoading } = useQuery<EmailStats>({
    queryKey: ["/api/emails/stats"],
    refetchInterval: 60000,
    enabled: googleStatus?.connected === true,
  });

  // Fetch categorized emails (only if Google connected)
  const { data: emails, isLoading: emailsLoading } = useQuery<CategorizedEmails>({
    queryKey: ["/api/emails/categorized"],
    refetchInterval: 60000,
    enabled: googleStatus?.connected === true,
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

  // Refresh emails mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/emails/refresh");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/emails/categorized"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health"] });
      toast({
        title: "Emails refreshed",
        description: `Fetched ${data.count} new emails successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Refresh failed",
        description: error instanceof Error ? error.message : "Failed to refresh emails",
        variant: "destructive",
      });
    },
  });

  const handleRefresh = () => {
    refreshMutation.mutate();
  };

  // Show Google connection screen if not connected
  if (!googleStatusLoading && !googleStatus?.connected) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header 
          connectionStatus="disconnected"
          onRefresh={() => {}}
          isRefreshing={false}
        />
        
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

  const isLoading = statsLoading || emailsLoading || refreshMutation.isPending;
  const connectionStatus = 
    healthCheck?.emailConnection === "connected" && 
    healthCheck?.calendarConnection === "connected" 
      ? "connected" : "disconnected";

  return (
    <div className="min-h-screen bg-slate-50">
      <Header 
        connectionStatus={connectionStatus}
        onRefresh={handleRefresh}
        isRefreshing={refreshMutation.isPending}
      />
      
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

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-baron-blue"></div>
              <p className="text-slate-600">
                {refreshMutation.isPending ? "Fetching latest emails..." : "Loading..."}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
