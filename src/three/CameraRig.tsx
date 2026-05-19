import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGraphStore } from '../store/useGraphStore';

// Smooth, precise camera handling:
//  - User-driven orbit/zoom: OrbitControls with strong damping + zoomToCursor.
//  - Programmatic focus: ease-in-out-cubic tween over ~800 ms; controls
//    disabled during the tween so input doesn't fight the animation.
//  - Idle: after IDLE_DELAY_MS of no user interaction, slowly orbit the galaxy
//    around the world Y axis so static views still feel alive.

const FOCUS_DURATION = 800; // ms
const IDLE_DELAY_MS = 3500;
const IDLE_RATE_RAD_PER_SEC = 0.05; // ~3°/s

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export default function CameraRig() {
  const controlsRef = useRef<any>(null);
  const { camera, gl } = useThree();
  const focus = useGraphStore((s) => s.focusTarget);
  const focusToken = useGraphStore((s) => s.focusToken);

  const tween = useRef<{
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    startTarget: THREE.Vector3;
    endTarget: THREE.Vector3;
    t0: number;
    active: boolean;
  }>({
    startPos: new THREE.Vector3(),
    endPos: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    endTarget: new THREE.Vector3(),
    t0: 0,
    active: false,
  });

  const lastInteraction = useRef(performance.now());

  // Listen to *DOM* input events directly so our own programmatic rotation
  // doesn't reset the idle timer.
  useEffect(() => {
    const canvas = gl.domElement;
    const bump = () => {
      lastInteraction.current = performance.now();
    };
    canvas.addEventListener('pointerdown', bump);
    canvas.addEventListener('wheel', bump, { passive: true });
    canvas.addEventListener('touchstart', bump, { passive: true });
    return () => {
      canvas.removeEventListener('pointerdown', bump);
      canvas.removeEventListener('wheel', bump);
      canvas.removeEventListener('touchstart', bump);
    };
  }, [gl]);

  useEffect(() => {
    if (!focus || !controlsRef.current) return;
    const ctrl = controlsRef.current;

    const target = new THREE.Vector3(focus[0], focus[1], focus[2]);

    const currentOffset = camera.position.clone().sub(ctrl.target);
    const currentDist = currentOffset.length();

    const isOrigin =
      Math.abs(target.x) < 0.001 &&
      Math.abs(target.y) < 0.001 &&
      Math.abs(target.z) < 0.001;
    const desiredDist = isOrigin
      ? Math.max(180, currentDist)
      : target.length() < 30
      ? 50
      : 35;

    const dir =
      currentOffset.lengthSq() > 0.001
        ? currentOffset.clone().normalize()
        : new THREE.Vector3(0, 0.2, 1).normalize();
    const endPos = target.clone().add(dir.multiplyScalar(desiredDist));

    tween.current.startPos.copy(camera.position);
    tween.current.endPos.copy(endPos);
    tween.current.startTarget.copy(ctrl.target);
    tween.current.endTarget.copy(target);
    tween.current.t0 = performance.now();
    tween.current.active = true;
    ctrl.enabled = false;
    lastInteraction.current = performance.now();
  }, [focus, focusToken, camera]);

  useFrame((_, delta) => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;

    if (tween.current.active) {
      const elapsed = performance.now() - tween.current.t0;
      const t = Math.min(1, elapsed / FOCUS_DURATION);
      const k = easeInOutCubic(t);

      camera.position.lerpVectors(
        tween.current.startPos,
        tween.current.endPos,
        k,
      );
      ctrl.target.lerpVectors(
        tween.current.startTarget,
        tween.current.endTarget,
        k,
      );
      ctrl.update();

      if (t >= 1) {
        tween.current.active = false;
        ctrl.enabled = true;
      }
      return;
    }

    // Idle rotation — orbit around Y axis through controls.target.
    const idleFor = performance.now() - lastInteraction.current;
    if (idleFor > IDLE_DELAY_MS) {
      // Ease in the rotation so it doesn't snap on.
      const ramp = Math.min(1, (idleFor - IDLE_DELAY_MS) / 800);
      const angle = IDLE_RATE_RAD_PER_SEC * delta * ramp;
      const offset = camera.position.clone().sub(ctrl.target);
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      camera.position.copy(ctrl.target).add(offset);
    }
    ctrl.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.12}
      rotateSpeed={0.55}
      zoomSpeed={0.7}
      panSpeed={0.55}
      minDistance={12}
      maxDistance={420}
      enablePan
      zoomToCursor
      screenSpacePanning
    />
  );
}
