const Pricing = () => {
    return (
        <main className="flex flex-col items-center">
            <section id="pricing" className="py-24 px-6 max-w-[1280px] mx-auto text-center">
                <div className="mb-16">
                    <h2 className="text-4xl md:text-5xl font-black mb-4 dark:text-white tracking-tight">Simple pricing for complex operations</h2>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">Join the Donna AI Pilot Program. Secure, private, and ready to work.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 text-left">
                    {/* Pilot Card */}
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

                    {/* Standard Card */}
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

                    {/* Enterprise Card */}
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

                {/* Comparison Table */}
                <div className="py-20 border-t border-slate-200 dark:border-border-dark text-left">
                    <h2 className="text-3xl font-black mb-12 dark:text-white text-center">Compare Features</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-border-dark">
                                    <th className="py-6 px-4 font-bold dark:text-white uppercase text-xs tracking-wider">Features</th>
                                    <th className="py-6 px-4 font-bold dark:text-white text-center">Pilot</th>
                                    <th className="py-6 px-4 font-bold text-slate-400 text-center">Standard</th>
                                    <th className="py-6 px-4 font-bold dark:text-white text-center">Enterprise</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-border-dark">
                                {[
                                    { name: "Workflow Execution", pilot: "Unlimited", standard: "Unlimited", enterprise: "Unlimited" },
                                    { name: "System Integrations", pilot: "5 included", standard: "20+ (Soon)", enterprise: "Custom" },
                                    { name: "Support Level", pilot: "Priority Email", standard: "Live Chat", enterprise: "Dedicated Slack" },
                                    { name: "SOC2 Compliance", pilot: "Included", standard: "Included", enterprise: "Included" },
                                    { name: "Data Retention", pilot: "Zero", standard: "Configurable", enterprise: "VPC/Local" }
                                ].map((row, i) => (
                                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="py-5 px-4 text-sm font-medium dark:text-slate-300">{row.name}</td>
                                        <td className="py-5 px-4 text-center text-sm dark:text-slate-400">{row.pilot}</td>
                                        <td className="py-5 px-4 text-center text-sm text-slate-300 dark:text-slate-600">{row.standard}</td>
                                        <td className="py-5 px-4 text-center text-sm dark:text-slate-400">{row.enterprise}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </main>
    )
}

export default Pricing
