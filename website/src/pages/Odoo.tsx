import { motion } from 'framer-motion'

const Hero = () => (
    <section className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 text-left">
        <div className="flex flex-col gap-6 max-w-4xl">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 w-fit"
            >
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                <span className="text-xs font-semibold text-primary uppercase tracking-wide">Odoo Integration Live</span>
            </motion.div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight dark:text-white">
                The AI Assistant that powers your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Odoo workflow.</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                Execute tasks, automate data entry, and find answers across Odoo modules instantly. Update leads, log notes, and schedule activities just by chatting.
            </p>
        </div>
    </section>
)

const UseCaseOdoo = () => (
    <section className="w-full px-4 md:px-10 lg:px-40 py-20 flex justify-center bg-slate-50 dark:bg-background-dark relative overflow-hidden text-left">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="max-w-[1280px] w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
            <div className="flex flex-col gap-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wide w-fit">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    New: Odoo 17 Support
                </div>
                <h2 className="text-3xl md:text-5xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
                    Seamless CRM & ERP Automation
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                    Donna connects to your Odoo instance via secure API. Data is retrieved, transformed, and prepared for your business modules without manual intervention.
                </p>
                <ul className="flex flex-col gap-3 mt-2">
                    {["Create leads from email summaries", "Log meeting notes via voice dictation", "Update deal stages with a single command", "Instant inventory lookups"].map((item, i) => (
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

const Odoo = () => {
    return (
        <main className="flex flex-col items-center">
            <Hero />
            <UseCaseOdoo />
            <section className="w-full py-24 px-4 bg-white dark:bg-card-dark border-t border-slate-200 dark:border-border-dark text-center">
                <h2 className="text-3xl font-black mb-8 dark:text-white">Ready to supercharge Odoo?</h2>
                <button className="h-14 px-10 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-lg shadow-primary/30 transition-all">
                    Get Started with Odoo
                </button>
            </section>
        </main>
    )
}

export default Odoo
