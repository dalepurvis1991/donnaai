import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Reply, Send, Tag, User, Calendar, Clock, Mail, Bot, Sparkles, Zap } from "lucide-react";
import { formatDistanceToNow, isValid } from "date-fns";

interface Email {
  id: number;
  subject: string;
  sender: string;
  senderEmail: string;
  body: string;
  date: string;
  category: string;
}

export default function EmailDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [replyText, setReplyText] = useState("");
  const [newCategory, setNewCategory] = useState<string>("");
  const [showReply, setShowReply] = useState(false);
  const [showDraftSuggestion, setShowDraftSuggestion] = useState(false);
  const [draftSuggestion, setDraftSuggestion] = useState<any>(null);

  const emailId = params.id;

  // Fetch email details
  const { data: email, isLoading } = useQuery<Email>({
    queryKey: ["/api/emails", emailId],
    enabled: !!emailId,
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: async () => {
      if (!email || !replyText.trim()) return;
      
      const response = await apiRequest("POST", `/api/emails/${emailId}/reply`, {
        to: email.senderEmail,
        subject: `Re: ${email.subject}`,
        body: replyText,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reply sent",
        description: `Your reply to ${email?.sender} has been sent.`,
      });
      setReplyText("");
      setShowReply(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send reply. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Recategorize mutation
  const recategorizeMutation = useMutation({
    mutationFn: async (category: string) => {
      const response = await apiRequest("PUT", `/api/emails/${emailId}/categorize`, {
        category,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails", emailId] });
      queryClient.invalidateQueries({ queryKey: ["/api/emails/categorized"] });
      queryClient.invalidateQueries({ queryKey: ["/api/emails/stats"] });
      toast({
        title: "Email recategorized",
        description: `Email moved to ${newCategory} category.`,
      });
      setNewCategory("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to recategorize email. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create rule mutation
  const createRuleMutation = useMutation({
    mutationFn: async (ruleType: "sender" | "subject") => {
      if (!email || !newCategory) return;
      
      const response = await apiRequest("POST", "/api/settings/rules", {
        type: ruleType,
        value: ruleType === "sender" ? email.senderEmail : email.subject,
        category: newCategory,
        confidence: 95,
      });
      return response.json();
    },
    onSuccess: (_, ruleType) => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Rule created",
        description: `Future emails from this ${ruleType} will be categorized as ${newCategory}.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create rule. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Draft assistant mutation
  const draftMutation = useMutation({
    mutationFn: async (userInput?: string) => {
      const response = await apiRequest("POST", `/api/emails/${emailId}/draft`, {
        userInput: userInput || "",
      });
      return response.json();
    },
    onSuccess: (data) => {
      setDraftSuggestion(data);
      setShowDraftSuggestion(true);
      setReplyText(data.body);
      setShowReply(true);
      toast({
        title: "AI Draft Generated",
        description: `Generated ${data.tone} reply with ${data.confidence}% confidence.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate AI draft. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div className="p-6">Loading email...</div>;
  }

  if (!email) {
    return <div className="p-6">Email not found.</div>;
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "FYI": return "bg-blue-100 text-blue-800";
      case "Draft": return "bg-amber-100 text-amber-800";
      case "Forward": return "bg-emerald-100 text-emerald-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => setLocation("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <Badge className={getCategoryColor(email.category)}>
          {email.category}
        </Badge>
      </div>

      {/* Email Content */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-xl">{email.subject}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {email.sender} ({email.senderEmail})
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {email.date && isValid(new Date(email.date)) ? formatDistanceToNow(new Date(email.date), { addSuffix: true }) : 'No date'}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => draftMutation.mutate()}
                disabled={draftMutation.isPending}
              >
                <Bot className="h-4 w-4 mr-2" />
                {draftMutation.isPending ? "Generating..." : "AI Draft"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowReply(!showReply)}
              >
                <Reply className="h-4 w-4 mr-2" />
                Reply
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: (email.body || 'No content available').replace(/\n/g, '<br>') 
            }}
          />
        </CardContent>
      </Card>

      {/* Reply Section */}
      {showReply && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Reply to {email.sender}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Show AI draft suggestion if available */}
            {showDraftSuggestion && draftSuggestion && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    AI Draft Suggestion ({draftSuggestion.confidence}% confidence, {draftSuggestion.tone} tone)
                  </span>
                </div>
                <p className="text-sm text-blue-700 italic">
                  {draftSuggestion.reasoning}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReplyText(draftSuggestion.body);
                      setShowDraftSuggestion(false);
                    }}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Use Draft
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowDraftSuggestion(false)}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            )}
            
            <Textarea
              placeholder="Type your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={6}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReply(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => replyMutation.mutate()}
                disabled={!replyText.trim() || replyMutation.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Reply
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categorization Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Email Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Change category..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FYI">FYI</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Forward">Forward</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              onClick={() => recategorizeMutation.mutate(newCategory)}
              disabled={!newCategory || newCategory === email.category || recategorizeMutation.isPending}
            >
              Recategorize
            </Button>
          </div>

          {newCategory && newCategory !== email.category && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Create automatic rules for future emails:
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => createRuleMutation.mutate("sender")}
                  disabled={createRuleMutation.isPending}
                >
                  Always categorize emails from {email.sender} as {newCategory}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => createRuleMutation.mutate("subject")}
                  disabled={createRuleMutation.isPending}
                >
                  Always categorize emails with this subject as {newCategory}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}