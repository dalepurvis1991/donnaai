import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Sparkles, Mail, MessageSquare, History, Wand2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { User as UserType } from "@shared/schema";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  emailContext?: {
    emailIds: number[];
    category?: string;
    action?: string;
  };
  createdAt: string;
}

export default function Chat() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth() as { user: UserType | null; isAuthenticated: boolean; isLoading: boolean };
  const [message, setMessage] = useState("");
  const [historyOpen, setHistoryOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat history
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages"],
    enabled: isAuthenticated,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/chat/send", {
        content,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
      setMessage("");
    },
  });

  const clearChatMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/chat/messages");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (authLoading || messagesLoading) {
    return (
      <div className="min-h-screen bg-[#101522] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium italic">Initializing Donna AI Assistant...</p>
        </div>
      </div>
    );
  }

  const suggestedQuestions = [
    "Summarize my unread FYI emails",
    "What tasks are pending approval?",
    "Show patterns in my email habits",
    "Who are my top priority contacts?",
  ];

  return (
    <div className="min-h-screen bg-[#101522] text-white flex flex-col overflow-hidden">
      <Header emailStatus="connected" />

      <div className="flex-1 flex overflow-hidden">
        {/* Modern Sidebar */}
        <div className={`hidden lg:flex flex-col border-r border-white/5 bg-black/20 transition-all duration-300 ${historyOpen ? 'w-80' : 'w-0 opacity-0 overflow-hidden'}`}>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-8">
              <History className="size-4 text-slate-500" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">History</h2>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => {
                  if (confirm("Start a new session? Previous messages will be cleared.")) {
                    clearChatMutation.mutate();
                  }
                }}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-glow transition-all mb-4 group"
              >
                <Sparkles className="size-4 animate-pulse" />
                <span className="text-sm font-bold uppercase tracking-wider">New Session</span>
              </button>

              <button className="w-full p-4 rounded-xl bg-primary/10 border border-primary/20 text-left group">
                <p className="text-sm font-bold text-white group-hover:text-primary transition-colors line-clamp-1 mb-1 italic">Current Session</p>
                <p className="text-xs text-slate-500 italic lowercase tracking-tight">Active assistant conversation</p>
              </button>

              <div className="px-4 py-8 text-center mt-12">
                <p className="text-xs text-slate-600 font-medium italic">Legacy sessions archived</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col relative bg-transparent">
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            <div className="max-w-3xl mx-auto space-y-8 pb-12 mt-8">
              {messages.length === 0 ? (
                <div className="py-24 text-center">
                  <div className="size-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-8 shadow-glow animate-bounce">
                    <span className="material-symbols-outlined text-4xl">smart_toy</span>
                  </div>
                  <h2 className="text-4xl font-bold tracking-tight mb-4">Hello, {user?.firstName}</h2>
                  <p className="text-slate-400 text-lg mb-12 italic">I'm Donna, your autonomous business assistant. How can I facilitate your operations today?</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                    {suggestedQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => setMessage(q)}
                        className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left text-sm font-medium text-slate-300 hover:bg-white/10 hover:border-primary/30 hover:text-white transition-all italic"
                      >
                        "{q}"
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-6 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`size-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${msg.role === "assistant" ? "bg-primary text-white shadow-glow" : "bg-white/10 text-slate-400"
                      }`}>
                      {msg.role === "assistant" ? (
                        <span className="material-symbols-outlined text-[24px]">smart_toy</span>
                      ) : (
                        <User className="size-5" />
                      )}
                    </div>

                    <div className={`max-w-[80%] space-y-2 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                      <div className={`p-5 rounded-3xl backdrop-blur-md ${msg.role === "assistant"
                        ? "bg-white/5 border border-white/10 text-white rounded-tl-none ring-1 ring-white/5"
                        : "bg-primary text-white rounded-tr-none shadow-glow font-medium"
                        }`}>
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                        {msg.emailContext && (
                          <div className={`mt-4 pt-4 border-t ${msg.role === "assistant" ? 'border-white/5' : 'border-white/10'} flex items-center gap-3`}>
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold uppercase tracking-wider">
                              <Mail className="size-3" />
                              {msg.emailContext.emailIds.length} Emails Referenced
                            </div>
                            {msg.emailContext.category && (
                              <Badge className="bg-white/20 text-white text-[10px] uppercase font-bold border-none px-2.5 py-1">
                                {msg.emailContext.category}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-1">
                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              )}

              {sendMessageMutation.isPending && (
                <div className="flex gap-6">
                  <div className="size-10 rounded-2xl bg-primary flex items-center justify-center text-white flex-shrink-0 animate-pulse shadow-glow">
                    <span className="material-symbols-outlined text-[24px]">smart_toy</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-4">
                    <div className="flex gap-1.5">
                      <div className="size-1.5 bg-primary rounded-full animate-bounce"></div>
                      <div className="size-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="size-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest italic">Donna is processing...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Premium Input Area */}
          <div className="p-6 bg-black/20 border-t border-white/5 backdrop-blur-3xl">
            <div className="max-w-3xl mx-auto">
              <form onSubmit={handleSendMessage} className="relative group">
                <div className="absolute inset-x-0 bottom-0 h-full bg-primary/20 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center p-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md focus-within:border-primary/50 focus-within:bg-white/15 transition-all">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Inquire about your operations, summarize drafts, or manage tasks..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-500 placeholder:italic px-5 py-4"
                  />
                  <Button
                    type="submit"
                    disabled={!message.trim() || sendMessageMutation.isPending}
                    className="size-12 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-glow transition-all active:scale-95 flex items-center justify-center p-0"
                  >
                    <Send className="size-5" />
                  </Button>
                </div>
                <p className="mt-4 text-center text-[9px] font-bold text-slate-700 uppercase tracking-[0.3em] italic"> BarChat Protocol V3.0 • End-to-end AI Encryption • Autopost Active</p>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}