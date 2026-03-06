import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function CameraRig({ isMobile = false, active = true }) {
  const { camera } = useThree();
  const mouseRef = useRef({ x: 0, y: 0 });
  const smoothMouse = useRef({ x: 0, y: 0 });
  const introProgress = useRef(0);
  const hasEntered = useRef(false);

  // Target positions
  const desktopPos = new THREE.Vector3(0, 4, 6);
  const desktopTarget = new THREE.Vector3(0, 0, -1);
  const mobilePos = new THREE.Vector3(0, 5, 4);
  const mobileTarget = new THREE.Vector3(0, 0, -0.5);

  const basePos = isMobile ? mobilePos : desktopPos;
  const lookTarget = isMobile ? mobileTarget : desktopTarget;

  // Intro start position — high above
  const introPos = new THREE.Vector3(0, 10, 8);

  // Mouse tracking
  useEffect(() => {
    if (isMobile) return;
    const onMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [isMobile]);

  // Reset intro when becoming active
  useEffect(() => {
    if (active && !hasEntered.current) {
      introProgress.current = 0;
      hasEntered.current = true;
    }
  }, [active]);

  useFrame((_, delta) => {
    if (!active) return;

    // Intro sweep
    if (introProgress.current < 1) {
      introProgress.current = Math.min(introProgress.current + delta * 0.8, 1);
      const p = 1 - Math.pow(1 - introProgress.current, 3); // easeOutCubic
      camera.position.lerpVectors(introPos, basePos, p);
      camera.lookAt(lookTarget);
      return;
    }

    // Mouse parallax — lerped for smooth feel
    smoothMouse.current.x += (mouseRef.current.x - smoothMouse.current.x) * 0.05;
    smoothMouse.current.y += (mouseRef.current.y - smoothMouse.current.y) * 0.05;

    camera.position.x = basePos.x + smoothMouse.current.x * 0.15;
    camera.position.y = basePos.y + smoothMouse.current.y * 0.08;
    camera.position.z = basePos.z;
    camera.lookAt(lookTarget);
  });

  return null;
}
