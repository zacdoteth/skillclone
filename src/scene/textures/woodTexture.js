import * as THREE from 'three';

// Procedural dark wood texture — ported from Shed scene.module.js
export function createWoodTexture(seed = 42, w = 256, h = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  const baseColors = ['#3A2210', '#4A3018', '#352010', '#3E2815', '#2E1A0C'];
  const rng = (s) => { s = Math.sin(s) * 43758.5453; return s - Math.floor(s); };
  const base = baseColors[(seed * 7 + 3) % baseColors.length];

  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // Wood grain lines
  const grainCount = 40 + Math.floor(rng(seed * 13) * 30);
  for (let i = 0; i < grainCount; i++) {
    const y = rng(seed * 100 + i * 7.3) * h;
    const thickness = 0.5 + rng(seed * 200 + i * 3.1) * 2.5;
    const alpha = 0.03 + rng(seed * 300 + i * 11.7) * 0.12;
    const isDark = rng(seed * 400 + i * 5.9) > 0.4;

    ctx.strokeStyle = isDark
      ? `rgba(20, 10, 0, ${alpha})`
      : `rgba(180, 140, 80, ${alpha * 0.6})`;
    ctx.lineWidth = thickness;
    ctx.beginPath();

    const waveAmp = 1 + rng(seed * 500 + i) * 4;
    const waveFreq = 0.005 + rng(seed * 600 + i) * 0.015;
    for (let x = 0; x < w; x += 2) {
      const yOff = Math.sin(x * waveFreq + seed + i) * waveAmp;
      if (x === 0) ctx.moveTo(x, y + yOff);
      else ctx.lineTo(x, y + yOff);
    }
    ctx.stroke();
  }

  // Wood knots
  const knotCount = Math.floor(rng(seed * 700) * 3) + 1;
  for (let k = 0; k < knotCount; k++) {
    const kx = rng(seed * 800 + k * 17) * w;
    const ky = rng(seed * 900 + k * 23) * h;
    const kr = 8 + rng(seed * 1000 + k) * 25;

    for (let r = kr; r > 2; r -= 2) {
      const alpha = 0.04 + (1 - r / kr) * 0.08;
      ctx.strokeStyle = `rgba(30, 15, 0, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(kx, ky, r, r * (0.4 + rng(seed * 1100 + k) * 0.4), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(25, 12, 0, 0.15)';
    ctx.beginPath();
    ctx.arc(kx, ky, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Noise overlay
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (rng(i * 0.01 + seed) - 0.5) * 12;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
