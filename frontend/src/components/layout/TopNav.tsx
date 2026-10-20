import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Clock,
  Layers
} from 'lucide-react';
import { Scenario } from '../../types';

interface TopNavProps {
  currentTab: string;
  activeScenario: string;
  scenarios: Scenario[];
  onSelectScenario: (scenarioId: string) => void;
  backendOnline: boolean;
  lastUpdated: string | null;
  onRefresh: () => void;
  isLoading: boolean;
  selectedMachineId?: string | null;
}

const tabTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Operations Dashboard',
    subtitle: 'High-level overview of factory activity, machine status, and production output'
  },
  predictive: {
    title: 'Machine Health Prediction',
    subtitle: 'Anticipate potential equipment wear and inspection needs before disruptions occur'
  },
  '3d-factory': {
    title: '3D Factory Model',
    subtitle: 'Interactive virtual view of factory workstations, material flow, and equipment status'
  },
  'interactive-hero': {
    title: 'Interactive Liquid Sculpture Hero',
    subtitle: 'GPU-accelerated WebGL2 particle simulation with real-time fluid dynamics'
  }
};

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  activeScenario,
  scenarios,
  onSelectScenario,
  backendOnline,
  lastUpdated,
  onRefresh,
  isLoading,
  selectedMachineId
}) => {
  const currentInfo = tabTitles[currentTab] || tabTitles.dashboard;

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 sticky top-0 z-30 px-6 flex items-center justify-between shadow-sm">
      {/* Title & Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-medium text-slate-500">Manufacturing Digital Twin</span>
          <span>/</span>
          <span className="text-blue-600 font-semibold">{currentInfo.title}</span>
          {selectedMachineId && currentTab !== 'interactive-hero' && (
            <>
              <span>/</span>
              <span className="text-slate-800 font-mono font-bold">{selectedMachineId}</span>
            </>
          )}
        </div>
        <h1 className="text-sm font-bold text-slate-900 tracking-tight">
          {currentInfo.title}
        </h1>
      </div>

      {/* Control Actions & Status */}
      <div className="flex items-center gap-3">
        {/* Scenario / Shift Selector */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 font-medium">Scenario:</span>
          <select
            value={activeScenario}
            onChange={(e) => onSelectScenario(e.target.value)}
            disabled={isLoading}
            className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer pr-1"
          >
            {scenarios.length > 0 ? (
              scenarios.map((sc) => (
                <option key={sc.id} value={sc.id} className="bg-white text-slate-800">
                  {sc.name}
                </option>
              ))
            ) : (
              <option value="Baseline_Shift" className="bg-white text-slate-800">
                Baseline Nominal Shift
              </option>
            )}
          </select>
        </div>

        {/* Backend Status Indicator */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border font-medium ${
          backendOnline
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}>
          {backendOnline ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Connected</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Disconnected</span>
            </>
          )}
        </div>

        {/* Last Updated Timestamp */}
        {lastUpdated && (
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{new Date(lastUpdated).toLocaleTimeString()}</span>
          </div>
        )}

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh Data"
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>
    </header>
  );
};
