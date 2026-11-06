// Arena: ring de piedra al atardecer, dibujado como un fondo de manga.
// El fondo son planos con textura pintada por código: pesa poco y no necesita archivos.
const ARENA_COLORS = {
    skyTop: '#c9512f', skyMid: '#ee9a4d', skyLow: '#f7d58a',
    ink: '#14100c', farHill: '#a4553a', midHill: '#6d3528', nearHill: '#3a1d1b',
    stone: '#b9a487', stoneDark: '#8f7b63', stoneLine: '#2b2118', fog: 0xe39a5a,
};

function canvasTexture(w, h, draw) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    draw(canvas.getContext('2d'), w, h);
    const tex = new THREE.CanvasTexture(canvas);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
}

// Generador con semilla: el fondo sale igual en cada partida.
function seededRandom(seed) {
    let s = seed;
    return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

class Arena {
    constructor(scene) {
        this.scene = scene;
        this.buildSky();
        this.buildHills();
        this.buildRing();
    }

    buildSky() {
        const tex = canvasTexture(16, 512, (ctx, w, h) => {
            const g = ctx.createLinearGradient(0, 0, 0, h);
            g.addColorStop(0, ARENA_COLORS.skyTop);
            g.addColorStop(0.55, ARENA_COLORS.skyMid);
            g.addColorStop(1, ARENA_COLORS.skyLow);
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
        });
        this.scene.background = tex;

        // Sol: un disco plano con tramado de líneas, como trama de imprenta
        const sunTex = canvasTexture(256, 256, (ctx, w) => {
            ctx.fillStyle = '#fff3cf';
            ctx.beginPath();
            ctx.arc(w / 2, w / 2, w * 0.46, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalCompositeOperation = 'destination-out';
            for (let y = w * 0.56, gap = 16; y < w; y += gap, gap = Math.max(5, gap - 1.4)) {
                ctx.fillRect(0, y, w, 16 - gap + 3);
            }
        });
        const sun = new THREE.Mesh(
            new THREE.PlaneGeometry(22, 22),
            new THREE.MeshBasicMaterial({ map: sunTex, transparent: true, fog: false, depthWrite: false })
        );
        sun.position.set(-9, 11, -70);
        this.scene.add(sun);
    }

    hillLayer(color, seed, peaks, roughness, width, height, z, y) {
        const tex = canvasTexture(1024, 256, (ctx, w, h) => {
            const rand = seededRandom(seed);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(0, h);
            for (let i = 0; i <= peaks; i++) {
                const x = (i / peaks) * w;
                const peak = i % 2 === 0;
                const py = peak ? h * (0.1 + rand() * 0.45) : h * (0.55 + rand() * roughness);
                ctx.lineTo(x, py);
            }
            ctx.lineTo(w, h);
            ctx.closePath();
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = ARENA_COLORS.ink;
            ctx.stroke();
        });
        const mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(width, height),
            new THREE.MeshBasicMaterial({ map: tex, transparent: true, fog: false, depthWrite: false })
        );
        mesh.position.set(0, y, z);
        this.scene.add(mesh);
    }

    buildHills() {
        this.hillLayer(ARENA_COLORS.farHill, 11, 22, 0.25, 190, 34, -66, 11);
        this.hillLayer(ARENA_COLORS.midHill, 29, 16, 0.3, 170, 26, -52, 6);
        this.hillLayer(ARENA_COLORS.nearHill, 47, 12, 0.28, 150, 18, -38, 2.5);

        // Suelo lejano, para que el ring no flote
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(240, 120),
            new THREE.MeshBasicMaterial({ color: window.inkColor(0x3a1d1b), fog: false })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.set(0, -1.6, -10);
        this.scene.add(ground);
    }

    buildRing() {
        const W = 25, D = 15;
        const tex = canvasTexture(1024, 614, (ctx, w, h) => {
            const rand = seededRandom(7);
            ctx.fillStyle = ARENA_COLORS.stone;
            ctx.fillRect(0, 0, w, h);

            // Losas de piedra: cada una con un tono apenas distinto y líneas irregulares
            const cols = 10, rows = 6;
            const cw = w / cols, ch = h / rows;
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const shade = rand();
                    if (shade < 0.45) {
                        ctx.fillStyle = shade < 0.18 ? ARENA_COLORS.stoneDark : '#a8947a';
                        ctx.fillRect(c * cw, r * ch, cw, ch);
                    }
                    // Grietas de tinta
                    if (rand() < 0.22) {
                        ctx.strokeStyle = 'rgba(43,33,24,0.55)';
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        let x = c * cw + rand() * cw, y = r * ch + rand() * ch;
                        ctx.moveTo(x, y);
                        for (let i = 0; i < 3; i++) {
                            x += (rand() - 0.5) * 40;
                            y += (rand() - 0.5) * 40;
                            ctx.lineTo(x, y);
                        }
                        ctx.stroke();
                    }
                }
            }
            ctx.strokeStyle = ARENA_COLORS.stoneLine;
            ctx.lineWidth = 3;
            for (let c = 0; c <= cols; c++) {
                ctx.beginPath(); ctx.moveTo(c * cw, 0); ctx.lineTo(c * cw, h); ctx.stroke();
            }
            for (let r = 0; r <= rows; r++) {
                ctx.beginPath(); ctx.moveTo(0, r * ch); ctx.lineTo(w, r * ch); ctx.stroke();
            }

            // Marca central: un círculo pintado con pincel seco
            ctx.strokeStyle = 'rgba(20,16,12,0.8)';
            ctx.lineWidth = 9;
            ctx.beginPath();
            ctx.ellipse(w / 2, h / 2, w * 0.13, w * 0.13, 0, 0.2, Math.PI * 1.92);
            ctx.stroke();
            // Borde del ring
            ctx.lineWidth = 14;
            ctx.strokeRect(7, 7, w - 14, h - 14);
        });
        tex.anisotropy = 4;

        const stoneSide = new THREE.MeshToonMaterial({ color: window.inkColor(0x7c6650), gradientMap: window.toonRamp() });
        const top = new THREE.MeshToonMaterial({ map: tex, gradientMap: window.toonRamp() });
        const ring = new THREE.Mesh(
            new THREE.BoxGeometry(W, 1.6, D),
            [stoneSide, stoneSide, top, stoneSide, stoneSide, stoneSide]
        );
        ring.position.y = -0.8;
        ring.receiveShadow = true;
        this.scene.add(ring);

        // Contorno de tinta del ring
        const edges = new THREE.LineSegments(
            new THREE.EdgesGeometry(new THREE.BoxGeometry(W, 1.6, D)),
            new THREE.LineBasicMaterial({ color: window.inkColor(0x14100c) })
        );
        edges.position.y = -0.8;
        this.scene.add(edges);

        // Cuatro postes de piedra con faroles, sin marcas de ninguna franquicia
        const postMat = new THREE.MeshToonMaterial({ color: window.inkColor(0x4a3627), gradientMap: window.toonRamp() });
        const lampMat = new THREE.MeshBasicMaterial({ color: window.inkColor(0xffd98a) });
        const postGeo = new THREE.BoxGeometry(0.7, 3.2, 0.7);
        const capGeo = new THREE.BoxGeometry(1.1, 0.25, 1.1);
        const lampGeo = new THREE.BoxGeometry(0.42, 0.5, 0.42);
        const outline = new THREE.MeshBasicMaterial({ color: window.inkColor(0x14100c), side: THREE.BackSide });
        [[-12, -7], [12, -7], [-12, 7], [12, 7]].forEach(([x, z]) => {
            // Los postes delanteros quedan más bajos para no tapar a los luchadores
            const front = z > 0;
            const scaleY = front ? 0.3 : 1;
            const post = new THREE.Mesh(postGeo, postMat);
            post.scale.y = scaleY;
            post.position.set(x, 3.2 * scaleY / 2, z);
            post.castShadow = true;
            this.scene.add(post);
            const hull = new THREE.Mesh(postGeo, outline);
            hull.scale.set(1.08, 1.02, 1.08);
            post.add(hull);
            if (front) return;
            const cap = new THREE.Mesh(capGeo, postMat);
            cap.position.set(x, 3.3, z);
            this.scene.add(cap);
            const lamp = new THREE.Mesh(lampGeo, lampMat);
            lamp.position.set(x, 3.65, z);
            this.scene.add(lamp);
        });
    }
}

window.Arena = Arena;
window.ARENA_COLORS = ARENA_COLORS;
window.canvasTexture = canvasTexture;
