import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
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
      <color attach="background" args={['#05070d']} />
      <fog attach="fog" args={['#05070d', 280, 600]} />

      <ambientLight intensity={0.65} />
      <pointLight position={[120, 80, 80]} intensity={0.6} color="#22d3ee" />
      <pointLight position={[-100, -80, -80]} intensity={0.5} color="#f472b6" />
      <pointLight position={[0, 120, 0]} intensity={0.35} color="#facc15" />

      <Starfield />
      <GalaxyGraph {...props} />

      <CameraRig />

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={1.6}
          luminanceThreshold={0.05}
          luminanceSmoothing={0.6}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}
