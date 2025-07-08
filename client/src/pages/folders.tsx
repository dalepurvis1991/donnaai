import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Folder, Plus, Trash2, Mail, Settings } from "lucide-react";

interface EmailFolder {
  id: number;
  userId: string;
  name: string;
  color: string;
  description?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FolderRule {
  id: number;
  userId: string;
  folderId: number;
  ruleType: string;
  ruleValue: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
}

export default function Folders() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRuleOpen, setIsRuleOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<EmailFolder | null>(null);
  const [newFolder, setNewFolder] = useState({
    name: "",
    color: "#3b82f6",
    description: ""
  });
  const [newRule, setNewRule] = useState({
    ruleType: "sender",
    ruleValue: ""
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch folders
  const { data: folders = [], isLoading: foldersLoading } = useQuery<EmailFolder[]>({
    queryKey: ["/api/folders"]
  });

  // Fetch folder rules
  const { data: rules = [] } = useQuery<FolderRule[]>({
    queryKey: ["/api/folder-rules"]
  });

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: (folderData: typeof newFolder) => 
      apiRequest("/api/folders", {
        method: "POST",
        body: folderData
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      setIsCreateOpen(false);
      setNewFolder({ name: "", color: "#3b82f6", description: "" });
      toast({
        title: "Success",
        description: "Folder created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive",
      });
    }
  });

  // Delete folder mutation
  const deleteFolderMutation = useMutation({
    mutationFn: (folderId: number) => 
      apiRequest(`/api/folders/${folderId}`, {
        method: "DELETE"
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      toast({
        title: "Success",
        description: "Folder deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to delete folder",
        variant: "destructive",
      });
    }
  });

  // Create rule mutation
  const createRuleMutation = useMutation({
    mutationFn: ({ folderId, rule }: { folderId: number; rule: typeof newRule }) =>
      apiRequest(`/api/folders/${folderId}/rules`, {
        method: "POST",
        body: rule
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folder-rules"] });
      setIsRuleOpen(false);
      setNewRule({ ruleType: "sender", ruleValue: "" });
      toast({
        title: "Success",
        description: "Rule created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create rule",
        variant: "destructive",
      });
    }
  });

  const handleCreateFolder = () => {
    if (!newFolder.name.trim()) {
      toast({
        title: "Error",
        description: "Folder name is required",
        variant: "destructive",
      });
      return;
    }
    createFolderMutation.mutate(newFolder);
  };

  const handleDeleteFolder = (folderId: number) => {
    if (confirm("Are you sure you want to delete this folder? This will also remove all emails from this folder.")) {
      deleteFolderMutation.mutate(folderId);
    }
  };

  const handleCreateRule = () => {
    if (!selectedFolder || !newRule.ruleValue.trim()) {
      toast({
        title: "Error",
        description: "Rule value is required",
        variant: "destructive",
      });
      return;
    }
    createRuleMutation.mutate({ 
      folderId: selectedFolder.id, 
      rule: newRule 
    });
  };

  const getRulesForFolder = (folderId: number) => {
    return rules.filter(rule => rule.folderId === folderId);
  };

  const colorOptions = [
    { value: "#3b82f6", label: "Blue", bg: "bg-blue-500" },
    { value: "#10b981", label: "Green", bg: "bg-green-500" },
    { value: "#f59e0b", label: "Yellow", bg: "bg-yellow-500" },
    { value: "#ef4444", label: "Red", bg: "bg-red-500" },
    { value: "#8b5cf6", label: "Purple", bg: "bg-purple-500" },
    { value: "#06b6d4", label: "Cyan", bg: "bg-cyan-500" },
  ];

  if (foldersLoading) {
    return <div className="flex items-center justify-center h-64">Loading folders...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Email Folders</h1>
          <p className="text-muted-foreground">Organize your emails with custom folders and automatic rules</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
              <DialogDescription>
                Create a custom folder to organize your emails
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="folder-name">Folder Name</Label>
                <Input
                  id="folder-name"
                  placeholder="Enter folder name"
                  value={newFolder.name}
                  onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="folder-color">Color</Label>
                <Select value={newFolder.color} onValueChange={(value) => setNewFolder({ ...newFolder, color: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${color.bg}`} />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="folder-description">Description (Optional)</Label>
                <Textarea
                  id="folder-description"
                  placeholder="Describe what this folder is for"
                  value={newFolder.description}
                  onChange={(e) => setNewFolder({ ...newFolder, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFolder} disabled={createFolderMutation.isPending}>
                {createFolderMutation.isPending ? "Creating..." : "Create Folder"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {folders.map((folder) => {
          const folderRules = getRulesForFolder(folder.id);
          return (
            <Card key={folder.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: folder.color }}
                    />
                    <CardTitle className="text-lg">{folder.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedFolder(folder);
                        setIsRuleOpen(true);
                      }}
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteFolder(folder.id)}
                      disabled={deleteFolderMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {folder.description && (
                  <CardDescription>{folder.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Folder className="h-4 w-4" />
                    Created {new Date(folder.createdAt).toLocaleDateString()}
                  </div>
                  
                  {folderRules.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Auto Rules:</p>
                      <div className="space-y-1">
                        {folderRules.map((rule) => (
                          <Badge key={rule.id} variant="secondary" className="text-xs">
                            {rule.ruleType}: {rule.ruleValue}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {folderRules.length === 0 && (
                    <p className="text-sm text-muted-foreground">No automatic rules set</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {folders.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No folders yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first folder to start organizing your emails
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Folder
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Rule Creation Dialog */}
      <Dialog open={isRuleOpen} onOpenChange={setIsRuleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Automatic Rule</DialogTitle>
            <DialogDescription>
              Create a rule to automatically organize emails into "{selectedFolder?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rule-type">Rule Type</Label>
              <Select value={newRule.ruleType} onValueChange={(value) => setNewRule({ ...newRule, ruleType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sender">Sender Email</SelectItem>
                  <SelectItem value="domain">Domain</SelectItem>
                  <SelectItem value="subject">Subject Contains</SelectItem>
                  <SelectItem value="keyword">Body Contains</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="rule-value">Rule Value</Label>
              <Input
                id="rule-value"
                placeholder={
                  newRule.ruleType === "sender" ? "user@example.com" :
                  newRule.ruleType === "domain" ? "example.com" :
                  newRule.ruleType === "subject" ? "meeting" :
                  "keyword"
                }
                value={newRule.ruleValue}
                onChange={(e) => setNewRule({ ...newRule, ruleValue: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRuleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRule} disabled={createRuleMutation.isPending}>
              {createRuleMutation.isPending ? "Creating..." : "Create Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}