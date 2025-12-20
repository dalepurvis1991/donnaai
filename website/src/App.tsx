import { motion } from 'framer-motion'
import {
    Bot,
    ArrowRight,
    CheckCircle2,
    Cloud,
    Database,
    ShieldCheck,
    Zap,
    Download,
    Menu,
    LogIn,
    Search,
    Check,
    ChevronDown
} from 'lucide-react'
import { useState } from 'react'

const Navbar = () => (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-[#282c39] bg-white/80 dark:bg-[#101522]/80 backdrop-blur-md">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-2">
                    <div className="size-8 text-[#194ff0] flex items-center justify-center">
                        <Bot className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Donna AI</h2>
                </div>
                <nav className="hidden md:flex items-center gap-8">
                    <a className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-[#194ff0] dark:hover:text-[#194ff0] transition-colors" href="#">Product</a>
                    <a className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-[#194ff0] dark:hover:text-[#194ff0] transition-colors" href="#">Security</a>
                    <a className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-[#194ff0] dark:hover:text-[#194ff0] transition-colors" href="#">Pricing</a>
                </nav>
                <div className="flex items-center gap-4">
                    <a className="hidden sm:block text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors" href="#">Log in</a>
                    <button className="flex items-center justify-center rounded-lg h-9 px-4 bg-[#194ff0] hover:bg-[#194ff0]/90 text-white text-sm font-bold transition-all shadow-[0_0_15px_rgba(25,79,240,0.3)] group">
                        <span className="truncate">Get Started</span>
                        <Download className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <button className="md:hidden text-slate-900 dark:text-white">
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
    </header>
)

const Hero = () => (
    <section className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center text-left">
            <div className="flex flex-col gap-6 max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#194ff0]/10 border border-[#194ff0]/20 w-fit"
                >
                    <span className="flex h-2 w-2 rounded-full bg-[#194ff0] animate-pulse"></span>
                    <span className="text-xs font-semibold text-[#194ff0] uppercase tracking-wide">Enterprise Beta Live</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl sm:text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight dark:text-white"
                >
                    The AI Assistant That <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#194ff0] to-blue-400">Actually Does</span> the Work.
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg"
                >
                    Donna executes complex workflows across your business stack. Enterprise-grade security, locally hosted options, and privacy-first design.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-wrap gap-4 pt-2"
                >
                    <button className="h-12 px-6 rounded-lg bg-[#194ff0] hover:bg-[#194ff0]/90 text-white font-bold text-base transition-all flex items-center gap-2 shadow-lg shadow-[#194ff0]/25">
                        Request Demo
                        <ArrowRight className="w-5 h-5" />
                    </button>
                    <button className="h-12 px-6 rounded-lg bg-white dark:bg-[#1a1d24] hover:bg-slate-50 dark:hover:bg-[#282c39] text-slate-900 dark:text-white font-bold text-base border border-slate-300 dark:border-[#282c39] transition-all flex items-center gap-2">
                        <Download className="w-5 h-5" />
                        Download App
                    </button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="pt-4 flex items-center gap-4 text-sm text-slate-500"
                >
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-[#101522] bg-slate-300 overflow-hidden">
                                <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                    <p>Trusted by 500+ ops leaders</p>
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative w-full aspect-square lg:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-[#282c39] group"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-[#194ff0]/20 via-[#101522] to-[#101522] opacity-50 z-10"></div>
                <img
                    src="https://images.unsplash.com/photo-1551288049-bbbda595c7b8?auto=format&fit=crop&q=80&w=1200"
                    alt="dashboard"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                <div className="absolute bottom-8 left-8 right-8 bg-white/10 dark:bg-black/40 backdrop-blur-xl border border-white/20 p-6 rounded-xl z-20 shadow-xl">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#194ff0] flex items-center justify-center flex-shrink-0">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div className="space-y-2 w-full text-left">
                            <div className="h-2.5 w-1/3 bg-white/20 rounded"></div>
                            <div className="h-2.5 w-3/4 bg-white/10 rounded"></div>
                            <div className="mt-4 p-3 bg-[#194ff0]/20 rounded border border-[#194ff0]/30 flex items-center gap-3">
                                <CheckCircle2 className="w-4 h-4 text-[#194ff0]" />
                                <span className="text-xs text-white font-medium">Salesforce record updated successfully.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    </section>
)

const Integrations = () => (
    <section className="w-full border-y border-slate-200 dark:border-[#282c39] bg-slate-50 dark:bg-[#1a1d24]/30 py-10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 uppercase tracking-widest">Seamlessly integrates with your stack</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                <div className="text-xl font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Cloud className="w-6 h-6" /> Salesforce
                </div>
                <div className="text-xl font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Database className="w-6 h-6" /> Snowflake
                </div>
                <div className="text-xl font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6" /> Okta
                </div>
                <div className="text-xl font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Zap className="w-6 h-6" /> Slack
                </div>
            </div>
        </div>
    </section>
)

const Features = () => (
    <section id="features" className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex flex-col md:flex-row gap-12 mb-16 items-start">
            <div className="flex-1 text-left">
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight mb-4 tracking-tight">
                    Primary Outcomes for<br /><span className="text-[#194ff0]">Operational Speed</span>
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-lg max-w-xl">
                    Donna is designed for operational teams and privacy-conscious businesses who need to move fast without breaking things.
                </p>
            </div>
            <div className="flex-shrink-0">
                <a className="text-[#194ff0] font-bold hover:text-[#194ff0]/80 flex items-center gap-2 transition-colors" href="#">
                    View Full Documentation <ArrowRight className="w-4 h-4" />
                </a>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
                { icon: Zap, title: "Instant Execution", desc: "Turn natural language into SQL, API calls, and system updates. Donna doesn't just chat; she performs actions." },
                { icon: ShieldCheck, title: "Privacy First", desc: "Your data never trains our models. Choose between secure cloud processing or fully local deployment options." },
                { icon: Bot, title: "Cross-Platform", desc: "Connects seamlessly with your existing operational stack. No new tabs to open, Donna lives where you work." },
                { icon: Database, title: "Odoo Integration", desc: "Natively connects to Odoo CRM, Inventory, and Accounting. Manage your entire ERP through chat." }
            ].map((f, i) => (
                <motion.div
                    key={i}
                    whileHover={{ y: -5 }}
                    className="group p-8 rounded-2xl bg-white dark:bg-[#1a1d24] border border-slate-200 dark:border-[#282c39] hover:border-[#194ff0]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#194ff0]/5 relative overflow-hidden text-left"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <f.icon className="w-32 h-32 text-[#194ff0]" />
                    </div>
                    <div className="size-12 rounded-lg bg-[#194ff0]/10 flex items-center justify-center mb-6 text-[#194ff0] group-hover:scale-110 transition-transform">
                        <f.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{f.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {f.desc}
                    </p>
                </motion.div>
            ))}
        </div>
    </section>
)

const DownloadSection = () => (
    <section className="py-24 bg-[#194ff0]/5 border-y border-[#194ff0]/10 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-20">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#194ff0] blur-[150px] rounded-full" />
        </div>
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
            <div className="text-left">
                <h2 className="text-4xl md:text-5xl font-black mb-6 dark:text-white">Take Donna with you everywhere.</h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
                    The power of Donna AI, now available on all your devices. Manage your business workflows, communications, and data from anywhere in the world.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-bold transition-all transform hover:-translate-y-1 shadow-xl">
                        <div className="w-10 h-10 flex items-center justify-center">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/3/31/Apple_logo_white.svg" className="w-8" alt="apple" />
                        </div>
                        <div className="text-left">
                            <div className="text-[10px] uppercase font-bold text-slate-400">Download on the</div>
                            <div className="text-xl">App Store</div>
                        </div>
                    </button>
                    <button className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-bold transition-all transform hover:-translate-y-1 shadow-xl">
                        <div className="w-10 h-10 flex items-center justify-center">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/d/d7/Google_Play_Store_badge_EN.svg" className="w-12 h-full object-contain" alt="playstore" />
                        </div>
                        <div className="text-left">
                            <div className="text-[10px] uppercase font-bold text-slate-400">Get it on</div>
                            <div className="text-xl">Google Play</div>
                        </div>
                    </button>
                </div>
                <p className="mt-6 text-sm text-slate-500 font-medium italic">* Desktop app coming soon for Windows & macOS.</p>
            </div>
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                className="relative"
            >
                <img
                    src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=800"
                    alt="mobile app"
                    className="rounded-[40px] shadow-2xl border-8 border-slate-900 mx-auto w-72 md:w-80"
                />
                <div className="absolute -bottom-10 -right-10 bg-[#194ff0] text-white p-6 rounded-2xl shadow-2xl hidden lg:block">
                    <Zap className="w-8 h-8 mb-2" />
                    <p className="font-bold">Syncs in real-time</p>
                    <p className="text-xs opacity-80">across all instances</p>
                </div>
            </motion.div>
        </div>
    </section>
)

const Pricing = () => (
    <section className="py-24 px-6 max-w-[1280px] mx-auto text-center">
        <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4 dark:text-white tracking-tight">Simple pricing for complex operations</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Join the Donna AI Pilot Program. Secure, private, and ready to work.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 text-left">
            {/* Pilot */}
            <div className="relative flex flex-col gap-6 rounded-2xl border-2 border-[#194ff0] bg-white dark:bg-[#1b1e27] p-8 shadow-2xl shadow-[#194ff0]/10 transform hover:-translate-y-1 transition-all duration-300">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#194ff0] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    Recommended
                </div>
                <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-bold dark:text-white">Pilot Access</h3>
                    <p className="text-sm text-slate-500">Perfect for teams validating AI workflows.</p>
                    <div className="flex items-baseline gap-1 mt-2 mb-4">
                        <span className="text-4xl font-black tracking-tight dark:text-white">$49</span>
                        <span className="text-sm font-medium text-slate-500">/user/mo</span>
                    </div>
                    <button className="w-full h-12 rounded-lg bg-[#194ff0] hover:bg-blue-600 text-white font-bold transition-colors">
                        Apply for Pilot
                    </button>
                </div>
                <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-[#282c39]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Includes</p>
                    <ul className="space-y-3">
                        {["Unlimited workflows", "SOC2 Compliance", "Zero-Data Retention", "Priority Support"].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm dark:text-slate-300">
                                <CheckCircle2 className="w-5 h-5 text-[#194ff0]" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Standard */}
            <div className="flex flex-col gap-6 rounded-2xl border border-slate-200 dark:border-[#282c39] bg-white/50 dark:bg-[#1a1d24]/50 p-8 text-left">
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold dark:text-white text-slate-400">Standard</h3>
                        <span className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold px-2 py-1 rounded text-slate-500">Waitlist</span>
                    </div>
                    <p className="text-sm text-slate-500">For scaling operational efficiency.</p>
                    <div className="flex items-baseline gap-1 mt-2 mb-4">
                        <span className="text-4xl font-black tracking-tight text-slate-300 dark:text-slate-700">Coming</span>
                    </div>
                    <button className="w-full h-12 rounded-lg bg-slate-900 text-white font-bold hover:opacity-90 transition-opacity">
                        Join Waitlist
                    </button>
                </div>
                <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-[#282c39]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Includes</p>
                    <ul className="space-y-3 opacity-50">
                        {["Standard Integrations", "Team usage analytics", "Advanced data controls"].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm dark:text-slate-300">
                                <Check className="w-5 h-5 text-slate-400" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Enterprise */}
            <div className="flex flex-col gap-6 rounded-2xl border border-slate-200 dark:border-[#282c39] bg-white dark:bg-[#1a1d24] p-8 text-left">
                <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-bold dark:text-white">Enterprise</h3>
                    <p className="text-sm text-slate-500">Custom security & deep integrations.</p>
                    <div className="flex items-baseline gap-1 mt-2 mb-4">
                        <span className="text-4xl font-black tracking-tight dark:text-white">Custom</span>
                    </div>
                    <button className="w-full h-12 rounded-lg border border-slate-300 dark:border-[#282c39] hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition-colors dark:text-white">
                        Contact Sales
                    </button>
                </div>
                <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-[#282c39]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Everything in Standard, plus:</p>
                    <ul className="space-y-3">
                        {["On-premise deployment", "Dedicated Success Manager", "Custom API connectors", "Custom SLA"].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm dark:text-slate-300">
                                <CheckCircle2 className="w-5 h-5 text-[#194ff0]" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    </section>
)

const Footer = () => (
    <footer className="w-full border-t border-slate-200 dark:border-[#282c39] bg-white dark:bg-[#101522] py-16 px-6">
        <div className="max-w-[1280px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 text-left mb-16">
            <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2 mb-6">
                    <Bot className="w-8 h-8 text-[#194ff0]" />
                    <span className="text-xl font-bold dark:text-white">Donna AI</span>
                </div>
                <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-6">
                    Operational intelligence for the modern enterprise. Safe, secure, and surprisingly human.
                </p>
                <div className="flex gap-4">
                    {[Zap, Cloud, Database].map((Icon, i) => (
                        <a key={i} href="#" className="w-10 h-10 rounded-full border border-slate-200 dark:border-[#282c39] flex items-center justify-center text-slate-400 hover:text-[#194ff0] hover:border-[#194ff0] transition-all">
                            <Icon className="w-4 h-4" />
                        </a>
                    ))}
                </div>
            </div>
            <div>
                <h4 className="font-bold mb-6 dark:text-white">Product</h4>
                <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                    <li><a href="#" className="hover:text-[#194ff0] transition-colors">Features</a></li>
                    <li><a href="#" className="hover:text-[#194ff0] transition-colors">Integrations</a></li>
                    <li><a href="#" className="hover:text-[#194ff0] transition-colors">Pricing</a></li>
                    <li><a href="#" className="hover:text-[#194ff0] transition-colors">Security</a></li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold mb-6 dark:text-white">Company</h4>
                <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                    <li><a href="#" className="hover:text-[#194ff0] transition-colors">About</a></li>
                    <li><a href="#" className="hover:text-[#194ff0] transition-colors">Blog</a></li>
                    <li><a href="#" className="hover:text-[#194ff0] transition-colors">Careers</a></li>
                    <li><a href="#" className="hover:text-[#194ff0] transition-colors">Contact</a></li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold mb-6 dark:text-white">Legal</h4>
                <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                    <li><a href="#" className="hover:text-[#194ff0] transition-colors">Privacy</a></li>
                    <li><a href="#" className="hover:text-[#194ff0] transition-colors">Terms</a></li>
                    <li><a href="#" className="hover:text-[#194ff0] transition-colors">Cookie Policy</a></li>
                </ul>
            </div>
        </div>
        <div className="max-w-[1280px] mx-auto pt-8 border-t border-slate-100 dark:border-[#282c39] flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
            <p>© 2025 Donna AI Inc. All rights reserved.</p>
            <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-green-500"></div>
                <span>All Systems Operational</span>
            </div>
        </div>
    </footer>
)

const App = () => {
    return (
        <div className="min-h-screen bg-[#f6f6f8] dark:bg-[#101522] selection:bg-[#194ff0]/30 selection:text-white overflow-x-hidden">
            <Navbar />
            <main>
                <Hero />
                <Integrations />
                <Features />
                <DownloadSection />
                <Pricing />

                {/* Comparison Table Mini-version */}
                <section className="py-24 bg-white dark:bg-[#1a1d24] border-t border-slate-200 dark:border-[#282c39]">
                    <div className="max-w-4xl mx-auto px-6 text-center">
                        <h2 className="text-3xl font-bold mb-12 dark:text-white">Ready to automate your operations?</h2>
                        <div className="flex flex-col sm:flex-row justify-center gap-6">
                            <button className="px-10 py-4 bg-[#194ff0] text-white rounded-xl font-bold text-lg shadow-xl hover:bg-blue-600 transition-all transform hover:-translate-y-1">
                                Request a Demo
                            </button>
                            <button className="px-10 py-4 border-2 border-slate-200 dark:border-[#282c39] rounded-xl font-bold text-lg dark:text-white hover:bg-slate-50 dark:hover:bg-[#282c39] transition-all">
                                Join the Waitlist
                            </button>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    )
}

export default App
