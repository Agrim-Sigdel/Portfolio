import React, { useMemo, useSyncExternalStore } from 'react';
import {
    Stage, InteractiveSurface,
    kineticType, plasma, voronoiCells, bioluminescent, neonLineArt, moire, liquidBlob, scanlines, heatHaze,
    brushedMetal, dither8bit, fractalZoom, frostedGlass, glassmorphism, holographicFoil,
    iridescent, rainStreaks, thermalVision, toonCel, wireframeMorph, xrayGhost,
    InstancedGrid, galaxySpiral, orbitLayout, tunnelLayout, cubeSwarm, waveGrid,
    voxelSphere, gearField, origamiFold,
    ParticleField, OceanPlane, PortalRing, MorphShape,
} from 'easy-3dkit';
import { subscribe, getState, currentEffect, effectParams } from '../lib/fxStore';
import {
    subscribe as sceneSubscribe, getState as sceneGetState,
    currentScene, sceneParams,
} from '../lib/sceneStore';

/*
 * StarryNight — the live easy-3dkit backdrop for the terminal desktop.
 *
 * Two stores drive it:
 *   • sceneStore picks WHICH SCENE is mounted — the flat shader surface, or a
 *     full 3D composition (galaxy, tunnel, ocean, portal, …). Each scene
 *     showcases a different easy-3dkit element.
 *   • fxStore picks WHICH SHADER runs when the 'shader' scene is live.
 *
 * This is the only module that imports easy-3dkit (hence three.js), and it is
 * lazy-loaded by Terminal — keep the heavy imports here; fxStore/sceneStore
 * hold plain data only.
 *
 * Rendered behind the terminal window; pointer-events disabled so it never
 * intercepts clicks. <Stage> falls back gracefully if WebGL is unavailable.
 * Each scene gets its own camera; keying the Stage on the scene id remounts
 * the canvas cleanly on scene switches (rare, user-driven).
 */

// id → material object for the shader scene. Heavy objects live here;
// fxStore only knows ids.
const MATERIALS = {
    'kinetic-type': kineticType,
    'plasma': plasma,
    'voronoi-cells': voronoiCells,
    'bioluminescent': bioluminescent,
    'neon-line-art': neonLineArt,
    'moire': moire,
    'liquid-blob': liquidBlob,
    'scanlines': scanlines,
    'heat-haze': heatHaze,
    'brushed-metal': brushedMetal,
    'dither8bit': dither8bit,
    'fractal-zoom': fractalZoom,
    'frosted-glass': frostedGlass,
    'glassmorphism': glassmorphism,
    'holographic-foil': holographicFoil,
    'iridescent': iridescent,
    'rain-streaks': rainStreaks,
    'thermal-vision': thermalVision,
    'toon-cel': toonCel,
    'wireframe-morph': wireframeMorph,
    'xray-ghost': xrayGhost,
};

/* ─── scene components (params come from sceneStore, dark-tuned) ─────── */

const ShaderScene = () => {
    const fx = useSyncExternalStore(subscribe, getState, getState);
    const effect = currentEffect(fx);
    return (
        <group scale={16}>
            <InteractiveSurface
                material={MATERIALS[effect.id]}
                size={[2, 2]}
                segments={1}
                params={effectParams(fx)}
            />
        </group>
    );
};

const GalaxyScene = ({ p }) => {
    const layout = useMemo(
        () => galaxySpiral({ count: p.count, arms: p.arms, speed: p.speed, radius: 8 }),
        [p.count, p.arms, p.speed],
    );
    return (
        <InstancedGrid layout={layout} shape="sphere" instanceSize={0.06}
            color={p.color} emissive={p.color} emissiveIntensity={0.7} roughness={0.4} />
    );
};

const OrbitScene = ({ p }) => {
    const layout = useMemo(
        () => orbitLayout({ count: p.count, shells: p.shells, speed: p.speed, radius: 3 }),
        [p.count, p.shells, p.speed],
    );
    return (
        <InstancedGrid layout={layout} shape="icosahedron" instanceSize={0.16}
            color={p.color} emissive={p.color} emissiveIntensity={0.35} roughness={0.35} metalness={0.4} />
    );
};

const TunnelScene = ({ p }) => {
    const layout = useMemo(
        () => tunnelLayout({ count: p.count, radius: p.radius, speed: p.speed }),
        [p.count, p.radius, p.speed],
    );
    return (
        <InstancedGrid layout={layout} shape="box" instanceSize={0.24}
            color={p.color} emissive={p.color} emissiveIntensity={0.45} roughness={0.5} />
    );
};

const SwarmScene = ({ p }) => {
    const layout = useMemo(
        () => cubeSwarm({ count: p.count, speed: p.speed, bounds: p.bounds }),
        [p.count, p.speed, p.bounds],
    );
    return (
        <InstancedGrid layout={layout} shape="box" instanceSize={0.2}
            color={p.color} emissive={p.color} emissiveIntensity={0.3} roughness={0.4} metalness={0.3} />
    );
};

const WavesScene = ({ p }) => {
    const layout = useMemo(
        () => waveGrid({ cols: p.cols, amplitude: p.amplitude, speed: p.speed }),
        [p.cols, p.amplitude, p.speed],
    );
    return (
        <group rotation={[-0.35, 0, 0]} position={[0, -2, 0]}>
            <InstancedGrid layout={layout} shape="box" instanceSize={0.3}
                color={p.color} emissive={p.color} emissiveIntensity={0.25} roughness={0.55} />
        </group>
    );
};

const VoxelScene = ({ p }) => {
    const layout = useMemo(
        () => voxelSphere({ count: p.count, radius: p.radius, rotateSpeed: p.speed }),
        [p.count, p.radius, p.speed],
    );
    return (
        <InstancedGrid layout={layout} shape="box" instanceSize={0.11}
            color={p.color} emissive={p.color} emissiveIntensity={0.5} roughness={0.4} />
    );
};

const GearsScene = ({ p }) => {
    const layout = useMemo(
        () => gearField({ count: p.count, spin: p.spin, size: p.size }),
        [p.count, p.spin, p.size],
    );
    return (
        <InstancedGrid layout={layout} shape="cylinder" instanceSize={0.9}
            color={p.color} emissive={p.color} emissiveIntensity={0.2} roughness={0.35} metalness={0.6} />
    );
};

const OrigamiScene = ({ p }) => {
    const layout = useMemo(
        () => origamiFold({ count: p.count, speed: p.speed, maxAngle: p.maxAngle }),
        [p.count, p.speed, p.maxAngle],
    );
    return (
        <InstancedGrid layout={layout} shape="box" instanceSize={0.6}
            color={p.color} emissive={p.color} emissiveIntensity={0.25} roughness={0.6} />
    );
};

const ParticlesScene = ({ p }) => (
    <ParticleField count={p.count} radius={p.radius} speed={p.speed}
        color={p.color} distribution="shell" size={0.05} glow opacity={0.85} />
);

const OceanScene = ({ p }) => (
    <group position={[0, -1.6, 0]}>
        <OceanPlane color={p.color} crestColor={p.crestColor} speed={p.speed}
            waveCount={p.waveCount} size={40} segments={128} />
    </group>
);

const PortalScene = ({ p }) => (
    <>
        <PortalRing color={p.color} speed={p.speed} radius={p.radius} particleCount={p.particleCount} />
        {/* faint dust behind the ring so the void has depth */}
        <ParticleField count={250} radius={8} speed={0.15} color={p.color} size={0.03} opacity={0.35} glow={false} />
    </>
);

const MorphScene = ({ p }) => (
    <MorphShape color={p.color} speed={p.speed} size={p.size} />
);

// scene id → { render, camera }. Camera is presentation, so it lives here
// with the heavy objects, not in the store.
const SCENE_VIEWS = {
    shader:    { render: (p) => <ShaderScene p={p} />,    camera: { position: [0, 0, 6],   fov: 60 } },
    galaxy:    { render: (p) => <GalaxyScene p={p} />,    camera: { position: [0, 5, 9],   fov: 55 } },
    orbit:     { render: (p) => <OrbitScene p={p} />,     camera: { position: [0, 1.5, 8], fov: 55 } },
    tunnel:    { render: (p) => <TunnelScene p={p} />,    camera: { position: [0, 0, 6],   fov: 70 } },
    swarm:     { render: (p) => <SwarmScene p={p} />,     camera: { position: [0, 0, 11],  fov: 55 } },
    waves:     { render: (p) => <WavesScene p={p} />,     camera: { position: [0, 4, 10],  fov: 55 } },
    voxel:     { render: (p) => <VoxelScene p={p} />,     camera: { position: [0, 0, 7],   fov: 55 } },
    gears:     { render: (p) => <GearsScene p={p} />,     camera: { position: [0, 0, 11],  fov: 55 } },
    origami:   { render: (p) => <OrigamiScene p={p} />,   camera: { position: [0, 3, 9],   fov: 55 } },
    particles: { render: (p) => <ParticlesScene p={p} />, camera: { position: [0, 0, 8],   fov: 60 } },
    ocean:     { render: (p) => <OceanScene p={p} />,     camera: { position: [0, 2.5, 7], fov: 60 } },
    portal:    { render: (p) => <PortalScene p={p} />,    camera: { position: [0, 0, 6],   fov: 60 } },
    morph:     { render: (p) => <MorphScene p={p} />,     camera: { position: [0, 0, 6],   fov: 55 } },
};

const StarryNight = () => {
    const sceneState = useSyncExternalStore(sceneSubscribe, sceneGetState, sceneGetState);
    const scene = currentScene(sceneState);
    const params = sceneParams(sceneState);
    const view = SCENE_VIEWS[scene.id] || SCENE_VIEWS.shader;

    return (
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
            <Stage
                key={scene.id}
                background={null}
                camera={view.camera}
                fallback={null}
            >
                {view.render(params)}
            </Stage>
        </div>
    );
};

export default StarryNight;
