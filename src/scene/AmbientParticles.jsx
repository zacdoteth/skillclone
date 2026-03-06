import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Violet/indigo dust motes — ported from Shed, recolored
export default function AmbientParticles({ count = 60 }) {
  const pointsRef = useRef();

  const { positions, speeds, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    const violet = new THREE.Color('#8b5cf6');
    const indigo = new THREE.Color('#818cf8');

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = Math.random() * 4 + 0.3;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      speeds[i] = 0.008 + Math.random() * 0.015;

      const c = Math.random() > 0.5 ? violet : indigo;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { positions, speeds, colors };
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) + speeds[i];
      let x = pos.getX(i) + Math.sin(t + i * 0.7) * 0.001;
      if (y > 5) {
        y = 0.3;
        x = (Math.random() - 0.5) * 8;
      }
      pos.setY(i, y);
      pos.setX(i, x);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        transparent
        opacity={0.3}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors
      />
    </points>
  );
}
