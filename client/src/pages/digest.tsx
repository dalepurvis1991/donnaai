import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  Mail, 
  DollarSign, 
  Package, 
  Clock, 
  Settings, 
  Bell,
  BarChart3,
  Zap,
  Calendar
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
    mutationFn: (hoursBack: number) => 
      apiRequest("/api/digest/generate", {
        method: "POST",
        body: { hoursBack }
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/digest/history"] });
      toast({
        title: "Success",
        description: "Daily digest generated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate digest",
        variant: "destructive",
      });
    }
  });

  // Update notification settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (settings: Partial<NotificationSettings>) =>
      apiRequest("/api/notifications/settings", {
        method: "PUT",
        body: settings
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/settings"] });
      setIsSettingsOpen(false);
      toast({
        title: "Success",
        description: "Notification settings updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings",
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
    return `${currency}${amount.toFixed(2)}`;
  };

  const latestDigest = digestHistory[0];

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Daily Business Digest</h1>
          <p className="text-muted-foreground">Your personalized business insights and email summary</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Notification Settings</DialogTitle>
                <DialogDescription>
                  Configure when and how you receive daily digests
                </DialogDescription>
              </DialogHeader>
              <NotificationSettingsForm 
                settings={notificationSettings}
                onSave={handleUpdateSettings}
                isLoading={updateSettingsMutation.isPending}
              />
            </DialogContent>
          </Dialog>
          
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={hoursBack}
              onChange={(e) => setHoursBack(Number(e.target.value))}
              className="w-20"
              min="1"
              max="168"
            />
            <Label className="text-sm text-muted-foreground">hours</Label>
          </div>
          
          <Button 
            onClick={handleGenerateDigest}
            disabled={generateDigestMutation.isPending}
          >
            <Zap className="h-4 w-4 mr-2" />
            {generateDigestMutation.isPending ? "Generating..." : "Generate Digest"}
          </Button>
        </div>
      </div>

      {/* Latest Digest Overview */}
      {latestDigest && (
        <div className="grid gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Latest Digest - {new Date(latestDigest.date).toLocaleDateString()}
              </CardTitle>
              <CardDescription>{latestDigest.summary}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Sales Total</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(latestDigest.metrics.salesOrders.totalValue, latestDigest.metrics.salesOrders.currency)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Package className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Orders</p>
                    <p className="text-lg font-semibold">{latestDigest.metrics.salesOrders.count}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Order</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(latestDigest.metrics.salesOrders.averageOrderValue, latestDigest.metrics.salesOrders.currency)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <Mail className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Emails</p>
                    <p className="text-lg font-semibold">{latestDigest.metrics.emailCounts.total}</p>
                  </div>
                </div>
              </div>
              
              {/* Product Breakdown */}
              {Object.keys(latestDigest.metrics.salesOrders.products).length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Product Sales</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(latestDigest.metrics.salesOrders.products).map(([product, count]) => (
                      <Badge key={product} variant="secondary">
                        {count}x {product}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Insights */}
              {latestDigest.insights.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Key Insights</h4>
                  <ul className="space-y-2">
                    {latestDigest.insights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Digest History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Digest History
          </CardTitle>
          <CardDescription>Previous daily business summaries</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="text-center py-8">Loading digest history...</div>
          ) : digestHistory.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No digests yet</h3>
              <p className="text-muted-foreground mb-4">
                Generate your first daily digest to see business insights
              </p>
              <Button onClick={handleGenerateDigest} disabled={generateDigestMutation.isPending}>
                <Zap className="h-4 w-4 mr-2" />
                Generate First Digest
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {digestHistory.map((digest, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {new Date(digest.date).toLocaleDateString('en-GB', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </CardTitle>
                      <Badge variant="outline">{digest.period}</Badge>
                    </div>
                    <CardDescription>{digest.summary}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Sales</p>
                        <p className="font-semibold">
                          {formatCurrency(digest.metrics.salesOrders.totalValue, digest.metrics.salesOrders.currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Orders</p>
                        <p className="font-semibold">{digest.metrics.salesOrders.count}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Emails</p>
                        <p className="font-semibold">{digest.metrics.emailCounts.total}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg Order</p>
                        <p className="font-semibold">
                          {formatCurrency(digest.metrics.salesOrders.averageOrderValue, digest.metrics.salesOrders.currency)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="digest-enabled">Enable Daily Digest</Label>
        <Switch
          id="digest-enabled"
          checked={formData.digestEnabled}
          onCheckedChange={(checked) => 
            setFormData({ ...formData, digestEnabled: checked })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="digest-time">Digest Time</Label>
        <Input
          id="digest-time"
          type="time"
          value={formData.digestTime}
          onChange={(e) => 
            setFormData({ ...formData, digestTime: e.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Select 
          value={formData.timezone} 
          onValueChange={(value) => 
            setFormData({ ...formData, timezone: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="UTC">UTC</SelectItem>
            <SelectItem value="Europe/London">London (GMT)</SelectItem>
            <SelectItem value="America/New_York">New York (EST)</SelectItem>
            <SelectItem value="America/Los_Angeles">Los Angeles (PST)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Include in Digest</Label>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="sales-metrics" className="text-sm">Sales Metrics</Label>
          <Switch
            id="sales-metrics"
            checked={formData.includeSalesMetrics}
            onCheckedChange={(checked) => 
              setFormData({ ...formData, includeSalesMetrics: checked })
            }
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="email-counts" className="text-sm">Email Counts</Label>
          <Switch
            id="email-counts"
            checked={formData.includeEmailCounts}
            onCheckedChange={(checked) => 
              setFormData({ ...formData, includeEmailCounts: checked })
            }
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="top-senders" className="text-sm">Top Senders</Label>
          <Switch
            id="top-senders"
            checked={formData.includeTopSenders}
            onCheckedChange={(checked) => 
              setFormData({ ...formData, includeTopSenders: checked })
            }
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Settings"}
        </Button>
      </DialogFooter>
    </form>
  );
}