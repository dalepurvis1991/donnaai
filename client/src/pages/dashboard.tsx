import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";
import StatsOverview from "@/components/StatsOverview";
import EmailColumn from "@/components/EmailColumn";
import { useToast } from "@/hooks/use-toast";
import type { EmailStats, CategorizedEmails } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();

  // Fetch email statistics
  const { data: stats, isLoading: statsLoading } = useQuery<EmailStats>({
    queryKey: ["/api/emails/stats"],
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch categorized emails
  const { data: emails, isLoading: emailsLoading } = useQuery<CategorizedEmails>({
    queryKey: ["/api/emails/categorized"],
    refetchInterval: 60000, // Refetch every minute
  });

  // Check connection status
  const { data: healthCheck } = useQuery<{ status: string; emailConnection: string }>({
    queryKey: ["/api/health"],
    refetchInterval: 30000, // Check every 30 seconds
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

  const isLoading = statsLoading || emailsLoading || refreshMutation.isPending;
  const connectionStatus = healthCheck?.emailConnection === "connected" ? "connected" : "disconnected";

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
