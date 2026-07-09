/*
 * fxStore — the live control surface for the easy-3dkit backdrop.
 *
 * The terminal (and, when it's closed, the wallpaper bar) lets a visitor
 * carousel/shuffle through EVERY easy-3dkit shader effect and tweak each one's
 * settings in real time. Consumers share one source of truth through this store:
 *   • the `fx` terminal command   (lib/CommandParser.jsx)   — typing drives it
 *   • the carousel HUD            (ui/FxHud.jsx)            — sliders drive it
 *   • the wallpaper control bar   (ui/FxWallpaperBar.jsx)   — closed / phone
 *   • the live backdrop           (ui/StarryNight.jsx)      — renders the result
 *   • the credit                  (ui/FxCredit.jsx)         — shows what's live
 *
 * IMPORTANT: this module holds ONLY plain data + store logic — it must never
 * import 'easy-3dkit' (and therefore three.js). The command parser imports this
 * file eagerly with the terminal; pulling three in here would undo the lazy
 * backdrop load and regress landing performance. The heavy material objects are
 * mapped by id inside StarryNight, which is already lazy-loaded.
 *
 * CATALOG mirrors each material's `controls` schema (min/max/step) and `docs`
 * from easy-3dkit; every `defaults` is re-tuned toward the dark terminal palette
 * so even the kit's brighter effects read as a calm backdrop here.
 */

const range = (key, min, max, step) => ({ key, type: 'range', min, max, step });
const color = (key) => ({ key, type: 'color' });

// All 21 easy-3dkit surface effects, dark-tuned. Order = carousel order;
// Liquid Blob leads so it's the effect on screen when the terminal loads.
export const CATALOG = [
    {
        id: 'liquid-blob', name: 'Liquid Blob',
        blurb: 'Merging metaballs drifting through the void',
        controls: [range('count', 1, 12, 1), range('smooth', 0.05, 1, 0.01), range('speed', 0, 3, 0.1), color('colorA'), color('colorB')],
        defaults: { count: 5, smooth: 0.4, speed: 0.4, colorA: '#0a2a4a', colorB: '#123d2a' },
        docs: { count: 'Number of blobs', smooth: 'How much blobs fuse together', speed: 'Drift speed', colorA: 'First gradient colour', colorB: 'Second gradient colour' },
    },
    {
        id: 'kinetic-type', name: 'Kinetic Type',
        blurb: 'Flowing diagonal stripes that lens away from the cursor',
        controls: [color('ink'), color('paper'), range('freq', 4, 60, 1), range('warp', 0, 1, 0.01), range('pull', 0, 2, 0.01)],
        defaults: { ink: '#06080b', paper: '#0e2a18', freq: 14, warp: 0.6, pull: 1.0 },
        docs: { ink: 'Dark stripe colour', paper: 'Light colour between the stripes', freq: 'Stripe density', warp: 'Amplitude of the noise warp', pull: 'Strength of the cursor lens' },
    },
    {
        id: 'plasma', name: 'Plasma',
        blurb: 'Classic demoscene plasma, drifting between two hues',
        controls: [range('scale', 2, 24, 0.5), range('speed', 0, 3, 0.05), color('colorA'), color('colorB')],
        defaults: { scale: 12, speed: 0.3, colorA: '#123a5a', colorB: '#0e3324' },
        docs: { scale: 'Cell size of the plasma field', speed: 'Animation speed', colorA: 'First blend colour', colorB: 'Second blend colour' },
    },
    {
        id: 'voronoi-cells', name: 'Voronoi Cells',
        blurb: 'Living cellular mosaic with a travelling light',
        controls: [range('scale', 2, 20, 0.5), range('speed', 0, 3, 0.05), range('lightRadius', 0.05, 1.5, 0.01), color('cellColor'), color('edgeColor')],
        defaults: { scale: 7, speed: 0.35, lightRadius: 0.6, cellColor: '#1f9d86', edgeColor: '#06080b' },
        docs: { scale: 'Number of cells', speed: 'How fast cells drift', lightRadius: 'Size of the moving highlight', cellColor: 'Cell fill colour', edgeColor: 'Edge / gap colour' },
    },
    {
        id: 'bioluminescent', name: 'Bioluminescent',
        blurb: 'Deep-sea glow that breathes in the dark',
        controls: [color('glow'), color('base'), range('scale', 1, 12, 0.5), range('breath', 0.05, 2, 0.05), range('intensity', 0.2, 4, 0.1)],
        defaults: { glow: '#27f5c8', base: '#020308', scale: 4, breath: 0.5, intensity: 1.2 },
        docs: { glow: 'Emissive glow colour', base: 'Dark background colour', scale: 'Pattern scale', breath: 'Pulse speed', intensity: 'Glow strength' },
    },
    {
        id: 'neon-line-art', name: 'Neon Line Art',
        blurb: 'Terminal-green neon contours on near-black',
        controls: [color('lineColor'), color('bgColor'), range('density', 4, 40, 1), range('thickness', 0.005, 0.2, 0.005), range('pulse', 0, 3, 0.05)],
        defaults: { lineColor: '#39d353', bgColor: '#06080b', density: 12, thickness: 0.03, pulse: 0.8 },
        docs: { lineColor: 'Neon line colour', bgColor: 'Background colour', density: 'Number of contour lines', thickness: 'Line thickness', pulse: 'Glow pulse speed' },
    },
    {
        id: 'moire', name: 'Moiré',
        blurb: 'Interfering grids that shimmer as they rotate',
        controls: [color('colorA'), color('colorB'), range('frequency', 10, 200, 1), range('angle', 0, 0.6, 0.005), range('sharpness', 0.5, 6, 0.1)],
        defaults: { colorA: '#06080b', colorB: '#1f8b74', frequency: 70, angle: 0.08, sharpness: 2.0 },
        docs: { colorA: 'Trough colour', colorB: 'Fringe colour', frequency: 'Grid line density', angle: 'Rotation between the grids', sharpness: 'Fringe contrast' },
    },
    {
        id: 'scanlines', name: 'Scanlines',
        blurb: 'A CRT phosphor glow — right at home in a terminal',
        controls: [color('tint'), color('dark'), range('lineFreq', 40, 600, 1), range('aberration', 0, 0.02, 0.0005), range('flicker', 0, 0.4, 0.01)],
        defaults: { tint: '#39d353', dark: '#02060a', lineFreq: 220, aberration: 0.003, flicker: 0.06 },
        docs: { tint: 'Phosphor colour', dark: 'Frame / gap colour', lineFreq: 'Scanline density', aberration: 'Chromatic aberration', flicker: 'Flicker amount' },
    },
    {
        id: 'heat-haze', name: 'Heat Haze',
        blurb: 'A warm gradient rippling as if seen through heat',
        controls: [color('colorTop'), color('colorBottom'), range('strength', 0, 0.2, 0.005), range('speed', 0, 4, 0.1), range('scale', 1, 16, 0.5)],
        defaults: { colorTop: '#06121f', colorBottom: '#0e3d2a', strength: 0.05, speed: 0.8, scale: 6 },
        docs: { colorTop: 'Top gradient colour', colorBottom: 'Bottom gradient colour', strength: 'Ripple distortion amount', speed: 'Ripple speed', scale: 'Ripple scale' },
    },
    {
        id: 'brushed-metal', name: 'Brushed Metal',
        blurb: 'Anisotropic brushed-metal sheen with a moving highlight',
        controls: [color('base'), color('sheen'), range('grain', 40, 600, 1), range('aniso', 0, 1, 0.01), range('contrast', 0, 1, 0.01)],
        defaults: { base: '#12333a', sheen: '#56d4dd', grain: 240, aniso: 0.85, contrast: 0.45 },
        docs: { base: 'Underlying metal colour', sheen: 'Highlight / edge colour', grain: 'Scratch frequency', aniso: 'Isotropic (0) → stretched streaks (1)', contrast: 'Scratch depth' },
    },
    {
        id: 'dither8bit', name: 'Dither 8-bit',
        blurb: 'Retro ordered-dither gradient in chunky pixels',
        controls: [color('dark'), color('light'), range('levels', 2, 12, 1), range('pixel', 16, 256, 1)],
        defaults: { dark: '#06080b', light: '#39d353', levels: 4, pixel: 96 },
        docs: { dark: 'Low palette endpoint', light: 'Bright palette endpoint', levels: 'Posterisation steps', pixel: 'Pixel-grid resolution (lower = chunkier)' },
    },
    {
        id: 'fractal-zoom', name: 'Fractal Zoom',
        blurb: 'An endless escape-time dive into the Mandelbrot set',
        controls: [range('iterations', 16, 512, 1), range('zoomSpeed', 0, 1, 0.01), range('julia', 0, 1, 0.01), color('inside'), color('palette')],
        defaults: { iterations: 96, zoomSpeed: 0.12, julia: 0, inside: '#05060f', palette: '#1f9d86' },
        docs: { iterations: 'Escape-time detail (cost)', zoomSpeed: 'Rate of the dive', julia: 'Mandelbrot (0) → Julia (1)', inside: 'Interior tint', palette: 'Escape-colour hue base' },
    },
    {
        id: 'frosted-glass', name: 'Frosted Glass',
        blurb: 'Blurred, refracting frosted glass with a rim sheen',
        controls: [color('tint'), color('highlight'), range('frost', 0.2, 5, 0.1), range('refract', 0, 1, 0.01), range('opacity', 0, 1, 0.01)],
        defaults: { tint: '#0e2a2a', highlight: '#56d4dd', frost: 1.6, refract: 0.18, opacity: 0.55 },
        docs: { tint: 'Base panel colour', highlight: 'Bright / rim colour', frost: 'Blur spread', refract: 'Glass-wobble strength', opacity: 'Panel opacity' },
    },
    {
        id: 'glassmorphism', name: 'Glassmorphism',
        blurb: 'Soft translucent glass with a cursor-lit sheen',
        controls: [color('tint'), range('opacity', 0.1, 1, 0.05), range('blobScale', 0.3, 4, 0.1)],
        defaults: { tint: '#123d33', opacity: 0.5, blobScale: 1.4 },
        docs: { tint: 'Base glass colour', opacity: 'Panel translucency', blobScale: 'Frost-noise grain' },
    },
    {
        id: 'holographic-foil', name: 'Holographic Foil',
        blurb: 'Rainbow holo-foil that sweeps as the view shifts',
        controls: [color('tint'), range('hueScale', 0.5, 8, 0.1), range('streakSharp', 4, 64, 1), range('grain', 0, 0.6, 0.01)],
        defaults: { tint: '#2a6b5a', hueScale: 3, streakSharp: 24, grain: 0.15 },
        docs: { tint: 'Multiplier colour over the foil', hueScale: 'Rainbow cycles across the sweep', streakSharp: 'Specular streak tightness', grain: 'Micro-noise amount' },
    },
    {
        id: 'iridescent', name: 'Iridescent',
        blurb: 'Oil-slick iridescent bands drifting through the spectrum',
        controls: [range('bands', 1, 16, 0.5), range('shiftSpeed', 0, 2, 0.05)],
        defaults: { bands: 6, shiftSpeed: 0.25 },
        docs: { bands: 'Rainbow repetitions across the surface', shiftSpeed: 'How fast the spectrum drifts' },
    },
    {
        id: 'rain-streaks', name: 'Rain Streaks',
        blurb: 'Rain beading and running down a dark glass pane',
        controls: [color('glassColor'), color('streakColor'), range('density', 8, 120, 1), range('speed', 0.1, 2, 0.05), range('blur', 0.05, 1, 0.01)],
        defaults: { glassColor: '#06121a', streakColor: '#56d4dd', density: 40, speed: 0.6, blur: 0.35 },
        docs: { glassColor: 'Wet-glass colour', streakColor: 'Droplet / trail colour', density: 'Number of rain columns', speed: 'Fall speed', blur: 'Streak softness' },
    },
    {
        id: 'thermal-vision', name: 'Thermal Vision',
        blurb: 'Thermal-camera heat ramp over living noise',
        controls: [range('intensity', 0.2, 2.5, 0.1), range('noiseScale', 0.5, 8, 0.5)],
        defaults: { intensity: 0.9, noiseScale: 3 },
        docs: { intensity: 'Overall heat gain', noiseScale: 'Hot-patch size (higher = smaller)' },
    },
    {
        id: 'toon-cel', name: 'Toon Cel',
        blurb: 'Flat cel-shaded bands with an inked silhouette',
        controls: [color('base'), color('shadow'), range('steps', 2, 8, 1), range('outline', 0.5, 6, 0.1)],
        defaults: { base: '#1f9d86', shadow: '#06181a', steps: 4, outline: 2.5 },
        docs: { base: 'Lit band colour', shadow: 'Unlit band colour', steps: 'Number of light bands', outline: 'Silhouette ink tightness' },
    },
    {
        id: 'wireframe-morph', name: 'Wireframe Morph',
        blurb: 'A neon wireframe grid swelling toward solid fill',
        controls: [color('lineColor'), color('fillColor'), range('density', 4, 80, 1), range('lineWidth', 0.005, 0.2, 0.005), range('morphSpeed', 0, 3, 0.05)],
        defaults: { lineColor: '#39d353', fillColor: '#06121a', density: 24, lineWidth: 0.04, morphSpeed: 0.4 },
        docs: { lineColor: 'Grid-line colour', fillColor: 'Cell background colour', density: 'Number of grid cells', lineWidth: 'Line half-width', morphSpeed: 'Line→fill oscillation speed' },
    },
    {
        id: 'xray-ghost', name: 'X-Ray Ghost',
        blurb: 'A hollow x-ray shell glowing only at its rim',
        controls: [color('rimColor'), color('coreColor'), range('rimPower', 0.5, 8, 0.1), range('opacity', 0, 1, 0.01)],
        defaults: { rimColor: '#56d4dd', coreColor: '#06121a', rimPower: 2.6, opacity: 0.5 },
        docs: { rimColor: 'Grazing-edge glow colour', coreColor: 'Faint body colour', rimPower: 'How tightly the glow hugs the edge', opacity: 'Overall alpha' },
    },
];

export const EFFECT_COUNT = CATALOG.length;

// How often auto-shuffle rotates the backdrop (ms). Shared by the command's
// help text and the interval that Terminal actually runs.
export const AUTO_SHUFFLE_MS = 8000;

/* ─── store ──────────────────────────────────────────────────────────── */

// state is replaced (never mutated) on every change so useSyncExternalStore
// sees a fresh reference; unchanged reads return the same object.
let state = { index: 0, overrides: {}, hud: false, auto: false };
const listeners = new Set();
const emit = () => { for (const fn of listeners) fn(); };
const set = (patch) => { state = { ...state, ...patch }; emit(); };

export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const getState = () => state;

/* ─── selectors ──────────────────────────────────────────────────────── */

export const currentEffect = (s = state) => CATALOG[s.index];

// Live params for an effect = tuned defaults merged with any user overrides.
export const effectParams = (s = state) => {
    const e = CATALOG[s.index];
    return { ...e.defaults, ...(s.overrides[e.id] || {}) };
};

// -1 when nothing matches. Accepts a 1-based number, or an id/name prefix
// (punctuation-insensitive: "voronoi", "neonline", "kinetic" all resolve).
export const resolveEffect = (token) => {
    if (!token) return -1;
    const t = String(token).trim().toLowerCase();
    if (/^\d+$/.test(t)) { const i = parseInt(t, 10) - 1; return i >= 0 && i < EFFECT_COUNT ? i : -1; }
    const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const nt = norm(t);
    return CATALOG.findIndex((e) => norm(e.id).startsWith(nt) || norm(e.name).startsWith(nt));
};

/* ─── actions ────────────────────────────────────────────────────────── */

const wrap = (i) => ((i % EFFECT_COUNT) + EFFECT_COUNT) % EFFECT_COUNT;

export const fxGoto = (i) => set({ index: wrap(i), hud: true });
export const fxNext = () => fxGoto(state.index + 1);
export const fxPrev = () => fxGoto(state.index - 1);

// Jump to a random *different* effect. Does not force the HUD open, so it works
// quietly for auto-shuffle; callers that want the panel call fxShowHud(true).
export const fxShuffle = () => {
    if (EFFECT_COUNT < 2) return;
    let i = state.index;
    while (i === state.index) i = Math.floor(Math.random() * EFFECT_COUNT);
    set({ index: i });
};

export const fxSetParam = (key, value) => {
    const { id } = currentEffect();
    set({ overrides: { ...state.overrides, [id]: { ...(state.overrides[id] || {}), [key]: value } } });
};

// Drop overrides for the current effect, restoring its tuned defaults.
export const fxResetCurrent = () => {
    const { id } = currentEffect();
    if (!state.overrides[id]) return;
    const next = { ...state.overrides };
    delete next[id];
    set({ overrides: next });
};

export const fxShowHud = (v = true) => set({ hud: v });
export const fxToggleHud = () => set({ hud: !state.hud });

export const fxSetAuto = (v = true) => set({ auto: !!v });
export const fxToggleAuto = () => set({ auto: !state.auto });
