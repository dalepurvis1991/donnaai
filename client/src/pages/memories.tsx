import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Search, Plus, Mail, MessageSquare, FileText, Clock, User, Hash, ArrowLeft } from "lucide-react";
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
  const { isAuthenticated, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [newNote, setNewNote] = useState("");
  const [showAddNote, setShowAddNote] = useState(false);

  // Fetch user memories
  const { data: memories = [], isLoading: memoriesLoading } = useQuery<Memory[]>({
    queryKey: ["/api/memories"],
    enabled: isAuthenticated,
  });

  // Search memories
  const { data: searchResults = [], isLoading: searchLoading } = useQuery<SearchResult[]>({
    queryKey: ["/api/memories/search", searchQuery],
    enabled: isAuthenticated && searchQuery.length > 0,
  });

  if (isLoading || memoriesLoading) {
    return <div className="p-6">Loading memories...</div>;
  }

  if (!isAuthenticated) {
    return <div className="p-6">Please log in to access your memories.</div>;
  }

  const getMemoryIcon = (type: string) => {
    switch (type) {
      case "email": return <Mail className="h-4 w-4" />;
      case "conversation": return <MessageSquare className="h-4 w-4" />;
      case "note": return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getMemoryColor = (type: string) => {
    switch (type) {
      case "email": return "bg-blue-100 text-blue-800";
      case "conversation": return "bg-green-100 text-green-800";
      case "note": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const displayedMemories = searchQuery.length > 0 ? searchResults.map(r => r.document) : memories;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
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
        <Brain className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Memory Service</h1>
        <Badge variant="outline" className="ml-2">
          <Hash className="h-3 w-3 mr-1" />
          Vector Search
        </Badge>
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Your Memories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search emails, notes, and conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={() => setShowAddNote(!showAddNote)}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Note Section */}
      {showAddNote && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Note
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Enter your note content..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2">
              <Button onClick={() => {
                // TODO: Implement add note functionality
                console.log("Adding note:", newNote);
                setNewNote("");
                setShowAddNote(false);
              }}>
                Save Note
              </Button>
              <Button variant="outline" onClick={() => setShowAddNote(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results Info */}
      {searchQuery.length > 0 && (
        <div className="mb-4 text-sm text-muted-foreground">
          {searchLoading ? "Searching..." : `Found ${searchResults.length} results for "${searchQuery}"`}
        </div>
      )}

      {/* Memories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedMemories.map((memory) => (
          <Card key={memory.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge className={getMemoryColor(memory.metadata.type)}>
                  {getMemoryIcon(memory.metadata.type)}
                  <span className="ml-1 capitalize">{memory.metadata.type}</span>
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(memory.metadata.createdAt), { addSuffix: true })}
                </div>
              </div>
              
              {memory.metadata.subject && (
                <CardTitle className="text-sm line-clamp-2">
                  {memory.metadata.subject}
                </CardTitle>
              )}
              
              {memory.metadata.sender && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  {memory.metadata.sender}
                </div>
              )}
            </CardHeader>
            
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-4">
                {memory.text}
              </p>
              
              {memory.metadata.category && (
                <div className="mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {memory.metadata.category}
                  </Badge>
                </div>
              )}
              
              {searchQuery.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Relevance: {Math.round(
                    (searchResults.find(r => r.document.id === memory.id)?.score || 0) * 100
                  )}%
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {displayedMemories.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {searchQuery.length > 0 ? "No memories found matching your search." : "No memories yet. Your emails and conversations will appear here."}
        </div>
      )}
    </div>
  );
}