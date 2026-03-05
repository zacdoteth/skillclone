import React, { useRef, useEffect } from 'react';

// ============================================
// 🖼️ REFIK ANADOL-INSPIRED GLSL SHADER
// Machine Hallucinations technique:
// Multi-pass domain warping through gradient noise FBM
// with flow streams, luminous color mapping, mouse reactivity
// "Data is pigment. The latent space dreams."
// ============================================

const VERT = `attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }`;

const FRAG = `precision highp float;

uniform float u_time;
uniform vec2 u_res;
uniform vec2 u_mouse;

// ─── Gradient Noise ───────────────────────────
// Compact 2D gradient noise with analytic derivatives
// Hash → gradient → interpolation
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

// ─── FBM with inter-octave rotation ──────────
// Rotation breaks grid-alignment artifacts
// Creates richer, more organic turbulence
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

// Ridged FBM variant — creates vein-like structures
float rfbm(vec2 p){
  float f = 0.0;
  f += 0.5000 * abs(gnoise(p)); p = ROT * p * 2.02;
  f += 0.2500 * abs(gnoise(p)); p = ROT * p * 2.03;
  f += 0.1250 * abs(gnoise(p)); p = ROT * p * 2.01;
  f += 0.0625 * abs(gnoise(p));
  return f / 0.9375;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  float asp = u_res.x / u_res.y;
  vec2 p = (uv - 0.5) * vec2(asp, 1.0) * 2.8;

  float t = u_time * 0.035;

  // ─── Mouse Gravity ─────────────────────────
  // Subtle gravitational pull toward cursor
  // Creates that interactive installation feel
  vec2 mp = (u_mouse - 0.5) * vec2(asp, 1.0) * 2.8;
  float md = length(p - mp);
  p += (mp - p) * 0.07 / (1.0 + md * 2.5);

  // ═══════════════════════════════════════════
  // DOMAIN WARPING — The Anadol Signature
  // Feed noise into noise. Each pass deepens
  // the organic distortion. This is how
  // "Machine Hallucinations" gets its look.
  // ═══════════════════════════════════════════

  // Pass 1: Initial displacement field
  vec2 q = vec2(
    fbm(p + vec2(0.0, 0.0) + t),
    fbm(p + vec2(5.2, 1.3) + t * 0.8)
  );

  // Pass 2: Warp the warp — deeper organic flow
  vec2 r = vec2(
    fbm(p + 4.0 * q + vec2(1.7, 9.2) + t * 0.5),
    fbm(p + 4.0 * q + vec2(8.3, 2.8) + t * 0.4)
  );

  // Pass 3: Third-order distortion for extreme organicism
  vec2 s = vec2(
    fbm(p + 3.0 * r + vec2(3.1, 7.4) + t * 0.25),
    fbm(p + 3.0 * r + vec2(6.7, 4.2) + t * 0.3)
  );

  // Final composited noise — the "data sculpture"
  float f = fbm(p + 3.5 * s);
  float f2 = fbm(p + 3.0 * r + vec2(2.1, 4.7) + t * 0.15);

  // Warp magnitudes — used for color variation
  float qm = length(q);
  float rm = length(r);
  float sm = length(s);

  // ═══════════════════════════════════════════
  // COLOR MAPPING
  // Anadol palette: deep space → violet → blue
  // → cyan with pink accents and white bloom
  // Each layer adds depth, like oil on canvas
  // ═══════════════════════════════════════════

  // Base: the void
  vec3 col = vec3(0.015, 0.008, 0.035);

  // Layer 1: Deep purple nebula
  col = mix(col, vec3(0.09, 0.025, 0.18), smoothstep(-0.15, 0.35, f));

  // Layer 2: Rich violet forms emerge
  col = mix(col, vec3(0.25, 0.07, 0.45), smoothstep(0.1, 0.5, f));

  // Layer 3: Electric blue veins
  col = mix(col, vec3(0.08, 0.25, 0.60), smoothstep(0.25, 0.65, f2) * 0.55);

  // Layer 4: Cyan luminescence at peaks
  col = mix(col, vec3(0.18, 0.60, 0.82), smoothstep(0.6, 0.92, f) * 0.35);

  // Pink accent — where warp intensity is highest
  col += vec3(0.50, 0.10, 0.32) * smoothstep(0.35, 0.75, rm) * 0.18;

  // Magenta bloom from third-order warp
  col += vec3(0.40, 0.05, 0.50) * smoothstep(0.3, 0.6, sm) * 0.12;

  // Convergence highlights — where all warps align
  float bright = smoothstep(0.55, 0.88, f * rm);
  col += vec3(0.40, 0.28, 0.62) * bright * 0.35;
  col += vec3(0.25, 0.45, 0.75) * pow(bright, 2.5) * 0.22;

  // White-hot bloom at extreme convergence
  col += vec3(0.6, 0.5, 0.7) * pow(max(bright * sm, 0.0), 4.0) * 0.3;

  // ═══════════════════════════════════════════
  // FLOW STREAMS — Data Particle Visualization
  // Thin luminous lines flowing along noise contours
  // Like rivers of data in the latent space
  // ═══════════════════════════════════════════

  // Primary streams — follow the main noise field
  float st1 = smoothstep(0.485, 0.5, sin(f * 30.0 + t * 3.5));
  col += vec3(0.38, 0.22, 0.60) * st1 * 0.14;

  // Secondary streams — cross-flow for depth
  float st2 = smoothstep(0.49, 0.5, sin(f2 * 24.0 - t * 2.5));
  col += vec3(0.18, 0.38, 0.65) * st2 * 0.10;

  // Ridged noise veins — organic vascular structures
  float veins = rfbm(p * 1.5 + s * 2.0 + t * 0.4);
  col += vec3(0.30, 0.15, 0.50) * smoothstep(0.25, 0.5, veins) * 0.08;

  // ═══════════════════════════════════════════
  // FINAL COMPOSITION
  // ═══════════════════════════════════════════

  // Vignette — darkens edges for text readability
  // Asymmetric: tighter vertically for header/footer space
  float vig = 1.0 - smoothstep(0.15, 0.82, length((uv - 0.5) * vec2(1.05, 1.25)));
  col *= vig;

  // Depth-aware brightness
  col *= 0.80 + 0.20 * smoothstep(0.5, 0.0, length(uv - 0.5));

  // ═══════════════════════════════════════════
  // THE ORB — Volumetric Data Singularity
  // No hard edges. No circles. Pure light density.
  // A star being born from the data sculpture.
  // Internal turbulence like Jupiter's atmosphere.
  // Breathes. Radiates. Alive.
  // ═══════════════════════════════════════════

  vec2 orbCenter = vec2(0.5, 0.78);
  float orbR = 0.055 + 0.003 * sin(u_time * 0.6);
  float orbD = length(uv - orbCenter);

  // ── Shape-shifting boundary — living data organism ──
  // Multiple noise layers distort the edge differently over time
  // The orb morphs like Anadol's fluid data sculptures
  float angle = atan(uv.y - orbCenter.y, (uv.x - orbCenter.x) * asp);
  vec2 orbP = (uv - orbCenter) * 16.0;
  float edgeWarp = fbm(orbP * 0.8 + t * 0.5 + s) * 0.015;
  // Angular distortion — different directions warp at different rates
  edgeWarp += 0.008 * sin(angle * 3.0 + t * 0.7 + fbm(orbP * 0.5 + t * 0.3) * 4.0);
  edgeWarp += 0.005 * sin(angle * 5.0 - t * 0.5 + fbm(orbP * 0.3 - t * 0.2) * 3.0);
  // Slow organic breathing
  edgeWarp += 0.004 * sin(angle * 2.0 + t * 0.25);
  float warpedD = orbD + edgeWarp;

  // Shaped density — soft but defined
  float density = exp(-warpedD * warpedD / (orbR * orbR * 1.1));

  // ── Domain warping INSIDE the orb ──
  // Same technique as background but at orb scale
  // Makes it feel like a concentrated node of the same data sculpture
  vec2 oq = vec2(
    fbm(orbP + vec2(0.0, 0.0) + t * 1.5),
    fbm(orbP + vec2(5.2, 1.3) + t * 1.2)
  );
  vec2 or2 = vec2(
    fbm(orbP + 3.5 * oq + vec2(1.7, 9.2) + t * 0.7),
    fbm(orbP + 3.5 * oq + vec2(8.3, 2.8) + t * 0.6)
  );
  float of = fbm(orbP + 3.0 * or2);
  float of2 = rfbm(orbP * 0.7 + or2 * 2.0 + t * 0.4);
  float oqm = length(oq);
  float orm = length(or2);

  // ── Orb color — same palette as background, concentrated ──
  // Deep void base
  vec3 orbCol = vec3(0.04, 0.015, 0.08) * density;

  // Purple nebula forms (matching background layer 2)
  orbCol += vec3(0.28, 0.08, 0.50) * density * smoothstep(-0.1, 0.5, of) * 0.8;

  // Electric blue veins (matching background layer 3)
  orbCol += vec3(0.10, 0.28, 0.65) * density * smoothstep(0.2, 0.6, of2) * 0.5;

  // Cyan luminescence at warp peaks
  orbCol += vec3(0.20, 0.55, 0.80) * density * smoothstep(0.5, 0.85, of) * 0.3;

  // Pink accent where internal warp intensity peaks
  orbCol += vec3(0.45, 0.10, 0.35) * density * smoothstep(0.3, 0.7, orm) * 0.25;

  // Internal flow streams — data rivers inside the orb
  float ist1 = smoothstep(0.48, 0.5, sin(of * 22.0 + t * 3.0));
  orbCol += vec3(0.35, 0.18, 0.55) * ist1 * density * 0.2;

  float ist2 = smoothstep(0.48, 0.5, sin(of2 * 18.0 - t * 2.2));
  orbCol += vec3(0.15, 0.30, 0.60) * ist2 * density * 0.15;

  // Ridged veins inside — organic vascular look
  orbCol += vec3(0.25, 0.10, 0.40) * density * smoothstep(0.2, 0.45, of2) * 0.15;

  // Convergence highlights — where warps align inside orb
  float oBright = smoothstep(0.5, 0.85, of * orm);
  orbCol += vec3(0.40, 0.28, 0.65) * oBright * density * 0.35;

  // Bright core — concentrated singularity
  float coreDensity = exp(-warpedD * warpedD / (orbR * orbR * 0.15));
  orbCol += vec3(0.50, 0.35, 0.70) * coreDensity * 0.5;
  orbCol += vec3(0.65, 0.50, 0.85) * pow(coreDensity, 3.0) * 0.35;

  // White-violet center bloom — contained
  float hotCore = exp(-warpedD * warpedD / (orbR * orbR * 0.04));
  orbCol += vec3(0.70, 0.60, 0.90) * hotCore * 0.3;

  // Specular highlight — off-center, 3D volume
  vec2 specOff = vec2(-0.012, -0.016);
  float specD = length(uv - orbCenter + specOff);
  float spec = exp(-specD * specD / (orbR * orbR * 0.07));
  orbCol += vec3(0.75, 0.65, 0.95) * spec * 0.18;

  // Fresnel rim — data light at the boundary
  float rim = smoothstep(orbR * 0.5, orbR * 0.85, warpedD) *
              smoothstep(orbR * 1.2, orbR * 0.9, warpedD);
  orbCol += vec3(0.22, 0.10, 0.40) * rim * 0.4;

  // Subtle emanation — orb bleeds into surrounding data
  float aura = exp(-orbD * orbD / (orbR * orbR * 4.0));
  col += vec3(0.08, 0.03, 0.15) * aura * 0.3;

  // Additive blend — orb is a dense node of the same data sculpture
  col += orbCol;

  // Film grain — Anadol's work always has subtle texture
  float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + u_time) * 43758.5453);
  col += (grain - 0.5) * 0.012;

  // Ensure no negative values from mixing
  gl_FragColor = vec4(max(col, 0.0), 1.0);
}`;

export default function AnadolShader({ style = {} }) {
  const canvasRef = useRef(null);
  const glRef = useRef(null);
  const frameRef = useRef(0);
  const mouseRef = useRef([0.5, 0.5]);
  const startRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) return; // Graceful fallback — CSS gradient still shows
    glRef.current = gl;

    // ── Compile Shaders ──
    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn('Shader compile error:', gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    }

    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('Shader link error:', gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    // ── Fullscreen Quad ──
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // ── Uniforms ──
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    // ── Resize (render at reduced resolution for performance) ──
    // The slight blur from upscaling adds to the organic, dreamy feel
    function resize() {
      const mobile = window.innerWidth < 768;
      const scale = mobile ? 0.35 : 0.5;
      canvas.width = Math.floor(window.innerWidth * scale);
      canvas.height = Math.floor(window.innerHeight * scale);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener('resize', resize);

    // ── Mouse tracking ──
    function onMouse(e) {
      mouseRef.current = [
        e.clientX / window.innerWidth,
        1.0 - e.clientY / window.innerHeight,
      ];
    }
    window.addEventListener('mousemove', onMouse, { passive: true });

    // ── Render loop ──
    startRef.current = performance.now();

    function render() {
      const time = (performance.now() - startRef.current) * 0.001;
      gl.uniform1f(uTime, time);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uMouse, mouseRef.current[0], mouseRef.current[1]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      frameRef.current = requestAnimationFrame(render);
    }
    render();

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        ...style,
      }}
    />
  );
}
