import React, { Suspense, useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Clone, Environment } from '@react-three/drei';
import * as THREE from 'three';

// ─── Contextual dialogue ───
const DIALOGUE = {
  landing: [
    "What are we building today?",
    "Pick a mission, I'll deal the cards~",
    "Choose wisely, human...",
    "Type your quest above!",
  ],
  building_empty: [
    "Tap some genius cards!",
    "Build your dream team~",
    "The deck awaits you!",
    "Pick your first mind!",
  ],
  building_few: [
    "Nice picks! Keep going~",
    "Getting stronger...",
    "Good taste, human!",
    "More minds = more power!",
  ],
  building_strong: [
    "That's a deadly squad!",
    "Hit FUSE when ready!",
    "This team is stacked!",
    "I like your style~",
  ],
  fusing: [
    "FUSING... hold tight!",
    "Combining genius power!",
    "Magic happening~!",
  ],
  result: [
    "Copy that prompt!",
    "Your clone is ready~",
    "Now go build something!",
    "Legendary combo!",
  ],
};

function pickLine(lines) {
  return lines[Math.floor(Math.random() * lines.length)];
}

function getDialogueKey(stage, moduleCount, fusePhase) {
  if (fusePhase === 'revealed') return 'result';
  if (stage === 'result') return 'result';
  if (stage === 'landing') return 'landing';
  if (stage === 'building') {
    if (moduleCount === 0) return 'building_empty';
    if (moduleCount <= 3) return 'building_few';
    return 'building_strong';
  }
  return 'landing';
}

// ─── 3D Floating Cat ───
function FloatingCat({ speaking, excited }) {
  const { scene } = useGLTF('/cat.glb');
  const groupRef = useRef();
  const innerRef = useRef();

  // Compute scale from original scene (don't clone — let <Clone> handle it)
  const { scale, yOffset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = 1.6 / maxDim;
    return { scale: s, yOffset: -box.min.y * s - 0.35 };
  }, [scene]);

  useFrame((state) => {
    if (!innerRef.current || !groupRef.current) return;
    const t = state.clock.elapsedTime;

    // ── Magical floating bob ──
    // Two sine waves at different frequencies for organic feel
    const floatY = Math.sin(t * 1.3) * 0.06 + Math.sin(t * 2.1) * 0.025;
    groupRef.current.position.y = floatY;

    // Gentle tilt matching the bob (like it's riding air currents)
    groupRef.current.rotation.z = Math.sin(t * 1.3) * 0.03;
    groupRef.current.rotation.x = Math.sin(t * 0.9) * 0.02;

    // ── Breathing squash & stretch ──
    const breathe = Math.sin(t * 2.5) * 0.012;
    innerRef.current.scale.y = scale * (1 + breathe);
    innerRef.current.scale.x = scale * (1 - breathe * 0.5);
    innerRef.current.scale.z = scale * (1 - breathe * 0.5);

    // ── Head turn / idle sway ──
    const baseSway = Math.sin(t * 0.7) * 0.12;
    innerRef.current.rotation.y = baseSway;

    // ── Speaking animation ──
    if (speaking) {
      // Perky bounce when talking
      innerRef.current.position.y = yOffset + Math.abs(Math.sin(t * 10)) * 0.025;
      innerRef.current.rotation.y = baseSway + Math.sin(t * 4) * 0.05;
    } else {
      innerRef.current.position.y = yOffset;
    }

    // ── Excitement reaction ──
    if (excited) {
      groupRef.current.position.y = floatY + Math.abs(Math.sin(t * 6)) * 0.06;
      innerRef.current.rotation.y = baseSway + Math.sin(t * 5) * 0.15;
      innerRef.current.scale.y = scale * (1.04 + Math.sin(t * 8) * 0.02);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Lighting tuned from /cat debug */}
      <Environment preset="city" />
      <ambientLight intensity={3.2} />
      <directionalLight position={[3, 5, 4]} intensity={1.0} color="#ffffff" />
      <pointLight position={[-2, 3, 1]} intensity={1.0} color="#a78bfa" />
      <pointLight position={[2, 0, 3]} intensity={0.5} color="#fbbf24" />

      <group ref={innerRef} scale={[scale, scale, scale]} position={[0, yOffset, 0]} rotation={[0, -0.2, 0]}>
        <Clone object={scene} />
      </group>
    </group>
  );
}

// ─── Speech Bubble ───
function SpeechBubble({ text, visible, isMobile }) {
  return (
    <div style={{
      position: 'absolute',
      bottom: '100%',
      left: '50%',
      marginBottom: isMobile ? '2px' : '4px',
      padding: isMobile ? '8px 12px' : '10px 16px',
      background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
      border: '1px solid #f59e0b55',
      borderRadius: '16px 16px 4px 16px',
      color: '#78350f',
      fontSize: isMobile ? '11px' : '13px',
      fontWeight: 600,
      lineHeight: 1.3,
      whiteSpace: 'nowrap',
      maxWidth: isMobile ? '170px' : '220px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 2px 8px rgba(245,158,11,0.15)',
      opacity: visible ? 1 : 0,
      transform: visible
        ? 'translateX(-50%) translateY(0) scale(1)'
        : 'translateX(-50%) translateY(6px) scale(0.95)',
      transition: 'opacity 0.25s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      pointerEvents: 'none',
      zIndex: 1001,
      letterSpacing: '0.2px',
    }}>
      {text}
      {/* Tail */}
      <div style={{
        position: 'absolute',
        bottom: '-7px',
        right: '20px',
        width: 0, height: 0,
        borderLeft: '7px solid transparent',
        borderRight: '7px solid transparent',
        borderTop: '7px solid #fde68a',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
      }} />
    </div>
  );
}

// ─── Glow Ring — magical floating effect under the cat ───
function GlowRing({ visible }) {
  return (
    <div style={{
      position: 'absolute',
      bottom: '-8px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '70%',
      height: '12px',
      borderRadius: '50%',
      background: 'radial-gradient(ellipse, rgba(139,92,246,0.25) 0%, rgba(139,92,246,0.08) 50%, transparent 70%)',
      filter: 'blur(4px)',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.5s ease',
      pointerEvents: 'none',
      animation: visible ? 'catGlowPulse 3s ease-in-out infinite' : 'none',
    }} />
  );
}

// ─── Sparkle particles around the cat ───
function Sparkles({ active }) {
  if (!active) return null;
  return (
    <>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: '3px', height: '3px',
          borderRadius: '50%',
          background: i % 2 === 0 ? '#a78bfa' : '#ec4899',
          boxShadow: `0 0 6px ${i % 2 === 0 ? '#a78bfa' : '#ec4899'}`,
          pointerEvents: 'none',
          animation: `catSparkle 2s ${i * 0.4}s ease-in-out infinite`,
          top: `${15 + i * 15}%`,
          left: `${10 + (i * 20) % 80}%`,
        }} />
      ))}
    </>
  );
}

// ─── Main CatGuide Component ───
export default function CatGuide({ stage = 'landing', moduleCount = 0, fusePhase = null, isMobile = false, inline = false }) {
  const [bubbleText, setBubbleText] = useState('');
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [excited, setExcited] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const prevKeyRef = useRef('');
  const prevCountRef = useRef(0);


  // Dialogue on context change
  useEffect(() => {
    const key = getDialogueKey(stage, moduleCount, fusePhase);
    if (key !== prevKeyRef.current) {
      prevKeyRef.current = key;
      const line = pickLine(DIALOGUE[key] || DIALOGUE.landing);
      setBubbleVisible(false);
      setSpeaking(false);
      const t1 = setTimeout(() => { setBubbleText(line); setBubbleVisible(true); setSpeaking(true); }, 350);
      const t2 = setTimeout(() => setSpeaking(false), 2200);
      const t3 = setTimeout(() => setBubbleVisible(false), 5500);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [stage, moduleCount, fusePhase]);

  // Excitement burst on card add
  useEffect(() => {
    if (moduleCount > prevCountRef.current && moduleCount > 0) {
      setExcited(true);
      const t = setTimeout(() => setExcited(false), 600);
      return () => clearTimeout(t);
    }
    prevCountRef.current = moduleCount;
  }, [moduleCount]);

  // Click to talk
  const handleClick = useCallback(() => {
    if (minimized) { setMinimized(false); return; }
    const key = getDialogueKey(stage, moduleCount, fusePhase);
    setBubbleText(pickLine(DIALOGUE[key] || DIALOGUE.landing));
    setBubbleVisible(true);
    setSpeaking(true);
    setTimeout(() => setSpeaking(false), 1500);
    setTimeout(() => setBubbleVisible(false), 4500);
  }, [minimized, stage, moduleCount, fusePhase]);

  // Inline mode = big hero cat on landing; otherwise small Clippy in corner
  const catW = inline ? (isMobile ? 220 : 340) : (isMobile ? 120 : 170);
  const catH = inline ? (isMobile ? 280 : 460) : (isMobile ? 170 : 240);
  const camY = inline ? 0.35 : 0.4;
  const catExposure = inline ? 0.6 : 0.4;

  return (
    <>
      <style>{`
        @keyframes catFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes catGlowPulse {
          0%, 100% { opacity: 0.6; transform: translateX(-50%) scaleX(1); }
          50% { opacity: 1; transform: translateX(-50%) scaleX(1.15); }
        }
        @keyframes catSparkle {
          0%, 100% { opacity: 0; transform: translateY(0) scale(0); }
          30% { opacity: 1; transform: translateY(-10px) scale(1); }
          70% { opacity: 0.6; transform: translateY(-20px) scale(0.8); }
          100% { opacity: 0; transform: translateY(-30px) scale(0); }
        }
        @keyframes catEntrance {
          from { opacity: 0; transform: translateY(30px) scale(0.5); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes catMinimize {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0.8; transform: scale(0.6); }
        }
      `}</style>

      <div
        style={inline ? {
          position: 'relative',
          zIndex: 10,
          animation: 'catEntrance 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        } : {
          position: 'fixed',
          bottom: isMobile ? '70px' : '4px',
          right: isMobile ? '4px' : '8px',
          zIndex: 1000,
          animation: 'catEntrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        }}
      >
        {/* Floating container — no box, just the cat in space */}
        <div
          onClick={handleClick}
          style={{
            width: minimized ? '40px' : `${catW}px`,
            height: minimized ? '40px' : `${catH}px`,
            cursor: 'pointer',
            position: 'relative',
            margin: inline ? '0 auto' : undefined,
            transition: 'width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            animation: minimized ? 'none' : 'catFloat 4s ease-in-out infinite',
          }}
        >
          {/* Speech bubble */}
          {!minimized && <SpeechBubble text={bubbleText} visible={bubbleVisible} isMobile={isMobile} />}

          {/* Sparkle particles */}
          <Sparkles active={excited || (speaking && !minimized)} />

          {/* The 3D cat — transparent background, floating free */}
          {!minimized ? (
            <div style={{
              width: '100%', height: '100%',
              overflow: 'visible',
              position: 'relative',
            }}>
              <Canvas
                dpr={Math.min(window.devicePixelRatio, 2)}
                camera={{ fov: 35, near: 0.1, far: 10, position: [0, camY, 4] }}
                style={{
                  width: '100%', height: '100%',
                  background: 'transparent',
                  pointerEvents: 'none',
                }}
                gl={{
                  alpha: true,
                  antialias: true,
                  toneMapping: THREE.ACESFilmicToneMapping,
                  toneMappingExposure: catExposure,
                }}
                onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); }}
              >
                <Suspense fallback={null}>
                  <FloatingCat speaking={speaking} excited={excited} />
                </Suspense>
              </Canvas>
            </div>
          ) : (
            // Minimized — just a glowing orb
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(139,92,246,0.08) 60%, transparent 80%)',
              border: '1px solid rgba(139,92,246,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(139,92,246,0.15)',
              animation: 'catGlowPulse 3s ease-in-out infinite',
            }}>
              <div style={{ fontSize: '18px', filter: 'drop-shadow(0 0 4px rgba(139,92,246,0.5))' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 11l2-9h2l1 4h8l1-4h2l2 9" />
                  <path d="M3 11c0 6 4 9 9 9s9-3 9-9" />
                  <circle cx="9" cy="14" r="1" fill="#a78bfa" />
                  <circle cx="15" cy="14" r="1" fill="#a78bfa" />
                </svg>
              </div>
            </div>
          )}

          {/* Glow ring under the cat */}
          {!minimized && <GlowRing visible />}

          {/* Dismiss — tiny X (not shown in inline mode) */}
          {!minimized && !inline && (
            <button
              onClick={(e) => { e.stopPropagation(); setMinimized(true); }}
              style={{
                position: 'absolute', top: 0, right: 0,
                width: '18px', height: '18px', borderRadius: '50%',
                background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.35)', cursor: 'pointer',
                fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1, padding: 0, zIndex: 1002,
                opacity: 0, transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; }}
            >
              x
            </button>
          )}
        </div>
      </div>
    </>
  );
}

useGLTF.preload('/cat.glb');
