import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { makeRng } from './rng';

/*
 * BioluminescentField: the deep-space backdrop for the mode selector.
 *
 * Built from scratch on @react-three/fiber + three (no easy-3dkit). Three
 * layered shells of GPU points — far/mid/near — drift slowly and parallax
 * toward the cursor at different rates, so the sky feels like it has depth and
 * leans wherever you point. A faint nebula plane sits behind it for colour.
 *
 * Rendered behind everything (z-index 0). pointerEvents are OFF on the wrapper
 * but the Canvas tracks the global pointer itself, so cards stay clickable.
 */

/* ---- round soft star sprite ------------------------------------------- */
/* pointsMaterial draws square points by default; a radial-gradient texture
   makes each point a soft round star. Built once and shared by every shell. */
function makeStarTexture() {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.25)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

/* ---- one parallax shell of stars -------------------------------------- */
function StarShell({ seed, count, radius, color, size, opacity, drift, parallax, twinkle, sprite }) {
  const ref = useRef();
  const matRef = useRef();

  // stable random sphere-shell positions + per-star phase for twinkle.
  // seeded RNG keeps this pure across renders (no Math.random in render).
  const { positions, phases } = useMemo(() => {
    const rng = makeRng(seed);
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // even-ish shell: random direction, radius jittered around `radius`
      const u = rng();
      const v = rng();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = radius * (0.75 + rng() * 0.25);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      phases[i] = rng() * Math.PI * 2;
    }
    return { positions, phases };
  }, [seed, count, radius]);

  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    // slow continuous tumble
    g.rotation.y = t * drift;
    g.rotation.x = Math.sin(t * drift * 0.6) * 0.08;
    // parallax lean toward the pointer (state.pointer is -1..1)
    const px = state.pointer.x;
    const py = state.pointer.y;
    g.rotation.y += px * parallax;
    g.rotation.x += -py * parallax;
    g.position.x = THREE.MathUtils.lerp(g.position.x, px * parallax * 2, 0.05);
    g.position.y = THREE.MathUtils.lerp(g.position.y, py * parallax * 2, 0.05);
    // gentle collective twinkle
    if (matRef.current && twinkle) {
      matRef.current.opacity = opacity * (0.78 + 0.22 * Math.sin(t * 1.4));
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aphase" args={[phases, 1]} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        color={color}
        size={size}
        map={sprite}
        alphaMap={sprite}
        sizeAttenuation
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ---- volumetric nebula far behind the stars --------------------------- */
/* A fractal-noise (fBm) cloud that recreates the Westerlund 2 look: warm
   rust/orange dust low and to the right, cool blue/violet glow upper-left,
   dark dust lanes carved through it, all over deep black. It drifts slowly and
   parallaxes with the cursor. */
function Nebula() {
  const ref = useRef();
  const matRef = useRef();
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uWarm: { value: new THREE.Color('#d8662a') }, // rust/orange
      uGold: { value: new THREE.Color('#f0b060') }, // warm highlight
      uCool: { value: new THREE.Color('#5b7cff') }, // blue
      uViolet: { value: new THREE.Color('#8a5cff') }, // violet
    }),
    []
  );

  useFrame((state, dt) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += dt;
      const m = matRef.current.uniforms.uMouse.value;
      m.x = THREE.MathUtils.lerp(m.x, state.pointer.x, 0.04);
      m.y = THREE.MathUtils.lerp(m.y, state.pointer.y, 0.04);
    }
    if (ref.current) {
      ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, state.pointer.x * 1.4, 0.04);
      ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, state.pointer.y * 1.4, 0.04);
    }
  });

  return (
    <mesh ref={ref} position={[0, 0, -14]}>
      <planeGeometry args={[80, 48]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          varying vec2 vUv;
          void main(){
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
          }
        `}
        fragmentShader={/* glsl */ `
          precision highp float;
          varying vec2 vUv;
          uniform float uTime;
          uniform vec2 uMouse;
          uniform vec3 uWarm;
          uniform vec3 uGold;
          uniform vec3 uCool;
          uniform vec3 uViolet;

          // hash + value noise + fbm
          float hash(vec2 p){
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
          }
          float noise(vec2 p){
            vec2 i = floor(p);
            vec2 f = fract(p);
            float a = hash(i);
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
          }
          float fbm(vec2 p){
            float v = 0.0;
            float amp = 0.5;
            mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
            for(int i = 0; i < 6; i++){
              v += amp * noise(p);
              p = rot * p * 2.02;
              amp *= 0.5;
            }
            return v;
          }

          void main(){
            vec2 uv = vUv;
            // slow drift + a little parallax from the cursor
            vec2 q = uv * 3.0 + uMouse * 0.3;
            float t = uTime * 0.025;

            // domain-warped fbm => billowy cloud structure
            vec2 warp = vec2(fbm(q + t), fbm(q + vec2(5.2, 1.3) - t));
            float clouds = fbm(q + warp * 1.8);
            clouds = pow(clouds, 1.4);

            // dark dust lanes: a second, sharper noise that subtracts density
            float dust = fbm(q * 1.7 + warp + 10.0);
            float density = clamp(clouds - dust * 0.35, 0.0, 1.0);

            // colour regions roughly matching Westerlund 2:
            //  - cool blue/violet upper-left
            //  - warm rust/gold lower + center
            float coolMask = smoothstep(0.9, 0.1, uv.x) * smoothstep(0.2, 0.9, uv.y);
            float warmMask = smoothstep(0.1, 0.9, uv.y * 0.6 + (1.0 - uv.x) * 0.4);

            vec3 cool = mix(uViolet, uCool, fbm(q + 2.0));
            vec3 warm = mix(uWarm, uGold, clouds);
            vec3 col = warm * warmMask + cool * coolMask * 0.9;

            // a brighter "cluster glow" core, like the star cluster region
            float core = smoothstep(0.42, 0.0, distance(uv, vec2(0.6, 0.55)));
            col += uGold * core * 0.5;

            col *= density * 1.6;

            // vignette to deep black at the frame edges
            float vig = smoothstep(0.85, 0.2, distance(uv, vec2(0.5)));
            float alpha = density * vig;
            gl_FragColor = vec4(col * vig, clamp(alpha * 0.9, 0.0, 0.92));
          }
        `}
      />
    </mesh>
  );
}

/* ---- keeps the canvas pointer fed from the WHOLE window --------------- */
/* The wrapper has pointerEvents:none so cards are clickable, which means the
   Canvas never receives pointer moves. We feed it the global pointer here. */
function GlobalPointer() {
  const { pointer, gl } = useThree();
  React.useEffect(() => {
    const onMove = (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [pointer, gl]);
  return null;
}

function Stars() {
  // one shared round-star sprite for every shell
  const sprite = useMemo(() => makeStarTexture(), []);
  return (
    <>
      {/* far, faint, dense, barely moves — the deep backdrop */}
      <StarShell
        seed={1337}
        count={3200}
        radius={40}
        color="#ffffff"
        size={0.18}
        opacity={0.7}
        drift={0.004}
        parallax={0.02}
        sprite={sprite}
        twinkle
      />
      {/* mid, cool tint */}
      <StarShell
        seed={4242}
        count={1600}
        radius={26}
        color="#9fb6ff"
        size={0.2}
        opacity={0.6}
        drift={0.008}
        parallax={0.05}
        sprite={sprite}
      />
      {/* warm gold stars to echo the nebula's orange clusters */}
      <StarShell
        seed={606}
        count={600}
        radius={22}
        color="#ffcf8a"
        size={0.22}
        opacity={0.7}
        drift={0.01}
        parallax={0.06}
        sprite={sprite}
        twinkle
      />
      {/* nearer brighter scatter, leans a little more with the cursor */}
      <StarShell
        seed={9001}
        count={500}
        radius={16}
        color="#cdd8ff"
        size={0.26}
        opacity={0.9}
        drift={0.014}
        parallax={0.1}
        sprite={sprite}
        twinkle
      />
    </>
  );
}

export default function BioluminescentField() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: '#000000',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <GlobalPointer />
        <Nebula />
        <Stars />
      </Canvas>
    </div>
  );
}
