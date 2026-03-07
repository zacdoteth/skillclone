import React, { useRef, useEffect } from 'react';

// ============================================
// HOLOGRAPHIC FOIL SHADER — REFIK ANADOL-STYLE
// Domain-warped rainbow iridescence overlay
// Flows like living data sculpture on the pack
// ============================================

const VERT = `attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }`;

const FRAG = `precision highp float;

uniform float u_time;
uniform vec2 u_res;

// ─── Gradient Noise ───────────────────────
vec2 hash(vec2 p){
  p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
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

// ─── FBM with rotation between octaves ────
const mat2 ROT = mat2(0.80, 0.60, -0.60, 0.80);

float fbm(vec2 p){
  float f = 0.0;
  f += 0.5000 * gnoise(p); p = ROT * p * 2.02;
  f += 0.2500 * gnoise(p); p = ROT * p * 2.03;
  f += 0.1250 * gnoise(p); p = ROT * p * 2.01;
  f += 0.0625 * gnoise(p);
  return f / 0.9375;
}

// ─── IQ Cosine Palette ────────────────────
vec3 pal(float t, vec3 a, vec3 b, vec3 c, vec3 d){
  return a + b * cos(6.28318 * (c * t + d));
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  float asp = u_res.x / u_res.y;
  vec2 p = (uv - 0.5) * vec2(asp, 1.0) * 3.0;

  float t = u_time * 0.08;

  // ─── DOMAIN WARPING (Anadol technique) ──
  // Two layers of fbm displacement create flowing, organic motion
  vec2 q = vec2(
    fbm(p + vec2(0.0, 0.0) + t * 0.4),
    fbm(p + vec2(5.2, 1.3) - t * 0.3)
  );
  vec2 r = vec2(
    fbm(p + 4.0 * q + vec2(1.7, 9.2) + t * 0.15),
    fbm(p + 4.0 * q + vec2(8.3, 2.8) - t * 0.12)
  );
  float f = fbm(p + 3.5 * r);

  // ─── HOLOGRAPHIC IRIDESCENCE ────────────
  // The "foil angle" varies based on domain-warped noise
  // This creates the rainbow shift that moves across the surface
  float foilAngle = f * 2.0 + length(q) * 1.5;

  // Rainbow palette — vivid holographic spectrum
  vec3 rainbow = pal(foilAngle,
    vec3(0.5, 0.5, 0.5),    // base brightness
    vec3(0.5, 0.5, 0.5),    // amplitude — full spectrum
    vec3(1.0, 1.0, 1.0),    // frequency — all channels cycle
    vec3(0.00, 0.10, 0.20)  // phase offset — creates rainbow spread
  );

  // Second palette layer — deeper purples and teals for SkillClone brand
  vec3 brand = pal(foilAngle * 0.7 + 0.3,
    vec3(0.28, 0.18, 0.45), // dark purple base
    vec3(0.42, 0.35, 0.48), // moderate swing
    vec3(0.78, 0.62, 0.88), // asymmetric frequency
    vec3(0.20, 0.05, 0.42)  // offset into violet
  );

  // Blend rainbow and brand — rainbow pops through in bright areas
  float intensity = smoothstep(-0.2, 0.8, f);
  vec3 col = mix(brand, rainbow, intensity * 0.65);

  // ─── SPECULAR HIGHLIGHTS ────────────────
  // Bright "light reflection" bands that sweep across
  float specular1 = smoothstep(0.55, 0.8, f) * 0.8;
  float specular2 = smoothstep(0.3, 0.5, fbm(p * 1.5 + r * 2.0 + t * 0.5)) * 0.4;
  col += vec3(1.0, 0.95, 0.9) * specular1;
  col += vec3(0.8, 0.7, 1.0) * specular2;

  // ─── MICRO-SPARKLE ─────────────────────
  // Tiny bright dots that simulate holographic micro-structure
  float sparkle = gnoise(p * 18.0 + t * 2.0);
  sparkle = smoothstep(0.7, 0.95, sparkle) * 0.6;
  col += sparkle;

  // ─── FLOWING LIGHT BANDS ────────────────
  // Diagonal sweeping bands like real foil card under light
  float sweep = sin(uv.x * 8.0 + uv.y * 4.0 + t * 3.0 + f * 4.0) * 0.5 + 0.5;
  sweep = smoothstep(0.6, 0.9, sweep) * 0.3;
  col += vec3(0.9, 0.85, 1.0) * sweep;

  // ─── EDGE FADE ──────────────────────────
  // Soften at edges so it blends with the pack image underneath
  float edgeFade = smoothstep(0.0, 0.08, uv.x) * smoothstep(1.0, 0.92, uv.x)
                 * smoothstep(0.0, 0.08, uv.y) * smoothstep(1.0, 0.92, uv.y);

  // Final alpha — screen blend, so we want controlled brightness
  float alpha = (intensity * 0.45 + specular1 * 0.3 + sweep * 0.2 + sparkle * 0.15) * edgeFade;
  alpha = clamp(alpha, 0.0, 0.65);

  // Boost saturation slightly
  col = mix(vec3(dot(col, vec3(0.299, 0.587, 0.114))), col, 1.3);
  col = clamp(col, 0.0, 1.0);

  gl_FragColor = vec4(col, alpha);
}`;

export default function PackFoilShader({ style = {} }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const startRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
    });
    if (!gl) return;

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn('PackFoil shader error:', gl.getShaderInfoLog(s));
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
      console.warn('PackFoil link error:', gl.getProgramInfoLog(prog));
      return;
    }

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    gl.useProgram(prog);
    const posLoc = gl.getAttribLocation(prog, 'a_pos');
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_res');

    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // additive — screen-like blend

    startRef.current = performance.now() / 1000;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const w = Math.round(rect.width * dpr * 0.5); // half-res for perf
      const h = Math.round(rect.height * dpr * 0.5);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    function frame() {
      resize();
      const now = performance.now() / 1000 - startRef.current;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(prog);
      gl.uniform1f(uTime, now);
      gl.uniform2f(uRes, canvas.width, canvas.height);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      frameRef.current = requestAnimationFrame(frame);
    }

    frameRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(frameRef.current);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        borderRadius: 'inherit',
        pointerEvents: 'none',
        mixBlendMode: 'screen',
        ...style,
      }}
    />
  );
}
