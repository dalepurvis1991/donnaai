import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Folder,
  Plus,
  Trash2,
  Settings,
  Cpu,
  ArrowRight,
  ShieldCheck,
  Zap,
  Box,
  LayoutGrid,
  Filter,
  MousePointer2,
  Trash
} from "lucide-react";

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
      apiRequest("POST", "/api/folders", folderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      setIsCreateOpen(false);
      setNewFolder({ name: "", color: "#3b82f6", description: "" });
      toast({
        title: "Node Established",
        description: "New spatial organization node successfully integrated.",
      });
    },
    onError: () => {
      toast({
        title: "Node Error",
        description: "Failed to establish new organization node.",
        variant: "destructive",
      });
    }
  });

  // Delete folder mutation
  const deleteFolderMutation = useMutation({
    mutationFn: (folderId: number) =>
      apiRequest("DELETE", `/api/folders/${folderId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      toast({
        title: "Node Decommissioned",
        description: "Spatial node has been safely purged from the repository.",
      });
    },
    onError: () => {
      toast({
        title: "Purge Error",
        description: "Critical failure during node decommissioning.",
        variant: "destructive",
      });
    }
  });

  // Create rule mutation
  const createRuleMutation = useMutation({
    mutationFn: ({ folderId, rule }: { folderId: number; rule: typeof newRule }) =>
      apiRequest("POST", `/api/folders/${folderId}/rules`, rule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folder-rules"] });
      setIsRuleOpen(false);
      setNewRule({ ruleType: "sender", ruleValue: "" });
      toast({
        title: "Routing Active",
        description: "Autonomous routing protocol successfully applied.",
      });
    },
    onError: () => {
      toast({
        title: "Protocol Error",
        description: "Failed to apply routing protocol.",
        variant: "destructive",
      });
    }
  });

  const handleCreateFolder = () => {
    if (!newFolder.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Folder designation required.",
        variant: "destructive",
      });
      return;
    }
    createFolderMutation.mutate(newFolder);
  };

  const handleDeleteFolder = (folderId: number) => {
    deleteFolderMutation.mutate(folderId);
  };

  const handleCreateRule = () => {
    if (!selectedFolder || !newRule.ruleValue.trim()) {
      toast({
        title: "Validation Error",
        description: "Rule value designation required.",
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
    { value: "#3b82f6", label: "Neural Blue", bg: "bg-blue-500" },
    { value: "#10b981", label: "Bio Green", bg: "bg-green-500" },
    { value: "#f59e0b", label: "Warning Gold", bg: "bg-yellow-500" },
    { value: "#ef4444", label: "Critical Red", bg: "bg-red-500" },
    { value: "#8b5cf6", label: "Logic Purple", bg: "bg-purple-500" },
    { value: "#06b6d4", label: "Cyber Cyan", bg: "bg-cyan-500" },
  ];

  if (foldersLoading) {
    return (
      <div className="min-h-screen bg-[#101522] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-slate-400 font-black italic uppercase tracking-widest text-[10px]">Accessing neural repository...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101522] text-white flex flex-col">
      <Header emailStatus="connected" />

      <main className="max-w-7xl mx-auto px-6 py-12 w-full space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-white/5">
          <div>
            <div className="flex items-center gap-3 text-primary mb-2">
              <Box className="size-4" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Spatial Memory Core</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Neural Folder Repository</h1>
          </div>

          <div className="flex items-center gap-4">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 shadow-glow rounded-xl px-8 h-12 font-black italic uppercase tracking-widest text-[10px]">
                  <Plus className="size-4 mr-2" />
                  Establish Node
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#101522]/95 border-white/10 text-white backdrop-blur-2xl rounded-3xl p-8 ring-1 ring-white/5 max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black italic tracking-tight uppercase">New Organization Node</DialogTitle>
                  <DialogDescription className="text-slate-500 italic">Configure a new spatial memory coordinate for automated sorting.</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 mt-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-1">Designation</Label>
                    <Input
                      placeholder="Enter node name..."
                      value={newFolder.name}
                      onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
                      className="bg-white/5 border-white/10 rounded-xl focus:ring-primary italic"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-1">Frequency Mapping</Label>
                    <Select value={newFolder.color} onValueChange={(value) => setNewFolder({ ...newFolder, color: value })}>
                      <SelectTrigger className="bg-white/5 border-white/10 rounded-xl focus:ring-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/95 border-white/10 text-white backdrop-blur-2xl">
                        {colorOptions.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-3 italic font-bold">
                              <div className={`size-3 rounded-full ${color.bg} shadow-glow-sm`} />
                              {color.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-1">Node Metadata</Label>
                    <Textarea
                      placeholder="Brief functional scope of this node..."
                      value={newFolder.description}
                      onChange={(e) => setNewFolder({ ...newFolder, description: e.target.value })}
                      className="bg-white/5 border-white/10 rounded-xl focus:ring-primary italic min-h-[100px]"
                    />
                  </div>
                </div>
                <DialogFooter className="mt-8">
                  <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="text-slate-500 italic font-bold">Abort</Button>
                  <Button onClick={handleCreateFolder} disabled={createFolderMutation.isPending} className="bg-primary hover:bg-primary/90 shadow-glow rounded-xl px-8 font-black italic uppercase tracking-widest text-[10px]">
                    {createFolderMutation.isPending ? "Integrating..." : "Stabilize Node"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Folder Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {folders.map((folder) => {
            const folderRules = getRulesForFolder(folder.id);
            return (
              <div key={folder.id} className="group p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl hover:bg-white/[0.06] hover:border-white/20 transition-all relative overflow-hidden ring-1 ring-white/5">
                <div className="absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 transition-opacity group-hover:opacity-40" style={{ backgroundColor: folder.color }}></div>

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-5">
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/5 shadow-glow-sm" style={{ borderColor: `${folder.color}20` }}>
                        <Folder className="size-6" style={{ color: folder.color }} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black italic tracking-tight">{folder.name}</h3>
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest italic">{folder.isDefault ? "Immutable System Node" : "User Protocol Active"}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" className="size-9 rounded-xl bg-white/5 text-slate-500 hover:text-primary transition-colors" onClick={() => { setSelectedFolder(folder); setIsRuleOpen(true); }}>
                        <Settings className="size-4" />
                      </Button>
                      {!folder.isDefault && (
                        <Button size="icon" variant="ghost" className="size-9 rounded-xl bg-white/5 text-slate-500 hover:text-red-400 transition-colors" onClick={() => handleDeleteFolder(folder.id)}>
                          <Trash className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 space-y-6">
                    {folder.description && <p className="text-sm text-slate-400 italic line-clamp-2 leading-relaxed">"{folder.description}"</p>}

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Zap className="size-3 text-primary" />
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest italic">Autonomous Routing {folderRules.length > 0 ? "Active" : "Stable"}</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {folderRules.length > 0 ? folderRules.map((rule) => (
                          <Badge key={rule.id} className="bg-white/5 text-slate-400 border-white/10 font-bold italic text-[9px] px-3 py-1 group/badge hover:bg-primary/20 hover:text-primary transition-all">
                            <Filter className="size-2.5 mr-2 opacity-30" />
                            {rule.ruleType}: {rule.ruleValue}
                          </Badge>
                        )) : (
                          <div className="text-[11px] text-slate-600 italic px-1">Static manual organization only.</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MousePointer2 className="size-3.5 text-slate-700" />
                      <span className="text-[10px] font-black text-slate-600 italic">Access Frequency: Nominal</span>
                    </div>
                    <ArrowRight className="size-4 text-slate-800 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </div>
            );
          })}

          {folders.length === 0 && (
            <div className="col-span-full py-24 text-center rounded-[3rem] border border-dashed border-white/5 bg-white/[0.01]">
              <LayoutGrid className="size-16 text-slate-800 mx-auto mb-6" />
              <h3 className="text-xl font-bold italic mb-2">Neural Workspace Fragmented</h3>
              <p className="text-slate-500 max-w-xs mx-auto text-sm italic mb-8">Establish your first organizational node to begin spatial memory indexing.</p>
              <Button onClick={() => setIsCreateOpen(true)} className="bg-primary hover:bg-primary/90 shadow-glow rounded-xl px-10 h-14 font-black italic uppercase tracking-widest text-[11px]">Initiate Node Creation</Button>
            </div>
          )}
        </div>

        {/* Rule Creation Dialog */}
        <Dialog open={isRuleOpen} onOpenChange={setIsRuleOpen}>
          <DialogContent className="bg-[#101522]/95 border-white/10 text-white backdrop-blur-2xl rounded-3xl p-8 ring-1 ring-white/5 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black italic tracking-tight uppercase">Inject Routing Protocol</DialogTitle>
              <DialogDescription className="text-slate-500 italic">Automatically intercept and redirect traces into the "{selectedFolder?.name}" node.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 mt-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-1">Detection Logic</Label>
                <Select value={newRule.ruleType} onValueChange={(value) => setNewRule({ ...newRule, ruleType: value })}>
                  <SelectTrigger className="bg-white/5 border-white/10 rounded-xl focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/95 border-white/10 text-white backdrop-blur-2xl">
                    <SelectItem value="sender">Sender Fingerprint</SelectItem>
                    <SelectItem value="domain">Network Domain</SelectItem>
                    <SelectItem value="subject">Subject Pattern</SelectItem>
                    <SelectItem value="keyword">Payload Keyword</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-1">Logic Value</Label>
                <Input
                  placeholder={
                    newRule.ruleType === "sender" ? "intel@cyber.com" :
                      newRule.ruleType === "domain" ? "cyber.com" :
                        newRule.ruleType === "subject" ? "Project Alpha..." :
                          "Extrapolated..."
                  }
                  value={newRule.ruleValue}
                  onChange={(e) => setNewRule({ ...newRule, ruleValue: e.target.value })}
                  className="bg-white/5 border-white/10 rounded-xl focus:ring-primary italic"
                />
              </div>
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-4">
                <ShieldCheck className="size-5 text-primary shrink-0" />
                <p className="text-[10px] text-slate-400 italic leading-relaxed">Protocols are executed instantly upon transmission detection with 100% precision calibration.</p>
              </div>
            </div>
            <DialogFooter className="mt-8">
              <Button variant="ghost" onClick={() => setIsRuleOpen(false)} className="text-slate-500 italic font-bold">Abort Injection</Button>
              <Button onClick={handleCreateRule} disabled={createRuleMutation.isPending} className="bg-primary hover:bg-primary/90 shadow-glow rounded-xl px-8 font-black italic uppercase tracking-widest text-[10px]">
                {createRuleMutation.isPending ? "Injecting..." : "Enable Protocol"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}