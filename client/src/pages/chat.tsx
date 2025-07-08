import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, MessageCircle, Sparkles, Mail, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
  const { isAuthenticated, isLoading } = useAuth();
  const [message, setMessage] = useState("");
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

  // Scroll to bottom when new messages arrive
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

  if (isLoading || messagesLoading) {
    return <div className="p-6">Loading chat...</div>;
  }

  if (!isAuthenticated) {
    return <div className="p-6">Please log in to access chat.</div>;
  }

  const suggestedQuestions = [
    "Show me my most important emails from today",
    "What patterns do you see in my email habits?",
    "Help me categorize emails better",
    "Summarize my Draft emails",
    "What are my most frequent email contacts?",
    "Create a rule for newsletter emails",
  ];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Chat with Baron</h1>
        <Badge variant="outline" className="ml-2">
          <Sparkles className="h-3 w-3 mr-1" />
          AI Assistant
        </Badge>
      </div>

      {/* Chat Container */}
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="border-b">
          <CardTitle className="text-lg">Email Assistant Chat</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ask Baron about your emails, get insights, and manage your inbox intelligently
          </p>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center space-y-6 mt-8">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Welcome to Baron Chat!</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  I'm your AI email assistant. Ask me anything about your emails or try one of these:
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl mx-auto">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-left h-auto p-3 whitespace-normal"
                    onClick={() => setMessage(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className={`max-w-[70%] space-y-1 ${msg.role === "user" ? "order-first" : ""}`}>
                <div
                  className={`rounded-lg p-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-muted"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  
                  {/* Email Context */}
                  {msg.emailContext && (
                    <div className="mt-2 flex items-center gap-2 text-xs opacity-70">
                      <Mail className="h-3 w-3" />
                      {msg.emailContext.emailIds.length} email(s) referenced
                      {msg.emailContext.category && (
                        <Badge variant="secondary" className="text-xs">
                          {msg.emailContext.category}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground px-3">
                  {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                </p>
              </div>

              {msg.role === "user" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {sendMessageMutation.isPending && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                  Baron is thinking...
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Textarea
              placeholder="Ask Baron about your emails..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              className="min-h-[44px] max-h-32 resize-none"
              rows={1}
            />
            <Button
              type="submit"
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="h-11"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </Card>
    </div>
  );
}