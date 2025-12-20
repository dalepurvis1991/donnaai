import { motion } from 'framer-motion'

const IntegrationCard = ({ name, desc, icon, active, comingSoon }: { name: string, desc: string, icon: string | JSX.Element, active?: boolean, comingSoon?: boolean }) => (
    <div className={`group flex flex-col justify-between p-6 bg-white dark:bg-card-dark border border-gray-200 dark:border-gray-800 rounded-xl hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-xl dark:hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden ${comingSoon ? 'opacity-80' : ''}`}>
        <div className="absolute -top-10 -right-10 size-20 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
        <div className="flex flex-col gap-4 relative z-10">
            <div className="flex justify-between items-start">
                <div className="size-14 rounded-xl bg-gray-50 dark:bg-white p-2.5 flex items-center justify-center border border-gray-100 dark:border-none shadow-sm overflow-hidden">
                    {typeof icon === 'string' ? (
                        <img src={icon} alt={name} className="w-full h-full object-contain" />
                    ) : (
                        icon
                    )}
                </div>
                {active && (
                    <span className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-500 text-xs font-semibold border border-green-500/20 flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-green-500 animate-pulse"></span> Active
                    </span>
                )}
                {comingSoon && (
                    <span className="px-2.5 py-1 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-semibold border border-gray-300 dark:border-gray-700">Coming Soon</span>
                )}
            </div>
            <div>
                <h3 className="text-gray-900 dark:text-white text-lg font-bold mb-1.5">{name}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
        </div>
        <div className="mt-6">
            {comingSoon ? (
                <button className="w-full py-2.5 px-4 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-500 font-medium text-sm transition-colors bg-transparent">
                    Notify me
                </button>
            ) : (
                <button className="w-full py-2.5 px-4 rounded-lg bg-primary hover:bg-blue-600 text-white font-semibold text-sm transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transform active:scale-95">
                    <span className="material-symbols-outlined text-[18px]">add</span> Connect
                </button>
            )}
        </div>
    </div>
)

const Integrations = () => {
    return (
        <main className="flex-1 flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-left">
            <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:px-12 lg:py-16 scroll-smooth">
                <div className="max-w-7xl mx-auto flex flex-col gap-10">
                    {/* Hero Section */}
                    <header className="flex flex-col gap-5">
                        <div className="inline-flex self-start items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-medium text-xs">
                            <span className="material-symbols-outlined text-[16px] fill">verified_user</span>
                            <span>SOC2 Compliant & End-to-End Encrypted</span>
                        </div>
                        <div className="flex flex-col gap-3">
                            <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                                Supercharge Donna <br className="hidden md:block" /> with Integrations
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl leading-relaxed">
                                Connect your workflow. Donna works securely with the tools you already use to automate operations and streamline communication.
                            </p>
                        </div>
                    </header>

                    {/* Grid Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        <IntegrationCard
                            name="Odoo"
                            desc="Sync contacts and manage operational workflows directly from your ERP."
                            icon="https://lh3.googleusercontent.com/aida-public/AB6AXuA-c3tEMsVzHqHvzkV7hvfP-3M8kQDlzEOt5qm-adWIu1xYBySHYzgE-CEC9JtMi0hWt9sEVuc4_zVr6VnQMLt-grP5ts9mpBFgwZTzYlpYx9Y26-X0fIBVAQq4GtK6sWL93zRHI3TLSERnfkrdWKpaCEXZxhTNuAid_bBEgwfb0B01T0PKLZePs7G-oo9XK7n6mb1hINsPh8SvCijx5rzRi8xlgCI96i0hrUy4h569gJltrPLYrQVEn2_vIpZFkdbhrSz5rTR8bR8"
                            active
                        />
                        <IntegrationCard
                            name="Gmail / IMAP"
                            desc="Draft responses and organize operational inboxes intelligently."
                            icon="https://lh3.googleusercontent.com/aida-public/AB6AXuBWxjDwtIT72NS7wR6lW86rGQw0twc4bXv7dAaKoJ7nOL1AJcMMQ-PlGPhzLACd8TCYjfgABqsLzRIRUzTnA_CjB0yvUYfb-Ap_nueKenAwAp1SCDQWHRnD7eYAFwQUuwdfrBZlRNDmOWpi-5Msa83OxAtv9vs22Y_JYsHhqlb7O1o_ZbK2eE7bOUtzpRte04AoZUEj6kqKxsP0VMijUCSGIevo-44piyQwK2n7dgoqPhOt9oa7tgqAt59orLYBAnUs9KdGRECG7q8"
                        />
                        <IntegrationCard
                            name="3CX"
                            desc="Log calls and transcribe voice data automatically for quality assurance."
                            icon={<div className="bg-blue-500 w-full h-full flex items-center justify-center text-white font-bold text-xs">3CX</div>}
                            comingSoon
                        />
                        <IntegrationCard
                            name="WhatsApp"
                            desc="Manage business messaging and automate replies securely."
                            icon={<span className="material-symbols-outlined text-[#25D366] text-[32px]">chat</span>}
                            comingSoon
                        />
                        <IntegrationCard
                            name="Slack"
                            desc="Receive notifications and interact with Donna directly in channels."
                            icon="https://lh3.googleusercontent.com/aida-public/AB6AXuC4T3mWooMPcpBNQ1gkRPavPoKCNcuxHrXkxPPysCX9AoysBo0G45_aSIyH_91T1I82cR4h21z2_iSmiYmDaFqIZRhUsD-z1kDh8D4wWJCXJ9gGQFbjHQuYcg7_HT0Ukz-MyB0-eEgUY5gT6GDrliHYXX7I1VzPt3aM-BWFWJRSLg_VWpX5FYGjfq8KGZdkn6TC2kywOK5S5GZ4NpppOEO4tDed5up2qrgLtyhBJ_C2MPMreHDmtM4A4A7iTtg9jyx-MZH6D6HMrKs"
                        />
                        <IntegrationCard
                            name="HubSpot"
                            desc="Centralize customer data and automate sales pipeline tasks."
                            icon={<span className="material-symbols-outlined text-[#ff7a59] text-[32px]">hub</span>}
                        />
                    </div>

                    {/* Request Integration CTA */}
                    <div className="mt-8 p-8 md:p-10 rounded-2xl bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-900 dark:to-surface-dark border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                        <div className="flex flex-col gap-2">
                            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Don't see your tool?</h2>
                            <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">Request a custom integration and we'll prioritize it on our roadmap.</p>
                        </div>
                        <button className="shrink-0 px-6 py-3 rounded-lg bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-900 dark:text-white font-semibold border border-gray-300 dark:border-white/10 transition-colors flex items-center gap-2 shadow-sm">
                            <span className="material-symbols-outlined">rocket_launch</span>
                            Request Integration
                        </button>
                    </div>
                </div>
            </div>
        </main>
    )
}

export default Integrations
