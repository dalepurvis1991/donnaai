import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";

interface Email {
  id: number;
  subject: string;
  sender: string;
  senderEmail: string;
  date: string;
  category: string;
}

interface EmailCardProps {
  email: Email;
  color: "blue" | "amber" | "emerald";
}

const colorConfig = {
  blue: "bg-blue-100 text-blue-800",
  amber: "bg-amber-100 text-amber-800",
  emerald: "bg-emerald-100 text-emerald-800",
};

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
  const badgeColor = colorConfig[color];
  const timeAgo = formatTimeAgo(email.date);

  return (
    <div className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors duration-200 cursor-pointer" onClick={() => window.location.href = `/email/${email.id}`}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-slate-900 text-sm truncate pr-2">
          {email.subject}
        </h3>
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {timeAgo}
        </span>
      </div>
      <p className="text-sm text-slate-600 mb-2">{email.sender}</p>
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className={badgeColor}>
          {email.category}
        </Badge>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </div>
    </div>
  );
}
