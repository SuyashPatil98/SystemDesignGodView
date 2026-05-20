import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Three depth layers of stars, each with its own colour palette and twinkle
// phase. A custom shader gives every star an independent sine-wave shimmer.

interface LayerSpec {
  count: number;
  radius: number;
  radiusJitter: number; // 0..1
  baseSize: number;     // pixels at unit distance
  sizeJitter: number;   // 0..1
  twinkleAmp: number;   // 0..1
  twinkleSpeed: number; // rad/sec multiplier
  rotationSpeed: number;
  palette: string[];
  paletteWeight: number; // chance of palette color vs default warm white
}

const LAYERS: LayerSpec[] = [
  {
    // Far dim dust.
    count: 3200,
    radius: 460,
    radiusJitter: 0.18,
    baseSize: 1.6,
    sizeJitter: 0.6,
    twinkleAmp: 0.25,
    twinkleSpeed: 0.6,
    rotationSpeed: 0.003,
    palette: ['#cbd5e1', '#94a3b8', '#a5b4fc', '#fde68a'],
    paletteWeight: 0.35,
  },
  {
    // Mid stars — most variety, most twinkle.
    count: 1100,
    radius: 360,
    radiusJitter: 0.22,
    baseSize: 2.6,
    sizeJitter: 0.7,
    twinkleAmp: 0.55,
    twinkleSpeed: 1.1,
    rotationSpeed: 0.005,
    palette: ['#ffffff', '#f0abfc', '#67e8f9', '#fda4af', '#fde047', '#bae6fd'],
    paletteWeight: 0.7,
  },
  {
    // Foreground sparkles — few, bright, very slow twinkle.
    count: 90,
    radius: 280,
    radiusJitter: 0.35,
    baseSize: 5.2,
    sizeJitter: 0.5,
    twinkleAmp: 0.65,
    twinkleSpeed: 0.45,
    rotationSpeed: 0.008,
    palette: ['#f9a8d4', '#fde68a', '#67e8f9', '#a78bfa', '#86efac'],
    paletteWeight: 0.9,
  },
];

const VERTEX = /* glsl */ `
  attribute float aPhase;
  attribute float aSize;
  attribute float aSpeed;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    vColor = aColor;
    vTwinkle = aPhase + uTime * aSpeed;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPixelRatio * (260.0 / max(20.0, -mvPosition.z));
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT = /* glsl */ `
  precision mediump float;
  uniform float uAmp;
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    vec2 c = 2.0 * gl_PointCoord - 1.0;
    float r2 = dot(c, c);
    if (r2 > 1.0) discard;
    // Soft round star with a tiny cross-flare for the bigger ones.
    float core = smoothstep(1.0, 0.0, r2);
    float flare = smoothstep(0.04, 0.0, abs(c.x) * abs(c.y));
    float k = 0.55 + uAmp * sin(vTwinkle);
    float alpha = (core * 0.9 + flare * 0.18) * k;
    gl_FragColor = vec4(vColor * (0.7 + 0.6 * k), alpha);
  }
`;

function buildLayer(spec: LayerSpec) {
  const positions = new Float32Array(spec.count * 3);
  const colors = new Float32Array(spec.count * 3);
  const phases = new Float32Array(spec.count);
  const sizes = new Float32Array(spec.count);
  const speeds = new Float32Array(spec.count);

  const paletteColors = spec.palette.map((c) => new THREE.Color(c));

  for (let i = 0; i < spec.count; i++) {
    const r =
      spec.radius * (1 - spec.radiusJitter + Math.random() * spec.radiusJitter * 2);
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    const usePalette = Math.random() < spec.paletteWeight;
    let c: THREE.Color;
    if (usePalette) {
      c = paletteColors[
        Math.floor(Math.random() * paletteColors.length)
      ].clone();
    } else {
      c = new THREE.Color().setHSL(
        0.08 + Math.random() * 0.06,
        0.25,
        0.55 + Math.random() * 0.3,
      );
    }
    // Brightness jitter — sprinkles of bright + many dim.
    const brightness = Math.pow(Math.random(), 2.5) * 0.7 + 0.3;
    c.multiplyScalar(brightness);
    colors[i * 3 + 0] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;

    phases[i] = Math.random() * Math.PI * 2;
    sizes[i] =
      spec.baseSize * (1 - spec.sizeJitter + Math.random() * spec.sizeJitter * 2);
    speeds[i] = spec.twinkleSpeed * (0.6 + Math.random() * 0.8);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
  return geo;
}

export default function Starfield() {
  const groupRef = useRef<THREE.Group>(null);

  const layers = useMemo(() => {
    return LAYERS.map((spec) => {
      const geo = buildLayer(spec);
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uAmp: { value: spec.twinkleAmp },
          uPixelRatio: { value: Math.min(2, window.devicePixelRatio || 1) },
        },
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: false,
      });
      const points = new THREE.Points(geo, mat);
      points.frustumCulled = false;
      return { points, mat, spec };
    });
  }, []);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    for (const { mat, spec } of layers) {
      mat.uniforms.uTime.value += delta;
      // Each layer rotates at its own pace for subtle parallax.
      const child = g.getObjectByName(`layer-${LAYERS.indexOf(spec)}`);
      if (child) child.rotation.y += delta * spec.rotationSpeed;
    }
  });

  return (
    <group ref={groupRef}>
      {layers.map(({ points }, i) => (
        <primitive
          key={i}
          object={points}
          name={`layer-${i}`}
        />
      ))}
    </group>
  );
}
