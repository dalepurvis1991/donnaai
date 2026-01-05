import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Reply, Send, Tag, User, Calendar, Clock, Mail, Bot, Sparkles, Zap, Plus, Wand2, ShieldCheck, Share2 } from "lucide-react";
import { formatDistanceToNow, isValid } from "date-fns";

interface Email {
  id: number;
  subject: string;
  sender: string;
  senderEmail: string;
  body: string;
  content?: string;
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
    queryKey: [`/api/emails/${emailId}`],
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

  // Create task from email
  const createTaskMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/emails/${emailId}/create-task`, {});
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Task created",
        description: `Task "${data.title}" has been created successfully.`,
      });
      setLocation("/tasks");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#101522] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium italic">Scanning email content...</p>
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="min-h-screen bg-[#101522] text-white">
        <Header emailStatus="connected" />
        <main className="max-w-3xl mx-auto px-6 py-24 text-center">
          <Mail className="size-16 text-slate-800 mx-auto mb-8" />
          <h2 className="text-3xl font-bold mb-4">Email trace not found</h2>
          <p className="text-slate-500 mb-12 italic">The requested communication may have been archived or deleted from our active database.</p>
          <Button onClick={() => setLocation("/")} className="bg-primary hover:bg-primary/90 shadow-glow px-8">Return to Terminal</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101522] text-white flex flex-col">
      <Header emailStatus="connected" />

      <main className="max-w-5xl mx-auto px-6 py-12 w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Navigation & Context Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-white/5">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors group"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest italic">Return to Inbox</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <ShieldCheck className="size-3.5 text-emerald-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Verified • Category: {email.category}</span>
            </div>
            <button className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
              <Share2 className="size-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Subject Card */}
            <div className="p-10 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl relative overflow-hidden ring-1 ring-white/5">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl -mr-32 -mt-32 rounded-full"></div>

              <div className="relative z-10">
                <h1 className="text-3xl font-bold tracking-tight mb-8 leading-tight">{email.subject}</h1>

                <div className="flex items-center gap-4 mb-10 pb-8 border-b border-white/5">
                  <div className="size-12 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center text-lg font-bold">
                    {(email.sender || "?")[0]}
                  </div>
                  <div>
                    <p className="text-white font-bold">{email.sender}</p>
                    <p className="text-slate-500 text-xs italic tracking-tight">{email.senderEmail}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{email.date && isValid(new Date(email.date))
                      ? formatDistanceToNow(new Date(email.date), { addSuffix: true })
                      : "Recently"}</p>
                    <p className="text-[10px] text-slate-700 italic">via Donna Protocol</p>
                  </div>
                </div>

                <div
                  className="text-slate-300 text-[15px] leading-relaxed whitespace-pre-wrap select-text italic selection:bg-primary/30"
                  dangerouslySetInnerHTML={{
                    __html: (email.body || email.content || "").replace(/\n/g, '<br>')
                  }}
                />
              </div>
            </div>

            {/* Reply Area */}
            {showReply && (
              <div className="p-8 rounded-3xl bg-black/40 border border-primary/20 shadow-glow-sm relative animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Reply className="size-5 text-primary" />
                    <h3 className="font-bold text-lg uppercase tracking-wider">Compose Response</h3>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-primary/20">AI Enhanced</Badge>
                </div>

                {showDraftSuggestion && draftSuggestion && (
                  <div className="mb-6 p-5 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-4">
                    <Wand2 className="size-6 text-primary mt-1" />
                    <div>
                      <p className="text-sm font-bold text-white mb-1 italic">Donna's Context Awareness</p>
                      <p className="text-xs text-slate-400 leading-relaxed mb-4 italic">"{draftSuggestion.reasoning}"</p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500 border border-white/5">
                          Tone: {draftSuggestion.tone}
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500 border border-white/5">
                          Confidence: {draftSuggestion.confidence}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Draft your executive response..."
                  className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl p-5 text-slate-300 focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-slate-600 mb-6 italic"
                />

                <div className="flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setShowReply(false)} className="text-slate-500 hover:text-white">Discard</Button>
                  <Button
                    onClick={() => replyMutation.mutate()}
                    disabled={!replyText?.trim() || replyMutation.isPending}
                    className="bg-primary hover:bg-primary/90 shadow-glow px-8 rounded-xl font-bold italic"
                  >
                    {replyMutation.isPending ? "Transmitting..." : "Send via Donna AI"}
                    <Send className="size-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* AI Sidebar Column */}
          <div className="space-y-6">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 mb-8 flex items-center gap-2">
                <Bot className="size-4" />
                AI Actions
              </h3>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => createTaskMutation.mutate()}
                  disabled={createTaskMutation.isPending}
                  className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/50 transition-all group"
                >
                  <Plus className="size-6 text-slate-400 group-hover:text-primary mb-3 transition-colors" />
                  <span className="text-xs font-bold uppercase tracking-widest">{createTaskMutation.isPending ? "Assigning..." : "Create Task"}</span>
                </button>

                <button
                  onClick={() => draftMutation.mutate()}
                  disabled={draftMutation.isPending}
                  className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-500/50 transition-all group"
                >
                  <Wand2 className="size-6 text-slate-400 group-hover:text-amber-500 mb-3 transition-colors" />
                  <span className="text-xs font-bold uppercase tracking-widest">{draftMutation.isPending ? "Thinking..." : "Generate Draft"}</span>
                </button>

                <button
                  onClick={() => setShowReply(!showReply)}
                  className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/50 transition-all group"
                >
                  <Reply className="size-6 text-slate-400 group-hover:text-emerald-500 mb-3 transition-colors" />
                  <span className="text-xs font-bold uppercase tracking-widest">Manual Reply</span>
                </button>
              </div>
            </div>

            {/* Categorization Card */}
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 mb-8 flex items-center gap-2">
                <Tag className="size-4" />
                Optimization
              </h3>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Strategic Category</label>
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-0">
                      <SelectValue placeholder={email.category} />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/10 text-white backdrop-blur-xl">
                      <SelectItem value="FYI">FYI</SelectItem>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Forward">Forward</SelectItem>
                    </SelectContent>
                  </Select>

                  {newCategory && newCategory !== email.category && (
                    <Button
                      onClick={() => recategorizeMutation.mutate(newCategory)}
                      className="w-full bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-all rounded-xl mt-2"
                    >
                      Execute Change
                    </Button>
                  )}
                </div>

                {newCategory && newCategory !== email.category && (
                  <div className="pt-6 border-t border-white/10 space-y-4">
                    <p className="text-[10px] font-bold text-slate-600 uppercase italic">Enable Automation Protocol</p>
                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => createRuleMutation.mutate("sender")}
                        disabled={createRuleMutation.isPending}
                        className="bg-white/5 text-[10px] justify-start px-4 h-11 border border-white/5 hover:border-primary/30 text-slate-400 hover:text-white font-bold tracking-tight rounded-xl italic"
                      >
                        Always {newCategory} from sender
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => createRuleMutation.mutate("subject")}
                        disabled={createRuleMutation.isPending}
                        className="bg-white/5 text-[10px] justify-start px-4 h-11 border border-white/5 hover:border-primary/30 text-slate-400 hover:text-white font-bold tracking-tight rounded-xl italic"
                      >
                        Always {newCategory} by subject
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}