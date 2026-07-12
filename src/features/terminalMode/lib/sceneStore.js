/*
 * sceneStore — which 3D "screen" is live behind the terminal.
 *
 * The fx carousel (fxStore) drives WHICH SHADER runs on the flat backdrop
 * surface. This store sits one level above it: it picks WHICH SCENE is
 * mounted — the shader surface is just the first scene; the others are full
 * 3D compositions built from different easy-3dkit elements (instanced
 * layouts, particles, the ocean plane, the portal ring, …).
 *
 * Consumers, mirroring fxStore:
 *   • the `scene` terminal command  (lib/CommandParser.jsx) — typing drives it
 *   • the live backdrop             (ui/StarryNight.jsx)    — renders the result
 *   • `cd` section navigation       (lib/CommandParser.jsx) — scene follow
 *
 * IMPORTANT: like fxStore, this module holds ONLY plain data + store logic —
 * it must never import 'easy-3dkit' (and therefore three.js). The heavy scene
 * components are mapped by id inside StarryNight, which is lazy-loaded.
 *
 * "Scene follow" ties the backdrop to where the visitor is in the VFS
 * (~/projects → the orbit cluster, ~/experience → the tunnel, …). Manually
 * picking a scene turns follow off so the choice sticks; `scene follow`
 * turns it back on.
 */

const range = (key, min, max, step) => ({ key, type: 'range', min, max, step });
const color = (key) => ({ key, type: 'color' });

// Every scene showcases a different easy-3dkit element. Order = carousel
// order; the shader surface leads because it's the classic backdrop.
export const SCENES = [
    {
        id: 'shader', name: 'Shader Surface', element: 'InteractiveSurface',
        blurb: "The classic flat backdrop — all 21 shader effects, driven by 'fx'",
        controls: [], defaults: {}, docs: {},
    },
    {
        id: 'galaxy', name: 'Galaxy Spiral', element: 'galaxySpiral → InstancedGrid',
        blurb: 'A slow-turning spiral galaxy of instanced spheres',
        controls: [range('count', 200, 2000, 50), range('arms', 1, 6, 1), range('speed', 0, 1, 0.05), color('color')],
        defaults: { count: 900, arms: 3, speed: 0.12, color: '#56d4dd' },
        docs: { count: 'Number of stars', arms: 'Spiral arms', speed: 'Rotation speed', color: 'Star colour' },
    },
    {
        id: 'orbit', name: 'Orbit Cluster', element: 'orbitLayout → InstancedGrid',
        blurb: 'Shells of icosahedra orbiting a common core',
        controls: [range('count', 30, 400, 10), range('shells', 1, 6, 1), range('speed', 0, 2, 0.05), color('color')],
        defaults: { count: 140, shells: 3, speed: 0.3, color: '#39d353' },
        docs: { count: 'Bodies in orbit', shells: 'Concentric orbit shells', speed: 'Orbital speed', color: 'Body colour' },
    },
    {
        id: 'tunnel', name: 'Ring Tunnel', element: 'tunnelLayout → InstancedGrid',
        blurb: 'Flying through an endless tunnel of rings',
        controls: [range('count', 60, 600, 20), range('speed', 0, 3, 0.05), range('radius', 1.5, 8, 0.25), color('color')],
        defaults: { count: 280, speed: 0.8, radius: 3.5, color: '#d2a8ff' },
        docs: { count: 'Blocks forming the rings', speed: 'Fly-through speed', radius: 'Tunnel radius', color: 'Block colour' },
    },
    {
        id: 'swarm', name: 'Cube Swarm', element: 'cubeSwarm → InstancedGrid',
        blurb: 'A loose flock of cubes drifting like a murmuration',
        controls: [range('count', 20, 400, 10), range('speed', 0, 2, 0.05), range('bounds', 3, 14, 0.5), color('color')],
        defaults: { count: 120, speed: 0.5, bounds: 7, color: '#56d4dd' },
        docs: { count: 'Cubes in the swarm', speed: 'Drift speed', bounds: 'Size of the flight box', color: 'Cube colour' },
    },
    {
        id: 'waves', name: 'Wave Grid', element: 'waveGrid → InstancedGrid',
        blurb: 'A field of cubes rolling with sine waves',
        controls: [range('cols', 8, 40, 1), range('amplitude', 0.1, 3, 0.1), range('speed', 0, 3, 0.05), color('color')],
        defaults: { cols: 24, amplitude: 0.9, speed: 0.8, color: '#39d353' },
        docs: { cols: 'Grid columns (cols²  cubes)', amplitude: 'Wave height', speed: 'Wave speed', color: 'Cube colour' },
    },
    {
        id: 'voxel', name: 'Voxel Sphere', element: 'voxelSphere → InstancedGrid',
        blurb: 'A hollow globe assembled from tiny voxels',
        controls: [range('count', 100, 1200, 50), range('radius', 1, 5, 0.25), range('speed', 0, 1.5, 0.05), color('color')],
        defaults: { count: 550, radius: 2.6, speed: 0.25, color: '#56d4dd' },
        docs: { count: 'Voxels on the shell', radius: 'Globe radius', speed: 'Spin speed', color: 'Voxel colour' },
    },
    {
        id: 'gears', name: 'Gear Field', element: 'gearField → InstancedGrid',
        blurb: 'A wall of meshing cylinders slowly spinning',
        controls: [range('count', 4, 40, 1), range('spin', 0, 3, 0.05), range('size', 0.4, 3, 0.1), color('color')],
        defaults: { count: 14, spin: 0.6, size: 1.2, color: '#d2a8ff' },
        docs: { count: 'Gears in the field', spin: 'Rotation speed', size: 'Gear size', color: 'Gear colour' },
    },
    {
        id: 'origami', name: 'Origami Fold', element: 'origamiFold → InstancedGrid',
        blurb: 'Paper panels folding and unfolding in a grid',
        controls: [range('count', 6, 60, 2), range('speed', 0, 2, 0.05), range('maxAngle', 0.2, 3.1, 0.05), color('color')],
        defaults: { count: 24, speed: 0.5, maxAngle: 1.4, color: '#56d4dd' },
        docs: { count: 'Folding panels', speed: 'Fold speed', maxAngle: 'How far each panel folds', color: 'Panel colour' },
    },
    {
        id: 'particles', name: 'Particle Field', element: 'ParticleField',
        blurb: 'A glowing point-cloud slowly tumbling in space',
        controls: [range('count', 200, 5000, 100), range('radius', 2, 12, 0.5), range('speed', 0, 2, 0.05), color('color')],
        defaults: { count: 1800, radius: 6, speed: 0.4, color: '#39d353' },
        docs: { count: 'Points in the cloud', radius: 'Cloud radius', speed: 'Tumble speed', color: 'Point colour' },
    },
    {
        id: 'ocean', name: 'Ocean Plane', element: 'OceanPlane',
        blurb: 'A dark sea of Gerstner-style waves under the window',
        controls: [color('color'), color('crestColor'), range('speed', 0, 3, 0.05), range('waveCount', 1, 8, 1)],
        defaults: { color: '#0a2a4a', crestColor: '#56d4dd', speed: 0.7, waveCount: 4 },
        docs: { color: 'Deep-water colour', crestColor: 'Wave-crest colour', speed: 'Swell speed', waveCount: 'Overlapping wave trains' },
    },
    {
        id: 'portal', name: 'Portal Ring', element: 'PortalRing + ParticleField',
        blurb: 'A particle portal humming behind the prompt',
        controls: [color('color'), range('speed', 0, 3, 0.05), range('radius', 1, 4, 0.1), range('particleCount', 100, 1200, 50)],
        defaults: { color: '#39d353', speed: 1, radius: 2.2, particleCount: 500 },
        docs: { color: 'Ring / particle colour', speed: 'Swirl speed', radius: 'Ring radius', particleCount: 'Particles in the ring' },
    },
    {
        id: 'morph', name: 'Morph Shape', element: 'MorphShape',
        blurb: 'A single organism-like blob morphing between forms',
        controls: [color('color'), range('speed', 0, 2, 0.05), range('size', 0.5, 4, 0.1)],
        defaults: { color: '#d2a8ff', speed: 0.5, size: 2 },
        docs: { color: 'Surface colour', speed: 'Morph speed', size: 'Blob size' },
    },
];

export const SCENE_COUNT = SCENES.length;

/* ─── store ──────────────────────────────────────────────────────────── */

// Same replace-never-mutate discipline as fxStore, for useSyncExternalStore.
let state = { index: 0, overrides: {}, follow: true };
const listeners = new Set();
const emit = () => { for (const fn of listeners) fn(); };
const set = (patch) => { state = { ...state, ...patch }; emit(); };

export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const getState = () => state;

/* ─── selectors ──────────────────────────────────────────────────────── */

export const currentScene = (s = state) => SCENES[s.index];

export const sceneParams = (s = state) => {
    const sc = SCENES[s.index];
    return { ...sc.defaults, ...(s.overrides[sc.id] || {}) };
};

// -1 when nothing matches. Accepts a 1-based number, or an id/name prefix.
export const resolveScene = (token) => {
    if (!token) return -1;
    const t = String(token).trim().toLowerCase();
    if (/^\d+$/.test(t)) { const i = parseInt(t, 10) - 1; return i >= 0 && i < SCENE_COUNT ? i : -1; }
    const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const nt = norm(t);
    return SCENES.findIndex((sc) => norm(sc.id).startsWith(nt) || norm(sc.name).startsWith(nt));
};

const indexOfId = (id) => SCENES.findIndex((sc) => sc.id === id);

/* ─── actions ────────────────────────────────────────────────────────── */

const wrap = (i) => ((i % SCENE_COUNT) + SCENE_COUNT) % SCENE_COUNT;

// Manual selection pins the choice: scene follow stops steering the backdrop.
export const sceneGoto = (i) => set({ index: wrap(i), follow: false });
export const sceneNext = () => sceneGoto(state.index + 1);
export const scenePrev = () => sceneGoto(state.index - 1);

export const sceneRandom = () => {
    if (SCENE_COUNT < 2) return;
    let i = state.index;
    while (i === state.index) i = Math.floor(Math.random() * SCENE_COUNT);
    set({ index: i, follow: false });
};

export const sceneSetParam = (key, value) => {
    const { id } = currentScene();
    set({ overrides: { ...state.overrides, [id]: { ...(state.overrides[id] || {}), [key]: value } } });
};

export const sceneResetCurrent = () => {
    const { id } = currentScene();
    if (!state.overrides[id]) return;
    const next = { ...state.overrides };
    delete next[id];
    set({ overrides: next });
};

export const sceneSetFollow = (v = true) => set({ follow: !!v });

// cd steering: switch only while follow is on. Returns the scene's name when
// this call actually changed the backdrop (so the caller can announce it).
export const sceneFollowTo = (id) => {
    if (!state.follow) return null;
    const i = indexOfId(id);
    if (i < 0 || i === state.index) return null;
    set({ index: i });
    return SCENES[i].name;
};

// The fx carousel lives on the shader surface — using it pulls the backdrop
// back to the shader scene so the effect being tweaked is actually visible.
export const pullToShader = () => {
    const i = indexOfId('shader');
    if (i !== state.index) set({ index: i, follow: false });
};
