import React from 'react';
import {
  LayoutDashboard,
  Activity,
  Box,
  Factory,
  CheckCircle2,
  AlertTriangle,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tabId: string) => void;
  faultCount?: number;
  overallStatus?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  faultCount = 0,
  overallStatus = 'Normal'
}) => {
  const navItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      description: 'Factory Overview',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'predictive',
      name: 'Predictive Analysis',
      description: 'Machine Health',
      icon: Activity,
      badge: faultCount > 0 ? `${faultCount} Alert` : null,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200'
    },
    {
      id: '3d-factory',
      name: '3D Factory Model',
      description: 'Virtual View',
      icon: Box,
      badge: 'Interactive',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      id: 'interactive-hero',
      name: 'Liquid Sculpture',
      description: 'GPU Particle Hero',
      icon: Sparkles,
      badge: 'WebGL2',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
    }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none shadow-sm">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200/90 gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Factory className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-slate-900 block">
              Manufacturing Digital Twin
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Smart Operations</span>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="p-4">
          <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Navigation
          </div>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <div className="text-left">
                      <div className="font-semibold text-xs leading-none">{item.name}</div>
                      <div className={`text-[10px] mt-0.5 ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                        {item.description}
                      </div>
                    </div>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                      isActive ? 'bg-white/20 text-white border-white/30' : item.badgeColor
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-slate-200/90 bg-slate-50">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 text-xs space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Factory Status
            </span>
            <span className={`flex items-center gap-1 font-semibold text-[11px] ${
              faultCount > 0 ? 'text-amber-700' : 'text-emerald-700'
            }`}>
              {faultCount > 0 ? (
                <>
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  <span>Needs Attention</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>Normal</span>
                </>
              )}
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            10 Production Machines Monitored
          </div>
        </div>
      </div>
    </aside>
  );
};
