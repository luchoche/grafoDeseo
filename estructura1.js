import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function cargarEstructura1(container) {
    let animationId;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // --- ESCENA Y CÁMARA ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    
    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 1000);
    camera.position.set(25, 25, 25);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // --- CONTROLES Y AISLAMIENTO ---
    const controls = new OrbitControls(camera, renderer.domElement);
    
    // Configuración orgánica
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    
    // Zoom restringido para evitar el efecto "binario"
    controls.zoomSpeed = 0.2; 
    controls.minDistance = 10;
    controls.maxDistance = 100;

    // BLOQUEO DE EVENTOS (El secreto para que no interfiera el layout)
    renderer.domElement.addEventListener('wheel', (e) => {
        e.preventDefault();
        e.stopPropagation();
    }, { passive: false });

    // --- ILUMINACIÓN ---
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const light = new THREE.PointLight(0xffffff, 1.5);
    light.position.set(10, 20, 10);
    scene.add(light);

    // --- TESORO DE LOS SIGNIFICANTES (Fondo Dinámico) ---
    const cantidadA = 1500; // Cantidad de partículas
    const radioA = 25; // Tamaño de la esfera
    const geometriaA = new THREE.BufferGeometry();
    const posicionesA = new Float32Array(cantidadA * 3);
    const posicionesBaseA = new Float32Array(cantidadA * 3); // Para calcular el loop

    for(let i = 0; i < cantidadA; i++) {
        // Matemática para distribuir partículas dentro de una esfera
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = radioA * Math.cbrt(Math.random()); 

        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);

        posicionesA[i*3] = x; 
        posicionesA[i*3+1] = y; 
        posicionesA[i*3+2] = z;

        posicionesBaseA[i*3] = x; 
        posicionesBaseA[i*3+1] = y; 
        posicionesBaseA[i*3+2] = z;
    }

    geometriaA.setAttribute('position', new THREE.BufferAttribute(posicionesA, 3));
    const materialA = new THREE.PointsMaterial({ 
        color: 0x000000, // Un gris claro para que quede de fondo
        size: 0.4, 
        transparent: false, 
        opacity: 0.2 
    });
    
    const granOtro = new THREE.Points(geometriaA, materialA);
    
    // Ubicamos la esfera "atrás" de la cámara y la acción principal
    // Como tu cámara está en (25, 25, 25), la mandamos hacia las coordenadas negativas
    granOtro.position.set(-35, 10, -35); 
    scene.add(granOtro);

    // --- OBJETO A (CENTRO MASIVO) ---
    const centroA = new THREE.Vector3(0, 0, 0);
    const MAX_PARTICULAS = 2000;
    const restoGeo = new THREE.SphereGeometry(0.4, 8, 8);
    const restoMat = new THREE.MeshStandardMaterial({ color: 0xaa0000, roughness: 0.5 });
    const restoMesh = new THREE.InstancedMesh(restoGeo, restoMat, MAX_PARTICULAS);
    scene.add(restoMesh);

    const particulasData = [];
    const dummy = new THREE.Object3D();

    const significantes = [];
    let redLineas = null;
    let sCount = 0;

    function createLabel(text) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 128; canvas.height = 64;
        ctx.fillStyle = '#000'; ctx.fillRect(0,0,128,64);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 40px Arial'; ctx.textAlign = 'center';
        ctx.fillText(text, 64, 45);
        const tex = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex }));
        sprite.scale.set(3, 1.5, 1);
        return sprite;
    }

    function reordenarRetroactivamente() {
        const total = significantes.length;
        const radio = 10;
        const dispersion = 6;
        significantes.forEach((s, i) => {
            const angle = i * 0.5; 
            const h = (i * 1.2) - (total * 0.6);
            s.targetPos.set(
                Math.cos(angle) * radio + (Math.random() - 0.5) * dispersion,
                h + (Math.random() - 0.5) * (dispersion * 0.5),
                Math.sin(angle) * radio + (Math.random() - 0.5) * dispersion
            );
        });
    }

    const manejarClick = () => {
        sCount++;
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0x000000 })
        );

        // Nace desde el centro del Gran Otro con una leve variación aleatoria
        mesh.position.set(
            granOtro.position.x + (Math.random() - 0.5) * 10,
            granOtro.position.y + (Math.random() - 0.5) * 10,
            granOtro.position.z + (Math.random() - 0.5) * 10
        );

        // --- CAMBIO AQUÍ: Separar el cartel ---
        const label = createLabel(`S${sCount}`);
        
        // Ajustamos la posición relativa del cartel respecto a la bolita
        // 1.5 es una distancia prudente para que no se solapen
        label.position.set(0, 1.5, 0); 
        
        mesh.add(label);
        scene.add(mesh);

        significantes.push({ mesh: mesh, targetPos: new THREE.Vector3() });
        reordenarRetroactivamente();

        for(let i=0; i<40; i++) {
            const idx = Math.floor(Math.random() * MAX_PARTICULAS);
            particulasData[idx] = {
                pos: mesh.position.clone(),
                vel: new THREE.Vector3((Math.random()-0.5)*0.5, (Math.random()-0.5)*0.5, (Math.random()-0.5)*0.5),
                active: true
            };
        }

        iluminarTrayectoGrafo();
    };

    function iluminarTrayectoGrafo() {
    const lineaS = document.getElementById('arco_inferior');
    const vectorA = document.getElementById('retro_significacion_1');

    if (!lineaS || !vectorA) return;

    const colorGlow = "#49ad19"; 

    const crearRayoDeLuz = (originalPath) => {
        const clone = originalPath.cloneNode(true);
        const length = originalPath.getTotalLength();
        
        clone.removeAttribute('id'); 
        clone.style.stroke = colorGlow;
        clone.style.strokeWidth = 3;
        clone.style.filter = `drop-shadow(0px 0px 8px ${colorGlow})`;
        clone.style.fill = "none";
        clone.style.strokeDasharray = `${length}px`;
        clone.style.strokeDashoffset = `${length}px`; 
        
        // --- EL TRUCO: Empezar invisible para evitar el "fantasma" ---
        clone.style.opacity = "0"; 
        
        originalPath.parentNode.appendChild(clone);
        return { clone, length };
    };

    const rayoS = crearRayoDeLuz(lineaS);
    const rayoA = crearRayoDeLuz(vectorA);
    const clonesABorrar = [rayoS.clone, rayoA.clone];

    const tl = gsap.timeline({
        onComplete: () => {
            gsap.to(clonesABorrar, {
                opacity: 0, duration: 0.8, ease: "power2.out",
                onComplete: () => { clonesABorrar.forEach(clon => clon.remove()); }
            });
        }
    });

    // PISO 1: Animamos la opacidad a 1 al mismo tiempo que el trazado
    tl.to(rayoS.clone, { 
        opacity: 1, // Se hace visible mientras se dibuja
        strokeDashoffset: 0, 
        duration: 0.4, 
        ease: "power1.inOut" 
    })
    .to(rayoA.clone, { 
        opacity: 1, 
        strokeDashoffset: 0, 
        duration: 0.3, 
        ease: "power1.inOut" 
    }, ">");

    // PISO 2
    if (sCount >= 5) {
        const vectorPulsion = document.getElementById('vector_A_Pulsion');
        const circuitoU2 = document.getElementById('path_U_2');

        if (vectorPulsion && circuitoU2) {
            const rayoPulsion = crearRayoDeLuz(vectorPulsion);
            
            const rayoU2Personalizado = document.createElementNS("http://www.w3.org/2000/svg", "path");
            // Mantenemos la dirección hacia la IZQUIERDA
            const dCustom = "m 162,126 c 0,0 -3,-19 -25,-19 -21,0 -25,18 -25,18 l 0,-10"; 
            
            rayoU2Personalizado.setAttribute("d", dCustom);
            rayoU2Personalizado.style.stroke = colorGlow;
            rayoU2Personalizado.style.strokeWidth = 3;
            rayoU2Personalizado.style.filter = `drop-shadow(0px 0px 8px ${colorGlow})`;
            rayoU2Personalizado.style.fill = "none";
            rayoU2Personalizado.style.strokeLinecap = "round";
            rayoU2Personalizado.style.opacity = "0"; // Invisible al nacer

            const lengthCustom = 65; 
            rayoU2Personalizado.style.strokeDasharray = lengthCustom;
            rayoU2Personalizado.style.strokeDashoffset = lengthCustom;

            circuitoU2.parentNode.appendChild(rayoU2Personalizado);
            clonesABorrar.push(rayoPulsion.clone, rayoU2Personalizado);

            tl.to(rayoPulsion.clone, {
                opacity: 1,
                strokeDashoffset: 0,
                duration: 0.3,
                ease: "power1.inOut"
            }, ">")
            .to(rayoU2Personalizado, {
                opacity: 1,
                strokeDashoffset: 0,
                duration: 0.4,
                ease: "power1.out"
            }, ">");
        }
    }
}

    container.addEventListener('click', manejarClick);

    function animate() {
        animationId = requestAnimationFrame(animate);
        const time = Date.now() * 0.001;

        // --- Animación del Tesoro de Significantes ---
        const posAtributo = geometriaA.attributes.position.array;
        for(let i = 0; i < cantidadA; i++) {
            const ix = i * 3;
            // Oscilación suave con senos y cosenos
            posAtributo[ix] = posicionesBaseA[ix] + Math.sin(time * 2 + posicionesBaseA[ix+1]) * 0.5;
            posAtributo[ix+1] = posicionesBaseA[ix+1] + Math.cos(time * 2 + posicionesBaseA[ix]) * 0.5;
            posAtributo[ix+2] = posicionesBaseA[ix+2] + Math.sin(time * 2 + posicionesBaseA[ix+2]) * 0.5;
        }
        geometriaA.attributes.position.needsUpdate = true;
        
        // Rotación general muy lenta
        granOtro.rotation.y += 0.0005;
        granOtro.rotation.z += 0.0002;

        significantes.forEach(s => s.mesh.position.lerp(s.targetPos, 0.05));

        if (significantes.length > 1) {
            if (redLineas) scene.remove(redLineas);
            const puntosLineas = [];
            const limiteConexion = 12;
            for (let i = 0; i < significantes.length; i++) {
                for (let j = i + 1; j < significantes.length; j++) {
                    const d = significantes[i].mesh.position.distanceTo(significantes[j].mesh.position);
                    if (d < limiteConexion) {
                        puntosLineas.push(significantes[i].mesh.position.x, significantes[i].mesh.position.y, significantes[i].mesh.position.z);
                        puntosLineas.push(significantes[j].mesh.position.x, significantes[j].mesh.position.y, significantes[j].mesh.position.z);
                    }
                }
            }
            const lineGeo = new THREE.BufferGeometry();
            lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(puntosLineas, 3));
            redLineas = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: 0x000, transparent: true, opacity: 0.15 }));
            scene.add(redLineas);
        }

        for (let i = 0; i < MAX_PARTICULAS; i++) {
            const p = particulasData[i];
            if (!p || !p.active) continue;
            const dist = p.pos.distanceTo(centroA);
            if (dist > 4) {
                const fuerza = new THREE.Vector3().subVectors(centroA, p.pos).normalize().multiplyScalar(0.02);
                p.vel.add(fuerza);
                p.pos.add(p.vel);
                p.vel.multiplyScalar(0.96);
            } else {
                p.pos.x += Math.sin(time + i) * 0.02;
                p.pos.z += Math.cos(time + i) * 0.02;
            }
            dummy.position.copy(p.pos);
            const scale = 0.5 + Math.sin(time * 2 + i) * 0.2;
            dummy.scale.set(scale, scale, scale);
            dummy.updateMatrix();
            restoMesh.setMatrixAt(i, dummy.matrix);
        }
        restoMesh.instanceMatrix.needsUpdate = true;

        controls.update(); // CRUCIAL para el Damping
        renderer.render(scene, camera);
    }

    animate();

    return {
        renderer,
        camera,
        stop: () => {
            cancelAnimationFrame(animationId);
            container.removeEventListener('click', manejarClick);
            renderer.dispose();
            restoGeo.dispose();
            restoMat.dispose();
            controls.dispose();
        }
    };
}