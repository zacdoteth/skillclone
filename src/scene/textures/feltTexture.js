import * as THREE from 'three';

// Procedural dark teal felt with fiber noise and spotlight gradient
export function createFeltTexture(w = 512, h = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Base gradient — dark teal
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#0a2430');
  grad.addColorStop(0.3, '#0f2d3c');
  grad.addColorStop(0.7, '#134050');
  grad.addColorStop(1, '#164858');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Radial spotlight — dealer light hitting the felt
  const spot = ctx.createRadialGradient(w * 0.5, h * 0.3, 0, w * 0.5, h * 0.3, w * 0.6);
  spot.addColorStop(0, 'rgba(30, 90, 110, 0.12)');
  spot.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, w, h);

  // Fiber noise — tiny dots to simulate felt texture
  const rng = (s) => { s = Math.sin(s) * 43758.5453; return s - Math.floor(s); };
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const px = (i / 4) % w;
    const py = Math.floor((i / 4) / w);
    // Fine fiber noise
    const noise = (rng(px * 0.37 + py * 1.13 + 7.7) - 0.5) * 8;
    // Coarser fiber direction
    const fiber = (rng(Math.floor(px / 2) * 0.71 + Math.floor(py / 3) * 2.31) - 0.5) * 4;
    const total = noise + fiber;
    data[i] = Math.max(0, Math.min(255, data[i] + total));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + total));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + total));
  }
  ctx.putImageData(imgData, 0, 0);

  // Faint dot grid — like the original CSS background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.012)';
  for (let x = 0; x < w; x += 6) {
    for (let y = 0; y < h; y += 6) {
      ctx.beginPath();
      ctx.arc(x, y, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
