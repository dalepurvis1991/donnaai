import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, LinkIcon, TrendingUp, FileText, ShoppingCart, MessageSquare, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";

interface CorrelationGroup {
  groupId: string;
  subject: string;
  type: string;
  emails: Array<{
    email: any;
    metadata: any;
  }>;
  analysis?: {
    bestOption?: any;
    comparison?: any;
    recommendation?: string;
  };
}

export default function Correlations() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ["/api/correlations"],
    enabled: isAuthenticated,
  });

  const { data: groupDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ["/api/correlations", selectedGroup],
    enabled: !!selectedGroup,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/correlations/${selectedGroup}`);
      return response.json();
    },
  });

  if (authLoading || groupsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "quote":
        return <TrendingUp className="h-4 w-4" />;
      case "invoice":
        return <FileText className="h-4 w-4" />;
      case "order":
        return <ShoppingCart className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "quote":
        return "secondary";
      case "invoice":
        return "default";
      case "order":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.href = "/"}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="h-6 w-px bg-border" />
        <LinkIcon className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Email Correlations</h1>
      </div>

      {/* Correlation Groups */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups && groups.length > 0 ? (
          groups.map((group: CorrelationGroup) => (
            <Card
              key={group.groupId}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedGroup(group.groupId)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(group.type)}
                    <CardTitle className="text-lg">{group.subject}</CardTitle>
                  </div>
                  <Badge variant={getTypeBadgeVariant(group.type)}>
                    {group.type}
                  </Badge>
                </div>
                <CardDescription>
                  {group.emails.length} related emails
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {group.emails.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="text-sm text-muted-foreground">
                      • {item.email.sender}
                    </div>
                  ))}
                  {group.emails.length > 3 && (
                    <div className="text-sm text-muted-foreground">
                      + {group.emails.length - 3} more...
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-muted-foreground">
                    Click to view details
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <Alert>
              <AlertDescription>
                No email correlations found yet. Donna AI will automatically detect related emails as they arrive.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>

      {/* Group Details Dialog */}
      <Dialog open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Correlation Details</DialogTitle>
          </DialogHeader>
          
          {detailsLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : groupDetails ? (
            <Tabs defaultValue="emails" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="emails">Related Emails</TabsTrigger>
                <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
              </TabsList>
              
              <TabsContent value="emails" className="space-y-4">
                {groupDetails.correlations?.map((correlation: any) => {
                  const email = groups?.find((g: CorrelationGroup) => g.groupId === selectedGroup)
                    ?.emails.find((e: any) => e.email.id === correlation.emailId)?.email;
                  
                  if (!email) return null;
                  
                  return (
                    <Card key={correlation.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{email.subject}</CardTitle>
                            <CardDescription>
                              From: {email.sender} ({email.senderEmail})
                            </CardDescription>
                          </div>
                          <Badge>{correlation.correlationType}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {email.body}
                        </p>
                        {correlation.metadata && (
                          <div className="mt-3 space-y-1">
                            {correlation.metadata.price && (
                              <div className="text-sm">
                                <span className="font-medium">Price:</span> £{correlation.metadata.price}
                              </div>
                            )}
                            {correlation.metadata.vendor && (
                              <div className="text-sm">
                                <span className="font-medium">Vendor:</span> {correlation.metadata.vendor}
                              </div>
                            )}
                            {correlation.metadata.product && (
                              <div className="text-sm">
                                <span className="font-medium">Product:</span> {correlation.metadata.product}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="mt-2 text-xs text-muted-foreground">
                          Confidence: {Math.round((correlation.confidence || 0.9) * 100)}%
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>
              
              <TabsContent value="analysis" className="space-y-4">
                {groupDetails.analysis ? (
                  <>
                    {groupDetails.analysis.comparison && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Quote Comparison</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {groupDetails.analysis.comparison.quotes?.map((quote: any, idx: number) => (
                              <div key={idx} className="border rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">{quote.vendor}</span>
                                  <Badge variant="outline">£{quote.price}</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground space-y-1">
                                  {quote.pros?.map((pro: string, i: number) => (
                                    <div key={i}>✓ {pro}</div>
                                  ))}
                                  {quote.cons?.map((con: string, i: number) => (
                                    <div key={i}>✗ {con}</div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {groupDetails.analysis.recommendation && (
                      <Alert>
                        <AlertDescription>
                          <strong>AI Recommendation:</strong> {groupDetails.analysis.recommendation}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {groupDetails.analysis.bestOption && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Best Option</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div>
                              <span className="font-medium">Vendor:</span> {groupDetails.analysis.bestOption.vendor}
                            </div>
                            <div>
                              <span className="font-medium">Price:</span> £{groupDetails.analysis.bestOption.price}
                            </div>
                            <div>
                              <span className="font-medium">Reason:</span> {groupDetails.analysis.bestOption.reason}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <Alert>
                    <AlertDescription>
                      No analysis available yet. AI analysis will be generated when enough related emails are found.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}