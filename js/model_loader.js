// Model Loader: Loads real GLTF/GLB models for Goku, Pikachu, Charizard with Draco support
// Subir este número al cambiar un .glb: evita que el navegador use la copia vieja.
const ASSET_VERSION = 2;

// Los colores se escriben en sRGB, pero el motor los trata como lineales: sin convertir,
// la tinta sale gris y los tonos oscuros, lavados.
window.inkColor = (hex) => new THREE.Color(hex).convertSRGBToLinear();

// Rampa de tres tonos para el sombreado de tinta. Se comparte entre todos los materiales.
let _toonRamp = null;
window.toonRamp = function () {
    if (_toonRamp) return _toonRamp;
    const data = new Uint8Array([120, 120, 120, 200, 200, 200, 255, 255, 255]);
    _toonRamp = new THREE.DataTexture(data, 3, 1, THREE.RGBFormat);
    _toonRamp.minFilter = THREE.NearestFilter;
    _toonRamp.magFilter = THREE.NearestFilter;
    _toonRamp.generateMipmaps = false;
    _toonRamp.needsUpdate = true;
    return _toonRamp;
};

// Contorno de tinta: la malla por dentro, inflada a lo largo de sus normales.
window.makeOutlineMaterial = function (width, skinning, morphTargets) {
    const mat = new THREE.MeshBasicMaterial({ color: window.inkColor(0x14100c), side: THREE.BackSide, skinning, morphTargets });
    mat.onBeforeCompile = (shader) => {
        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `vec3 transformed = vec3(position) + normalize(normal) * ${width.toFixed(5)};`
        );
    };
    mat.customProgramCacheKey = () => 'outline' + width + skinning + morphTargets;
    return mat;
};

// Grosor del contorno en unidades de la geometría de cada modelo (sus escalas difieren mucho)
const OUTLINE_WIDTH = { pikachu: 0.012, charizard: 0.016 };

class ModelLoader {
    constructor() {
        this.basePose = {
            goku: { clip: '02-STANCE', time: 1, yaw: -0.80 },
            naruto: { clip: 'Armature|Armature|walking_man|baselayer', time: 0 },
            vegeta: { clip: 'Armature|Armature.001|mixamo.com|Layer0', time: 0 },
            tanjiro: {},
            // standing tiene pies apoyados y brazos relajados; su torso mira 0.30 rad a la izquierda.
            luffy: { clip: 'standing', time: 0.5, yaw: 0.30 },
            gojo: {},
            pikachu: { clip: 'Impactrueno', time: 2.2 },
            charizard: { clip: 'Chariard_dizzy', time: 0 },
        };
        this.cache = {};
        this.loadingPromises = {};
        this.dracoLoader = null;
        this.gltfLoader = null;

        this.initLoaders();
    }

    initLoaders() {
        if (typeof THREE.DRACOLoader !== 'undefined') {
            this.dracoLoader = new THREE.DRACOLoader();
            this.dracoLoader.setDecoderPath('vendor/draco/');
        }

        if (typeof THREE.GLTFLoader !== 'undefined') {
            this.gltfLoader = new THREE.GLTFLoader();
            if (this.dracoLoader) {
                this.gltfLoader.setDRACOLoader(this.dracoLoader);
            }
        }
    }

    loadModel(type, url, callback) {
        if (!this.gltfLoader) {
            console.warn('GLTFLoader not available, using procedural fallback.');
            return;
        }

        // Return from cache if already loaded
        if (this.cache[type]) {
            callback(this.cloneModel(type));
            return;
        }

        // If already loading, queue callback
        if (this.loadingPromises[type]) {
            this.loadingPromises[type].push(callback);
            return;
        }

        this.loadingPromises[type] = [callback];

        this.gltfLoader.load(
            url,
            (gltf) => {
                this.prepareStyle(type, gltf);
                this.cache[type] = gltf;
                const callbacks = this.loadingPromises[type] || [];
                delete this.loadingPromises[type];
                callbacks.forEach(cb => cb(this.cloneModel(type)));
            },
            undefined,
            (err) => {
                console.warn(`Error loading model ${type} from ${url}:`, err);
                delete this.loadingPromises[type];
            }
        );
    }

    // Unifica el estilo: todos los modelos pasan a sombreado de tinta. Goku ya trae su
    // propio contorno (el material LINE); a los otros se les agrega.
    prepareStyle(type, gltf) {
        const meshes = [];
        gltf.scene.traverse(o => { if (o.isMesh) meshes.push(o); });
        if (type === 'gojo') {
            // La publicación incluye una pose de ilustración y dos esferas de chakra.
            // Recuperar la A-pose real de los inverse binds conserva el skin y permite
            // animar las piernas; las esferas se sustituyen por los VFX dinámicos del juego.
            const skeletons = new Set(meshes.filter(m => m.isSkinnedMesh).map(m => m.skeleton));
            skeletons.forEach(skeleton => skeleton.pose());
            gltf.scene.updateMatrixWorld(true);
            for (let i = meshes.length - 1; i >= 0; i--) {
                const mesh = meshes[i];
                if (!mesh.isSkinnedMesh && ['Material.001', 'Material.002'].includes(mesh.material.name)) {
                    if (mesh.parent) mesh.parent.remove(mesh);
                    meshes.splice(i, 1);
                }
            }
        }
        meshes.forEach(mesh => {
            const old = mesh.material;
            if (old.name === 'LINE') return;
            const isFire = type === 'charizard' && mesh.geometry.attributes.position.count < 200;
            if (isFire) {
                // Llama de la cola: sin sombreado y siempre brillante
                mesh.material = new THREE.MeshBasicMaterial({
                    map: old.map, color: window.inkColor(0xffb347), skinning: true, transparent: true,
                    blending: THREE.AdditiveBlending, depthWrite: false,
                });
                mesh.userData.noOutline = true;
                return;
            }
            mesh.material = new THREE.MeshToonMaterial({
                map: old.map, color: old.color ? old.color.clone() : 0xffffff, gradientMap: window.toonRamp(),
                skinning: !!mesh.isSkinnedMesh, morphTargets: old.morphTargets,
                transparent: old.transparent, opacity: old.opacity, alphaTest: old.alphaTest, side: old.side,
                depthWrite: old.depthWrite, vertexColors: old.vertexColors,
            });
            if (old.map) old.map.anisotropy = 2;
        });
        const width = OUTLINE_WIDTH[type];
        if (!width) return;
        meshes.forEach(mesh => {
            if (!mesh.isSkinnedMesh || mesh.userData.noOutline) return;
            if (mesh.geometry.attributes.position.count < 150) return;
            const hull = new THREE.SkinnedMesh(mesh.geometry, window.makeOutlineMaterial(width, true, false));
            hull.bind(mesh.skeleton, mesh.bindMatrix);
            hull.name = mesh.name + '_outline';
            hull.frustumCulled = false;
            mesh.parent.add(hull);
        });
    }

    // Precarga todo antes de mostrar el menú e informa el avance real (0 a 1).
    preload(types, onProgress) {
        const loaded = {};
        const report = () => {
            const sum = types.reduce((acc, t) => acc + (loaded[t] || 0), 0);
            onProgress(sum / types.length);
        };
        return Promise.all(types.map(type => new Promise(resolve => {
            if (!this.gltfLoader) { resolve(); return; }
            this.gltfLoader.load(`assets/${type}.glb?v=${ASSET_VERSION}`, (gltf) => {
                this.prepareStyle(type, gltf);
                this.cache[type] = gltf;
                loaded[type] = 1;
                report();
                resolve();
            }, (e) => {
                if (e.lengthComputable) { loaded[type] = 0.95 * e.loaded / e.total; report(); }
            }, (err) => {
                console.warn(`No se pudo cargar ${type}, se usa el modelo de respaldo.`, err);
                loaded[type] = 1;
                report();
                resolve();
            });
        })));
    }

    // El tamaño de cada modelo se mide una vez: recorrer sus vértices es caro
    baseBox(type, model) {
        if (!this.boxes) this.boxes = {};
        if (!this.boxes[type]) this.boxes[type] = this.skinnedBox(model);
        return this.boxes[type];
    }

    // Caja de la malla deformada por los huesos. Box3.setFromObject mira la geometría
    // cruda y, en modelos con el esqueleto a otra escala, da un tamaño equivocado.
    skinnedBox(root) {
        root.updateMatrixWorld(true);
        const box = new THREE.Box3();
        const v = new THREE.Vector3();
        root.traverse(o => {
            if (!o.isSkinnedMesh) return;
            const pos = o.geometry.attributes.position;
            for (let i = 0; i < pos.count; i += 3) {
                v.fromBufferAttribute(pos, i);
                o.boneTransform(i, v);
                v.applyMatrix4(o.matrixWorld);
                box.expandByPoint(v);
            }
        });
        if (box.isEmpty()) box.setFromObject(root);
        return box;
    }

    cloneModel(type) {
        const gltf = this.cache[type];
        if (!gltf) return null;

        let clonedScene;
        if (typeof THREE.SkeletonUtils !== 'undefined' && THREE.SkeletonUtils.clone) {
            clonedScene = THREE.SkeletonUtils.clone(gltf.scene);
        } else {
            clonedScene = gltf.scene.clone(true);
        }

        // Enable shadows on meshes
        clonedScene.traverse(child => {
            if (child.isMesh) {
                child.frustumCulled = false;
                const isHull = child.material.side === THREE.BackSide || child.material.blending === THREE.AdditiveBlending;
                child.castShadow = !isHull;
                child.receiveShadow = false;
            }
        });

        return {
            scene: clonedScene,
            animations: gltf.animations || []
        };
    }
}

window.modelLoader = new ModelLoader();
