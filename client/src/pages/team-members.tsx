import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
    Users,
    Plus,
    Trash2,
    Mail,
    ShieldCheck,
    Zap,
    ArrowRight,
    Edit2,
    Briefcase,
    Target,
    Sparkles,
    Command,
    ChevronRight,
    Trophy
} from "lucide-react";

interface TeamMember {
    id: number;
    name: string;
    email?: string;
    jobTitle?: string;
    role?: string;
    responsibilities?: string;
    skills?: string[];
    signOffLimit?: number;
    isActive: boolean;
}

export default function TeamMembers() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        jobTitle: "",
        role: "",
        responsibilities: "",
        skills: "",
        signOffLimit: ""
    });

    const { data: members = [], isLoading } = useQuery<TeamMember[]>({
        queryKey: ["/api/team-members"],
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("POST", "/api/team-members", {
                ...data,
                skills: data.skills ? data.skills.split(",").map((s: string) => s.trim()) : [],
                signOffLimit: data.signOffLimit ? parseFloat(data.signOffLimit) : null
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
            setIsAddDialogOpen(false);
            resetForm();
            toast({
                title: "Operative Recruited",
                description: "New intelligence asset successfully integrated into the team."
            });
        },
        onError: () => {
            toast({
                title: "Recruitment Error",
                description: "Failed to establish operative credentials.",
                variant: "destructive"
            });
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: any }) => {
            const res = await apiRequest("PUT", `/api/team-members/${id}`, {
                ...data,
                skills: data.skills ? data.skills.split(",").map((s: string) => s.trim()) : [],
                signOffLimit: data.signOffLimit ? parseFloat(data.signOffLimit) : null
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
            setEditingMember(null);
            resetForm();
            toast({
                title: "Credentials Synchronized",
                description: "Operative profile has been updated with new mission parameters."
            });
        },
        onError: () => {
            toast({
                title: "Update Error",
                description: "Failed to synchronize operative credentials.",
                variant: "destructive"
            });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await apiRequest("DELETE", `/api/team-members/${id}`);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
            toast({ title: "Operative Decommissioned", description: "Asset has been safely removed from active duty." });
        },
        onError: () => {
            toast({ title: "Decommissioning Error", description: "Failed to purge operative from the team.", variant: "destructive" });
        }
    });

    const resetForm = () => {
        setFormData({
            name: "",
            email: "",
            jobTitle: "",
            role: "",
            responsibilities: "",
            skills: "",
            signOffLimit: ""
        });
    };

    const handleEdit = (member: TeamMember) => {
        setEditingMember(member);
        setFormData({
            name: member.name,
            email: member.email || "",
            jobTitle: member.jobTitle || "",
            role: member.role || "",
            responsibilities: member.responsibilities || "",
            skills: member.skills?.join(", ") || "",
            signOffLimit: member.signOffLimit?.toString() || ""
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingMember) {
            updateMutation.mutate({ id: editingMember.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#101522] flex items-center justify-center text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-black italic uppercase tracking-widest text-[10px]">Accessing operative database...</p>
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
                            <Command className="size-4" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Neural Team Command</span>
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight">Active Duty Operatives</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-primary hover:bg-primary/90 shadow-glow rounded-xl px-8 h-12 font-black italic uppercase tracking-widest text-[10px]" onClick={() => { resetForm(); setEditingMember(null); }}>
                                    <Plus className="size-4 mr-2" />
                                    Recruit Operative
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-[#101522]/95 border-white/10 text-white backdrop-blur-2xl rounded-3xl p-8 ring-1 ring-white/5 max-w-lg">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black italic tracking-tight uppercase">Operative Recruitment</DialogTitle>
                                    <DialogDescription className="text-slate-500 italic">
                                        Integrate a new intelligence asset. Detailed mission roles enhance AI coordination and task synchronization.
                                    </DialogDescription>
                                </DialogHeader>
                                <TeamMemberForm
                                    formData={formData}
                                    setFormData={setFormData}
                                    onSubmit={handleSubmit}
                                    isLoading={createMutation.isPending}
                                    buttonText="Establish Operative"
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Edit Dialog */}
                <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
                    <DialogContent className="bg-[#101522]/95 border-white/10 text-white backdrop-blur-2xl rounded-3xl p-8 ring-1 ring-white/5 max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black italic tracking-tight uppercase">Calibrate Operative</DialogTitle>
                            <DialogDescription className="text-slate-500 italic">
                                Update mission parameters for enhanced neural synchronization and task matching.
                            </DialogDescription>
                        </DialogHeader>
                        <TeamMemberForm
                            formData={formData}
                            setFormData={setFormData}
                            onSubmit={handleSubmit}
                            isLoading={updateMutation.isPending}
                            buttonText="Sync Credentials"
                        />
                    </DialogContent>
                </Dialog>

                {members.length === 0 ? (
                    <div className="py-32 text-center rounded-[3rem] border border-dashed border-white/5 bg-white/[0.01]">
                        <Users className="size-16 text-slate-800 mx-auto mb-6" />
                        <h3 className="text-xl font-bold italic mb-2">Team Command Empty</h3>
                        <p className="text-slate-500 max-w-xs mx-auto text-sm italic mb-8">
                            Recruit your first operative to enable AI-powered autonomous task delegation and mission scaling.
                        </p>
                        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary hover:bg-primary/90 shadow-glow rounded-xl px-10 h-14 font-black italic uppercase tracking-widest text-[11px]">
                            Initiate First Recruitment
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {members.map((member) => (
                            <div key={member.id} className={`group p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl hover:bg-white/[0.06] hover:border-white/20 transition-all relative overflow-hidden ring-1 ring-white/5 ${!member.isActive ? "opacity-40 grayscale" : ""}`}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="flex items-center gap-5">
                                            <div className="size-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-glow-sm">
                                                <Users className="size-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black italic tracking-tight group-hover:text-primary transition-colors">{member.name}</h3>
                                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest italic">{member.jobTitle || "Freelance Asset"}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="icon" variant="ghost" className="size-9 rounded-xl bg-white/5 text-slate-500 hover:text-primary transition-colors" onClick={() => handleEdit(member)}>
                                                <Edit2 className="size-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button size="icon" variant="ghost" className="size-9 rounded-xl bg-white/5 text-slate-500 hover:text-red-400 transition-colors">
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="bg-[#101522]/95 border-white/10 text-white backdrop-blur-2xl rounded-3xl p-8 ring-1 ring-white/5">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle className="text-xl font-black italic uppercase">Decommission {member.name}?</AlertDialogTitle>
                                                        <AlertDialogDescription className="text-slate-500 italic">
                                                            This will permanently purge the operative from the active team. Mission history may be retained in the neural cache.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter className="mt-8">
                                                        <AlertDialogCancel className="bg-transparent text-slate-500 border-none hover:text-white">Abort</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => deleteMutation.mutate(member.id)} className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-xl px-6 italic font-bold">Purge Asset</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-6">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="size-3.5 text-emerald-500" />
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">{member.role || "General Operative"}</span>
                                        </div>

                                        {member.responsibilities && (
                                            <p className="text-sm text-slate-400 italic line-clamp-3 leading-relaxed">"{member.responsibilities}"</p>
                                        )}

                                        {member.skills && member.skills.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {member.skills.map((skill, i) => (
                                                    <Badge key={i} className="bg-white/5 text-slate-400 border-white/10 font-bold italic text-[9px] px-3 py-1 hover:bg-white/10 transition-colors">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between">
                                        <div className="space-y-1">
                                            {member.email && (
                                                <div className="flex items-center gap-2 group/email cursor-pointer">
                                                    <Mail className="size-3 text-slate-700 group-hover/email:text-primary transition-colors" />
                                                    <span className="text-[10px] font-black text-slate-600 italic group-hover/email:text-white transition-colors">{member.email}</span>
                                                </div>
                                            )}
                                            {member.signOffLimit && (
                                                <div className="flex items-center gap-2">
                                                    <Trophy className="size-3 text-emerald-500/50" />
                                                    <span className="text-[10px] font-black text-emerald-500/50 italic tracking-widest">THRESHOLD: £{member.signOffLimit.toLocaleString()}</span>
                                                </div>
                                            )}
                                        </div>
                                        <ArrowRight className="size-4 text-slate-800 group-hover:text-primary transition-colors" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

function TeamMemberForm({
    formData,
    setFormData,
    onSubmit,
    isLoading,
    buttonText
}: {
    formData: any;
    setFormData: (data: any) => void;
    onSubmit: (e: React.FormEvent) => void;
    isLoading: boolean;
    buttonText: string;
}) {
    return (
        <form onSubmit={onSubmit} className="space-y-8 mt-6">
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-1">Operative Name *</Label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Zack"
                            required
                            className="bg-white/5 border-white/10 rounded-xl focus:ring-primary italic"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-1">Network Identity</Label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="zack@company.com"
                            className="bg-white/5 border-white/10 rounded-xl focus:ring-primary italic"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-1">Mission Title</Label>
                        <Input
                            value={formData.jobTitle}
                            onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                            placeholder="Head of Operations"
                            className="bg-white/5 border-white/10 rounded-xl focus:ring-primary italic"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-1">Logic Segment</Label>
                        <Input
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            placeholder="ecommerce, sales..."
                            className="bg-white/5 border-white/10 rounded-xl focus:ring-primary italic"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-1">Functional Responsibilities</Label>
                    <Textarea
                        value={formData.responsibilities}
                        onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                        placeholder="Describe functional scope, mission priorities, and delegated autonomy..."
                        rows={3}
                        className="bg-white/5 border-white/10 rounded-xl focus:ring-primary italic resize-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-1">Specializations (CSV)</Label>
                        <Input
                            value={formData.skills}
                            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                            placeholder="customer, inventory..."
                            className="bg-white/5 border-white/10 rounded-xl focus:ring-primary italic"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-1">Approval Threshold (£)</Label>
                        <Input
                            type="number"
                            value={formData.signOffLimit}
                            onChange={(e) => setFormData({ ...formData, signOffLimit: e.target.value })}
                            placeholder="500"
                            className="bg-white/5 border-white/10 rounded-xl focus:ring-primary italic"
                        />
                    </div>
                </div>
            </div>

            <DialogFooter className="mt-10">
                <Button type="submit" disabled={isLoading || !formData.name} className="w-full bg-primary hover:bg-primary/90 shadow-glow h-14 rounded-xl font-black italic uppercase tracking-widest text-[11px]">
                    {isLoading ? "Synchronizing..." : buttonText}
                </Button>
            </DialogFooter>
        </form>
    );
}
