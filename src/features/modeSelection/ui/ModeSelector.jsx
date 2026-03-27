import React, { useEffect, useRef, useState, useCallback } from 'react';
import CustomCursor from '../../../shared/ui/CustomCursor';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import './ModeSelector.css'; // Import the new CSS file

/**
 * Helper function to convert hex color to RGB
 */
const hexToRgb = (hex) => {
    if (!hex) return '0, 0, 0';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
};

/**
 * CONFIGURATION & THEME
 */
const AVAILABLE_MODES = {
    fun: true,
    work: true,
    normal: true
};

const PALETTE = {
    cyan: 0x00f2ff,
    gold: 0xffcc00,
    purple: 0xaa00ff,
    dark: 0x000b14,
    grid: 0x002233,
    white: 0xffffff
};

const MODULES = [
    {
        id: 'fun',
        name: 'CREATIVE',
        code: 'CX-9',
        title: 'Fun Mode',
        description: 'Interactive animations, playful physics, and experimental design.',
        features: ['Smooth Animations', 'Interactive Elements', 'Modern UI'],
        x: -5.5,
        color: PALETTE.cyan,
        colorStr: '#00f2ff'
    },
    {
        id: 'work',
        name: 'TERMINAL',
        code: 'TX-1',
        title: 'Work Mode',
        description: 'Professional command-line interface with developer tools.',
        features: ['Terminal Commands', 'Efficient Navigation', 'Project Logs'],
        x: 0,
        color: PALETTE.gold,
        colorStr: '#ffcc00'
    },
    {
        id: 'normal',
        name: 'CLASSIC',
        code: 'CL-4',
        title: 'Normal Mode',
        description: 'A clean, high-performance, and straightforward layout.',
        features: ['Simple Design', 'Fast Loading', 'Intuitive UI'],
        x: 5.5,
        color: PALETTE.purple,
        colorStr: '#aa00ff'
    }
];

const ModeSelector = ({ onSelectMode }) => { // Changed from export default function App()
    const mountRef = useRef(null);
    const [hoveredModule, setHoveredModule] = useState(MODULES[1]);
    const [clickedModuleData, setClickedModuleData] = useState(null);
    const [selectedModule, setSelectedModule] = useState(null);
    const [clickFeedbackModuleId, setClickFeedbackModuleId] = useState(null);
    const [activeIndex, setActiveIndex] = useState(1);
    const [isSwitching, setIsSwitching] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

    const stateRef = useRef({
        activeIndex: 1,
        isSwitching: false,
        mouse: new THREE.Vector2(),
        raycaster: new THREE.Raycaster(),
        podiums: [],
        camera: null
    });

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleModuleSelect = useCallback((modeId) => {
        if (stateRef.current.isSwitching || !AVAILABLE_MODES[modeId]) return;

        const moduleData = MODULES.find(m => m.id === modeId);
        setSelectedModule(moduleData);
        setIsSwitching(true);
        stateRef.current.isSwitching = true;

        setTimeout(() => {
            setIsSwitching(false);
            stateRef.current.isSwitching = false;
            setSelectedModule(null);
            onSelectMode(modeId); // Call onSelectMode prop
        }, 2500);
    }, [onSelectMode]); // Added onSelectMode to dependency array

    useEffect(() => {
        if (!mountRef.current) return;

        const width = window.innerWidth;
        const height = window.innerHeight;

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(PALETTE.dark, 0.04);
        
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        const isMobile = width < 768;
        camera.position.set(0, isMobile ? 8 : 5, isMobile ? 25 : 18);
        stateRef.current.camera = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mountRef.current.appendChild(renderer.domElement);

        const ambient = new THREE.AmbientLight(0x404040, 1.2);
        scene.add(ambient);
        
        const mainLight = new THREE.SpotLight(0xffffff, 2.5);
        mainLight.position.set(0, 20, 10);
        mainLight.angle = Math.PI / 4;
        mainLight.penumbra = 0.5;
        scene.add(mainLight);

        const grid = new THREE.GridHelper(60, 60, PALETTE.cyan, PALETTE.grid);
        grid.position.y = -3;
        grid.material.transparent = true;
        grid.material.opacity = 0.15;
        scene.add(grid);

        const partGeo = new THREE.BufferGeometry();
        const partPos = new Float32Array(1500 * 3);
        for(let i=0; i<4500; i++) partPos[i] = (Math.random() - 0.5) * 50;
        partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
        const particles = new THREE.Points(partGeo, new THREE.PointsMaterial({ size: 0.03, color: 0x00f2ff, transparent: true, opacity: 0.3 }));
        scene.add(particles);

        // --- Custom Holographic STATIC Material Shader ---
        const createHologramMaterial = (color) => {
            return new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    color: { value: new THREE.Color(color) },
                    opacity: { value: 0.1 },
                    hover: { value: 0.0 }
                },
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform vec3 color;
                    uniform float opacity;
                    uniform float hover;
                    varying vec2 vUv;

                    float random(vec2 st) {
                        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                    }

                    void main() {
                        // Base Digital Grid
                        float grid = (sin(vUv.x * 50.0) * 0.5 + 0.5) * (sin(vUv.y * 50.0) * 0.5 + 0.5);
                        
                        // Static Noise Pattern
                        float n = random(vec2(vUv.y * 100.0, time * 0.5));
                        float staticNoise = random(vUv + time * 0.01);
                        
                        // Scanning Static Beam
                        float beamY = mod(time * 0.3, 1.0);
                        float beamDist = abs(vUv.y - beamY);
                        float beamStatic = step(beamDist, 0.05) * random(vec2(vUv.x * 20.0, time));
                        
                        // High Frequency Flickering
                        float flicker = random(vec2(time, 0.0)) > 0.95 ? 1.5 : 1.0;
                        
                        // Edge transparency
                        float edge = pow(1.0 - abs(vUv.x - 0.5) * 2.0, 3.0) * pow(1.0 - abs(vUv.y - 0.5) * 2.0, 3.0);
                        
                        float alpha = opacity;
                        
                        // On hover, introduce the static chaos
                        alpha += hover * (
                            grid * 0.1 +         // Increased from 0.05
                            beamStatic * 1.0 +   // Increased from 0.5
                            (staticNoise * 0.2 * flicker) // Increased from 0.1
                        );
                        
                        vec3 finalColor = color;
                        // Tint static white slightly on hover
                        finalColor += hover * beamStatic * 0.3;
                        
                        gl_FragColor = vec4(finalColor, alpha * (edge + 0.1) * flicker);
                    }
                `
            });
        };

        const podiumGroups = MODULES.map((mod, i) => {
            const group = new THREE.Group();
            group.position.x = mod.x;
            group.position.y = -3;

            const baseGeo = new THREE.CylinderGeometry(1.8, 2.2, 0.5, 8);
            const baseMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.2, metalness: 0.8 });
            const base = new THREE.Mesh(baseGeo, baseMat);
            group.add(base);

            const bodyGeo = new THREE.CylinderGeometry(1.2, 1.6, 3, 8);
            const bodyMat = new THREE.MeshStandardMaterial({ 
                color: 0x0a0a0a, 
                roughness: 0.1, 
                metalness: 1.0,
                emissive: mod.color,
                emissiveIntensity: 0.02
            });
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            body.position.y = 1.75;
            group.add(body);

            const ringGeo = new THREE.TorusGeometry(1.45, 0.05, 8, 50);
            const ringMat = new THREE.MeshBasicMaterial({ color: mod.color, transparent: true, opacity: 0.6 });
            
            const ring1 = new THREE.Mesh(ringGeo, ringMat);
            ring1.rotation.x = Math.PI/2;
            ring1.position.y = 0.8;
            group.add(ring1);

            const ring2 = ring1.clone();
            ring2.position.y = 2.6;
            ring2.scale.set(0.85, 0.85, 0.85);
            group.add(ring2);

            for(let j=0; j<8; j++) {
                const stripGeo = new THREE.BoxGeometry(0.06, 2.8, 0.12);
                const stripMat = new THREE.MeshBasicMaterial({ color: mod.color });
                const strip = new THREE.Mesh(stripGeo, stripMat);
                const angle = (j / 8) * Math.PI * 2;
                strip.position.set(Math.cos(angle) * 1.35, 1.75, Math.sin(angle) * 1.35);
                strip.lookAt(0, 1.75, 0);
                group.add(strip);
            }

            const cardMat = createHologramMaterial(mod.color);
            const card = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 4.8), cardMat);
            card.position.y = 6.2;
            group.add(card);

            const scannerGeo = new THREE.TorusGeometry(1.15, 0.025, 16, 100);
            const scanner = new THREE.Mesh(scannerGeo, new THREE.MeshBasicMaterial({ color: mod.color, transparent: true, opacity: 0.8 }));
            scanner.position.y = 3.6;
            scanner.rotation.x = Math.PI / 2;
            group.add(scanner);

            group.userData = { 
                id: mod.id, 
                index: i, 
                card, 
                scanner,
                rings: [ring1, ring2],
                body,
                baseColor: mod.color 
            };
            scene.add(group);
            return group;
        });
        stateRef.current.podiums = podiumGroups;

        const onMouseMove = (e) => {
            stateRef.current.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            stateRef.current.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        };

        const onClick = () => {
            stateRef.current.raycaster.setFromCamera(stateRef.current.mouse, camera);
            const targetObjects = podiumGroups.map(p => p.children[12]); 
            const intersects = stateRef.current.raycaster.intersectObjects(targetObjects);
            if (intersects.length > 0) {
                const clickedModule = intersects[0].object.parent.userData;
                if (clickedModuleData && clickedModuleData.id === clickedModule.id) {
                    setClickedModuleData(null); // Close if already open
                } else {
                    setClickedModuleData(MODULES.find(m => m.id === clickedModule.id));
                }
            } else {
                setClickedModuleData(null); // Close if clicked outside
            }
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('click', onClick);

        let frameId;
        const clock = new THREE.Clock();

        const animate = () => {
            frameId = requestAnimationFrame(animate);
            const time = clock.getElapsedTime();

            particles.rotation.y += 0.0004;

            stateRef.current.raycaster.setFromCamera(stateRef.current.mouse, camera);
            const targetObjects = podiumGroups.map(p => p.children[12]);
            const intersects = stateRef.current.raycaster.intersectObjects(targetObjects);
            
            if (intersects.length > 0) {
                const hoveredIdx = intersects[0].object.parent.userData.index;
                if (stateRef.current.activeIndex !== hoveredIdx) {
                    stateRef.current.activeIndex = hoveredIdx;
                    setActiveIndex(hoveredIdx);
                    setHoveredModule(MODULES[hoveredIdx]);
                }
            }
            grid.material.color.set(clickedModuleData?.color || hoveredModule?.color || PALETTE.cyan);

            podiumGroups.forEach((p, i) => {
                const isHovered = i === stateRef.current.activeIndex;
                const isClicked = clickedModuleData && p.userData.id === clickedModuleData.id;
                const isFeedbackClicked = clickFeedbackModuleId && p.userData.id === clickFeedbackModuleId; // New feedback state
                const isActive = isHovered || isClicked;
                const data = p.userData;
                const pulse = (Math.sin(time * 4) * 0.5 + 0.5);
                const activePulse = isActive ? (0.8 + pulse * 0.2) : 0.2;
                
                data.rings.forEach((ring, ri) => {
                    ring.rotation.z += 0.015 * (ri + 1);
                    ring.material.opacity = THREE.MathUtils.lerp(ring.material.opacity, isActive ? 0.9 : 0.4, 0.1);
                });

                data.scanner.rotation.z -= 0.025;
                data.scanner.rotation.x = (Math.PI / 2) + Math.sin(time * 1.5) * 0.08;

                // Update Static Hologram Uniforms
                data.card.material.uniforms.time.value = time;
                data.card.material.uniforms.hover.value = THREE.MathUtils.lerp(
                    data.card.material.uniforms.hover.value,
                    isActive ? 1.0 : 0.0,
                    0.1
                );
                data.card.material.uniforms.opacity.value = THREE.MathUtils.lerp(
                    data.card.material.uniforms.opacity.value,
                    isActive ? 0.4 : 0.08,
                    0.08
                );
                
                data.card.position.y = 6.2 + Math.sin(time * 2 + i) * 0.15;

                data.body.material.emissiveIntensity = THREE.MathUtils.lerp(
                    data.body.material.emissiveIntensity, 
                    isActive ? 0.3 * activePulse : 0.02, 
                    0.1
                );

                let targetScale = isActive ? 1.12 : 1.0;
                if (isFeedbackClicked) {
                    // Exaggerate scale briefly for click feedback
                    targetScale = 1.2 + Math.sin(time * 20) * 0.05; // Quick pulse effect
                }
                p.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
            });

            const targetCamX = stateRef.current.mouse.x * (window.innerWidth < 768 ? 1.5 : 3.5);
            const targetCamY = (window.innerWidth < 768 ? 8 : 5) + stateRef.current.mouse.y * 1.5;
            
            camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, 0.04);
            camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, 0.04);
            camera.lookAt(0, window.innerWidth < 768 ? 4 : 2.5, 0);

            renderer.render(scene, camera);
        };

        animate();

        const onResize = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const mobile = w < 768;
            camera.aspect = w / h;
            camera.position.z = mobile ? 25 : 18;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
            podiumGroups.forEach((p, i) => {
                p.position.x = mobile ? (MODULES[i].x * 0.6) : MODULES[i].x;
            });
        };
        window.addEventListener('resize', onResize);
        onResize();

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('click', onClick);
            window.removeEventListener('resize', onResize);
            cancelAnimationFrame(frameId);
            renderer.dispose();
            if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
        };
    }, [handleModuleSelect]);

    return (
        <div 
            className="mode-selector-hud" 
            style={{ 
                '--active-color': hoveredModule?.colorStr || '#00f2ff',
                '--active-color-rgb': hexToRgb(hoveredModule?.colorStr || '#00f2ff')
            }}
        >
            {/* <BackButton /> */} {/* Commented out */}
            <div className="vignette" />
            <div className="scanline" />
            
            <div className="corner-brackets top-left" />
            <div className="corner-brackets top-right" />
            <div className="corner-brackets bottom-left" />
            <div className="corner-brackets bottom-right" />

            <div ref={mountRef} className="canvas-container" />
            <CustomCursor />

            <div className="ui-layer">
                <motion.div 
                    className="header-hud"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="header-glitch-wrap">
                        <h1>AGRIM SIGDEL</h1>
                        <div className="header-line" />
                    </div>
                    <div className="status-indicator">
                        <span className="blink-dot" />
                        <p className="status-text">SYSTEM_ACTIVE // PROVIDING_CHOOSE_OPTIONS</p>
                    </div>
                </motion.div>

                {/* <div className="side-monitor">
                    <div className="monitor-row">
                        <span>CPU_LOAD</span>
                        <div className="mini-bar"><div className="fill" style={{ width: '65%' }} /></div>
                    </div>
                    <div className="monitor-row">
                        <span>NET_PULSE</span>
                        <div className="mini-bar"><div className="fill" style={{ width: '82%' }} /></div>
                    </div>
                    <div className="monitor-row">
                        <span>MEM_ALLOC</span>
                        <div className="mini-bar"><div className="fill" style={{ width: '34%' }} /></div>
                    </div>
                    <div className="monitor-footer">ENCRYPT_LEVEL: OMEGA_8</div>
                </div> */}

                <AnimatePresence mode="wait">
                    {clickedModuleData && !isSwitching && (
                        <motion.div 
                            key={clickedModuleData.id}
                            className="cyber-card"
                            initial={{ opacity: 0, y: 100, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 100, scale: 0.8, filter: 'blur(10px)' }}
                            transition={{ type: 'spring', damping: 15, stiffness: 120, duration: 0.4 }}
                        >
                            <div className="card-glitch-border" />
                            <div className="card-header">
                                <div className="card-id-tag">{clickedModuleData.id.toUpperCase()}</div>
                                <div className="card-category">{clickedModuleData.name}</div>
                            </div>
                            
                            <div className="card-body">
                                <h2 className="card-title">{clickedModuleData.title}</h2>
                            </div>

                            <div className="card-footer">
                                <button className="go-button" onClick={() => handleModuleSelect(clickedModuleData.id)}>
                                    <span className="prompt-arrows">&gt;&gt;</span>
                                    GO
                                    <span className="prompt-bracket">]</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div 
                    className="footer-hud"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="click-prompt">CLICK A PILLAR TO EXPLORE</div>
                    <div className="coord-panel">
                        <div className="coord-item">LAT: 27.6710° N</div>
                        <div className="coord-item">LNG: 85.3414° E</div>
                    </div>
                    
                    <div className="social-links-hud">
                        <a href="#github" className="hud-link">GITHUB</a>
                        <div className="link-divider" />
                        <a href="#linkedin" className="hud-link">LINKEDIN</a>
                    </div>

                    <div className="time-display">{currentTime}</div>
                </motion.div>
            </div>

            <AnimatePresence>
                {isSwitching && (
                    <motion.div 
                        className="transition-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="hex-bg" />
                        <div className="loading-core">
                            <div className="spinner-outer" />
                            <div className="spinner-inner" />
                            <h3 className="loading-text">RECONFIGURING</h3>
                            <div className="progress-container">
                                <div className="progress-glow" />
                                <div className="progress-bar-fill" />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ModeSelector;