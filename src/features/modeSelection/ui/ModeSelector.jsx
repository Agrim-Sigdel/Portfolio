import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import './ModeSelector.css';

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
    grid: 0x002233
};

const MODULES = [
    {
        id: 'fun',
        name: 'CREATIVE',
        code: 'CX-9',
        title: 'Fun Mode',
        description: 'Interactive animations and playful design',
        features: ['Smooth Animations', 'Interactive Elements', 'Modern UI'],
        x: -5.5,
        color: PALETTE.cyan
    },
    {
        id: 'work',
        name: 'TERMINAL',
        code: 'TX-1',
        title: 'Work Mode',
        description: 'Command-line interface experience',
        features: ['Terminal Commands', 'Developer Tools', 'Efficient Navigation'],
        x: 0,
        color: PALETTE.gold
    },
    {
        id: 'normal',
        name: 'CLASSIC',
        code: 'CL-4',
        title: 'Normal Mode',
        description: 'Clean and straightforward layout',
        features: ['Simple Design', 'Fast Loading', 'Easy Navigation'],
        x: 5.5,
        color: PALETTE.purple
    }
];

const ModeSelector = ({ onSelectMode }) => {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const podiumsRef = useRef([]);
    const hudElementsRef = useRef([]);
    const particlesRef = useRef(null);
    const mouseRef = useRef(new THREE.Vector2());
    const raycasterRef = useRef(new THREE.Raycaster());

    const [hoveredModule, setHoveredModule] = useState(null);
    const [selectedModule, setSelectedModule] = useState(null);
    const [activeIndex, setActiveIndex] = useState(1);
    const [isSwitching, setIsSwitching] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Set initial hovered module
    useEffect(() => {
        setHoveredModule(MODULES[activeIndex]);
    }, [activeIndex]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isSwitching) return;

            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                setActiveIndex(prev => (prev === 0 ? MODULES.length - 1 : prev - 1));
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                setActiveIndex(prev => (prev === MODULES.length - 1 ? 0 : prev + 1));
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleModuleSelect(MODULES[activeIndex].id);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeIndex, isSwitching]);

    // Scroll/Wheel navigation
    useEffect(() => {
        let scrollTimeout;
        const handleWheel = (e) => {
            if (isSwitching) return;

            e.preventDefault();

            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                if (e.deltaY > 0) {
                    setActiveIndex(prev => (prev === MODULES.length - 1 ? 0 : prev + 1));
                } else if (e.deltaY < 0) {
                    setActiveIndex(prev => (prev === 0 ? MODULES.length - 1 : prev - 1));
                }
            }, 50);
        };

        window.addEventListener('wheel', handleWheel, { passive: false });
        return () => window.removeEventListener('wheel', handleWheel);
    }, [isSwitching]);

    const handleModuleSelect = (modeId) => {
        if (isSwitching || !AVAILABLE_MODES[modeId]) return;

        const moduleData = MODULES.find(m => m.id === modeId);
        setSelectedModule(moduleData);
        setIsSwitching(true);

        setTimeout(() => {
            onSelectMode(modeId);
        }, 1500);
    };

    useEffect(() => {
        if (!mountRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x000b14, 0.05);
        sceneRef.current = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.set(0, 4, 15);
        cameraRef.current = camera;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        mountRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Lighting
        const ambient = new THREE.AmbientLight(0x404040, 1);
        scene.add(ambient);

        const spot = new THREE.PointLight(PALETTE.cyan, 2, 20);
        spot.position.set(0, 10, 5);
        scene.add(spot);

        // Grid Floor
        const grid = new THREE.GridHelper(40, 40, 0x00f2ff, 0x002233);
        grid.position.y = -2;
        scene.add(grid);

        // Background HUD Rings
        for (let i = 0; i < 3; i++) {
            const geo = new THREE.TorusGeometry(8 + i * 2, 0.02, 16, 100);
            const mat = new THREE.MeshBasicMaterial({
                color: PALETTE.cyan,
                transparent: true,
                opacity: 0.1
            });
            const ring = new THREE.Mesh(geo, mat);
            ring.position.z = -15;
            hudElementsRef.current.push(ring);
            scene.add(ring);
        }

        // Particles
        const particleGeo = new THREE.BufferGeometry();
        const positions = [];
        for (let i = 0; i < 1000; i++) {
            positions.push(
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 40
            );
        }
        particleGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const particleMat = new THREE.PointsMaterial({
            size: 0.05,
            color: PALETTE.cyan,
            transparent: true,
            opacity: 0.5
        });
        particlesRef.current = new THREE.Points(particleGeo, particleMat);
        scene.add(particlesRef.current);

        // Create Podiums
        MODULES.forEach((mod, i) => {
            const group = new THREE.Group();
            group.position.x = mod.x;

            // Futuristic Pedestal
            const pedGeo = new THREE.CylinderGeometry(1.2, 1.5, 1.5, 6, 1);
            const pedMat = new THREE.MeshPhongMaterial({
                color: 0x111111,
                emissive: mod.color,
                emissiveIntensity: 0.1,
                flatShading: true,
                shininess: 100
            });
            const pedestal = new THREE.Mesh(pedGeo, pedMat);
            pedestal.position.y = -1.25;
            group.add(pedestal);

            // Glowing core ring
            const ringGeo = new THREE.TorusGeometry(1.3, 0.05, 16, 100);
            const ringMat = new THREE.MeshBasicMaterial({ color: mod.color });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            ring.position.y = -0.5;
            group.add(ring);

            // Holographic Card
            const cardGeo = new THREE.PlaneGeometry(2.5, 3.8);
            const cardMat = new THREE.MeshBasicMaterial({
                color: mod.color,
                transparent: true,
                opacity: 0.15,
                side: THREE.DoubleSide
            });
            const card = new THREE.Mesh(cardGeo, cardMat);
            card.position.y = 1.8;
            group.add(card);

            // Data Ring on Card
            const dataRingGeo = new THREE.RingGeometry(0.8, 0.85, 32);
            const dataRing = new THREE.Mesh(
                dataRingGeo,
                new THREE.MeshBasicMaterial({
                    color: mod.color,
                    transparent: true,
                    opacity: 0.5,
                    side: THREE.DoubleSide
                })
            );
            dataRing.position.set(0, 1, 0.01);
            card.add(dataRing);

            // Card Wireframe
            const edges = new THREE.EdgesGeometry(cardGeo);
            const line = new THREE.LineSegments(
                edges,
                new THREE.LineBasicMaterial({ color: mod.color })
            );
            card.add(line);

            // Smaller orbiting spheres
            const sphereGeo = new THREE.SphereGeometry(0.1, 16, 16);
            const sphereMat = new THREE.MeshBasicMaterial({ color: mod.color });
            const sphere = new THREE.Mesh(sphereGeo, sphereMat);
            sphere.position.set(0, 0.5, 0.5);
            card.add(sphere);

            group.userData = {
                id: mod.id,
                phase: i,
                color: mod.color,
                ring: dataRing,
                sphere: sphere,
                card: card,
                clickable: card
            };

            podiumsRef.current.push(group);
            scene.add(group);
        });

        // Mouse move handler
        const handleMouseMove = (event) => {
            mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

            // Raycasting for hover
            raycasterRef.current.setFromCamera(mouseRef.current, camera);
            const intersects = raycasterRef.current.intersectObjects(
                podiumsRef.current.map(p => p.children[2])
            );

            if (intersects.length > 0) {
                const hoveredGroup = intersects[0].object.parent;
                const moduleData = MODULES.find(m => m.id === hoveredGroup.userData.id);
                const newIndex = MODULES.findIndex(m => m.id === moduleData.id);
                setActiveIndex(newIndex);
                setHoveredModule(moduleData);
            }
        };

        // Click handler
        const handleClick = () => {
            if (isSwitching) return;

            raycasterRef.current.setFromCamera(mouseRef.current, camera);
            const intersects = raycasterRef.current.intersectObjects(
                podiumsRef.current.map(p => p.children[2])
            );

            if (intersects.length > 0) {
                const clickedGroup = intersects[0].object.parent;
                const modeId = clickedGroup.userData.id;
                handleModuleSelect(modeId);
            } else {
                // Click anywhere to select active module
                handleModuleSelect(MODULES[activeIndex].id);
            }
        };

        // Resize handler
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);

            const time = performance.now() * 0.001;

            // Rotate particles
            if (particlesRef.current) {
                particlesRef.current.rotation.y += 0.001;
            }

            // Animate podiums
            podiumsRef.current.forEach((p, i) => {
                const isActive = i === activeIndex;
                const isSelected = selectedModule && p.userData.id === selectedModule.id;

                // Floating card motion
                p.children[2].position.y = 1.8 + Math.sin(time * 2 + i) * 0.1;

                // Rotate holographic data rings
                p.userData.ring.rotation.z += 0.02 * (i + 1);

                // Orbit sphere
                const angle = time * (i + 1);
                p.userData.sphere.position.x = Math.cos(angle) * 1.2;
                p.userData.sphere.position.z = Math.sin(angle) * 1.2 + 0.5;

                // Scale based on active state
                const targetScale = isActive ? 1.15 : isSelected ? 1.2 : 1.0;
                p.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

                // Opacity based on active state
                const targetOpacity = isActive ? 0.35 : isSelected ? 0.4 : 0.15;
                p.userData.card.material.opacity = THREE.MathUtils.lerp(
                    p.userData.card.material.opacity,
                    targetOpacity,
                    0.1
                );

                // Smooth position transition for active module
                const targetX = MODULES[i].x + (isActive ? 0 : 0);
                p.position.x = THREE.MathUtils.lerp(p.position.x, targetX, 0.1);

                // Look at mouse (reaction)
                p.rotation.y = THREE.MathUtils.lerp(
                    p.rotation.y,
                    mouseRef.current.x * 0.3,
                    0.05
                );
                p.rotation.x = THREE.MathUtils.lerp(
                    p.rotation.x,
                    -mouseRef.current.y * 0.2,
                    0.05
                );
            });

            // Animate HUD rings
            hudElementsRef.current.forEach((ring, i) => {
                ring.rotation.z += 0.001 * (i + 1);
                ring.scale.setScalar(1 + Math.sin(time + i) * 0.05);
            });

            // Dynamic camera movement
            camera.position.x = THREE.MathUtils.lerp(
                camera.position.x,
                mouseRef.current.x * 1.5,
                0.05
            );
            camera.lookAt(0, 1, 0);

            renderer.render(scene, camera);
        };

        animate();

        // Event listeners
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('click', handleClick);
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('click', handleClick);
            window.removeEventListener('resize', handleResize);

            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }

            renderer.dispose();
            podiumsRef.current = [];
            hudElementsRef.current = [];
        };
    }, [onSelectMode, hoveredModule, selectedModule, isSwitching, activeIndex]);

    return (
        <div className="mode-selector-hud">
            <div className="scanner-line" />
            <div className="corner-brackets top-left" />
            <div className="corner-brackets top-right" />
            <div className="corner-brackets bottom-left" />
            <div className="corner-brackets bottom-right" />

            <div ref={mountRef} className="canvas-container" />

            <div className="ui-layer">
                <Motion.div
                    className="header-hud"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <h1>AGRIM SIGDEL</h1>
                    <p className="status-text">
                        PORTFOLIO SYSTEM // SELECT_EXPERIENCE_MODE
                    </p>
                </Motion.div>

                <Motion.div
                    className="data-stream"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <div>PROJECTS: 12+</div>
                    <div>EXPERIENCE: 3 YRS</div>
                    <div>STATUS: AVAILABLE</div>
                    <div>LOCATION: NEPAL</div>
                    <div className="boot-text">&gt;&gt; READY_TO_EXPLORE...</div>
                </Motion.div>

                <AnimatePresence>
                    {hoveredModule && !selectedModule && (
                        <Motion.div
                            className="module-info-panel"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="module-header">
                                <span className="module-code">[{hoveredModule.code}]</span>
                                <span className="module-name">{hoveredModule.name}</span>
                            </div>
                            <h3 className="module-title">{hoveredModule.title}</h3>
                            <p className="module-description">{hoveredModule.description}</p>
                            <div className="module-features">
                                {hoveredModule.features.map((feature, i) => (
                                    <div key={i} className="feature-item">
                                        <span className="feature-bullet">▸</span> {feature}
                                    </div>
                                ))}
                            </div>
                            <div className="navigation-hints">
                                <div className="hint-row">
                                    <span className="hint-key">←→</span>
                                    <span className="hint-key">SCROLL</span>
                                    <span className="hint-text">Navigate</span>
                                </div>
                                <div className="hint-row">
                                    <span className="hint-key">ENTER</span>
                                    <span className="hint-key">CLICK</span>
                                    <span className="hint-text">Select</span>
                                </div>
                            </div>
                        </Motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {selectedModule && (
                        <Motion.div
                            className="loading-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="loading-content">
                                <div className="loading-spinner" />
                                <h2>INITIALIZING {selectedModule.name}</h2>
                                <p>Loading module [{selectedModule.code}]...</p>
                                <div className="progress-bar">
                                    <div className="progress-fill" />
                                </div>
                            </div>
                        </Motion.div>
                    )}
                </AnimatePresence>

                <Motion.div
                    className="footer-hud"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="footer-info">
                        <p>DEVELOPER & DESIGNER</p>
                        <p>LOCAL_TIME: {currentTime}</p>
                    </div>
                    <div className="footer-links">
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                            TWITTER
                        </a>
                        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                            LINKEDIN
                        </a>
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                            GITHUB
                        </a>
                    </div>
                </Motion.div>
            </div>
        </div>
    );
};

export default ModeSelector;
