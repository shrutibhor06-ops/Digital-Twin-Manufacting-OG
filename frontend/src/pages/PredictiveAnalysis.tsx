import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Wrench,
  ShieldAlert,
  Info
} from 'lucide-react';
import { Machine, ExplainablePrediction } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { fetchExplainablePrediction } from '../services/api';

interface PredictiveAnalysisProps {
  machines: Machine[];
  selectedMachineId: string | null;
  onSelectMachine: (machineId: string) => void;
  activeScenario: string;
}

export const PredictiveAnalysis: React.FC<PredictiveAnalysisProps> = ({
  machines,
  selectedMachineId,
  onSelectMachine,
  activeScenario
}) => {
  const currentMachineId = selectedMachineId || (machines[0]?.machine_id ?? 'M05');
  const [explanation, setExplanation] = useState<ExplainablePrediction | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentMachineId) return;
    setLoading(true);
    fetchExplainablePrediction(currentMachineId, activeScenario)
      .then((res) => setExplanation(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [currentMachineId, activeScenario]);

  const selectedMachine = machines.find((m) => m.machine_id === currentMachineId) || machines[0];

  const highRiskCount = machines.filter((m) => m.maintenance_priority === 'High').length;
  const mediumRiskCount = machines.filter((m) => m.maintenance_priority === 'Medium').length;
  const lowRiskCount = machines.filter((m) => m.maintenance_priority === 'Low').length;

  return (
    <div className="space-y-6">
      {/* Top Summary Banner: Machines Requiring Attention */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Low Risk Machines
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{lowRiskCount}</div>
          <p className="text-xs text-slate-500">
            Operating smoothly within normal health limits. No action needed.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Medium Risk (Watchlist)
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{mediumRiskCount}</div>
          <p className="text-xs text-slate-500">
            Minor sensor drift observed. Inspection recommended on next shift break.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              High Risk (Needs Inspection)
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{highRiskCount}</div>
          <p className="text-xs text-slate-500">
            Significant wear patterns detected. Inspect equipment to prevent downtime.
          </p>
        </div>
      </div>

      {/* Machine Selector Buttons */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm space-y-2">
        <label className="text-xs font-semibold text-slate-700 block">
          Select Equipment to View Health Details:
        </label>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {machines.map((m) => {
            const isSelected = m.machine_id === currentMachineId;
            return (
              <button
                key={m.machine_id}
                onClick={() => onSelectMachine(m.machine_id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all flex items-center gap-2 shrink-0 ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="font-mono font-bold">{m.machine_id}</span>
                <span className="text-[11px] truncate max-w-[120px]">{m.name.split(' ')[0]}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    m.maintenance_priority === 'High'
                      ? 'bg-rose-400'
                      : m.maintenance_priority === 'Medium'
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Machine Health Card */}
      {selectedMachine && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Health Status Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm space-y-4 lg:col-span-1">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                  {selectedMachine.machine_id}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-2">
                  {selectedMachine.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedMachine.role}</p>
              </div>
              <StatusBadge status={selectedMachine.maintenance_priority} size="sm" showPulse={false} />
            </div>

            {/* Visual Risk Level Bar */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">Estimated Risk Level</span>
                <span className="font-bold text-slate-900">
                  {selectedMachine.maintenance_priority} Risk ({Math.round(selectedMachine.failure_risk * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    selectedMachine.failure_risk > 0.7
                      ? 'bg-rose-500'
                      : selectedMachine.failure_risk > 0.3
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.max(8, selectedMachine.failure_risk * 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                <span>Machine Health Score</span>
                <strong className="text-slate-800 font-semibold">{selectedMachine.health_score} / 100</strong>
              </div>
            </div>

            {/* Suggested Action */}
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-1.5 text-blue-900">
              <div className="flex items-center gap-1.5 font-semibold text-blue-800">
                <Wrench className="w-4 h-4 text-blue-600" />
                <span>Suggested Action</span>
              </div>
              <p className="leading-relaxed text-blue-950 font-medium">
                {selectedMachine.recommended_action}
              </p>
            </div>
          </div>

          {/* Plain-Language Explanation */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  <span>Why has this machine been flagged?</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comparison between current readings and normal operating ranges
                </p>
              </div>
            </div>

            {/* Simple table with understandable labels */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[11px]">
                    <th className="pb-3 font-semibold">Sensor Reading</th>
                    <th className="pb-3 font-semibold">Current Value</th>
                    <th className="pb-3 font-semibold">Normal Range</th>
                    <th className="pb-3 font-semibold">Condition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(explanation?.contributing_factors || []).map((factor, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 font-medium text-slate-900">{factor.feature}</td>
                      <td className="py-3 font-mono font-semibold text-slate-800">{factor.observed}</td>
                      <td className="py-3 font-mono text-slate-500">{factor.nominal}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            factor.impact.includes('Warning') || factor.impact.includes('Drift')
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : factor.impact.includes('High') || factor.impact.includes('Drop')
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {factor.impact.includes('Normal')
                            ? 'Normal'
                            : factor.impact.includes('High')
                            ? 'Higher than normal'
                            : 'Needs attention'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary explanation in simple words */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <span className="font-semibold text-slate-800 block">Summary Assessment:</span>
              <p className="leading-relaxed">
                {selectedMachine.warning}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Fleet Overview Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            All 10 Production Machines Overview
          </span>
          <span className="text-xs text-slate-500">Live Backend Health Evaluation</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[11px]">
                <th className="py-3 px-4 font-semibold">Machine</th>
                <th className="py-3 px-4 font-semibold">Stage</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Health Risk</th>
                <th className="py-3 px-4 font-semibold">Current Activity</th>
                <th className="py-3 px-4 font-semibold">Suggested Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {machines.map((m) => (
                <tr
                  key={m.machine_id}
                  onClick={() => onSelectMachine(m.machine_id)}
                  className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                    m.machine_id === currentMachineId ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <span className="font-mono text-blue-600 mr-1.5">{m.machine_id}</span>
                    {m.name}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{m.stage}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={m.status} size="sm" showPulse={false} />
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={m.maintenance_priority} size="sm" showPulse={false} />
                  </td>
                  <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={m.warning}>
                    {m.warning}
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {m.recommended_action}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
