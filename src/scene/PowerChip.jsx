import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

// Floating power counter chip on the table felt — uses Html overlay for text
export default function PowerChip({ totalPower = 0, moduleCount = 0 }) {
  const groupRef = useRef();
  const glowRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = 0.25 + Math.sin(state.clock.elapsedTime * 1.5) * 0.03;
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;

    if (glowRef.current) {
      const emissiveIntensity = 0.3 + Math.min(totalPower / 500, 1) * 0.7;
      glowRef.current.emissiveIntensity = emissiveIntensity;
    }
  });

  if (moduleCount === 0) return null;

  return (
    <group ref={groupRef} position={[0, 0.25, 0.5]}>
      {/* Chip base */}
      <mesh castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.06, 24]} />
        <meshStandardMaterial
          ref={glowRef}
          color="#1a1028"
          emissive="#8b5cf6"
          emissiveIntensity={0.3}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>

      {/* Chip rim ring */}
      <mesh>
        <torusGeometry args={[0.35, 0.02, 8, 24]} />
        <meshStandardMaterial
          color="#8b5cf6"
          emissive="#8b5cf6"
          emissiveIntensity={0.5}
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>

      {/* Text via HTML overlay — guaranteed to render */}
      <Html
        position={[0, 0.08, 0]}
        center
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div style={{
          textAlign: 'center',
          fontFamily: 'ui-monospace, monospace',
          whiteSpace: 'nowrap',
        }}>
          <div style={{ fontSize: '14px', fontWeight: 900, color: '#ec4899', textShadow: '0 0 8px rgba(236,72,153,0.5)' }}>
            {`\u26A1${totalPower}`}
          </div>
          <div style={{ fontSize: '8px', fontWeight: 700, color: '#a78bfa', letterSpacing: '1px' }}>
            {moduleCount} MINDS
          </div>
        </div>
      </Html>
    </group>
  );
}
