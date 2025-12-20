import { motion } from 'framer-motion'
import { useState } from 'react'

const Navbar = () => (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-border-dark bg-white/80 dark:bg-background-dark/80 backdrop-blur-md">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-2">
                    <div className="size-8 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl">smart_toy</span>
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Donna AI</h2>
                </div>
                <nav className="hidden md:flex items-center gap-8">
                    <a className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors" href="#product">Product</a>
                    <a className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors" href="#features">Features</a>
                    <a className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors" href="#pricing">Pricing</a>
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

const Hero = () => (
    <section id="product" className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center text-left">
            <div className="flex flex-col gap-6 max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 w-fit"
                >
                    <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">Enterprise Beta Live</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl sm:text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight dark:text-white"
                >
                    The AI Assistant That <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Actually Does</span> the Work.
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg"
                >
                    Donna executes complex workflows across your business stack. Enterprise-grade security, locally hosted options, and privacy-first design.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-wrap gap-4 pt-2"
                >
                    <button className="h-12 px-6 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-base transition-all flex items-center gap-2 shadow-lg shadow-primary/25">
                        Request Demo
                        <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </button>
                    <button className="h-12 px-6 rounded-lg bg-slate-200 dark:bg-card-dark hover:bg-slate-300 dark:hover:bg-border-dark text-slate-900 dark:text-white font-bold text-base border border-slate-300 dark:border-border-dark transition-all">
                        Try Sandbox
                    </button>
                </motion.div>

                <div className="pt-4 flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-background-dark bg-slate-300 overflow-hidden">
                                <img src={`https://i.pravatar.cc/100?u=${i + 10}`} alt="user" className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                    <p>Trusted by 500+ ops leaders</p>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative w-full aspect-square lg:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-border-dark group"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background-dark to-background-dark opacity-50 z-10"></div>
                <div className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDc_3KHLrmaLRcOEhGvsWPVW_FA0Ufp2DckdRsXtR0_uScCAACsP6UzZNw6VschOPXP5xNRz4HGfdR_EVWRvgW8dmgu5sJLP_xU7J4ONc4jR1X4uSSYMAbIxBpZeee-L33Rb9zkfsT5ivmgxqwGz5JXE04OYZbd8mVyAo-eU6lYVzJmWx5M3ayJeoD_kQg9VI6vNxGG-JNSaBj2ogYremSPR9pT4k5eQycRFjGBybfTGQ6ZRQLW3DRRBpfeWoq5Sk5A9S1N4s9NAhI')" }}>
                </div>

                <div className="absolute bottom-8 left-8 right-8 bg-white/10 dark:bg-black/40 backdrop-blur-xl border border-white/20 p-6 rounded-xl z-20 shadow-xl">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-white">smart_toy</span>
                        </div>
                        <div className="space-y-2 w-full text-left">
                            <div className="h-2.5 w-1/3 bg-white/20 rounded"></div>
                            <div className="h-2.5 w-3/4 bg-white/10 rounded"></div>
                            <div className="mt-4 p-3 bg-primary/20 rounded border border-primary/30 flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                                <span className="text-xs text-white font-medium text-left">Salesforce record updated successfully.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    </section>
)

const Integrations = () => (
    <section className="w-full border-y border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-card-dark/30 py-10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 uppercase tracking-widest">Seamlessly integrates with your stack</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                <div className="text-xl font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <span className="material-symbols-outlined">cloud</span> Salesforce
                </div>
                <div className="text-xl font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <span className="material-symbols-outlined">hub</span> HubSpot
                </div>
                <div className="text-xl font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <span className="material-symbols-outlined">forum</span> Slack
                </div>
                <div className="text-xl font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <span className="material-symbols-outlined">view_kanban</span> Jira
                </div>
                <div className="text-xl font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <span className="material-symbols-outlined">database</span> Snowflake
                </div>
            </div>
        </div>
    </section>
)

const Features = () => (
    <section id="features" className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex flex-col md:flex-row gap-12 mb-16 items-start text-left">
            <div className="flex-1">
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight mb-4 tracking-tight">
                    Primary Outcomes for<br /><span className="text-primary">Operational Speed</span>
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-lg max-w-xl">
                    Donna is designed for operational teams and privacy-conscious businesses who need to move fast without breaking things.
                </p>
            </div>
            <div className="flex-shrink-0">
                <a className="text-primary font-bold hover:text-primary/80 flex items-center gap-2 transition-colors" href="#">
                    View Full Documentation <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
                { icon: "bolt", title: "Instant Execution", desc: "Turn natural language into SQL, API calls, and system updates. Donna doesn't just chat; she performs actions." },
                { icon: "verified_user", title: "Privacy First", desc: "Your data never trains our models. Choose between secure cloud processing or fully local deployment options." },
                { icon: "hub", title: "Cross-Platform", desc: "Connects seamlessly with your existing operational stack. No new tabs to open, Donna lives where you work." }
            ].map((f, i) => (
                <motion.div
                    key={i}
                    whileHover={{ y: -5 }}
                    className="group p-8 rounded-2xl bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <span className="material-symbols-outlined text-9xl text-primary">{f.icon}</span>
                    </div>
                    <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-3xl">{f.icon}</span>
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

const UseCaseOdoo = () => (
    <section className="w-full px-4 md:px-10 lg:px-40 py-20 flex justify-center bg-slate-50 dark:bg-background-dark relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="max-w-[1280px] w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10 text-left">
            <div className="flex flex-col gap-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wide w-fit">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    New: Odoo 17 Support
                </div>
                <h2 className="text-3xl md:text-5xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
                    The AI Assistant that powers your <span className="text-primary">Odoo workflow</span>.
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                    Execute tasks, automate data entry, and find answers across Odoo modules instantly. Update leads, log notes, and schedule activities just by chatting.
                </p>
                <ul className="flex flex-col gap-3 mt-2">
                    {["Create leads from email summaries", "Log meeting notes via voice dictation", "Update deal stages with a single command"].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                            <span className="material-symbols-outlined text-primary">check</span>
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-border-dark shadow-2xl bg-slate-100 dark:bg-slate-900/50 overflow-hidden relative group aspect-[16/10]">
                <div className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.01]"
                    style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAJNfYR6XOc3ne7J8jJAeKxbC5jPsaZE-GPopQ80S7EMrnzRAXoEs4lIz0V-ye3ClukB9uHp8je5PtXpvLmySBiVzSN5fAFEuaKt563SeOtfy0bDZhV-E1_GBQF8rbhq9AyaiAnDx3Glg3RTDEEhm5WkSnQQeCnW3N_Z2Pr-XhD_dlWjv8Jd4UBEbmTP8HsOjD8fNUHyM31dAjpQMyUtSqbt0W23Zeu4qlNy0YY-spAca5rKPi1K8x9QXdg32LCrbJzNux5znKCn9M')" }}>
                </div>
            </div>
        </div>
    </section>
)

const Pricing = () => (
    <section id="pricing" className="py-24 px-6 max-w-[1280px] mx-auto text-center">
        <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4 dark:text-white tracking-tight">Simple pricing for complex operations</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Join the Donna AI Pilot Program. Secure, private, and ready to work.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 text-left">
            <div className="relative flex flex-col gap-6 rounded-2xl border-2 border-primary bg-white dark:bg-card-dark p-8 shadow-2xl shadow-primary/10 transform hover:-translate-y-1 transition-all duration-300">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    Recommended
                </div>
                <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-bold dark:text-white">Pilot Access</h3>
                    <p className="text-sm text-slate-500">Perfect for teams validating AI workflows.</p>
                    <div className="flex items-baseline gap-1 mt-2 mb-4">
                        <span className="text-4xl font-black tracking-tight dark:text-white">$49</span>
                        <span className="text-sm font-medium text-slate-500">/user/mo</span>
                    </div>
                    <button className="w-full h-12 rounded-lg bg-primary hover:bg-blue-600 text-white font-bold transition-colors">
                        Apply for Pilot
                    </button>
                </div>
                <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-border-dark">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Includes</p>
                    <ul className="space-y-3">
                        {["Unlimited workflows", "SOC2 Compliance", "Zero-Data Retention", "Priority Support"].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm dark:text-slate-300">
                                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="flex flex-col gap-6 rounded-2xl border border-slate-200 dark:border-border-dark bg-white/50 dark:bg-card-dark/50 p-8 text-left">
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold dark:text-white text-slate-400">Standard</h3>
                        <span className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold px-2 py-1 rounded text-slate-500">Waitlist</span>
                    </div>
                    <p className="text-sm text-slate-500">For scaling operational efficiency.</p>
                    <div className="flex items-baseline gap-1 mt-2 mb-4">
                        <span className="text-4xl font-black tracking-tight text-slate-300 dark:text-slate-700">Coming</span>
                    </div>
                    <button className="w-full h-12 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-black font-bold hover:opacity-90 transition-opacity">
                        Join Waitlist
                    </button>
                </div>
                <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-border-dark">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-left">Includes</p>
                    <ul className="space-y-3 opacity-50">
                        {["Standard Integrations", "Team usage analytics", "Advanced data controls"].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm dark:text-slate-300">
                                <span className="material-symbols-outlined text-slate-400 text-[20px]">check</span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="flex flex-col gap-6 rounded-2xl border border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark p-8 text-left">
                <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-bold dark:text-white">Enterprise</h3>
                    <p className="text-sm text-slate-500">Custom security & deep integrations.</p>
                    <div className="flex items-baseline gap-1 mt-2 mb-4">
                        <span className="text-4xl font-black tracking-tight dark:text-white">Custom</span>
                    </div>
                    <button className="w-full h-12 rounded-lg border border-slate-300 dark:border-border-dark hover:bg-slate-50 dark:hover:bg-gray-800 font-bold transition-colors dark:text-white">
                        Contact Sales
                    </button>
                </div>
                <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-border-dark">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-left">Everything in Standard, plus:</p>
                    <ul className="space-y-3">
                        {["On-premise deployment", "Dedicated Success Manager", "Custom API connectors", "Custom SLA"].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm dark:text-slate-300">
                                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
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
                    <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                    <li><a href="#" className="hover:text-primary transition-colors">Integrations</a></li>
                    <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                    <li><a href="#" className="hover:text-primary transition-colors">Security</a></li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold mb-6 dark:text-white">Company</h4>
                <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                    <li><a href="#" className="hover:text-primary transition-colors">About</a></li>
                    <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
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

const App = () => {
    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark selection:bg-primary/30 selection:text-white overflow-x-hidden">
            <Navbar />
            <main className="flex flex-col items-center">
                <Hero />
                <Integrations />
                <Features />

                <UseCaseOdoo />

                {/* Product Showcase / Bento Grid Style from code.html */}
                <section className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex flex-col gap-4">
                            <div className="w-full aspect-[16/10] rounded-xl overflow-hidden border border-slate-200 dark:border-border-dark shadow-lg relative group">
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10"></div>
                                <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBC1Ya9XbsGZsUX1JdlkHNQA7a5aFFktmKAJQVMpYhLZEKz1hL89kn4l1vqUgFRItvuNzDungt-NumO3Y0DBZwyiZE9KgOX_WtjQ3ly72kr_sYK1IMOc5jTPoOj-hnQxaeTclSiAcchqFTXQ-dcXYybxkPz7HGyBXO1LshTviYgbIFX2YK1FQTgkTGeghJ13OJ0YI5tBwzZ6Ulxa5VEN6jKlTp7sXPxWWtwzPrNqWOEHcWUtVTeTt3Qn7xEYyHR-wj7NTGQfaCM9sg')" }}></div>
                                <div className="absolute bottom-6 left-6 z-20">
                                    <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded mb-2 inline-block uppercase">Interface</span>
                                    <h4 className="text-white text-xl font-bold">Intelligent Chat UI</h4>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Experience a modern, sleek chat interface that understands context and maintains conversation history.</p>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div className="w-full aspect-[16/10] rounded-xl overflow-hidden border border-slate-200 dark:border-border-dark shadow-lg relative group">
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10"></div>
                                <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD7vurpAkbZdTuKsv2a3np5iGml140UsKh5-U5R9spqypkae2ly7EmaRV3t4vdkEyapnCW_InmDy6BgHLUgKp0YD9IiaQF8OKmoNeAzI1X4RjXkDzhgonmHxetedbkqzmyQDQusRc-OehGRPmqhEfRJejao4Q5GRHY_03YbyPhcDJwfpGGw6kVeynRPCQkPc_6kQzwbShijDzm6SL83hAwzYdEu0PvutALFSrWWKax8jUZXVvdsG_oosptsKPSU5LB1G30GEPlvNYk')" }}></div>
                                <div className="absolute bottom-6 left-6 z-20">
                                    <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded mb-2 inline-block uppercase">Backend</span>
                                    <h4 className="text-white text-xl font-bold">Tool Execution Engine</h4>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Watch Donna autonomously navigate and update your business tools through secure API integrations.</p>
                        </div>
                    </div>
                </section>

                <Pricing />

                {/* Final CTA from code.html */}
                <section className="w-full py-24 px-4 bg-gradient-to-b from-transparent to-slate-100 dark:to-black/30 border-t border-slate-200 dark:border-border-dark">
                    <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-8">
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">Ready to automate the boring stuff?</h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
                            Join the waitlist today and get early access to the most advanced operational AI assistant on the market.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                            <button className="h-14 px-10 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-lg shadow-primary/30 transition-all transform hover:-translate-y-1">
                                Join Waitlist
                            </button>
                            <button className="h-14 px-10 rounded-lg bg-transparent border-2 border-slate-300 dark:border-border-dark text-slate-700 dark:text-white font-bold text-lg hover:bg-slate-100 dark:hover:bg-card-dark transition-all">
                                Talk to Sales
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
