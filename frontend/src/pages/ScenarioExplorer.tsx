import React, { useState } from 'react';
import {
  Sliders,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Layers,
  TrendingUp,
  Cpu,
  ArrowRight
} from 'lucide-react';
import { Scenario, Machine } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';

interface ScenarioExplorerProps {
  scenarios: Scenario[];
  activeScenario: string;
  onRunScenario: (scenarioId: string) => Promise<void>;
  machines: Machine[];
  onSelectMachine: (machineId: string) => void;
}

export const ScenarioExplorer: React.FC<ScenarioExplorerProps> = ({
  scenarios,
  activeScenario,
  onRunScenario,
  machines,
  onSelectMachine
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(activeScenario);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runProgress, setRunProgress] = useState<number>(0);
  const [executionMessage, setExecutionMessage] = useState<string | null>(null);

  const selectedScenario =
    scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  const handleExecute = async () => {
    setIsRunning(true);
    setRunProgress(15);
    setExecutionMessage('Initializing OFacT discrete-event parameters...');

    await new Promise((r) => setTimeout(r, 600));
    setRunProgress(55);
    setExecutionMessage('Propagating material flow & updating scikit-learn predictions...');

    await new Promise((r) => setTimeout(r, 600));
    setRunProgress(90);
    setExecutionMessage('Synchronizing SQLite state model...');

    await onRunScenario(selectedScenarioId);
    setRunProgress(100);
    setExecutionMessage(`Scenario "${selectedScenario.name}" successfully active!`);
    setIsRunning(false);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-6 rounded-xl bg-slate-800/80 border border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            <span>Scenario Simulation & What-If Stress Testing</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Test shop floor resilience, material flow disruptions, and predictive equipment wear in virtual simulation before live execution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExecute}
            disabled={isRunning || selectedScenarioId === activeScenario}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Running Simulation...' : 'Execute Scenario'}</span>
          </button>
        </div>
      </div>

      {/* Execution Progress Bar */}
      {isRunning && (
        <div className="p-4 rounded-xl bg-slate-900 border border-blue-500/30 space-y-2">
          <div className="flex justify-between text-xs text-slate-300">
            <span>{executionMessage}</span>
            <span className="font-mono text-blue-400 font-bold">{runProgress}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${runProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Scenario Selection Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {scenarios.map((sc) => {
          const isCurrentActive = sc.id === activeScenario;
          const isCardSelected = sc.id === selectedScenarioId;

          return (
            <div
              key={sc.id}
              onClick={() => setSelectedScenarioId(sc.id)}
              className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                isCardSelected
                  ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-500/10'
                  : 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                    sc.type === 'Nominal'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : sc.type === 'Predictive Failure'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {sc.type}
                  </span>
                  {isCurrentActive && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-white tracking-tight">{sc.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{sc.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-700/60 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Target Throughput:</span>
                  <strong className="text-white font-mono">{sc.target_throughput}</strong>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Bottlenecks:</span>
                  <strong className="text-amber-400 truncate max-w-[140px] text-right" title={sc.active_bottlenecks}>
                    {sc.active_bottlenecks}
                  </strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Scenario Comparison Section */}
      {selectedScenario && (
        <div className="p-6 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Scenario Operational Impact Analysis: {selectedScenario.name}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Workstations and production stages affected relative to Baseline Nominal Shift
              </p>
            </div>
            <StatusBadge status={selectedScenario.is_active ? 'Running' : 'Queued'} size="sm" showPulse={false} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Throughput Impact</span>
              <div className="text-lg font-bold text-white">{selectedScenario.target_throughput}</div>
              <p className="text-xs text-slate-400">Simulated line capacity under current constraints</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Risk Profile</span>
              <div className="text-lg font-bold text-amber-400">{selectedScenario.risk_profile}</div>
              <p className="text-xs text-slate-400">Equipment fatigue probability evaluated by ML</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Primary Bottleneck</span>
              <div className="text-lg font-bold text-rose-400">{selectedScenario.active_bottlenecks}</div>
              <p className="text-xs text-slate-400">Constrained shop floor workstation</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
