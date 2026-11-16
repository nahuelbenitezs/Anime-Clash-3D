// Energía por capas, luz de impacto, polvo y partículas en un solo lote.
//
// Las partículas comparten un único objeto Points (una sola llamada de dibujo) y las
// geometrías se reutilizan. Antes cada chispa era una malla nueva con su material.
const MAX_PARTICLES = 640;

const PARTICLE_VERTEX = `
    attribute float aSize;
    attribute float aAlpha;
    attribute vec3 aColor;
    attribute float aKind;
    varying float vAlpha;
    varying vec3 vColor;
    varying float vKind;
    uniform float uScale;
    void main() {
        vAlpha = aAlpha;
        vColor = aColor;
        vKind = aKind;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = min(100.0, aSize * uScale / max(0.1, -mv.z));
        gl_Position = projectionMatrix * mv;
    }
`;

// Núcleo caliente y halo suave. El polvo usa el mismo lote con otro perfil.
const PARTICLE_FRAGMENT = `
    varying float vAlpha;
    varying vec3 vColor;
    varying float vKind;
    void main() {
        vec2 p = (gl_PointCoord - 0.5) * 2.0;
        float d = length(p);
        if (d > 1.0 || vAlpha <= 0.01) discard;
        float halo = pow(max(0.0, 1.0 - d), 2.0);
        float core = 1.0 - smoothstep(0.05, 0.3, d);
        float streak = pow(max(0.0, 1.0 - abs(p.x) * 8.0), 3.0) * (1.0 - d);
        float dust = (1.0 - smoothstep(0.1, 1.0, d)) * 0.28;
        float a = mix(halo + streak * 0.3, dust, vKind) * vAlpha;
        vec3 color = mix(vColor, vec3(1.0), core * (1.0 - vKind) * 0.85);
        gl_FragColor = vec4(color, a);
    }
`;

const ENERGY_VERTEX = `
    uniform float uTime;
    uniform float uMode;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vView;
    void main() {
        vUv = uv;
        vec3 animated = position;
        if (uMode > 1.5 && uMode < 2.5) {
            animated.x += sin(uv.y * 18.0 - uTime * 7.0) * 0.12;
            animated.y += cos(uv.y * 13.0 - uTime * 5.0) * 0.12;
        }
        vec4 mv = modelViewMatrix * vec4(animated, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
    }
`;
const ENERGY_FRAGMENT = `
    uniform vec3 uColor;
    uniform float uTime;
    uniform float uOpacity;
    uniform float uMode;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vView;
    void main() {
        float fresnel = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 1.6);
        float flow = sin(vUv.y * 65.0 - uTime * 24.0 + sin(vUv.x * 25.13 + uTime * 4.0) * 2.0);
        float helix = pow(max(0.0, sin(vUv.x * 18.85 + vUv.y * 38.0 - uTime * 17.0)), 8.0);
        float ripples = sin(vUv.x * 50.0 + vUv.y * 90.0 - uTime * 30.0) * 0.5 + 0.5;
        float heat = 0.4 + 0.3 * flow + 0.3 * ripples;
        float alpha = (0.12 + fresnel * 0.5 + helix * 0.65) * uOpacity;
        vec3 color = mix(uColor * 0.65, vec3(1.0), helix * 0.35 + fresnel * 0.12);
        if (uMode > 2.5) {
            alpha *= (1.0 - smoothstep(0.4, 1.0, vUv.y)) * (0.2 + heat);
            color = mix(vec3(1.0, 0.12, 0.015), vec3(1.0, 0.85, 0.22), heat);
        } else if (uMode > 1.5) {
            alpha *= 0.4 + ripples * 0.8;
            color = mix(uColor * 0.4, vec3(0.35, 0.75, 1.0), helix);
        }
        gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.85));
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
        this.clock = 0;
        this.fighterFX = [];
        this.tmpA = new THREE.Vector3();
        this.tmpB = new THREE.Vector3();
        this.forward = new THREE.Vector3(0, 0, 1);
        this.shared = {
            sphere: new THREE.SphereGeometry(1, 14, 12),
            plane: new THREE.PlaneGeometry(1, 1),
            beam: new THREE.CylinderGeometry(1, 1, 1, 14, 1, true).rotateX(Math.PI / 2),
            ring: new THREE.RingGeometry(0.72, 1, 28),
            haloRing: new THREE.RingGeometry(0.95, 1, 48),
            flame: new THREE.CylinderGeometry(1.5, 0.15, 1, 18, 8, true).rotateX(Math.PI / 2),
            ink: new THREE.MeshBasicMaterial({ color: window.inkColor(0x14100c), side: THREE.BackSide }),
            white: new THREE.MeshBasicMaterial({ color: 0xffffff }),
        };
        this.impactTexture = this.makeImpactTexture();
        this.glowTexture = window.canvasTexture(128, 128, (ctx, w) => {
            const gradient = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
            gradient.addColorStop(0, 'rgba(255,255,255,1)');
            gradient.addColorStop(.12, 'rgba(255,255,255,.95)');
            gradient.addColorStop(.28, 'rgba(255,255,255,.36)');
            gradient.addColorStop(.6, 'rgba(255,255,255,.08)');
            gradient.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, w);
        });
        this.flashLight = new THREE.PointLight(0xffd8a2, 0, 12, 2);
        this.scene.add(this.flashLight);
        this.initParticles();
    }

    energyMaterial(color, mode = 0, opacity = 1) {
        return new THREE.ShaderMaterial({
            vertexShader: ENERGY_VERTEX, fragmentShader: ENERGY_FRAGMENT,
            uniforms: { uColor: { value: new THREE.Color(color) }, uTime: { value: 0 },
                uOpacity: { value: opacity }, uMode: { value: mode } },
            transparent: true, depthWrite: false, side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending, toneMapped: false,
        });
    }

    glow(color, size = 1, opacity = .7) {
        const material = new THREE.SpriteMaterial({ map: this.glowTexture, color,
            transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
        const sprite = new THREE.Sprite(material);
        sprite.scale.setScalar(size);
        return sprite;
    }

    setQuality(quality) {
        this.quality = Math.max(.35, Math.min(1, quality));
        this.flashLight.visible = this.quality > .5;
        this.fighterFX.forEach(fx => { fx.light.visible = this.quality > .5; });
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
        this.pKind = new Float32Array(n);
        this.pNext = 0;

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(this.pPos, 3).setUsage(THREE.DynamicDrawUsage));
        geo.setAttribute('aColor', new THREE.BufferAttribute(this.pColor, 3).setUsage(THREE.DynamicDrawUsage));
        geo.setAttribute('aSize', new THREE.BufferAttribute(this.pSize, 1).setUsage(THREE.DynamicDrawUsage));
        geo.setAttribute('aAlpha', new THREE.BufferAttribute(this.pAlpha, 1).setUsage(THREE.DynamicDrawUsage));
        geo.setAttribute('aKind', new THREE.BufferAttribute(this.pKind, 1).setUsage(THREE.DynamicDrawUsage));

        this.pointsMaterial = new THREE.ShaderMaterial({
            vertexShader: PARTICLE_VERTEX,
            fragmentShader: PARTICLE_FRAGMENT,
            uniforms: { uScale: { value: 300 } },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            toneMapped: false,
        });
        this.points = new THREE.Points(geo, this.pointsMaterial);
        this.points.frustumCulled = false;
        this.scene.add(this.points);
    }

    setViewportHeight(h) {
        this.pointsMaterial.uniforms.uScale.value = h * 0.62;
    }

    spawn(x, y, z, vx, vy, vz, colorHex, size, life, gravity, kind = 0) {
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
        this.pKind[i] = kind;
    }

    // ─────────────────────────────────────────────
    //  API DE EFECTOS
    // ─────────────────────────────────────────────
    shake(amount = 0.4) {
        this.screenShakeIntensity = Math.max(this.screenShakeIntensity, amount);
        window.buzz(Math.min(150, Math.floor(amount * 200)));
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
        this.flashLight.position.copy(position).addScalar(.01);
        this.flashLight.color.setHex(color);
        this.flashLight.intensity = Math.max(this.flashLight.intensity, count >= 20 ? 5 : 2.5);
        if (count >= 12) {
            this.tmpA.set(position.x, .035, position.z);
            this.emitDust(this.tmpA, count >= 20 ? 12 : 6, count >= 20 ? 3.5 : 1.8);
            if (count >= 20) this.createShockwave(this.tmpA, color, 2.6);
        }
    }

    emitDust(position, count = 8, speed = 2) {
        const n = Math.ceil(count * this.quality);
        for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = speed * (.4 + Math.random() * .6);
            this.spawn(position.x, Math.max(.03, position.y), position.z,
                Math.cos(a) * s, .3 + Math.random() * .7, Math.sin(a) * s,
                0x9f815b, .6 + Math.random() * .6, .4 + Math.random() * .4, -.45, 1);
        }
    }

    // Estrella de impacto: aparece de golpe, crece un poco y desaparece
    createImpact(position, size = 2) {
        if (this.bursts.length >= 32) this.removeBurst(this.bursts, 0);
        const mat = new THREE.MeshBasicMaterial({
            map: this.impactTexture, transparent: true, depthWrite: false, depthTest: false,
            blending: THREE.AdditiveBlending, toneMapped: false,
        });
        const mesh = new THREE.Mesh(this.shared.plane, mat);
        mesh.position.copy(position);
        mesh.renderOrder = 5;
        this.scene.add(mesh);
        this.bursts.push({ mesh, life: 0.16, maxLife: 0.16, size, billboard: true });
    }

    createShockwave(position, color = 0xffffff, maxRadius = 3) {
        if (this.bursts.length >= 32) this.removeBurst(this.bursts, 0);
        const mat = new THREE.MeshBasicMaterial({
            color, side: THREE.DoubleSide, transparent: true, opacity: 0.8, depthWrite: false,
            blending: THREE.AdditiveBlending, toneMapped: false,
        });
        const mesh = new THREE.Mesh(this.shared.haloRing, mat);
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
        if (this.bolts.length >= 28) this.removeBurst(this.bolts, 0);
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
            new THREE.LineBasicMaterial({ color, transparent: true, blending: THREE.AdditiveBlending, toneMapped: false })
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
        const glowMat = this.energyMaterial(color, 0, .75);
        const glow = new THREE.Mesh(this.shared.sphere, glowMat);
        glow.scale.setScalar(size);
        group.add(glow);
        const halo = this.glow(color, size * 5, .8);
        group.add(halo);

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
            halo,
        };
        this.projectiles.push(proj);
        return proj;
    }

    // El volumen de colisión es común; el dibujo distingue energía, agua, vórtice y fuego.
    spawnBeam(owner, startPos, direction, config = {}) {
        const length = config.length || 24;
        const radius = config.radius || 1.1;
        const color = config.color || 0x00bfff;
        const duration = config.duration || 1.4;
        const kind = config.kind || 'beam';

        const group = new THREE.Group();
        const mode = kind === 'flame' ? 3 : kind === 'water' ? 2 : kind === 'vortex' ? 1 : 0;
        const shellMat = this.energyMaterial(color, mode, kind === 'water' ? .85 : .7);
        if (kind === 'water') shellMat.blending = THREE.NormalBlending;
        const coreMat = new THREE.MeshBasicMaterial({ color: kind === 'water' ? 0xb8f5ff : 0xffffff,
            side: THREE.DoubleSide, transparent: true, opacity: .8, depthWrite: false,
            blending: THREE.AdditiveBlending, toneMapped: false });
        const outerMat = this.energyMaterial(color, mode, .14);

        const ink = new THREE.Mesh(kind === 'flame' ? this.shared.flame : this.shared.beam, outerMat);
        const shell = new THREE.Mesh(kind === 'flame' ? this.shared.flame : this.shared.beam, shellMat);
        const core = new THREE.Mesh(this.shared.beam, coreMat);
        core.visible = kind !== 'water' && kind !== 'vortex';
        const shapes = [ink, shell, core];
        shapes.forEach(m => { m.position.z = length / 2; group.add(m); });

        const head = new THREE.Mesh(this.shared.sphere, shellMat);
        head.position.z = length;
        head.scale.setScalar(radius * 1.25);
        const muzzle = this.glow(color, radius * 6, .9);
        const headGlow = this.glow(color, radius * 4, .5);
        const rings = [];
        const ringMat = new THREE.MeshBasicMaterial({ color: kind === 'water' ? 0xdbffff : color,
            side: THREE.DoubleSide, transparent: true, depthWrite: false,
            blending: THREE.AdditiveBlending, opacity: .6, toneMapped: false });
        for (let i = 0; i < 4; i++) {
            const ring = new THREE.Mesh(this.shared.haloRing, ringMat);
            rings.push(ring); group.add(ring);
        }
        group.add(head, muzzle, headGlow);

        group.position.copy(startPos);
        group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction.clone().normalize());
        this.scene.add(group);

        const beam = {
            owner, mesh: group, kind, ink, shell, core, head, muzzle, headGlow, rings,
            ownMaterials: [shellMat, coreMat, outerMat, muzzle.material, headGlow.material, ringMat],
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
        this.emitDust(new THREE.Vector3(startPos.x, .06, startPos.z), 18, 4);
        return beam;
    }

    // ─────────────────────────────────────────────
    //  LIMPIEZA
    // ─────────────────────────────────────────────
    removeProjectile(index) {
        const p = this.projectiles[index];
        this.scene.remove(p.mesh);
        p.ownMaterial.dispose();
        p.halo.material.dispose();
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
        if (b.mesh.geometry !== this.shared.plane && b.mesh.geometry !== this.shared.ring && b.mesh.geometry !== this.shared.haloRing) b.mesh.geometry.dispose();
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
        this.flashLight.intensity = 0;
        this.fighterFX.forEach(fx => {
            fx.group.visible = false;
            fx.light.intensity = 0;
            fx.fighter = null;
            fx.lastState = '';
            fx.timer = 0;
        });
    }

    createFighterFX() {
        const group = new THREE.Group();
        const auraMat = this.energyMaterial(0xffd700, 0, .2);
        const orbMat = this.energyMaterial(0x55ccff, 1, .9);
        const aura = new THREE.Mesh(this.shared.sphere, auraMat);
        const orb = new THREE.Mesh(this.shared.sphere, orbMat);
        const halo = this.glow(0x55ccff, 3, .5);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: .5,
            depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false });
        const ring = new THREE.Mesh(this.shared.haloRing, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = .045;
        const slashMat = ringMat.clone();
        const slash = new THREE.Mesh(this.shared.ring, slashMat);
        slash.rotation.y = .65;
        const trails = [];
        for (let i = 0; i < 3; i++) {
            const streak = new THREE.Mesh(this.shared.beam, auraMat);
            streak.position.set((i - 1) * .3, .5 + i * .25, -1.3);
            streak.scale.set(.04, .04, 2.4 + i * .6);
            group.add(streak); trails.push(streak);
        }
        const light = new THREE.PointLight(0x55ccff, 0, 7, 2);
        light.visible = this.quality > .5;
        group.add(aura, orb, halo, ring, slash, light);
        group.visible = false;
        this.scene.add(group);
        return { group, aura, orb, halo, ring, slash, trails, light, auraMat, orbMat,
            fighter: null, lastState: '', timer: 0 };
    }

    // Estado visual derivado del luchador: también funciona con snapshots online.
    updateFighterEffects(fighters, dt, camera) {
        for (let i = 0; i < Math.min(2, fighters.length); i++) {
            const f = fighters[i];
            if (!this.fighterFX[i]) this.fighterFX[i] = this.createFighterFX();
            const fx = this.fighterFX[i];
            if (!f || f.isDead || f.state === 'ko') { fx.group.visible = false; continue; }
            fx.fighter = f;
            fx.group.visible = true;
            fx.group.position.copy(f.position);
            fx.group.rotation.y = f.rotationY;
            const charging = f.state === 'charge' || f.sparking;
            const ultimate = f.state === 'ultimate';
            const windup = ultimate && f.stateTimer < f.stats.ult.windup;
            const active = charging || ultimate;
            const color = ultimate ? f.stats.ult.color : f.auraColor || f.stats.aura;
            const size = f.stats.height || 2;
            const pulse = 1 + Math.sin(this.clock * 13) * .06;
            const buildup = windup ? Math.min(1, f.stateTimer / f.stats.ult.windup) : .55;
            fx.aura.visible = active;
            fx.aura.position.y = size * .5;
            fx.aura.scale.set(size * .44 * pulse, size * .72 * pulse, size * .4 * pulse);
            fx.auraMat.uniforms.uTime.value = this.clock;
            fx.auraMat.uniforms.uColor.value.setHex(color);
            fx.auraMat.uniforms.uOpacity.value = f.sparking ? .35 : windup ? .22 : .13;
            fx.orbMat.uniforms.uTime.value = this.clock * 1.4;
            fx.orbMat.uniforms.uColor.value.setHex(f.stats.ult.color);
            fx.orb.visible = windup;
            fx.halo.visible = windup;
            fx.orb.position.set(f.type === 'goku' && windup ? -.42 : 0, f.stats.muzzleY, windup ? .65 : .9);
            fx.orb.scale.setScalar((.16 + buildup * .45) * pulse);
            fx.halo.position.copy(fx.orb.position);
            fx.halo.material.color.setHex(f.stats.ult.color);
            fx.halo.scale.setScalar(1.1 + buildup * 2);
            fx.halo.material.opacity = .3 + buildup * .35;
            fx.ring.visible = active;
            fx.ring.material.color.setHex(color);
            fx.ring.material.opacity = .2 + buildup * .18;
            fx.ring.scale.setScalar((.85 + buildup * .75) * pulse);
            fx.ring.rotation.z = this.clock * .6;
            fx.light.color.setHex(color);
            fx.light.position.set(0, f.stats.muzzleY, .6);
            fx.light.intensity = active ? (windup ? 1 + buildup * 1.8 : .65) : 0;
            fx.light.visible = this.quality > .5;
            const dash = f.state === 'dash';
            fx.trails.forEach(streak => { streak.visible = dash; });
            fx.slash.visible = f.state === 'attack' && f.stateTimer > .05 && f.stateTimer < .2;
            if (fx.slash.visible) {
                fx.slash.position.set(0, f.stats.muzzleY, .9);
                fx.slash.rotation.z = f.stateTimer * 24;
                fx.slash.scale.set(1.3, .65, 1);
                fx.slash.material.color.setHex(f.type === 'tanjiro' ? 0xa8faff : color);
                fx.slash.material.opacity = Math.max(0, (.2 - f.stateTimer) * 3);
            }
            fx.timer += dt;
            if (fx.timer > (dash ? .05 : .14)) {
                fx.timer = 0;
                if (dash || f.state === 'run') this.emitDust(f.position, dash ? 4 : 2, dash ? 2.8 : 1);
                else if (active && this.quality > .5) this.emitDust(f.position, 2, 1.8);
            }
            if (windup && fx.lastState !== 'ultimate') {
                this.tmpA.copy(f.position); this.tmpA.y = .06;
                this.createShockwave(this.tmpA, f.stats.ult.color, 2.6);
            }
            fx.lastState = f.state;
        }
        for (let i = fighters.length; i < this.fighterFX.length; i++) this.fighterFX[i].group.visible = false;
    }

    // ─────────────────────────────────────────────
    //  UPDATE
    // ─────────────────────────────────────────────
    update(dt, camera) {
        this.clock += dt;
        this.flashLight.intensity *= Math.exp(-dt * 19);
        this.flashLight.visible = this.quality > .5;
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
        attrs.aKind.needsUpdate = true;

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
            proj.ownMaterial.uniforms.uTime.value = this.clock;
            proj.halo.scale.setScalar(proj.radius * (4 + Math.sin(this.clock * 28) * .2));
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

        beam.shell.material.uniforms.uTime.value = this.clock;
        beam.shell.material.uniforms.uOpacity.value = .7 * fade;
        beam.ink.material.uniforms.uTime.value = this.clock * .85;
        beam.ink.material.uniforms.uOpacity.value = .16 * fade;
        beam.core.material.opacity = (kind === 'water' || kind === 'vortex' ? .28 : .78) * fade;
        beam.rings.forEach((ring, i) => {
            const travel = (this.clock * (kind === 'vortex' ? 1.4 : .7) + i * .25) % 1;
            ring.position.z = len * travel;
            const radius = r * (.8 + Math.sin(travel * Math.PI) * .65) * fade;
            ring.scale.set(radius, radius, 1);
            ring.rotation.z = this.clock * 4 + i;
            ring.rotation.x = kind === 'water' ? Math.sin(this.clock * 3 + i) * .45 : 0;
            ring.visible = this.quality > .5 && kind !== 'flame';
        });
        beam.rings[0].material.opacity = .45 * fade;
        beam.headGlow.position.z = len;
        beam.headGlow.scale.setScalar(r * (kind === 'vortex' ? 6 : 4) * fade);
        beam.headGlow.material.opacity = .5 * fade;
        if (kind === 'flame') {
            // Cono animado y partículas calientes dentro del volumen de colisión.
            setShape(beam.ink, 1.2);
            setShape(beam.shell, .8);
            setShape(beam.core, .13);
            beam.head.visible = false;
            beam.headGlow.visible = false;
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
                        1.1 + Math.random() * 1.1, 0.42, 0);
                }
            }
        } else {
            const thin = kind === 'bolt' ? 0.5 : 1;
            setShape(beam.ink, (kind === 'vortex' ? .85 : 1.6) * thin);
            setShape(beam.shell, (kind === 'vortex' ? .4 : 1) * thin);
            setShape(beam.core, (kind === 'water' ? .24 : kind === 'vortex' ? .15 : .28) * thin);
            beam.head.position.z = len;
            beam.head.scale.setScalar(r * (kind === 'vortex' ? 1.35 : 1) * thin * pulse * fade);
            beam.head.rotation.z += dt * (kind === 'vortex' ? 13 : 2);
            if (kind === 'vortex') {
                const travel = Math.min(1, (beam.duration - beam.life) / beam.duration);
                const orbZ = len * travel;
                beam.head.position.z = orbZ;
                beam.headGlow.position.z = orbZ;
                beam.rings.forEach((ring, i) => {
                    ring.position.z = Math.max(0, orbZ - .7 + i * .45);
                    ring.scale.setScalar(r * (1 + Math.sin(this.clock * 8 + i) * .12));
                    ring.rotation.y = this.clock * 2 + i;
                });
            }

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
            } else if ((kind === 'water' || kind === 'vortex') && beam.sparkTimer > .04) {
                beam.sparkTimer = 0;
                const d = beam.direction;
                const offset = Math.random() * len;
                const side = (Math.random() - .5) * r * 2;
                this.spawn(beam.startPos.x + d.x * offset - d.z * side,
                    beam.startPos.y + Math.sin(offset * 3 + this.clock * 10) * r * .5,
                    beam.startPos.z + d.z * offset + d.x * side,
                    d.x * 5, .5, d.z * 5, kind === 'water' ? 0xc4fcff : 0x5cbeff, .4, .35, -.5);
            }
        }
        beam.muzzle.scale.setScalar(r * (kind === 'bolt' ? 4 : 6) * pulse * fade);
        beam.muzzle.material.opacity = .8 * fade;
    }
}

window.VFXManager = VFXManager;
