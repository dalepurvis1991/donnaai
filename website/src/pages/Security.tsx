import { Link } from 'wouter'

const Security = () => {
    return (
        <main className="flex flex-col items-center">
            <section className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 text-center">
                <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
                    <span className="material-symbols-outlined text-6xl text-primary mb-4">lock_person</span>
                    <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-slate-900 dark:text-white leading-tight">
                        Privacy by <span className="text-primary">design.</span>
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl">
                        Donna is built for professionals who cannot afford leaks or confusion.
                    </p>
                </div>
            </section>

            <section className="w-full max-w-[1024px] mx-auto px-4 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    {[
                        { title: "User-controlled access", desc: "You approve exactly what Donna can read and sync. No hidden background access." },
                        { title: "Batch processing", desc: "We sync small batches to build context without hammering API limits or exposing huge datasets." },
                        { title: "Human-in-the-loop", desc: "Donna never sends an email without your explicit approval. Drafts are just drafts until you hit send." },
                        { title: "Complete Auditability", desc: "Every task and draft links back to the source context, so you can always verify where it came from." }
                    ].map((item, i) => (
                        <div key={i} className="p-8 rounded-2xl bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark shadow-sm">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{item.title}</h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                        <span className="material-symbols-outlined text-9xl">shield</span>
                    </div>

                    <h2 className="text-3xl font-bold mb-8 relative z-10">Data Controls</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                        <div>
                            <h3 className="text-green-400 font-bold uppercase tracking-wider text-sm mb-4">What we store</h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-green-400 text-lg mt-0.5">check</span>
                                    <span className="text-slate-300">Email content needed to build context (summaries, entities)</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-green-400 text-lg mt-0.5">check</span>
                                    <span className="text-slate-300">Generated tasks and drafts</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-green-400 text-lg mt-0.5">check</span>
                                    <span className="text-slate-300">User preferences and project definitions</span>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-red-400 font-bold uppercase tracking-wider text-sm mb-4">What we don't do</h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-red-400 text-lg mt-0.5">close</span>
                                    <span className="text-slate-300">Train models on your customer data</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-red-400 text-lg mt-0.5">close</span>
                                    <span className="text-slate-300">Sell your data to third parties</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-red-400 text-lg mt-0.5">close</span>
                                    <span className="text-slate-300">Retain data after account deletion</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-slate-700 flex flex-col md:flex-row items-center justify-between gap-6">
                        <p className="text-slate-400 text-sm">
                            Account Deletion: If you delete your account, we wipe all stored content immediately from our active databases.
                        </p>
                        <Link href="/pricing">
                            <button className="px-6 py-3 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-100 transition-colors shrink-0">
                                Get Protected Access
                            </button>
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    )
}

export default Security
