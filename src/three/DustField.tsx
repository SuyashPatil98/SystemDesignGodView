import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGraphStore } from '../store/useGraphStore';

// Slow-drifting dust particles inside the galaxy. They give depth cues when
// you fly through space — without them, motion against a starfield can feel
// disconnected.
//
// Each particle owns a per-frame velocity. When it leaves the bounding
// sphere, it wraps to the opposite side. Lightweight Points shader handles
// look + soft fade.

const COUNT = 700;
const SPHERE_RADIUS = 150;

const VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aBright;
  attribute float aPhase;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vBright;
  varying float vFade;
  void main() {
    vBright = aBright;
    vFade = 0.55 + 0.45 * sin(uTime * 0.7 + aPhase);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPixelRatio * (220.0 / max(40.0, -mvPosition.z));
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT = /* glsl */ `
  precision mediump float;
  uniform float uAmbient;
  uniform vec3  uMint;
  varying float vBright;
  varying float vFade;
  void main() {
    vec2 c = 2.0 * gl_PointCoord - 1.0;
    float r = dot(c, c);
    if (r > 1.0) discard;
    float a = smoothstep(1.0, 0.0, r) * 0.35 * vFade * uAmbient;
    gl_FragColor = vec4(uMint * (0.55 + vBright * 0.6), a);
  }
`;

interface Props {
  ambientOpacity?: number;
}

export default function DustField({ ambientOpacity = 1 }: Props) {
  const meshRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const palette = useGraphStore((s) => s.palette);

  const { geometry, velocities } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);
    const phases = new Float32Array(COUNT);
    const brights = new Float32Array(COUNT);
    const vels = new Float32Array(COUNT * 3);

    for (let i = 0; i < COUNT; i++) {
      const u = Math.random();
      const r = SPHERE_RADIUS * Math.cbrt(u);
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      brights[i] = 0.55 + Math.random() * 0.45;
      sizes[i] = 1.4 + Math.random() * 2.4;
      phases[i] = Math.random() * Math.PI * 2;

      vels[i * 3 + 0] = (Math.random() - 0.5) * 1.4;
      vels[i * 3 + 1] = (Math.random() - 0.5) * 1.4;
      vels[i * 3 + 2] = (Math.random() - 0.5) * 1.4;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aBright', new THREE.BufferAttribute(brights, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    return { geometry: geo, velocities: vels };
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: Math.min(2, window.devicePixelRatio || 1) },
          uAmbient: { value: 1 },
          uMint: { value: new THREE.Color('#5EEAB7').multiplyScalar(0.55) },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  // Palette toggle wiring.
  useEffect(() => {
    const hex = palette === 'mint' ? '#5EEAB7' : '#B5A0FF';
    (material.uniforms.uMint.value as THREE.Color).set(hex).multiplyScalar(0.55);
  }, [palette, material]);

  // Cleanup.
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((_, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += delta;
      const cur = matRef.current.uniforms.uAmbient.value as number;
      matRef.current.uniforms.uAmbient.value = cur + (ambientOpacity - cur) * 0.08;
    }
    const points = meshRef.current;
    if (!points) return;
    const posAttr = points.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const r2 = SPHERE_RADIUS * SPHERE_RADIUS;
    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3;
      arr[ix] += velocities[ix] * delta;
      arr[ix + 1] += velocities[ix + 1] * delta;
      arr[ix + 2] += velocities[ix + 2] * delta;
      // Wrap when outside sphere.
      const dx = arr[ix];
      const dy = arr[ix + 1];
      const dz = arr[ix + 2];
      if (dx * dx + dy * dy + dz * dz > r2) {
        arr[ix] = -dx * 0.95;
        arr[ix + 1] = -dy * 0.95;
        arr[ix + 2] = -dz * 0.95;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={meshRef} geometry={geometry} frustumCulled={false}>
      <primitive ref={matRef} object={material} attach="material" />
    </points>
  );
}
