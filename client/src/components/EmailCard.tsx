import { ChevronRight, Clock, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Email {
  id: number;
  subject: string;
  sender: string;
  senderEmail: string;
  date: string;
  category: string;
  isRead?: boolean;
}

interface EmailCardProps {
  email: Email;
  color: "blue" | "amber" | "emerald";
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return `${Math.floor(diffMins / 1440)}d ago`;
}

export default function EmailCard({ email, color }: EmailCardProps) {
  const timeAgo = formatTimeAgo(email.date);
  const { toast } = useToast();

  const markReadMutation = useMutation({
    mutationFn: async (isRead: boolean) => {
      const response = await apiRequest("PUT", `/api/emails/${email.id}/read`, { isRead });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails/categorized"] });
      queryClient.invalidateQueries({ queryKey: ["/api/emails/stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update email status",
        variant: "destructive"
      });
    }
  });

  const handleMarkRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    markReadMutation.mutate(!email.isRead);
  };

  return (
    <Link href={`/email/${email.id}`} className={`block group p-5 rounded-2xl border backdrop-blur-md transition-all duration-300 relative overflow-hidden ${email.isRead
      ? 'bg-white/[0.02] border-white/5 opacity-60'
      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/30'
      }`}>
      {/* Unread Indicator */}
      {!email.isRead && (
        <div className={`absolute top-0 right-0 w-8 h-8 ${color === 'blue' ? 'bg-primary/20' : color === 'amber' ? 'bg-amber-500/20' : 'bg-emerald-500/20'
          } blur-xl rounded-full -mr-4 -mt-4`}></div>
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-2 pr-4">
            {!email.isRead && (
              <div className={`mt-1.5 size-2 rounded-full flex-shrink-0 animate-pulse ${color === 'blue' ? 'bg-primary' : color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}></div>
            )}
            <h3 className={`font-bold text-[15px] leading-tight transition-colors line-clamp-2 ${email.isRead ? 'text-slate-400' : 'text-white group-hover:text-primary'
              }`}>
              {email.subject}
            </h3>
          </div>
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
            <Clock className="size-3" />
            {timeAgo}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center text-[10px] font-bold">
              {(email.sender || "?")[0]}
            </div>
            <p className="text-sm text-slate-400 font-medium truncate">{email.sender}</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${color === 'blue' ? 'bg-blue-500/10 text-blue-400' :
                color === 'amber' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-emerald-500/10 text-emerald-400'
                }`}>
                {email.category}
              </span>

              <button
                onClick={handleMarkRead}
                disabled={markReadMutation.isPending}
                className={`p-1 rounded-md transition-all ${email.isRead ? 'text-primary' : 'text-slate-600 hover:text-white hover:bg-white/5'
                  }`}
                title={email.isRead ? "Mark as unread" : "Mark as read"}
              >
                <CheckCircle2 className={`size-4 ${markReadMutation.isPending ? 'animate-pulse' : ''}`} />
              </button>
            </div>

            <div className="size-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-all">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
