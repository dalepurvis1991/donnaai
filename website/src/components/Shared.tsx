import { Link } from 'wouter'

export const Navbar = () => (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-border-dark bg-white/80 dark:bg-background-dark/80 backdrop-blur-md">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                <Link href="/">
                    <div className="flex items-center gap-2 cursor-pointer">
                        <div className="size-8 text-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-3xl">smart_toy</span>
                        </div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Donna AI</h2>
                    </div>
                </Link>
                <nav className="hidden md:flex items-center gap-8">
                    <Link href="/pricing"><a className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors">Pricing</a></Link>
                    <Link href="/odoo"><a className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors">Odoo</a></Link>
                    <Link href="/integrations"><a className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors">Integrations</a></Link>
                    <Link href="/blog"><a className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors">Blog</a></Link>
                </nav>
                <div className="flex items-center gap-4">
                    <a className="hidden sm:block text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white" href="#">Log in</a>
                    <button className="flex items-center justify-center rounded-lg h-9 px-4 bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-all shadow-[0_0_15px_rgba(25,79,240,0.3)] hover:shadow-[0_0_20px_rgba(25,79,240,0.5)]">
                        Join Waitlist
                    </button>
                </div>
            </div>
        </div>
    </header>
)

export const Footer = () => (
    <footer className="w-full border-t border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark py-16 px-6">
        <div className="max-w-[1280px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 text-left mb-16">
            <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2 mb-6">
                    <span className="material-symbols-outlined text-primary text-3xl">smart_toy</span>
                    <span className="text-xl font-bold dark:text-white">Donna AI</span>
                </div>
                <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-6">
                    Operational intelligence for the modern enterprise. Safe, secure, and surprisingly human.
                </p>
            </div>
            <div>
                <h4 className="font-bold mb-6 dark:text-white">Product</h4>
                <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                    <li><Link href="/" className="hover:text-primary transition-colors">Features</Link></li>
                    <li><Link href="/integrations" className="hover:text-primary transition-colors">Integrations</Link></li>
                    <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                    <li><a href="#" className="hover:text-primary transition-colors">Security</a></li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold mb-6 dark:text-white">Company</h4>
                <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                    <li><a href="#" className="hover:text-primary transition-colors">About</a></li>
                    <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
                    <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                    <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold mb-6 dark:text-white">Legal</h4>
                <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                    <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
                    <li><a href="#" className="hover:text-primary transition-colors">Terms</a></li>
                    <li><a href="#" className="hover:text-primary transition-colors">Cookie Policy</a></li>
                </ul>
            </div>
        </div>
        <div className="max-w-[1280px] mx-auto pt-8 border-t border-slate-100 dark:border-border-dark flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
            <p>© 2024 Donna AI Inc. All rights reserved.</p>
            <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-green-500"></div>
                <span>All Systems Operational</span>
            </div>
        </div>
    </footer>
)
