import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { makeRng } from './rng';

/*
 * PortalWarp: the "glide through the portal into space" transition.
 *
 * Custom r3f scene (no easy-3dkit). When a mode is picked this fades in and the
 * camera eases forward while a tube of stars streaks past and a ring blooms
 * open, giving a smooth hyperspace dive that hands off to the page. `color`
 * tints everything to the chosen mode.
 *
 * Timing is eased over ~1.4s with a slow-in / fast-out curve so the start feels
 * gentle and the arrival snaps cleanly to the next page.
 */

function StarStreaks({ color }) {
  const ref = useRef();
  const count = 1200;

  // stars distributed in a long tube ahead of the camera
  const positions = useMemo(() => {
    const rng = makeRng(55);
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = rng() * Math.PI * 2;
      const radius = 0.6 + rng() * 5;
      arr[i * 3] = Math.cos(a) * radius;
      arr[i * 3 + 1] = Math.sin(a) * radius;
      arr[i * 3 + 2] = -rng() * 30; // spread back into the tube
    }
    return arr;
  }, []);

  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const speed = 8 + t * 26; // accelerate into hyperspace
    const pos = g.geometry.attributes.position;
    const arr = pos.array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 2] += dt * speed;
      if (arr[i * 3 + 2] > 4) arr[i * 3 + 2] -= 34; // recycle to the back
    }
    pos.needsUpdate = true;
    g.rotation.z += dt * 0.25;
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

function Glide({ color }) {
  const ringRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ringRef.current) {
      // slow-in / fast-out bloom over ~1.4s
      const k = Math.min(t / 1.4, 1);
      const ease = k * k * (3 - 2 * k);
      ringRef.current.scale.setScalar(0.4 + ease * 6);
      ringRef.current.rotation.z += 0.03;
      ringRef.current.material.opacity = 0.9 * (1 - ease * 0.7);
    }
  });

  return (
    <>
      <StarStreaks color={color} />
      {/* the ring you dive through */}
      <mesh ref={ringRef} position={[0, 0, 0]}>
        <torusGeometry args={[1.1, 0.06, 16, 120]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* central flash that grows as you arrive */}
      <mesh>
        <sphereGeometry args={[0.1, 24, 24]} />
        <meshBasicMaterial color={'#ffffff'} transparent opacity={0.6} blending={THREE.AdditiveBlending} />
      </mesh>
    </>
  );
}

export default function PortalWarp({ color }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 70 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <Glide color={color} />
      </Canvas>
    </div>
  );
}
