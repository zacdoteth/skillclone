import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

// Anadol orb shader ported to 3D sphere
const ORB_VERT = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
uniform float uTime;
uniform float uPower;

// Simple noise for displacement
vec2 hash(vec2 p){
  p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}
float gnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(
    mix(dot(hash(i),f), dot(hash(i+vec2(1,0)),f-vec2(1,0)), u.x),
    mix(dot(hash(i+vec2(0,1)),f-vec2(0,1)), dot(hash(i+vec2(1,1)),f-vec2(1,1)), u.x),
    u.y
  );
}

void main() {
  vUv = uv;
  vNormal = normal;
  vPosition = position;

  // Subtle noise displacement on sphere surface
  float disp = gnoise(uv * 4.0 + uTime * 0.3) * 0.05 * (1.0 + uPower * 0.5);
  vec3 pos = position + normal * disp;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const ORB_FRAG = `
precision highp float;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

uniform float uTime;
uniform float uPower;
uniform float uCount;
uniform float uFusing;

// ─── Noise functions (from AnadolShader) ───
vec2 hash(vec2 p){
  p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}
float gnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(
    mix(dot(hash(i),f), dot(hash(i+vec2(1,0)),f-vec2(1,0)), u.x),
    mix(dot(hash(i+vec2(0,1)),f-vec2(0,1)), dot(hash(i+vec2(1,1)),f-vec2(1,1)), u.x),
    u.y
  );
}

const mat2 ROT = mat2(0.80, 0.60, -0.60, 0.80);

float fbm(vec2 p){
  float f = 0.0;
  f += 0.5000 * gnoise(p); p = ROT * p * 2.02;
  f += 0.2500 * gnoise(p); p = ROT * p * 2.03;
  f += 0.1250 * gnoise(p); p = ROT * p * 2.01;
  f += 0.0625 * gnoise(p); p = ROT * p * 2.04;
  f += 0.0312 * gnoise(p);
  return f / 0.9687;
}

float rfbm(vec2 p){
  float f = 0.0;
  f += 0.5000 * abs(gnoise(p)); p = ROT * p * 2.02;
  f += 0.2500 * abs(gnoise(p)); p = ROT * p * 2.03;
  f += 0.1250 * abs(gnoise(p)); p = ROT * p * 2.01;
  f += 0.0625 * abs(gnoise(p));
  return f / 0.9375;
}

void main() {
  // Spherical UVs for domain warping
  vec2 p = vUv * 3.0 - 1.5;

  // Speed increases with count
  float speed = 0.035 + uCount * 0.003;
  float t = uTime * speed;

  // ─── Domain warping — the Anadol signature ───
  vec2 q = vec2(
    fbm(p + vec2(0.0, 0.0) + t),
    fbm(p + vec2(5.2, 1.3) + t * 0.8)
  );
  vec2 r = vec2(
    fbm(p + 4.0 * q + vec2(1.7, 9.2) + t * 0.5),
    fbm(p + 4.0 * q + vec2(8.3, 2.8) + t * 0.4)
  );
  vec2 s = vec2(
    fbm(p + 3.0 * r + vec2(3.1, 7.4) + t * 0.25),
    fbm(p + 3.0 * r + vec2(6.7, 4.2) + t * 0.3)
  );

  float f = fbm(p + 3.5 * s);
  float f2 = fbm(p + 3.0 * r + vec2(2.1, 4.7) + t * 0.15);
  float rm = length(r);
  float sm = length(s);

  // ─── Color mapping — purple/violet/cyan palette ───
  float intensity = 0.8 + uPower * 0.4;

  // Base void
  vec3 col = vec3(0.04, 0.015, 0.08);

  // Purple nebula
  col += vec3(0.28, 0.08, 0.50) * smoothstep(-0.1, 0.5, f) * 0.8 * intensity;

  // Electric blue veins
  col += vec3(0.10, 0.28, 0.65) * smoothstep(0.2, 0.6, f2) * 0.5 * intensity;

  // Cyan luminescence
  col += vec3(0.20, 0.55, 0.80) * smoothstep(0.5, 0.85, f) * 0.3 * intensity;

  // Pink accent
  col += vec3(0.45, 0.10, 0.35) * smoothstep(0.3, 0.7, rm) * 0.25 * intensity;

  // Flow streams
  float st1 = smoothstep(0.48, 0.5, sin(f * 22.0 + uTime * 3.0));
  col += vec3(0.35, 0.18, 0.55) * st1 * 0.2;

  float st2 = smoothstep(0.48, 0.5, sin(f2 * 18.0 - uTime * 2.2));
  col += vec3(0.15, 0.30, 0.60) * st2 * 0.15;

  // Convergence highlights
  float bright = smoothstep(0.5, 0.85, f * rm);
  col += vec3(0.40, 0.28, 0.65) * bright * 0.35;

  // Hot core at center of sphere
  float centerDist = length(vUv - 0.5);
  float core = exp(-centerDist * centerDist * 8.0);
  col += vec3(0.50, 0.35, 0.70) * core * 0.5;
  col += vec3(0.65, 0.50, 0.85) * pow(core, 3.0) * 0.35;

  // White-hot bloom
  col += vec3(0.70, 0.60, 0.90) * pow(core, 6.0) * 0.3;

  // Fresnel rim
  float fresnel = 1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)));
  fresnel = pow(fresnel, 2.0);
  col += vec3(0.30, 0.15, 0.55) * fresnel * 0.5;

  // Fusing: white-hot override
  col = mix(col, vec3(1.0, 0.95, 1.0), uFusing * 0.6 * core);
  col += vec3(0.5, 0.3, 0.7) * uFusing * 0.3;

  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
`;

export default function DealerOrb({ moduleCount = 0, totalPower = 0, showFusion = false, quality = 'high' }) {
  const matRef = useRef();
  const meshRef = useRef();
  const fusingRef = useRef(0);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uPower: { value: 0 },
    uCount: { value: 0 },
    uFusing: { value: 0 },
  }), []);

  useFrame((state) => {
    if (!matRef.current) return;
    const t = state.clock.elapsedTime;
    matRef.current.uniforms.uTime.value = t;

    // Smooth power lerp
    const targetPower = Math.min(totalPower / 1000, 1);
    matRef.current.uniforms.uPower.value += (targetPower - matRef.current.uniforms.uPower.value) * 0.03;
    matRef.current.uniforms.uCount.value += (moduleCount - matRef.current.uniforms.uCount.value) * 0.05;

    // Fusing animation
    const targetFusing = showFusion ? 1 : 0;
    fusingRef.current += (targetFusing - fusingRef.current) * 0.08;
    matRef.current.uniforms.uFusing.value = fusingRef.current;

    // Scale reacts to fusing
    if (meshRef.current) {
      const baseScale = 0.5 + moduleCount * 0.02;
      const fuseScale = showFusion ? 0.4 : 0;
      const targetScale = baseScale + fuseScale;
      const s = meshRef.current.scale.x;
      const newScale = s + (targetScale - s) * 0.05;
      meshRef.current.scale.setScalar(newScale);
    }
  });

  const segments = quality === 'high' ? 64 : 32;

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={meshRef} position={[0, 0.8, -1.2]} scale={0.5}>
        <sphereGeometry args={[1, segments, segments]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={ORB_VERT}
          fragmentShader={ORB_FRAG}
          uniforms={uniforms}
        />
      </mesh>
    </Float>
  );
}
