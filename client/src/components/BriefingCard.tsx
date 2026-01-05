import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, MessageSquare, Check, X, Sparkles } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface BriefingQuestion {
    id: string;
    text: string;
    context: string;
    proposedAction: string;
    emailId?: number;
}

interface Briefing {
    summary: string;
    questions: BriefingQuestion[];
}

export function BriefingCard() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [answeredIds, setAnsweredIds] = useState<string[]>([]);

    const { data: briefing, isLoading } = useQuery<Briefing>({
        queryKey: ["/api/briefing"],
        refetchInterval: 300000, // Refetch every 5 mins
    });

    const feedbackMutation = useMutation({
        mutationFn: async ({ trigger, correction }: { trigger: string; correction: string }) => {
            await apiRequest("POST", "/api/agent/feedback", { trigger, correction });
        },
        onSuccess: () => {
            toast({
                title: "Learning Protocol Updated",
                description: "Your feedback has been integrated into my neural core.",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/briefing"] });
        },
    });

    if (isLoading) {
        return <Skeleton className="h-[200px] w-full rounded-xl" />;
    }

    if (!briefing || (briefing.summary.includes("No new urgent traces") && briefing.questions.length === 0)) {
        return null;
    }

    const activeQuestions = briefing.questions.filter(q => !answeredIds.includes(q.id));

    const handleAction = (question: BriefingQuestion, approved: boolean) => {
        setAnsweredIds(prev => [...prev, question.id]);

        if (approved) {
            toast({
                title: "Action Initiated",
                description: `I'm proceeding with: ${question.proposedAction}`,
            });
            // In a real app, this might trigger a specific email draft or task update
        } else {
            const correction = prompt(`How should I have handled this? (e.g. 'Don't reply to these', 'Ask for a discount instead')`);
            if (correction) {
                feedbackMutation.mutate({
                    trigger: `User rejected proposed action: ${question.proposedAction} for email ${question.text}`,
                    correction
                });
            }
        }
    };

    return (
        <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5 shadow-lg overflow-hidden relative border-l-4 border-l-primary">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Brain className="h-24 w-24 text-primary" />
            </div>

            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-primary">
                    <Sparkles className="h-5 w-5 animate-pulse" />
                    Neural Insight Briefing
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                    "{briefing.summary}"
                </p>

                {activeQuestions.length > 0 && (
                    <div className="space-y-3 mt-4 pt-4 border-t border-primary/10">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-primary/70 flex items-center gap-2">
                            <MessageSquare className="h-3 w-3" />
                            Direction Required
                        </h4>

                        {activeQuestions.map((q) => (
                            <div key={q.id} className="bg-background/50 p-3 rounded-lg border border-primary/5 space-y-2">
                                <p className="text-sm font-medium">{q.text}</p>
                                <p className="text-xs text-muted-foreground">{q.context}</p>

                                <div className="flex gap-2 pt-1">
                                    <Button
                                        size="sm"
                                        variant="default"
                                        className="h-8 px-3 gap-1 bg-primary/90 hover:bg-primary"
                                        onClick={() => handleAction(q, true)}
                                    >
                                        <Check className="h-3 w-3" />
                                        Approve Action
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 px-3 gap-1"
                                        onClick={() => handleAction(q, false)}
                                    >
                                        <X className="h-3 w-3" />
                                        Correct Me
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
