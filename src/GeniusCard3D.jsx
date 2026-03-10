import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, Environment } from '@react-three/drei';
import * as THREE from 'three';

// ── Spring constants — slightly underdamped for satisfying bounce ──
const K = 160;        // stiffness
const DAMP = 13;      // damping (~0.51 ratio → visible overshoot that settles fast)
const MAX_TILT = 0.4; // radians

// ── GLSL simplex noise for procedural stone texture ──
const NOISE_GLSL = /* glsl */ `
vec3 mod289_3(vec3 x){return x-floor(x*(1./289.))*289.;}
vec2 mod289_2(vec2 x){return x-floor(x*(1./289.))*289.;}
vec3 perm(vec3 x){return mod289_3(((x*34.)+1.)*x);}
float snoise(vec2 v){
  const vec4 C=vec4(.211324865,.366025404,-.577350269,.024390244);
  vec2 i=floor(v+dot(v,C.yy));
  vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1,0):vec2(0,1);
  vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1;
  i=mod289_2(i);
  vec3 p=perm(perm(i.y+vec3(0,i1.y,1))+i.x+vec3(0,i1.x,1));
  vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);
  m=m*m; m=m*m;
  vec3 x=2.*fract(p*C.www)-1.;
  vec3 h=abs(x)-.5;
  vec3 a0=x-floor(x+.5);
  m*=1.79284291-.85373472*(a0*a0+h*h);
  vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.*dot(m,g);
}`;

// ── Rounded-rect Shape helper ──
function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
}

// ═══════════════════════════════════════════════════════════════════
// GeniusCard3D — use inside an R3F <Canvas>
// ═══════════════════════════════════════════════════════════════════
export default function GeniusCard3D({
  geniusName = 'Unknown Genius',
  powerLevel = 90,
  specialty = 'Unspecified',
  color = '#8f8cff',
  width = 2.5,
  height = 3.5,
}) {
  const groupRef = useRef();
  const glowRef = useRef();
  const spring = useRef({ rx: 0, ry: 0, vrx: 0, vry: 0 });
  const target = useRef({ rx: 0, ry: 0 });

  const threeColor = useMemo(() => new THREE.Color(color), [color]);
  const cr = (threeColor.r * 255) | 0;
  const cg = (threeColor.g * 255) | 0;
  const cb = (threeColor.b * 255) | 0;

  const FRAME_W = 0.16; // frame border width
  const DEPTH = 0.2;
  const innerW = width - FRAME_W * 2;
  const innerH = height - FRAME_W * 2;

  // ── Frame geometry — extruded border with rounded corners & bevel ──
  const frameGeo = useMemo(() => {
    const outer = roundedRectShape(width, height, 0.14);
    const inner = roundedRectShape(innerW, innerH, 0.08);
    // Reverse winding for hole
    outer.holes.push(inner);
    const geo = new THREE.ExtrudeGeometry(outer, {
      depth: DEPTH,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 4,
    });
    geo.center();
    geo.computeVertexNormals();
    return geo;
  }, [width, height, innerW, innerH]);

  // ── Stone material — procedural noise + energy veins via onBeforeCompile ──
  const stoneMat = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0.12, 0.1, 0.16),
      roughness: 0.82,
      metalness: 0.08,
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.uniforms.uGlow = { value: threeColor };
      shader.uniforms.uPower = { value: powerLevel / 100 };

      // Vertex — pass world position
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vWPos;',
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvWPos=(modelMatrix*vec4(position,1.0)).xyz;',
      );

      // Fragment — stone texture + energy veins
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `#include <common>
uniform float uTime; uniform vec3 uGlow; uniform float uPower;
varying vec3 vWPos;
${NOISE_GLSL}`,
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
// Stone grain
float n1=snoise(vWPos.xy*3.5)*.5+.5;
float n2=snoise(vWPos.xy*9.+42.)*.5+.5;
gl_FragColor.rgb*=mix(.82,1.18,n1*.65+n2*.35);
// Energy veins — glowing cracks in the stone
float vein=snoise(vWPos.xy*14.+uTime*.25);
vein=smoothstep(.72,.80,abs(vein));
gl_FragColor.rgb+=uGlow*vein*uPower*.45;
// Rim shimmer
float rim=snoise(vWPos.xy*1.8+uTime*.08);
gl_FragColor.rgb+=uGlow*smoothstep(.55,1.,abs(rim))*.12*uPower;`,
      );
      mat.userData.shader = shader;
    };
    return mat;
  }, [threeColor, powerLevel]);

  // ── Glow rim — BackSide mesh slightly scaled up ──
  const glowMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: threeColor,
        transparent: true,
        opacity: 0.12 + (powerLevel / 100) * 0.22,
        side: THREE.BackSide,
      }),
    [threeColor, powerLevel],
  );

  // ── Power tier label ──
  const tier =
    powerLevel >= 97 ? 'legendary' : powerLevel >= 94 ? 'epic' : powerLevel >= 90 ? 'rare' : null;
  const tierColors = {
    legendary: { bg: 'rgba(255,215,0,0.14)', fg: '#ffd700', border: 'rgba(255,215,0,0.3)' },
    epic: { bg: 'rgba(168,85,247,0.14)', fg: '#a855f7', border: 'rgba(168,85,247,0.3)' },
    rare: { bg: 'rgba(59,130,246,0.14)', fg: '#3b82f6', border: 'rgba(59,130,246,0.3)' },
  };

  // ── useFrame: spring physics + shader uniforms ──
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);

    // Target tilt from normalized pointer
    target.current.ry = THREE.MathUtils.clamp(state.pointer.x * 0.45, -MAX_TILT, MAX_TILT);
    target.current.rx = THREE.MathUtils.clamp(-state.pointer.y * 0.3, -MAX_TILT, MAX_TILT);

    // Damped spring integration (F = -k·x - d·v)
    const s = spring.current;
    s.vrx += (K * (target.current.rx - s.rx) - DAMP * s.vrx) * dt;
    s.vry += (K * (target.current.ry - s.ry) - DAMP * s.vry) * dt;
    s.rx += s.vrx * dt;
    s.ry += s.vry * dt;

    if (groupRef.current) {
      groupRef.current.rotation.x = s.rx;
      groupRef.current.rotation.y = s.ry;
    }

    // Animate shader
    if (stoneMat.userData.shader) {
      stoneMat.userData.shader.uniforms.uTime.value = state.clock.elapsedTime;
    }

    // Pulse glow
    if (glowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2.2) * 0.025;
      glowRef.current.material.opacity = 0.12 + (powerLevel / 100) * 0.22 + pulse;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Arcane stone frame */}
      <mesh geometry={frameGeo} material={stoneMat} castShadow receiveShadow />

      {/* Glow rim — slightly oversized, behind */}
      <mesh ref={glowRef} geometry={frameGeo} material={glowMat} scale={1.05} position={[0, 0, -0.025]} />

      {/* Card face background plane */}
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[innerW, innerH]} />
        <meshBasicMaterial color="#08080f" />
      </mesh>

      {/* Card content — DOM elements synced to 3D via drei Html (CSS3DObject equivalent) */}
      <Html
        transform
        occlude="blending"
        position={[0, 0, DEPTH / 2 + 0.005]}
        scale={innerW / 220}
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            width: 220,
            height: 320,
            background: 'linear-gradient(180deg, #0c0c18 0%, #08080f 100%)',
            borderRadius: 6,
            overflow: 'hidden',
            fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            userSelect: 'none',
          }}
        >
          {/* ── Name banner ── */}
          <div
            style={{
              padding: '10px 12px 8px',
              background: `linear-gradient(135deg, rgba(${cr},${cg},${cb},0.15) 0%, transparent 100%)`,
              borderBottom: `1px solid rgba(${cr},${cg},${cb},0.2)`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.3px' }}>
              {geniusName}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: `rgb(${cr},${cg},${cb})`,
                textShadow: `0 0 8px rgba(${cr},${cg},${cb},0.5)`,
              }}
            >
              {powerLevel}
            </span>
          </div>

          {/* ── Art box ── */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `radial-gradient(ellipse at center, rgba(${cr},${cg},${cb},0.06) 0%, transparent 70%)`,
              position: 'relative',
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                border: `2px solid rgba(${cr},${cg},${cb},0.3)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `radial-gradient(circle, rgba(${cr},${cg},${cb},0.1) 0%, transparent 70%)`,
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>

            {tier && (
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  padding: '2px 6px',
                  borderRadius: 3,
                  background: tierColors[tier].bg,
                  color: tierColors[tier].fg,
                  border: `1px solid ${tierColors[tier].border}`,
                }}
              >
                {tier}
              </div>
            )}
          </div>

          {/* ── Type line ── */}
          <div
            style={{
              padding: '4px 12px',
              borderTop: `1px solid rgba(${cr},${cg},${cb},0.12)`,
              borderBottom: `1px solid rgba(${cr},${cg},${cb},0.12)`,
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.4px',
              textTransform: 'uppercase',
              color: `rgba(${cr},${cg},${cb},0.6)`,
            }}
          >
            Genius
          </div>

          {/* ── Specs / flavor text ── */}
          <div
            style={{
              padding: '8px 12px 12px',
              fontSize: 10.5,
              lineHeight: 1.4,
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            {specialty}
          </div>
        </div>
      </Html>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════
// GeniusCardScene — self-contained Canvas wrapper for standalone use
// ═══════════════════════════════════════════════════════════════════
export function GeniusCardScene({ style, ...cardProps }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 40 }}
      style={{ background: '#08080f', ...style }}
      gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping }}
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 4, 5]} intensity={1.2} castShadow />
      <pointLight position={[-2, -1, 3]} intensity={0.4} color="#8f8cff" />
      <GeniusCard3D {...cardProps} />
      <Environment preset="night" />
    </Canvas>
  );
}
