// Model Loader: Loads real GLTF/GLB models for Goku, Pikachu, Charizard with Draco support
// Subir este número al cambiar un .glb: evita que el navegador use la copia vieja.
const ASSET_VERSION = 2;

class ModelLoader {
    constructor() {
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
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        return {
            scene: clonedScene,
            animations: gltf.animations || []
        };
    }
}

window.modelLoader = new ModelLoader();
