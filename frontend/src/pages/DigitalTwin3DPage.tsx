import React from 'react';
import { Machine } from '../types';
import { FactoryScene } from '../components/three/FactoryScene';
import { Box } from 'lucide-react';

interface DigitalTwin3DPageProps {
  machines: Machine[];
  selectedMachineId: string | null;
  onSelectMachine: (machineId: string) => void;
  activeScenario: string;
}

export const DigitalTwin3DPage: React.FC<DigitalTwin3DPageProps> = ({
  machines,
  selectedMachineId,
  onSelectMachine,
  activeScenario
}) => {
  return (
    <div className="space-y-4 h-[calc(100vh-130px)] flex flex-col">
      {/* Clean Info Header */}
      <div className="flex items-center justify-between shrink-0 bg-white border border-slate-200/90 p-3.5 rounded-xl text-xs shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
            <Box className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm">
              Virtual Factory Model (3D Digital Twin)
            </div>
            <p className="text-slate-500 text-xs">
              Interactive 3D view showing workstations, material transfer lines, and current machine states
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 font-medium">
            10 Workstations Active
          </span>
        </div>
      </div>

      {/* 3D Scene Container */}
      <div className="flex-1 w-full rounded-xl overflow-hidden relative shadow-sm">
        <FactoryScene
          machines={machines}
          selectedMachineId={selectedMachineId}
          onSelectMachine={onSelectMachine}
        />
      </div>
    </div>
  );
};
