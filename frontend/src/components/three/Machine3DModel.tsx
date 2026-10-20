import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Machine } from '../../types';

interface Machine3DModelProps {
  machine: Machine;
  isSelected: boolean;
  onSelect: (machineId: string) => void;
  showLabels: boolean;
}

export const Machine3DModel: React.FC<Machine3DModelProps> = ({
  machine,
  isSelected,
  onSelect,
  showLabels
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const beaconRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Determine beacon and body colors based on status
  let statusColor = '#10b981'; // Green (Running / Healthy)
  if (machine.status === 'Fault' || machine.condition === 'Critical') {
    statusColor = '#ef4444'; // Red
  } else if (machine.status === 'Maintenance' || machine.condition === 'Warning') {
    statusColor = '#f59e0b'; // Amber
  } else if (machine.status === 'Idle') {
    statusColor = '#64748b'; // Grey
  }

  // Animate beacon pulse for warning/fault
  useFrame((state) => {
    if (beaconRef.current) {
      if (machine.status === 'Fault' || machine.status === 'Maintenance') {
        const t = state.clock.getElapsedTime();
        beaconRef.current.scale.setScalar(1 + Math.sin(t * 5) * 0.15);
      } else {
        beaconRef.current.scale.setScalar(1.0);
      }
    }
  });

  const [x, y, z] = machine.pos_3d;

  return (
    <group
      ref={meshRef}
      position={[x, y, z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(machine.machine_id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      {/* Base Foundation / Pedestal */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.4, 2.6]} />
        <meshStandardMaterial
          color={isSelected ? '#1e3a8a' : (hovered ? '#334155' : '#1e293b')}
          roughness={0.7}
          metalness={0.4}
        />
      </mesh>

      {/* Main Machine Enclosure */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <boxGeometry args={[2.8, 2.0, 2.2]} />
        <meshStandardMaterial
          color={isSelected ? '#2563eb' : (hovered ? '#475569' : '#334155')}
          roughness={0.5}
          metalness={0.6}
        />
      </mesh>

      {/* Machining Window / Glass Shield */}
      <mesh position={[0, 1.5, 1.11]}>
        <planeGeometry args={[1.8, 1.2]} />
        <meshStandardMaterial
          color="#38bdf8"
          roughness={0.1}
          metalness={0.9}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Top Gantry / Tool Head */}
      <mesh position={[0, 2.6, 0]} castShadow>
        <boxGeometry args={[1.6, 0.4, 1.6]} />
        <meshStandardMaterial color="#0f172a" roughness={0.6} />
      </mesh>

      {/* Status Beacon Pillar */}
      <mesh position={[1.1, 2.7, 0.8]}>
        <cylinderGeometry args={[0.06, 0.06, 0.6, 12]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* Status Beacon Light (Emissive) */}
      <mesh ref={beaconRef} position={[1.1, 3.1, 0.8]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={1.8}
          roughness={0.2}
        />
      </mesh>

      {/* Selection Glow Ring */}
      {isSelected && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.8, 2.2, 32]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.6} />
        </mesh>
      )}

      {/* Floating 3D HTML Label */}
      {showLabels && (
        <Html position={[0, 3.6, 0]} center distanceFactor={14} zIndexRange={[10, 0]}>
          <div
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono whitespace-nowrap border shadow-lg transition-transform pointer-events-none select-none flex items-center gap-1.5 ${
              isSelected
                ? 'bg-blue-600 text-white border-blue-400 scale-110 font-bold'
                : 'bg-slate-900/90 text-slate-200 border-slate-700'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: statusColor }}
            />
            <span>{machine.machine_id}: {machine.name.split(' ')[0]}</span>
            <span className="text-[10px] opacity-75 font-sans">({machine.status})</span>
          </div>
        </Html>
      )}
    </group>
  );
};
