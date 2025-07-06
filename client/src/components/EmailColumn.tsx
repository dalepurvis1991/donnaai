import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import EmailCard from "./EmailCard";

interface Email {
  id: number;
  subject: string;
  sender: string;
  senderEmail: string;
  date: string;
  category: string;
}

interface EmailColumnProps {
  title: string;
  description: string;
  color: "blue" | "amber" | "emerald";
  emails: Email[];
  count: number;
  isLoading: boolean;
}

const colorConfig = {
  blue: {
    dot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-800",
    title: "text-slate-900",
  },
  amber: {
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-800",
    title: "text-slate-900",
  },
  emerald: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-800",
    title: "text-slate-900",
  },
};

export default function EmailColumn({ 
  title, 
  description, 
  color, 
  emails, 
  count, 
  isLoading 
}: EmailColumnProps) {
  const colors = colorConfig[color];

  return (
    <Card className="border-slate-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 ${colors.dot} rounded-full`} />
            <h2 className={`text-lg font-semibold ${colors.title}`}>{title}</h2>
            <Badge variant="secondary" className={colors.badge}>
              {count}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-slate-500 mb-4">{description}</p>
        
        <div className="space-y-3">
          {isLoading ? (
            // Loading skeletons
            [...Array(3)].map((_, i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-4 w-1/2 mb-2" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-4 w-4" />
                </div>
              </div>
            ))
          ) : emails.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-500">No emails in this category</p>
            </div>
          ) : (
            emails.map((email) => (
              <EmailCard key={email.id} email={email} color={color} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
