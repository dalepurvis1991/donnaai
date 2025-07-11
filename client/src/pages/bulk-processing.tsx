import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  Zap, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  Database,
  Brain
} from "lucide-react";

export default function BulkProcessing() {
  const [emailLimit, setEmailLimit] = useState(1000);
  const [processedCount, setProcessedCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const bulkProcessMutation = useMutation({
    mutationFn: async (limit: number) => {
      const response = await apiRequest("POST", "/api/emails/bulk-process", { limit });
      return response.json();
    },
    onSuccess: (data) => {
      setProcessedCount(data.processed);
      setIsProcessing(false);
      toast({
        title: "Success",
        description: `Successfully processed ${data.processed} emails for learning`,
      });
    },
    onError: (error) => {
      setIsProcessing(false);
      toast({
        title: "Error",
        description: "Failed to process emails in bulk",
        variant: "destructive",
      });
    }
  });

  const handleBulkProcess = () => {
    setIsProcessing(true);
    setProcessedCount(0);
    bulkProcessMutation.mutate(emailLimit);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
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
        <Database className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Bulk Email Processing</h1>
        <Badge variant="outline" className="ml-2">
          <Brain className="h-3 w-3 mr-1" />
          Pro Feature
        </Badge>
      </div>

      {/* Pro Feature Alert */}
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This feature processes large batches of emails to build comprehensive context for Donna AI's learning system. 
          This improves response quality and understanding of your email patterns.
        </AlertDescription>
      </Alert>

      {/* Configuration */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Bulk Processing Configuration
          </CardTitle>
          <CardDescription>
            Set the number of emails to process for learning context
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email-limit">Number of Emails to Process</Label>
              <Input
                id="email-limit"
                type="number"
                value={emailLimit}
                onChange={(e) => setEmailLimit(Number(e.target.value))}
                min="100"
                max="5000"
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Recommended: 1000 emails for optimal learning context
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Button
                onClick={handleBulkProcess}
                disabled={isProcessing || bulkProcessMutation.isPending}
                className="flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Start Bulk Processing
                  </>
                )}
              </Button>

              {processedCount > 0 && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Processed {processedCount} emails</span>
                </div>
              )}
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <Progress value={33} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  Processing emails... This may take a few minutes.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Processing Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Benefits of Bulk Processing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <Brain className="h-5 w-5 text-blue-500 mt-1" />
              <div>
                <h4 className="font-medium">Enhanced AI Learning</h4>
                <p className="text-sm text-muted-foreground">
                  Provides comprehensive context for better email understanding
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-yellow-500 mt-1" />
              <div>
                <h4 className="font-medium">Improved Categorization</h4>
                <p className="text-sm text-muted-foreground">
                  Better pattern recognition for email classification
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
              <div>
                <h4 className="font-medium">Smart Insights</h4>
                <p className="text-sm text-muted-foreground">
                  Generate more accurate business insights and recommendations
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-purple-500 mt-1" />
              <div>
                <h4 className="font-medium">Better Responses</h4>
                <p className="text-sm text-muted-foreground">
                  More contextual and relevant AI chat responses
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}