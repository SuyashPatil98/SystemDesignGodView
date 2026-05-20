import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Procedural cube environment map.
//
// We bake six 256² canvas faces — dark base + radial colored gradient tinted
// per face to match the galaxy's cluster palette + sparse star dots. Then
// PMREMGenerator turns it into a pre-filtered IBL texture so PBR materials
// (the domain crystals) get believable rough/glossy reflections at every
// roughness level.

const TINTS: [string, string][] = [
  ['#22d3ee', '#0e7490'], // +X cyan
  ['#a78bfa', '#5b21b6'], // -X violet
  ['#facc15', '#854d0e'], // +Y gold
  ['#7c3aed', '#1e1b4b'], // -Y deep purple
  ['#f472b6', '#9d174d'], // +Z pink
  ['#34d399', '#065f46'], // -Z emerald
];

const SIZE = 256;
const STARS_PER_FACE = 220;

function makeFace(bright: string, dim: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = SIZE;
  const ctx = c.getContext('2d')!;

  // Base — deep blue-black.
  ctx.fillStyle = '#03050b';
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Off-centre radial glow so faces aren't symmetric (avoids visible cube seams).
  const cx = SIZE * (0.3 + Math.random() * 0.4);
  const cy = SIZE * (0.3 + Math.random() * 0.4);
  const g1 = ctx.createRadialGradient(cx, cy, 4, cx, cy, SIZE * 0.65);
  g1.addColorStop(0, bright + 'aa');
  g1.addColorStop(0.45, dim + '55');
  g1.addColorStop(1, '#03050b00');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // A second softer cloud for depth.
  const cx2 = SIZE - cx;
  const cy2 = SIZE - cy;
  const g2 = ctx.createRadialGradient(cx2, cy2, 4, cx2, cy2, SIZE * 0.45);
  g2.addColorStop(0, dim + '88');
  g2.addColorStop(1, '#03050b00');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Sparse stars.
  for (let i = 0; i < STARS_PER_FACE; i++) {
    const x = Math.random() * SIZE;
    const y = Math.random() * SIZE;
    const r = Math.pow(Math.random(), 4) * 1.6 + 0.3;
    const a = 0.4 + Math.random() * 0.6;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
    ctx.fill();
  }

  return c;
}

function makeCubeTexture(): THREE.CubeTexture {
  const faces = TINTS.map(([b, d]) => makeFace(b, d));
  const tex = new THREE.CubeTexture(faces);
  tex.needsUpdate = true;
  tex.mapping = THREE.CubeReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// React component — runs once at mount, attaches the prefiltered env to the
// scene, and disposes on unmount.
export default function EnvSetup() {
  const { gl, scene } = useThree();

  useEffect(() => {
    const cubeTex = makeCubeTexture();
    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileCubemapShader();
    const rt = pmrem.fromCubemap(cubeTex);

    scene.environment = rt.texture;
    // We deliberately do NOT set scene.background — Starfield + Nebulae handle that.

    return () => {
      scene.environment = null;
      pmrem.dispose();
      rt.dispose();
      cubeTex.dispose();
    };
  }, [gl, scene]);

  return null;
}
