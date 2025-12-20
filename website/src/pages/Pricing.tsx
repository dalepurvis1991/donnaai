const Pricing = () => {
    return (
        <main className="flex flex-col items-center">
            <section className="py-24 px-6 max-w-[1280px] mx-auto text-center w-full">
                <div className="mb-16">
                    <h1 className="text-4xl md:text-5xl font-black mb-4 dark:text-white tracking-tight">Early Access Pricing</h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">Join the beta specifically designed for busy professionals.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
                    {/* Beta Card */}
                    <div className="relative flex flex-col gap-6 rounded-3xl border-2 border-primary bg-white dark:bg-card-dark p-8 shadow-2xl shadow-primary/10 transform hover:-translate-y-1 transition-all duration-300">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                            Limited Availability
                        </div>
                        <div className="flex flex-col gap-2">
                            <h3 className="text-2xl font-bold dark:text-white">Beta</h3>
                            <p className="text-sm text-slate-500">Access to all core features.</p>
                            <div className="flex items-baseline gap-1 mt-4 mb-4">
                                <span className="text-5xl font-black tracking-tight dark:text-white">£0</span>
                                <span className="text-base font-medium text-slate-500">/mo</span>
                            </div>
                            <button className="w-full h-14 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-lg transition-colors shadow-lg shadow-primary/25">
                                Join Beta
                            </button>
                        </div>
                        <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-border-dark">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Includes</p>
                            <ul className="space-y-3">
                                {["Email sync + summaries", "Task extraction", "Draft replies", "Transcript paste-in", "Priority support (limited)"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-base dark:text-slate-300">
                                        <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Pro Card */}
                    <div className="flex flex-col gap-6 rounded-3xl border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-card-dark/30 p-8 text-left opacity-80 hover:opacity-100 transition-opacity">
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-bold dark:text-white text-slate-500">Pro</h3>
                                <span className="bg-slate-200 dark:bg-slate-800 text-[10px] font-bold px-2 py-1 rounded text-slate-600">Coming Soon</span>
                            </div>
                            <p className="text-sm text-slate-500">For power users and teams.</p>
                            <div className="flex items-baseline gap-1 mt-4 mb-4">
                                <span className="text-5xl font-black tracking-tight text-slate-300 dark:text-slate-700">--</span>
                            </div>
                            <button className="w-full h-14 rounded-xl bg-white dark:bg-card-dark border border-slate-300 dark:border-border-dark text-slate-900 dark:text-white font-bold text-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                Join Waitlist
                            </button>
                        </div>
                        <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-border-dark">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-left">Planned Features</p>
                            <ul className="space-y-3 opacity-60">
                                {["Team workflows & delegation", "Advanced privacy controls", "More integrations coming after V1", "Custom SLA"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-base dark:text-slate-300">
                                        <span className="material-symbols-outlined text-slate-400 text-[20px]">add_circle</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <p className="mt-12 text-sm text-slate-500 max-w-lg mx-auto">
                    Note: We are onboarding users in batches to ensure system stability.
                    Adding your name to the list secures your spot in line.
                </p>
            </section>
        </main>
    )
}

export default Pricing
