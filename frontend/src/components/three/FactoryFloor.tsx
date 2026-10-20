import React from 'react';

export const FactoryFloor: React.FC = () => {
  return (
    <group>
      {/* Light Clean Factory Concrete Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[44, 28]} />
        <meshStandardMaterial
          color="#334155"
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>

      {/* Safety Workstation Boundary Markings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, -4]}>
        <ringGeometry args={[15.5, 15.7, 4]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.6} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 4]}>
        <ringGeometry args={[15.5, 15.7, 4]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.6} />
      </mesh>

      {/* Center Pathway */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <planeGeometry args={[36, 1.2]} />
        <meshBasicMaterial color="#475569" transparent opacity={0.6} />
      </mesh>

      {/* Lighting Rig for optimal visibility */}
      <ambientLight intensity={0.9} />
      <directionalLight
        position={[15, 25, 15]}
        intensity={1.3}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-15, 20, -15]} intensity={0.6} color="#bfdbfe" />
      <pointLight position={[0, 12, 0]} intensity={0.8} color="#ffffff" distance={35} />
    </group>
  );
};
