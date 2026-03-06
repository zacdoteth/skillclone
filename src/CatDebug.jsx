import React, { Suspense, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Clone, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';

function Cat({ rotY }) {
  const { scene } = useGLTF('/cat.glb');
  const ref = useRef();

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
    }
  });

  return (
    <group ref={ref} rotation={[0, rotY, 0]}>
      <Clone object={scene} />
    </group>
  );
}

export default function CatDebug() {
  const [bg, setBg] = useState('#1a1a2e');
  const [ambientI, setAmbientI] = useState(2.0);
  const [dirI, setDirI] = useState(3.0);
  const [rotY, setRotY] = useState(0);
  const [exposure, setExposure] = useState(1.5);
  const [envPreset, setEnvPreset] = useState('studio');

  const panel = {
    position: 'fixed', top: '10px', left: '10px', zIndex: 100,
    background: 'rgba(0,0,0,0.85)', padding: '16px', borderRadius: '12px',
    color: 'white', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px',
    minWidth: '220px', fontFamily: 'monospace',
  };
  const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' };

  return (
    <div style={{ width: '100vw', height: '100vh', background: bg }}>
      <Canvas
        shadows
        dpr={Math.min(window.devicePixelRatio, 2)}
        camera={{ fov: 35, near: 0.1, far: 50, position: [0, 1, 4] }}
        gl={{
          alpha: false,
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: exposure,
        }}
      >
        <color attach="background" args={[bg]} />
        <Suspense fallback={null}>
          <Environment preset={envPreset} />
          <ambientLight intensity={ambientI} />
          <directionalLight position={[3, 5, 4]} intensity={dirI} color="#ffffff" castShadow />
          <pointLight position={[-2, 3, 1]} intensity={1.0} color="#a78bfa" />
          <pointLight position={[2, 0, 3]} intensity={0.5} color="#fbbf24" />

          <Cat rotY={rotY} />

          {/* Grid helper */}
          <gridHelper args={[10, 20, '#333', '#222']} />
          <axesHelper args={[2]} />
        </Suspense>
        <OrbitControls makeDefault target={[0, 0.5, 0]} />
      </Canvas>

      <div style={panel}>
        <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>Cat Debug</div>

        <div style={row}>
          <span>Ambient</span>
          <input type="range" min="0" max="5" step="0.1" value={ambientI}
            onChange={e => setAmbientI(parseFloat(e.target.value))} />
          <span>{ambientI.toFixed(1)}</span>
        </div>

        <div style={row}>
          <span>DirLight</span>
          <input type="range" min="0" max="8" step="0.1" value={dirI}
            onChange={e => setDirI(parseFloat(e.target.value))} />
          <span>{dirI.toFixed(1)}</span>
        </div>

        <div style={row}>
          <span>Exposure</span>
          <input type="range" min="0.2" max="3" step="0.1" value={exposure}
            onChange={e => setExposure(parseFloat(e.target.value))} />
          <span>{exposure.toFixed(1)}</span>
        </div>

        <div style={row}>
          <span>RotateY</span>
          <input type="range" min="-3.14" max="3.14" step="0.1" value={rotY}
            onChange={e => setRotY(parseFloat(e.target.value))} />
          <span>{rotY.toFixed(1)}</span>
        </div>

        <div style={row}>
          <span>Env</span>
          <select value={envPreset} onChange={e => setEnvPreset(e.target.value)}
            style={{ background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px', padding: '2px' }}>
            {['studio', 'city', 'sunset', 'dawn', 'night', 'warehouse', 'forest', 'apartment', 'lobby', 'park'].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div style={row}>
          <span>BG</span>
          <input type="color" value={bg} onChange={e => setBg(e.target.value)} />
        </div>

        <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>
          Drag to orbit • Scroll to zoom • Right-drag to pan
        </div>
      </div>
    </div>
  );
}

useGLTF.preload('/cat.glb');
