import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const ConveyorLine: React.FC = () => {
  const palletGroup1 = useRef<THREE.Group>(null);
  const palletGroup2 = useRef<THREE.Group>(null);

  // Animate moving parts along conveyor
  useFrame((_, delta) => {
    if (palletGroup1.current) {
      palletGroup1.current.children.forEach((child) => {
        child.position.x += delta * 2.0;
        if (child.position.x > 14) {
          child.position.x = -14;
        }
      });
    }
    if (palletGroup2.current) {
      palletGroup2.current.children.forEach((child) => {
        child.position.x -= delta * 2.0;
        if (child.position.x < -14) {
          child.position.x = 14;
        }
      });
    }
  });

  return (
    <group>
      {/* Conveyor Belt 1 (Forward flow, z = -4) */}
      <mesh position={[0, 0.4, -4]} receiveShadow>
        <boxGeometry args={[28, 0.15, 0.8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>
      {/* Conveyor Rails */}
      <mesh position={[0, 0.55, -4.45]}>
        <boxGeometry args={[28, 0.15, 0.08]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.55, -3.55]}>
        <boxGeometry args={[28, 0.15, 0.08]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} />
      </mesh>

      {/* Conveyor Belt 2 (Return/Assembly flow, z = +4) */}
      <mesh position={[0, 0.4, 4]} receiveShadow>
        <boxGeometry args={[28, 0.15, 0.8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.55, 3.55]}>
        <boxGeometry args={[28, 0.15, 0.08]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.55, 4.45]}>
        <boxGeometry args={[28, 0.15, 0.08]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} />
      </mesh>

      {/* Transfer Turn at East End (x = 14) */}
      <mesh position={[14, 0.4, 0]}>
        <boxGeometry args={[0.8, 0.15, 8.8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>

      {/* Moving Pallets on Belt 1 */}
      <group ref={palletGroup1}>
        {[-12, -7, -2, 3, 8, 13].map((initialX, i) => (
          <group key={`p1-${i}`} position={[initialX, 0.55, -4]}>
            <mesh castShadow>
              <boxGeometry args={[0.9, 0.15, 0.6]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
            </mesh>
            {/* Bicycle frame workpiece on pallet */}
            <mesh position={[0, 0.25, 0]}>
              <boxGeometry args={[0.7, 0.35, 0.1]} />
              <meshStandardMaterial color="#3b82f6" metalness={0.7} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Moving Pallets on Belt 2 */}
      <group ref={palletGroup2}>
        {[13, 8, 3, -2, -7, -12].map((initialX, i) => (
          <group key={`p2-${i}`} position={[initialX, 0.55, 4]}>
            <mesh castShadow>
              <boxGeometry args={[0.9, 0.15, 0.6]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
            </mesh>
            {/* Assembled bike on pallet */}
            <mesh position={[0, 0.35, 0]}>
              <boxGeometry args={[0.8, 0.45, 0.2]} />
              <meshStandardMaterial color="#10b981" metalness={0.6} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
};
