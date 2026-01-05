import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Brain,
  Search,
  Plus,
  Mail,
  MessageSquare,
  FileText,
  Clock,
  User,
  Hash,
  ArrowLeft,
  Sparkles,
  Database,
  SearchIcon,
  Fingerprint,
  Zap,
  ArrowRight,
  Boxes,
  Microscope,
  Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Memory {
  id: string;
  text: string;
  metadata: {
    type: "email" | "note" | "conversation";
    userId: string;
    emailId?: number;
    subject?: string;
    sender?: string;
    category?: string;
    createdAt: string;
  };
}

interface SearchResult {
  document: Memory;
  score: number;
}

export default function Memories() {
  const { isAuthenticated, isLoading } = useAuth() as any;
  const [searchQuery, setSearchQuery] = useState("");
  const [newNote, setNewNote] = useState("");
  const [showAddNote, setShowAddNote] = useState(false);

  // Fetch user memories
  const { data: memories = [], isLoading: memoriesLoading } = useQuery<Memory[]>({
    queryKey: ["/api/memories"],
    enabled: isAuthenticated,
  });

  // Add memory note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/memories", { content });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memories"] });
      setNewNote("");
      setShowAddNote(false);
    },
  });

  // Search memories
  const { data: searchResults = [], isLoading: searchLoading } = useQuery<SearchResult[]>({
    queryKey: [`/api/memories/search?q=${searchQuery}`],
    enabled: isAuthenticated && searchQuery.length > 0,
  });

  if (isLoading || memoriesLoading) {
    return (
      <div className="min-h-screen bg-[#101522] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-slate-400 font-black italic uppercase tracking-widest text-[10px]">Accessing memory vault...</p>
        </div>
      </div>
    );
  }

  const getMemoryIcon = (type: string) => {
    switch (type) {
      case "email": return <Mail className="size-5" />;
      case "conversation": return <MessageSquare className="size-5" />;
      case "note": return <FileText className="size-5" />;
      default: return <FileText className="size-5" />;
    }
  };

  const displayedMemories = searchQuery.length > 0 ? searchResults.map(r => r.document) : memories;

  return (
    <div className="min-h-screen bg-[#101522] text-white flex flex-col">
      <Header emailStatus="connected" />

      <main className="max-w-7xl mx-auto px-6 py-12 w-full space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-white/5">
          <div>
            <div className="flex items-center gap-3 text-primary mb-2">
              <Brain className="size-4" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Neural Memory Vault</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Long-term Memory Core</h1>
          </div>

          <div className="flex items-center gap-4">
            <Badge className="bg-white/5 text-slate-500 border-white/10 font-bold italic text-[9px] px-4 py-2 rounded-xl backdrop-blur-xl">
              <Hash className="size-3 mr-2 text-primary" />
              VECTOR SEARCH ACTIVE
            </Badge>
          </div>
        </div>

        {/* Search and Action Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <div className="relative group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                <SearchIcon className="size-5 text-slate-500 group-focus-within:text-primary transition-colors" />
              </div>
              <Input
                placeholder="Query neural links across emails, notes, and conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.03] border-white/10 h-16 pl-16 pr-6 rounded-[1.25rem] italic text-lg focus:ring-primary focus:border-primary/50 backdrop-blur-xl transition-all"
              />
              <div className="absolute inset-y-0 right-4 flex items-center">
                {searchLoading && <Loader2 className="size-5 animate-spin text-primary/50" />}
              </div>
            </div>
          </div>
          <Button
            onClick={() => setShowAddNote(!showAddNote)}
            className="h-16 rounded-[1.25rem] bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xl font-black italic uppercase tracking-widest text-[10px]"
          >
            <Plus className="size-5 mr-3" />
            Establish Note
          </Button>
        </div>

        {/* Add Note Section */}
        {showAddNote && (
          <div className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="size-5 text-primary" />
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Inject Memory Note</h3>
            </div>
            <Textarea
              placeholder="Transcribe specific details or critical mission data into the vault..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={4}
              className="bg-white/5 border-white/10 rounded-2xl italic text-slate-300 focus:ring-primary resize-none p-6 leading-relaxed mb-6"
            />
            <div className="flex gap-4">
              <Button
                onClick={() => addNoteMutation.mutate(newNote)}
                disabled={addNoteMutation.isPending || !newNote.trim()}
                className="bg-primary hover:bg-primary/90 shadow-glow rounded-xl px-10 h-12 font-black italic uppercase tracking-widest text-[10px]"
              >
                {addNoteMutation.isPending ? "Synchronizing..." : "Synchronize Note"}
              </Button>
              <Button variant="ghost" onClick={() => setShowAddNote(false)} className="text-slate-500 hover:text-white font-bold italic uppercase text-[10px] tracking-widest">
                Abort Injection
              </Button>
            </div>
          </div>
        )}

        {/* Search Results Info */}
        {searchQuery.length > 0 && !searchLoading && (
          <div className="flex items-center gap-3">
            <div className="size-2 rounded-full bg-primary animate-pulse"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">
              Extraction complete: {searchResults.length} relevant data points recovered
            </span>
          </div>
        )}

        {/* Memories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayedMemories.map((memory) => (
            <div
              key={memory.id}
              className="group p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl hover:bg-white/[0.06] hover:border-white/20 transition-all relative overflow-hidden ring-1 ring-white/5"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-glow-sm">
                      {getMemoryIcon(memory.metadata.type)}
                    </div>
                    <div>
                      <Badge className="bg-white/5 text-slate-500 border-white/10 font-bold italic text-[9px] px-3 py-1 uppercase tracking-widest mb-1">
                        {memory.metadata.type}
                      </Badge>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="size-3" />
                        <span className="text-[9px] font-bold italic uppercase tracking-widest">
                          {formatDistanceToNow(new Date(memory.metadata.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                  {searchQuery.length > 0 && (
                    <div className="text-right">
                      <div className="text-[8px] font-bold text-slate-700 uppercase tracking-widest leading-none">RELEVANCE</div>
                      <div className="text-lg font-black italic text-primary leading-none mt-1">
                        {Math.round((searchResults.find(r => r.document.id === memory.id)?.score || 0) * 100)}%
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  {memory.metadata.subject && (
                    <h3 className="text-lg font-black italic tracking-tight group-hover:text-primary transition-colors line-clamp-2">{memory.metadata.subject}</h3>
                  )}

                  {memory.metadata.sender && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <User className="size-3" />
                      <span className="text-[10px] font-bold italic uppercase tracking-widest line-clamp-1">{memory.metadata.sender}</span>
                    </div>
                  )}

                  <p className="text-sm text-slate-400 italic leading-relaxed line-clamp-4">"{memory.text}"</p>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                  {memory.metadata.category ? (
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-bold uppercase tracking-widest">
                      {memory.metadata.category}
                    </Badge>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Boxes className="size-3 text-slate-700" />
                      <span className="text-[9px] font-bold text-slate-700 uppercase tracking-widest">UNCLASSIFIED</span>
                    </div>
                  )}
                  <ArrowRight className="size-4 text-slate-800 group-hover:text-primary transition-colors cursor-pointer" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {displayedMemories.length === 0 && (
          <div className="py-32 text-center rounded-[3rem] border border-dashed border-white/5 bg-white/[0.01]">
            <Database className="size-16 text-slate-800 mx-auto mb-6" />
            <h3 className="text-xl font-bold italic mb-2">Vault Cache Empty</h3>
            <p className="text-slate-500 max-w-xs mx-auto text-sm italic">
              {searchQuery.length > 0
                ? "No memory fragments detected within the current query parameters."
                : "Neural pathways are forming. Your transmissions and interactions will materialize here as immutable memory nodes."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}