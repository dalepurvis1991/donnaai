import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

export default function ActivityAudit() {
    const [filter, setFilter] = useState("all");

    // Mock data matching the design
    const logs = [
        {
            id: "LOG-001",
            action: "Executed SQL Query",
            agent: "Donna (Database Agent)",
            timestamp: new Date(Date.now() - 2 * 60000), // 2 mins ago
            status: "success",
            reasoning: "User requested 'Top selling products in Q3'. Executed aggregation on `orders` table.",
            technical: "SELECT product_id, SUM(amount) FROM orders WHERE date > '2023-07-01' GROUP BY product_id...",
            resources: "DB: 14ms | CPU: 0.1%",
            confidence: 1.0
        },
        {
            id: "LOG-002",
            action: "Drafted Email Reply",
            agent: "Donna (Comms Agent)",
            timestamp: new Date(Date.now() - 15 * 60000), // 15 mins ago
            status: "pending",
            reasoning: "Received inquiry from 'TimberCo' matching 'Supplier' intent. Drafted response based on 'Negotiation Protocol v2'.",
            technical: "Model: GPT-4o | Tokens: 450 | Context: Recent Thread + Pricing Sheet",
            resources: "API: $0.02 | Latency: 1.2s",
            confidence: 0.85
        },
        {
            id: "LOG-003",
            action: "Training Job Failed",
            agent: "Donna (Vision Agent)",
            timestamp: new Date(Date.now() - 45 * 60000), // 45 mins ago
            status: "failure",
            reasoning: "Input dataset 'Rustic_Oak_Raw' contained 12 corrupted image files. Validation check blocked the training run.",
            technical: "Error: Unexpected EOF in .png decoder. Process exited with code 1.",
            resources: "GPU: 0s | Storage: 40MB read",
            confidence: 1.0
        },
        {
            id: "LOG-004",
            action: "Scheduled Meeting",
            agent: "Donna (Calendar Agent)",
            timestamp: new Date(Date.now() - 2 * 60 * 60000), // 2 hours ago
            status: "success",
            reasoning: "Found slot overlapping with 'Architecture Review' requested by Sarah. Sent invite for Tuesday 2PM.",
            technical: "Google Calendar API: POST /events/insert",
            resources: "API: 1 call",
            confidence: 0.98
        }
    ];

    return (
        <div className="w-full max-w-[1200px] mx-auto p-6 md:p-8 flex flex-col gap-8 pb-20 font-body">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h2 className="text-white text-4xl font-black leading-tight tracking-[-0.02em] font-display">Activity Audit Log</h2>
                <p className="text-[#92adc9] text-base font-normal">Transparent record of all autonomous actions, reasoning, and outcomes.</p>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card-dark border border-border-dark p-2 rounded-xl">
                <div className="flex bg-[#111a22] rounded-lg p-1">
                    <button
                        onClick={() => setFilter("all")}
                        className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${filter === 'all' ? 'bg-[#233648] text-white shadow-lg' : 'text-[#92adc9] hover:text-white'}`}
                    >
                        All Events
                    </button>
                    <button
                        onClick={() => setFilter("success")}
                        className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${filter === 'success' ? 'bg-emerald-500/20 text-emerald-400 shadow-lg' : 'text-[#92adc9] hover:text-white'}`}
                    >
                        Success
                    </button>
                    <button
                        onClick={() => setFilter("failure")}
                        className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${filter === 'failure' ? 'bg-red-500/20 text-red-400 shadow-lg' : 'text-[#92adc9] hover:text-white'}`}
                    >
                        Failures
                    </button>
                    <button
                        onClick={() => setFilter("pending")}
                        className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${filter === 'pending' ? 'bg-orange-500/20 text-orange-400 shadow-lg' : 'text-[#92adc9] hover:text-white'}`}
                    >
                        Pending
                    </button>
                </div>

                <div className="flex items-center gap-3 px-2">
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span className="text-[#92adc9] text-xs font-medium font-mono">Live Stream Active</span>
                    </div>
                    <div className="h-4 w-[1px] bg-border-dark mx-2"></div>
                    <input
                        type="text"
                        placeholder="Search logs..."
                        className="bg-[#111a22] border border-border-dark rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary w-48 transition-colors"
                    />
                </div>
            </div>

            {/* Log Stream */}
            <div className="flex flex-col gap-4 relative">
                <div className="absolute left-[27px] top-0 bottom-0 w-[1px] bg-[#233648] -z-10"></div>

                {logs.map((log) => (
                    <div key={log.id} className="group relative pl-16">
                        {/* Timeline Node */}
                        <div className={`absolute left-4 top-6 -translate-x-1/2 h-6 w-6 rounded-full border-[3px] bg-[#101922] z-10 box-content
                    ${log.status === 'success' ? 'border-emerald-500' :
                                log.status === 'failure' ? 'border-red-500' : 'border-orange-400'}`}>
                        </div>

                        <div className="bg-card-dark border border-border-dark rounded-xl p-5 hover:border-primary/30 transition-all shadow-glow-sm group-hover:bg-[#192633]">
                            <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-white text-base font-bold font-display">{log.action}</h3>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border
                                     ${log.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                log.status === 'failure' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                    'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                                            {log.status === 'failure' ? 'Failed' : log.status === 'pending' ? 'Human Review' : 'Verified'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[#92adc9] text-xs">
                                        <span>{log.id}</span>
                                        <span>•</span>
                                        <span className="text-primary font-medium">{log.agent}</span>
                                        <span>•</span>
                                        <span>{formatDistanceToNow(log.timestamp, { addSuffix: true })}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-xs font-bold text-[#55708c] uppercase tracking-wider">Confidence</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-bold font-mono ${log.confidence > 0.9 ? 'text-emerald-400' : log.confidence > 0.7 ? 'text-orange-400' : 'text-red-400'}`}>
                                            {(log.confidence * 100).toFixed(0)}%
                                        </span>
                                        {/* Confidence Bar */}
                                        <div className="w-16 h-1.5 bg-[#111a22] rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${log.confidence > 0.9 ? 'bg-emerald-500' : log.confidence > 0.7 ? 'bg-orange-400' : 'bg-red-500'}`}
                                                style={{ width: `${log.confidence * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 bg-[#111a22] rounded-lg p-4 border border-border-dark">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[#55708c] text-[10px] uppercase font-bold tracking-wider">Reasoning</span>
                                    <p className="text-[#bdcddc] text-sm font-medium">{log.reasoning}</p>
                                </div>
                                <div className="h-[1px] w-full bg-border-dark/50"></div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[#55708c] text-[10px] uppercase font-bold tracking-wider">Technical Details</span>
                                    <p className="text-[#92adc9] text-xs font-mono break-all">{log.technical}</p>
                                </div>
                                <div className="flex items-center gap-4 mt-1">
                                    <div className="flex items-center gap-1.5 text-[#55708c] text-[10px] font-mono border border-border-dark px-2 py-1 rounded bg-[#0d141c]">
                                        <span className="material-symbols-outlined text-[12px]">memory</span>
                                        {log.resources}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
