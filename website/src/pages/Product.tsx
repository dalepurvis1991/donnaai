const Product = () => {
    const steps = [
        {
            title: "Context Building",
            desc: "Donna syncs emails in cycles (e.g., 200–500 at a time) to build a secure knowledge layer about your work.",
            icon: "mark_email_read",
            items: [
                "Identifies key contacts and relationships",
                "Groups projects and recurring topics",
                "Tracks team delegations and follow-ups",
                "Flags open loops and commitments"
            ]
        },
        {
            title: "Task Extraction",
            desc: "Donna reads between the lines to highlight distinct action items from messy paragraphs.",
            icon: "checklist",
            items: [
                "Highlights 'You need to...' and 'Can you...'",
                "Captures 'Let’s do X by Friday'",
                "Converts to tasks with owner and due date",
                "Links every task back to the source email"
            ]
        },
        {
            title: "Smart Drafting",
            desc: "Drafts emails that actually sound like you and move the work forward.",
            icon: "edit_note",
            items: [
                "Responds to the thread accurately",
                "Maintains a consistent professional tone",
                "Includes next steps and confirmations",
                "Reduces back-and-forth communication"
            ]
        },
        {
            title: "Meeting Transcripts",
            desc: "Paste transcripts directly into chat to instantly turn talk into action.",
            icon: "voice_chat",
            items: [
                "Extract action items from discussion",
                "Draft follow-up emails to attendees",
                "Summarise key decisions made",
                "Log notes to project history"
            ]
        }
    ]

    return (
        <main className="flex flex-col items-center overflow-hidden">
            <section className="w-full max-w-[1200px] mx-auto px-4 lg:px-10 py-16 lg:py-24 text-center">
                <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border-dark bg-card-dark px-3 py-1">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        <span className="text-xs font-medium text-slate-400">A personal assistant built for email reality.</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-tight">
                        A personal assistant built for <span className="text-primary">email reality.</span>
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl">
                        Donna doesn’t just chat—it turns messy threads into structured work.
                    </p>
                </div>
            </section>

            <section className="relative pb-24 px-4 w-full">
                <div className="max-w-[960px] mx-auto">
                    <div className="absolute left-[32px] md:left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-border-dark to-transparent -translate-x-1/2 hidden md:block"></div>
                    <div className="space-y-16 relative">
                        {steps.map((step, index) => (
                            <div key={step.title} className="relative grid md:grid-cols-2 gap-8 md:gap-16 items-center">
                                <div className="absolute left-[0px] md:left-1/2 top-0 md:top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 bg-background-dark border border-border-dark rounded-full p-2 text-primary shadow-[0_0_15px_rgba(25,79,240,0.3)] hidden md:block">
                                    <span className="material-symbols-outlined">{step.icon}</span>
                                </div>
                                <div className={`${index % 2 === 1 ? 'md:order-2 md:pl-12' : 'md:text-right md:pr-12'} pt-2`}>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{index + 1}. {step.title}</h3>
                                    <p className="text-slate-600 dark:text-slate-400">{step.desc}</p>
                                </div>
                                <div className={`${index % 2 === 1 ? 'md:order-1 md:pr-12' : 'md:pl-12'}`}>
                                    <div className="glass-panel rounded-xl p-6 shadow-lg w-full max-w-md border border-white/5">
                                        <ul className="space-y-3">
                                            {step.items.map((item) => (
                                                <li key={item} className="flex items-start gap-3 text-slate-200 text-sm">
                                                    <span className="material-symbols-outlined text-primary text-base mt-0.5">check</span>
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="w-full py-24 px-4 text-center bg-slate-50 dark:bg-card-dark/30 border-t border-slate-200 dark:border-border-dark">
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
