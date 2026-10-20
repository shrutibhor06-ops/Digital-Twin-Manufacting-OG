import React, { useState, useEffect } from 'react';
import {
  X,
  Activity,
  AlertTriangle,
  Wrench,
  Gauge,
  Thermometer,
  Zap,
  ArrowRight,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { Machine, MachineDetailResponse } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { fetchMachineDetail, logMaintenanceAction } from '../../services/api';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface MachineDetailModalProps {
  machineId: string | null;
  onClose: () => void;
  onNavigateToPredictive: (machineId: string) => void;
  activeScenario: string;
}

export const MachineDetailModal: React.FC<MachineDetailModalProps> = ({
  machineId,
  onClose,
  onNavigateToPredictive,
  activeScenario
}) => {
  const [detail, setDetail] = useState<MachineDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!machineId) return;
    setLoading(true);
    fetchMachineDetail(machineId, activeScenario)
      .then((res) => setDetail(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [machineId, activeScenario]);

  if (!machineId) return null;

  const handleScheduleService = async () => {
    try {
      await logMaintenanceAction(
        machineId,
        'Routine Inspection & Calibration',
        'Floor Technician',
        'Logged via Manufacturing Digital Twin interface'
      );
      setActionSuccess('Inspection successfully scheduled and saved to database!');
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  const m = detail?.machine;

  return (
    <div className="fixed inset-y-0 right-0 z-[100] w-full sm:w-[480px] bg-white border-l border-slate-200/90 shadow-2xl flex flex-col justify-between overflow-y-auto">
      <div>
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                {machineId}
              </span>
              {m && <StatusBadge status={m.status} size="sm" />}
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {m ? m.name : 'Loading Machine Details...'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Production Stage: <span className="text-slate-800 font-medium">{m?.stage}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading machine information...
          </div>
        ) : m ? (
          <div className="p-6 space-y-6">
            {/* Machine Health Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Machine Health Index
                </span>
                <span className={`text-base font-bold ${
                  m.health_score > 75 ? 'text-emerald-700' : m.health_score > 40 ? 'text-amber-700' : 'text-rose-700'
                }`}>
                  {m.health_score} / 100
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    m.health_score > 75 ? 'bg-emerald-500' : m.health_score > 40 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${m.health_score}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div>
                  <div className="text-slate-500">Predicted Risk</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">
                    {Math.round(m.failure_risk * 100)}%
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Inspection Priority</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">
                    <StatusBadge status={m.maintenance_priority} size="sm" showPulse={false} />
                  </div>
                </div>
              </div>
            </div>

            {/* Current Machine Information (Sensors) */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Current Machine Information
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                    <span className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-blue-600" />
                      Vibration
                    </span>
                    <span className="text-[10px] text-slate-400">Normal: 2.5</span>
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {m.sensors.vibration} <span className="text-xs font-normal text-slate-500">mm/s</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                    <span className="flex items-center gap-1.5">
                      <Thermometer className="w-3.5 h-3.5 text-rose-600" />
                      Temperature
                    </span>
                    <span className="text-[10px] text-slate-400">Normal: 60°C</span>
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {m.sensors.temperature} <span className="text-xs font-normal text-slate-500">°C</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                    <span className="flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-cyan-600" />
                      Pressure
                    </span>
                    <span className="text-[10px] text-slate-400">Normal: 30 bar</span>
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {m.sensors.pressure} <span className="text-xs font-normal text-slate-500">bar</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-600" />
                      Power
                    </span>
                    <span className="text-[10px] text-slate-400">Normal: 100 kW</span>
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {m.sensors.power} <span className="text-xs font-normal text-slate-500">kW</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Condition & Suggested Action */}
            <div className={`p-4 rounded-xl border text-xs space-y-2 ${
              m.status === 'Fault' || m.status === 'Maintenance'
                ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Operational Status Note</span>
              </div>
              <p className="leading-relaxed text-slate-700">{m.warning}</p>
              <div className="pt-2 border-t border-slate-200">
                <span className="font-semibold text-slate-800">Suggested Action:</span> {m.recommended_action}
              </div>
            </div>

            {/* Historical Telemetry Chart */}
            {detail?.telemetry_history && detail.telemetry_history.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Recent Machine Readings (Vibration & Temperature)
                </h3>
                <div className="h-44 bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={detail.telemetry_history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="hour" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#cbd5e1',
                          borderRadius: '8px',
                          fontSize: '11px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Line type="monotone" dataKey="vibration" stroke="#2563eb" strokeWidth={2} dot={false} name="Vibration (mm/s)" />
                      <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={1.5} dot={false} name="Temp (°C)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-3">
        {actionSuccess && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={handleScheduleService}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-300 shadow-sm transition-all"
          >
            <Wrench className="w-3.5 h-3.5 text-amber-600" />
            <span>Schedule Inspection</span>
          </button>
          <button
            onClick={() => {
              onNavigateToPredictive(machineId);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <span>Health Prediction</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
