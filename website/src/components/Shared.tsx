import { Link } from 'wouter'

export const Navbar = () => (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border-dark bg-background-dark/80 backdrop-blur-md">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-10">
            <div className="flex items-center justify-between h-16">
                <Link href="/">
                    <div className="flex items-center gap-3 text-white cursor-pointer">
                        <div className="size-8 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined !text-[32px]">smart_toy</span>
                        </div>
                        <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">Donna AI</h2>
                    </div>
                </Link>
                <div className="hidden md:flex flex-1 justify-end gap-8 items-center">
                    <nav className="flex items-center gap-8">
                        <Link href="/product"><a className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Product</a></Link>
                        <Link href="/pricing"><a className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Pricing</a></Link>
                        <Link href="/blog"><a className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Blog</a></Link>
                    </nav>
                    <a className="text-sm font-medium text-slate-400 hover:text-white transition-colors" href="#">Log in</a>
                    <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-4 bg-primary hover:bg-primary-dark transition-colors text-white text-sm font-bold leading-normal">
                        <span className="truncate">Join Beta</span>
                    </button>
                </div>
            </div>
        </div>
    </header>
)

export const Footer = () => (
    <footer className="w-full border-t border-border-dark bg-background-dark py-16 px-6 text-white">
        <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 text-left mb-16">
            <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2 mb-6">
                    <span className="material-symbols-outlined text-primary text-3xl">smart_toy</span>
                    <span className="text-xl font-bold">Donna AI</span>
                </div>
                <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-6">
                    A personal assistant built for email reality.
                </p>
                <Link href="/feedback">
                    <button className="text-xs font-bold text-primary border border-primary/20 bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors">
                        Suggest Improvement
                    </button>
                </Link>
            </div>
            <div>
                <h4 className="font-bold mb-6">Product</h4>
                <ul className="space-y-4 text-sm text-slate-400">
                    <li><Link href="/" className="hover:text-white transition-colors">Features</Link></li>
                    <li><Link href="/product" className="hover:text-white transition-colors">How it works</Link></li>
                    <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                    <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold mb-6">Company</h4>
                <ul className="space-y-4 text-sm text-slate-400">
                    <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                    <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                    <li><a href="mailto:hello@donna.ai" className="hover:text-white transition-colors">Contact</a></li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold mb-6">Legal</h4>
                <ul className="space-y-4 text-sm text-slate-400">
                    <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                </ul>
            </div>
        </div>
        <div className="max-w-[1200px] mx-auto pt-8 border-t border-border-dark flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
            <p>© 2024 Donna AI Inc. All rights reserved.</p>
            <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-green-500 animate-pulse"></div>
                <span>Beta Systems Operational</span>
            </div>
        </div>
    </footer>
)
