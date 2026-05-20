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
import EnvSetup from './EnvSetup';
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
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

export default function Scene(props: Props) {
  return (
    <Canvas
      camera={{ position: [60, 90, 260], fov: 48, near: 0.1, far: 2000 }}
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#03050b']} />
      <fog attach="fog" args={['#03050b', 300, 620]} />

      <ambientLight intensity={0.55} />
      <pointLight position={[140, 80, 80]} intensity={0.6} color="#22d3ee" />
      <pointLight position={[-110, -60, -100]} intensity={0.55} color="#f472b6" />
      <pointLight position={[0, 120, 0]} intensity={0.4} color="#facc15" />

      <EnvSetup />
      <Starfield />
      <GalaxyGraph {...props} />

      <CameraRig />

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={2.0}
          luminanceThreshold={0.03}
          luminanceSmoothing={0.7}
          mipmapBlur
          radius={0.9}
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
