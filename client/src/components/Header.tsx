import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Mail, RefreshCw, LogOut, Settings, MessageCircle, Brain, Folder, BarChart3, Menu, X, CheckSquare, LinkIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

interface HeaderProps {
  emailStatus: "connected" | "disconnected" | "refreshing";
}

export default function Header({ emailStatus }: HeaderProps) {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return user.firstName[0] + user.lastName[0];
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const navigationItems = [
    { icon: Settings, label: "Settings", href: "/settings" },
    { icon: MessageCircle, label: "Chat", href: "/chat" },
    { icon: Folder, label: "Folders", href: "/folders" },
    { icon: BarChart3, label: "Digest", href: "/digest" },
    { icon: Brain, label: "Memories", href: "/memories" },
    { icon: CheckSquare, label: "Tasks", href: "/tasks" },
    { icon: LinkIcon, label: "Correlations", href: "/correlations" },
    { icon: Mail, label: "Bulk Processing", href: "/bulk-processing" },
  ];

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Donna AI</h1>
              <p className="text-xs text-slate-500">Your Intelligent Assistant</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              {navigationItems.map((item) => (
                <Button
                  key={item.href}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => window.location.href = item.href}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Dialog open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Navigation</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-2">
                    {navigationItems.map((item) => (
                      <Button
                        key={item.href}
                        variant="ghost"
                        className="justify-start gap-3"
                        onClick={() => {
                          window.location.href = item.href;
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Email Status Indicator */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-600" />
                <div 
                  className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                    emailStatus === 'connected' ? 'bg-emerald-500' : 
                    emailStatus === 'refreshing' ? 'bg-amber-500' : 
                    'bg-red-500'
                  }`}
                />
              </div>
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.email || 'User'} />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
