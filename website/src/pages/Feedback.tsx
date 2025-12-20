import { useState } from 'react'

const RoadmapColumn = ({ status, items, color }: { status: string, items: string[], color: string }) => (
    <div className="flex flex-col gap-4">
        <h3 className={`font-bold uppercase tracking-wider text-xs ${color} flex items-center gap-2`}>
            <span className={`size-2 rounded-full ${color.replace('text-', 'bg-')}`}></span>
            {status}
        </h3>
        <div className="space-y-3">
            {items.map((item, i) => (
                <div key={i} className="bg-white dark:bg-card-dark p-4 rounded-xl border border-slate-200 dark:border-border-dark shadow-sm text-sm text-slate-700 dark:text-slate-300">
                    {item}
                </div>
            ))}
        </div>
    </div>
)

const Feedback = () => {
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitted(true)
        setTimeout(() => setSubmitted(false), 3000)
    }

    return (
        <main className="flex flex-col items-center">
            <section className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 text-center">
                <div className="max-w-3xl mx-auto flex flex-col items-center gap-6">
                    <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white leading-tight">
                        Suggest an improvement
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl">
                        Your feedback shapes Donna. Tell us what you want—Donna will convert it into a clear feature request.
                    </p>
                </div>
            </section>

            <section className="w-full max-w-[800px] mx-auto px-4 pb-24">
                <form onSubmit={handleSubmit} className="bg-white dark:bg-card-dark p-8 rounded-3xl border border-slate-200 dark:border-border-dark shadow-xl mb-24">
                    {submitted ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                            <div className="size-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-3xl">check</span>
                            </div>
                            <h3 className="text-xl font-bold dark:text-white">Feedback Received!</h3>
                            <p className="text-slate-500">Thanks for helping us make Donna better.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">Describe what you want</label>
                                <textarea className="w-full h-32 p-4 rounded-xl bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-border-dark focus:ring-2 focus:ring-primary outline-none transition-all resize-none dark:text-white" placeholder="I wish Donna could automatically categorize my newsletters..."></textarea>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">What should Donna do?</label>
                                    <input type="text" className="w-full p-4 rounded-xl bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-border-dark focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white" placeholder="e.g. Move to 'Read later' folder" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">System Involved</label>
                                    <select className="w-full p-4 rounded-xl bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-border-dark focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white appearance-none">
                                        <option>Email</option>
                                        <option>Tasks</option>
                                        <option>Calendar</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">Urgency:</span>
                                {['Nice to have', 'Important', 'Critical'].map((level) => (
                                    <label key={level} className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="urgency" className="text-primary focus:ring-primary" />
                                        <span className="text-sm text-slate-600 dark:text-slate-400">{level}</span>
                                    </label>
                                ))}
                            </div>

                            <button type="submit" className="w-full h-14 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 mt-4">
                                Submit Suggestion
                            </button>
                        </div>
                    )}
                </form>

                <div className="w-full border-t border-slate-200 dark:border-border-dark pt-16">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white text-center mb-12">Public Roadmap</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <RoadmapColumn
                            status="Building"
                            color="text-blue-500"
                            items={["Gmail API Integration (v2)", "Calendar checking", "Draft tone adjustment"]}
                        />
                        <RoadmapColumn
                            status="Planned"
                            color="text-purple-500"
                            items={["Outlook Integration", "Slack Connector", "Daily briefing summary"]}
                        />
                        <RoadmapColumn
                            status="Under Review"
                            color="text-yellow-500"
                            items={["Mobile app", "Voice commands", "CRM syncing"]}
                        />
                        <RoadmapColumn
                            status="Shipped"
                            color="text-green-500"
                            items={["Email context building", "Basic task extraction", "Reply drafting"]}
                        />
                    </div>
                </div>
            </section>
        </main>
    )
}

export default Feedback
