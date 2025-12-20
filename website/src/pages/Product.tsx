import { motion } from 'framer-motion'
import { Link } from 'wouter'

const ProductHero = () => (
    <section className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-slate-900 dark:text-white leading-tight">
                A personal assistant built for <span className="text-primary">email reality.</span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl">
                Donna doesn’t just chat—it turns messy threads into structured work.
            </p>
        </div>
    </section>
)

const FeatureSection = ({ title, desc, icon, items, align = 'left', step }: { title: string, desc: string, icon: string, items: string[], align?: 'left' | 'right', step: string }) => (
    <section className="w-full py-16 px-4">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className={`flex flex-col gap-6 ${align === 'right' ? 'lg:order-2' : ''}`}>
                <div className="flex items-center gap-4">
                    <span className="text-8xl font-black text-slate-100 dark:text-slate-800 leading-none absolute -z-10 select-none">
                        {step}
                    </span>
                    <div className="size-16 rounded-2xl bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark flex items-center justify-center shadow-lg">
                        <span className="material-symbols-outlined text-4xl text-primary">{icon}</span>
                    </div>
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-4">{title}</h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                    {desc}
                </p>
                <ul className="space-y-4 mt-2">
                    {items.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                            <span className="material-symbols-outlined text-primary text-xl mt-0.5">check_circle</span>
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className={`relative aspect-[4/3] rounded-2xl bg-slate-100 dark:bg-card-dark border border-slate-200 dark:border-border-dark overflow-hidden shadow-2xl ${align === 'right' ? 'lg:order-1' : ''}`}>
                {/* Visual Placeholder */}
                <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-700">
                    <div className="text-center">
                        <span className="material-symbols-outlined text-6xl mb-2">{icon}</span>
                        <p className="font-bold uppercase tracking-widest text-sm">Feature UI</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
)

const Product = () => {
    return (
        <main className="flex flex-col items-center overflow-hidden">
            <ProductHero />

            <FeatureSection
                step="01"
                title="Context Building"
                desc="Donna syncs emails in cycles (e.g., 200–500 at a time) to build a secure knowledge layer about your work."
                icon="mark_email_read"
                items={[
                    "Identifies key contacts and relationships",
                    "Groups projects and recurring topics",
                    "Tracks team delegations and follow-ups",
                    "Flags open loops and commitments"
                ]}
            />

            <FeatureSection
                step="02"
                align="right"
                title="Task Extraction"
                desc="Donna reads between the lines to highlight distinct action items from messy paragraphs."
                icon="checklist"
                items={[
                    "Highlights 'You need to...' and 'Can you...'",
                    "Captures 'Let’s do X by Friday'",
                    "Converts to tasks with owner and due date",
                    "Links every task back to the source email"
                ]}
            />

            <FeatureSection
                step="03"
                title="Smart Drafting"
                desc="Drafts emails that actually sound like you and move the work forward."
                icon="edit_note"
                items={[
                    "Responds to the thread accurately",
                    "Maintains a consistent professional tone",
                    "Includes next steps and confirmations",
                    "Reduces back-and-forth communication"
                ]}
            />

            <FeatureSection
                step="04"
                align="right"
                title="Meeting Transcripts"
                desc="Paste transcripts directly into chat to instantly turn talk into action."
                icon="voice_chat"
                items={[
                    "Extract action items from discussion",
                    "Draft follow-up emails to attendees",
                    "Summarise key decisions made",
                    "Log notes to project history"
                ]}
            />

            <section className="w-full py-32 px-4 text-center bg-slate-50 dark:bg-card-dark/30 border-t border-slate-200 dark:border-border-dark">
                <div className="max-w-3xl mx-auto flex flex-col items-center gap-8">
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white">Start with email. Expand later.</h2>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button className="h-14 px-10 rounded-full bg-primary hover:bg-primary-dark text-white font-bold text-lg transition-all shadow-xl">
                            Join the beta
                        </button>
                        <button className="h-14 px-10 rounded-full bg-white dark:bg-background-dark border border-slate-300 dark:border-border-dark text-slate-700 dark:text-white font-bold text-lg hover:bg-slate-50 transition-all">
                            Request a demo
                        </button>
                    </div>
                </div>
            </section>
        </main>
    )
}

export default Product
