import React from 'react';
import { Stage, InteractiveSurface, kineticType } from 'easy-3dkit';

/*
 * StarryNight — live kinetic backdrop for the terminal desktop.
 *
 * A single easy-3dkit InteractiveSurface running the kineticType shader:
 * flowing diagonal stripes that drift over time and lens away from the cursor.
 * ink/paper are tuned to the terminal palette so it reads as a deep, calm
 * backdrop rather than the default cream stripes.
 *
 * Rendered behind the terminal window; pointer-events disabled so it never
 * intercepts clicks. <Stage> falls back gracefully if WebGL is unavailable.
 */
const StarryNight = () => (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <Stage
            background={null}
            camera={{ position: [0, 0, 6], fov: 60 }}
            fallback={null}
        >
            {/* Full-view kinetic-type plane */}
            <group scale={16}>
                <InteractiveSurface
                    material={kineticType}
                    size={[2, 2]}
                    segments={1}
                    params={{ ink: '#06080b', paper: '#0e2a18', freq: 14, warp: 0.6, pull: 1.0 }}
                />
            </group>
        </Stage>
    </div>
);

export default StarryNight;
