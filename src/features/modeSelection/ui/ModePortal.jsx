import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { makeRng } from './rng';
import CssPortal from './CssPortal';

/*
 * ModePortal: the interactive structure inside each mode card.
 *
 * Built from scratch on r3f + three (no easy-3dkit). Crucially, each mode gets
 * a VISUALLY DISTINCT structure so the three cards read as different worlds:
 *
 *   normal  -> "orbits"  : clean concentric orbital rings (structured / formal)
 *   fun     -> "galaxy"  : a swirling spiral of particles (playful / alive)
 *   work    -> "grid"    : a wireframe data-sphere with a scan ring (technical)
 *
 * Every variant leans toward the cursor and spins faster while `hot` (hovered).
 */

/* ------------------------------------------------------------------ utils */
// smooth approach toward a target (frame-rate independent enough for this use)
function damp(current, target, lambda, dt) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));
}

/* ====================================================== NORMAL: constellation */
/* A dense particle SPHERE with faint connecting links between nearby nodes — a
   clean, structured "constellation" that reads as formal/professional and
   matches the particle richness of the galaxy and grid variants.
   Charge behaviour: the cloud contracts toward the core and spins up as
   `chargeRef` rises 0->1, so holding to enter visibly "draws it in". */
function OrbitsPortal({ color, hot, chargeRef }) {
  const group = useRef();
  const coreRef = useRef();
  const cloudRef = useRef();

  const count = 520;

  // particles distributed evenly on a sphere (Fibonacci sphere = no clumping)
  const positions = useMemo(() => {
    const rng = makeRng(11);
    const arr = new Float32Array(count * 3);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2; // -1..1
      const radius = Math.sqrt(1 - y * y);
      const theta = golden * i + rng() * 0.12; // tiny jitter so it isn't rigid
      const r = 1.15;
      arr[i * 3] = Math.cos(theta) * radius * r;
      arr[i * 3 + 1] = y * r;
      arr[i * 3 + 2] = Math.sin(theta) * radius * r;
    }
    return arr;
  }, []);

  // a sparse set of "constellation" links between some neighbouring points
  const linkPositions = useMemo(() => {
    const segs = [];
    const p = positions;
    for (let i = 0; i < count; i += 7) {
      // connect each sampled node to its index-neighbour — cheap, gives a faint
      // web without an O(n^2) nearest-neighbour search
      const j = (i + 3) % count;
      segs.push(
        p[i * 3], p[i * 3 + 1], p[i * 3 + 2],
        p[j * 3], p[j * 3 + 1], p[j * 3 + 2]
      );
    }
    return new Float32Array(segs);
  }, [positions]);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const c = chargeRef.current; // 0..1
    const spin = (hot ? 0.45 : 0.18) * (1 + c * 5);
    g.rotation.y += dt * spin;
    g.rotation.x = damp(g.rotation.x, -state.pointer.y * 0.45, 4, dt);
    g.rotation.z = damp(g.rotation.z, state.pointer.x * 0.3, 4, dt);
    if (cloudRef.current) cloudRef.current.scale.setScalar(1 - c * 0.5); // contract
    if (coreRef.current) coreRef.current.scale.setScalar(1 + c * 1.1); // core swells
  });

  return (
    <group ref={group}>
      <group ref={cloudRef}>
        {/* node points */}
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            color={color}
            size={hot ? 0.06 : 0.045}
            sizeAttenuation
            transparent
            opacity={0.95}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
        {/* faint constellation links */}
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[linkPositions, 3]} />
          </bufferGeometry>
          <lineBasicMaterial
            color={color}
            transparent
            opacity={hot ? 0.28 : 0.16}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      </group>
      {/* glowing core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshBasicMaterial color={color} transparent opacity={hot ? 1 : 0.85} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

/* ============================================================ FUN: galaxy */
/* Charge behaviour: the galaxy spins up and the whole disc tilts toward
   face-on while the core flares, like it's being "wound up" before the dive. */
function GalaxyPortal({ color, hot, chargeRef }) {
  const ref = useRef();
  const coreRef = useRef();
  const count = 1400;

  const positions = useMemo(() => {
    const rng = makeRng(2024);
    const arr = new Float32Array(count * 3);
    const arms = 3;
    for (let i = 0; i < count; i++) {
      const r = Math.pow(rng(), 0.6) * 1.4; // denser toward center
      const arm = (i % arms) / arms;
      const spin = r * 3.2; // how much the arm winds
      const branch = arm * Math.PI * 2 + spin;
      const jitter = (rng() - 0.5) * (0.25 + r * 0.35);
      arr[i * 3] = Math.cos(branch) * r + jitter;
      arr[i * 3 + 1] = (rng() - 0.5) * 0.18; // thin disc
      arr[i * 3 + 2] = Math.sin(branch) * r + jitter;
    }
    return arr;
  }, []);

  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;
    const c = chargeRef.current;
    g.rotation.y += dt * (hot ? 0.8 : 0.32) * (1 + c * 5); // accelerate spin
    // tilt from edge-on (0.9) toward face-on (~0.2) as it charges so we "look in"
    g.rotation.x = damp(g.rotation.x, (0.9 - c * 0.7) - state.pointer.y * 0.4, 4, dt);
    g.rotation.z = damp(g.rotation.z, state.pointer.x * 0.4, 4, dt);
    if (coreRef.current) coreRef.current.scale.setScalar(1 + c * 1.4); // core flares
  });

  return (
    <group ref={ref} rotation={[0.9, 0, 0]}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={color}
          size={hot ? 0.05 : 0.04}
          sizeAttenuation
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      {/* bright galactic core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshBasicMaterial color={'#ffffff'} transparent opacity={hot ? 1 : 0.8} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

/* ============================================================ WORK: grid net */
/* Charge behaviour: the data-sphere spins up and the scan ring sweeps faster &
   brighter as charge builds, like a system spooling up before launch. */
function GridPortal({ color, hot, chargeRef }) {
  const group = useRef();
  const scanRef = useRef();
  const dotsRef = useRef();
  const wireRef = useRef();

  // dots scattered on a sphere surface = "network nodes"
  const dots = useMemo(() => {
    const rng = makeRng(7);
    const n = 260;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = rng();
      const v = rng();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = 1.05;
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const c = chargeRef.current;
    g.rotation.y += dt * (hot ? 0.55 : 0.18) * (1 + c * 4);
    g.rotation.x = damp(g.rotation.x, -state.pointer.y * 0.45, 4, dt);
    if (scanRef.current) {
      // a ring that sweeps up and down the sphere like a scan line — faster as
      // it charges, so the scan visibly "races" toward launch
      const t = state.clock.elapsedTime * (hot ? 1.6 : 0.9) * (1 + c * 5);
      scanRef.current.position.y = Math.sin(t) * 1.0;
      const s = Math.cos(Math.asin(THREE.MathUtils.clamp(scanRef.current.position.y, -1, 1)));
      scanRef.current.scale.setScalar(Math.max(0.05, s));
      scanRef.current.material.opacity = (hot ? 0.9 : 0.5) + c * 0.1;
    }
    // wireframe brightens as the sphere "energizes"
    if (wireRef.current) wireRef.current.material.opacity = (hot ? 0.6 : 0.32) + c * 0.4;
  });

  return (
    <group ref={group}>
      {/* wireframe sphere = data grid */}
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[1, 3]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={hot ? 0.6 : 0.32} />
      </mesh>
      {/* node dots */}
      <points ref={dotsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dots, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={color}
          size={hot ? 0.07 : 0.05}
          sizeAttenuation
          transparent
          opacity={0.95}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      {/* sweeping scan ring */}
      <mesh ref={scanRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.02, 0.012, 8, 80]} />
        <meshBasicMaterial color={'#ffffff'} transparent opacity={hot ? 0.9 : 0.5} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

/* ----------------------------------------------------- pointer bridge */
function GlobalPointer() {
  const { pointer } = useThree();
  React.useEffect(() => {
    const onMove = (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [pointer]);
  return null;
}

const VARIANTS = {
  normal: OrbitsPortal,
  fun: GalaxyPortal,
  work: GridPortal,
};

export default function ModePortal({ variant, color, hot, charge = 0, webgl = true }) {
  // `charge` is React state that changes every frame while holding-to-enter.
  // Mirror it into a ref so the r3f frame loop reads the latest value without
  // re-mounting the Canvas on each tick.
  const chargeRef = useRef(0);
  chargeRef.current = charge;

  // No WebGL → CSS-drawn glyph stand-in so each mode still reads distinct.
  if (!webgl) {
    return (
      <div className="ms-portal-canvas" style={{ width: '100%', height: '100%' }}>
        <CssPortal variant={variant} color={color} hot={hot} charge={charge} />
      </div>
    );
  }

  const Inner = VARIANTS[variant] || OrbitsPortal;
  return (
    <div className="ms-portal-canvas" style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [0, 0, 3.6], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <GlobalPointer />
        <Inner color={color} hot={hot} chargeRef={chargeRef} />
      </Canvas>
    </div>
  );
}
