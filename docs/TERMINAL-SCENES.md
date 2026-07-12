# Terminal 3D Scenes

The terminal backdrop is no longer just one shader plane — it's a set of **13
swappable 3D scenes**, each showcasing a different easy-3dkit element. This
doc explains the architecture, the commands, and how to add a scene.

## Architecture

Two stores drive the backdrop, both following the same rule: **stores hold
plain data only and never import `easy-3dkit`** (and therefore three.js). The
heavy objects live exclusively in the lazy-loaded `StarryNight` chunk, which
is what keeps three.js out of the landing bundle (see
`docs/SITE-AUDIT-2026-07.md` for why that matters).

```
src/features/terminalMode/
├── lib/
│   ├── fxStore.js      WHICH SHADER runs on the flat surface (21 effects)
│   ├── sceneStore.js   WHICH SCENE is mounted (shader surface is scene 1)
│   └── CommandParser.jsx  `fx` and `scene` commands; cd → scene steering
└── ui/
    └── StarryNight.jsx  lazy; ALL easy-3dkit imports; scene id → component
```

- `sceneStore.js` — catalog of scenes (id, name, element, blurb, controls
  schema, dark-tuned defaults, docs) + a tiny replace-never-mutate store
  (`useSyncExternalStore`-compatible), selectors, and actions.
- `StarryNight.jsx` — maps scene ids to small scene components and per-scene
  cameras. The `<Stage>` is keyed on the scene id so a switch remounts the
  canvas cleanly. Rendered `pointer-events: none` behind the window; `Stage`
  falls back gracefully when WebGL is unavailable.

## The scenes

| # | id | Element | Look |
|---|----|---------|------|
| 1 | `shader` | `InteractiveSurface` | classic flat backdrop; the `fx` carousel drives its 21 shader effects |
| 2 | `galaxy` | `galaxySpiral` → `InstancedGrid` | spiral galaxy of glowing spheres |
| 3 | `orbit` | `orbitLayout` → `InstancedGrid` | icosahedra orbiting in shells |
| 4 | `tunnel` | `tunnelLayout` → `InstancedGrid` | fly-through ring tunnel |
| 5 | `swarm` | `cubeSwarm` → `InstancedGrid` | drifting cube murmuration |
| 6 | `waves` | `waveGrid` → `InstancedGrid` | cube field rolling with sine waves |
| 7 | `voxel` | `voxelSphere` → `InstancedGrid` | hollow voxel globe |
| 8 | `gears` | `gearField` → `InstancedGrid` | wall of spinning cylinders |
| 9 | `origami` | `origamiFold` → `InstancedGrid` | folding paper panels |
| 10 | `particles` | `ParticleField` | glowing tumbling point-cloud shell |
| 11 | `ocean` | `OceanPlane` | dark sea with teal crests |
| 12 | `portal` | `PortalRing` + `ParticleField` | particle portal + background dust (composition) |
| 13 | `morph` | `MorphShape` | organism-like morphing blob |

## Commands

`scene` mirrors `fx` exactly:

```
scene                    help
scene list               all scenes (▸ marks the live one)
scene <name|number>      switch ("scene galaxy", "scene 4")
scene next / prev        carousel
scene random             random scene
scene info               live scene's settings
scene set <param> <val>  tweak (number, clamped to range, or #hexcolor)
scene reset              restore the live scene's defaults
scene follow [off]       cd steers the backdrop by section
```

Aliases: `scenes`, `bg`. Tab completion and `man scene` come free from the
command registry.

## Scene follow (cd steering)

While follow is **on** (the default), `cd` swaps the backdrop by section, so
the scene doubles as a spatial cue:

- `~/projects` → Orbit Cluster
- `~/experience` → Ring Tunnel
- `~/research` → Morph Shape
- anywhere else / home → Shader Surface

The switch is announced once (`· backdrop → Orbit Cluster ('scene follow off'
to stop)`) and stays quiet when cd doesn't change the scene. **Manually
picking a scene turns follow off** so the choice sticks; `scene follow` turns
it back on. The mapping lives in `SCENE_FOR_DIR` in `CommandParser.jsx`.

## fx ↔ scene coupling

The `fx` carousel only makes sense on the shader surface, so any fx selection
or tweak (`fx plasma`, HUD sliders, dock transport, wallpaper bar) calls
`pullToShader()` — the backdrop jumps to the shader scene and pins it
(follow off). Once already on the shader scene this is a no-op, so `fx auto`
doesn't spam the store.

## Adding a scene

1. **Catalog** — add an entry to `SCENES` in `sceneStore.js`: id, name,
   element label, blurb, `controls` (use the `range`/`color` helpers, ≤4
   params), dark-tuned `defaults`, and one-line `docs` per param. No kit
   imports here — ever.
2. **Renderer** — in `StarryNight.jsx`, write a small `<XScene p={params}>`
   component (memoize layout factories on their param deps) and register it
   in `SCENE_VIEWS` with a camera.
3. Optionally map a VFS directory to it in `SCENE_FOR_DIR`.

That's it — `scene list/info/set/reset`, tab completion, and the mobile chips
pick it up automatically from the catalog.

## Mobile

The tap-driven mobile terminal exposes the system through the `3d scenes` and
`next scene` quick chips; the ◆ header button toggles the fx wallpaper bar
mini-player, which pulls the backdrop to the shader scene when used.
