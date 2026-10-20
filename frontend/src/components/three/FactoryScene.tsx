import React, { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import { Machine } from '../../types';
import { Machine3DModel } from './Machine3DModel';
import { ConveyorLine } from './ConveyorLine';
import { FactoryFloor } from './FactoryFloor';
import { RotateCcw, Tag, Compass } from 'lucide-react';

interface FactorySceneProps {
  machines: Machine[];
  selectedMachineId: string | null;
  onSelectMachine: (machineId: string) => void;
}

export const FactoryScene: React.FC<FactorySceneProps> = ({
  machines,
  selectedMachineId,
  onSelectMachine
}) => {
  const [showLabels, setShowLabels] = useState(true);
  const controlsRef = useRef<OrbitControlsType>(null);

  // Reset Camera View
  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.object.position.set(0, 22, 26);
      controlsRef.current.update();
    }
  };

  // Zoom to selected machine
  useEffect(() => {
    if (selectedMachineId && controlsRef.current) {
      const selected = machines.find((m) => m.machine_id === selectedMachineId);
      if (selected) {
        const [x, y, z] = selected.pos_3d;
        controlsRef.current.target.set(x, y + 1.5, z);
        controlsRef.current.update();
      }
    }
  }, [selectedMachineId, machines]);

  return (
    <div className="relative isolate z-0 w-full h-full min-h-[520px] bg-slate-900 rounded-xl overflow-hidden border border-slate-200 shadow-md">
      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [0, 22, 26], fov: 42 }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={6}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2.05}
          target={[0, 0, 0]}
        />

        <FactoryFloor />
        <ConveyorLine />

        {/* 10 Workstation Machines */}
        {machines.map((machine) => (
          <Machine3DModel
            key={machine.machine_id}
            machine={machine}
            isSelected={machine.machine_id === selectedMachineId}
            onSelect={onSelectMachine}
            showLabels={showLabels}
          />
        ))}

        {/* Native Three.js Floor Grid */}
        <gridHelper args={[44, 28, '#64748b', '#334155']} position={[0, 0.01, 0]} />
      </Canvas>

      {/* Clean Floating 3D Control Bar (Top Left) */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/95 backdrop-blur border border-slate-200/90 p-1.5 rounded-lg shadow-md">
        <button
          onClick={handleResetCamera}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition-all"
          title="Reset Camera View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Camera</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-200" />

        <button
          onClick={() => setShowLabels(!showLabels)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            showLabels
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Toggle Labels"
        >
          <Tag className="w-3.5 h-3.5" />
          <span>{showLabels ? 'Hide Labels' : 'Show Labels'}</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-200" />

        <div className="flex items-center gap-1.5 text-xs text-slate-500 px-2">
          <Compass className="w-3.5 h-3.5 text-blue-600" />
          <span>Drag to Rotate • Scroll to Zoom</span>
        </div>
      </div>

      {/* Clean Status Legend (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur border border-slate-200/90 px-3.5 py-2.5 rounded-lg text-xs space-y-1.5 shadow-md">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Machine State Beacon
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Running</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Needs Attention</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Stopped</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span>Idle</span>
          </div>
        </div>
      </div>

      {/* Clean Interactive Hint (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-10 bg-white/95 backdrop-blur border border-slate-200/90 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 shadow-md">
        Click any machine to inspect readings
      </div>
    </div>
  );
};
