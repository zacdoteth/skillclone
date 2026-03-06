import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Float, Clone } from '@react-three/drei';
import * as THREE from 'three';

// Nintendo-style idle states the cat cycles through
const IDLE_STATES = ['breathe', 'look_left', 'look_right', 'perk_up', 'sleepy', 'breathe'];
const IDLE_MIN_MS = 2500;
const IDLE_MAX_MS = 5000;

export default function CatMascot({ moduleCount = 0, showFusion = false }) {
  const { scene } = useGLTF('/cat.glb');
  const groupRef = useRef();
  const innerRef = useRef();

  // Compute bounding box to normalize scale
  const { scale, yOffset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    // Target height ~0.6 units (sits nicely on the table)
    const s = 0.6 / maxDim;
    const yOff = -box.min.y * s; // sit on the table surface
    return { scale: s, yOffset: yOff };
  }, [model]);

  // Idle state machine
  const [idleState, setIdleState] = useState('breathe');
  useEffect(() => {
    let timeout;
    const cycle = () => {
      const next = IDLE_STATES[Math.floor(Math.random() * IDLE_STATES.length)];
      setIdleState(next);
      timeout = setTimeout(cycle, IDLE_MIN_MS + Math.random() * (IDLE_MAX_MS - IDLE_MIN_MS));
    };
    timeout = setTimeout(cycle, IDLE_MIN_MS);
    return () => clearTimeout(timeout);
  }, []);

  // Smooth animation targets
  const targets = useRef({ rotY: 0, rotX: 0, scaleY: 1, posY: 0 });

  useFrame((state) => {
    if (!innerRef.current) return;
    const t = state.clock.elapsedTime;

    // === Compute targets based on idle state ===
    const tgt = targets.current;

    // Base breathing — gentle squash & stretch
    const breathe = Math.sin(t * 2.0) * 0.015;
    tgt.scaleY = 1 + breathe;

    switch (idleState) {
      case 'look_left':
        tgt.rotY = 0.35;
        tgt.rotX = -0.05;
        break;
      case 'look_right':
        tgt.rotY = -0.35;
        tgt.rotX = -0.05;
        break;
      case 'perk_up':
        tgt.rotY = Math.sin(t * 1.5) * 0.1;
        tgt.rotX = -0.15;
        tgt.scaleY = 1.03 + breathe;
        tgt.posY = 0.02;
        break;
      case 'sleepy':
        tgt.rotY = 0;
        tgt.rotX = 0.12;
        tgt.scaleY = 0.97 + breathe * 1.5;
        tgt.posY = -0.01;
        break;
      default: // breathe
        tgt.rotY = Math.sin(t * 0.8) * 0.05;
        tgt.rotX = 0;
        tgt.posY = 0;
        break;
    }

    // React to card selections — perk up!
    if (moduleCount > 0) {
      const excitement = Math.min(moduleCount / 10, 1);
      tgt.scaleY += excitement * 0.02;
      // Subtle tail-wag-like rotation
      tgt.rotY += Math.sin(t * 3 + moduleCount) * excitement * 0.08;
    }

    // Fusion reaction — big excited bounce
    if (showFusion) {
      tgt.scaleY = 1.06 + Math.sin(t * 6) * 0.04;
      tgt.posY = Math.abs(Math.sin(t * 4)) * 0.08;
      tgt.rotY = Math.sin(t * 5) * 0.2;
    }

    // === Smooth lerp to targets (Nintendo-smooth interpolation) ===
    const lerp = 0.08;
    const g = innerRef.current;
    g.rotation.y += (tgt.rotY - g.rotation.y) * lerp;
    g.rotation.x += (tgt.rotX - g.rotation.x) * lerp;
    g.position.y += (tgt.posY - g.position.y) * lerp;
    g.scale.y += (tgt.scaleY - g.scale.y) * lerp;

    // Subtle constant body sway — makes it feel alive
    g.position.x = Math.sin(t * 0.7) * 0.01;
  });

  return (
    <Float
      speed={1.2}
      rotationIntensity={0.05}
      floatIntensity={0.1}
    >
      <group
        ref={groupRef}
        position={[1.8, 0.16, -0.6]}
        rotation={[0, -0.4, 0]}
      >
        <group ref={innerRef} scale={[scale, scale, scale]} position={[0, yOffset, 0]}>
          <Clone object={scene} castShadow receiveShadow />
        </group>

        {/* Soft shadow blob under the cat */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <circleGeometry args={[0.25, 16]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.2} />
        </mesh>
      </group>
    </Float>
  );
}

// Preload the model
useGLTF.preload('/cat.glb');
