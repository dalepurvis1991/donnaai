import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  LogOut,
  Settings,
  MessageCircle,
  Folder,
  Menu,
  CheckSquare,
  LinkIcon,
  Users,
  Brain,
  BarChart3,
  Boxes,
  Zap,
  Activity,
  Cpu,
  Fingerprint
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { User } from "@shared/schema";

interface HeaderProps {
  emailStatus: "connected" | "disconnected" | "refreshing";
}

export default function Header({ emailStatus }: HeaderProps) {
  const { user } = useAuth() as { user: User | null; isLoading: boolean; isAuthenticated: boolean };
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();

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
    { icon: Activity, label: "Center", href: "/", tooltip: "Command Center" },
    { icon: MessageCircle, label: "Chat", href: "/chat", tooltip: "Neural Chat" },
    { icon: CheckSquare, label: "Tasks", href: "/tasks", tooltip: "Mission Control" },
    { icon: Brain, label: "Vault", href: "/memories", tooltip: "Memory Bank" },
    { icon: LinkIcon, label: "Links", href: "/correlations", tooltip: "Correlations" },
    { icon: Folder, label: "Nodes", href: "/folders", tooltip: "Folder Nodes" },
    { icon: BarChart3, label: "Intel", href: "/digest", tooltip: "Business Intel" },
    { icon: Users, label: "Team", href: "/team", tooltip: "Team Management" },
    { icon: Boxes, label: "Bulk", href: "/bulk-processing", tooltip: "Batch Ops" },
    { icon: Settings, label: "Core", href: "/settings", tooltip: "System Core" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#101522]/80 backdrop-blur-xl h-20">
      <div className="h-full px-6 flex items-center justify-between mx-auto max-w-[1600px]">
        <div className="flex items-center gap-12">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="size-10 bg-primary/20 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-glow-sm group-hover:scale-110 transition-all duration-500">
                <Cpu className="size-5" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-sm font-black tracking-[0.2em] uppercase text-white group-hover:text-primary transition-colors">Donna AI</h1>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest italic">Neural Team</span>
              </div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navigationItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 group relative cursor-pointer ${isActive
                    ? "text-primary "
                    : "text-slate-500 hover:text-white"
                    }`}>
                    <item.icon className={`size-3.5 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-primary" : "text-slate-600 group-hover:text-primary/70"}`} />
                    <span className="italic">{item.label}</span>
                    {isActive && (
                      <div className="absolute -bottom-[25px] left-0 right-0 h-[2px] bg-primary shadow-glow"></div>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden 2xl:flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
            <div className="relative">
              <div className={`size-2 rounded-full ${emailStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse' : emailStatus === 'refreshing' ? 'bg-amber-500 animate-spin' : 'bg-red-500'}`}></div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 italic">
              {emailStatus === 'connected' ? 'Operational' : emailStatus === 'refreshing' ? 'Syncing...' : 'Offline'}
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 p-1 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/5 transition-all group">
                <Avatar className="size-9 rounded-xl border border-white/10">
                  <AvatarImage src={user?.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-black">{getUserInitials()}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start pr-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-white">{user?.firstName || 'Access'}</span>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest italic leading-none">Admin Trace</span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 bg-[#101522]/95 border-white/10 text-white backdrop-blur-2xl p-2 rounded-2xl shadow-2xl" align="end">
              <div className="flex flex-col space-y-1 p-4 border-b border-white/5 mb-2">
                <p className="text-xs font-black uppercase tracking-widest">{user?.firstName} {user?.lastName}</p>
                <p className="text-[10px] italic text-slate-500 truncate">{user?.email}</p>
              </div>
              <DropdownMenuItem onClick={handleLogout} className="rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 focus:bg-red-500/10 focus:text-red-400 transition-colors cursor-pointer py-3 h-11">
                <LogOut className="mr-3 size-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Button */}
          <div className="xl:hidden">
            <Dialog open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="size-11 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10">
                  <Menu className="size-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#101522]/98 border-white/10 text-white backdrop-blur-3xl min-w-full h-full sm:min-w-[400px] sm:h-auto rounded-none sm:rounded-[2.5rem] p-0 overflow-hidden">
                <div className="p-12 space-y-12 h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
                        <Cpu className="size-5" />
                      </div>
                      <h2 className="text-xl font-black uppercase tracking-widest italic">Mission Nav</h2>
                    </div>
                  </div>

                  <div className="grid gap-2 overflow-y-auto pr-2 flex-grow">
                    {navigationItems.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <div
                          className={`flex items-center gap-4 px-6 py-5 rounded-2xl border transition-all duration-300 cursor-pointer ${location === item.href ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10'}`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <item.icon className="size-5" />
                          <span className="font-black uppercase tracking-[0.2em] italic text-xs">{item.label}</span>
                        </div>
                      </Link>
                    ))}
                  </div>

                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    className="w-full flex items-center justify-center gap-3 h-16 rounded-2xl bg-red-500/5 hover:bg-red-500/10 text-red-500 border border-red-500/10"
                  >
                    <LogOut className="size-5" />
                    <span className="font-black uppercase tracking-[0.2em] italic text-xs">Log Out</span>
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </header>
  );
}
