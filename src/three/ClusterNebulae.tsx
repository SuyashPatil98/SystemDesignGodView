import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { computeClusterNebulae } from './layout';
import { useGraphStore } from '../store/useGraphStore';

// Large soft glow clouds at each super-cluster centre — the 6 thematic
// regions now feel like nebulae the domains float inside.
//
// 6 individual billboarded plane meshes with a shared shader material that
// draws an fbm-modulated radial gradient. Cheap and tasteful.

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  precision mediump float;
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uColor;
  uniform float uSeed;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 c = 2.0 * vUv - 1.0;
    float r = length(c);
    if (r > 1.0) discard;

    float core = smoothstep(1.0, 0.0, r);
    vec2 q = c * 1.7 + vec2(uTime * 0.020 + uSeed * 7.0, -uTime * 0.015 + uSeed * 3.0);
    float n = fbm(q);
    float shape = mix(0.5, 1.0, n) * core;

    float breath = 0.85 + 0.15 * sin(uTime * 0.35 + uSeed * 6.28);

    vec3 col = uColor * (0.85 + 0.55 * n);
    float alpha = pow(shape, 1.8) * uOpacity * breath;
    gl_FragColor = vec4(col, alpha);
  }
`;

function NebulaSprite({
  position,
  scale,
  seed,
  baseOpacity,
  ambientOpacity,
}: {
  position: THREE.Vector3;
  scale: number;
  seed: number;
  baseOpacity: number;
  ambientOpacity: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { camera } = useThree();
  const palette = useGraphStore((s) => s.palette);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: baseOpacity * ambientOpacity },
        uColor: { value: new THREE.Color('#5EEAB7') },
        uSeed: { value: seed },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    // base/ambient updated via useFrame so we can transition smoothly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  // Palette toggle wiring.
  useEffect(() => {
    const hex = palette === 'mint' ? '#5EEAB7' : '#B5A0FF';
    (material.uniforms.uColor.value as THREE.Color).set(hex);
  }, [palette, material]);

  // Cleanup.
  useEffect(() => () => material.dispose(), [material]);

  useFrame((_, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += delta;
      const target = baseOpacity * ambientOpacity;
      const cur = matRef.current.uniforms.uOpacity.value as number;
      matRef.current.uniforms.uOpacity.value = cur + (target - cur) * 0.08;
    }
    const mesh = meshRef.current;
    if (mesh) mesh.lookAt(camera.position);
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={[scale, scale, 1]}
      renderOrder={-2}
      raycast={() => null}
    >
      <planeGeometry args={[1, 1]} />
      <primitive ref={matRef} object={material} attach="material" />
    </mesh>
  );
}

interface ClusterNebulaeProps {
  ambientOpacity?: number; // 0..1, dims everything during focus mode
}

export default function ClusterNebulae({ ambientOpacity = 1 }: ClusterNebulaeProps) {
  const nebulae = useMemo(() => computeClusterNebulae(), []);
  return (
    <group>
      {nebulae.map((n, i) => (
        <NebulaSprite
          key={n.id}
          position={n.position}
          scale={170 + i * 10}
          seed={i * 1.7 + 0.31}
          baseOpacity={0.18}
          ambientOpacity={ambientOpacity}
        />
      ))}
    </group>
  );
}
