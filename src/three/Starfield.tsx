import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGraphStore } from '../store/useGraphStore';

// Surface .05 — three depth layers of stars, each twinkling on its own phase.
// All per-layer rainbow palettes collapsed to a single mint tint controlled
// by a `uMint` uniform that subscribes to the palette store. Brightness still
// varies per star to keep visual texture.

interface LayerSpec {
  count: number;
  radius: number;
  radiusJitter: number; // 0..1
  baseSize: number;
  sizeJitter: number;
  twinkleAmp: number;
  twinkleSpeed: number;
  rotationSpeed: number;
  baseAlpha: number; // 0..1 — overall layer opacity
}

const LAYERS: LayerSpec[] = [
  { count: 3200, radius: 460, radiusJitter: 0.18, baseSize: 1.6, sizeJitter: 0.6, twinkleAmp: 0.25, twinkleSpeed: 0.6,  rotationSpeed: 0.003, baseAlpha: 0.55 },
  { count: 1100, radius: 360, radiusJitter: 0.22, baseSize: 2.6, sizeJitter: 0.7, twinkleAmp: 0.55, twinkleSpeed: 1.1,  rotationSpeed: 0.005, baseAlpha: 0.7  },
  { count:   90, radius: 280, radiusJitter: 0.35, baseSize: 5.2, sizeJitter: 0.5, twinkleAmp: 0.65, twinkleSpeed: 0.45, rotationSpeed: 0.008, baseAlpha: 0.85 },
];

const VERTEX = /* glsl */ `
  attribute float aPhase;
  attribute float aSize;
  attribute float aSpeed;
  attribute float aBright;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vBright;
  varying float vTwinkle;
  void main() {
    vBright = aBright;
    vTwinkle = aPhase + uTime * aSpeed;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPixelRatio * (260.0 / max(20.0, -mvPosition.z));
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT = /* glsl */ `
  precision mediump float;
  uniform float uAmp;
  uniform float uAlpha;
  uniform vec3  uMint;
  varying float vBright;
  varying float vTwinkle;
  void main() {
    vec2 c = 2.0 * gl_PointCoord - 1.0;
    float r2 = dot(c, c);
    if (r2 > 1.0) discard;
    float core = smoothstep(1.0, 0.0, r2);
    float flare = smoothstep(0.04, 0.0, abs(c.x) * abs(c.y));
    float k = 0.55 + uAmp * sin(vTwinkle);
    float a = (core * 0.9 + flare * 0.18) * k * uAlpha;
    // Mostly white core with a soft mint wash on the brightest stars only.
    vec3 col = mix(uMint, vec3(1.0), pow(vBright, 1.6));
    gl_FragColor = vec4(col * (0.55 + 0.45 * vBright), a);
  }
`;

function buildLayer(spec: LayerSpec) {
  const positions = new Float32Array(spec.count * 3);
  const phases = new Float32Array(spec.count);
  const sizes = new Float32Array(spec.count);
  const speeds = new Float32Array(spec.count);
  const brights = new Float32Array(spec.count);

  for (let i = 0; i < spec.count; i++) {
    const r =
      spec.radius * (1 - spec.radiusJitter + Math.random() * spec.radiusJitter * 2);
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    phases[i] = Math.random() * Math.PI * 2;
    sizes[i] = spec.baseSize * (1 - spec.sizeJitter + Math.random() * spec.sizeJitter * 2);
    speeds[i] = spec.twinkleSpeed * (0.6 + Math.random() * 0.8);
    // Brightness: pow distribution → many dim, few bright.
    brights[i] = Math.pow(Math.random(), 2.5) * 0.7 + 0.3;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
  geo.setAttribute('aBright', new THREE.BufferAttribute(brights, 1));
  return geo;
}

export default function Starfield() {
  const groupRef = useRef<THREE.Group>(null);
  const palette = useGraphStore((s) => s.palette);

  const layers = useMemo(() => {
    return LAYERS.map((spec) => {
      const geo = buildLayer(spec);
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uAmp: { value: spec.twinkleAmp },
          uAlpha: { value: spec.baseAlpha },
          uMint: { value: new THREE.Color('#5EEAB7') },
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

  // Palette toggle wiring.
  useEffect(() => {
    const hex = palette === 'mint' ? '#5EEAB7' : '#B5A0FF';
    for (const { mat } of layers) (mat.uniforms.uMint.value as THREE.Color).set(hex);
  }, [palette, layers]);

  // Cleanup.
  useEffect(() => {
    return () => {
      for (const { points, mat } of layers) {
        points.geometry.dispose();
        mat.dispose();
      }
    };
  }, [layers]);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    for (const { mat, spec } of layers) {
      mat.uniforms.uTime.value += delta;
      const child = g.getObjectByName(`layer-${LAYERS.indexOf(spec)}`);
      if (child) child.rotation.y += delta * spec.rotationSpeed;
    }
  });

  return (
    <group ref={groupRef}>
      {layers.map(({ points }, i) => (
        <primitive key={i} object={points} name={`layer-${i}`} />
      ))}
    </group>
  );
}
