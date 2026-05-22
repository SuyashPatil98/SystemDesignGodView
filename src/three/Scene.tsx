import { Canvas } from '@react-three/fiber';
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
  Noise,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import Starfield from './Starfield';
import CameraRig from './CameraRig';
import GalaxyGraph from './GalaxyGraph';
import type { GNode, GEdge } from '../data/schema';
import type { Positioned } from './layout';

interface Props {
  nodes: GNode[];
  edges: GEdge[];
  layout: Map<string, Positioned>;
  visibleIds: Set<string>;
  emphasized: Set<string> | null;
  selectedId: string | null;
  hoveredId: string | null;
  domainIds: Set<string>;
  conquered: Set<string>;
  breadcrumbs: GNode[];
  focusedSubtreeId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onShiftSelect?: (id: string) => void;
}

export default function Scene(props: Props) {
  return (
    <Canvas
      camera={{ position: [60, 90, 260], fov: 48, near: 0.1, far: 2000 }}
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#000000']} />
      <fog attach="fog" args={['#000000', 300, 620]} />

      <Starfield />
      <GalaxyGraph {...props} />

      <CameraRig />

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={1.3}
          luminanceThreshold={0.08}
          luminanceSmoothing={0.7}
          mipmapBlur
          radius={0.8}
        />
        <ChromaticAberration
          offset={new THREE.Vector2(0.0008, 0.0008)}
          radialModulation={false}
          modulationOffset={0}
        />
        <Vignette
          eskil={false}
          offset={0.22}
          darkness={0.7}
          blendFunction={BlendFunction.NORMAL}
        />
        <Noise
          opacity={0.035}
          premultiply
          blendFunction={BlendFunction.SOFT_LIGHT}
        />
      </EffectComposer>
    </Canvas>
  );
}
