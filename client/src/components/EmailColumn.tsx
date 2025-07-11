import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (order: 'asc' | 'desc') => void;
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
  isLoading,
  sortOrder = 'desc',
  onSortChange
}: EmailColumnProps) {
  const colors = colorConfig[color];

  const handleSortToggle = () => {
    if (onSortChange) {
      onSortChange(sortOrder === 'asc' ? 'desc' : 'asc');
    }
  };

  // Sort emails based on current sort order
  const sortedEmails = [...emails].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    
    if (sortOrder === 'asc') {
      return dateA - dateB; // oldest first
    } else {
      return dateB - dateA; // newest first
    }
  });

  return (
    <Card className="border-slate-200">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <div className={`w-3 h-3 ${colors.dot} rounded-full flex-shrink-0`} />
            <h2 className={`text-lg font-semibold ${colors.title} truncate`}>{title}</h2>
            <Badge variant="secondary" className={`${colors.badge} flex-shrink-0`}>
              {count}
            </Badge>
          </div>
          {onSortChange && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSortToggle}
              className="ml-2 flex-shrink-0 h-8 w-8 p-0"
              title={`Sort ${sortOrder === 'asc' ? 'newest first' : 'oldest first'}`}
            >
              {sortOrder === 'asc' ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        <p className="text-sm text-slate-500 mb-4">{description}</p>
        
        <div className="space-y-3">
          {isLoading ? (
            // Loading skeletons
            [...Array(3)].map((_, i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-3 sm:p-4">
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
          ) : sortedEmails.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-500">No emails in this category</p>
            </div>
          ) : (
            sortedEmails.map((email) => (
              <EmailCard key={email.id} email={email} color={color} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
