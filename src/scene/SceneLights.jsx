import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export default function SceneLights({ moduleCount = 0, quality = 'high' }) {
  const pointRef = useRef();

  // Orb light intensity scales with selection count
  useFrame(() => {
    if (pointRef.current) {
      const target = 0.5 + Math.min(moduleCount, 12) * 0.15;
      pointRef.current.intensity += (target - pointRef.current.intensity) * 0.05;
    }
  });

  return (
    <>
      {/* Hemisphere — cool blue sky, near-black ground */}
      <hemisphereLight args={['#1a1030', '#050510', 0.4]} />

      {/* Key light — warm white from above-right */}
      <directionalLight
        position={[3, 6, 2]}
        intensity={0.8}
        color="#fff5e6"
        castShadow={quality === 'high'}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />

      {/* Dealer orb underlight — purple-violet, intensity from moduleCount */}
      <pointLight
        ref={pointRef}
        position={[0, 0.8, -1]}
        color="#8b5cf6"
        intensity={0.5}
        distance={8}
        decay={2}
      />

      {/* Rim light from behind — subtle back edge */}
      <pointLight
        position={[0, 2, -4]}
        color="#4338ca"
        intensity={0.3}
        distance={10}
        decay={2}
      />

      {/* Ambient fill — very dim so shadows read */}
      <ambientLight intensity={0.08} color="#0f0520" />
    </>
  );
}
