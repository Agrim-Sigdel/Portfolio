import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { makeRng } from './rng';

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

/* ============================================================ NORMAL: orbits */
function OrbitsPortal({ color, hot }) {
  const group = useRef();
  const ringsRef = useRef([]);

  const rings = useMemo(
    () => [
      { r: 0.7, tilt: 0.0, dir: 1, speed: 0.5 },
      { r: 1.0, tilt: 0.5, dir: -1, speed: 0.35 },
      { r: 1.3, tilt: -0.4, dir: 1, speed: 0.25 },
    ],
    []
  );

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const speed = hot ? 2.2 : 1;
    g.rotation.x = damp(g.rotation.x, -state.pointer.y * 0.5, 4, dt);
    g.rotation.y = damp(g.rotation.y, state.pointer.x * 0.5, 4, dt);
    ringsRef.current.forEach((m, i) => {
      if (m) m.rotation.z += dt * rings[i].speed * rings[i].dir * speed;
    });
  });

  return (
    <group ref={group}>
      {rings.map((ring, i) => (
        <mesh
          key={i}
          ref={(el) => (ringsRef.current[i] = el)}
          rotation={[Math.PI / 2 + ring.tilt, 0, 0]}
        >
          <torusGeometry args={[ring.r, hot ? 0.03 : 0.022, 16, 96]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={hot ? 0.95 : 0.7}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
      {/* glowing core */}
      <mesh>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshBasicMaterial color={color} transparent opacity={hot ? 1 : 0.85} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

/* ============================================================ FUN: galaxy */
function GalaxyPortal({ color, hot }) {
  const ref = useRef();
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
    g.rotation.y += dt * (hot ? 0.8 : 0.32);
    g.rotation.x = damp(g.rotation.x, 0.9 - state.pointer.y * 0.4, 4, dt);
    g.rotation.z = damp(g.rotation.z, state.pointer.x * 0.4, 4, dt);
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
      <mesh>
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshBasicMaterial color={'#ffffff'} transparent opacity={hot ? 1 : 0.8} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

/* ============================================================ WORK: grid net */
function GridPortal({ color, hot }) {
  const group = useRef();
  const scanRef = useRef();
  const dotsRef = useRef();

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
    g.rotation.y += dt * (hot ? 0.55 : 0.18);
    g.rotation.x = damp(g.rotation.x, -state.pointer.y * 0.45, 4, dt);
    if (scanRef.current) {
      // a ring that sweeps up and down the sphere like a scan line
      const t = state.clock.elapsedTime * (hot ? 1.6 : 0.9);
      scanRef.current.position.y = Math.sin(t) * 1.0;
      const s = Math.cos(Math.asin(THREE.MathUtils.clamp(scanRef.current.position.y, -1, 1)));
      scanRef.current.scale.setScalar(Math.max(0.05, s));
    }
  });

  return (
    <group ref={group}>
      {/* wireframe sphere = data grid */}
      <mesh>
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

export default function ModePortal({ variant, color, hot }) {
  const Inner = VARIANTS[variant] || OrbitsPortal;
  return (
    <div className="ms-portal-canvas" style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [0, 0, 3.6], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <GlobalPointer />
        <Inner color={color} hot={hot} />
      </Canvas>
    </div>
  );
}
