// Modelo de Vegeta armado por código: es el único luchador sin archivo .glb.
// Se construye con volúmenes suaves y queda en la misma pose base de guardia que Goku,
// así comparte las poses del rig humano.

const VEGETA_OUTLINE = 0.018;

function toonMaterial(color, map) {
    return new THREE.MeshToonMaterial({ color: window.inkColor(color), map: map || null, gradientMap: window.toonRamp() });
}

// Cilindro con radio distinto en cada extremo, redondeado por esferas en las puntas.
function limbMesh(parent, length, r1, r2, material) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, length, 10), material);
    body.position.y = -length / 2;
    group.add(body);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(r2, 10, 8), material);
    tip.position.y = -length;
    group.add(tip);
    parent.add(group);
    return group;
}

function buildVegetaModel(fighter) {
    const skin = toonMaterial(0xf2c49b);
    const suit = toonMaterial(0x1d3f9c);
    const armor = toonMaterial(0xf4f1e6);
    const gold = toonMaterial(0xd9a93a);
    const glove = toonMaterial(0xf8f8f4);
    const hairMat = toonMaterial(0x17151f);

    const root = new THREE.Group();
    fighter.group.add(root);
    fighter.joints.root = root;

    const hips = new THREE.Group();
    hips.position.y = 0.98;
    root.add(hips);

    // Cadera
    const pelvis = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), suit);
    pelvis.scale.set(1.05, 0.72, 0.8);
    hips.add(pelvis);

    // Torso: abdomen y pecho con armadura
    const spine = new THREE.Group();
    spine.position.y = 0.08;
    hips.add(spine);
    const waist = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.26, 12), suit);
    waist.position.y = 0.12;
    spine.add(waist);

    const chest = new THREE.Group();
    chest.position.y = 0.26;
    spine.add(chest);
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.2, 0.36, 12), armor);
    plate.position.y = 0.14;
    plate.scale.z = 0.72;
    chest.add(plate);
    const belly = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.19, 0.11, 12), gold);
    belly.position.y = -0.08;
    belly.scale.z = 0.76;
    chest.add(belly);
    [-1, 1].forEach(side => {
        const guard = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), gold);
        guard.scale.set(1.15, 0.55, 1);
        guard.position.set(side * 0.3, 0.31, 0);
        chest.add(guard);
    });

    // Cuello y cabeza
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.085, 0.1, 8), suit);
    neck.position.y = 0.37;
    chest.add(neck);
    const head = new THREE.Group();
    head.position.y = 0.42;
    chest.add(head);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 12), skin);
    skull.position.y = 0.12;
    skull.scale.set(0.92, 1.08, 0.95);
    head.add(skull);

    // Cara: un plano dibujado apoyado sobre la cabeza
    const faceTex = TextureGenerator.createVegetaFace();
    const face = new THREE.Mesh(
        new THREE.PlaneGeometry(0.27, 0.27),
        new THREE.MeshBasicMaterial({ map: faceTex, transparent: true })
    );
    face.position.set(0, 0.11, 0.158);
    head.add(face);

    // Pelo en punta, alto y hacia atrás, con entrada en la frente
    const spikes = [
        [0, 0.52, -0.05, 0.11, 0.34, -0.12, 0],
        [-0.08, 0.46, -0.06, 0.09, 0.28, -0.16, 0.22],
        [0.08, 0.46, -0.06, 0.09, 0.28, -0.16, -0.22],
        [-0.14, 0.38, -0.04, 0.08, 0.24, -0.1, 0.42],
        [0.14, 0.38, -0.04, 0.08, 0.24, -0.1, -0.42],
        [0, 0.4, -0.11, 0.1, 0.3, -0.34, 0],
        [-0.07, 0.34, -0.13, 0.08, 0.24, -0.4, 0.18],
        [0.07, 0.34, -0.13, 0.08, 0.24, -0.4, -0.18],
    ];
    spikes.forEach(([x, y, z, r, h, rx, rz]) => {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), hairMat);
        spike.position.set(x, y, z);
        spike.rotation.set(rx, 0, rz);
        head.add(spike);
    });
    const hairBase = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8), hairMat);
    hairBase.position.set(0, 0.22, -0.025);
    hairBase.scale.set(0.95, 0.72, 0.95);
    head.add(hairBase);
    const peak = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.13, 5), hairMat);
    peak.position.set(0, 0.235, 0.135);
    peak.rotation.x = Math.PI;
    head.add(peak);

    // Brazos
    const makeArm = (side) => {
        const shoulder = new THREE.Group();
        shoulder.position.set(side * 0.34, 0.25, 0);
        chest.add(shoulder);
        const upper = limbMesh(shoulder, 0.3, 0.075, 0.062, suit);
        const fore = new THREE.Group();
        fore.position.y = -0.3;
        upper.add(fore);
        limbMesh(fore, 0.27, 0.06, 0.052, glove);
        const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.064, 0.045, 10), gold);
        cuff.position.y = -0.04;
        fore.add(cuff);
        const hand = new THREE.Mesh(new THREE.SphereGeometry(0.072, 10, 8), glove);
        hand.position.y = -0.3;
        fore.add(hand);
        return { upper, fore };
    };
    const armL = makeArm(1);
    const armR = makeArm(-1);

    // Piernas
    const makeLeg = (side) => {
        const hip = new THREE.Group();
        hip.position.set(side * 0.12, -0.04, 0);
        hips.add(hip);
        const thigh = limbMesh(hip, 0.46, 0.105, 0.078, suit);
        const shin = new THREE.Group();
        shin.position.y = -0.46;
        thigh.add(shin);
        limbMesh(shin, 0.25, 0.076, 0.07, suit);
        // Bota blanca con puntera dorada
        const boot = new THREE.Mesh(new THREE.CylinderGeometry(0.094, 0.1, 0.21, 10), glove);
        boot.position.y = -0.31;
        shin.add(boot);
        const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.098, 0.04, 10), gold);
        collar.position.y = -0.21;
        shin.add(collar);
        const foot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), glove);
        foot.scale.set(0.95, 0.55, 1.65);
        foot.position.set(0, -0.44, 0.06);
        shin.add(foot);
        const toe = new THREE.Mesh(new THREE.SphereGeometry(0.058, 8, 6), gold);
        toe.scale.set(1.25, 0.7, 1.1);
        toe.position.set(0, -0.44, 0.19);
        shin.add(toe);
        return { thigh, shin };
    };
    const legL = makeLeg(1);
    const legR = makeLeg(-1);

    // Contorno negro de cada volumen (la cara no lo lleva)
    const outlineMat = window.makeOutlineMaterial(VEGETA_OUTLINE, false, false);
    const hulls = [];
    root.traverse(o => { if (o.isMesh && o !== face) hulls.push(o); });
    hulls.forEach(m => {
        const hull = new THREE.Mesh(m.geometry, outlineMat);
        m.add(hull);
        m.castShadow = true;
    });

    // Pose base: en guardia, como el clip de Goku.
    armL.upper.rotation.set(-0.5, 0, 0.3);
    armL.fore.rotation.set(-1.5, 0, 0);
    armR.upper.rotation.set(-0.5, 0, -0.3);
    armR.fore.rotation.set(-1.5, 0, 0);
    legL.thigh.rotation.set(-0.35, 0, 0.2);
    legL.shin.rotation.set(0.55, 0, 0);
    legR.thigh.rotation.set(-0.1, 0, -0.2);
    legR.shin.rotation.set(0.4, 0, 0);
    spine.rotation.x = 0.06;
    hips.position.y = 0.92;

    return new PoseRig(root, {
        spine, chest, head,
        armL: armL.upper, foreL: armL.fore,
        armR: armR.upper, foreR: armR.fore,
        legL: legL.thigh, shinL: legL.shin,
        legR: legR.thigh, shinR: legR.shin,
    });
}

window.buildVegetaModel = buildVegetaModel;
