import React, { useRef, useEffect, useCallback, useState } from 'react';

// ============================================
// REFIK ANADOL-INSPIRED GLSL SHADER
// Machine Hallucinations technique:
// Multi-pass domain warping through gradient noise FBM
// with flow streams, luminous color mapping
// + REAL WATER PHYSICS: 2D wave equation via ping-pong FBOs
// + CARD DISPLACEMENT: liquid flows around card-shaped voids
// "Data is pigment. The latent space dreams."
// ============================================

const VERT = `attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }`;

// ─── RIPPLE SIMULATION SHADER ───────────────
// 2D wave equation with velocity-Verlet integration
// Stores: R=height, G=velocity, B=gradient_x, A=gradient_y
// 8-neighbor Laplacian for isotropic wave propagation
const RIPPLE_FRAG = `precision highp float;

uniform sampler2D u_prev;
uniform vec2 u_texel;     // 1.0 / simulation resolution
uniform vec2 u_mouse;     // mouse UV (0-1)
uniform vec2 u_mouseDelta; // mouse velocity this frame
uniform float u_mouseDown; // 1.0 when mouse is moving

void main(){
  vec2 uv = gl_FragCoord.xy * u_texel;

  // Sample current state
  vec4 state = texture2D(u_prev, uv);
  float h = state.r;  // height
  float v = state.g;  // velocity

  // 8-neighbor Laplacian (isotropic — waves propagate as circles, not diamonds)
  float hL = texture2D(u_prev, uv + vec2(-u_texel.x, 0.0)).r;
  float hR = texture2D(u_prev, uv + vec2( u_texel.x, 0.0)).r;
  float hU = texture2D(u_prev, uv + vec2(0.0,  u_texel.y)).r;
  float hD = texture2D(u_prev, uv + vec2(0.0, -u_texel.y)).r;
  float hTL = texture2D(u_prev, uv + vec2(-u_texel.x,  u_texel.y)).r;
  float hTR = texture2D(u_prev, uv + vec2( u_texel.x,  u_texel.y)).r;
  float hBL = texture2D(u_prev, uv + vec2(-u_texel.x, -u_texel.y)).r;
  float hBR = texture2D(u_prev, uv + vec2( u_texel.x, -u_texel.y)).r;

  float laplacian = (hL + hR + hU + hD) * 0.5
                  + (hTL + hTR + hBL + hBR) * 0.25
                  - h * 3.0;

  // Wave equation: velocity += c² × Laplacian
  float c2 = 0.25; // wave speed squared (stable for CFL condition)
  v += c2 * laplacian;
  v *= 0.992; // damping — ripples decay naturally, not too lingering
  h += v;

  // Mouse splat — Gaussian disturbance scaled by mouse speed
  if (u_mouseDown > 0.5) {
    vec2 diff = uv - u_mouse;
    float dist2 = dot(diff, diff);
    float radius = 0.002;  // splash radius in UV space
    float speed = length(u_mouseDelta);
    float amplitude = min(speed * 3.0, 0.15); // faster mouse = bigger splash, but controlled
    float splat = amplitude * exp(-dist2 / radius);
    v += splat;
  }

  // Compute gradient for refraction in display shader
  float dx = (hR - hL) * 0.5;
  float dy = (hU - hD) * 0.5;

  gl_FragColor = vec4(h, v, dx, dy);
}`;

// ─── MAIN DISPLAY SHADER ────────────────────
const FRAG = `precision highp float;

uniform float u_time;
uniform vec2 u_res;
uniform vec2 u_mouse;
uniform float u_orb;
uniform vec4 u_card;    // card rect: centerX, centerY, halfW, halfH (UV space)
uniform float u_cardOn;  // 0 or 1 — card present
uniform vec4 u_card2;   // second card rect (hovered card)
uniform float u_card2On; // 0 or 1 — second card present
uniform float u_bright;  // brightness multiplier (1.0 landing, 0.65 building, 0.45 result)
uniform sampler2D u_ripple; // water ripple heightfield
uniform float u_rippleOn;   // 1.0 when ripple FBOs are active

// ─── Gradient Noise ───────────────────────────
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

// ─── Rounded Rectangle SDF ───────────────────
float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 d = abs(p) - b + r;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  float asp = u_res.x / u_res.y;

  // ─── WATER RIPPLE DISPLACEMENT ─────────────
  // Sample the ripple heightfield and use gradient for UV refraction
  // This makes the Anadol liquid distort like real water around your cursor
  vec2 rippleDisplace = vec2(0.0);
  float rippleHeight = 0.0;
  if (u_rippleOn > 0.5) {
    vec4 ripple = texture2D(u_ripple, uv);
    rippleHeight = ripple.r;
    rippleDisplace = ripple.ba * 0.025; // refraction strength — subtle, not funhouse mirror
  }

  vec2 p = (uv + rippleDisplace - 0.5) * vec2(asp, 1.0) * 2.8;

  float t = u_time * 0.035;

  // ─── Card Displacement Field ──────────────
  // The liquid bends around the card like water around a stone
  float cardDisplace = 0.0;
  float cardEdgeGlow = 0.0;
  float cardShadow = 0.0;

  if (u_cardOn > 0.5) {
    vec2 cardCenter = u_card.xy;
    vec2 cardHalf = u_card.zw;

    // SDF in UV space (aspect-corrected)
    vec2 cardP = (uv - cardCenter) * vec2(asp, 1.0);
    vec2 cardB = cardHalf * vec2(asp, 1.0);
    float cardR = 0.012; // corner radius
    float d = sdRoundBox(cardP, cardB, cardR);

    // Fluid displacement — push domain warping outward near card
    float pushZone = 0.10;
    float push = smoothstep(pushZone, 0.0, d) * 0.42;
    vec2 pushDir = normalize(cardP + 0.001);
    p += pushDir * push;

    // Bright meniscus glow at card edge
    float edgeBand = smoothstep(0.03, 0.004, abs(d)) * smoothstep(-0.012, 0.003, d);
    cardEdgeGlow = edgeBand;
    float flowNoise = fbm(cardP * 15.0 + t * 2.0) * 0.5 + 0.5;
    cardEdgeGlow *= 0.6 + flowNoise * 0.6;

    // Inner shadow
    float inner = smoothstep(0.003, -0.01, d);
    cardShadow = inner;
  }

  // ─── Card 2 Displacement Field ─────────────
  float card2EdgeGlow = 0.0;
  float card2Shadow = 0.0;

  if (u_card2On > 0.5) {
    vec2 c2Center = u_card2.xy;
    vec2 c2Half = u_card2.zw;
    vec2 c2P = (uv - c2Center) * vec2(asp, 1.0);
    vec2 c2B = c2Half * vec2(asp, 1.0);
    float c2d = sdRoundBox(c2P, c2B, 0.012);
    float push2 = smoothstep(0.10, 0.0, c2d) * 0.42;
    vec2 pushDir2 = normalize(c2P + 0.001);
    p += pushDir2 * push2;
    float edge2 = smoothstep(0.03, 0.004, abs(c2d)) * smoothstep(-0.012, 0.003, c2d);
    float flow2 = fbm(c2P * 15.0 + t * 2.0) * 0.5 + 0.5;
    card2EdgeGlow = edge2 * (0.6 + flow2 * 0.6);
    card2Shadow = smoothstep(0.003, -0.01, c2d);
  }

  // ─── Subtle Mouse Gravity (fallback + supplement) ──
  vec2 mp = (u_mouse - 0.5) * vec2(asp, 1.0) * 2.8;
  float md = length(p - mp);
  p += (mp - p) * 0.03 / (1.0 + md * 3.0); // reduced — ripples do the heavy lifting now

  // ═══════════════════════════════════════════
  // DOMAIN WARPING — The Anadol Signature
  // ═══════════════════════════════════════════

  // Latent-drift layer: a slower, larger-scale walk keeps the field feeling
  // like a self-regenerating memory space rather than a looping texture.
  vec2 latentShift = vec2(
    fbm(p * 0.42 + vec2(2.4, -1.6) - t * 0.22),
    fbm(p * 0.42 + vec2(-3.7, 4.1) + t * 0.18)
  );
  p += (latentShift - 0.5) * 0.55;

  vec2 q = vec2(
    fbm(p + vec2(0.0, 0.0) + t),
    fbm(p + vec2(5.2, 1.3) + t * 0.8)
  );

  vec2 flowP = p + vec2(q.y, -q.x) * 0.32 + (latentShift - 0.5) * 0.18;

  vec2 r = vec2(
    fbm(flowP + 4.0 * q + vec2(1.7, 9.2) + t * 0.5),
    fbm(flowP + 4.0 * q + vec2(8.3, 2.8) + t * 0.4)
  );

  vec2 s = vec2(
    fbm(flowP + 3.0 * r + vec2(3.1, 7.4) + t * 0.25),
    fbm(flowP + 3.0 * r + vec2(6.7, 4.2) + t * 0.3)
  );

  float f = fbm(flowP + 3.5 * s);
  float f2 = fbm(flowP + 3.0 * r + vec2(2.1, 4.7) + t * 0.15);
  float latentBloom = fbm(flowP * 0.58 + s * 1.7 - t * 0.08);
  float latentTrace = abs(f - f2) + abs(latentBloom - f2) * 0.55;

  float qm = length(q);
  float rm = length(r);
  float sm = length(s);

  // ═══════════════════════════════════════════
  // COLOR MAPPING
  // ═══════════════════════════════════════════

  vec3 col = vec3(0.015, 0.008, 0.035);
  col = mix(col, vec3(0.09, 0.025, 0.18), smoothstep(-0.15, 0.35, f));
  col = mix(col, vec3(0.25, 0.07, 0.45), smoothstep(0.1, 0.5, f));
  col = mix(col, vec3(0.08, 0.25, 0.60), smoothstep(0.25, 0.65, f2) * 0.55);
  col = mix(col, vec3(0.18, 0.60, 0.82), smoothstep(0.6, 0.92, f) * 0.35);
  col += vec3(0.50, 0.10, 0.32) * smoothstep(0.35, 0.75, rm) * 0.18;
  col += vec3(0.40, 0.05, 0.50) * smoothstep(0.3, 0.6, sm) * 0.12;
  col += vec3(0.12, 0.10, 0.30) * smoothstep(0.18, 0.72, latentBloom) * 0.14;

  float bright = smoothstep(0.55, 0.88, f * rm);
  col += vec3(0.40, 0.28, 0.62) * bright * 0.35;
  col += vec3(0.25, 0.45, 0.75) * pow(bright, 2.5) * 0.22;
  col += vec3(0.6, 0.5, 0.7) * pow(max(bright * sm, 0.0), 4.0) * 0.3;

  // ═══════════════════════════════════════════
  // FLOW STREAMS
  // ═══════════════════════════════════════════

  float st1 = smoothstep(0.485, 0.5, sin(f * 30.0 + t * 3.5));
  col += vec3(0.38, 0.22, 0.60) * st1 * 0.14;
  float st2 = smoothstep(0.49, 0.5, sin(f2 * 24.0 - t * 2.5));
  col += vec3(0.18, 0.38, 0.65) * st2 * 0.10;
  float veins = rfbm(p * 1.5 + s * 2.0 + t * 0.4);
  col += vec3(0.30, 0.15, 0.50) * smoothstep(0.25, 0.5, veins) * 0.08;

  // Latent contours: inspired by RAS's "algorithmic connections" language,
  // this traces soft data paths between neighboring field states.
  float contourA = 1.0 - smoothstep(0.020, 0.060, abs(latentTrace - 0.24));
  float contourB = 1.0 - smoothstep(0.012, 0.040, abs((rm - sm) + latentBloom * 0.35));
  float contourMask = smoothstep(0.14, 0.72, latentBloom) * (0.45 + smoothstep(0.20, 0.62, veins) * 0.55);
  float contourNet = max(contourA * contourMask, contourB * (0.35 + contourMask * 0.65));
  col += mix(vec3(0.34, 0.14, 0.54), vec3(0.16, 0.54, 0.94), smoothstep(0.18, 0.82, f2)) * contourNet * 0.07;

  // "Data Poems": faint connection ribbons make the field feel plotted and alive.
  float poem1 = smoothstep(0.94, 0.995, 0.5 + 0.5 * sin((f + rm * 0.10) * 32.0 - t * 4.5));
  float poem2 = smoothstep(0.95, 0.995, 0.5 + 0.5 * sin((f2 + sm * 0.12) * 28.0 + t * 3.2));
  float poemMask = smoothstep(0.18, 0.72, veins);
  col += vec3(0.50, 0.32, 0.78) * poem1 * poemMask * 0.06;
  col += vec3(0.22, 0.50, 0.85) * poem2 * (0.4 + poemMask * 0.6) * 0.05;

  // "Impossible Materials": pseudo-specular lighting gives the fluid field a
  // more architectural, fabricated surface without leaving the abstract world.
  vec2 flowNormal2 = vec2(
    (r.x - q.x) + (s.x - r.x) * 0.8,
    (r.y - q.y) + (s.y - r.y) * 0.8
  );
  vec3 normal = normalize(vec3(flowNormal2 * 0.95 + rippleDisplace * 28.0, 1.0));
  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  vec3 lightA = normalize(vec3(-0.45, 0.30, 0.84));
  vec3 lightB = normalize(vec3(0.35, -0.25, 0.90));
  float specA = pow(max(dot(normal, normalize(lightA + viewDir)), 0.0), 22.0);
  float specB = pow(max(dot(normal, normalize(lightB + viewDir)), 0.0), 36.0);
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.8);
  col += vec3(0.42, 0.30, 0.68) * specA * (0.10 + bright * 0.12);
  col += vec3(0.22, 0.55, 0.92) * specB * (0.08 + smoothstep(0.22, 0.75, latentBloom) * 0.10);
  col += mix(vec3(0.28, 0.16, 0.45), vec3(0.18, 0.48, 0.85), smoothstep(0.15, 0.85, f2)) * fresnel * 0.12;

  // ═══════════════════════════════════════════
  // WATER RIPPLE HIGHLIGHTS — specular + caustics
  // ═══════════════════════════════════════════

  if (u_rippleOn > 0.5) {
    // Brightness boost where ripple height is positive (wave crests catch light)
    col *= 1.0 + clamp(rippleHeight, -0.15, 0.15) * 0.25;
    // Subtle caustic approximation — convergent normals brighten
    float caustic = abs(rippleDisplace.x + rippleDisplace.y) * 8.0;
    col += vec3(0.3, 0.2, 0.5) * min(caustic, 0.3) * 0.08;
  }

  // ═══════════════════════════════════════════
  // CARD EFFECTS — meniscus glow + inner dim
  // ═══════════════════════════════════════════

  if (u_cardOn > 0.5) {
    col += vec3(0.45, 0.25, 0.75) * cardEdgeGlow * 0.6;
    col += vec3(0.20, 0.50, 0.80) * cardEdgeGlow * 0.3;
    col += vec3(0.6, 0.5, 0.8) * pow(cardEdgeGlow, 2.0) * 0.4;
    col *= 1.0 - cardShadow * 0.5;
    col += vec3(0.04, 0.02, 0.08) * cardShadow * smoothstep(0.3, 0.7, f) * 0.5;
  }

  // ═══════════════════════════════════════════
  // CARD 2 EFFECTS — same meniscus treatment
  // ═══════════════════════════════════════════

  if (u_card2On > 0.5) {
    col += vec3(0.45, 0.25, 0.75) * card2EdgeGlow * 0.6;
    col += vec3(0.20, 0.50, 0.80) * card2EdgeGlow * 0.3;
    col += vec3(0.6, 0.5, 0.8) * pow(card2EdgeGlow, 2.0) * 0.4;
    col *= 1.0 - card2Shadow * 0.5;
    col += vec3(0.04, 0.02, 0.08) * card2Shadow * smoothstep(0.3, 0.7, f) * 0.5;
  }

  // ═══════════════════════════════════════════
  // FINAL COMPOSITION
  // ═══════════════════════════════════════════

  float vig = 1.0 - smoothstep(0.15, 0.82, length((uv - 0.5) * vec2(1.05, 1.25)));
  col *= vig;
  col *= 0.80 + 0.20 * smoothstep(0.5, 0.0, length(uv - 0.5));

  // ═══════════════════════════════════════════
  // THE ORB
  // ═══════════════════════════════════════════

  if (u_orb > 0.5) {
  vec2 orbCenter = vec2(0.5, 0.78);
  float orbR = 0.055 + 0.003 * sin(u_time * 0.6);
  float orbD = length(uv - orbCenter);

  float angle = atan(uv.y - orbCenter.y, (uv.x - orbCenter.x) * asp);
  vec2 orbP = (uv - orbCenter) * 16.0;
  float edgeWarp = fbm(orbP * 0.8 + t * 0.5 + s) * 0.015;
  edgeWarp += 0.008 * sin(angle * 3.0 + t * 0.7 + fbm(orbP * 0.5 + t * 0.3) * 4.0);
  edgeWarp += 0.005 * sin(angle * 5.0 - t * 0.5 + fbm(orbP * 0.3 - t * 0.2) * 3.0);
  edgeWarp += 0.004 * sin(angle * 2.0 + t * 0.25);
  float warpedD = orbD + edgeWarp;

  float density = exp(-warpedD * warpedD / (orbR * orbR * 1.1));

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

  vec3 orbCol = vec3(0.04, 0.015, 0.08) * density;
  orbCol += vec3(0.28, 0.08, 0.50) * density * smoothstep(-0.1, 0.5, of) * 0.8;
  orbCol += vec3(0.10, 0.28, 0.65) * density * smoothstep(0.2, 0.6, of2) * 0.5;
  orbCol += vec3(0.20, 0.55, 0.80) * density * smoothstep(0.5, 0.85, of) * 0.3;
  orbCol += vec3(0.45, 0.10, 0.35) * density * smoothstep(0.3, 0.7, orm) * 0.25;

  float ist1 = smoothstep(0.48, 0.5, sin(of * 22.0 + t * 3.0));
  orbCol += vec3(0.35, 0.18, 0.55) * ist1 * density * 0.2;
  float ist2 = smoothstep(0.48, 0.5, sin(of2 * 18.0 - t * 2.2));
  orbCol += vec3(0.15, 0.30, 0.60) * ist2 * density * 0.15;
  orbCol += vec3(0.25, 0.10, 0.40) * density * smoothstep(0.2, 0.45, of2) * 0.15;

  float oBright = smoothstep(0.5, 0.85, of * orm);
  orbCol += vec3(0.40, 0.28, 0.65) * oBright * density * 0.35;

  float coreDensity = exp(-warpedD * warpedD / (orbR * orbR * 0.15));
  orbCol += vec3(0.50, 0.35, 0.70) * coreDensity * 0.5;
  orbCol += vec3(0.65, 0.50, 0.85) * pow(coreDensity, 3.0) * 0.35;

  float hotCore = exp(-warpedD * warpedD / (orbR * orbR * 0.04));
  orbCol += vec3(0.70, 0.60, 0.90) * hotCore * 0.3;

  vec2 specOff = vec2(-0.012, -0.016);
  float specD = length(uv - orbCenter + specOff);
  float spec = exp(-specD * specD / (orbR * orbR * 0.07));
  orbCol += vec3(0.75, 0.65, 0.95) * spec * 0.18;

  float rim = smoothstep(orbR * 0.5, orbR * 0.85, warpedD) *
              smoothstep(orbR * 1.2, orbR * 0.9, warpedD);
  orbCol += vec3(0.22, 0.10, 0.40) * rim * 0.4;

  float aura = exp(-orbD * orbD / (orbR * orbR * 4.0));
  col += vec3(0.08, 0.03, 0.15) * aura * 0.3;
  col += orbCol;
  } // end orb

  // Brightness control — dims for building/result stages
  col *= u_bright;

  // Film grain
  float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + u_time) * 43758.5453);
  col += (grain - 0.5) * 0.012;

  col = max(col, 0.0);
  col = col / (1.0 + col * 0.16);
  col = pow(col, vec3(0.96));

  gl_FragColor = vec4(col, 1.0);
}`;

// ─── RIPPLE SIMULATION RESOLUTION ───────────
const RIPPLE_SIZE = 192; // 192×192 — smooth ripples, negligible perf cost

export default function AnadolShader({ style = {}, showOrb = true, cardRef = null, card2Ref = null, brightness = 1.0 }) {
  const canvasRef = useRef(null);
  const glRef = useRef(null);
  const frameRef = useRef(0);
  const hasPaintedRef = useRef(false);
  const mouseRef = useRef([0.5, 0.5]);
  const prevMouseRef = useRef([0.5, 0.5]);
  const mouseDeltaRef = useRef([0, 0]);
  const mouseMovingRef = useRef(0); // decays to 0 when mouse stops
  const startRef = useRef(0);
  const showOrbRef = useRef(showOrb);
  const cardUniformRef = useRef([0, 0, 0, 0]);
  const cardOnRef = useRef(0);
  const card2UniformRef = useRef([0, 0, 0, 0]);
  const card2OnRef = useRef(0);
  const brightnessRef = useRef(brightness);
  const brightCurrentRef = useRef(brightness);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => { showOrbRef.current = showOrb; }, [showOrb]);
  useEffect(() => { brightnessRef.current = brightness; }, [brightness]);

  // Track card position in UV space
  const updateCardRect = useCallback(() => {
    if (!cardRef?.current) {
      cardOnRef.current = 0;
      return;
    }
    const rect = cardRef.current.getBoundingClientRect();
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = (rect.left + rect.width / 2) / w;
    const cy = 1.0 - (rect.top + rect.height / 2) / h;
    const hw = (rect.width / 2) / w;
    const hh = (rect.height / 2) / h;
    cardUniformRef.current = [cx, cy, hw, hh];
    cardOnRef.current = 1;
  }, [cardRef]);

  const updateCard2Rect = useCallback(() => {
    if (!card2Ref?.current) {
      card2OnRef.current = 0;
      return;
    }
    const rect = card2Ref.current.getBoundingClientRect();
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = (rect.left + rect.width / 2) / w;
    const cy = 1.0 - (rect.top + rect.height / 2) / h;
    const hw = (rect.width / 2) / w;
    const hh = (rect.height / 2) / h;
    card2UniformRef.current = [cx, cy, hw, hh];
    card2OnRef.current = 1;
  }, [card2Ref]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    hasPaintedRef.current = false;
    setIsReady(false);

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) return;
    glRef.current = gl;

    // ─── SHADER COMPILATION ─────────────────
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

    function linkProgram(vertSrc, fragSrc) {
      const vs = compile(gl.VERTEX_SHADER, vertSrc);
      const fs = compile(gl.FRAGMENT_SHADER, fragSrc);
      if (!vs || !fs) return null;
      const prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.warn('Shader link error:', gl.getProgramInfoLog(prog));
        return null;
      }
      return prog;
    }

    // Main Anadol display program
    const displayProg = linkProgram(VERT, FRAG);
    if (!displayProg) return;

    // Ripple simulation program
    const rippleProg = linkProgram(VERT, RIPPLE_FRAG);

    // ─── SHARED QUAD BUFFER ─────────────────
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    // ─── DISPLAY SHADER UNIFORMS ────────────
    gl.useProgram(displayProg);
    const displayPosLoc = gl.getAttribLocation(displayProg, 'a_pos');
    const uTime = gl.getUniformLocation(displayProg, 'u_time');
    const uRes = gl.getUniformLocation(displayProg, 'u_res');
    const uMouse = gl.getUniformLocation(displayProg, 'u_mouse');
    const uOrb = gl.getUniformLocation(displayProg, 'u_orb');
    const uCard = gl.getUniformLocation(displayProg, 'u_card');
    const uCardOn = gl.getUniformLocation(displayProg, 'u_cardOn');
    const uCard2 = gl.getUniformLocation(displayProg, 'u_card2');
    const uCard2On = gl.getUniformLocation(displayProg, 'u_card2On');
    const uBright = gl.getUniformLocation(displayProg, 'u_bright');
    const uRipple = gl.getUniformLocation(displayProg, 'u_ripple');
    const uRippleOn = gl.getUniformLocation(displayProg, 'u_rippleOn');

    // ─── RIPPLE PING-PONG FBOs ──────────────
    let rippleA = null, rippleB = null;
    let hasRipple = false;

    if (rippleProg) {
      // Try half-float, then float, then unsigned byte
      const halfFloatExt = gl.getExtension('OES_texture_half_float');
      gl.getExtension('OES_texture_half_float_linear');
      const floatExt = gl.getExtension('OES_texture_float');
      gl.getExtension('OES_texture_float_linear');

      function createRippleFBO(texType) {
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, RIPPLE_SIZE, RIPPLE_SIZE, 0, gl.RGBA, texType, null);

        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        if (status !== gl.FRAMEBUFFER_COMPLETE) {
          gl.deleteTexture(tex);
          gl.deleteFramebuffer(fbo);
          return null;
        }
        return { tex, fbo };
      }

      // Try formats in order of preference
      const types = [];
      if (halfFloatExt) types.push(halfFloatExt.HALF_FLOAT_OES);
      if (floatExt) types.push(gl.FLOAT);
      types.push(gl.UNSIGNED_BYTE);

      for (const type of types) {
        rippleA = createRippleFBO(type);
        if (rippleA) {
          rippleB = createRippleFBO(type);
          if (rippleB) {
            hasRipple = true;
            break;
          }
          // Clean up A if B failed
          gl.deleteTexture(rippleA.tex);
          gl.deleteFramebuffer(rippleA.fbo);
          rippleA = null;
        }
      }

      if (hasRipple) {
        // Clear both FBOs to zero
        [rippleA, rippleB].forEach(r => {
          gl.bindFramebuffer(gl.FRAMEBUFFER, r.fbo);
          gl.viewport(0, 0, RIPPLE_SIZE, RIPPLE_SIZE);
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
        });
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
    }

    // Ripple shader uniforms
    let rUPrev, rUTexel, rUMouse, rUMouseDelta, rUMouseDown, ripplePosLoc;
    if (hasRipple) {
      gl.useProgram(rippleProg);
      ripplePosLoc = gl.getAttribLocation(rippleProg, 'a_pos');
      rUPrev = gl.getUniformLocation(rippleProg, 'u_prev');
      rUTexel = gl.getUniformLocation(rippleProg, 'u_texel');
      rUMouse = gl.getUniformLocation(rippleProg, 'u_mouse');
      rUMouseDelta = gl.getUniformLocation(rippleProg, 'u_mouseDelta');
      rUMouseDown = gl.getUniformLocation(rippleProg, 'u_mouseDown');
    }

    // ─── RESIZE ─────────────────────────────
    function resize() {
      const mobile = window.innerWidth < 768;
      const scale = mobile ? 0.35 : 0.5;
      canvas.width = Math.floor(window.innerWidth * scale);
      canvas.height = Math.floor(window.innerHeight * scale);
    }
    resize();
    window.addEventListener('resize', resize);

    // ─── MOUSE TRACKING ─────────────────────
    function onMouse(e) {
      const mx = e.clientX / window.innerWidth;
      const my = 1.0 - e.clientY / window.innerHeight;
      prevMouseRef.current = [...mouseRef.current];
      mouseRef.current = [mx, my];
      mouseDeltaRef.current = [
        mx - prevMouseRef.current[0],
        my - prevMouseRef.current[1],
      ];
      mouseMovingRef.current = 1.0;
    }
    window.addEventListener('mousemove', onMouse, { passive: true });

    // Touch support for mobile
    function onTouch(e) {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const mx = touch.clientX / window.innerWidth;
        const my = 1.0 - touch.clientY / window.innerHeight;
        prevMouseRef.current = [...mouseRef.current];
        mouseRef.current = [mx, my];
        mouseDeltaRef.current = [
          mx - prevMouseRef.current[0],
          my - prevMouseRef.current[1],
        ];
        mouseMovingRef.current = 1.0;
      }
    }
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('touchstart', onTouch, { passive: true });

    // ─── RENDER LOOP ────────────────────────
    startRef.current = performance.now();
    let pingPong = 0; // 0 = read A write B, 1 = read B write A

    function render() {
      const time = (performance.now() - startRef.current) * 0.001;

      updateCardRect();
      updateCard2Rect();
      brightCurrentRef.current += (brightnessRef.current - brightCurrentRef.current) * 0.08;

      // Decay mouse moving flag
      mouseMovingRef.current *= 0.92;

      // ═══ PASS 1: RIPPLE SIMULATION ═══
      if (hasRipple) {
        const readFBO = pingPong === 0 ? rippleA : rippleB;
        const writeFBO = pingPong === 0 ? rippleB : rippleA;

        gl.useProgram(rippleProg);
        gl.bindFramebuffer(gl.FRAMEBUFFER, writeFBO.fbo);
        gl.viewport(0, 0, RIPPLE_SIZE, RIPPLE_SIZE);

        // Bind previous state texture to unit 0
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, readFBO.tex);
        gl.uniform1i(rUPrev, 0);
        gl.uniform2f(rUTexel, 1.0 / RIPPLE_SIZE, 1.0 / RIPPLE_SIZE);
        gl.uniform2f(rUMouse, mouseRef.current[0], mouseRef.current[1]);
        gl.uniform2f(rUMouseDelta, mouseDeltaRef.current[0], mouseDeltaRef.current[1]);
        gl.uniform1f(rUMouseDown, mouseMovingRef.current > 0.1 ? 1.0 : 0.0);

        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.enableVertexAttribArray(ripplePosLoc);
        gl.vertexAttribPointer(ripplePosLoc, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Swap ping-pong
        pingPong = 1 - pingPong;
      }

      // ═══ PASS 2: DISPLAY (Anadol shader) ═══
      gl.useProgram(displayProg);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);

      // Bind ripple texture to unit 0 for display shader
      if (hasRipple) {
        const currentRipple = pingPong === 0 ? rippleA : rippleB;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, currentRipple.tex);
        gl.uniform1i(uRipple, 0);
        gl.uniform1f(uRippleOn, 1.0);
      } else {
        gl.uniform1f(uRippleOn, 0.0);
      }

      gl.uniform1f(uTime, time);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uMouse, mouseRef.current[0], mouseRef.current[1]);
      gl.uniform1f(uOrb, showOrbRef.current ? 1.0 : 0.0);
      gl.uniform4f(uCard, ...cardUniformRef.current);
      gl.uniform1f(uCardOn, cardOnRef.current);
      gl.uniform4f(uCard2, ...card2UniformRef.current);
      gl.uniform1f(uCard2On, card2OnRef.current);
      gl.uniform1f(uBright, brightCurrentRef.current);

      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(displayPosLoc);
      gl.vertexAttribPointer(displayPosLoc, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (!hasPaintedRef.current) {
        hasPaintedRef.current = true;
        setIsReady(true);
      }

      // Clear mouse delta each frame (prevents stale splats)
      mouseDeltaRef.current = [0, 0];

      frameRef.current = requestAnimationFrame(render);
    }
    render();

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('touchstart', onTouch);
      // Cleanup FBOs
      if (rippleA) { gl.deleteTexture(rippleA.tex); gl.deleteFramebuffer(rippleA.fbo); }
      if (rippleB) { gl.deleteTexture(rippleB.tex); gl.deleteFramebuffer(rippleB.fbo); }
    };
  }, [updateCardRect, updateCard2Rect]);

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
        opacity: isReady ? 1 : 0,
        transition: 'opacity 520ms ease',
        ...style,
      }}
    />
  );
}
