import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

export function cargarEstructura3(container) {
    let animationId;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // --- 1. CREACIÓN DINÁMICA DE LA INTERFAZ (UI) ---
    // En lugar de usar HTML estático, lo inyectamos en el contenedor
    const infoDiv = document.createElement('div');
    infoDiv.style.cssText = `
        position: absolute; top: 10px; left: 10px;
        background: rgba(255,255,255,0.9); padding: 12px;
        border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        z-index: 10; user-select: none; pointer-events: none;
        color: #1f2937; font-family: 'Inter', sans-serif; font-size: 14px;
    `;
    infoDiv.innerHTML = `
        <h3 style="margin-top: 0;">Esquema Óptico (Espejo Cóncavo)</h3>
        <p style="margin-bottom: 5px;">Arrastra el objeto para ver los cambios.</p>
        <p style="margin-bottom: 5px;">🟣 Objeto (Real)</p>
        <p style="margin-bottom: 5px;">🟡 Imagen (Real/Virtual)</p>
        <p style="margin-bottom: 5px; color: #0000ff;">— Rayo Central (a través de C)</p>
        <p style="margin-bottom: 0; color: #ff0000;">— Rayo Paralelo</p>
    `;
    container.appendChild(infoDiv);

    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = `
        position: absolute; bottom: 10px; left: 10px;
        background: rgba(17, 24, 39, 0.9); color: #d1d5db; 
        padding: 10px; border-radius: 8px; font-size: 14px; 
        font-family: monospace; z-index: 10; user-select: none; line-height: 1.5;
    `;
    container.appendChild(statusDiv);

    const createLabel = (text) => {
        const div = document.createElement('div');
        div.innerText = text;
        div.style.cssText = `
            position: absolute; background: rgba(255,255,255,0.95);
            padding: 4px 8px; border-radius: 6px; font-family: monospace;
            font-size: 13px; pointer-events: none; user-select: none;
            border: 1px solid #9ca3af; white-space: nowrap; z-index: 10;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;
        container.appendChild(div);
        return div;
    };
    
    const vertexLabel = createLabel('V (Vértice)');
    const focoLabel = createLabel('F (Foco)');

    // --- 2. CONFIGURACIÓN DE THREE.JS ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(14, 4, -3);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // --- CONFIGURACIÓN DE CONTROLES (Igual que Estructura 1) ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.zoomSpeed = 0.2; 
    controls.minDistance = 2;  
    controls.maxDistance = 50; 

    // Bloqueo de scroll global
    renderer.domElement.addEventListener('wheel', (e) => {
        e.preventDefault();
        e.stopPropagation();
    }, { passive: false });

    // --- 3. LÓGICA ÓPTICA (Original de tu archivo) ---
    const vertexZ   = -4;       
    const f         = 1.0;      
    const objHeight = 0.65;     
    const objBaseY  = 1.5;      
    const minObjectZ = -15;     
    const maxObjectZ = 5;       

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(5, 10, 5);
    scene.add(light);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshPhongMaterial({ color: 0xdddddd, side: THREE.DoubleSide }));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const ojo = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), new THREE.MeshPhongMaterial({ color: 0xff0000, opacity: 0.5, transparent: true }));
    ojo.position.set(0, objBaseY, 6);
    scene.add(ojo);

    const mirrorGeometry = new THREE.PlaneGeometry(4, 4);
    const mirrorFront = new THREE.Mesh(mirrorGeometry, new THREE.MeshBasicMaterial({ color: 0x444444, side: THREE.DoubleSide }));
    mirrorFront.position.set(0, objBaseY, 0.02); 
    scene.add(mirrorFront);
    
    const mirrorPlane = new Reflector(mirrorGeometry, {
        clipBias: 0.001,
        textureWidth: width * window.devicePixelRatio,
        textureHeight: height * window.devicePixelRatio,
        color: 0xcccccc 
    });
    mirrorPlane.rotation.y = Math.PI;
    mirrorPlane.position.set(0, objBaseY, 0); 
    scene.add(mirrorPlane);
    
    const concaveMirror = new THREE.Mesh(new THREE.SphereGeometry(2 * f, 32, 32, 0, Math.PI), new THREE.MeshPhongMaterial({ color: 0x0000ff, opacity: 0.3, transparent: true, side: THREE.BackSide }));
    concaveMirror.rotation.y = Math.PI;
    concaveMirror.position.set(0, objBaseY, vertexZ - 0.5); 
    scene.add(concaveMirror);

    const vertexMarker = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    vertexMarker.position.set(0, objBaseY, vertexZ);
    scene.add(vertexMarker);

    const focoMarker = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), new THREE.MeshBasicMaterial({ color: 0x0000ff }));
    focoMarker.position.set(0, objBaseY, vertexZ + f);
    scene.add(focoMarker);

    const centroMarker = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
    centroMarker.position.set(0, objBaseY, vertexZ + 2 * f);
    scene.add(centroMarker);

    // --- Objeto Real (Grupo) ---
    const objetoReal = new THREE.Group();
    const mesa = new THREE.Group();
    const pared = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.6), new THREE.MeshPhongMaterial({ color: 0x8B4513 }));
    pared.position.set(0, 0.3, 0.2); pared.rotation.y = Math.PI / 2; mesa.add(pared);
    const baseInferior = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.4), new THREE.MeshPhongMaterial({ color: 0x8B4513 }));
    baseInferior.position.set(0, 0.025, 0); mesa.add(baseInferior);
    const baseSuperior = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.4), new THREE.MeshPhongMaterial({ color: 0x8B4513 }));
    baseSuperior.position.set(0, 0.575, 0); mesa.add(baseSuperior);
    objetoReal.add(mesa);

    const vaso = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.15, 0.5, 32), new THREE.MeshPhongMaterial({ color: 0x4f46e5 }));
    vaso.position.set(0, 0.3, -0.1); vaso.rotation.x = Math.PI; vaso.scale.set(0.9, 0.9, 0.9);
    objetoReal.add(vaso);

    for (let i = 0; i < 3; i++) {
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8), new THREE.MeshPhongMaterial({ color: 0x228B22 }));
        stem.position.set((i - 1) * 0.08, 0.5 + 0.575 + 0.3, 0); objetoReal.add(stem);
        const flower = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), new THREE.MeshPhongMaterial({ color: [0xff69b4, 0xffff00, 0xff0000][i % 3] }));
        flower.position.set(stem.position.x, 0.5 + 0.575 + 0.6 + 0.07, 0); objetoReal.add(flower);
    }
    
    objetoReal.position.set(0, objBaseY - (0.575 + 0.05 / 2), -2); 
    scene.add(objetoReal);

    const imagenGrupo = new THREE.Group();
    objetoReal.children.forEach(child => {
        if (child.isGroup && child === mesa) return; 
        imagenGrupo.add(child.clone());
    });
    imagenGrupo.traverse(node => {
        if (node.isMesh) {
            node.material = node.material.clone();
            node.material.color.set(0xa855f7); 
            node.material.opacity = 0.6;
            node.material.transparent = true;
        }
    });
    scene.add(imagenGrupo);
    imagenGrupo.position.copy(objetoReal.position);

    const dragControlObject = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), new THREE.MeshBasicMaterial({ visible: false }));
    dragControlObject.position.copy(objetoReal.position);
    scene.add(dragControlObject);

    const dragControls = new DragControls([dragControlObject], camera, renderer.domElement);
    dragControls.addEventListener('dragstart', () => controls.enabled = false);
    dragControls.addEventListener('dragend', () => controls.enabled = true);
    
    dragControls.addEventListener('drag', e => {
        dragControlObject.position.x = 0; 
        const minAllowedZ = vertexZ + 0.01; 
        const maxAllowedZ = 5; 
        objetoReal.position.copy(dragControlObject.position);

        if (objetoReal.position.z < minAllowedZ) {
            objetoReal.position.z = minAllowedZ; dragControlObject.position.z = minAllowedZ;
        }
        if (objetoReal.position.z > maxAllowedZ) {
            objetoReal.position.z = maxAllowedZ; dragControlObject.position.z = maxAllowedZ;
        }
        if (objetoReal.position.z < minObjectZ) {
            objetoReal.position.z = minObjectZ; dragControlObject.position.z = minObjectZ;
        }

        const doZ = objetoReal.position.z;
        const doDist = doZ - vertexZ; 
        if (Math.abs(doDist) < 0.001) return; 

        const invDi = 1 / f - 1 / doDist;
        const di = 1 / invDi;
        const magnification = -di / doDist;

        const objCenterY = objetoReal.position.y;
        const objTipY = objCenterY + objHeight / 2; 
        const ho = objTipY - objBaseY; 
        const hi = magnification * ho; 

        imagenGrupo.position.z = vertexZ + di;
        imagenGrupo.position.y = objBaseY + (hi / 2);
        imagenGrupo.rotation.x = magnification < 0 ? Math.PI : 0; 
        imagenGrupo.scale.setScalar(Math.abs(magnification));

        drawRays(); 
    });

    // --- RAYOS ---
    const rayParallelIncident = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xff0000 }));
    const rayParallelReflected = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xff0000 }));
    const rayCentralIncident = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x0000ff }));
    const rayCentralReflected = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x0000ff }));
    const rayImagen = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: 0xa855f7, dashSize: 0.1, gapSize: 0.05 }));
    scene.add(rayParallelIncident, rayParallelReflected, rayCentralIncident, rayCentralReflected, rayImagen);

    function updateLabelPosition(label, position) {
        const vector = position.clone();
        vector.project(camera);
        // Ajuste relativo al contenedor
        const x = (vector.x * 0.5 + 0.5) * container.clientWidth;
        const y = (-vector.y * 0.5 + 0.5) * container.clientHeight;
        label.style.transform = `translate(-50%, -50%) translate(${x}px,${y}px)`;
    }

    function formatNumber(value) {
        if (!isFinite(value) || value === null || isNaN(value)) return '±∞';
        return value.toFixed(2);
    }

    function updateStatus(hi, doDist, di, magnification) {
        const tipo = di > 0 ? 'Real (invertida)' : 'Virtual (derecha)';
        // Solo actualizamos si el elemento existe
        if (statusDiv) {
            statusDiv.innerHTML = `
                Distancia Objeto (d₀): ${doDist.toFixed(2)} u<br>
                Distancia Imagen (dᵢ): ${formatNumber(di)} u<br>
                Magnificación (M): ${formatNumber(magnification)}<br>
                Altura Imagen (hᵢ): ${formatNumber(hi)} u<br>
                Tipo: <b style="color:#facc15;">${tipo}</b>
            `;
        }
    }

    function drawRays() {
        const objCenterY = objetoReal.position.y;
        const objTipY = objCenterY + objHeight / 2;
        const doZ = objetoReal.position.z;
        const doDist = doZ - vertexZ; 
        
        const invDi = 1 / f - 1 / doDist;
        const di = invDi === 0 ? (invDi > 0 ? 1e6 : -1e6) : 1 / invDi;
        const real = di > 0; 
        const imagenZ = vertexZ + di;
        const magnification = doDist === 0 ? 0 : -di / doDist;
        const ho = objTipY - objBaseY;
        const hi = magnification * ho; 
        
        const reflTarget = new THREE.Vector3(0, objBaseY + hi, imagenZ);
        
        const setDashed = (line, color) => {
            if (!(line.material && line.material.isLineDashedMaterial)) {
                line.material = new THREE.LineDashedMaterial({ color: color, dashSize: 0.1, gapSize: 0.05 });
                line.computeLineDistances();
            }
        };

        const setSolid = (line, color) => {
            if (line.material && line.material.isLineDashedMaterial) {
                line.material = new THREE.LineBasicMaterial({ color: color });
            }
        };

        const origin1 = new THREE.Vector3(0, objTipY, doZ);
        const hit1 = new THREE.Vector3(0, objTipY, vertexZ); 
        
        rayParallelIncident.geometry.setFromPoints([origin1, hit1]);
        setSolid(rayParallelIncident, 0xff0000);
        
        if (real) {
            rayParallelReflected.geometry.setFromPoints([hit1, reflTarget]);
            setSolid(rayParallelReflected, 0xff0000);
        } else {
            rayParallelReflected.geometry.setFromPoints([hit1, ojo.position]);
            setSolid(rayParallelReflected, 0xff0000);
            rayParallelReflected.geometry.setFromPoints([reflTarget, hit1]);
            setDashed(rayParallelReflected, 0xff0000);
        }
        
        const centroPos = new THREE.Vector3(0, objBaseY, vertexZ + 2 * f);
        const origin2 = new THREE.Vector3(0, objTipY, doZ);
        
        const dirToCentro = centroPos.clone().sub(origin2);
        let t_centro = 0;
        if (Math.abs(dirToCentro.z) > 1e-6) t_centro = (vertexZ - origin2.z) / dirToCentro.z;
        else t_centro = 1; 
        
        const hit2 = origin2.clone().add(dirToCentro.clone().multiplyScalar(t_centro));
        
        rayCentralIncident.geometry.setFromPoints([origin2, hit2]);
        setSolid(rayCentralIncident, 0x0000ff);
        
        if (real) {
            rayCentralReflected.geometry.setFromPoints([hit2, reflTarget]);
            setSolid(rayCentralReflected, 0x0000ff);
        } else {
            rayCentralReflected.geometry.setFromPoints([hit2, ojo.position]);
            setSolid(rayCentralReflected, 0x0000ff);
            rayCentralReflected.geometry.setFromPoints([reflTarget, hit2]);
            setDashed(rayCentralReflected, 0x0000ff);
        }

        const pImagen = reflTarget.clone();
        const eje = new THREE.Vector3(0, objBaseY, pImagen.z);
        
        rayImagen.geometry.setFromPoints([pImagen, eje]);
        if (rayImagen.material && rayImagen.material.isLineDashedMaterial) rayImagen.computeLineDistances();
        
        updateStatus(hi, doDist, di, magnification);
    }

    function animate() {
        animationId = requestAnimationFrame(animate);
        controls.update();

        //updateLabelPosition(vertexLabel, vertexMarker.position);
        //updateLabelPosition(focoLabel, focoMarker.position);

        drawRays(); 

        renderer.render(scene, camera);
    }
    
    // Forzamos un primer render para inicializar
    drawRays();
    animate();

    // --- FUNCIÓN LIMPIEZA ---
    return {
        renderer,
        camera,
        stop: () => {
            cancelAnimationFrame(animationId);
            
            // Limpiamos los eventos y controles extra
            dragControls.dispose();
            controls.dispose();
            
            // Borramos la UI inyectada
            if (container.contains(infoDiv)) container.removeChild(infoDiv);
            if (container.contains(statusDiv)) container.removeChild(statusDiv);
            if (container.contains(vertexLabel)) container.removeChild(vertexLabel);
            if (container.contains(focoLabel)) container.removeChild(focoLabel);
            
            // Limpieza de GPU
            renderer.dispose();
            mirrorPlane.dispose();
        }
    };
}