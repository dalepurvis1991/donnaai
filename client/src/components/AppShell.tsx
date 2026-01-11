import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { User } from "@shared/schema";

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    const [location] = useLocation();
    const { user } = useAuth() as { user: User | null };

    const menuItems = [
        { label: "Home", href: "/", icon: "home" },
        { label: "Decision Feed", href: "/decision-feed", icon: "dynamic_feed" },
        { label: "Delegations", href: "/tasks", icon: "assignment_ind" },
    ];

    const bottomItems = [
        { label: "Settings", href: "/settings", icon: "settings" },
        { label: "Activity Log", href: "/audit", icon: "history" },
    ];

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark font-body antialiased">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 border-r border-border-dark bg-[#111a22] flex flex-col justify-between p-4 h-full overflow-y-auto">
                <div className="flex flex-col gap-6">
                    <div className="flex gap-3 items-center px-2">
                        <div
                            className="bg-center bg-no-repeat bg-cover rounded-full h-10 w-10 border border-border-dark bg-primary/20 flex items-center justify-center"
                            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAAoj_ec9a-tFzQdYfhAvACByHuCZJz0aN9Ed5WlC7ksen3_BhSOw6MB6vmL8lLqECCBiin5d2uRfQjrXaEtFsmrOlyRwGMzCa0ZSOPemeePGtQgymgESntzDa2pwJNM1WD4kFCfcTzJXqJ9CNijrbaNtW-8FNIHamrakkfCijKPguWySluIhV8nmM1hnErN6q4i0eFltMP7HjBn3KqA6SqRrYv3xCUj4r0PETe0042xajlbb8fPKC1FGoCCiR2NPWJEJXEcn8fyYs")' }}
                        >
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-white text-base font-bold leading-normal tracking-tight">Flooring AI</h1>
                            <p className="text-[#92adc9] text-xs font-normal">Internal Agent Tool</p>
                        </div>
                    </div>

                    <nav className="flex flex-col gap-2">
                        {menuItems.map((item) => {
                            const isActive = location === item.href;
                            return (
                                <Link key={item.href} href={item.href} className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group border border-transparent cursor-pointer",
                                    isActive
                                        ? "bg-primary/20 border-primary/20 text-white"
                                        : "hover:bg-[#233648] text-[#92adc9] hover:text-white"
                                )}>
                                    <span className={cn(
                                        "material-symbols-outlined text-[20px]",
                                        isActive ? "text-primary" : ""
                                    )}>
                                        {item.icon}
                                    </span>
                                    <p className="text-sm font-medium leading-normal">{item.label}</p>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="flex flex-col gap-2 pt-4 border-t border-border-dark">
                    {bottomItems.map((item) => {
                        const isActive = location === item.href;
                        return (
                            <Link key={item.href} href={item.href} className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group border border-transparent cursor-pointer",
                                isActive
                                    ? "bg-primary/20 border-primary/20 text-white"
                                    : "hover:bg-[#233648] text-[#92adc9] hover:text-white"
                            )}>
                                <span className={cn(
                                    "material-symbols-outlined text-[20px]",
                                    isActive ? "text-primary" : ""
                                )}>
                                    {item.icon}
                                </span>
                                <p className="text-sm font-medium leading-normal">{item.label}</p>
                            </Link>
                        );
                    })}

                    <div className="flex items-center gap-3 px-3 py-3 mt-2 rounded-lg bg-[#0d141c]">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-accent-purple"></div>
                        <div className="flex flex-col">
                            <p className="text-white text-xs font-bold">{user?.firstName || "Admin User"}</p>
                            <p className="text-[#92adc9] text-[10px] truncate max-w-[120px]">{user?.email}</p>
                        </div>
                        <button
                            onClick={() => window.location.href = '/api/logout'}
                            className="ml-auto text-[#92adc9] hover:text-white transition-colors"
                            title="Logout"
                        >
                            <span className="material-symbols-outlined text-[18px]">logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full relative overflow-y-auto bg-background-light dark:bg-background-dark">
                {children}
            </main>
        </div>
    );
}
