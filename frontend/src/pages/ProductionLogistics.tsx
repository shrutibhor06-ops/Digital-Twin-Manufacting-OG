import React, { useState } from 'react';
import {
  Truck,
  Package,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Search,
  Cpu
} from 'lucide-react';
import { ProductionOrder, Machine } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';

interface ProductionLogisticsProps {
  orders: ProductionOrder[];
  machines: Machine[];
  onSelectMachine: (machineId: string) => void;
}

export const ProductionLogistics: React.FC<ProductionLogisticsProps> = ({
  orders,
  machines,
  onSelectMachine
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    const matchesSearch =
      o.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.product.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Controls & Order Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-800/80 border border-slate-700/80">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-400" />
            <span>Production Orders & Material Logistics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Customer order fulfillment synchronized with OFacT bicycle world bill-of-materials
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search order, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 w-48"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg p-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            {['All', 'In Progress', 'Completed', 'Delayed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl bg-slate-800/80 border border-slate-700/80 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-700/80 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Active Order Book ({filteredOrders.length} orders)
          </span>
          <span className="text-xs font-mono text-slate-400">OFacT Agent-Assigned</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/60 text-slate-400 text-[11px]">
                <th className="py-3 px-4 font-semibold">Order ID</th>
                <th className="py-3 px-4 font-semibold">Customer / Client</th>
                <th className="py-3 px-4 font-semibold">Product Variant</th>
                <th className="py-3 px-4 font-semibold">Current Stage</th>
                <th className="py-3 px-4 font-semibold">Progress Units</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredOrders.map((ord) => {
                const pct = Math.round((ord.completed / ord.quantity) * 100);
                return (
                  <tr key={ord.order_id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-400">{ord.order_id}</td>
                    <td className="py-3.5 px-4 font-medium text-white">{ord.customer}</td>
                    <td className="py-3.5 px-4 text-slate-300">{ord.product}</td>
                    <td className="py-3.5 px-4 text-slate-300">{ord.stage}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-blue-500 h-full rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-slate-300">
                          {ord.completed}/{ord.quantity} ({pct}%)
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={ord.status} size="sm" showPulse={false} />
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                        ord.priority === 'High'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {ord.priority}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Workstation Resource Assignments Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span>Workstation Resource Allocation & Buffer Capacity</span>
          </h3>
          <span className="text-xs text-slate-400">Click to inspect workstation details</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {machines.map((m) => (
            <div
              key={m.machine_id}
              onClick={() => onSelectMachine(m.machine_id)}
              className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-blue-500/80 transition-all cursor-pointer flex items-start justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                    {m.machine_id}
                  </span>
                  <span className="text-xs font-semibold text-white">{m.name}</span>
                </div>
                <p className="text-xs text-slate-400">{m.role}</p>
                <div className="text-[11px] text-slate-500 pt-1">
                  OFacT Resource: <strong className="text-slate-300 font-mono">{m.ofact_ws}</strong> • Stage: <strong className="text-slate-300">{m.stage}</strong>
                </div>
              </div>
              <StatusBadge status={m.status} size="sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
