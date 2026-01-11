import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

export default function Delegations() {
  const { user } = useAuth();

  // Feature Gating
  const isFree = user?.planType === 'free';

  // Fetch Delegations
  const { data: tasks, isLoading: tasksLoading } = useQuery<any>({
    queryKey: ["/api/tasks"],
    enabled: !isFree,
    refetchInterval: 10000,
  });

  // Fetch Activity Log
  const { data: audits, isLoading: auditsLoading } = useQuery<any>({
    queryKey: ["/api/audit-logs"],
    enabled: !isFree,
  });

  if (isFree) {
    return (
      <div className="w-full h-[80vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card-dark border border-border-dark rounded-xl p-8 text-center flex flex-col items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-primary/20 blur-[100px] rounded-full -mr-16 -mt-16 pointer-events-none"></div>

          <div className="h-16 w-16 bg-[#111a22] rounded-full flex items-center justify-center shadow-xl border border-border-dark relative z-10">
            <span className="material-symbols-outlined text-4xl text-primary">lock</span>
          </div>

          <div className="flex flex-col gap-2 relative z-10">
            <h2 className="text-white text-2xl font-bold font-display">Delegations are Pro-only</h2>
            <p className="text-[#92adc9] text-sm leading-relaxed">
              To assign delegations to Donna and track her progress as an agent, you need a subscription. The Free plan is limited to the Daily Brief.
            </p>
          </div>

          <a href="/settings" className="relative z-10 w-full px-6 py-3 bg-primary hover:bg-blue-600 text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
            Upgrade to Pro / Trial
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </a>
        </div>
      </div>
    );
  }

  // Map API data to UI format
  const delegations = tasks?.map((t: any) => ({
    id: t.id.toString(),
    name: t.title,
    assignee: t.assigneeId
      ? { name: "Team Member", initials: "TM", color: "bg-indigo-500" } // TODO: Fetch team member details
      : { name: "Donna (AI)", type: "ai", icon: "smart_toy", color: "bg-purple-500" },
    status: t.status === 'blocked' ? 'Blocked' : t.status === 'completed' ? 'Completed' : 'In Progress',
    insight: t.description ? t.description.substring(0, 30) + "..." : "Tracking progress",
    deadline: t.dueDate ? formatDistanceToNow(new Date(t.dueDate), { addSuffix: true }) : "No deadline",
    isBlocked: t.status === 'blocked',
    isOverdue: false // TODO: Calculate overdue
  })) || [];

  const activityLog = audits?.map((log: any) => ({
    type: log.action.toLowerCase().includes('block') ? 'block' : 'info',
    title: log.action,
    desc: log.details?.summary || log.entityId,
    time: formatDistanceToNow(new Date(log.createdAt), { addSuffix: true }),
    icon: log.action.toLowerCase().includes('block') ? 'error' : 'info',
    color: log.action.toLowerCase().includes('block') ? 'red-500' : 'primary'
  })) || [];


  return (
    <div className="w-full max-w-[1200px] mx-auto p-6 md:p-8 flex flex-col gap-8 pb-20 font-body">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-white text-4xl font-black leading-tight tracking-[-0.02em] font-display">Delegations by Donna</h2>
          <p className="text-[#92adc9] text-base font-normal">Project manager view of work coordinated by AI</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
            <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">Donna Active</span>
          </div>
          <button className="flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg shadow-blue-500/20">
            <span className="material-symbols-outlined text-[20px]">add_task</span>
            New Delegation
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2 rounded-xl p-6 border border-border-dark bg-card-dark relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-8xl text-primary">assignment</span>
          </div>
          <div className="flex items-center gap-2 text-[#92adc9] text-sm font-medium">
            <span className="material-symbols-outlined text-[18px]">pending_actions</span>
            Active Delegations
          </div>
          <div className="flex items-baseline gap-3">
            <p className="text-white text-3xl font-bold leading-tight font-display">{delegations.length}</p>
            <span className="text-[#92adc9] text-xs">Items in progress</span>
          </div>
          <div className="w-full bg-[#111a22] rounded-full h-1.5 mt-3">
            <div className="bg-primary h-1.5 rounded-full" style={{ width: "65%" }}></div>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-xl p-6 border border-red-900/30 bg-card-dark relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-8xl text-red-500">block</span>
          </div>
          <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
            <span className="material-symbols-outlined text-[18px]">block</span>
            Blocked Items
          </div>
          <div className="flex items-baseline gap-3">
            <p className="text-white text-3xl font-bold leading-tight font-display">{delegations.filter((t: any) => t.isBlocked).length}</p>
            <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-xs font-bold">Needs Attention</span>
          </div>
          <p className="text-[#92adc9] text-xs mt-2">Waiting on assets or approval</p>
        </div>

        <div className="flex flex-col gap-2 rounded-xl p-6 border border-orange-900/30 bg-card-dark relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-8xl text-orange-500">schedule</span>
          </div>
          <div className="flex items-center gap-2 text-orange-400 text-sm font-medium">
            <span className="material-symbols-outlined text-[18px]">history</span>
            Overdue Delegations
          </div>
          <div className="flex items-baseline gap-3">
            <p className="text-white text-3xl font-bold leading-tight font-display">0</p>
            <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 text-xs font-bold">Good Standing</span>
          </div>
          <p className="text-[#92adc9] text-xs mt-2">Exceeding estimated timeline</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Activity Log */}
        <div className="flex flex-col gap-8 lg:col-span-1">
          <section className="flex flex-col h-full">
            <h3 className="text-white text-lg font-bold leading-tight mb-4 flex items-center gap-2 font-display">
              <span className="material-symbols-outlined text-primary">psychology</span>
              Donna's Activity Log
            </h3>
            <div className="rounded-xl border border-border-dark bg-card-dark flex-1 p-4">
              <div className="flex flex-col gap-6 relative">
                <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-[#233648]"></div>
                {activityLog.length === 0 ? (
                  <div className="p-4 text-center text-[#556980] text-sm">No recent activity.</div>
                ) : (
                  activityLog.map((log: any, idx: number) => (
                    <div key={idx} className="flex gap-4 relative">
                      <div className={`z-10 h-10 w-10 rounded-full bg-[#111a22] border-2 flex items-center justify-center flex-shrink-0
                        ${log.color.includes('bg') ? '' : log.color === 'primary' ? 'border-primary text-primary' :
                          log.color === 'red-500' ? 'border-red-500 text-red-500' :
                            log.color === 'green-500' ? 'border-green-500 text-green-500' : 'border-border-dark text-[#92adc9]'}`}>
                        <span className="material-symbols-outlined text-lg">{log.icon}</span>
                      </div>
                      <div className="flex flex-col pt-1">
                        <p className="text-white text-sm font-medium">{log.title}</p>
                        <p className="text-[#92adc9] text-xs mt-0.5">{log.desc}</p>
                        <span className="text-[#55708c] text-[10px] mt-1">{log.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Delegated Tasks Table */}
        <div className="flex flex-col gap-8 lg:col-span-2">
          <section className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-bold leading-tight font-display">Active Delegations</h3>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-lg bg-[#1f2e3d] text-white text-xs font-bold border border-border-dark hover:border-primary/50 transition-colors">All Delegations</button>
              </div>
            </div>

            <div className="w-full overflow-hidden rounded-xl border border-border-dark bg-card-dark">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[#92adc9]">
                  <thead className="bg-[#111a22] text-xs uppercase font-bold text-white">
                    <tr>
                      <th className="px-6 py-4" scope="col">Delegation Name</th>
                      <th className="px-6 py-4" scope="col">Delegated To</th>
                      <th className="px-6 py-4 text-center" scope="col">Status</th>
                      <th className="px-6 py-4" scope="col">Donna's Insight</th>
                      <th className="px-6 py-4 text-right" scope="col">Deadline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-dark">
                    {delegations.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-[#556980]">
                          No active delegations found. Create a new delegation to get started.
                        </td>
                      </tr>
                    ) : (
                      delegations.map((task: any) => (
                        <tr key={task.id} className={`hover:bg-[#1f2e3d] transition-colors ${task.isBlocked ? 'bg-red-500/5' : ''}`}>
                          <td className="px-6 py-4 font-medium text-white">
                            <div className="flex flex-col">
                              <span>{task.name}</span>
                              <span className={`text-[10px] font-normal ${task.isBlocked ? 'text-red-400' : 'text-[#55708c]'}`}>ID: #{task.id}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`h-6 w-6 rounded-full ${task.assignee.color} flex items-center justify-center text-[10px] text-white font-bold`}>
                                {task.assignee.icon ? <span className="material-symbols-outlined text-[14px]">{task.assignee.icon}</span> : task.assignee.initials}
                              </div>
                              <span>{task.assignee.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {task.isBlocked ? (
                              <span className="inline-flex items-center rounded-md bg-red-400/10 px-2 py-1 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-400/20">Blocked</span>
                            ) : task.isOverdue ? (
                              <span className="inline-flex items-center rounded-md bg-orange-400/10 px-2 py-1 text-xs font-medium text-orange-400 ring-1 ring-inset ring-orange-400/20">Overdue</span>
                            ) : task.status === 'Reviewing' ? (
                              <span className="inline-flex items-center rounded-md bg-purple-400/10 px-2 py-1 text-xs font-medium text-purple-400 ring-1 ring-inset ring-purple-400/20">Reviewing</span>
                            ) : (
                              <span className="inline-flex items-center rounded-md bg-blue-400/10 px-2 py-1 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-400/20">{task.status}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs">
                            <span className={task.isBlocked ? 'text-red-300' : ''}>{task.insight}</span>
                          </td>
                          <td className={`px-6 py-4 text-right font-mono ${task.isOverdue ? 'text-orange-400' : 'text-white'}`}>
                            {task.deadline}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}