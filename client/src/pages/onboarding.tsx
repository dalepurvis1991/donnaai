import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
    Shield,
    Sparkles,
    Briefcase,
    User,
    Globe,
    Inbox,
    Clock,
    FileText,
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    Lock,
    Zap
} from "lucide-react";

const STEPS = [
    { id: "use-case", title: "Mission Context" },
    { id: "outcomes", title: "Primary Objectives" },
    { id: "tone", title: "Communication Style" },
    { id: "style", title: "Intelligence Learning" },
    { id: "privacy", title: "Neural Security" }
];

export default function Onboarding() {
    const [step, setStep] = useState(0);
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        useCase: "both", // work | personal | both
        primaryOutcomes: [] as string[],
        defaultTone: "neutral", // formal | neutral | friendly
        styleLearningOptIn: true,
        privacyMode: "local_first" // local_first | cloud_ok
    });

    const nextStep = () => {
        if (step < STEPS.length - 1) {
            setStep(step + 1);
        } else {
            handleComplete();
        }
    };

    const prevStep = () => {
        if (step > 0) {
            setStep(step - 1);
        }
    };

    const handleComplete = async () => {
        setIsSubmitting(true);
        try {
            const response = await apiRequest("POST", "/api/onboarding/complete", formData);
            const updatedProfile = await response.json();

            // Optimistically update the status cache
            queryClient.setQueryData(["/api/onboarding/status"], {
                completed: true,
                step: 5
            });

            await queryClient.invalidateQueries({ queryKey: ["/api/onboarding/status"] });

            toast({
                title: "Intelligence Synchronized",
                description: "Your Donna AI profile has been successfully initialized.",
            });
            setLocation("/");
        } catch (error) {
            toast({
                title: "Synchronization Error",
                description: "Failed to save your profile. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleOutcome = (outcomeIdx: string) => {
        setFormData(prev => ({
            ...prev,
            primaryOutcomes: prev.primaryOutcomes.includes(outcomeIdx)
                ? prev.primaryOutcomes.filter(i => i !== outcomeIdx)
                : [...prev.primaryOutcomes, outcomeIdx]
        }));
    };

    return (
        <div className="min-h-screen bg-[#030711] text-white flex flex-col items-center justify-center p-4 selection:bg-blue-500/30">
            {/* Background Glow */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
            </div>

            <div className="w-full max-w-2xl relative z-10">
                {/* Progress Bar */}
                <div className="flex justify-between mb-8 px-2">
                    {STEPS.map((s, idx) => (
                        <div key={s.id} className="flex flex-col items-center gap-2">
                            <div
                                className={`h-1 w-12 rounded-full transition-all duration-500 ${idx <= step ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "bg-white/10"
                                    }`}
                            />
                            <span className={`text-[10px] uppercase tracking-widest font-bold hidden sm:block ${idx === step ? "text-blue-400" : "text-white/30"
                                }`}>
                                {s.title}
                            </span>
                        </div>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
                        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, x: -20, filter: "blur(10px)" }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                        <Card className="bg-white/[0.03] border-white/10 backdrop-blur-xl overflow-hidden shadow-2xl">
                            <CardContent className="p-8 sm:p-12">
                                {step === 0 && (
                                    <div className="space-y-8 text-center">
                                        <div className="flex justify-center">
                                            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30 ring-4 ring-blue-500/5">
                                                <Globe className="w-8 h-8 text-blue-400" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <h1 className="text-3xl font-bold tracking-tight">Mission Context</h1>
                                            <p className="text-white/50">How will you be utilizing Donna AI's neural processing?</p>
                                        </div>

                                        <RadioGroup
                                            value={formData.useCase}
                                            onValueChange={(v) => setFormData({ ...formData, useCase: v })}
                                            className="grid grid-cols-1 sm:grid-cols-3 gap-4 h-full pt-4"
                                        >
                                            {[
                                                { id: "work", icon: Briefcase, label: "Professional", desc: "Corporate focus" },
                                                { id: "personal", icon: User, label: "Personal", desc: "Private life" },
                                                { id: "both", icon: Sparkles, label: "Hybrid", desc: "Complete sync" }
                                            ].map((opt) => (
                                                <div key={opt.id}>
                                                    <RadioGroupItem value={opt.id} id={opt.id} className="peer sr-only" />
                                                    <Label
                                                        htmlFor={opt.id}
                                                        className={`flex flex-col items-center gap-4 p-6 rounded-2xl border-2 transition-all cursor-pointer h-full ${formData.useCase === opt.id
                                                            ? "bg-blue-500/10 border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                                                            : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                                                            }`}
                                                    >
                                                        <opt.icon className="w-8 h-8" />
                                                        <div className="text-center">
                                                            <div className="font-bold text-lg text-white">{opt.label}</div>
                                                            <div className="text-xs text-inherit">{opt.desc}</div>
                                                        </div>
                                                    </Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                )}

                                {step === 1 && (
                                    <div className="space-y-8">
                                        <div className="space-y-2 text-center">
                                            <h1 className="text-3xl font-bold tracking-tight">Primary Objectives</h1>
                                            <p className="text-white/50">Select the cognitive load you wish to delegate.</p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {[
                                                { id: "inbox", icon: Inbox, title: "Inbox Control", desc: "Auto-categorization & filtering" },
                                                { id: "followups", icon: Zap, title: "Follow-ups", desc: "Never miss a critical reply" },
                                                { id: "drafts", icon: FileText, title: "Rapid Drafting", desc: "Generate professional drafts" },
                                                { id: "tasks", icon: CheckCircle2, title: "Task Extraction", desc: "Detect actions from intent" },
                                            ].map((opt) => (
                                                <div
                                                    key={opt.id}
                                                    onClick={() => toggleOutcome(opt.id)}
                                                    className={`flex items-center gap-4 p-6 rounded-2xl border-2 transition-all cursor-pointer ${formData.primaryOutcomes.includes(opt.id)
                                                        ? "bg-purple-500/10 border-purple-500 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                                                        : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                                                        }`}
                                                >
                                                    <div className={`p-3 rounded-xl ${formData.primaryOutcomes.includes(opt.id) ? "bg-purple-500/20" : "bg-white/5"
                                                        }`}>
                                                        <opt.icon className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white">{opt.title}</div>
                                                        <div className="text-xs text-inherit">{opt.desc}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-8 text-center">
                                        <div className="space-y-2">
                                            <h1 className="text-3xl font-bold tracking-tight">Communication Style</h1>
                                            <p className="text-white/50">Determine the default neural resonance for AI drafts.</p>
                                        </div>

                                        <RadioGroup
                                            value={formData.defaultTone}
                                            onValueChange={(v) => setFormData({ ...formData, defaultTone: v })}
                                            className="grid grid-cols-1 gap-4 pt-4"
                                        >
                                            {[
                                                { id: "formal", label: "Formal", desc: "Corporate, precise, and professional" },
                                                { id: "neutral", label: "Neutral", desc: "Balanced, clear, and efficient" },
                                                { id: "friendly", label: "Friendly", desc: "Casual, warm, and approachable" }
                                            ].map((opt) => (
                                                <div key={opt.id}>
                                                    <RadioGroupItem value={opt.id} id={opt.id} className="peer sr-only" />
                                                    <Label
                                                        htmlFor={opt.id}
                                                        className={`flex justify-between items-center p-6 rounded-2xl border-2 transition-all cursor-pointer ${formData.defaultTone === opt.id
                                                            ? "bg-blue-500/10 border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                                                            : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                                                            }`}
                                                    >
                                                        <div className="text-left">
                                                            <div className="font-bold text-lg text-white">{opt.label}</div>
                                                            <div className="text-sm text-inherit">{opt.desc}</div>
                                                        </div>
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formData.defaultTone === opt.id ? "border-blue-400" : "border-white/10"
                                                            }`}>
                                                            {formData.defaultTone === opt.id && <div className="w-3 h-3 bg-blue-400 rounded-full" />}
                                                        </div>
                                                    </Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="space-y-8 text-center">
                                        <div className="flex justify-center">
                                            <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center border border-purple-500/30 animate-pulse">
                                                <Sparkles className="w-8 h-8 text-purple-400" />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <h1 className="text-3xl font-bold tracking-tight">Intelligence Learning</h1>
                                            <p className="text-white/50 mx-auto max-w-md">
                                                Donna AI can analyze your past sent emails to mimic your unique vocabulary and syntax.
                                            </p>
                                        </div>

                                        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-6">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="text-left">
                                                    <div className="font-bold text-lg">Autonomous Style Learning</div>
                                                    <div className="text-sm text-white/40">Highly recommended for premium personalization</div>
                                                </div>
                                                <Switch
                                                    checked={formData.styleLearningOptIn}
                                                    onCheckedChange={(v) => setFormData({ ...formData, styleLearningOptIn: v })}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                                <div className="text-left space-y-1">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-widest">
                                                        <Lock className="w-3 h-3" /> Secure
                                                    </div>
                                                    <div className="text-sm text-white/60 font-medium">Neural data isolated per user</div>
                                                </div>
                                                <div className="text-left space-y-1">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-widest">
                                                        <Clock className="w-3 h-3" /> Fast
                                                    </div>
                                                    <div className="text-sm text-white/60 font-medium">Auto-updates from edits</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 4 && (
                                    <div className="space-y-8 text-center">
                                        <div className="space-y-2">
                                            <h1 className="text-3xl font-bold tracking-tight">Neural Security</h1>
                                            <p className="text-white/50">Determine how your data interacts with the cloud.</p>
                                        </div>

                                        <RadioGroup
                                            value={formData.privacyMode}
                                            onValueChange={(v) => setFormData({ ...formData, privacyMode: v })}
                                            className="grid grid-cols-1 gap-4 pt-4"
                                        >
                                            {[
                                                {
                                                    id: "local_first",
                                                    icon: Shield,
                                                    label: "Local-First Protocol",
                                                    desc: "Sensitive metadata stays local. Maximum privacy.",
                                                    badge: "Recommended"
                                                },
                                                {
                                                    id: "cloud_ok",
                                                    icon: Globe,
                                                    label: "Cloud-Sync Mode",
                                                    desc: "Seamless synchronization across all operative devices."
                                                }
                                            ].map((opt) => (
                                                <div key={opt.id}>
                                                    <RadioGroupItem value={opt.id} id={opt.id} className="peer sr-only" />
                                                    <Label
                                                        htmlFor={opt.id}
                                                        className={`flex items-start gap-4 p-6 rounded-2xl border-2 transition-all cursor-pointer h-full relative overflow-hidden ${formData.privacyMode === opt.id
                                                            ? "bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                                                            : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                                                            }`}
                                                    >
                                                        <div className={`p-3 rounded-xl ${formData.privacyMode === opt.id ? "bg-amber-500/20" : "bg-white/5"
                                                            }`}>
                                                            <opt.icon className="w-6 h-6" />
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="font-bold text-lg text-white flex items-center gap-3">
                                                                {opt.label}
                                                                {opt.badge && (
                                                                    <span className="text-[10px] bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                                        {opt.badge}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-sm text-inherit">{opt.desc}</div>
                                                        </div>
                                                    </Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                )}

                                {/* Navigation Buttons */}
                                <div className="flex items-center justify-between mt-12 pt-8 border-t border-white/10">
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            onClick={prevStep}
                                            disabled={step === 0 || isSubmitting}
                                            className="text-white/50 hover:text-white"
                                        >
                                            <ChevronLeft className="mr-2 h-4 w-4" />
                                            Back
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={handleComplete}
                                            disabled={isSubmitting}
                                            className="text-white/30 hover:text-white text-xs"
                                        >
                                            Skip for now
                                        </Button>
                                    </div>
                                    <Button
                                        onClick={nextStep}
                                        disabled={isSubmitting}
                                        className={`${step === STEPS.length - 1
                                            ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
                                            : "bg-blue-600 hover:bg-blue-500"
                                            } text-white px-8 h-12 rounded-xl transition-all shadow-lg font-bold`}
                                    >
                                        {isSubmitting ? (
                                            "Synchronizing..."
                                        ) : step === STEPS.length - 1 ? (
                                            <>
                                                Initialize Pulse
                                                <Sparkles className="ml-2 h-4 w-4" />
                                            </>
                                        ) : (
                                            <>
                                                Next
                                                <ChevronRight className="ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </AnimatePresence>

                <p className="text-center mt-8 text-white/30 text-xs">
                    By initializing Donna AI, you agree to our neural data processing protocols.
                </p>
            </div>
        </div>
    );
}
