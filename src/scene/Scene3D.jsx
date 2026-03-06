import React, { Suspense, useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, ContactShadows, Float, Html, Clone } from '@react-three/drei';
import * as THREE from 'three';

// ─── Table Model ───
function TableModel() {
  const { scene } = useGLTF('/table.glb');

  const { scale, offset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = 4.0 / maxDim;
    return { scale: s, offset: new THREE.Vector3(-center.x * s, -box.min.y * s, -center.z * s) };
  }, [scene]);

  return (
    <group scale={[scale, scale, scale]} position={[offset.x, offset.y, offset.z]}>
      <Clone object={scene} castShadow receiveShadow />
    </group>
  );
}

// ─── Cat Mascot — Nintendo-style dealer ───
const IDLE_STATES = ['breathe', 'look_left', 'look_right', 'perk_up', 'sleepy'];
const IDLE_MIN = 2200;
const IDLE_MAX = 4500;

function CatDealer({ cardCount = 0, fusing = false }) {
  const { scene } = useGLTF('/cat.glb');
  const innerRef = useRef();

  // Auto-scale cat to sit on the table
  const { scale, yOffset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = 1.0 / maxDim;
    return { scale: s, yOffset: -box.min.y * s };
  }, [model]);

  // Idle state machine
  const [idle, setIdle] = useState('breathe');
  useEffect(() => {
    let t;
    const cycle = () => {
      setIdle(IDLE_STATES[Math.floor(Math.random() * IDLE_STATES.length)]);
      t = setTimeout(cycle, IDLE_MIN + Math.random() * (IDLE_MAX - IDLE_MIN));
    };
    t = setTimeout(cycle, IDLE_MIN);
    return () => clearTimeout(t);
  }, []);

  const tgt = useRef({ ry: 0, rx: 0, sy: 1, py: 0 });

  useFrame((state) => {
    if (!innerRef.current) return;
    const t = state.clock.elapsedTime;
    const o = tgt.current;

    const breathe = Math.sin(t * 2) * 0.012;
    o.sy = 1 + breathe;
    o.py = 0;

    switch (idle) {
      case 'look_left':   o.ry = 0.4; o.rx = -0.06; break;
      case 'look_right':  o.ry = -0.4; o.rx = -0.06; break;
      case 'perk_up':
        o.ry = Math.sin(t * 1.5) * 0.12;
        o.rx = -0.15;
        o.sy = 1.03 + breathe;
        o.py = 0.03;
        break;
      case 'sleepy':
        o.ry = 0;
        o.rx = 0.1;
        o.sy = 0.97 + breathe * 1.5;
        o.py = -0.015;
        break;
      default:
        o.ry = Math.sin(t * 0.8) * 0.06;
        o.rx = 0;
        break;
    }

    // React to cards
    if (cardCount > 0) {
      const ex = Math.min(cardCount / 8, 1);
      o.sy += ex * 0.02;
      o.ry += Math.sin(t * 3 + cardCount) * ex * 0.1;
    }

    // Fusion reaction
    if (fusing) {
      o.sy = 1.08 + Math.sin(t * 6) * 0.04;
      o.py = Math.abs(Math.sin(t * 4)) * 0.1;
      o.ry = Math.sin(t * 5) * 0.25;
    }

    const g = innerRef.current;
    const lr = 0.07;
    g.rotation.y += (o.ry - g.rotation.y) * lr;
    g.rotation.x += (o.rx - g.rotation.x) * lr;
    g.position.y += (o.py - g.position.y) * lr;
    g.scale.y += (o.sy - g.scale.y) * lr;
    g.position.x = Math.sin(t * 0.7) * 0.008;
  });

  return (
    <Float speed={1.4} rotationIntensity={0.04} floatIntensity={0.08}>
      <group position={[0, 0.02, 0]} rotation={[0, Math.PI, 0]}>
        <group ref={innerRef} scale={[scale, scale, scale]} position={[0, yOffset, 0]}>
          <Clone object={scene} castShadow receiveShadow />
        </group>
        {/* Shadow blob */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
          <circleGeometry args={[0.35, 16]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.15} />
        </mesh>
      </group>
    </Float>
  );
}

// ─── Interactive Card Chips on the table ───
function CardChip({ position, color, delay = 0, label }) {
  const ref = useRef();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = 0.06 + Math.sin(state.clock.elapsedTime * 2 + delay * 0.01) * 0.01;
    ref.current.rotation.y = state.clock.elapsedTime * 0.3 + delay;
  });

  if (!visible) return null;

  return (
    <group ref={ref} position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.04, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          roughness={0.35}
          metalness={0.4}
        />
      </mesh>
      <mesh>
        <torusGeometry args={[0.18, 0.012, 6, 16]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.2} metalness={0.6} roughness={0.3} />
      </mesh>
      <Html position={[0, 0.06, 0]} center style={{ pointerEvents: 'none' }}>
        <div style={{
          fontSize: '9px', fontWeight: 800, color: 'white', textShadow: `0 0 8px ${color}`,
          fontFamily: 'ui-monospace, monospace', whiteSpace: 'nowrap',
        }}>{label}</div>
      </Html>
    </group>
  );
}

// ─── Main Scene ───
function SceneContent({ cardCount, fusing }) {
  return (
    <>
      {/* Environment — studio lighting with subtle reflections */}
      <Environment preset="city" />
      <fog attach="fog" args={['#0a0a0f', 6, 18]} />

      {/* Lights */}
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />
      <pointLight position={[-3, 4, -2]} intensity={0.5} color="#8b5cf6" />
      <pointLight position={[3, 3, 2]} intensity={0.3} color="#ec4899" />
      <spotLight
        position={[0, 6, 0]}
        angle={0.4}
        penumbra={0.8}
        intensity={0.8}
        color="#a78bfa"
        castShadow
      />

      {/* Table */}
      <TableModel />

      {/* Cat — the dealer */}
      <CatDealer cardCount={cardCount} fusing={fusing} />

      {/* Demo chips on the table */}
      {cardCount > 0 && (
        <>
          <CardChip position={[-0.8, 0, 0.6]} color="#8b5cf6" delay={0} label="Jobs" />
          {cardCount > 1 && <CardChip position={[-0.3, 0, 0.8]} color="#ef4444" delay={150} label="Spielberg" />}
          {cardCount > 2 && <CardChip position={[0.3, 0, 0.7]} color="#f59e0b" delay={300} label="Ogilvy" />}
          {cardCount > 3 && <CardChip position={[0.8, 0, 0.5]} color="#22c55e" delay={450} label="King" />}
        </>
      )}

      {/* Contact shadows — soft ground shadow */}
      <ContactShadows
        position={[0, 0, 0]}
        scale={8}
        blur={2}
        opacity={0.4}
        far={4}
      />

      {/* Ground plane — dark void */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#0a0a0f" roughness={0.95} metalness={0} />
      </mesh>

      {/* Camera controls */}
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={2.5}
        maxDistance={8}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.45}
        target={[0, 0.5, 0]}
        autoRotate
        autoRotateSpeed={0.4}
      />
    </>
  );
}

// ─── Exported Page Component ───
export default function Scene3D() {
  const [cardCount, setCardCount] = useState(0);
  const [fusing, setFusing] = useState(false);

  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#0a0a0f',
      position: 'relative', overflow: 'hidden',
    }}>
      <Canvas
        dpr={Math.min(window.devicePixelRatio, 2)}
        shadows
        gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        camera={{ fov: 40, near: 0.1, far: 50, position: [0, 3, 5] }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <SceneContent cardCount={cardCount} fusing={fusing} />
        </Suspense>
      </Canvas>

      {/* UI Overlay */}
      <div style={{
        position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: '10px', zIndex: 10,
      }}>
        <button
          onClick={() => setCardCount(c => Math.min(c + 1, 4))}
          style={{
            padding: '10px 20px', fontSize: '13px', fontWeight: 600,
            background: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.4)',
            borderRadius: '50px', color: '#a78bfa', cursor: 'pointer',
            backdropFilter: 'blur(10px)',
          }}
        >
          + Deal Card ({cardCount}/4)
        </button>
        <button
          onClick={() => { setFusing(true); setTimeout(() => setFusing(false), 2000); }}
          disabled={cardCount === 0}
          style={{
            padding: '10px 20px', fontSize: '13px', fontWeight: 600,
            background: cardCount > 0 ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${cardCount > 0 ? 'rgba(236, 72, 153, 0.4)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '50px', color: cardCount > 0 ? '#ec4899' : 'rgba(255,255,255,0.3)',
            cursor: cardCount > 0 ? 'pointer' : 'default',
            backdropFilter: 'blur(10px)',
          }}
        >
          Fuse!
        </button>
        <button
          onClick={() => setCardCount(0)}
          style={{
            padding: '10px 20px', fontSize: '13px', fontWeight: 600,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '50px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
            backdropFilter: 'blur(10px)',
          }}
        >
          Reset
        </button>
      </div>

      {/* Title */}
      <div style={{
        position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)',
        textAlign: 'center', zIndex: 10, pointerEvents: 'none',
      }}>
        <h1 style={{
          margin: 0, fontSize: '28px', fontWeight: 800, letterSpacing: '-1px',
          background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          SKILLCL.ONE
        </h1>
        <p style={{
          margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.35)',
          fontWeight: 400, letterSpacing: '2px',
        }}>
          3D DEALER TABLE
        </p>
      </div>
    </div>
  );
}

useGLTF.preload('/table.glb');
useGLTF.preload('/cat.glb');
