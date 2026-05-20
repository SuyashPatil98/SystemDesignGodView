import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { GNode } from '../data/schema';
import type { Positioned } from './layout';

interface Props {
  nodes: GNode[];
  layout: Map<string, Positioned>;
  domainIds: Set<string>;
}

// Lens-flare halos rendered as additively blended billboards on each domain.
// They make domains read as luminous celestial bodies when the camera looks
// at them, especially in the middle distance.
//
// One instanced mesh of camera-facing quads. Per-frame: orient toward camera,
// scale by a distance-based curve so the flare fades when way too close or
// way too far.

const FLARE_NEAR = 28;
const FLARE_FAR = 320;

const VERTEX = /* glsl */ `
  attribute vec3 aColor;
  varying vec3 vColor;
  varying vec2 vUv;
  void main() {
    vColor = aColor;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Lens-flare-ish texture: bright core + anamorphic horizontal streak + diagonal cross flare.
const FRAGMENT = /* glsl */ `
  precision mediump float;
  uniform float uTime;
  varying vec3 vColor;
  varying vec2 vUv;
  void main() {
    vec2 c = 2.0 * vUv - 1.0;
    float r = length(c);
    if (r > 1.0) discard;

    // Soft round core.
    float core = pow(1.0 - r, 3.0);

    // Anamorphic horizontal streak.
    float streak = exp(-pow(c.y, 2.0) * 36.0) * exp(-pow(c.x, 2.0) * 0.7);
    streak *= smoothstep(1.0, 0.85, r);

    // Diagonal cross flare (subtle).
    float spike1 = exp(-pow(c.x - c.y, 2.0) * 48.0) * exp(-r * 1.4);
    float spike2 = exp(-pow(c.x + c.y, 2.0) * 48.0) * exp(-r * 1.4);

    float intensity = core * 1.4 + streak * 0.45 + (spike1 + spike2) * 0.25;
    float twinkle = 0.85 + 0.15 * sin(uTime * 1.3 + vColor.r * 11.0 + vColor.b * 7.0);

    gl_FragColor = vec4(vColor * intensity * twinkle, intensity * 0.85);
  }
`;

export default function DomainLensFlares({ nodes, layout, domainIds }: Props) {
  const { camera } = useThree();
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const domains = useMemo(
    () => nodes.filter((n) => domainIds.has(n.id)),
    [nodes, domainIds],
  );

  const { geometry, material } = useMemo(() => {
    const colors = new Float32Array(domains.length * 3);
    domains.forEach((d, i) => {
      const c = layout.get(d.id)?.color ?? new THREE.Color('#ffffff');
      colors[i * 3 + 0] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    });
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.setAttribute('aColor', new THREE.InstancedBufferAttribute(colors, 3));

    const mat = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms: { uTime: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    return { geometry: geo, material: mat };
  }, [domains, layout]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpUp = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const tmpQuat = useMemo(() => new THREE.Quaternion(), []);
  const tmpDir = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    material.uniforms.uTime.value += delta;
    const mesh = meshRef.current;
    if (!mesh) return;

    for (let i = 0; i < domains.length; i++) {
      const pos = layout.get(domains[i].id)?.position;
      if (!pos) continue;

      const dist = camera.position.distanceTo(pos);
      // Smooth in/out by distance — peak around mid range.
      const inFade = THREE.MathUtils.smoothstep(dist, FLARE_NEAR * 0.5, FLARE_NEAR);
      const outFade = 1 - THREE.MathUtils.smoothstep(dist, FLARE_FAR * 0.7, FLARE_FAR);
      const scaleByDist = THREE.MathUtils.clamp(dist * 0.08 + 4, 5, 32);
      const visible = inFade * outFade;
      const scale = scaleByDist * visible;

      // Billboard — orient quad's +Z toward camera.
      tmpDir.copy(camera.position).sub(pos).normalize();
      tmpQuat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tmpDir);

      dummy.position.copy(pos);
      dummy.scale.set(scale, scale, 1);
      dummy.quaternion.copy(tmpQuat);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (domains.length === 0) return null;
  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, domains.length]}
      frustumCulled={false}
      renderOrder={3}
    />
  );
}
