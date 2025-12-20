import { Link } from 'wouter'

const About = () => (
    <main className="flex flex-col items-center">
        <section className="w-full max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white mb-8">
                Built for busy people.
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-12">
                Donna AI is designed around a simple belief: the best interface for work is the one you already use—conversation—backed by real context from where work actually happens: email.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left mb-16">
                <div className="p-8 bg-slate-50 dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-border-dark">
                    <h3 className="font-bold text-lg dark:text-white mb-2">Our Mission</h3>
                    <p className="text-slate-600 dark:text-slate-400">Reduce email-driven workload by turning conversations into action.</p>
                </div>
                <div className="p-8 bg-slate-50 dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-border-dark">
                    <h3 className="font-bold text-lg dark:text-white mb-2">Our Promise</h3>
                    <p className="text-slate-600 dark:text-slate-400">If it’s in your inbox, Donna will help you handle it.</p>
                </div>
            </div>

            <Link href="/product">
                <button className="px-8 py-4 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors">
                    See how it works
                </button>
            </Link>
        </section>
    </main>
)

export default About
