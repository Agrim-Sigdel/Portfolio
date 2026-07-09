import React, { useSyncExternalStore } from 'react';
import {
    Stage, InteractiveSurface,
    kineticType, plasma, voronoiCells, bioluminescent, neonLineArt, moire, liquidBlob, scanlines, heatHaze,
    brushedMetal, dither8bit, fractalZoom, frostedGlass, glassmorphism, holographicFoil,
    iridescent, rainStreaks, thermalVision, toonCel, wireframeMorph, xrayGhost,
} from 'easy-3dkit';
import { subscribe, getState, currentEffect, effectParams } from '../lib/fxStore';

/*
 * StarryNight — live easy-3dkit backdrop for the terminal desktop.
 *
 * A single InteractiveSurface whose material + params are driven by fxStore, so
 * the `fx` command and the carousel HUD can swap effects and tweak settings in
 * real time. Defaults to the kineticType "flowing stripes" look tuned to the
 * terminal palette. Swapping the material prop swaps the effect with zero
 * plumbing (InteractiveSurface rebuilds its uniforms on the material id).
 *
 * This is the only module that imports easy-3dkit (hence three.js), and it is
 * lazy-loaded by Terminal — keep the heavy imports here, not in fxStore.
 *
 * Rendered behind the terminal window; pointer-events disabled so it never
 * intercepts clicks. <Stage> falls back gracefully if WebGL is unavailable.
 */

// id → material object. The heavy objects live here; fxStore only knows ids.
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

const StarryNight = () => {
    const state = useSyncExternalStore(subscribe, getState, getState);
    const effect = currentEffect(state);
    const material = MATERIALS[effect.id];
    const params = effectParams(state);

    return (
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
            <Stage
                background={null}
                camera={{ position: [0, 0, 6], fov: 60 }}
                fallback={null}
            >
                {/* Full-view surface plane running the selected effect */}
                <group scale={16}>
                    <InteractiveSurface
                        material={material}
                        size={[2, 2]}
                        segments={1}
                        params={params}
                    />
                </group>
            </Stage>
        </div>
    );
};

export default StarryNight;
