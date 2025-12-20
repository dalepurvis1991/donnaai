import { motion } from 'framer-motion'
import { Link } from 'wouter'

const Hero = () => (
    <section className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 text-center">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-8 max-w-4xl mx-auto"
        >
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                Your inbox, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">handled.</span>
            </h1>
            <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                Donna AI turns email threads into clear tasks, drafts replies in your voice, and keeps context—so you can move faster without dropping balls.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-4">
                <button className="h-14 px-8 rounded-full bg-primary hover:bg-primary-dark text-white font-bold text-lg transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 transform hover:-translate-y-1">
                    Join the beta
                </button>
                <Link href="/product">
                    <button className="h-14 px-8 rounded-full bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark text-slate-900 dark:text-white font-bold text-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                        See how it works
                    </button>
                </Link>
            </div>

            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide pt-8">
                Email-first V1 • No complex setup • Designed for busy people
            </p>
        </motion.div>
    </section>
)

const ProblemOutcome = () => (
    <section className="w-full bg-slate-50 dark:bg-card-dark/30 border-y border-slate-200 dark:border-border-dark py-24">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-16">
                Email isn’t work. <span className="text-slate-400">It’s where work arrives.</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { icon: "filter_list", title: "Extract tasks", desc: "Turns conversations into clear to-dos." },
                    { icon: "summarize", title: "Summarise threads", desc: "Turns long chains into 'what matters'." },
                    { icon: "edit_note", title: "Draft replies", desc: "Uses context you already have." },
                    { icon: "assignment_turned_in", title: "Track commitments", desc: "Ensures nothing slips through cracks." }
                ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-white dark:bg-card-dark border border-slate-100 dark:border-border-dark shadow-sm">
                        <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{item.title}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
)

const HowItWorks = () => (
    <section className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">How it works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-200 dark:bg-border-dark -z-10"></div>

            {[
                {
                    step: "01",
                    title: "Connect Email",
                    desc: "Donna syncs in batches (e.g., last 1,000 messages) to build context without hammering limits."
                },
                {
                    step: "02",
                    title: "Understand",
                    desc: "Donna identifies people, projects, decisions, and 'you said you’d…' moments."
                },
                {
                    step: "03",
                    title: "Execute",
                    desc: "Create tasks, propose next actions, and draft responses—right from chat."
                }
            ].map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center gap-6 bg-background-light dark:bg-background-dark">
                    <div className="size-16 rounded-2xl bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark shadow-lg flex items-center justify-center text-2xl font-black text-slate-900 dark:text-white z-10">
                        {step.step}
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{step.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">
                        {step.desc}
                    </p>
                </div>
            ))}
        </div>
    </section>
)

const Features = () => (
    <section className="w-full bg-slate-900 text-white py-24">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div>
                    <h2 className="text-3xl md:text-5xl font-black mb-8">Built for reality.</h2>
                    <div className="space-y-8">
                        {[
                            { title: "Inbox Intelligence", desc: "Thread summaries, priority cues, and next-action extraction." },
                            { title: "Task Capture", desc: "\"To-do\" detection, owners, due dates, and logical dependencies." },
                            { title: "Reply Drafting", desc: "Fast, context-aware email drafts. You always approve before sending." },
                            { title: "Context Memory", desc: "Learns your projects and working relationships from email history." },
                            { title: "Meeting Notes", desc: "Paste transcripts to extract actions. (Fathom integration later)." }
                        ].map((f, i) => (
                            <div key={i} className="flex gap-4">
                                <span className="material-symbols-outlined text-primary text-3xl mt-1">check</span>
                                <div>
                                    <h3 className="text-xl font-bold mb-1">{f.title}</h3>
                                    <p className="text-slate-400">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="relative aspect-square lg:aspect-[4/3] bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent"></div>
                    <div className="absolute inset-0 flex items-center justify-center p-8">
                        {/* Placeholder for Product UI Image */}
                        <div className="text-center text-slate-500">
                            <span className="material-symbols-outlined text-6xl mb-4">screenshot_monitor</span>
                            <p>Product UI Screenshot</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
)

const TargetAudience = () => (
    <section className="w-full py-24 px-4 text-center">
        <h2 className="text-2xl font-bold text-slate-500 uppercase tracking-widest mb-12">Who is Donna for?</h2>
        <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            {["Founders & Directors", "Ops & Admin Leads", "Sales Leaders", "High-Volume Inbox Users"].map((role, i) => (
                <div key={i} className="px-8 py-4 rounded-full bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark shadow-sm text-lg font-bold text-slate-900 dark:text-white">
                    {role}
                </div>
            ))}
        </div>
    </section>
)

const FAQ = () => (
    <section className="w-full max-w-[800px] mx-auto px-4 py-24 border-t border-slate-200 dark:border-border-dark">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-12 text-center">Common Questions</h2>
        <div className="space-y-8">
            {[
                { q: "Does Donna send emails automatically?", a: "Not by default—Donna drafts and you approve. You are always in control." },
                { q: "What does Donna read?", a: "Your synced email content, in controlled batches. You choose what’s in scope." },
                { q: "Can I add meeting notes?", a: "Yes—paste transcripts directly. Fathom integration later." }
            ].map((item, i) => (
                <div key={i} className="bg-slate-50 dark:bg-card-dark/50 p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{item.q}</h3>
                    <p className="text-slate-600 dark:text-slate-400">{item.a}</p>
                </div>
            ))}
        </div>
    </section>
)

const FinalCTA = () => (
    <section className="w-full py-32 px-4 text-center bg-primary text-white">
        <h2 className="text-4xl md:text-6xl font-black mb-8">Get hours back every week.</h2>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="h-14 px-10 rounded-full bg-white text-primary font-bold text-lg hover:bg-slate-100 transition-colors shadow-xl">
                Join the beta
            </button>
            <button className="h-14 px-10 rounded-full bg-primary-dark border border-white/20 text-white font-bold text-lg hover:bg-primary-dark/80 transition-colors">
                Request a demo
            </button>
        </div>
    </section>
)

const Home = () => {
    return (
        <main className="flex flex-col w-full">
            <Hero />
            <ProblemOutcome />
            <HowItWorks />
            <Features />
            <TargetAudience />
            <FAQ />
            <FinalCTA />
        </main>
    )
}

export default Home
