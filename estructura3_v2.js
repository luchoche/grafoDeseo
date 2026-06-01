import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

export function cargarEstructura3(container) {
    let animationId;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // --- 1. INTERFAZ (UI) ---
    const reflectStatus = document.createElement('div');
    reflectStatus.style.cssText = `
        position: absolute; top: 10px; right: 10px;
        background: rgba(255,255,255,0.9); padding: 8px 12px;
        border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        z-index: 10; user-select: none; pointer-events: none;
        color: #1f2937; font-family: 'Inter', sans-serif; font-size: 13px;
        transition: all 0.3s ease; border: 2px solid transparent;
    `;
    // reflectStatus.innerHTML = `<b>Mantén 'A'</b>: Perspectiva | <b>1, 2, 3</b>: Animar Haz de Luz`;
    // container.appendChild(reflectStatus);

    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = `
        position: absolute; bottom: 10px; left: 10px;
        background: rgba(17, 24, 39, 0.9); color: #d1d5db; 
        padding: 10px; border-radius: 8px; font-size: 14px; 
        font-family: monospace; z-index: 10; user-select: none; line-height: 1.5;
    `;
    container.appendChild(statusDiv);

    // --- 2. CONFIGURACIÓN DE THREE.JS ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(10, 4, -3);
    camera.layers.enable(0);
    camera.layers.enable(1);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // --- 3. LÓGICA ÓPTICA ---
    const vertexZ   = -4;       
    const f         = 1.0;      
    const objHeight = 0.65;     
    const objBaseY  = 1.5;      

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(5, 10, 5);
    scene.add(light);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshPhongMaterial({ color: 0xdddddd, side: THREE.DoubleSide }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1; 
    scene.add(floor);

    const mirrorPlane = new Reflector(new THREE.PlaneGeometry(4, 4), {
        clipBias: 0.001,
        textureWidth: width * window.devicePixelRatio,
        textureHeight: height * window.devicePixelRatio,
        color: 0xcccccc 
    });
    mirrorPlane.rotation.y = Math.PI;
    mirrorPlane.position.set(0, objBaseY, 3); 
    scene.add(mirrorPlane);
    
    const concaveMirror = new THREE.Mesh(new THREE.SphereGeometry(2 * f, 32, 32, 0, Math.PI), new THREE.MeshPhongMaterial({ color: 0x0000ff, opacity: 0.3, transparent: true, side: THREE.BackSide }));
    concaveMirror.rotation.y = Math.PI;
    concaveMirror.position.set(0, objBaseY, vertexZ + 1.0); 
    scene.add(concaveMirror);

    // Marcadores ópticos
    const markers = [
        { pos: [0, objBaseY, vertexZ], col: 0xff0000 },
        { pos: [0, objBaseY, vertexZ + f], col: 0x0000ff },
        { pos: [0, objBaseY, vertexZ + 2 * f], col: 0x00ff00 }
    ].map(m => {
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), new THREE.MeshBasicMaterial({ color: m.col }));
        mesh.position.set(...m.pos);
        scene.add(mesh);
        return mesh;
    });

    // --- Objeto Real ---
    const objetoReal = new THREE.Group();
    const mesa = new THREE.Group();
    const matMesa = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.6), matMesa);
    p1.position.set(0, 0.3, 0.2); p1.rotation.y = Math.PI / 2; mesa.add(p1);
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.4), matMesa);
    b1.position.set(0, 0.025, 0); mesa.add(b1);
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.4), matMesa);
    b2.position.set(0, 0.575, 0); mesa.add(b2);
    objetoReal.add(mesa);

    const vaso = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.15, 0.5, 32), new THREE.MeshPhongMaterial({ color: 0x4f46e5 }));
    vaso.position.set(0, 0.3, -0.1); vaso.rotation.x = Math.PI; vaso.scale.set(0.9, 0.9, 0.9);
    objetoReal.add(vaso);

    for (let i = 0; i < 3; i++) {
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8), new THREE.MeshPhongMaterial({ color: 0x228B22 }));
        stem.position.set((i - 1) * 0.08, 1.375, 0); objetoReal.add(stem);
        const flower = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), new THREE.MeshPhongMaterial({ color: [0xff69b4, 0xffff00, 0xff0000][i % 3] }));
        flower.position.set(stem.position.x, 2.045, 0); objetoReal.add(flower);
    }
    objetoReal.position.set(0, objBaseY - 0.6, -2); 
    scene.add(objetoReal);

    // --- Grupo Imagen ---
    const imagenGrupo = new THREE.Group();
    objetoReal.children.forEach(child => { if (child !== mesa) imagenGrupo.add(child.clone()); });
    imagenGrupo.traverse(node => {
        if (node.isMesh) {
            node.material = node.material.clone();
            node.material.color.set(0xa855f7); 
            node.material.opacity = 0.6; node.material.transparent = true;
        }
    });
    scene.add(imagenGrupo);

    const dragControlObject = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), new THREE.MeshBasicMaterial({ visible: false }));
    dragControlObject.position.copy(objetoReal.position);
    scene.add(dragControlObject);

    // --- LÓGICA DE ANIMACIÓN DE HAZ DE LUZ ---
    let isSubjectMode = false;
    let animatedRayId = null;
    let isAnimating = false;

    // Elementos del haz animado (Línea central + Resplandor)
    const beamGeometry = new THREE.BufferGeometry();
    const beamMaterial = new THREE.LineBasicMaterial({ color: 0xffffaa, linewidth: 3 });
    const beamLine = new THREE.Line(beamGeometry, beamMaterial);
    
    const beamGlowMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.3, linewidth: 10 });
    const beamGlow = new THREE.Line(new THREE.BufferGeometry(), beamGlowMaterial);
    
    beamLine.visible = beamGlow.visible = false;
    scene.add(beamLine, beamGlow);

    function startBeamAnimation(rayId) {
        if (isAnimating) return;
        isAnimating = true;
        animatedRayId = rayId;
        beamLine.visible = beamGlow.visible = true;
        beamMaterial.opacity = beamGlowMaterial.opacity = 1;

        const objTipY = objetoReal.position.y + objHeight / 2 + 0.6; // Ajuste por la base
        const doZ = objetoReal.position.z;
        const doDist = doZ - vertexZ;
        const di = 1 / (1 / f - 1 / doDist);
        const imagenZ = vertexZ + di;
        const hi = (-di / doDist) * (objTipY - objBaseY);

        const start = new THREE.Vector3(0, objTipY, doZ);
        const end = new THREE.Vector3(0, objBaseY + hi, imagenZ);
        let hit = new THREE.Vector3();

        if (rayId === 1) hit.set(0, objTipY, vertexZ);
        else if (rayId === 2) {
            const c = new THREE.Vector3(0, objBaseY, vertexZ + 2 * f);
            const dir = c.clone().sub(start).normalize();
            hit = start.clone().add(dir.multiplyScalar((vertexZ - start.z) / dir.z));
        } else if (rayId === 3) {
            const fP = new THREE.Vector3(0, objBaseY, vertexZ + f);
            const dir = fP.clone().sub(start).normalize();
            hit = start.clone().add(dir.multiplyScalar((vertexZ - start.z) / dir.z));
        }

        const animObj = { progress: 0 };
        const tl = gsap.timeline({
            onComplete: () => {
                gsap.to([beamMaterial, beamGlowMaterial], { 
                    opacity: 0, duration: 0.5, 
                    onComplete: () => {
                        beamLine.visible = beamGlow.visible = false;
                        isAnimating = false;
                        animatedRayId = null;
                    } 
                });
            }
        });

        // Trayectoria 1: Crecimiento hacia el espejo
        tl.to(animObj, {
            progress: 1, duration: 0.8, ease: "power1.in",
            onUpdate: () => {
                const current = new THREE.Vector3().lerpVectors(start, hit, animObj.progress);
                const pts = [start, current];
                beamGeometry.setFromPoints(pts);
                beamGlow.geometry.setFromPoints(pts);
            }
        });

        // Trayectoria 2: Rebote y extensión hacia la imagen
        tl.to(animObj, {
            progress: 2, duration: 1.2, ease: "none",
            onUpdate: () => {
                const current = new THREE.Vector3().lerpVectors(hit, end, animObj.progress - 1);
                const pts = [start, hit, current];
                beamGeometry.setFromPoints(pts);
                beamGlow.geometry.setFromPoints(pts);
            }
        });
    }

    // --- EVENTOS ---
    window.addEventListener('keydown', (e) => {
        const k = e.key.toLowerCase();
        if(k === 'a') isSubjectMode = true;
        if(k === '1') startBeamAnimation(1);
        if(k === '2') startBeamAnimation(2);
        if(k === '3') startBeamAnimation(3);
    });
    window.addEventListener('keyup', (e) => { if(e.key.toLowerCase() === 'a') isSubjectMode = false; });

    const dragControls = new DragControls([dragControlObject], camera, renderer.domElement);
    dragControls.addEventListener('dragstart', () => controls.enabled = false);
    dragControls.addEventListener('dragend', () => controls.enabled = true);
    dragControls.addEventListener('drag', () => {
        dragControlObject.position.x = 0; 
        objetoReal.position.copy(dragControlObject.position);
    });

    // --- RAYOS ESTÁTICOS ---
    const createRay = (col) => {
        const r = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: col }));
        r.layers.set(1); scene.add(r); return r;
    };
    const rPI = createRay(0xff0000), rPR = createRay(0xff0000);
    const rCI = createRay(0x0000ff), rCR = createRay(0x0000ff);
    const rFI = createRay(0xffa500), rFR = createRay(0xffa500);
    const rayImagen = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: 0xa855f7, dashSize: 0.1, gapSize: 0.05 }));
    scene.add(rayImagen);

    function drawRays() {
        const tipY = objetoReal.position.y + objHeight / 2 + 0.6;
        const doZ = objetoReal.position.z;
        const doDist = doZ - vertexZ; 
        const di = 1 / (1 / f - 1 / doDist);
        const imgZ = vertexZ + di;
        const mag = -di / doDist;
        const hi = mag * (tipY - objBaseY);

        // Actualizar Imagen
        if (isSubjectMode) {
            const ratio = di / 15;
            imagenGrupo.position.set(-camera.position.x * ratio, objBaseY + (hi / 2) - (camera.position.y - objBaseY) * ratio, imgZ);
            imagenGrupo.rotation.y = camera.position.x / 12;
        } else {
            imagenGrupo.position.set(0, objBaseY + (hi / 2), imgZ);
            imagenGrupo.rotation.y = 0;
        }
        imagenGrupo.rotation.x = mag < 0 ? Math.PI : 0; 
        imagenGrupo.scale.setScalar(Math.abs(mag));

        const tipP = new THREE.Vector3(0, tipY, doZ);
        const reflP = new THREE.Vector3(0, objBaseY + hi, imgZ);

        // Rayo Paralelo
        const hP = new THREE.Vector3(0, tipY, vertexZ);
        rPI.geometry.setFromPoints([tipP, hP]); rPR.geometry.setFromPoints([hP, reflP]);
        rPI.visible = rPR.visible = (animatedRayId !== 1);

        // Rayo Central
        const cP = new THREE.Vector3(0, objBaseY, vertexZ + 2 * f);
        const dC = cP.clone().sub(tipP).normalize();
        const hC = tipP.clone().add(dC.multiplyScalar((vertexZ - tipP.z) / dC.z));
        rCI.geometry.setFromPoints([tipP, hC]); rCR.geometry.setFromPoints([hC, reflP]);
        rCI.visible = rCR.visible = (animatedRayId !== 2);

        // Rayo Focal
        const fP = new THREE.Vector3(0, objBaseY, vertexZ + f);
        const dF = fP.clone().sub(tipP).normalize();
        const hF = tipP.clone().add(dF.multiplyScalar((vertexZ - tipP.z) / dF.z));
        rFI.geometry.setFromPoints([tipP, hF]); rFR.geometry.setFromPoints([hF, reflP]);
        rFI.visible = rFR.visible = (animatedRayId !== 3);

        rayImagen.geometry.setFromPoints([reflP, new THREE.Vector3(0, objBaseY, imgZ)]);
        rayImagen.computeLineDistances();
        
        //statusDiv.innerHTML = `d₀: ${doDist.toFixed(2)} | dᵢ: ${di.toFixed(2)} | M: ${mag.toFixed(2)}<br>Usa 1, 2, 3 para ver el haz de luz en movimiento.`;
    }

    function animate() {
        animationId = requestAnimationFrame(animate);
        controls.update();
        drawRays();
        renderer.render(scene, camera);
    }
    
    animate();

    return {
        renderer, camera,
        stop: () => {
            cancelAnimationFrame(animationId);
            dragControls.dispose(); controls.dispose();
            if (container.contains(reflectStatus)) container.removeChild(reflectStatus);
            if (container.contains(statusDiv)) container.removeChild(statusDiv);
            renderer.dispose();
        }
    };
}