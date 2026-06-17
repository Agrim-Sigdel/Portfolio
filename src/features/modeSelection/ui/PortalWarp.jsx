import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { makeRng } from './rng';

/*
 * PortalWarp: the "launch into the page" transition.
 *
 * Each mode gets its OWN motion so picking a mode feels distinct, but all share
 * the same ~1.4s eased budget and hand off the same way (the parent unmounts the
 * overlay after ~1.5s):
 *
 *   normal (CV)      -> "collapse" : orbital rings implode to a bright point
 *   fun (Fluid)      -> "swirl"    : a galaxy spiral winds up as the camera dives
 *   work (Terminal)  -> "stream"   : a grid of streaks races past + a flash
 *
 * `color` tints everything to the chosen mode.
 */

// shared slow-in / fast-out ease over a 0..1 progress
function smooth(k) {
  const c = Math.min(Math.max(k, 0), 1);
  return c * c * (3 - 2 * c);
}

/* ========================================================== CV: constellation */
/* Matches the constellation element: a particle sphere implodes toward the
   centre, then the points stream past the camera as we dive in. */
function CollapseWarp({ color }) {
  const ref = useRef();
  const count = 1400;

  // start the particles on a big sphere shell around the camera
  const { positions, dirs } = useMemo(() => {
    const rng = makeRng(11);
    const positions = new Float32Array(count * 3);
    const dirs = new Float32Array(count * 3);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = golden * i + rng() * 0.2;
      const r = 5 + rng() * 1.5;
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      positions[i * 3] = x * r;
      positions[i * 3 + 1] = y * r;
      positions[i * 3 + 2] = z * r - 2;
      // unit direction toward the centre (used for the implosion)
      const len = Math.hypot(x, y, z) || 1;
      dirs[i * 3] = x / len;
      dirs[i * 3 + 1] = y / len;
      dirs[i * 3 + 2] = z / len;
    }
    return { positions, dirs };
  }, []);

  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const ease = smooth(t / 1.4);
    const pos = g.geometry.attributes.position;
    const arr = pos.array;
    // pull every point toward the centre, accelerating; then they overshoot
    // through the camera, reading as a "dive into the constellation"
    const pull = (4 + t * 16) * dt;
    for (let i = 0; i < count; i++) {
      arr[i * 3] -= dirs[i * 3] * pull;
      arr[i * 3 + 1] -= dirs[i * 3 + 1] * pull;
      arr[i * 3 + 2] -= dirs[i * 3 + 2] * pull;
      arr[i * 3 + 2] += dt * t * 6; // drift toward the camera as it tightens
    }
    pos.needsUpdate = true;
    g.rotation.z += dt * (0.3 + ease * 1.2);
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.07}
        sizeAttenuation
        transparent
        opacity={0.95}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ================================================================ Fluid: swirl */
function SwirlWarp({ color }) {
  const ref = useRef();
  const count = 1600;

  // particles laid out as a spiral disc we dive through
  const positions = useMemo(() => {
    const rng = makeRng(2024);
    const arr = new Float32Array(count * 3);
    const arms = 3;
    for (let i = 0; i < count; i++) {
      const r = Math.pow(rng(), 0.5) * 5;
      const arm = (i % arms) / arms;
      const branch = arm * Math.PI * 2 + r * 1.4;
      const jitter = (rng() - 0.5) * (0.3 + r * 0.4);
      arr[i * 3] = Math.cos(branch) * r + jitter;
      arr[i * 3 + 1] = Math.sin(branch) * r + jitter;
      arr[i * 3 + 2] = -rng() * 6;
    }
    return arr;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const ease = smooth(t / 1.4);
    if (ref.current) {
      ref.current.rotation.z = t * (1.5 + ease * 6); // wind up the spin
      ref.current.position.z = ease * 7; // dive the disc toward the camera
      ref.current.scale.setScalar(1 + ease * 1.5);
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.07}
        sizeAttenuation
        transparent
        opacity={0.95}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ============================================================ Terminal: stream */
function StreamWarp({ color }) {
  const ref = useRef();
  const count = 1400;

  // stars in a long tube we accelerate down (classic warp streaks)
  const positions = useMemo(() => {
    const rng = makeRng(55);
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = rng() * Math.PI * 2;
      const radius = 0.4 + rng() * 5;
      arr[i * 3] = Math.cos(a) * radius;
      arr[i * 3 + 1] = Math.sin(a) * radius;
      arr[i * 3 + 2] = -rng() * 30;
    }
    return arr;
  }, []);

  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const speed = 10 + t * 32; // accelerate
    const pos = g.geometry.attributes.position;
    const arr = pos.array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 2] += dt * speed;
      if (arr[i * 3 + 2] > 4) arr[i * 3 + 2] -= 34;
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.06}
        sizeAttenuation
        transparent
        opacity={0.95}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

const WARP_VARIANTS = {
  normal: CollapseWarp,
  fun: SwirlWarp,
  work: StreamWarp,
};

export default function PortalWarp({ variant = 'fun', color }) {
  const Scene = WARP_VARIANTS[variant] || SwirlWarp;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 70 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <Scene color={color} />
      </Canvas>
    </div>
  );
}
