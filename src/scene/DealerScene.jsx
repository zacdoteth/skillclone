import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import Table from './Table';
import DealerOrb from './DealerOrb';
import PowerChip from './PowerChip';
import AmbientParticles from './AmbientParticles';
import FusionEffect from './FusionEffect';
import CameraRig from './CameraRig';
import SceneLights from './SceneLights';
import CatMascot from './CatMascot';

// Quality detection — port from Shed
const quality = (/Android|iPhone|iPad/i.test(navigator.userAgent) || navigator.hardwareConcurrency <= 4) ? 'low' : 'high';
const dpr = quality === 'high' ? Math.min(window.devicePixelRatio, 2) : Math.min(window.devicePixelRatio, 1.5);

export default function DealerScene({ moduleCount = 0, totalPower = 0, showFusion = false, isMobile = false }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      pointerEvents: 'none',
      width: '100vw',
      height: '100vh',
    }}>
      <Canvas
        dpr={dpr}
        shadows={quality === 'high'}
        gl={{ antialias: quality === 'high', alpha: false }}
        camera={{
          fov: 45,
          near: 0.1,
          far: 50,
          position: [0, 10, 8],
        }}
        style={{ width: '100%', height: '100%', background: '#09090b' }}
      >
        {/* Fog — depth atmosphere */}
        <fog attach="fog" args={['#09090b', 8, 20]} />

        <Suspense fallback={null}>
          {/* Camera controller */}
          <CameraRig isMobile={isMobile} active />

          {/* Lighting rig */}
          <SceneLights moduleCount={moduleCount} quality={quality} />

          {/* The table */}
          <Table quality={quality} />

          {/* AI Dealer Orb */}
          <DealerOrb
            moduleCount={moduleCount}
            totalPower={totalPower}
            showFusion={showFusion}
            quality={quality}
          />

          {/* Power chip on the table */}
          <PowerChip totalPower={totalPower} moduleCount={moduleCount} />

          {/* Ambient dust motes */}
          <AmbientParticles count={quality === 'high' ? 60 : 20} />

          {/* Cat mascot — Nintendo dealer assistant */}
          <CatMascot moduleCount={moduleCount} showFusion={showFusion} />

          {/* Fusion effect */}
          <FusionEffect active={showFusion} quality={quality} />
        </Suspense>
      </Canvas>
    </div>
  );
}
