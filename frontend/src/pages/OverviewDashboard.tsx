import React from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Cpu,
  ChevronRight,
  Info,
  Clock,
  Wrench,
  Layers
} from 'lucide-react';
import { Machine, ProductionOverview, ProductionStageFlow } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { MetricCard } from '../components/ui/MetricCard';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface OverviewDashboardProps {
  machines: Machine[];
  overview: ProductionOverview | null;
  flowStages: ProductionStageFlow[];
  onSelectMachine: (machineId: string) => void;
  onNavigateToPredictive: (machineId: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  machines,
  overview,
  flowStages,
  onSelectMachine,
  onNavigateToPredictive
}) => {
  const summary = overview?.fleet_summary || {
    total_machines: machines.length,
    running: machines.filter((m) => m.status === 'Running').length,
    idle: machines.filter((m) => m.status === 'Idle').length,
    maintenance: machines.filter((m) => m.status === 'Maintenance').length,
    fault: machines.filter((m) => m.status === 'Fault').length,
    overall_oee_pct: 88.5
  };

  const progress = overview?.production_progress || {
    target_units: 160,
    completed_units: 98,
    completion_percentage: 61.2,
    active_orders_count: 4,
    completed_orders_count: 1
  };

  const attentionCount = summary.maintenance + summary.fault;
  const overallFactoryStatus =
    summary.fault > 0 ? 'Needs Attention' : summary.maintenance > 0 ? 'Warning' : 'Normal';

  // Production Activity Over Time (Simple and clear)
  const productionActivityData = [
    { time: '08:00', units: 12 },
    { time: '09:00', units: 15 },
    { time: '10:00', units: 14 },
    { time: '11:00', units: 11 },
    { time: '12:00', units: 9 },
    { time: '13:00', units: 14 },
    { time: '14:00', units: 16 },
    { time: '15:00', units: summary.fault > 0 ? 8 : 15 }
  ];

  // Plain-English Updates & Alerts
  const simpleAlerts = [];
  if (attentionCount > 0) {
    const attentionMachines = machines
      .filter((m) => m.status === 'Fault' || m.status === 'Maintenance')
      .map((m) => `${m.machine_id} (${m.name.split(' ')[0]})`);
    simpleAlerts.push({
      type: 'warning',
      title: 'Equipment Requires Attention',
      message: `${attentionMachines.join(', ')} is showing higher wear than normal. Inspection suggested before next shift.`
    });
  } else {
    simpleAlerts.push({
      type: 'success',
      title: 'All Machines Operating Normally',
      message: 'All 10 production workstations are running within normal parameters.'
    });
  }

  simpleAlerts.push({
    type: 'info',
    title: 'Production on Track',
    message: `${progress.completed_units} of ${progress.target_units} total planned units have been completed.`
  });

  if (summary.idle > 0) {
    simpleAlerts.push({
      type: 'neutral',
      title: 'Equipment Waiting',
      message: `${summary.idle} machine is currently idle waiting for materials from earlier stages.`
    });
  }

  return (
    <div className="space-y-6">
      {/* 4 Clean Top Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Overall Factory Status"
          value={overallFactoryStatus}
          subtitle={
            attentionCount > 0
              ? `${attentionCount} ${attentionCount === 1 ? 'machine requires' : 'machines require'} inspection`
              : 'All machines operating smoothly'
          }
          icon={overallFactoryStatus === 'Normal' ? CheckCircle2 : AlertTriangle}
          badge={overallFactoryStatus}
          badgeType={
            overallFactoryStatus === 'Normal'
              ? 'success'
              : overallFactoryStatus === 'Warning'
              ? 'warning'
              : 'danger'
          }
          color={
            overallFactoryStatus === 'Normal'
              ? 'emerald'
              : overallFactoryStatus === 'Warning'
              ? 'amber'
              : 'rose'
          }
        />

        <MetricCard
          title="Machine Status"
          value={`${summary.running} Running`}
          subtitle={`${summary.idle} Idle • ${attentionCount} Stopped/Needs Attention`}
          icon={Activity}
          badge={`${summary.total_machines} Total Machines`}
          badgeType="neutral"
          color="blue"
        />

        <MetricCard
          title="Production Progress"
          value={`${progress.completed_units} / ${progress.target_units}`}
          subtitle={`${progress.completion_percentage}% of target completed`}
          icon={TrendingUp}
          badge={`${progress.active_orders_count} In Progress`}
          badgeType="neutral"
          color="blue"
        />

        <MetricCard
          title="Equipment Attention"
          value={attentionCount > 0 ? `${attentionCount} Flagged` : '0 Flagged'}
          subtitle={
            attentionCount > 0
              ? 'Check Machine Health tab for details'
              : 'No equipment warnings detected'
          }
          icon={Wrench}
          badge={attentionCount > 0 ? 'Check Now' : 'Healthy'}
          badgeType={attentionCount > 0 ? 'warning' : 'success'}
          color={attentionCount > 0 ? 'amber' : 'emerald'}
        />
      </div>

      {/* Production Activity Chart & Important Updates (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simple Chart: Production Activity Over Time */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Production Activity Over Time
              </h2>
              <p className="text-xs text-slate-500">Units produced during each hour of the shift</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Shift Activity
            </span>
          </div>

          <div className="h-56 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productionActivityData}>
                <defs>
                  <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(val: number) => [`${val} Units`, 'Produced']}
                />
                <Area
                  type="monotone"
                  dataKey="units"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#blueGradient)"
                  name="Units Produced"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Short List of Important Updates */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Current Factory Updates
            </h2>
            <Info className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-3 pt-1">
            {simpleAlerts.map((alert, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-lg border text-xs space-y-1 ${
                  alert.type === 'warning'
                    ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                    : alert.type === 'success'
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="font-semibold flex items-center gap-1.5">
                  {alert.type === 'warning' ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  ) : alert.type === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  )}
                  <span>{alert.title}</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Production Flow Overview (Simple) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Production Line Flow
            </h2>
            <p className="text-xs text-slate-500">Material moves across 10 workstations from Intake to Final Dispatch</p>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
            Sequential Stages
          </span>
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="flex items-center gap-2 min-w-[850px]">
            {flowStages.map((stage, idx) => (
              <React.Fragment key={stage.id}>
                <div
                  onClick={() => onSelectMachine(stage.machine_id)}
                  className={`flex-1 p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${
                    stage.is_bottleneck
                      ? 'bg-amber-50 border-amber-300'
                      : stage.status === 'Fault'
                      ? 'bg-rose-50 border-rose-300'
                      : 'bg-slate-50/80 border-slate-200 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-mono font-bold text-blue-600">{stage.machine_id}</span>
                    <StatusBadge status={stage.status} size="sm" showPulse={false} />
                  </div>
                  <div className="text-xs font-semibold text-slate-800 truncate" title={stage.title}>
                    {stage.title}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {stage.is_bottleneck ? (
                      <span className="font-semibold text-amber-700">Needs Attention</span>
                    ) : (
                      <span>Normal Flow</span>
                    )}
                  </div>
                </div>
                {idx < flowStages.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Machine Overview Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Machine Status Overview
            </h2>
            <p className="text-xs text-slate-500">Click any machine card to view detailed readings and history</p>
          </div>
          <span className="text-xs text-slate-400">10 Machines</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {machines.map((m) => (
            <div
              key={m.machine_id}
              onClick={() => onSelectMachine(m.machine_id)}
              className="bg-white p-4 rounded-xl border border-slate-200/90 hover:border-blue-500/80 hover:shadow-md transition-all cursor-pointer space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                    {m.machine_id}
                  </span>
                  <div className="text-xs font-semibold text-slate-900 mt-1.5 line-clamp-1" title={m.name}>
                    {m.name}
                  </div>
                </div>
                <StatusBadge status={m.status} size="sm" />
              </div>

              {/* Simple Health Indicator */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-500">Machine Health</span>
                  <span className="font-bold text-slate-700">{m.health_score}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      m.health_score > 75
                        ? 'bg-emerald-500'
                        : m.health_score > 40
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${m.health_score}%` }}
                  />
                </div>
              </div>

              {/* Simple plain-English status text */}
              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                {m.warning}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
