import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FlashQuestion {
    id: string;
    text: string;
    context: string;
    type: "contact_role" | "auto_rule" | "category_confirm" | "priority_confirm";
    metadata?: Record<string, any>;
}

export function FlashQuestions() {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Fetch flash questions from the API
    const { data: questions = [], isLoading } = useQuery<FlashQuestion[]>({
        queryKey: ["/api/flash-questions"],
        refetchInterval: 60000, // Refresh every minute
    });

    // Auto-rotate through questions every 30 seconds
    useEffect(() => {
        if (questions.length <= 1 || isPaused) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % questions.length);
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [questions.length, isPaused]);

    // Answer mutation
    const answerMutation = useMutation({
        mutationFn: async ({ questionId, answer }: { questionId: string; answer: "yes" | "no" | "skip" }) => {
            const res = await apiRequest("POST", `/api/flash-questions/${questionId}/answer`, { answer });
            return res.json();
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["/api/flash-questions"] });
            queryClient.invalidateQueries({ queryKey: ["/api/orchestrator/brief"] });

            if (variables.answer !== "skip") {
                toast({
                    title: "Got it!",
                    description: data.message || "Donna has learned from your answer.",
                });
            }

            // Move to next question
            if (questions.length > 1) {
                setCurrentIndex((prev) => (prev + 1) % questions.length);
            }
        },
    });

    if (isLoading || questions.length === 0) {
        return null; // Don't show anything if no questions
    }

    const currentQuestion = questions[currentIndex];

    return (
        <div
            className="w-full rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-[#192633] to-primary/5 p-4 mb-6 relative overflow-hidden group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-50 animate-pulse pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-4">
                {/* Icon and Label */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary">psychology</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-primary text-xs font-bold uppercase tracking-wider">Quick Learn</span>
                        <span className="text-[#556980] text-[10px]">{currentIndex + 1} of {questions.length}</span>
                    </div>
                </div>

                {/* Question Content */}
                <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium leading-relaxed">
                        {currentQuestion.text}
                    </p>
                    {currentQuestion.context && (
                        <p className="text-[#92adc9] text-xs mt-1 opacity-80">
                            {currentQuestion.context}
                        </p>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={() => answerMutation.mutate({ questionId: currentQuestion.id, answer: "yes" })}
                        disabled={answerMutation.isPending}
                        className="px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-sm font-bold transition-all border border-emerald-500/30 flex items-center gap-1.5"
                    >
                        <span className="material-symbols-outlined text-[16px]">check</span>
                        Yes
                    </button>
                    <button
                        onClick={() => answerMutation.mutate({ questionId: currentQuestion.id, answer: "no" })}
                        disabled={answerMutation.isPending}
                        className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-bold transition-all border border-red-500/30 flex items-center gap-1.5"
                    >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                        No
                    </button>
                    <button
                        onClick={() => answerMutation.mutate({ questionId: currentQuestion.id, answer: "skip" })}
                        disabled={answerMutation.isPending}
                        className="px-3 py-2 rounded-lg bg-[#233648] hover:bg-[#2d445a] text-[#92adc9] text-xs font-medium transition-all"
                    >
                        Skip
                    </button>
                </div>
            </div>

            {/* Progress dots */}
            {questions.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {questions.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentIndex ? "bg-primary w-4" : "bg-[#556980] hover:bg-primary/50"
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
