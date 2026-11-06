// Efectos visuales con estilo de manga: estrellas de impacto, líneas de velocidad,
// partículas en un solo lote y rayos con contorno de tinta.
//
// Las partículas comparten un único objeto Points (una sola llamada de dibujo) y las
// geometrías se reutilizan. Antes cada chispa era una malla nueva con su material.
const MAX_PARTICLES = 420;

const PARTICLE_VERTEX = `
    attribute float aSize;
    attribute float aAlpha;
    attribute vec3 aColor;
    varying float vAlpha;
    varying vec3 vColor;
    uniform float uScale;
    void main() {
        vAlpha = aAlpha;
        vColor = aColor;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uScale / max(0.1, -mv.z);
        gl_Position = projectionMatrix * mv;
    }
`;

// Rombo de bordes duros con línea de tinta: se lee como una chispa dibujada.
const PARTICLE_FRAGMENT = `
    varying float vAlpha;
    varying vec3 vColor;
    void main() {
        vec2 p = abs(gl_PointCoord - 0.5) * 2.0;
        float d = p.x + p.y;
        if (d > 1.0 || vAlpha <= 0.01) discard;
        vec3 color = d > 0.72 ? vec3(0.08, 0.06, 0.05) : mix(vColor, vec3(1.0), 0.15);
        gl_FragColor = vec4(color, vAlpha);
    }
`;

class VFXManager {
    constructor(scene) {
        this.scene = scene;
        this.projectiles = [];
        this.beams = [];
        this.bursts = [];
        this.bolts = [];
        this.screenShakeIntensity = 0;
        this.screenShakeDecay = 0.9;
        this.cameraShakeOffset = new THREE.Vector3();
        this.quality = 1;
        this.shared = {
            sphere: new THREE.SphereGeometry(1, 14, 12),
            plane: new THREE.PlaneGeometry(1, 1),
            beam: new THREE.CylinderGeometry(1, 1, 1, 14, 1, true).rotateX(Math.PI / 2),
            ring: new THREE.RingGeometry(0.72, 1, 28),
            ink: new THREE.MeshBasicMaterial({ color: window.inkColor(0x14100c), side: THREE.BackSide }),
            white: new THREE.MeshBasicMaterial({ color: 0xffffff }),
        };
        this.impactTexture = this.makeImpactTexture();
        this.initParticles();
    }

    makeImpactTexture() {
        return window.canvasTexture(256, 256, (ctx, w) => {
            const spikes = 11;
            const star = (outer, inner, fill) => {
                ctx.beginPath();
                for (let i = 0; i < spikes * 2; i++) {
                    const r = (i % 2 === 0 ? outer : inner) * w / 2 * (i % 4 === 0 ? 1 : 0.8);
                    const a = (i / (spikes * 2)) * Math.PI * 2;
                    ctx.lineTo(w / 2 + Math.cos(a) * r, w / 2 + Math.sin(a) * r);
                }
                ctx.closePath();
                ctx.fillStyle = fill;
                ctx.fill();
            };
            star(0.98, 0.5, '#14100c');
            star(0.86, 0.42, '#ffffff');
        });
    }

    initParticles() {
        const n = MAX_PARTICLES;
        this.pPos = new Float32Array(n * 3);
        this.pVel = new Float32Array(n * 3);
        this.pColor = new Float32Array(n * 3);
        this.pSize = new Float32Array(n);
        this.pBase = new Float32Array(n);
        this.pAlpha = new Float32Array(n);
        this.pLife = new Float32Array(n);
        this.pMax = new Float32Array(n);
        this.pGrav = new Float32Array(n);
        this.pNext = 0;

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(this.pPos, 3).setUsage(THREE.DynamicDrawUsage));
        geo.setAttribute('aColor', new THREE.BufferAttribute(this.pColor, 3).setUsage(THREE.DynamicDrawUsage));
        geo.setAttribute('aSize', new THREE.BufferAttribute(this.pSize, 1).setUsage(THREE.DynamicDrawUsage));
        geo.setAttribute('aAlpha', new THREE.BufferAttribute(this.pAlpha, 1).setUsage(THREE.DynamicDrawUsage));

        this.pointsMaterial = new THREE.ShaderMaterial({
            vertexShader: PARTICLE_VERTEX,
            fragmentShader: PARTICLE_FRAGMENT,
            uniforms: { uScale: { value: 300 } },
            transparent: true,
            depthWrite: false,
        });
        this.points = new THREE.Points(geo, this.pointsMaterial);
        this.points.frustumCulled = false;
        this.scene.add(this.points);
    }

    setViewportHeight(h) {
        this.pointsMaterial.uniforms.uScale.value = h * 0.62;
    }

    spawn(x, y, z, vx, vy, vz, colorHex, size, life, gravity) {
        const i = this.pNext;
        this.pNext = (i + 1) % MAX_PARTICLES;
        this.pPos[i * 3] = x; this.pPos[i * 3 + 1] = y; this.pPos[i * 3 + 2] = z;
        this.pVel[i * 3] = vx; this.pVel[i * 3 + 1] = vy; this.pVel[i * 3 + 2] = vz;
        this.pColor[i * 3] = ((colorHex >> 16) & 255) / 255;
        this.pColor[i * 3 + 1] = ((colorHex >> 8) & 255) / 255;
        this.pColor[i * 3 + 2] = (colorHex & 255) / 255;
        this.pBase[i] = size;
        this.pLife[i] = life;
        this.pMax[i] = life;
        this.pGrav[i] = gravity;
    }

    // ─────────────────────────────────────────────
    //  API DE EFECTOS
    // ─────────────────────────────────────────────
    shake(amount = 0.4) {
        this.screenShakeIntensity = Math.max(this.screenShakeIntensity, amount);
        const gestured = !navigator.userActivation || navigator.userActivation.hasBeenActive;
        if (navigator.vibrate && gestured) navigator.vibrate(Math.min(150, Math.floor(amount * 200)));
    }

    createHitSparks(position, color = 0xffe600, count = 18) {
        const n = Math.ceil(count * this.quality);
        for (let i = 0; i < n; i++) {
            const speed = 4 + Math.random() * 8;
            const theta = Math.random() * Math.PI * 2;
            const phi = (Math.random() - 0.5) * Math.PI;
            this.spawn(position.x, position.y, position.z,
                Math.cos(theta) * Math.cos(phi) * speed,
                Math.sin(phi) * speed + 2,
                Math.sin(theta) * Math.cos(phi) * speed,
                color, 0.28 + Math.random() * 0.3, 0.22 + Math.random() * 0.2, -14);
        }
        this.createImpact(position, count >= 20 ? 3.2 : 2.1);
    }

    // Estrella de impacto: aparece de golpe, crece un poco y desaparece
    createImpact(position, size = 2) {
        const mat = new THREE.MeshBasicMaterial({
            map: this.impactTexture, transparent: true, depthWrite: false, depthTest: false,
        });
        const mesh = new THREE.Mesh(this.shared.plane, mat);
        mesh.position.copy(position);
        mesh.renderOrder = 5;
        this.scene.add(mesh);
        this.bursts.push({ mesh, life: 0.16, maxLife: 0.16, size, billboard: true });
    }

    createShockwave(position, color = 0xffffff, maxRadius = 3) {
        const mat = new THREE.MeshBasicMaterial({
            color, side: THREE.DoubleSide, transparent: true, opacity: 0.95, depthWrite: false,
        });
        const mesh = new THREE.Mesh(this.shared.ring, mat);
        mesh.position.copy(position);
        mesh.rotation.x = -Math.PI / 2;
        this.scene.add(mesh);
        this.bursts.push({ mesh, life: 0.32, maxLife: 0.32, size: maxRadius * 2 });
    }

    emitAura(position, colorHex = 0xffd700, count = 4) {
        const n = Math.max(1, Math.round(count * this.quality));
        for (let i = 0; i < n; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.45 + Math.random() * 0.6;
            this.spawn(
                position.x + Math.cos(angle) * radius,
                position.y + Math.random() * 0.4,
                position.z + Math.sin(angle) * radius,
                -Math.cos(angle) * 0.6, 4.5 + Math.random() * 3.5, -Math.sin(angle) * 0.6,
                colorHex, 0.3 + Math.random() * 0.34, 0.35 + Math.random() * 0.25, 1.5);
        }
    }

    emitLightning(startPos, endPos, color = 0xfff176, life = 0.11) {
        const points = [startPos.clone()];
        const steps = 6;
        for (let i = 1; i < steps; i++) {
            const p = new THREE.Vector3().lerpVectors(startPos, endPos, i / steps);
            p.x += (Math.random() - 0.5) * 0.8;
            p.y += (Math.random() - 0.5) * 0.8;
            p.z += (Math.random() - 0.5) * 0.8;
            points.push(p);
        }
        points.push(endPos.clone());
        const line = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(points),
            new THREE.LineBasicMaterial({ color, transparent: true })
        );
        this.scene.add(line);
        this.bolts.push({ mesh: line, life, maxLife: life });
    }

    spawnProjectile(owner, startPos, direction, config = {}) {
        const speed = config.speed || 18;
        const color = config.color || 0x00d9ff;
        const size = config.size || 0.4;

        const group = new THREE.Group();
        const core = new THREE.Mesh(this.shared.sphere, this.shared.white);
        core.scale.setScalar(size * 0.62);
        group.add(core);
        const glowMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
        const glow = new THREE.Mesh(this.shared.sphere, glowMat);
        glow.scale.setScalar(size);
        group.add(glow);
        const ink = new THREE.Mesh(this.shared.sphere, this.shared.ink);
        ink.scale.setScalar(size * 1.16);
        group.add(ink);

        group.position.copy(startPos);
        this.scene.add(group);

        const proj = {
            owner,
            mesh: group,
            velocity: direction.clone().normalize().multiplyScalar(speed),
            damage: config.damage || 14,
            radius: size * 1.1,
            life: 2.5,
            color,
            trailTimer: 0,
            ownMaterial: glowMat,
        };
        this.projectiles.push(proj);
        return proj;
    }

    // kind: 'beam' (rayo), 'bolt' (rayo eléctrico irregular) o 'flame' (llamarada que se abre)
    spawnBeam(owner, startPos, direction, config = {}) {
        const length = config.length || 24;
        const radius = config.radius || 1.1;
        const color = config.color || 0x00bfff;
        const duration = config.duration || 1.4;
        const kind = config.kind || 'beam';

        const group = new THREE.Group();
        const shellMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.92 });
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true });

        const ink = new THREE.Mesh(this.shared.beam, this.shared.ink);
        const shell = new THREE.Mesh(this.shared.beam, shellMat);
        const core = new THREE.Mesh(this.shared.beam, coreMat);
        const shapes = [ink, shell, core];
        shapes.forEach(m => { m.position.z = length / 2; group.add(m); });

        const head = new THREE.Mesh(this.shared.sphere, coreMat);
        head.position.z = length;
        head.scale.setScalar(radius * 1.25);
        const muzzle = new THREE.Mesh(this.shared.sphere, shellMat);
        muzzle.scale.setScalar(radius * 0.62);
        group.add(head, muzzle);

        group.position.copy(startPos);
        group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction.clone().normalize());
        this.scene.add(group);

        const beam = {
            owner, mesh: group, kind, ink, shell, core, head, muzzle,
            ownMaterials: [shellMat, coreMat],
            startPos: startPos.clone(),
            direction: direction.clone().normalize(),
            length, radius,
            damage: config.damage || 45,
            duration, life: duration, color,
            grow: 0,
            sparkTimer: 0,
        };
        this.beams.push(beam);
        this.shake(0.6);
        this.createShockwave(new THREE.Vector3(startPos.x, 0.05, startPos.z), color, 5);
        return beam;
    }

    // ─────────────────────────────────────────────
    //  LIMPIEZA
    // ─────────────────────────────────────────────
    removeProjectile(index) {
        const p = this.projectiles[index];
        this.scene.remove(p.mesh);
        p.ownMaterial.dispose();
        this.projectiles.splice(index, 1);
    }

    removeBeam(index) {
        const b = this.beams[index];
        this.scene.remove(b.mesh);
        b.ownMaterials.forEach(m => m.dispose());
        this.beams.splice(index, 1);
    }

    removeBurst(list, index) {
        const b = list[index];
        this.scene.remove(b.mesh);
        b.mesh.material.dispose();
        if (b.mesh.geometry !== this.shared.plane && b.mesh.geometry !== this.shared.ring) b.mesh.geometry.dispose();
        list.splice(index, 1);
    }

    // Limpia todos los efectos: entre rondas no debe sobrevivir ningún disparo
    clear() {
        while (this.projectiles.length) this.removeProjectile(0);
        while (this.beams.length) this.removeBeam(0);
        while (this.bursts.length) this.removeBurst(this.bursts, 0);
        while (this.bolts.length) this.removeBurst(this.bolts, 0);
        this.pLife.fill(0);
        this.pAlpha.fill(0);
        this.screenShakeIntensity = 0;
        this.cameraShakeOffset.set(0, 0, 0);
    }

    // ─────────────────────────────────────────────
    //  UPDATE
    // ─────────────────────────────────────────────
    update(dt, camera) {
        // Partículas
        for (let i = 0; i < MAX_PARTICLES; i++) {
            if (this.pLife[i] <= 0) {
                if (this.pAlpha[i] !== 0) { this.pAlpha[i] = 0; this.pSize[i] = 0; }
                continue;
            }
            this.pLife[i] -= dt;
            const k = i * 3;
            this.pVel[k + 1] += this.pGrav[i] * dt;
            this.pPos[k] += this.pVel[k] * dt;
            this.pPos[k + 1] += this.pVel[k + 1] * dt;
            this.pPos[k + 2] += this.pVel[k + 2] * dt;
            const progress = Math.max(0, this.pLife[i] / this.pMax[i]);
            this.pAlpha[i] = Math.min(1, progress * 2.2);
            this.pSize[i] = this.pBase[i] * (0.35 + progress * 0.65);
        }
        const attrs = this.points.geometry.attributes;
        attrs.position.needsUpdate = true;
        attrs.aColor.needsUpdate = true;
        attrs.aSize.needsUpdate = true;
        attrs.aAlpha.needsUpdate = true;

        // Estrellas de impacto y ondas
        for (let i = this.bursts.length - 1; i >= 0; i--) {
            const b = this.bursts[i];
            b.life -= dt;
            if (b.life <= 0) { this.removeBurst(this.bursts, i); continue; }
            const progress = b.life / b.maxLife;
            const eased = 1 - progress * progress;
            b.mesh.scale.setScalar(b.size * (b.billboard ? 0.75 + eased * 0.25 : Math.max(0.05, eased)));
            b.mesh.material.opacity = Math.min(1, progress * 2);
            if (b.billboard && camera) b.mesh.quaternion.copy(camera.quaternion);
        }

        // Relámpagos
        for (let i = this.bolts.length - 1; i >= 0; i--) {
            const b = this.bolts[i];
            b.life -= dt;
            if (b.life <= 0) { this.removeBurst(this.bolts, i); continue; }
            b.mesh.material.opacity = b.life / b.maxLife;
        }

        // Proyectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.life -= dt;
            const pos = proj.mesh.position;
            if (proj.life <= 0 || Math.abs(pos.x) > 16 || Math.abs(pos.z) > 11) {
                this.removeProjectile(i);
                continue;
            }
            pos.addScaledVector(proj.velocity, dt);
            proj.trailTimer += dt;
            if (proj.trailTimer > 0.03) {
                proj.trailTimer = 0;
                this.spawn(pos.x, pos.y, pos.z, (Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5),
                    proj.color, 0.34, 0.24, 0);
            }
        }

        // Rayos
        for (let i = this.beams.length - 1; i >= 0; i--) {
            const beam = this.beams[i];
            beam.life -= dt;
            if (beam.life <= 0) { this.removeBeam(i); continue; }
            this.updateBeam(beam, dt);
        }

        // Temblor de cámara
        if (this.screenShakeIntensity > 0.005) {
            const s = this.screenShakeIntensity;
            this.cameraShakeOffset.set((Math.random() - 0.5) * s, (Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
            this.screenShakeIntensity *= Math.pow(this.screenShakeDecay, dt * 60);
        } else {
            this.cameraShakeOffset.set(0, 0, 0);
            this.screenShakeIntensity = 0;
        }
    }

    updateBeam(beam, dt) {
        const { radius: r, length: L, kind } = beam;
        // Sale disparado: en un instante recorre todo su largo
        beam.grow = Math.min(1, beam.grow + dt * 11);
        const len = L * beam.grow;
        const fade = Math.min(1, beam.life / 0.22);
        const pulse = 1 + Math.sin(beam.life * 42) * 0.09;

        const setShape = (mesh, radiusScale) => {
            const rad = r * radiusScale * pulse * fade;
            mesh.scale.set(rad, rad, Math.max(0.01, len));
            mesh.position.z = len / 2;
        };

        if (kind === 'flame') {
            // La llamarada no es un tubo: son lenguas de fuego que se abren al avanzar
            beam.ink.visible = false;
            beam.shell.visible = false;
            beam.core.visible = false;
            beam.head.visible = false;
            beam.muzzle.visible = false;
            beam.sparkTimer += dt;
            if (beam.sparkTimer > 0.012) {
                beam.sparkTimer = 0;
                const n = Math.ceil(5 * this.quality);
                const d = beam.direction;
                for (let k = 0; k < n; k++) {
                    const spread = (Math.random() - 0.5) * 0.34;
                    const vx = d.x + (-d.z) * spread;
                    const vz = d.z + d.x * spread;
                    const speed = L / 0.42;
                    const hot = Math.random() < 0.3;
                    this.spawn(beam.startPos.x, beam.startPos.y + (Math.random() - 0.5) * 0.4, beam.startPos.z,
                        vx * speed, (Math.random() - 0.5) * 3 + 1, vz * speed,
                        hot ? 0xffe680 : (Math.random() < 0.5 ? 0xff7a1a : 0xd93a0b),
                        0.7 + Math.random() * 0.8, 0.42, 0);
                }
            }
        } else {
            const thin = kind === 'bolt' ? 0.5 : 1;
            setShape(beam.ink, 1.12 * thin);
            setShape(beam.shell, 1 * thin);
            setShape(beam.core, 0.55 * thin);
            beam.head.position.z = len;
            beam.head.scale.setScalar(r * 1.2 * thin * pulse * fade);

            beam.sparkTimer += dt;
            if (kind === 'bolt' && beam.sparkTimer > 0.03) {
                beam.sparkTimer = 0;
                const d = beam.direction;
                const reach = (off) => new THREE.Vector3(
                    beam.startPos.x + d.x * off, beam.startPos.y, beam.startPos.z + d.z * off
                );
                for (let k = 0; k < 3; k++) {
                    const a = Math.random() * len * 0.8;
                    const b = reach(a + 2 + Math.random() * 3);
                    b.y += (Math.random() - 0.5) * r * 2.4;
                    b.x += (-d.z) * (Math.random() - 0.5) * r * 2.4;
                    b.z += d.x * (Math.random() - 0.5) * r * 2.4;
                    this.emitLightning(reach(a), b, beam.color, 0.07);
                }
            }
        }
        beam.muzzle.scale.setScalar(r * (kind === 'bolt' ? 0.4 : 0.62) * pulse * fade);
        beam.ownMaterials[0].opacity = 0.92 * fade;
        beam.ownMaterials[1].opacity = fade;
    }
}

window.VFXManager = VFXManager;
