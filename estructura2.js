
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function cargarEstructura2(container) {
    let animationId; // Definida dentro para que sea única de esta instancia
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.002);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 100, 150);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // --- SISTEMA DE PARTÍCULAS (Tu lógica original) ---
    const PARTICLE_COUNT = 10000;
    const GRID_SIZE = 250;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);

    const cols = Math.ceil(Math.sqrt(PARTICLE_COUNT));
    const step = GRID_SIZE / cols;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        positions[i * 3] = (col * step) - (GRID_SIZE / 2);
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = (row * step) - (GRID_SIZE / 2);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0x00ffff,
        size: 0.8,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    const blackHole = { active: false, x: 0, z: 0, mass: 1500 };
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    // --- MANEJO DE EVENTOS ---
    const manejarPointerDown = (event) => {
        const rect = container.getBoundingClientRect();
        // Ajuste de coordenadas relativo al contenedor para que el click sea preciso
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(pointer, camera);
        const target = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, target);

        if (target) {
            blackHole.active = true;
            blackHole.x = target.x;
            blackHole.z = target.z;
            material.color.setHex(0xff0055); // Cambio de color al activar
        }
    };

    container.addEventListener('pointerdown', manejarPointerDown);

    const clock = new THREE.Clock();

    function animate() {
        animationId = requestAnimationFrame(animate);
        const delta = Math.min(clock.getDelta(), 0.1);

        if (blackHole.active) {
            const positionsAttr = geometry.attributes.position;
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const idx = i * 3;
                let px = positionsAttr.array[idx];
                let pz = positionsAttr.array[idx + 2];
                
                const dx = blackHole.x - px;
                const dz = blackHole.z - pz;
                const distSq = dx * dx + dz * dz;
                const safeDistSq = Math.max(distSq, 5.0); 
                const force = blackHole.mass / safeDistSq;
                const dist = Math.sqrt(safeDistSq);

                const nx = dx / dist;
                const nz = dz / dist;

                velocities[idx] += nx * force * delta;
                velocities[idx + 2] += nz * force * delta;

                // Efecto de órbita/remolino
                const orbitForce = 80.0 / dist;
                velocities[idx] += -nz * orbitForce * delta;
                velocities[idx + 2] += nx * orbitForce * delta;

                velocities[idx] *= 0.995; 
                velocities[idx + 2] *= 0.995;

                positionsAttr.array[idx] += velocities[idx] * delta;
                positionsAttr.array[idx + 2] += velocities[idx + 2] * delta;

                // Deformación en el eje Y (el "pozo" del deseo)
                if (dist < 20) {
                    positionsAttr.array[idx + 1] = (Math.random() - 0.5) * (20 - dist) * 0.5;
                } else {
                    positionsAttr.array[idx + 1] *= 0.9;
                }
            }
            positionsAttr.needsUpdate = true;
            scene.rotation.y += 0.001;
        }

        controls.update();
        renderer.render(scene, camera);
    }

    animate();

    // --- LIMPIEZA ---
    return {
        renderer,
        camera,
        stop: () => {
            cancelAnimationFrame(animationId);
            container.removeEventListener('pointerdown', manejarPointerDown);
            geometry.dispose();
            material.dispose();
            renderer.dispose();
            controls.dispose();
        }
    };
}