import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGraphStore } from '../store/useGraphStore';

// Camera handling:
//   • Mouse:    OrbitControls (left-drag = orbit, right-drag = pan, wheel = zoom).
//   • WASD:     translate camera + target together so the orbit centre moves with you.
//               W/S = along view direction · A/D = strafe · Q/E = world up/down.
//               Shift = sprint (3×). Speed adapts to current zoom level.
//   • Focus:    ease-in-out tween over ~800 ms when a node is selected.
//   • Idle:     after 3.5 s of no input, slow Y-axis orbit until the user moves.

const FOCUS_DURATION = 800; // ms
const IDLE_DELAY_MS = 3500;
const IDLE_RATE_RAD_PER_SEC = 0.05;

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

  // ─── Keyboard state for WASD ───
  const keys = useRef(new Set<string>());
  const velocity = useRef(new THREE.Vector3());

  useEffect(() => {
    const inInput = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      return !!(t && t.matches?.('input,textarea'));
    };
    const onDown = (e: KeyboardEvent) => {
      if (inInput(e)) return;
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'q', 'e', 'shift'].includes(k)) {
        keys.current.add(k);
        lastInteraction.current = performance.now();
        // If the user starts WASD-ing mid-tween, cancel the focus tween so
        // input feels responsive.
        if (tween.current.active) {
          tween.current.active = false;
          if (controlsRef.current) controlsRef.current.enabled = true;
        }
      }
    };
    const onUp = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase());
    };
    const onBlur = () => keys.current.clear();
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // Bump idle timer on direct canvas input too.
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

  // ─── Programmatic focus tween ───
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

  // ─── Pre-allocated scratch vectors for hot loop ───
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const worldUp = useRef(new THREE.Vector3(0, 1, 0));
  const desiredVel = useRef(new THREE.Vector3());
  const moveDelta = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;

    // 1) Focus tween (overrides everything else while active).
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

    // 2) WASD translation — moves camera AND orbit target together.
    const ks = keys.current;
    desiredVel.current.set(0, 0, 0);
    const anyKey =
      ks.has('w') || ks.has('s') || ks.has('a') || ks.has('d') || ks.has('q') || ks.has('e');

    if (anyKey) {
      camera.getWorldDirection(forward.current);
      right.current.crossVectors(forward.current, worldUp.current).normalize();

      if (ks.has('w')) desiredVel.current.add(forward.current);
      if (ks.has('s')) desiredVel.current.sub(forward.current);
      if (ks.has('d')) desiredVel.current.add(right.current);
      if (ks.has('a')) desiredVel.current.sub(right.current);
      if (ks.has('e')) desiredVel.current.add(worldUp.current);
      if (ks.has('q')) desiredVel.current.sub(worldUp.current);

      if (desiredVel.current.lengthSq() > 0) {
        desiredVel.current.normalize();
        // Speed scales with how far you are from the orbit target — feels
        // right at every zoom level. 0.55 × distance, clamped.
        const dist = camera.position.distanceTo(ctrl.target);
        const baseSpeed = THREE.MathUtils.clamp(dist * 0.55, 18, 220);
        const sprint = ks.has('shift') ? 2.6 : 1.0;
        desiredVel.current.multiplyScalar(baseSpeed * sprint);
      }
    }

    // Smooth accel/decel so taps feel natural and releases coast a moment.
    velocity.current.lerp(desiredVel.current, 0.22);

    if (velocity.current.lengthSq() > 0.0001) {
      moveDelta.current
        .copy(velocity.current)
        .multiplyScalar(delta);
      camera.position.add(moveDelta.current);
      ctrl.target.add(moveDelta.current);
      lastInteraction.current = performance.now();
    }

    // 3) Idle rotation — only when nothing else is happening.
    const idleFor = performance.now() - lastInteraction.current;
    if (idleFor > IDLE_DELAY_MS && velocity.current.lengthSq() < 0.0001) {
      const ramp = Math.min(1, (idleFor - IDLE_DELAY_MS) / 800);
      const angle = IDLE_RATE_RAD_PER_SEC * delta * ramp;
      const offset = camera.position.clone().sub(ctrl.target);
      offset.applyAxisAngle(worldUp.current, angle);
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
      minDistance={6}
      maxDistance={600}
      enablePan
      zoomToCursor
      screenSpacePanning
    />
  );
}
