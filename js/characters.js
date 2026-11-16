// Detailed & Authentic 3D Models (Goku, Pikachu, Vegeta, Charizard) with Canvas Textures
class TextureGenerator {
    static createGokuFace() {
        const c = document.createElement('canvas');
        c.width = 512;
        c.height = 512;
        const ctx = c.getContext('2d');

        // Skin base
        ctx.fillStyle = '#ffcca3';
        ctx.fillRect(0, 0, 512, 512);

        // Eyebrows (Black, thick, angled sharply downward in Saiyan combat focus)
        ctx.fillStyle = '#111111';
        // Left eyebrow
        ctx.beginPath();
        ctx.moveTo(110, 180);
        ctx.lineTo(230, 220);
        ctx.lineTo(230, 238);
        ctx.lineTo(120, 205);
        ctx.fill();

        // Right eyebrow
        ctx.beginPath();
        ctx.moveTo(402, 180);
        ctx.lineTo(282, 220);
        ctx.lineTo(282, 238);
        ctx.lineTo(392, 205);
        ctx.fill();

        // Furrow / Brow wrinkle lines
        ctx.strokeStyle = '#442211';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(245, 205);
        ctx.lineTo(245, 235);
        ctx.moveTo(267, 205);
        ctx.lineTo(267, 235);
        ctx.stroke();

        // Eyes (Anime DBZ Outline)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 7;
        ctx.fillStyle = '#ffffff';

        // Left eye contour
        ctx.beginPath();
        ctx.moveTo(125, 215);
        ctx.lineTo(225, 235);
        ctx.lineTo(215, 280);
        ctx.lineTo(135, 265);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Right eye contour
        ctx.beginPath();
        ctx.moveTo(387, 215);
        ctx.lineTo(287, 235);
        ctx.lineTo(297, 280);
        ctx.lineTo(377, 265);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Pupils (Intense black with white anime highlight)
        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath();
        ctx.arc(180, 250, 24, 0, Math.PI * 2);
        ctx.arc(332, 250, 24, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(174, 244, 7, 0, Math.PI * 2);
        ctx.arc(326, 244, 7, 0, Math.PI * 2);
        ctx.fill();

        // Lower eye highlight lines
        ctx.strokeStyle = '#331100';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(145, 282);
        ctx.lineTo(200, 290);
        ctx.moveTo(367, 282);
        ctx.lineTo(312, 290);
        ctx.stroke();

        // Nose (Sharp DBZ triangular anime nose)
        ctx.strokeStyle = '#221105';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(256, 260);
        ctx.lineTo(246, 320);
        ctx.lineTo(266, 325);
        ctx.stroke();

        // Mouth (Determined Saiyan combat smirk / grit)
        ctx.strokeStyle = '#221105';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(195, 385);
        ctx.lineTo(256, 395);
        ctx.lineTo(317, 385);
        ctx.stroke();

        // Lower lip shadow
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(235, 420);
        ctx.lineTo(277, 420);
        ctx.stroke();

        const texture = new THREE.CanvasTexture(c);
        return texture;
    }

    static createGokuKanji() {
        const c = document.createElement('canvas');
        c.width = 256;
        c.height = 256;
        const ctx = c.getContext('2d');

        // White circular patch
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(128, 128, 115, 0, Math.PI * 2);
        ctx.fill();

        // Black outer ring
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 14;
        ctx.stroke();

        // Authentic Kanji "亀" (Kame = Turtle)
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 150px "Hiragino Kaku Gothic Pro", "MS Gothic", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('亀', 128, 138);

        return new THREE.CanvasTexture(c);
    }

    static createPikachuFace() {
        const c = document.createElement('canvas');
        c.width = 512;
        c.height = 512;
        const ctx = c.getContext('2d');

        // Pikachu yellow base
        ctx.fillStyle = '#f8d030';
        ctx.fillRect(0, 0, 512, 512);

        // Red Electric Cheek Discs (Iconic Pikachu Cheeks)
        ctx.fillStyle = '#ee1515';
        ctx.beginPath();
        ctx.arc(75, 330, 68, 0, Math.PI * 2);
        ctx.arc(437, 330, 68, 0, Math.PI * 2);
        ctx.fill();

        // Cheek subtle highlight
        ctx.fillStyle = '#ff6666';
        ctx.beginPath();
        ctx.arc(60, 310, 20, 0, Math.PI * 2);
        ctx.arc(422, 310, 20, 0, Math.PI * 2);
        ctx.fill();

        // Big Shiny Pokémon Eyes
        // Base dark circle
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(145, 230, 52, 0, Math.PI * 2);
        ctx.arc(367, 230, 52, 0, Math.PI * 2);
        ctx.fill();

        // Brown lower eye reflection
        ctx.fillStyle = '#7a3e1d';
        ctx.beginPath();
        ctx.arc(145, 245, 38, 0.2, Math.PI - 0.2);
        ctx.arc(367, 245, 38, 0.2, Math.PI - 0.2);
        ctx.fill();

        // Pure white top-left highlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(130, 210, 22, 0, Math.PI * 2);
        ctx.arc(352, 210, 22, 0, Math.PI * 2);
        ctx.fill();

        // Small secondary highlight
        ctx.beginPath();
        ctx.arc(162, 252, 9, 0, Math.PI * 2);
        ctx.arc(384, 252, 9, 0, Math.PI * 2);
        ctx.fill();

        // Tiny pointed nose
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.moveTo(256, 275);
        ctx.lineTo(250, 288);
        ctx.lineTo(262, 288);
        ctx.closePath();
        ctx.fill();

        // Cute smiling mouth (Open cat-smile with pink tongue)
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.arc(228, 335, 32, 0.2, Math.PI * 0.85);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(284, 335, 32, 0.15, Math.PI * 0.8);
        ctx.stroke();

        // Open mouth interior & tongue
        ctx.fillStyle = '#bb152b';
        ctx.beginPath();
        ctx.ellipse(256, 375, 36, 42, 0, 0, Math.PI);
        ctx.fill();

        ctx.fillStyle = '#ff7799';
        ctx.beginPath();
        ctx.ellipse(256, 385, 26, 22, 0, 0, Math.PI);
        ctx.fill();

        return new THREE.CanvasTexture(c);
    }

    static createVegetaFace() {
        const c = document.createElement('canvas');
        c.width = 512;
        c.height = 512;
        const ctx = c.getContext('2d');

        // Skin
        ctx.fillStyle = '#ffd1a9';
        ctx.fillRect(0, 0, 512, 512);

        // Fierce, sharp downward V-eyebrows (Vegeta's signature intense scowl)
        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath();
        ctx.moveTo(90, 185);
        ctx.lineTo(235, 235);
        ctx.lineTo(235, 255);
        ctx.lineTo(105, 215);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(422, 185);
        ctx.lineTo(277, 235);
        ctx.lineTo(277, 255);
        ctx.lineTo(407, 215);
        ctx.fill();

        // Angry forehead and furrow wrinkles
        ctx.strokeStyle = '#3d1c06';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(246, 210);
        ctx.lineTo(246, 248);
        ctx.moveTo(266, 210);
        ctx.lineTo(266, 248);
        ctx.moveTo(225, 175);
        ctx.lineTo(287, 175);
        ctx.stroke();

        // Eyes
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 8;
        ctx.fillStyle = '#ffffff';

        ctx.beginPath();
        ctx.moveTo(110, 225);
        ctx.lineTo(228, 245);
        ctx.lineTo(215, 290);
        ctx.lineTo(120, 275);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(402, 225);
        ctx.lineTo(284, 245);
        ctx.lineTo(297, 290);
        ctx.lineTo(392, 275);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Pupils
        ctx.fillStyle = '#050505';
        ctx.beginPath();
        ctx.arc(175, 260, 22, 0, Math.PI * 2);
        ctx.arc(337, 260, 22, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(170, 255, 6, 0, Math.PI * 2);
        ctx.arc(332, 255, 6, 0, Math.PI * 2);
        ctx.fill();

        // Nose
        ctx.strokeStyle = '#221105';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(256, 270);
        ctx.lineTo(244, 325);
        ctx.lineTo(268, 330);
        ctx.stroke();

        // Proud sneer / smirk
        ctx.strokeStyle = '#110500';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(185, 400);
        ctx.lineTo(256, 405);
        ctx.lineTo(330, 390);
        ctx.stroke();

        return new THREE.CanvasTexture(c);
    }

    static createCharizardFace() {
        const c = document.createElement('canvas');
        c.width = 512;
        c.height = 512;
        const ctx = c.getContext('2d');

        ctx.fillStyle = '#ee6611';
        ctx.fillRect(0, 0, 512, 512);

        // Fierce Dragon Eyes (Emerald Green with Vertical Slit Pupil)
        ctx.fillStyle = '#000000';
        // Left eye contour
        ctx.beginPath();
        ctx.moveTo(100, 180);
        ctx.lineTo(210, 210);
        ctx.lineTo(200, 250);
        ctx.lineTo(110, 230);
        ctx.closePath();
        ctx.fill();

        // Right eye contour
        ctx.beginPath();
        ctx.moveTo(412, 180);
        ctx.lineTo(302, 210);
        ctx.lineTo(312, 250);
        ctx.lineTo(402, 230);
        ctx.closePath();
        ctx.fill();

        // Emerald Iris
        ctx.fillStyle = '#00dd77';
        ctx.beginPath();
        ctx.ellipse(160, 222, 38, 22, 0.2, 0, Math.PI * 2);
        ctx.ellipse(352, 222, 38, 22, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Vertical Slit Pupil
        ctx.fillStyle = '#050505';
        ctx.beginPath();
        ctx.ellipse(160, 222, 10, 20, 0, 0, Math.PI * 2);
        ctx.ellipse(352, 222, 10, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eye glint
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(150, 212, 6, 0, Math.PI * 2);
        ctx.arc(342, 212, 6, 0, Math.PI * 2);
        ctx.fill();

        // Nostril Slits
        ctx.fillStyle = '#220800';
        ctx.beginPath();
        ctx.ellipse(225, 340, 10, 18, -0.2, 0, Math.PI * 2);
        ctx.ellipse(287, 340, 10, 18, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Mouth Line with White Sharp Fangs
        ctx.strokeStyle = '#220800';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(120, 420);
        ctx.lineTo(256, 435);
        ctx.lineTo(392, 420);
        ctx.stroke();

        // Sharp Fangs protruding
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(160, 422);
        ctx.lineTo(172, 455);
        ctx.lineTo(184, 424);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(328, 424);
        ctx.lineTo(340, 455);
        ctx.lineTo(352, 422);
        ctx.fill();

        return new THREE.CanvasTexture(c);
    }
}

// Stylized 3D Fighter Entity
class Fighter {
    constructor(type, isPlayer = false, scene, vfx, events = {}) {
        this.type = type; // 'goku', 'pikachu', 'vegeta', 'charizard'
        this.stats = FIGHTER_STATS[type];
        this.isPlayer = isPlayer;
        this.scene = scene;
        this.vfx = vfx;
        this.events = events;

        // Combat Stats
        this.maxHealth = this.stats.hp;
        this.health = this.stats.hp;
        this.maxKi = 100;
        this.ki = 30;
        this.ultimateCost = this.stats.ult.cost;
        this.isDead = false;

        // Movement & Physics
        this.position = new THREE.Vector3(isPlayer ? -4.5 : 4.5, 0, 0);
        this.velocity = new THREE.Vector3();
        this.speed = this.stats.speed;
        this.rotationY = isPlayer ? Math.PI / 2 : -Math.PI / 2;
        this.targetRotationY = this.rotationY;

        // States
        this.state = 'idle';
        this.stateTimer = 0;
        this.comboStep = 0;
        this.comboWindow = 0;
        this.invuln = 0;
        this.dashInvuln = 0;
        this.attackCd = 0;
        this.blastCd = 0;
        this.dashCd = 0;
        this.dragonDash = false;
        this.sparking = false;
        this.sparkingCharge = 0;
        this.perfectGuard = 0;
        this.hurtDuration = 0.28;
        this.pendingHit = null;
        this.pendingUlt = null;
        this.ultEnd = 0;
        this.dashDir = new THREE.Vector3();
        this.isCharging = false;
        this.wasMoving = false;

        // Model container
        this.group = new THREE.Group();
        this.group.position.copy(this.position);
        this.group.rotation.y = this.rotationY;
        this.scene.add(this.group);

        this.joints = {};
        // El modelo de respaldo solo se construye si hace falta: dibujar sus caras en
        // canvas lleva tiempo y frenaría el inicio de cada ronda.
        const hasModelReady = window.modelLoader && window.modelLoader.cache[type];
        if (!hasModelReady) this.buildModel();

        this.auraColor = this.stats.aura;

        // 3D GLB Model Asset Integration
        this.hasGLB = false;
        this.glbModel = null;
        this.glbHolder = null;
        this.bodyOffset = { y: 0, z: 0, rx: 0, ry: 0, rz: 0 };
        this.animClock = Math.random() * 10;
        this.animStep = 0;
        this.tryLoadGLB();
    }

    tryLoadGLB() {
        if (!window.modelLoader) return;
        const validModels = ['goku', 'vegeta', 'naruto', 'tanjiro', 'pikachu', 'charizard'];
        if (!validModels.includes(this.type)) return;

        window.modelLoader.loadModel(this.type, `assets/${this.type}.glb?v=${ASSET_VERSION}`, (data) => {
            if (!data || !data.scene || this.isDead) return;
            this.onGLBModelLoaded(data);
        });
    }

    onGLBModelLoaded(data) {
        // Hide procedural fallback model
        if (this.joints && this.joints.root) {
            this.joints.root.visible = false;
        }

        const model = data.scene;

        // Pose base: un fotograma de cada clip queda fijo y el rig anima encima.
        // El mixer no se vuelve a actualizar, lo que ahorra CPU en el celular.
        const base = window.modelLoader.basePose[this.type];
        if (base) {
            const clip = data.animations.find(a => a.name === base.clip);
            if (clip) {
                this.baseMixer = new THREE.AnimationMixer(model);
                this.baseMixer.clipAction(clip).play();
                this.baseMixer.setTime(base.time);
            }
        }

        // Escala y apoyo en el piso a partir de la malla ya deformada por los huesos y
        // en la pose base: el bounding box común mira la geometría cruda y da otra escala.
        const box = window.modelLoader.baseBox(this.type, model);
        const size = box.getSize(new THREE.Vector3());
        const scale = this.stats.height / (size.y || 1);
        model.scale.setScalar(scale);
        model.position.set(
            -(box.min.x + box.max.x) / 2 * scale,
            -box.min.y * scale,
            -(box.min.z + box.max.z) / 2 * scale
        );

        this.glbHolder = new THREE.Group();
        this.glbHolder.add(model);
        this.group.add(this.glbHolder);
        this.hasGLB = true;
        this.glbModel = model;

        // Alinear el frente de la pose base con +Z, dirección que usa el combate.
        if (base && base.yaw) {
            model.rotation.y = base.yaw;
            model.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), base.yaw);
        }
        this.rig = PoseRig.forModel(this.type, this.glbHolder);
        if (['naruto', 'tanjiro', 'vegeta'].includes(this.type)) {
            // Los modelos nuevos vienen en reposo o caminando, no en guardia.
            // Llevar ambos brazos a una pose base antes de aplicar las animaciones.
            const rootRotation = this.glbHolder.getWorldQuaternion(new THREE.Quaternion());
            const inverseRoot = rootRotation.clone().invert();
            for (const [side, sign] of [['L', 1], ['R', -1]]) {
                const upper = this.rig.joints['arm' + side];
                const lower = this.rig.joints['fore' + side];
                if (!upper || !lower) continue;
                this.glbHolder.updateMatrixWorld(true);
                const direction = lower.bone.getWorldPosition(new THREE.Vector3())
                    .sub(upper.bone.getWorldPosition(new THREE.Vector3()))
                    .applyQuaternion(inverseRoot).normalize();
                const target = new THREE.Vector3(sign * 0.25, -0.8, 0.45).normalize();
                const adjustment = new THREE.Quaternion().setFromUnitVectors(direction, target);
                const orientation = inverseRoot.clone().multiply(upper.bone.getWorldQuaternion(new THREE.Quaternion()));
                upper.bone.quaternion.multiply(orientation.clone().invert().multiply(adjustment).multiply(orientation));
            }
            this.rig = PoseRig.forModel(this.type, this.glbHolder);
        }
    }

    mat(color) {
        return new THREE.MeshToonMaterial({ color: color });
    }

    buildModel() {
        if (this.type === 'goku' || this.type === 'naruto' || this.type === 'tanjiro') this.buildGoku();
        else if (this.type === 'pikachu') this.buildPikachu();
        else if (this.type === 'vegeta') this.buildVegeta();
        else if (this.type === 'charizard') this.buildCharizard();
    }

    // =========================================================================
    // 🥋 GOKU DETAILED 3D MODEL
    // =========================================================================
    buildGoku() {
        const skinMat = this.mat(0xffcca3);
        const giOrange = this.mat(0xff5500);
        const navyBlue = this.mat(0x0c2552);
        const darkHair = this.mat(0x151515);
        const bootsBlue = this.mat(0x0e1b38);
        const redLaces = this.mat(0xcc1111);
        const ropeTan = this.mat(0xc29b68);

        const root = new THREE.Group();
        this.group.add(root);
        this.joints.root = root;

        // 1. Torso & Muscular Gi
        const torsoGroup = new THREE.Group();
        torsoGroup.position.y = 1.35;
        root.add(torsoGroup);
        this.joints.torso = torsoGroup;

        // Orange Gi Vest with chest V-taper
        const giChest = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.44, 0.95, 8), giOrange);
        giChest.castShadow = true;
        torsoGroup.add(giChest);

        // Navy Blue Undershirt (Visible at V-neck and armholes)
        const undershirt = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 0.54), navyBlue);
        undershirt.position.set(0, 0.26, 0);
        torsoGroup.add(undershirt);

        // Kame Kanji Badge on Left Chest
        const kanjiTex = TextureGenerator.createGokuKanji();
        const chestKanjiMat = new THREE.MeshBasicMaterial({ map: kanjiTex, transparent: true });
        const chestKanji = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), chestKanjiMat);
        chestKanji.position.set(0.22, 0.22, 0.28);
        chestKanji.rotation.y = 0.2;
        torsoGroup.add(chestKanji);

        // Large Kame Kanji Emblem on Back
        const backKanji = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.44), chestKanjiMat);
        backKanji.position.set(0, 0.15, -0.28);
        backKanji.rotation.y = Math.PI;
        torsoGroup.add(backKanji);

        // Blue Belt Obi Sash with 3D knot and hanging ribbons
        const sash = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.18, 12), navyBlue);
        sash.position.y = -0.42;
        torsoGroup.add(sash);

        const sashKnot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), navyBlue);
        sashKnot.position.set(-0.25, -0.42, 0.38);
        torsoGroup.add(sashKnot);

        const ribbon1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 0.04), navyBlue);
        ribbon1.position.set(-0.28, -0.58, 0.36);
        ribbon1.rotation.z = 0.2;
        torsoGroup.add(ribbon1);

        // 2. Head with HD Face Texture
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.75, 0);
        torsoGroup.add(headGroup);
        this.joints.head = headGroup;

        // Head mesh
        const headMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.52, 10), skinMat);
        headGroup.add(headMesh);

        // HD Anime Face Plane
        const faceTex = TextureGenerator.createGokuFace();
        const faceMat = new THREE.MeshBasicMaterial({ map: faceTex, transparent: true });
        const facePlane = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.48), faceMat);
        facePlane.position.set(0, 0, 0.27);
        headGroup.add(facePlane);

        // 3. Goku's Signature Spiky Hairstyle (7 Iconic Curved Spikes + Front Bangs)
        const hairGroup = new THREE.Group();
        headGroup.add(hairGroup);

        const createSpike = (radTop, radBot, len, px, py, pz, rx, ry, rz) => {
            const geom = new THREE.ConeGeometry(radBot, len, 5);
            const mesh = new THREE.Mesh(geom, darkHair);
            mesh.position.set(px, py, pz);
            mesh.rotation.set(rx, ry, rz);
            hairGroup.add(mesh);
            return mesh;
        };

        // Main 5 lateral Goku spikes
        createSpike(0, 0.28, 0.85, -0.45, 0.35, -0.1, 0, 0, 0.85); // Left bottom spike
        createSpike(0, 0.28, 0.95, -0.52, 0.65, -0.05, 0, 0, 0.55); // Left mid spike
        createSpike(0, 0.32, 1.05, -0.28, 0.95, 0, 0, 0, 0.22); // Left top spike
        createSpike(0, 0.32, 1.05, 0.18, 0.98, -0.05, 0, 0, -0.18); // Center crown spike
        createSpike(0, 0.28, 0.85, 0.48, 0.55, -0.05, 0, 0, -0.75); // Right lateral spike
        createSpike(0, 0.3, 0.9, 0, 0.65, -0.4, -0.6, 0, 0); // Back crest spike

        // Front bangs hanging over forehead
        createSpike(0, 0.14, 0.42, -0.16, 0.26, 0.28, 0.4, 0, 0.3); // Left bang
        createSpike(0, 0.14, 0.48, 0.02, 0.28, 0.29, 0.45, 0, 0.05); // Center bang
        createSpike(0, 0.12, 0.38, 0.18, 0.24, 0.26, 0.35, 0, -0.25); // Right bang

        // 4. Muscular Arms with Navy Wristbands
        this.joints.leftArm = this.buildHumanLimb(torsoGroup, -0.58, 0.35, skinMat, navyBlue, true);
        this.joints.rightArm = this.buildHumanLimb(torsoGroup, 0.58, 0.35, skinMat, navyBlue, true);

        // 5. Baggy Martial Arts Pants & Boots with Red Trim
        this.joints.leftLeg = this.buildGokuLeg(root, -0.26, giOrange, bootsBlue, redLaces, ropeTan);
        this.joints.rightLeg = this.buildGokuLeg(root, 0.26, giOrange, bootsBlue, redLaces, ropeTan);
    }

    buildHumanLimb(parent, x, y, skinMat, wristMat, isArm = true) {
        const shoulder = new THREE.Group();
        shoulder.position.set(x, y, 0);
        parent.add(shoulder);

        // Bicep / Thigh
        const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.45, 8), skinMat);
        upper.position.y = -0.22;
        shoulder.add(upper);

        // Forearm / Calf
        const elbow = new THREE.Group();
        elbow.position.set(0, -0.42, 0);
        shoulder.add(elbow);

        const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.4, 8), skinMat);
        lower.position.y = -0.2;
        elbow.add(lower);

        // Wristband
        const wristband = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.18, 8), wristMat);
        wristband.position.y = -0.32;
        elbow.add(wristband);

        // Fist
        const fist = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), skinMat);
        fist.position.y = -0.44;
        elbow.add(fist);

        return { shoulder, elbow };
    }

    buildGokuLeg(parent, x, pantsMat, bootsMat, redMat, tanMat) {
        const hip = new THREE.Group();
        hip.position.set(x, 0.85, 0);
        parent.add(hip);

        // Baggy orange thigh
        const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.5, 8), pantsMat);
        thigh.position.y = -0.25;
        hip.add(thigh);

        const knee = new THREE.Group();
        knee.position.set(0, -0.48, 0);
        hip.add(knee);

        // Baggy calf tucked into boot
        const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.19, 0.38, 8), pantsMat);
        calf.position.y = -0.15;
        knee.add(calf);

        // High Combat Boot
        const boot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.45, 8), bootsMat);
        boot.position.set(0, -0.35, 0.05);
        knee.add(boot);

        // Red trim collar
        const redCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 8), redMat);
        redCollar.position.set(0, -0.14, 0.05);
        knee.add(redCollar);

        // Tan boot ropes / sole
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.15, 0.48), bootsMat);
        foot.position.set(0, -0.55, 0.12);
        knee.add(foot);

        const sole = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.04, 0.5), tanMat);
        sole.position.set(0, -0.62, 0.12);
        knee.add(sole);

        return { hip, knee };
    }

    // =========================================================================
    // ⚡ PIKACHU DETAILED 3D MODEL
    // =========================================================================
    buildPikachu() {
        const yellowMat = this.mat(0xf8d030);
        const brownMat = this.mat(0x7a3e1d);
        const blackMat = this.mat(0x111111);

        const root = new THREE.Group();
        this.group.add(root);
        this.joints.root = root;

        // 1. Chubby Pear-Shaped Body
        const bodyGroup = new THREE.Group();
        bodyGroup.position.y = 0.65;
        root.add(bodyGroup);
        this.joints.torso = bodyGroup;

        // Lower chubby abdomen
        const lowerBody = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 16), yellowMat);
        lowerBody.position.y = -0.1;
        lowerBody.scale.set(1.05, 1, 1);
        lowerBody.castShadow = true;
        bodyGroup.add(lowerBody);

        // Upper chest connecting to head
        const upperBody = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.54, 0.55, 16), yellowMat);
        upperBody.position.y = 0.18;
        bodyGroup.add(upperBody);

        // Pikachu's 2 Iconic Brown Stripes on Back
        const stripe1 = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.09, 0.35), brownMat);
        stripe1.position.set(0, 0.18, -0.36);
        bodyGroup.add(stripe1);

        const stripe2 = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.09, 0.35), brownMat);
        stripe2.position.set(0, -0.06, -0.4);
        bodyGroup.add(stripe2);

        // 2. Rounded Head with HD Kawaii Face Texture
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.55, 0.05);
        bodyGroup.add(headGroup);
        this.joints.head = headGroup;

        const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.52, 16, 16), yellowMat);
        headMesh.scale.set(1.08, 1, 1.05);
        headGroup.add(headMesh);

        // HD Face Decal
        const pikaTex = TextureGenerator.createPikachuFace();
        const pikaFaceMat = new THREE.MeshBasicMaterial({ map: pikaTex, transparent: true });
        const facePlane = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), pikaFaceMat);
        facePlane.position.set(0, 0, 0.51);
        headGroup.add(facePlane);

        // 3. Long Pointed Ears with Black Tips
        this.joints.leftEar = this.buildPikachuEar(headGroup, -0.34, 0.45, 0.42, yellowMat, blackMat);
        this.joints.rightEar = this.buildPikachuEar(headGroup, 0.34, 0.45, -0.42, yellowMat, blackMat);

        // 4. Cute Front Paws
        this.joints.leftArm = this.buildPikachuPaw(bodyGroup, -0.42, 0.12, yellowMat);
        this.joints.rightArm = this.buildPikachuPaw(bodyGroup, 0.42, 0.12, yellowMat);

        // 5. Hind Feet
        this.joints.leftLeg = this.buildPikachuFoot(root, -0.32, yellowMat);
        this.joints.rightLeg = this.buildPikachuFoot(root, 0.32, yellowMat);

        // 6. Authentic Zigzag Lightning Bolt Tail (3 Steps + Brown Base)
        this.joints.tail = this.buildPikachuTail(bodyGroup, yellowMat, brownMat);
    }

    buildPikachuEar(parent, x, y, rotZ, yellowMat, blackMat) {
        const earGroup = new THREE.Group();
        earGroup.position.set(x, y, -0.05);
        earGroup.rotation.z = rotZ;
        earGroup.rotation.x = -0.15;
        parent.add(earGroup);

        // Yellow base cone
        const yellowBase = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.55, 10), yellowMat);
        yellowBase.position.y = 0.26;
        earGroup.add(yellowBase);

        // Diagonal black tip
        const blackTip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.28, 10), blackMat);
        blackTip.position.y = 0.56;
        earGroup.add(blackTip);

        return earGroup;
    }

    buildPikachuPaw(parent, x, y, mat) {
        const arm = new THREE.Group();
        arm.position.set(x, y, 0.22);
        arm.rotation.x = 0.5;
        parent.add(arm);

        const paw = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.35, 8), mat);
        paw.position.set(0, -0.14, 0.1);
        arm.add(paw);

        return { shoulder: arm, elbow: arm };
    }

    buildPikachuFoot(parent, x, mat) {
        const leg = new THREE.Group();
        leg.position.set(x, 0.12, 0.1);
        parent.add(leg);

        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.52), mat);
        foot.position.set(0, -0.02, 0.1);
        leg.add(foot);

        return { hip: leg, knee: leg };
    }

    buildPikachuTail(parent, yellowMat, brownMat) {
        const tailRoot = new THREE.Group();
        tailRoot.position.set(0, -0.18, -0.48);
        parent.add(tailRoot);

        // Segment 1: Brown Base
        const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.32, 0.05), brownMat);
        s1.position.set(0, 0.16, -0.08);
        s1.rotation.z = 0.25;
        tailRoot.add(s1);

        // Segment 2: Yellow Zigzag Turn
        const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.35, 0.05), yellowMat);
        s2.position.set(-0.12, 0.42, -0.12);
        s2.rotation.z = -0.55;
        tailRoot.add(s2);

        // Segment 3: Large Lightning Blade Tip
        const s3 = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.55, 0.05), yellowMat);
        s3.position.set(0.08, 0.78, -0.16);
        s3.rotation.z = 0.4;
        tailRoot.add(s3);

        return tailRoot;
    }

    // =========================================================================
    // 👑 VEGETA DETAILED 3D MODEL
    // =========================================================================
    buildVegeta() {
        this.rig = window.buildVegetaModel(this);
    }

    // =========================================================================
    buildCharizard() {
        const orangeMat = this.mat(0xee6611);
        const bellyCream = this.mat(0xffe6a3);
        const tealWingMat = this.mat(0x1a7f80);
        const hornMat = this.mat(0xee6611);
        const clawWhite = this.mat(0xffffff);

        const root = new THREE.Group();
        this.group.add(root);
        this.joints.root = root;

        // 1. Dragon Torso & Cream Belly
        const torsoGroup = new THREE.Group();
        torsoGroup.position.y = 1.3;
        root.add(torsoGroup);
        this.joints.torso = torsoGroup;

        const torsoMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.68, 1.25, 12), orangeMat);
        torsoMesh.castShadow = true;
        torsoGroup.add(torsoMesh);

        // Segmented Cream Dragon Belly
        const belly = new THREE.Mesh(new THREE.SphereGeometry(0.58, 12, 12), bellyCream);
        belly.position.set(0, -0.08, 0.24);
        belly.scale.set(0.85, 1.15, 0.55);
        torsoGroup.add(belly);

        // 2. Dragon Head with Snout, Fangs, Horns
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.85, 0.25);
        torsoGroup.add(headGroup);
        this.joints.head = headGroup;

        // Elongated skull
        const skull = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.48, 0.65), orangeMat);
        skull.position.z = 0.1;
        headGroup.add(skull);

        // Snout
        const snout = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.45), orangeMat);
        snout.position.set(0, -0.08, 0.55);
        headGroup.add(snout);

        // HD Dragon Face Decal (Emerald Eyes & Nostrils)
        const charzTex = TextureGenerator.createCharizardFace();
        const charzFaceMat = new THREE.MeshBasicMaterial({ map: charzTex, transparent: true });
        const facePlane = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), charzFaceMat);
        facePlane.position.set(0, 0.05, 0.78);
        headGroup.add(facePlane);

        // Backwards Curved Dragon Horns
        [-0.18, 0.18].forEach(x => {
            const horn = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.55, 8), hornMat);
            horn.position.set(x, 0.35, -0.15);
            horn.rotation.x = -0.65;
            headGroup.add(horn);
        });

        // 3. Majestic Dragon Wings (Teal Interior & Orange Exterior)
        this.joints.leftWing = this.buildCharizardWing(torsoGroup, -0.42, orangeMat, tealWingMat, false);
        this.joints.rightWing = this.buildCharizardWing(torsoGroup, 0.42, orangeMat, tealWingMat, true);

        // 4. Clawed Arms
        this.joints.leftArm = this.buildCharizardArm(torsoGroup, -0.58, orangeMat, clawWhite);
        this.joints.rightArm = this.buildCharizardArm(torsoGroup, 0.58, orangeMat, clawWhite);

        // 5. Powerful Dragon Hind Legs with White Talons
        this.joints.leftLeg = this.buildCharizardLeg(root, -0.34, orangeMat, clawWhite);
        this.joints.rightLeg = this.buildCharizardLeg(root, 0.34, orangeMat, clawWhite);

        // 6. Long Tail with Dynamic Multi-Layer Flame
        const tailGroup = new THREE.Group();
        tailGroup.position.set(0, -0.45, -0.45);
        torsoGroup.add(tailGroup);
        this.joints.tail = tailGroup;

        // Curved Tail segments
        const tailBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, 0.9, 8), orangeMat);
        tailBase.position.set(0, 0.1, -0.38);
        tailBase.rotation.x = Math.PI / 3;
        tailGroup.add(tailBase);

        const tailTip = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.18, 0.8, 8), orangeMat);
        tailTip.position.set(0, 0.48, -0.85);
        tailTip.rotation.x = Math.PI / 4;
        tailGroup.add(tailTip);

        // Multi-Layer Animated Roaring Flame!
        const flameGroup = new THREE.Group();
        flameGroup.position.set(0, 0.85, -1.15);
        tailGroup.add(flameGroup);
        this.flameGroup = flameGroup;

        // Core bright yellow flame
        const coreFlame = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
        flameGroup.add(coreFlame);

        // Outer pulsing crimson flame
        const outerFlame = new THREE.Mesh(new THREE.TetrahedronGeometry(0.32, 1), new THREE.MeshBasicMaterial({ color: 0xff3300, transparent: true, opacity: 0.85 }));
        flameGroup.add(outerFlame);
        this.outerFlameMesh = outerFlame;
    }

    buildCharizardWing(parent, x, orangeMat, tealMat, isRight = false) {
        const wingGroup = new THREE.Group();
        wingGroup.position.set(x, 0.35, -0.32);
        wingGroup.rotation.y = isRight ? -0.45 : 0.45;
        parent.add(wingGroup);

        // Bone Strut
        const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.4, 6), orangeMat);
        strut.position.set(isRight ? 0.6 : -0.6, 0.45, 0);
        strut.rotation.z = isRight ? -0.8 : 0.8;
        wingGroup.add(strut);

        // Teal Membrane Sheet
        const membraneGeom = new THREE.PlaneGeometry(1.2, 0.9);
        const membrane = new THREE.Mesh(membraneGeom, tealMat);
        membrane.position.set(isRight ? 0.65 : -0.65, 0.35, 0);
        membrane.rotation.y = isRight ? 0 : Math.PI;
        wingGroup.add(membrane);

        return wingGroup;
    }

    buildCharizardArm(parent, x, skinMat, clawMat) {
        const shoulder = new THREE.Group();
        shoulder.position.set(x, 0.3, 0);
        parent.add(shoulder);

        const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.45, 8), skinMat);
        upper.position.y = -0.22;
        shoulder.add(upper);

        const elbow = new THREE.Group();
        elbow.position.set(0, -0.4, 0);
        shoulder.add(elbow);

        const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.4, 8), skinMat);
        lower.position.y = -0.18;
        elbow.add(lower);

        // Claws
        [-0.08, 0, 0.08].forEach(cx => {
            const claw = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 4), clawMat);
            claw.position.set(cx, -0.38, 0.08);
            claw.rotation.x = Math.PI / 3;
            elbow.add(claw);
        });

        return { shoulder, elbow };
    }

    buildCharizardLeg(parent, x, skinMat, clawMat) {
        const hip = new THREE.Group();
        hip.position.set(x, 0.8, 0);
        parent.add(hip);

        const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.52, 8), skinMat);
        thigh.position.y = -0.26;
        hip.add(thigh);

        const knee = new THREE.Group();
        knee.position.set(0, -0.5, 0);
        hip.add(knee);

        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.55), skinMat);
        foot.position.set(0, -0.1, 0.12);
        knee.add(foot);

        // 3 White Talons on foot
        [-0.1, 0, 0.1].forEach(cx => {
            const talon = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.2, 4), clawMat);
            talon.position.set(cx, -0.1, 0.42);
            talon.rotation.x = Math.PI / 2;
            knee.add(talon);
        });

        return { hip, knee };
    }

    // =========================================================================
    // ACTIONS & ANIMATIONS
    // =========================================================================
    // ─────────────────────────────────────────────
    //  ESTADOS
    // ─────────────────────────────────────────────
    setAnimation(state) {
        if (this.isDead && state !== 'ko') return;
        if (this.state === 'ko') return;
        if (this.state === state) return;

        if (this.state === 'charge') { this.setChargingSound(false); this.sparkingCharge = 0; }

        this.state = state;
        this.stateTimer = 0;
    }

    setChargingSound(on) {
        if (this.isCharging === on) return;
        this.isCharging = on;
        if (on) window.soundManager.startKiCharge(this);
        else window.soundManager.stopKiCharge(this);
    }

    canAct() {
        return !this.isDead && !['ko', 'hurt', 'ultimate', 'dash'].includes(this.state);
    }

    // ─────────────────────────────────────────────
    //  ACCIONES (las usan el jugador y la CPU por igual)
    // ─────────────────────────────────────────────
    move(mx, mz, dt) {
        const len = Math.hypot(mx, mz);
        const moving = len > 0.06;
        const mult = { idle: 1, run: 1, attack: 0.3, blast: 0.5, guard: 0.3 }[this.state] || 0;

        if (moving && mult > 0) {
            const k = Math.min(len, 1) / len;
            this.position.x += mx * k * this.speed * mult * dt;
            this.position.z += mz * k * this.speed * mult * dt;
        }
        if (moving && this.state === 'idle') this.setAnimation('run');
        else if (!moving && this.state === 'run') this.setAnimation('idle');
    }

    attack(target) {
        if (!this.canAct() || this.attackCd > 0) return false;
        this.setAnimation('attack');
        this.stateTimer = 0;

        if (this.comboWindow <= 0) this.comboStep = 0;
        const step = this.comboStep;
        this.comboStep = (step + 1) % 3;
        this.animStep = step;
        this.comboWindow = 0.7;
        this.attackCd = (step === 2 ? 0.55 : 0.3) / this.stats.attackRate * (this.sparking ? 0.75 : 1);
        this.pendingHit = { t: 0.1, step, target };

        // Pequeño avance hacia el rival para que el golpe se sienta con peso
        const dx = target.position.x - this.position.x;
        const dz = target.position.z - this.position.z;
        const d = Math.hypot(dx, dz) || 1;
        if (d > this.stats.reach * 0.55) {
            this.velocity.x += (dx / d) * 5;
            this.velocity.z += (dz / d) * 5;
        }
        return true;
    }

    // Golpe de impacto: guardia + golpe, con más preparación y empuje.
    smash(target) {
        if (!target || !this.canAct() || this.attackCd > 0 || this.ki < 15) return false;
        this.ki -= 15;
        this.setAnimation('attack');
        this.stateTimer = 0;
        this.animStep = 2;
        this.comboStep = 0;
        this.comboWindow = 0;
        this.attackCd = 0.85 / this.stats.attackRate;
        this.pendingHit = { t: 0.2, step: 2, target, smash: true };
        const dir = this.aimAt(target);
        this.velocity.addScaledVector(dir, 3);
        return true;
    }

    // Contraataque durante el aturdimiento, disponible también para ambos jugadores online.
    revenge(target) {
        if (this.isDead || this.state !== 'hurt' || !target || target.isDead || this.ki < 30 ||
            target.dashInvuln > 0 || target.invuln > 0 || this.position.distanceTo(target.position) > 3.2) return false;
        this.ki -= 30;
        this.setAnimation('idle');
        this.invuln = 0.25;
        const dealt = target.receiveHit({ amount: 8 * this.stats.power, attacker: this, kind: 'melee' });
        if (dealt > 0 && this.events.onHit) this.events.onHit(this, target, dealt, { heavy: false, kind: 'melee' });
        if (this.events.onRevenge) this.events.onRevenge(this);
        this.vfx.createHitSparks(target.position.clone().add(new THREE.Vector3(0, target.stats.muzzleY, 0)), this.auraColor, 18);
        this.vfx.shake(.25);
        window.soundManager.playPunch(true);
        return true;
    }

    resolveHit({ step, target, smash = false }) {
        const dist = this.position.distanceTo(target.position);
        window.soundManager.playPunch(step === 2);
        if (dist > this.stats.reach || target.isDead) return;

        const heavy = step === 2;
        const damage = (smash ? 16 : [5, 6, 10][step]) * this.stats.power * (this.sparking ? 1.15 : 1);
        const dealt = target.receiveHit({ amount: damage, attacker: this, heavy, kind: 'melee', smash });
        if (dealt <= 0) return;

        const spark = target.position.clone();
        spark.y += target.stats.muzzleY;
        this.vfx.createHitSparks(spark, this.auraColor, heavy ? 22 : 12);
        this.vfx.shake(heavy ? 0.4 : 0.15);
        this.ki = Math.min(this.maxKi, this.ki + 7);
        if (this.events.onHit) this.events.onHit(this, target, dealt, { heavy, kind: 'melee' });
    }

    shootBlast(target) {
        const b = this.stats.blast;
        if (!this.canAct() || this.blastCd > 0 || this.ki < b.cost) return false;

        this.ki -= b.cost;
        this.blastCd = b.cooldown;
        this.setAnimation('blast');
        this.stateTimer = 0;
        window.soundManager.playBlast();

        const dir = this.aimAt(target);
        const spawnPos = this.position.clone().addScaledVector(dir, 0.8);
        spawnPos.y = this.stats.muzzleY;
        this.vfx.spawnProjectile(this, spawnPos, dir, {
            color: this.auraColor, damage: b.damage, speed: b.speed, size: b.size,
        });
        return true;
    }

    chargeKi(charging) {
        if (charging) {
            if (!this.canAct() || this.sparking) {
                if (this.state === 'charge') this.setAnimation('idle');
                return;
            }
            if (this.state !== 'charge') {
                this.setAnimation('charge');
                this.setChargingSound(true);
            }
        } else if (this.state === 'charge') {
            this.sparkingCharge = 0;
            this.setAnimation('idle');
        }
    }

    guard(on) {
        if (on) {
            if (this.canAct() && this.state !== 'guard' && this.state !== 'attack') {
                this.setAnimation('guard');
                this.perfectGuard = 0.18;
            }
        } else if (this.state === 'guard') {
            this.setAnimation('idle');
        }
    }

    // Guardia + esquiva: aparece detrás del rival si hay espacio en la arena.
    vanish(opponent) {
        if (!opponent || !this.canAct() || this.dashCd > 0 || this.ki < 25) return false;
        const forward = new THREE.Vector3(Math.sin(opponent.rotationY), 0, Math.cos(opponent.rotationY));
        const point = opponent.position.clone().addScaledVector(forward, -1.5);
        if (Math.abs(point.x) > 10.8 || Math.abs(point.z) > 5.8) return false;
        this.position.copy(point);
        this.group.position.copy(point);
        this.rotationY = this.targetRotationY = Math.atan2(forward.x, forward.z);
        this.group.rotation.y = this.rotationY;
        this.velocity.set(0, 0, 0);
        this.dashDir.set(0, 0, 0);
        this.dragonDash = false;
        this.ki -= 25;
        this.dashCd = this.stats.dashCooldown;
        this.dashInvuln = 0.15;
        this.setAnimation('dash');
        window.soundManager.playDash();
        this.vfx.emitAura(this.position, this.auraColor, 6);
        if (this.events.onVanish) this.events.onVanish(this);
        return true;
    }

    // Carga + esquiva: carrera hacia el rival con gasto fijo de ki.
    rush(opponent) {
        if (!opponent || !this.canAct() || this.dashCd > 0 || this.ki < 15) return false;
        const dx = opponent.position.x - this.position.x;
        const dz = opponent.position.z - this.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 2 || !this.dash(dx, dz, opponent)) return false;
        this.ki -= 15;
        this.dragonDash = true;
        this.dashInvuln = 0.1;
        return true;
    }

    dash(mx, mz, opponent) {
        if (!this.canAct() || this.dashCd > 0) return false;
        let len = Math.hypot(mx, mz);
        if (len < 0.1 && opponent) {
            // Sin dirección: salto hacia atrás
            mx = this.position.x - opponent.position.x;
            mz = this.position.z - opponent.position.z;
            len = Math.hypot(mx, mz);
        }
        if (len < 0.001) { mx = this.isPlayer ? -1 : 1; mz = 0; len = 1; }

        this.dragonDash = false;
        this.dashDir.set(mx / len, 0, mz / len);
        this.dashCd = this.stats.dashCooldown;
        this.dashInvuln = 0.2;
        this.setAnimation('dash');
        window.soundManager.playDash();
        this.vfx.emitAura(this.position, this.auraColor, 4);
        return true;
    }

    triggerUltimate(target) {
        const u = this.stats.ult;
        if (!this.canAct() || this.ki < u.cost) return false;

        this.ki -= u.cost;
        this.setAnimation('ultimate');
        this.pendingHit = null;
        // La dirección queda fija al empezar: por eso se puede esquivar de costado.
        this.pendingUlt = { t: u.windup, dir: this.aimAt(target) };
        this.ultEnd = u.windup + u.duration + 0.15;
        this.targetRotationY = Math.atan2(this.pendingUlt.dir.x, this.pendingUlt.dir.z);
        window.soundManager.playUltimateBeam();
        if (this.events.onUltimate) this.events.onUltimate(this);
        return true;
    }

    aimAt(target) {
        const dir = new THREE.Vector3(
            target.position.x - this.position.x, 0, target.position.z - this.position.z
        );
        if (dir.lengthSq() < 0.0001) dir.set(this.isPlayer ? 1 : -1, 0, 0);
        return dir.normalize();
    }

    // ─────────────────────────────────────────────
    //  RECIBIR DAÑO
    // ─────────────────────────────────────────────
    // Devuelve el daño aplicado (0 si esquivó). `continuous` son los rayos, que
    // pegan por tick y no generan aturdimiento ni invulnerabilidad.
    receiveHit({ amount, attacker, heavy = false, kind = 'melee', continuous = false, smash = false }) {
        if (this.isDead || this.dashInvuln > 0) return 0;
        if (this.invuln > 0 && !continuous) return 0;

        const pushDir = this.position.clone().sub(attacker.position);
        pushDir.y = 0;
        if (pushDir.lengthSq() < 0.0001) pushDir.set(this.isPlayer ? -1 : 1, 0, 0);
        pushDir.normalize();

        const front = Math.sin(this.rotationY) * -pushDir.x + Math.cos(this.rotationY) * -pushDir.z;
        if (this.state === 'guard' && front > 0) {
            // Un bloqueo recién activado desvía un golpe frontal y abre al rival.
            if (!continuous && kind === 'melee' && this.perfectGuard > 0 && front > 0.25) {
                this.perfectGuard = 0;
                this.ki = Math.min(this.maxKi, this.ki + 5);
                attacker.pendingHit = null;
                if (attacker.canAct()) {
                    attacker.setAnimation('hurt');
                    attacker.hurtDuration = 0.35;
                    attacker.velocity.addScaledVector(pushDir, -8);
                }
                if (this.events.onBlock) this.events.onBlock(this, true);
                return 0;
            }
            const guardBroken = heavy && kind === 'melee';
            if (!guardBroken) {
                const dealt = amount * (continuous ? 0.35 : 0.25);
                this.health = Math.max(0, this.health - dealt);
                this.ki = Math.min(this.maxKi, this.ki + (continuous ? 0.2 : 3));
                if (!continuous) this.velocity.addScaledVector(pushDir, 4);
                if (this.events.onBlock && !continuous) this.events.onBlock(this);
                if (this.health <= 0) this.die();
                return dealt;
            }
            // El golpe final del combo rompe la guardia
            this.setAnimation('idle');
        }

        this.health = Math.max(0, this.health - amount);
        this.ki = Math.min(this.maxKi, this.ki + amount * 0.3);

        if (!continuous && this.state !== 'ultimate') {
            this.pendingHit = null;
            this.setAnimation('hurt');
            this.stateTimer = 0;
            this.hurtDuration = heavy ? 0.5 : 0.26;
            this.velocity.addScaledVector(pushDir, smash ? 21 : heavy ? 15 : 4);
            // Tras el golpe final hay un respiro para que no existan combos infinitos
            this.invuln = heavy ? 0.7 : 0;
        } else if (continuous) {
            this.velocity.addScaledVector(pushDir, 0.35);
        }

        if (this.health <= 0) this.die();
        return amount;
    }

    die() {
        this.isDead = true;
        this.invuln = 0;
        this.group.visible = true;
        this.pendingHit = null;
        this.pendingUlt = null;
        this.setChargingSound(false);
        this.setAnimation('ko');
        window.soundManager.playExplosion();
        if (this.events.onKO) this.events.onKO(this);
    }

    dispose() {
        this.setChargingSound(false);
        this.scene.remove(this.group);
    }

    // ─────────────────────────────────────────────
    //  UPDATE
    // ─────────────────────────────────────────────
    update(dt, opponent) {
        this.stateTimer += dt;
        this.attackCd = Math.max(0, this.attackCd - dt);
        this.blastCd = Math.max(0, this.blastCd - dt);
        this.dashCd = Math.max(0, this.dashCd - dt);
        this.comboWindow = Math.max(0, this.comboWindow - dt);
        this.dashInvuln = Math.max(0, this.dashInvuln - dt);
        this.perfectGuard = Math.max(0, this.perfectGuard - dt);
        if (!this.isDead) {
            if (this.sparking) {
                this.ki = Math.max(0, this.ki - 10 * dt);
                if (this.ki <= 0) this.sparking = false;
                else if (Math.random() < 0.35) this.vfx.emitAura(this.position, this.auraColor, 1);
            } else if (this.state !== 'charge') this.ki = Math.min(this.maxKi, this.ki + 2 * dt);
        }

        // Golpe en su cuadro activo
        if (this.pendingHit) {
            this.pendingHit.t -= dt;
            if (this.pendingHit.t <= 0) {
                const hit = this.pendingHit;
                this.pendingHit = null;
                this.resolveHit(hit);
            }
        }

        // Disparo del definitivo tras la carga
        if (this.pendingUlt) {
            this.pendingUlt.t -= dt;
            if (this.state === 'ultimate') this.vfx.emitAura(this.position, this.stats.ult.color, 2);
            if (this.pendingUlt.t <= 0) {
                const u = this.stats.ult;
                const dir = this.pendingUlt.dir;
                const start = this.position.clone().addScaledVector(dir, 0.8);
                start.y = this.stats.muzzleY;
                this.pendingUlt = null;
                this.vfx.spawnBeam(this, start, dir, {
                    color: u.color, damage: u.damage, length: u.length, duration: u.duration, radius: u.radius, kind: u.kind,
                });
                window.soundManager.playExplosion();
            }
        }

        // Mirar al rival en todo el plano, no solo izquierda o derecha
        if (opponent && !this.isDead && this.state !== 'ultimate' && this.state !== 'dash') {
            const dx = opponent.position.x - this.position.x;
            const dz = opponent.position.z - this.position.z;
            if (Math.hypot(dx, dz) > 0.3) this.targetRotationY = Math.atan2(dx, dz);
        }
        let delta = this.targetRotationY - this.rotationY;
        delta = Math.atan2(Math.sin(delta), Math.cos(delta));
        this.rotationY += delta * Math.min(1, dt * 14);
        this.group.rotation.y = this.rotationY;

        // Parpadeo durante el respiro posterior a un golpe fuerte
        if (this.invuln > 0) {
            this.invuln -= dt;
            this.group.visible = this.invuln <= 0 || Math.floor(this.invuln * 25) % 2 === 0;
        }

        // Dash e inercia
        if (this.state === 'dash') {
            if (this.dragonDash && opponent) {
                const dx = opponent.position.x - this.position.x, dz = opponent.position.z - this.position.z;
                const distance = Math.hypot(dx, dz);
                if (distance < 1.6) { this.dragonDash = false; this.setAnimation('idle'); }
                else this.dashDir.set(dx / distance, 0, dz / distance);
            }
            if (this.state === 'dash') this.position.addScaledVector(this.dashDir, this.speed * (this.dragonDash ? 3.7 : 3) * dt);
            if (Math.random() < 0.5) this.vfx.emitAura(this.position, this.auraColor, 1);
        }
        this.position.addScaledVector(this.velocity, dt);
        this.velocity.multiplyScalar(Math.pow(0.0015, dt));

        // No atravesar al rival
        if (opponent && !opponent.isDead && !this.isDead) {
            const dx = this.position.x - opponent.position.x;
            const dz = this.position.z - opponent.position.z;
            const d = Math.hypot(dx, dz);
            const minD = 1.0;
            if (d < minD && d > 0.0001) {
                this.position.x += (dx / d) * (minD - d) * 0.5;
                this.position.z += (dz / d) * (minD - d) * 0.5;
            }
        }

        this.position.x = THREE.MathUtils.clamp(this.position.x, -11, 11);
        this.position.z = THREE.MathUtils.clamp(this.position.z, -6, 6);
        this.group.position.copy(this.position);

        if (this.state === 'charge') {
            this.ki = Math.min(this.maxKi, this.ki + this.stats.kiCharge * dt);
            if (this.ki >= this.maxKi) {
                this.sparkingCharge += dt;
                if (this.sparkingCharge >= 1) {
                    this.sparking = true;
                    this.sparkingCharge = 0;
                    this.setAnimation('idle');
                    if (this.events.onSparking) this.events.onSparking(this);
                }
            } else this.sparkingCharge = 0;
            this.vfx.emitAura(this.position, this.auraColor, 2);
            if (this.type === 'pikachu' && Math.random() < 0.35) {
                const sparkP = this.position.clone().add(new THREE.Vector3((Math.random()-0.5)*1.5, 0.8, (Math.random()-0.5)*1.5));
                this.vfx.emitLightning(this.position.clone().add(new THREE.Vector3(0, 0.5, 0)), sparkP, 0x00f2ff);
            }
        }

        // Animated Charizard Tail Flame
        if (this.outerFlameMesh) {
            const pulse = 1 + Math.sin(this.stateTimer * 20) * 0.25;
            this.outerFlameMesh.scale.set(pulse, pulse * 1.3, pulse);
            this.outerFlameMesh.rotation.y += dt * 8;
        }

        const t = this.stateTimer;
        if (this.state === 'attack' && t > 0.26) this.setAnimation('idle');
        else if (this.state === 'blast' && t > 0.3) this.setAnimation('idle');
        else if (this.state === 'ultimate' && t > this.ultEnd) this.setAnimation('idle');
        else if (this.state === 'hurt' && t > this.hurtDuration) this.setAnimation('idle');
        else if (this.state === 'dash' && t > (this.dragonDash ? 0.55 : 0.22)) { this.dragonDash = false; this.setAnimation('idle'); }

        this.updatePose(dt);
    }

    // Online, en el invitado: estado recibido del anfitrión
    setNetTarget(data, stateNames) {
        const [x, z, rot, stateIdx, timer, step, hp, ki, invuln, sparking] = data;
        this.sparking = !!sparking;
        this.netTarget = { x, z, rot };
        this.health = hp;
        this.ki = ki;
        this.animStep = step;
        this.netInvuln = invuln;
        const state = stateNames[stateIdx] || 'idle';
        if (state !== this.state) {
            if (this.state === 'charge') this.setChargingSound(false);
            if (state === 'charge') this.setChargingSound(true);
            this.state = state;
            this.stateTimer = timer;
        }
        this.isDead = state === 'ko';
    }

    netTick(dt) {
        this.stateTimer += dt;
        const n = this.netTarget;
        if (n) {
            const k = 1 - Math.exp(-16 * dt);
            if (Math.hypot(n.x - this.position.x, n.z - this.position.z) > 4) this.position.set(n.x, 0, n.z);
            this.position.x += (n.x - this.position.x) * k;
            this.position.z += (n.z - this.position.z) * k;
            let delta = n.rot - this.rotationY;
            delta = Math.atan2(Math.sin(delta), Math.cos(delta));
            this.rotationY += delta * k;
        }
        this.group.position.copy(this.position);
        this.group.rotation.y = this.rotationY;
        this.group.visible = !this.netInvuln || Math.floor(this.animClock * 25) % 2 === 0;
        if (this.state === 'charge' || this.sparking) this.vfx.emitAura(this.position, this.auraColor, 2);
        if (this.state === 'ultimate' && this.stateTimer < this.stats.ult.windup) {
            this.vfx.emitAura(this.position, this.stats.ult.color, 2);
        }
        if (this.state === 'dash') this.vfx.emitAura(this.position, this.auraColor, 1);
        this.updatePose(dt);
    }

    updatePose(dt) {
        this.animClock += dt;
        if (!this.rig) { this.applyProceduralAnimation(dt); return; }

        const { pose, body } = POSE_FN[this.type](this, this.stateTimer, this.animClock);
        const blend = 1 - Math.exp(-(POSE_RATE[this.state] || 10) * dt);
        this.rig.apply(pose, blend);

        // El giro completo del coletazo no se suaviza: tiene que dar la vuelta entera
        const b = this.bodyOffset;
        b.y += (body.y - b.y) * blend;
        b.z += (body.z - b.z) * blend;
        b.rx += (body.rx - b.rx) * blend;
        b.ry = body.ry;
        b.rz += (body.rz - b.rz) * blend;
        const holder = this.glbHolder || this.joints.root;
        holder.position.y = b.y;
        holder.position.z = b.z;
        holder.rotation.set(b.rx, b.ry, b.rz);
    }

    applyProceduralAnimation(dt) {
        const t = this.stateTimer;
        const j = this.joints;

        if (j.leftArm && j.leftArm.shoulder) {
            j.leftArm.shoulder.rotation.set(0, 0, 0);
            j.rightArm.shoulder.rotation.set(0, 0, 0);
        }
        if (j.leftLeg && j.leftLeg.hip) {
            j.leftLeg.hip.rotation.set(0, 0, 0);
            j.rightLeg.hip.rotation.set(0, 0, 0);
        }

        switch (this.state) {
            case 'idle': {
                const bob = Math.sin(t * 8) * 0.08;
                j.root.position.y = bob;
                if (j.head) j.head.rotation.x = Math.sin(t * 8) * 0.05;
                if (j.leftArm && j.leftArm.shoulder) {
                    j.leftArm.shoulder.rotation.x = 0.5 + Math.sin(t * 8) * 0.1;
                    j.rightArm.shoulder.rotation.x = 0.4 - Math.sin(t * 8) * 0.1;
                }
                if (j.tail) {
                    j.tail.rotation.y = Math.sin(t * 10) * 0.4;
                }
                if (j.leftWing) {
                    j.leftWing.rotation.y = 0.45 + Math.sin(t * 6) * 0.15;
                    j.rightWing.rotation.y = -0.45 - Math.sin(t * 6) * 0.15;
                }
                break;
            }
            case 'run': {
                const runCycle = Math.sin(t * 16);
                j.root.position.y = Math.abs(runCycle) * 0.15;
                if (j.leftLeg && j.leftLeg.hip) {
                    j.leftLeg.hip.rotation.x = runCycle * 0.9;
                    j.rightLeg.hip.rotation.x = -runCycle * 0.9;
                }
                if (j.leftArm && j.leftArm.shoulder) {
                    j.leftArm.shoulder.rotation.x = -runCycle * 0.8;
                    j.rightArm.shoulder.rotation.x = runCycle * 0.8;
                }
                if (j.leftWing) {
                    j.leftWing.rotation.y = 0.45 + Math.sin(t * 16) * 0.3;
                    j.rightWing.rotation.y = -0.45 - Math.sin(t * 16) * 0.3;
                }
                break;
            }
            case 'attack': {
                if (j.rightArm && j.rightArm.shoulder) {
                    j.rightArm.shoulder.rotation.x = -Math.PI / 2;
                    j.rightArm.shoulder.rotation.y = -0.3;
                }
                if (j.leftArm && j.leftArm.shoulder) {
                    j.leftArm.shoulder.rotation.x = 0.3;
                }
                if (j.tail) {
                    j.tail.rotation.z = Math.PI;
                }
                break;
            }
            case 'charge': {
                j.root.position.y = -0.15 + (Math.random() - 0.5) * 0.04;
                if (j.leftArm && j.leftArm.shoulder) {
                    j.leftArm.shoulder.rotation.set(0.4, 0, -0.4);
                    j.rightArm.shoulder.rotation.set(0.4, 0, 0.4);
                }
                break;
            }
            case 'ultimate': {
                if (t < 0.5) {
                    if (j.leftArm && j.leftArm.shoulder) {
                        j.leftArm.shoulder.rotation.set(1.2, -0.6, 0);
                        j.rightArm.shoulder.rotation.set(1.2, 0.6, 0);
                    }
                    this.vfx.emitAura(this.position, this.auraColor, 5);
                } else {
                    if (j.leftArm && j.leftArm.shoulder) {
                        j.leftArm.shoulder.rotation.set(-Math.PI / 2, 0.2, 0);
                        j.rightArm.shoulder.rotation.set(-Math.PI / 2, -0.2, 0);
                    }
                }
                break;
            }
            case 'hurt': {
                j.root.position.y = 0.1;
                if (j.torso) j.torso.rotation.x = -0.4;
                if (j.head) j.head.rotation.x = -0.5;
                break;
            }
            case 'ko': {
                j.root.position.y = 0.2;
                j.root.rotation.x = -Math.PI / 2;
                break;
            }
        }
    }
}

window.Fighter = Fighter;
