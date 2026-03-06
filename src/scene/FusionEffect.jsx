import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 3D fusion burst when fusing — energy lines + shockwave + particles
export default function FusionEffect({ active = false, quality = 'high' }) {
  const groupRef = useRef();
  const ringRef = useRef();
  const particlesRef = useRef();
  const progressRef = useRef(0);
  const [phase, setPhase] = useState('idle');

  const particleCount = quality === 'high' ? 200 : 60;

  // Particle data
  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0.8;
      positions[i * 3 + 2] = -1.2;
      // Random outward velocities
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 2 + Math.random() * 4;
      velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      velocities[i * 3 + 1] = Math.cos(phi) * speed * 0.5 + 1;
      velocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;
    }
    return { positions, velocities };
  }, [particleCount]);

  // Reset particles to center when effect activates
  useEffect(() => {
    if (active) {
      progressRef.current = 0;
      setPhase('gather');
      // Reset particle positions
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0.8;
        positions[i * 3 + 2] = -1.2;
      }
    } else {
      setPhase('idle');
    }
  }, [active, particleCount, positions]);

  useFrame((_, delta) => {
    if (!active || phase === 'idle') {
      if (groupRef.current) groupRef.current.visible = false;
      return;
    }

    if (groupRef.current) groupRef.current.visible = true;
    progressRef.current += delta;
    const t = progressRef.current;

    // Phase transitions
    if (t < 0.3) {
      // Gather phase — nothing visible yet, building energy
    } else if (t < 0.8) {
      setPhase('converge');
    } else if (t < 1.2) {
      if (phase !== 'fusion') setPhase('fusion');
    } else {
      if (phase !== 'reveal') setPhase('reveal');
    }

    // Shockwave ring
    if (ringRef.current) {
      if (t >= 0.8 && t < 1.5) {
        ringRef.current.visible = true;
        const rp = (t - 0.8) / 0.7; // 0→1 over 0.7s
        const scale = rp * 6;
        ringRef.current.scale.setScalar(scale);
        ringRef.current.material.opacity = (1 - rp) * 0.6;
      } else {
        ringRef.current.visible = false;
      }
    }

    // Particle burst — starts at fusion phase
    if (particlesRef.current && t >= 0.8) {
      const pos = particlesRef.current.geometry.attributes.position;
      const burstTime = t - 0.8;

      for (let i = 0; i < pos.count; i++) {
        const bx = velocities[i * 3] * burstTime * 0.5;
        const by = velocities[i * 3 + 1] * burstTime * 0.5 - burstTime * burstTime * 0.5;
        const bz = velocities[i * 3 + 2] * burstTime * 0.5;
        pos.setXYZ(i, bx, 0.8 + by, -1.2 + bz);
      }
      pos.needsUpdate = true;

      // Fade particles
      particlesRef.current.material.opacity = Math.max(0, 1 - burstTime * 1.2);
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Shockwave ring */}
      <mesh
        ref={ringRef}
        position={[0, 0.8, -1.2]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
      >
        <ringGeometry args={[0.8, 1, 32]} />
        <meshBasicMaterial
          color="#a78bfa"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Burst particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#c4b5fd"
          size={0.04}
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
