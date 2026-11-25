// Rig de poses: anima por huesos a todo el roster con el mismo sistema.
//
// Cada modelo trae huesos con ejes locales distintos, así que las poses se escriben
// en los ejes del personaje (mira a +Z, +Y arriba, +X su izquierda) y se traducen a
// cada hueso con su orientación en la pose base. Una pose es { articulación: [x, y, z] }
// en radianes, sumada sobre esa pose base.
//   rotación X negativa en un brazo: lo lleva hacia adelante
//   rotación X positiva en el torso: lo inclina hacia adelante

const BONE_MAPS = {
    goku: {
        spine: 'spine_', chest: 'chest_', neck: 'neck_', head: 'head_',
        armL: 'upper_armL', foreL: 'lower_armL', armR: 'upper_armR', foreR: 'lower_armR',
        handL: 'handL_', handR: 'handR_',
        legL: 'upper_legL', shinL: 'lower_legL', legR: 'upper_legR', shinR: 'lower_legR',
        footL: 'footL_', footR: 'footR_',
    },
    naruto: {
        spine: 'Spine02_', chest: 'Spine01_', neck: 'neck_', head: 'Head_',
        armL: 'LeftArm_', foreL: 'LeftForeArm_', armR: 'RightArm_', foreR: 'RightForeArm_',
        handL: 'LeftHand_', handR: 'RightHand_',
        legL: 'LeftUpLeg_', shinL: 'LeftLeg_', legR: 'RightUpLeg_', shinR: 'RightLeg_',
        footL: 'LeftFoot_', footR: 'RightFoot_',
    },
    vegeta: {
        spine: 'mixamorigSpine_', chest: 'mixamorigSpine2_', neck: 'mixamorigNeck_', head: 'mixamorigHead_',
        armL: 'mixamorigLeftArm_', foreL: 'mixamorigLeftForeArm_', armR: 'mixamorigRightArm_', foreR: 'mixamorigRightForeArm_',
        handL: 'mixamorigLeftHand_', handR: 'mixamorigRightHand_',
        legL: 'mixamorigLeftUpLeg_', shinL: 'mixamorigLeftLeg_', legR: 'mixamorigRightUpLeg_', shinR: 'mixamorigRightLeg_',
        footL: 'mixamorigLeftFoot_', footR: 'mixamorigRightFoot_',
    },
    tanjiro: {
        spine: 'C_Spine_1', chest: 'C_Spine_3', neck: 'C_Neck_1', head: 'C_Head_1',
        armL: 'L_UpperArm_1', foreL: 'L_Forearm_1', armR: 'R_UpperArm_1', foreR: 'R_Forearm_1',
        handL: 'L_Hand_1', handR: 'R_Hand_1',
        legL: 'L_Thigh_1', shinL: 'L_Knee_1', legR: 'R_Thigh_1', shinR: 'R_Knee_1',
        footL: 'L_Foot_1', footR: 'R_Foot_1',
    },
    luffy: {
        spine: 'mixamorigSpine_', chest: 'mixamorigSpine2_', neck: 'mixamorigNeck_', head: 'mixamorigHead_',
        armL: 'mixamorigLeftArm_', foreL: 'mixamorigLeftForeArm_', armR: 'mixamorigRightArm_', foreR: 'mixamorigRightForeArm_',
        legL: 'mixamorigLeftUpLeg_', shinL: 'mixamorigLeftLeg_', legR: 'mixamorigRightUpLeg_', shinR: 'mixamorigRightLeg_',
        handL: 'mixamorigLeftHand_', handR: 'mixamorigRightHand_',
        footL: 'mixamorigLeftFoot_', footR: 'mixamorigRightFoot_',
        indexL: 'mixamorigLeftHandIndex1_', middleL: 'mixamorigLeftHandMiddle1_',
        ringL: 'mixamorigLeftHandRing1_', pinkyL: 'mixamorigLeftHandPinky1_',
        indexR: 'mixamorigRightHandIndex1_', middleR: 'mixamorigRightHandMiddle1_',
        ringR: 'mixamorigRightHandRing1_', pinkyR: 'mixamorigRightHandPinky1_',
    },
    gojo: {
        // GLTFLoader elimina los puntos del metarig (upper_arm.L -> upper_armL).
        spine: 'spine001_', chest: 'spine003_', neck: 'spine005_', head: 'spine006_',
        armL: 'upper_armL_', foreL: 'forearmL_', armR: 'upper_armR_', foreR: 'forearmR_',
        legL: 'thighL_', shinL: 'shinL_', legR: 'thighR_', shinR: 'shinR_',
        handL: 'handL_', handR: 'handR_',
        footL: 'footL_', footR: 'footR_',
        indexL: 'f_index01L_', middleL: 'f_middle01L_', ringL: 'f_ring01L_', pinkyL: 'f_pinky01L_',
        indexR: 'f_index01R_', middleR: 'f_middle01R_', ringR: 'f_ring01R_', pinkyR: 'f_pinky01R_',
    },
    pikachu: {
        spine: 'Spine1_', chest: 'Spine2_', head: 'Head_',
        armL: 'LArm_', foreL: 'LForeArm_', armR: 'RArm_', foreR: 'RForeArm_',
        legL: 'LThigh_', shinL: 'LLeg_', legR: 'RThigh_', shinR: 'RLeg_',
        tail1: 'Tail1_', tail2: 'Tail2_', tail3: 'Tail3_',
        earL: 'LEar1_', earR: 'REar1_',
    },
    charizard: {
        spine: 'Spine1_', chest: 'Spine2_', neck: 'Neck1_', neck2: 'Neck2_', head: 'Head_', jaw: 'Jaw_',
        armL: 'LArm_', foreL: 'LForeArm_', armR: 'RArm_', foreR: 'RForeArm_',
        legL: 'LThigh_', shinL: 'LLeg_', legR: 'RThigh_', shinR: 'RLeg_',
        tail1: 'Tail1_', tail2: 'Tail2_', tail3: 'Tail3_', tail4: 'Tail4_',
        wingL: 'LFeeler1_', wingL2: 'LFeeler2_', wingR: 'RFeeler1_', wingR2: 'RFeeler2_',
    },
};

// Respaldo conservador para modelos nuevos: nombres completos conocidos, nunca
// coincidencias parciales que podrían confundir brazos con controles o huesos twist.
const HUMANOID_ALIASES = {
    spine: ['spine', 'spine1', 'spine01', 'spine001', 'cspine1', '上半身'],
    chest: ['spine2', 'spine02', 'spine002', 'chest', 'upperchest', 'cspine3', '上半身2'],
    neck: ['neck', 'neck1', 'neck01', 'cneck1', '首'],
    head: ['head', 'head1', 'chead1', '頭'],
    armL: ['leftarm', 'leftupperarm', 'upperarml', 'upperarml1', 'lupperarm', 'lupperarm1', 'arml', 'larm', '左腕'],
    foreL: ['leftforearm', 'leftlowerarm', 'lowerarml', 'lowerarml1', 'forearml', 'lforearm', 'lforearm1', '左ひじ'],
    armR: ['rightarm', 'rightupperarm', 'upperarmr', 'upperarmr1', 'rupperarm', 'rupperarm1', 'armr', 'rarm', '右腕'],
    foreR: ['rightforearm', 'rightlowerarm', 'lowerarmr', 'lowerarmr1', 'forearmr', 'rforearm', 'rforearm1', '右ひじ'],
    legL: ['leftupleg', 'leftthigh', 'leftupperleg', 'upperlegl', 'thighl', 'lthigh', 'lthigh1', '左足'],
    shinL: ['leftleg', 'leftshin', 'leftcalf', 'leftlowerleg', 'lowerlegl', 'calfl', 'shinl', 'lleg', 'lknee1', '左ひざ'],
    legR: ['rightupleg', 'rightthigh', 'rightupperleg', 'upperlegr', 'thighr', 'rthigh', 'rthigh1', '右足'],
    shinR: ['rightleg', 'rightshin', 'rightcalf', 'rightlowerleg', 'lowerlegr', 'calfr', 'shinr', 'rleg', 'rknee1', '右ひざ'],
    footL: ['leftfoot', 'leftankle', 'footl', 'lfoot', 'lfoot1', '左足首'],
    footR: ['rightfoot', 'rightankle', 'footr', 'rfoot', 'rfoot1', '右足首'],
    handL: ['lefthand', 'handl', 'lhand', 'lhand1', '左手首'],
    handR: ['righthand', 'handr', 'rhand', 'rhand1', '右手首'],
    indexL: ['lefthandindex1', 'leftindex1', 'index01l', 'index1l', 'indexl1', '左人指1', '左人差指1'],
    middleL: ['lefthandmiddle1', 'leftmiddle1', 'middle01l', 'middle1l', 'middlel1', '左中指1'],
    ringL: ['lefthandring1', 'leftring1', 'ring01l', 'ring1l', 'ringl1', '左薬指1'],
    pinkyL: ['lefthandpinky1', 'leftpinky1', 'pinky01l', 'pinky1l', 'pinkyl1', '左小指1'],
    indexR: ['righthandindex1', 'rightindex1', 'index01r', 'index1r', 'indexr1', '右人指1', '右人差指1'],
    middleR: ['righthandmiddle1', 'rightmiddle1', 'middle01r', 'middle1r', 'middler1', '右中指1'],
    ringR: ['righthandring1', 'rightring1', 'ring01r', 'ring1r', 'ringr1', '右薬指1'],
    pinkyR: ['righthandpinky1', 'rightpinky1', 'pinky01r', 'pinky1r', 'pinkyr1', '右小指1'],
};

function humanoidBoneName(name) {
    // Namespaces de FBX y prefijos deform de Blender no identifican la articulación.
    return name.split(':').pop().toLowerCase().replace(/^(?:mixamorig|armature[|_]|def[-_])/, '').replace(/[\s_.|\-]/g, '');
}

const _q = new THREE.Quaternion();
const _qw = new THREE.Quaternion();
const _e = new THREE.Euler();
const _shoulder = new THREE.Vector3();
const _elbow = new THREE.Vector3();
const _wrist = new THREE.Vector3();
const _wristGoal = new THREE.Vector3();
const _aimAxis = new THREE.Vector3();
const _elbowPole = new THREE.Vector3();
const _elbowGoal = new THREE.Vector3();
const _armFrom = new THREE.Vector3();
const _armTo = new THREE.Vector3();
const _armRoot = new THREE.Quaternion();
const _armInv = new THREE.Quaternion();

function pointBone(bone, current, goal) {
    _q.setFromUnitVectors(current.normalize(), goal.normalize());
    bone.getWorldQuaternion(_qw);
    _q.premultiply(_armInv.copy(_qw).invert()).multiply(_qw);
    bone.quaternion.multiply(_q);
}

class PoseRig {
    constructor(root, bones) {
        this.root = root;
        this.joints = {};
        root.updateMatrixWorld(true);
        const rootInv = root.getWorldQuaternion(new THREE.Quaternion()).invert();
        for (const name in bones) {
            const bone = bones[name];
            if (!bone) continue;
            const world = rootInv.clone().multiply(bone.getWorldQuaternion(new THREE.Quaternion()));
            this.joints[name] = {
                bone,
                base: bone.quaternion.clone(),
                world,
                worldInv: world.clone().invert(),
                cur: [0, 0, 0],
            };
        }
        this.arms = [];
        for (const side of ['L', 'R']) {
            const arm = bones['arm' + side], fore = bones['fore' + side], hand = bones['hand' + side];
            if (!arm || !fore || !hand) continue;
            arm.getWorldPosition(_shoulder); fore.getWorldPosition(_elbow); hand.getWorldPosition(_wrist);
            const upperLength = _shoulder.distanceTo(_elbow), lowerLength = _elbow.distanceTo(_wrist);
            if (Math.min(upperLength, lowerLength) < 1e-4) continue;
            this.arms.push({
                arm, fore, hand, upperLength, lowerLength,
                key: 'reach' + side, sign: side === 'L' ? 1 : -1,
                target: new THREE.Vector3(), weight: 0, elbowHeight: 0,
            });
        }
    }

    static forModel(type, model) {
        const map = BONE_MAPS[type];
        const all = [];
        model.traverse(o => { if (o.isBone) all.push(o); });
        const bones = {};
        if (map) {
            for (const key in map) bones[key] = all.find(b => b.name.startsWith(map[key])) || null;
        } else {
            const names = new Map();
            all.forEach(bone => {
                const key = humanoidBoneName(bone.name);
                const matches = names.get(key) || [];
                matches.push(bone);
                names.set(key, matches);
            });
            const used = new Set();
            for (const key in HUMANOID_ALIASES) {
                bones[key] = null;
                for (const alias of HUMANOID_ALIASES[key]) {
                    const matches = names.get(alias);
                    if (matches && matches.length === 1 && !used.has(matches[0])) {
                        bones[key] = matches[0];
                        used.add(matches[0]);
                        break;
                    }
                }
            }
        }
        return new PoseRig(model, bones);
    }

    // Acerca cada articulación a la pose pedida y lo aplica al esqueleto.
    apply(pose, blend) {
        for (const name in this.joints) {
            const j = this.joints[name];
            const target = pose[name];
            const c = j.cur;
            c[0] += ((target ? target[0] : 0) - c[0]) * blend;
            c[1] += ((target ? target[1] : 0) - c[1]) * blend;
            c[2] += ((target ? target[2] : 0) - c[2]) * blend;

            _e.set(c[0], c[1], c[2]);
            _q.setFromEuler(_e);
            // base * (W^-1 * offset * W): el giro en ejes del personaje, llevado al hueso
            _qw.copy(j.worldInv).multiply(_q).multiply(j.world);
            j.bone.quaternion.copy(j.base).multiply(_qw);
        }
        for (const chain of this.arms) {
            const target = pose[chain.key];
            if (target) {
                _wristGoal.set(target[0], target[1], target[2]);
                if (chain.weight < .01) chain.target.copy(_wristGoal);
                // El objetivo ya tiene su curva de ataque. Filtrarlo con menos
                // retardo que el torso mantiene la mano cerca del cuadro de impacto.
                else chain.target.lerp(_wristGoal, 1 - (1 - blend) ** 2);
                chain.elbowHeight += ((target[4] || 0) - chain.elbowHeight) * blend;
            }
            chain.weight += ((target ? target[3] : 0) - chain.weight) * blend;
            if (chain.weight > .005) this.placeWrist(chain);
        }
    }

    // El objetivo de la mano está en ejes del luchador y se mide en longitudes del brazo.
    // Resolver ambos segmentos conserva la extensión y la posición del codo en cada GLB.
    placeWrist(chain) {
        const { arm, fore, hand, upperLength, lowerLength } = chain;
        const reach = upperLength + lowerLength;
        this.root.getWorldQuaternion(_armRoot);
        arm.getWorldPosition(_shoulder); fore.getWorldPosition(_elbow); hand.getWorldPosition(_wrist);
        _wristGoal.copy(chain.target).multiplyScalar(reach).applyQuaternion(_armRoot)
            .add(_shoulder).lerp(_wrist, 1 - chain.weight);
        _aimAxis.subVectors(_wristGoal, _shoulder);
        const distance = _aimAxis.length();
        if (distance < reach * .001) return;
        _aimAxis.divideScalar(distance);
        const length = THREE.MathUtils.clamp(distance, Math.abs(upperLength - lowerLength) + reach * .002, reach * .998);
        const along = (upperLength ** 2 + length ** 2 - lowerLength ** 2) / (2 * length);
        const bend = Math.sqrt(Math.max(0, upperLength ** 2 - along ** 2));
        _elbowPole.set(chain.sign, chain.elbowHeight - .65, -.32).applyQuaternion(_armRoot);
        _elbowPole.addScaledVector(_aimAxis, -_elbowPole.dot(_aimAxis));
        if (_elbowPole.lengthSq() < 1e-5) {
            _elbowPole.set(0, 1, 0).applyQuaternion(_armRoot);
            _elbowPole.addScaledVector(_aimAxis, -_elbowPole.dot(_aimAxis));
        }
        _elbowPole.normalize();
        _elbowGoal.copy(_shoulder).addScaledVector(_aimAxis, along).addScaledVector(_elbowPole, bend);
        _wristGoal.copy(_shoulder).addScaledVector(_aimAxis, length);
        pointBone(arm, _armFrom.subVectors(_elbow, _shoulder), _armTo.subVectors(_elbowGoal, _shoulder));
        hand.getWorldPosition(_wrist); fore.getWorldPosition(_elbow);
        pointBone(fore, _armFrom.subVectors(_wrist, _elbow), _armTo.subVectors(_wristGoal, _elbow));
    }
}

// ─────────────────────────────────────────────
//  POSES
// ─────────────────────────────────────────────
// Cada función devuelve la pose y el desplazamiento del cuerpo entero.
// t: segundos en el estado actual. c: reloj continuo para respiración y ciclos.
const sin = Math.sin;
const PI = Math.PI;

function bodyOffset() {
    return { y: 0, z: 0, rx: 0, ry: 0, rz: 0 };
}

// Anticipación, golpe y recuperación usan el reloj de simulación, incluso en cámara lenta.
// El impacto se conserva en el instante en que la lógica resuelve el golpe.
function poseEase(x) {
    x = Math.max(0, Math.min(1, x));
    return x * x * (3 - 2 * x);
}

function strikePhase(f, t) {
    const smash = f.animSmash ?? (f.pendingHit?.smash || (f.attackCd || 0) + t > 0.65);
    const impact = smash ? 0.2 : 0.1;
    const windEnd = impact - 0.035;
    const extension = poseEase((t - windEnd) / 0.035);
    const recover = poseEase((t - impact - 0.025) / Math.max(0.035, 0.26 - impact - 0.025));
    return { wind: 1 - extension, hit: extension * (1 - recover * 0.82), recover, smash };
}

function humanStrike(p, h, f, t) {
    const step = f.animStep || 0;
    const phase = strikePhase(f, t);
    const { hit, recover, smash } = phase;
    const wind = phase.wind * poseEase(t / (smash ? .09 : .027));
    const side = step === 1 ? -1 : 1;
    const heavy = step === 2;
    const isVegeta = f.type === 'vegeta';
    const isNaruto = f.type === 'naruto';

    p.legL = [side * (.15 + hit * .16), 0, .12];
    p.legR = [-side * (.21 + hit * .16), 0, -.13];
    p.shinL = [.21 + wind * .17, 0, 0];
    p.shinR = [.23 + wind * .1, 0, 0];
    p.spine = [.06 + hit * .17 - wind * .09, side * (hit * .15 - wind * .12), side * .035];
    p.chest = [.03, side * (hit * .42 - wind * .38), side * (wind * .12 - hit * .12)];
    p.head = [-.1, -side * (hit * .25 - wind * .2), 0];
    h.y = -.04 - wind * .075 + hit * .06;
    h.z = hit * (heavy ? .18 : .12) - wind * .065;

    if (f.type === 'tanjiro') {
        // Tajo ascendente, corte inverso y caída de las dos manos para cerrar.
        const height = heavy ? (smash ? .96 : .62) * wind - (smash ? .52 : .29) * hit :
            side * (.34 * wind - .33 * hit);
        const sweep = side * (-.46 * wind + .27 * hit + .19 * recover);
        const depth = .46 + hit * .33 - wind * .12;
        p.reachL = [sweep - .27, .13 + height, depth, 1, .45 + height * .4];
        p.reachR = [sweep + .21, .2 + height, depth + .07, 1, .45 + height * .4];
        p.handL = [-.13 * hit, .2 - sweep * .42, 0];
        p.handR = [.15 * hit, -.2 - sweep * .42, 0];
        p.chest[1] *= 1.2;
        return;
    }

    p.reachL = [-.2, .14, .41, 1, .08];
    p.reachR = [.2, .17, .4, 1, .08];
    if (smash) {
        // El impacto cargado pasa de un brazo recogido a un golpe ascendente.
        p.reachR = [.08 - wind * .45 + hit * .14, -.17 - wind * .25 + hit * .45,
            .39 - wind * .35 + hit * .48, 1, .25 + hit * .32];
        p.handR = [hit * .13, 0, -wind * .3];
        p.chest[0] = .13 * wind - .14 * hit;
        h.y += hit * .09;
    } else if (heavy && isVegeta) {
        // Vegeta planta los dos pies y empuja con los dos antebrazos.
        const forward = .38 - wind * .29 + hit * .48;
        const height = .18 + wind * .42 - hit * .23;
        p.reachL = [-.13 + wind * .24, height, forward, 1, .45];
        p.reachR = [.14 - wind * .24, height, forward, 1, .45];
        p.chest = [-.08 + hit * .22, 0, 0];
        p.spine[1] *= .4;
        p.head[1] = 0;
    } else if (heavy) {
        // Patada de Goku más alta. Naruto se inclina para barrer a media altura.
        p.spine = [-.08 - hit * (isNaruto ? .22 : .28), -.36 * wind + .35 * hit, -.13 * hit];
        p.legL = [.1 + wind * .18, 0, .16];
        p.legR = [-.2 - wind * .38 - hit * (isNaruto ? .98 : 1.24), .35 * hit, -.19 * hit];
        p.shinR = [.16 + wind * 1.38 - hit * .09, 0, 0];
        p.reachL = [-.1, .21, .46, 1, .18];
        p.reachR = [-.22 - hit * .18, -.11, .18 - hit * .26, 1, .35];
        h.rz = -.12 * hit;
        h.y += hit * .09;
    } else {
        const hand = side === 1 ? 'R' : 'L';
        const hook = (step === 1 && !isVegeta) || (step === 0 && isVegeta);
        const spread = hook ? .5 : .21;
        const extension = hook ? .47 : .58;
        p['reach' + hand] = [
            side * (.15 - spread * wind + (hook ? .31 : .10) * hit),
            .13 + (isNaruto ? .01 : .07) * hit + (hook ? .12 : -.16) * wind,
            .39 - .29 * wind + extension * hit, 1,
            hook ? .7 : .13,
        ];
        p['hand' + hand] = [isNaruto ? -.22 * hit : .1 * hit, 0, side * .16 * hit];
    }
}

function humanGuard(p, h, f, t, breath) {
    const isVegeta = f.type === 'vegeta';
    const isTanjiro = f.type === 'tanjiro';
    const reaction = f.hitReaction;
    const impact = guardRecoil(f);
    const side = reaction ? reaction.side * impact : 0;
    const brace = poseEase(t / .075);
    const lead = isVegeta ? -.12 : .12;
    p.reachL = [-.22 + side * .1, .13 + brace * (isTanjiro ? .11 : .2) + breath * .015,
        .39 + lead - impact * .09, 1, .12 + impact * .12];
    p.reachR = [.21 + side * .1, .14 + brace * .23 - breath * .015,
        .39 - lead - impact * .09, 1, .12 + impact * .12];
    p.spine = [.15 + brace * .11 - impact * .13, side * .23, -side * .16];
    p.chest = [-.06, -.07 - side * .2, 0];
    p.head = [-.14 + impact * .13, side * .07, 0];
    p.legL = [-.13 - brace * .07, .02, .14];
    p.legR = [.17 + brace * .08, -.05, -.13];
    p.shinL = [.24 + brace * .14 + impact * .10, 0, 0];
    p.shinR = [.27 + brace * .12 + impact * .07, 0, 0];
    h.y = -.035 - brace * .075 - impact * .035;
    h.z = -impact * .12;
}

function humanHurt(p, h, f, t) {
    const reaction = f.hitReaction;
    const pressure = reaction ? reaction.forward : -1;
    const side = reaction ? reaction.side : .28;
    const force = reaction ? reaction.weight : .65;
    const duration = f.hurtDuration || .26;
    const hit = Math.exp(-t * 9) * force;
    const catchStep = sin(Math.min(1, t / duration) * PI);
    p.spine = [pressure * hit * .42 + catchStep * .07, side * hit * .32, -side * hit * .20];
    p.chest = [pressure * hit * .2, side * hit * .26, -.08 * catchStep];
    p.head = [pressure * hit * .44 - catchStep * .12, side * hit * .19, -side * hit * .25];
    p.reachL = [.16 + side * hit * .18, -.18 + hit * .18, .37 + pressure * hit * .44, .88, .05];
    p.reachR = [-.16 + side * hit * .18, -.16 + hit * .16, .35 + pressure * hit * .39, .88, .05];
    p.legL = [pressure * catchStep * .38 - .13, 0, .14];
    p.legR = [-pressure * catchStep * .32 + .09, 0, -.12];
    p.shinL = [.19 + catchStep * .5, 0, 0];
    p.shinR = [.14 + catchStep * .22, 0, 0];
    h.rx = pressure * hit * .15;
    h.rz = -side * hit * .12;
    h.y = -.06 * catchStep;
    h.z = pressure * hit * .095;
}

function dashBank(f) {
    if (!f.dashDir) return 0;
    return Math.max(-1, Math.min(1,
        f.dashDir.x * Math.cos(f.rotationY || 0) - f.dashDir.z * Math.sin(f.rotationY || 0)));
}

function applyGuardedSteps(p, h, gait) {
    const { phase } = gait;
    const magnitude = Math.hypot(gait.side, gait.forward);
    const scale = 0.4 / Math.max(0.4, magnitude);
    const side = gait.side * scale, forward = gait.forward * scale;
    const speed = Math.min(1, magnitude * 2.5);
    const step = Math.cos(phase);
    const lift = -sin(phase);
    for (const [limb, sign] of [['L', 1], ['R', -1]]) {
        const leg = p['leg' + limb], shin = p['shin' + limb];
        const swing = Math.max(0, lift * sign);
        leg[0] -= sign * step * forward * 0.76 + swing * speed * 0.09;
        leg[2] += side * (0.23 + step * sign * 0.27);
        shin[0] += swing * speed * 0.22;
        p['foot' + limb] = [-(leg[0] + shin[0]) * 0.75, 0, -leg[2] * 0.42];
    }
    h.rz -= side * 0.085;
    h.y += Math.abs(lift) * speed * 0.035;
}

function withGuardedSteps(animate) {
    return (f, t, c) => {
        const result = animate(f, t, c);
        if (f.state === 'guard' && f.gait) applyGuardedSteps(result.pose, result.body, f.gait);
        return result;
    };
}

function humanPose(f, t, c) {
    const p = {};
    const h = bodyOffset();
    const breath = sin(c * 3.2);
    const finalFlash = f.type === 'vegeta';
    const ninja = f.type === 'naruto';
    const swordsman = f.type === 'tanjiro';

    switch (f.state) {
        case 'run': {
            const cadence = ninja ? 14.8 : swordsman ? 14 : finalFlash ? 12.4 : 13.2;
            const { side, forward, phase } = f.gait || { side: 0, forward: 1, phase: c * cadence };
            const step = Math.cos(phase), lift = -sin(phase);
            const speed = Math.min(1, Math.hypot(side, forward));
            const advance = Math.max(0, Math.min(1, forward));
            const retreat = Math.max(0, Math.min(1, -forward));
            const strafe = Math.min(1, Math.abs(side));
            const sagittal = step * (advance * 0.55 - retreat * 0.35);
            // Alterna apoyo y balanceo, también cuando el luchador retrocede mirando al rival.
            for (const [limb, sign] of [['L', 1], ['R', -1]]) {
                const toeOff = poseEase(-step * sign);
                const swing = Math.max(0, lift * sign);
                const knee = 0.12 + swing * (advance * 0.74 + retreat * 0.37 + strafe * 0.25);
                const stride = -sagittal * sign - swing * speed * 0.12;
                const spread = (0.1 + step * strafe * 0.09) * sign + side * 0.13;
                p['leg' + limb] = [stride, side * 0.08, spread];
                p['shin' + limb] = [knee, 0, 0];
                p['foot' + limb] = [
                    -(stride + knee) * (1 - swing * 0.28) + toeOff * advance * 0.17,
                    -side * 0.035, -spread * 0.65,
                ];
            }
            const armSwing = sagittal * 0.8;
            const guard = Math.max(strafe, retreat);
            p.armL = [armSwing - 0.14 - guard * 0.22, -strafe * 0.08, 0.09];
            p.armR = [-armSwing - 0.1 - guard * 0.24, strafe * 0.08, -0.09];
            p.foreL = [-0.55 - guard * 0.28 + armSwing * 0.22, 0, 0];
            p.foreR = [-0.56 - guard * 0.28 - armSwing * 0.22, 0, 0];
            p.spine = [advance * 0.22 - retreat * 0.11, sagittal * 0.17, -side * 0.17 - lift * speed * 0.045];
            p.chest = [-advance * 0.07, -sagittal * 0.24, side * 0.05];
            p.head = [-advance * 0.1 + retreat * 0.065, sagittal * 0.065, side * 0.06];
            if (ninja) {
                const sprint = poseEase((advance - 0.28) / 0.72);
                p.armL = [p.armL[0] * (1 - sprint) + sprint * (0.95 + step * 0.08), 0, 0.13];
                p.armR = [p.armR[0] * (1 - sprint) + sprint * (0.95 - step * 0.08), 0, -0.13];
                p.foreL[0] += sprint * 0.45;
                p.foreR[0] += sprint * 0.45;
                p.spine[0] += sprint * 0.2;
            } else if (swordsman) {
                // La espada se mantiene estable mientras las piernas amortiguan la carrera.
                p.armR = [-0.35 - guard * 0.15, -0.1, -0.15];
                p.foreR = [-0.65 - guard * 0.16, 0, 0];
                p.armL[0] -= 0.08;
            }
            h.y = -0.03 + speed * (0.055 * Math.abs(lift) - 0.012);
            h.z = forward * 0.025;
            h.rz = -side * 0.025 - lift * speed * 0.018;
            break;
        }
        case 'attack':
            humanStrike(p, h, f, t);
            break;
        case 'blast': {
            const extension = poseEase(t / 0.048) * (1 - poseEase((t - 0.09) / 0.18));
            const recoil = poseEase(t / 0.044) * Math.exp(-Math.max(0, t - 0.044) * 17);
            p.reachR = [0.12 + extension * 0.14, -0.17 - recoil * 0.04, 0.46 + extension * 0.44, 1, 0.47];
            p.reachL = [-0.12, -0.19, ninja ? 0.5 : 0.34, 1, 0.13];
            p.chest = [-recoil * 0.1, -0.12 + extension * 0.33, -recoil * 0.055];
            p.spine = [0.08 - recoil * 0.14, extension * 0.09, 0];
            p.head = [0.04, -extension * 0.15, recoil * 0.04];
            p.legL = [-0.16, 0, 0.12]; p.legR = [0.18, 0, -0.14];
            p.shinL = [0.23 + recoil * 0.13, 0, 0]; p.shinR = [0.13, 0, 0];
            h.y = -0.075 - recoil * 0.04;
            h.z = extension * 0.09 - recoil * 0.13;
            break;
        }
        case 'guard':
            humanGuard(p, h, f, t, breath);
            break;
        case 'charge': {
            const build = poseEase(t / 0.45);
            const tremble = sin(c * 45) * 0.01 * build;
            p.armL = [0.15, 0, 0.55 + tremble]; p.foreL = [-0.3, 0, 0];
            p.armR = [0.15, 0, -0.55 - tremble]; p.foreR = [-0.3, 0, 0];
            p.chest = [-0.18, 0, 0];
            p.head = [-0.3, 0, tremble];
            p.legL = [0, 0, 0.12]; p.legR = [0, 0, -0.12];
            p.shinL = [0.15, 0, 0]; p.shinR = [0.15, 0, 0];
            h.y = -0.08 + tremble + sin(c * 5) * 0.012;
            break;
        }
        case 'ultimate': {
            const windup = Math.max(0.01, f.stats.ult.windup);
            const gather = poseEase(t / windup);
            const fireTime = t - windup;
            const firing = fireTime >= 0;
            const drive = poseEase((fireTime + 0.08) / 0.11);
            const recoil = poseEase((fireTime + 0.015) / 0.045) * Math.exp(-Math.max(0, fireTime - 0.03) * 8);
            if (!firing) {
                if (finalFlash) {
                    const spread = poseEase(t / (windup * 0.3));
                    const close = poseEase((t / windup - 0.65) / 0.35);
                    const width = (0.20 + spread * 0.71) * (1 - close) - close * 0.31;
                    const depth = 0.38 - spread * 0.32 + close * 0.76;
                    p.reachL = [width, 0.08 - close * 0.27, depth, 1, 0.42];
                    p.reachR = [-width, 0.08 - close * 0.27, depth, 1, 0.42];
                    p.chest = [-0.2 * spread * (1 - close), 0, 0];
                } else if (ninja) {
                    const orbit = t * 12;
                    p.reachR = [0.12 + drive * 0.15, -0.39 + drive * 0.13, 0.43 + drive * 0.42, 1, 0.26];
                    p.reachL = [-0.46 - gather * sin(orbit) * 0.08, -0.12 + gather * Math.cos(orbit) * 0.11,
                        0.49 - drive * 0.12, 1, 0.64];
                    p.chest = [0.15, -0.25 * gather + drive * 0.48, 0];
                } else if (swordsman) {
                    const raise = poseEase(t / (windup * 0.7));
                    p.reachR = [-0.14 + drive * 0.66, -0.31 + raise * 0.86 - drive * 0.39, 0.38 + drive * 0.36, 1, 0.8];
                    p.reachL = [-0.52 + drive * 0.66, -0.41 + raise * 0.86 - drive * 0.39, 0.42 + drive * 0.36, 1, 0.8];
                    p.chest = [0.08, -0.48 * raise + drive * 0.8, -raise * 0.13];
                } else {
                    const draw = gather * (1 - drive);
                    p.reachL = [-0.18 - draw * 0.48, -0.37 + drive * 0.2, 0.54 - draw * 0.39 + drive * 0.32, 1, 0.35];
                    p.reachR = [0.18 - draw * 0.34, -0.45 + drive * 0.23, 0.52 - draw * 0.47 + drive * 0.34, 1, 0.24];
                    p.chest = [0.06, -0.55 * draw, 0];
                }
                p.head = [-0.045, -p.chest[1] * 0.55, 0];
            } else {
                const after = poseEase(fireTime / 0.22);
                p.chest = [0.05, 0, 0];
                p.reachL = [-0.25, -0.17, 0.83 + drive * 0.1 - after * 0.04, 1, 0.4];
                p.reachR = [0.25, -0.23, 0.83 + drive * 0.1 - after * 0.04, 1, 0.4];
                p.spine = [0.14 - recoil * 0.18, 0, 0];
                p.head = [-0.08, 0, 0];
                if (ninja) {
                    p.chest = [0.12, 0.32, 0];
                    p.reachR = [0.25, -0.23, 0.92, 1, 0.32];
                    p.reachL = [0.13 - after * 0.42, -0.47, 0.21 - after * 0.26, 1, 0.24];
                } else if (swordsman) {
                    p.chest = [0.12, 0.38 + after * 0.15, 0.08];
                    p.reachR = [0.58 - after * 0.87, 0.05 - after * 0.49, 0.74, 1, 0.55];
                    p.reachL = [0.16 - after * 0.87, -0.02 - after * 0.49, 0.79, 1, 0.55];
                }
            }
            p.legL = [-0.16 - drive * 0.1, 0, 0.16]; p.legR = [0.14 + gather * 0.09, 0, -0.19];
            p.shinL = [0.18 + gather * 0.15, 0, 0]; p.shinR = [0.14 + recoil * 0.3, 0, 0];
            h.y = -0.045 - gather * 0.065 + drive * 0.035 + sin(c * 24) * gather * 0.006;
            h.z = -gather * (1 - drive) * 0.08 + drive * 0.11 - recoil * 0.15;
            break;
        }
        case 'hurt':
            humanHurt(p, h, f, t);
            break;
        case 'dash': {
            const pursuit = f.dragonDash || f.dashAnimation === 'pursuit';
            const vanish = f.dashAnimation === 'vanish';
            const hasDashDir = f.dashDir && Math.hypot(f.dashDir.x, f.dashDir.z) > 0.01;
            const yaw = f.rotationY || 0;
            const side = hasDashDir ? dashBank(f) : (f.gait?.side || 0);
            const forward = hasDashDir ?
                f.dashDir.x * sin(yaw) + f.dashDir.z * Math.cos(yaw) : (f.gait?.forward ?? 1);
            const strafe = Math.max(-1, Math.min(1, side));
            const advance = Math.max(0, Math.min(1, forward));
            const retreat = Math.max(0, Math.min(1, -forward));
            const duration = pursuit ? 0.55 : 0.22;
            const land = poseEase((t - duration * 0.65) / (duration * 0.35));
            const release = poseEase(t / 0.075);
            const float = release * (1 - land);
            const load = (1 - release) * 0.55 + land * 0.45;
            const drive = vanish ? 0 : float;
            const lead = strafe >= 0 ? 1 : -1;
            p.spine = [0.17 + drive * (advance * 0.53 - retreat * 0.37), -drive * strafe * 0.18, -drive * strafe * 0.25];
            p.chest = [-advance * drive * 0.12, strafe * drive * 0.14, 0];
            p.head = [-0.05 - drive * (advance * 0.21 - retreat * 0.11), strafe * drive * 0.06, strafe * drive * 0.12];
            for (const [limb, sign] of [['L', 1], ['R', -1]]) {
                const leading = sign === lead;
                const stride = leading ? -0.38 : 0.26;
                const thigh = drive * stride * (0.7 + advance * 0.55) - load * 0.26;
                const knee = load * 0.57 + drive * (leading ? 0.4 : 0.78);
                const spread = sign * 0.1 + strafe * drive * (leading ? 0.46 : 0.13);
                p['leg' + limb] = [thigh, 0, spread];
                p['shin' + limb] = [knee, 0, 0];
                p['foot' + limb] = [-thigh - knee * (1 - drive * 0.52), 0, -spread * 0.7];
                const reach = (leading ? 0.48 : 0.08) * Math.abs(strafe);
                p['arm' + limb] = [-0.36 + drive * (advance * 1.09 - retreat * 0.48 - reach), 0, sign * (0.12 + reach * drive)];
                p['fore' + limb] = [-0.75 + drive * (advance * 0.56 - retreat * 0.14), 0, 0];
            }
            h.y = drive * (pursuit ? 0.18 : 0.13) - load * 0.11 - (vanish ? 0.07 * (1 - land) : 0);
            h.z = drive * (advance - retreat) * 0.11;
            h.rz = -drive * strafe * 0.08;
            break;
        }
        case 'ko': {
            p.armL = [0, 0, 0.9]; p.armR = [0, 0, -0.9];
            p.head = [-0.3, 0.3, 0];
            h.rx = -PI / 2; h.y = 0.2;
            break;
        }
        default: { // idle
            const weight = sin(c * 1.5);
            p.spine = [0.03, weight * 0.018, weight * 0.015];
            p.chest = [0.02 + breath * 0.018, finalFlash ? -0.06 : 0.04, 0];
            p.armL = [-0.2 + breath * 0.025, 0, 0.08]; p.foreL = [-0.48, 0, 0];
            p.armR = [-0.15 - breath * 0.025, 0, -0.08]; p.foreR = [-0.5, 0, 0];
            if (swordsman) {
                p.reachR = [0.12, -0.33, 0.5, 1, 0.25];
                p.reachL = [-0.4, -0.36, 0.44, 1, 0.24];
            } else if (ninja) {
                p.reachL = [-0.14, -0.25 + breath * 0.02, 0.52, 1, 0.25];
                p.reachR = [0.06, -0.47, 0.18, 1, 0.16];
            } else if (finalFlash) {
                p.reachL = [-0.17, -0.16, 0.36, 1, 0.24];
                p.reachR = [0.16, -0.2 + breath * 0.016, 0.35, 1, 0.2];
            } else if (f.type === 'goku') {
                p.reachL = [-0.12, -0.06 + breath * 0.023, 0.48, 1, 0.21];
                p.reachR = [0.17, -0.29, 0.34, 1, 0.19];
            }
            p.head = [breath * 0.015, 0, -breath * 0.012];
            p.legL = [0.08, 0, 0.06]; p.legR = [-0.08, 0, -0.06];
            p.shinL = [0.09, 0, 0]; p.shinR = [0.08, 0, 0];
            h.y = breath * 0.013 - 0.025;
        }
    }
    if (f.revengePoseTime != null && (f.state === 'idle' || f.state === 'run')) {
        const snap = 1 - poseEase((f.revengePoseTime - .045) / .16);
        p.reachR = [.24, .22, .9, snap, .42];
        p.reachL = [-.22, .2, .36, snap, .18];
        p.chest[1] += .4 * snap;
        h.z += .11 * snap;
    }
    return { pose: p, body: h };
}

function creatureMotion(f, c, cadence) {
    const gait = f.gait || { side: 0, forward: 1, phase: c * 15 };
    const { side, forward } = gait;
    const speed = Math.min(1, Math.hypot(side, forward));
    return { side, forward, speed, phase: gait.phase * cadence };
}

function guardRecoil(f) {
    const hit = f.hitReaction;
    return hit ? hit.weight * (1 - poseEase(hit.age / 0.17)) : 0;
}

function creatureRecoil(f, t) {
    const hit = f.hitReaction || { side: 0, forward: -1, weight: 0.75 };
    const weight = hit.weight * (1 - poseEase(t / (f.hurtDuration || 0.3)));
    return { side: hit.side * weight, forward: hit.forward * weight, weight };
}

function creatureDash(f, t) {
    const pursuit = f.dashAnimation === 'pursuit' || f.dragonDash;
    const vanish = f.dashAnimation === 'vanish';
    const duration = pursuit ? 0.55 : 0.22;
    const lift = sin(Math.min(1, t / duration) * PI) * (vanish ? 0.22 : 1);
    const forward = f.dashDir?.lengthSq() ?
        f.dashDir.x * sin(f.rotationY) + f.dashDir.z * Math.cos(f.rotationY) : f.gait?.forward ?? 0.75;
    const bank = f.dashDir?.lengthSq() ? dashBank(f) : f.gait?.side || 0;
    return { bank: bank * lift, thrust: forward * lift, lift };
}

function pikachuPose(f, t, c) {
    const p = {};
    const h = bodyOffset();
    const breath = sin(c * 5);
    // La pose base tiene los brazos en alto: en reposo los baja
    const armsDown = 0.55;
    p.armL = [0.5, 0, -armsDown]; p.armR = [0.5, 0, armsDown];
    p.tail1 = [sin(c * 4) * 0.12, sin(c * 3) * 0.25, 0];
    p.earL = [breath * 0.06, 0, 0]; p.earR = [-breath * 0.06, 0, 0];

    switch (f.state) {
        case 'run': {
            const { side, forward, speed, phase } = creatureMotion(f, c, 2);
            const swing = sin(phase), lift = sin(phase + 0.55);
            p.legL = [-swing * forward * 0.72, 0, 0.05 + swing * side * 0.45];
            p.legR = [swing * forward * 0.72, 0, -0.05 - swing * side * 0.45];
            p.shinL = [Math.max(0, lift) * speed * 0.52, 0, 0];
            p.shinR = [Math.max(0, -lift) * speed * 0.52, 0, 0];
            p.spine = [forward * 0.3, swing * speed * 0.045, -side * 0.14];
            p.head = [-forward * 0.11, 0, side * 0.06];
            p.armL = [0.5 + forward * 0.28 + swing * speed * 0.3, 0, -0.5 + side * 0.18];
            p.armR = [0.5 + forward * 0.28 - swing * speed * 0.3, 0, 0.5 + side * 0.18];
            p.tail1 = [-forward * 0.3, swing * speed * 0.26 - side * 0.23, 0];
            p.tail2 = [sin(phase - 0.5) * speed * 0.16, -swing * speed * 0.18, 0];
            p.earL = [sin(phase - 0.4) * speed * 0.16 + forward * 0.12, 0, 0];
            p.earR = [sin(phase - 0.8) * speed * 0.16 + forward * 0.12, 0, 0];
            h.y = Math.abs(swing) * speed * 0.1;
            h.rz = -side * 0.1 - swing * speed * 0.025;
            break;
        }
        case 'attack': {
            const step = f.animStep;
            const { wind, hit } = strikePhase(f, t);
            if (step === 2) {
                // Coletazo girando sobre sí mismo
                h.ry = poseEase(t / 0.24) * PI * 2;
                h.y = sin(Math.min(1, t / 0.26) * PI) * 0.3;
                p.tail1 = [-0.4, hit * 0.3, 0]; p.tail2 = [-0.3, hit * 0.25, 0];
                p.earL = [0.5, 0, 0]; p.earR = [0.5, 0, 0];
            } else {
                const sign = step === 0 ? 1 : -1;
                p.spine = [0.18 + hit * 0.15, sign * (-wind * 0.32 + hit * 0.5), 0];
                p[step === 0 ? 'armR' : 'armL'] = [wind * 0.65 - hit * 1.2, 0, -sign * wind * 0.3];
                p.head = [-0.08, -sign * hit * 0.15, 0];
                h.z = hit * 0.17;
                h.y = -wind * 0.035 + hit * 0.06;
            }
            break;
        }
        case 'blast': {
            p.spine = [t < 0.07 ? -0.35 : 0.5, 0, 0];
            p.head = [0.15, 0, 0];
            p.earL = [0.6, 0, 0]; p.earR = [0.6, 0, 0];
            p.tail1 = [-0.6, 0, 0];
            h.y = t < 0.07 ? 0.1 : 0;
            break;
        }
        case 'guard': {
            const impact = guardRecoil(f);
            p.armL = [-0.6 + impact * 0.25, 0.48, -0.22]; p.armR = [-0.6 + impact * 0.25, -0.48, 0.22];
            p.spine = [0.43 - impact * 0.35, 0, 0];
            p.head = [impact * 0.18, 0, 0];
            p.earL = [0.7, 0, 0]; p.earR = [0.7, 0, 0];
            h.y = -0.05 - impact * 0.065; h.z = -impact * 0.13;
            break;
        }
        case 'charge': {
            const tremble = sin(c * 55) * 0.03;
            p.armL = [-0.1, 0, 0.1]; p.armR = [-0.1, 0, -0.1];
            p.spine = [-0.2, 0, tremble];
            p.tail1 = [-0.5, tremble * 3, 0];
            p.earL = [-0.2, 0, tremble]; p.earR = [-0.2, 0, -tremble];
            break;
        }
        case 'ultimate': {
            const firing = t > f.stats.ult.windup;
            const gather = poseEase(t / Math.max(0.01, f.stats.ult.windup));
            const recoil = firing ? Math.exp(-(t - f.stats.ult.windup) * 7) : 0;
            p.armL = [0, 0, firing ? 0.2 : 0.05]; p.armR = [0, 0, firing ? -0.2 : -0.05];
            p.spine = [firing ? -0.2 - recoil * 0.15 : 0.15 + gather * 0.16, 0, 0];
            p.head = [firing ? -0.14 : 0.12, 0, 0];
            p.earL = [-0.4 - gather * 0.2, 0, 0]; p.earR = [-0.4 - gather * 0.2, 0, 0];
            p.tail1 = [-0.7, sin(c * 40) * 0.15, 0];
            p.tail2 = [-0.2, sin(c * 40 - 0.6) * 0.2, 0];
            p.legL = [0.1, 0, 0.08]; p.legR = [0.1, 0, -0.08];
            h.y = firing ? 0.15 + recoil * 0.2 + sin(c * 30) * 0.02 : -gather * 0.05;
            h.z = -recoil * 0.08;
            break;
        }
        case 'hurt': {
            const { side, forward, weight } = creatureRecoil(f, t);
            p.spine = [forward * 0.5, side * 0.2, -side * 0.24];
            p.head = [forward * 0.18, 0, -side * 0.12];
            p.armL = [0.35 * weight, 0, -0.4 + weight * 0.35];
            p.armR = [0.35 * weight, 0, 0.4 - weight * 0.35];
            p.earL = [-0.48 * weight, 0, 0]; p.earR = [-0.48 * weight, 0, 0];
            p.tail1 = [weight * 0.4, -side * 0.5, 0];
            h.rx = forward * 0.2; h.rz = -side * 0.12; h.y = weight * 0.07;
            break;
        }
        case 'dash': {
            const { bank, thrust, lift } = creatureDash(f, t);
            p.spine = [thrust * 0.64, 0, -bank * 0.21];
            p.head = [-0.25, bank * 0.12, 0];
            p.armL = [0.5 + thrust * 0.5, 0, -0.45]; p.armR = [0.5 + thrust * 0.5, 0, 0.45];
            p.legL = [0.25 - thrust * 0.3, 0, 0.1]; p.legR = [0.25 + thrust * 0.3, 0, -0.1];
            p.shinL = [lift * 0.66, 0, 0]; p.shinR = [lift * 0.5, 0, 0];
            p.tail1 = [-0.64 * lift, -bank * 0.26, 0];
            p.earL = [0.62 * lift, 0, 0]; p.earR = [0.62 * lift, 0, 0];
            h.y = 0.28 * lift; h.rz = -bank * 0.18;
            break;
        }
        case 'ko': {
            p.armL = [0, 0, 0.2]; p.armR = [0, 0, -0.2];
            h.rx = -PI / 2; h.y = 0.35;
            break;
        }
        default: {
            p.chest = [breath * 0.03, 0, 0];
            p.head = [sin(c * 2.5) * 0.025, sin(c * 1.1) * 0.045, 0];
            p.tail2 = [sin(c * 4 - 0.5) * 0.12, sin(c * 3 - 0.8) * 0.2, 0];
            h.y = Math.abs(sin(c * 4)) * 0.03;
        }
    }
    return { pose: p, body: h };
}

function charizardPose(f, t, c) {
    const p = {};
    const h = bodyOffset();
    const flap = sin(c * 3.4);
    p.wingL = [0, flap * 0.14, flap * 0.12];
    p.wingR = [0, -flap * 0.14, -flap * 0.12];
    p.tail1 = [0, sin(c * 2) * 0.12, 0];
    p.tail2 = [0, sin(c * 2 - 0.6) * 0.12, 0];
    p.tail3 = [0, sin(c * 2 - 1.2) * 0.14, 0];
    p.tail4 = [0, sin(c * 2 - 1.8) * 0.16, 0];
    p.wingL2 = [0, flap * 0.06, flap * 0.1];
    p.wingR2 = [0, -flap * 0.06, -flap * 0.1];

    switch (f.state) {
        case 'run': {
            const { side, forward, speed, phase } = creatureMotion(f, c, 1);
            const stride = sin(phase), lift = sin(phase + 0.55), beat = sin(phase - 0.4) * speed;
            p.legL = [-stride * forward * 0.55, 0, 0.07 + stride * side * 0.39];
            p.legR = [stride * forward * 0.55, 0, -0.07 - stride * side * 0.39];
            p.spine = [forward * 0.14, stride * speed * 0.1, -side * 0.16];
            p.neck = [-forward * 0.07, -stride * speed * 0.06, side * 0.07];
            p.head = [-0.04, -stride * speed * 0.04, 0];
            p.shinL = [Math.max(0, lift) * 0.6 * speed, 0, 0];
            p.shinR = [Math.max(0, -lift) * 0.6 * speed, 0, 0];
            p.armL = [stride * speed * 0.34, 0, side * 0.1]; p.armR = [-stride * speed * 0.34, 0, side * 0.1];
            p.foreL = [-0.26 - stride * speed * 0.1, 0, 0]; p.foreR = [-0.26 + stride * speed * 0.1, 0, 0];
            p.wingL = [0, beat * 0.26 + side * 0.24, beat * 0.2];
            p.wingR = [0, -beat * 0.26 + side * 0.24, -beat * 0.2];
            p.tail1 = [forward * 0.15, -side * 0.33 - stride * speed * 0.1, 0];
            p.tail2 = [0, sin(phase - 0.55) * speed * 0.18 - side * 0.2, 0];
            h.y = -0.025 * speed + (1 - Math.abs(stride)) * speed * 0.068;
            h.rz = -side * 0.1;
            break;
        }
        case 'attack': {
            const step = f.animStep;
            const { wind, hit } = strikePhase(f, t);
            if (step === 2) {
                // Coletazo: gira con todo el cuerpo
                h.ry = poseEase(t / 0.25) * PI * 2;
                p.tail1 = [0.1, 0.3, 0]; p.tail2 = [0, 0.3, 0];
                p.tail3 = [0.1, 0.3, 0]; p.tail4 = [0.1, 0.25, 0];
                h.y = sin(Math.min(1, t / 0.26) * PI) * 0.12;
            } else {
                const right = step === 0;
                const side = right ? 1 : -1;
                p.chest = [0.12 + hit * 0.12, side * (-wind * 0.4 + hit * 0.6), 0];
                p[right ? 'armR' : 'armL'] = [wind * 0.5 - hit * 1.1, -side * hit * 0.3, -side * wind * 0.3];
                p.neck = [0.2, 0, 0];
                p.jaw = [hit * 0.3, 0, 0];
                h.z = hit * 0.13;
            }
            break;
        }
        case 'blast': {
            p.neck = [t < 0.09 ? -0.5 : 0.45, 0, 0];
            p.head = [t < 0.09 ? -0.2 : 0.2, 0, 0];
            p.jaw = [t < 0.09 ? 0 : 0.5, 0, 0];
            p.chest = [t < 0.09 ? -0.15 : 0.15, 0, 0];
            break;
        }
        case 'guard': {
            const impact = guardRecoil(f);
            p.wingL = [0.1, 0.9 - impact * 0.28, 0]; p.wingR = [0.1, -0.9 + impact * 0.28, 0];
            p.armL = [-0.7, 0.4, 0]; p.armR = [-0.7, -0.4, 0];
            p.foreL = [-0.46 + impact * 0.3, 0, 0]; p.foreR = [-0.46 + impact * 0.3, 0, 0];
            p.neck = [0.3 + impact * 0.25, 0, 0];
            p.spine = [0.2 - impact * 0.32, 0, 0];
            h.y = -0.05 - impact * 0.065; h.z = -impact * 0.14;
            break;
        }
        case 'charge': {
            const beat = sin(c * 14);
            p.wingL = [0, beat * 0.22, 0.25 + beat * 0.2];
            p.wingR = [0, -beat * 0.22, -0.25 - beat * 0.2];
            p.neck = [-0.45, 0, 0];
            p.head = [-0.3, 0, 0];
            p.jaw = [0.4, 0, 0];
            p.chest = [-0.15, 0, 0];
            h.y = 0.14;
            break;
        }
        case 'ultimate': {
            const firing = t > f.stats.ult.windup;
            const gather = poseEase(t / Math.max(0.01, f.stats.ult.windup));
            const recoil = firing ? Math.exp(-(t - f.stats.ult.windup) * 7) : 0;
            p.neck = firing ? [0.4 - recoil * 0.1, sin(c * 3) * 0.045, 0] : [-0.35 - gather * 0.25, 0, 0];
            p.neck2 = [firing ? 0.1 : -gather * 0.08, 0, 0];
            p.head = firing ? [0.18, 0, 0] : [-0.3, 0, 0];
            p.jaw = firing ? [0.6, 0, 0] : [0.15, 0, 0];
            p.chest = [firing ? 0.18 - recoil * 0.1 : -0.18 * gather, 0, 0];
            const wing = firing ? sin(c * 6) * 0.04 : gather * 0.15;
            p.wingL = [0, 0.3 + wing, 0.2 + wing]; p.wingR = [0, -0.3 - wing, -0.2 - wing];
            p.legL = [0.05, 0, 0.15]; p.legR = [-0.1, 0, -0.15];
            h.z = -recoil * 0.16;
            h.y = -gather * 0.025 + (firing ? sin(c * 24) * 0.012 : 0);
            break;
        }
        case 'hurt': {
            const { side, forward, weight } = creatureRecoil(f, t);
            p.neck = [forward * 0.42, side * 0.22, -side * 0.2];
            p.chest = [forward * 0.25, 0, -side * 0.17];
            p.jaw = [weight * 0.35, 0, 0];
            p.wingL = [0, -weight * 0.32, weight * 0.3]; p.wingR = [0, weight * 0.32, -weight * 0.3];
            p.armL = [weight * 0.38, 0, weight * 0.24]; p.armR = [weight * 0.38, 0, -weight * 0.24];
            p.tail1 = [-weight * 0.27, -side * 0.45, 0];
            h.rx = forward * 0.16; h.rz = -side * 0.14;
            break;
        }
        case 'dash': {
            const { bank, thrust, lift } = creatureDash(f, t);
            const beat = sin(t * 24 + 0.5) * lift;
            p.wingL = [0, lift * 0.45 + bank * 0.26, beat * 0.38];
            p.wingR = [0, -lift * 0.45 + bank * 0.26, -beat * 0.38];
            p.spine = [thrust * 0.45, -bank * 0.1, -bank * 0.12];
            p.neck = [thrust * -0.14, bank * 0.12, 0];
            p.legL = [lift * 0.2 + thrust * 0.16, 0, 0.12]; p.legR = [lift * 0.3, 0, -0.12];
            p.shinL = [lift * 0.62, 0, 0]; p.shinR = [lift * 0.52, 0, 0];
            p.armL = [thrust * 0.3, 0, 0.1]; p.armR = [thrust * 0.3, 0, -0.1];
            p.tail1 = [0.1, -bank * 0.2, 0];
            h.y = 0.36 * lift;
            h.rz = -bank * 0.18;
            break;
        }
        case 'ko': {
            p.wingL = [0, 0, -0.3]; p.wingR = [0, 0, 0.3];
            p.neck = [0.3, 0.4, 0];
            p.jaw = [0.4, 0, 0];
            h.rx = -PI / 2; h.y = 0.5;
            break;
        }
        default: {
            const breath = sin(c * 2.6);
            p.chest = [breath * 0.025, 0, 0];
            p.neck = [breath * 0.03, sin(c * 0.9) * 0.1, 0];
            h.y = breath * 0.015;
        }
    }
    return { pose: p, body: h };
}

// Estos detalles son opcionales: un rig sin dedos continúa usando las poses del brazo.
function poseFist(pose, side, curl = 0.65) {
    for (const finger of ['index', 'middle', 'ring', 'pinky']) pose[finger + side] = [-curl, 0, 0];
}

function gojoGesture(pose, side, curl) {
    pose['ring' + side] = [-curl, 0, 0];
    pose['pinky' + side] = [-curl, 0, 0];
}

function gojoPose(f, t, c) {
    const result = humanPose(f, t, c), p = result.pose, h = result.body;
    const breath = sin(c * 2), sway = sin(c * 1.1);
    switch (f.state) {
        case 'idle':
            p.spine = [0, 0.05, sway * 0.016];
            p.chest = [breath * 0.015, -0.08, -sway * 0.013];
            p.armL = [0.28 + breath * 0.02, -0.08, 0.015]; p.foreL = [0.2, 0, 0];
            p.armR = [0.11 - breath * 0.02, 0.06, -0.025]; p.foreR = [-0.06, 0, 0];
            p.handL = [0.08, 0.12, 0]; p.handR = [-0.08, -0.1, 0];
            p.head = [-0.035, 0.05, -0.04 + sway * 0.014];
            p.legL = [0.04, -0.06, 0.08]; p.legR = [-0.08, 0.06, -0.08];
            p.shinL = [0.09, 0, 0]; p.shinR = [0.11, 0, 0];
            h.y = breath * 0.006 - 0.025;
            break;
        case 'run':
            p.armL[0] = p.armL[0] * 0.6 + 0.12;
            p.armR[0] = p.armR[0] * 0.58 + 0.03;
            p.foreL[0] *= 0.5;
            p.foreR[0] *= 0.6;
            p.spine[0] *= 0.75;
            h.y *= 0.65;
            break;
        case 'attack': {
            const phase = strikePhase(f, t), { hit, recover } = phase;
            const wind = phase.wind * poseEase(t / 0.04);
            const left = f.animStep === 1, strong = f.animStep === 2;
            const hand = left ? 'L' : 'R', free = left ? 'R' : 'L', sign = left ? 1 : -1;
            p.spine = [0.06 + hit * 0.14, sign * (wind * 0.12 - hit * 0.2), sign * hit * 0.05];
            p.chest = [hit * 0.08, sign * (wind * 0.3 - hit * (strong ? 0.46 : 0.3)), 0];
            p['arm' + hand] = [wind * (strong ? 0.15 : -0.12) - hit * 1.08, -sign * hit * 0.15, sign * wind * 0.2];
            p['fore' + hand] = [-wind * 0.62 + hit * 0.45 - recover * 0.15, 0, 0];
            p['hand' + hand] = [-hit * 0.4, -sign * 0.14, 0];
            p['arm' + free] = [-0.12 + hit * 0.24, sign * 0.10, -sign * 0.1];
            p['fore' + free] = [-0.18 - wind * 0.22, 0, 0];
            p['reach' + hand] = [sign * (wind * 0.26 - hit * 0.21), -0.27 + hit * 0.18, 0.39 + hit * 0.52 - wind * 0.19, 0.9, 0.37];
            p['reach' + free] = [-sign * (0.17 + hit * 0.10), -0.49, 0.35 - hit * 0.10, 0.8, 0.10];
            p.legL = [sign * 0.12, 0, 0.1]; p.legR = [-sign * 0.12, 0, -0.1];
            p.shinL = [0.13 + wind * 0.1, 0, 0]; p.shinR = [0.13 + wind * 0.1, 0, 0];
            p.head = [-0.06, sign * (hit * 0.2 - wind * 0.12), 0];
            h.y = -0.035 - wind * 0.03 + hit * 0.016;
            h.z = -wind * 0.05 + hit * (strong ? 0.18 : 0.10);
            break;
        }
        case 'guard': {
            // Infinito: intercepta con una palma sin cerrar la postura.
            const recoil = guardRecoil(f);
            p.armR = [-0.62, 0.35, -0.025]; p.foreR = [-0.12, 0.12, 0];
            p.handR = [-0.5, 0.1, 0.08];
            p.armL = [0.22, -0.04, 0.05]; p.foreL = [0.18, 0, 0];
            p.reachR = [0.26, -0.10, 0.67 - recoil * 0.13, 0.95, 0.28];
            p.reachL = [0.17, -0.82, 0.26, 0.7, 0.08];
            p.spine = [0.02, -0.05, 0]; p.chest = [breath * 0.012, 0.05, -0.02];
            p.head = [-0.03, 0.03, -0.035];
            p.legL = [0.08, 0, 0.09]; p.legR = [-0.1, 0, -0.09];
            p.shinL = [0.12, 0, 0]; p.shinR = [0.13, 0, 0];
            h.y = -0.03; h.z = -0.025 - recoil * 0.075;
            break;
        }
        case 'blast': {
            const release = poseEase(t / 0.035), settle = poseEase((t - 0.13) / 0.17);
            const reach = release * (1 - settle);
            p.armR = [-0.45 - reach * 0.67 + settle * 0.54, 0.26 * (1 - settle), -0.035];
            p.foreR = [-0.43 + reach * 0.87 + settle * 0.35, 0, 0];
            p.armL = [0.24, -0.08, 0.04]; p.foreL = [0.1, 0, 0];
            p.handR = [-0.35 + reach * 0.52, 0, 0.18 * reach];
            p.reachR = [0.25 * (1 - settle), -0.29 - settle * 0.35, 0.43 + reach * 0.48 - settle * 0.08, 0.95, 0.30];
            p.reachL = [0.15, -0.80, 0.21, 0.75, 0.09];
            gojoGesture(p, 'R', 0.7 * (1 - settle));
            p.chest = [0.07 * reach, 0.24 * reach, 0];
            p.spine = [0.06 * reach, 0, 0]; p.head = [-0.07, -0.11 * reach, 0];
            h.y = -0.025; h.z = -reach * 0.03;
            break;
        }
        case 'charge': {
            const focus = poseEase(t / 0.45);
            p.armL = [-0.13 - focus * 0.15, -0.35, 0.065];
            p.armR = [-0.12 - focus * 0.18, 0.35, -0.065];
            p.foreL = [-0.48, -0.19, 0]; p.foreR = [-0.51, 0.19, 0];
            p.handL = [-0.12, -0.35, 0.1]; p.handR = [-0.12, 0.35, -0.1];
            p.reachL = [-0.24 * focus, -0.32, 0.56, 0.9, 0.17];
            p.reachR = [0.24 * focus, -0.34, 0.57, 0.9, 0.17];
            p.spine = [0.035, 0, 0]; p.head = [0.065 + focus * 0.06, 0, 0];
            h.y = breath * 0.008 - 0.028;
            break;
        }
        case 'ultimate': {
            const windup = Math.max(0.01, f.stats.ult.windup);
            // Separa Azul y Rojo, une las manos y libera Púrpura con dos dedos.
            const open = poseEase(t / (windup * 0.3));
            const merge = poseEase((t - windup * 0.27) / (windup * 0.52));
            const release = poseEase((t - windup + 0.07) / 0.07);
            const settle = poseEase((t - windup - 0.28) / 0.60);
            const split = open * (1 - merge), focus = merge * (1 - release);
            const held = release * (1 - settle);
            p.armL = [0.18 - split * 0.71 - focus * 0.63, split * 0.24 - focus * 0.58, 0.04 + split * 0.5];
            p.armR = [0.08 - split * 0.72 - focus * 0.64 - held * 1.21, -split * 0.24 + focus * 0.58 + held * 0.24, -0.04 - split * 0.5];
            p.foreL = [0.16 - split * 0.4 - focus * 0.68, -focus * 0.18, 0];
            p.foreR = [0.05 - split * 0.4 - focus * 0.59 + held * 0.43, focus * 0.18, 0];
            p.handL = [-focus * 0.13, -split * 0.2 - focus * 0.27, 0];
            p.handR = [-focus * 0.13 + held * 0.14, split * 0.2 + focus * 0.27, held * 0.14];
            p.reachL = [0.18 + split * 0.54 - focus * 0.44, -0.73 + split * 0.54 + focus * 0.54, 0.34 + split * 0.17 + focus * 0.29, 0.95, 0.31];
            p.reachR = [-0.17 - split * 0.54 + focus * 0.43 + held * 0.47, -0.70 + split * 0.46 + focus * 0.49 + held * 0.41, 0.36 + split * 0.13 + focus * 0.28 + held * 0.54, 0.95, 0.31];
            gojoGesture(p, 'R', held * 0.8);
            p.chest = [0.04 * focus + 0.09 * held, -0.09 * split + held * 0.18, 0];
            p.spine = [held * 0.08, 0, 0]; p.head = [0.12 * focus - 0.065 * held, -0.09 * held, 0];
            p.legL = [0.08, -0.05, 0.10]; p.legR = [-0.14, 0.05, -0.12];
            p.shinL = [0.13, 0, 0]; p.shinR = [0.16, 0, 0];
            const recoil = release * Math.exp(-Math.max(0, t - windup) * 11);
            h.y = -0.035 - focus * 0.016; h.z = -recoil * 0.065;
            break;
        }
    }
    return result;
}

function luffyPose(f, t, c) {
    const result = humanPose(f, t, c), p = result.pose, h = result.body;
    poseFist(p, 'L'); poseFist(p, 'R');
    switch (f.state) {
        case 'idle': {
            const bounce = sin(c * 4.5), transfer = sin(c * 2.25);
            p.armL = [-0.22 + bounce * 0.05, -0.15, 0.13]; p.foreL = [-0.38, 0.03, 0];
            p.armR = [-0.10 - bounce * 0.06, 0.09, -0.13]; p.foreR = [-0.46, -0.02, 0];
            p.handL = [0.1, -0.12, 0.085]; p.handR = [0.12, 0.13, -0.085];
            p.spine = [0.08, transfer * 0.10, transfer * 0.05];
            p.chest = [-0.025, -0.11 - transfer * 0.045, -transfer * 0.025];
            p.head = [-0.07, 0.075, -transfer * 0.035];
            p.legL = [0.08 - bounce * 0.04, 0, 0.14]; p.legR = [-0.15 - bounce * 0.035, 0, -0.14];
            p.shinL = [0.19 - bounce * 0.06, 0, 0]; p.shinR = [0.22 - bounce * 0.06, 0, 0];
            h.y = -0.07 + bounce * 0.026;
            break;
        }
        case 'run': {
            const { forward, phase } = f.gait || { forward: 1, phase: c * 13.2 };
            const drive = Math.max(0, Math.min(1, forward));
            const swing = Math.cos(phase) * drive;
            p.armL[0] += swing * 0.18; p.armL[2] += drive * 0.04;
            p.armR[0] -= swing * 0.18; p.armR[2] -= drive * 0.04;
            p.foreL[0] = p.foreL[0] * 0.64 + swing * 0.15;
            p.foreR[0] = p.foreR[0] * 0.64 - swing * 0.15;
            p.spine[0] += drive * 0.07; p.head[0] -= drive * 0.05;
            p.handL = [swing * 0.14, 0, 0.09]; p.handR = [-swing * 0.14, 0, -0.09];
            break;
        }
        case 'attack': {
            const phase = strikePhase(f, t), { hit, recover } = phase;
            const wind = phase.wind * poseEase(t / (phase.smash ? 0.09 : 0.035));
            const left = f.animStep === 1, heavy = f.animStep === 2;
            const hand = left ? 'L' : 'R', free = left ? 'R' : 'L', sign = left ? 1 : -1;
            p.chest = [hit * 0.11, sign * (wind * (heavy ? 0.57 : 0.30) - hit * 0.53), sign * wind * 0.12];
            p.spine = [hit * 0.1 + wind * 0.08, sign * (wind * 0.12 - hit * 0.20), -sign * hit * 0.05];
            p['arm' + hand] = [wind * (heavy ? 0.76 : 0.24) - hit * (heavy ? 1.26 : 1.02), -sign * hit * 0.07, sign * wind * 0.25];
            p['fore' + hand] = [-wind * 0.72 + hit * (heavy ? 0.30 : 0.45) - recover * 0.26, 0, 0];
            p['hand' + hand] = [wind * 0.11 - hit * 0.10, 0, sign * 0.04];
            p['arm' + free] = [-0.26 + hit * (heavy ? 0.46 : 0.18), sign * 0.10, -sign * 0.12];
            p['fore' + free] = [-0.47, 0, 0];
            p['reach' + hand] = [
                sign * (wind * (heavy ? 0.52 : 0.26) - hit * 0.27),
                -0.32 - wind * (heavy ? 0.2 : 0.03) + hit * (heavy ? 0.44 : 0.16),
                0.53 + hit * (heavy ? 0.47 : 0.42) - wind * (heavy ? 0.64 : 0.29), 0.96, heavy ? 0.54 : 0.32,
            ];
            p['reach' + free] = [sign * 0.14, -0.15 - hit * 0.21, 0.45 - hit * 0.24, 0.82, 0.20];
            p.legL = [sign * 0.20, 0, 0.16]; p.legR = [-sign * 0.20, 0, -0.16];
            p.shinL = [0.16 + wind * 0.22, 0, 0]; p.shinR = [0.17 + wind * 0.25, 0, 0];
            p.head = [-0.12 - hit * 0.06, sign * (hit * 0.20 - wind * 0.17), 0];
            h.y = -0.06 - wind * (heavy ? 0.085 : 0.027) + hit * (heavy ? 0.12 : 0.04);
            h.z = hit * (heavy ? 0.22 : 0.12) - wind * 0.08;
            break;
        }
        case 'blast': {
            // Pistola de goma: el hombro se adelanta y el codo vuelve al cuerpo.
            const release = poseEase(t / 0.025), retract = poseEase((t - 0.10) / 0.19);
            const reach = release * (1 - retract);
            p.spine = [0.12 + reach * 0.19, 0.19 * reach, -0.06 * reach];
            p.chest = [-0.02, 0.43 * reach, -reach * 0.015];
            p.armR = [-0.35 - reach * 0.84 + retract * 0.22, 0.10, -0.11 * (1 - reach)];
            p.foreR = [-0.38 + reach * 0.9, 0, 0];
            p.handR = [-0.10 * reach, 0, 0];
            p.armL = [-0.21 + reach * 0.24, -0.10, 0.14]; p.foreL = [-0.45, 0, 0];
            p.reachR = [0.12 + reach * 0.04, -0.26 - reach * 0.09, 0.52 + reach * 0.45, 0.98, 0.43];
            p.reachL = [-0.16 + reach * 0.28, -0.20 - reach * 0.31, 0.51 - reach * 0.35, 0.85, 0.19];
            p.head = [-0.1 - reach * 0.09, -0.22 * reach, 0];
            p.legL = [-0.17, 0, 0.16]; p.legR = [0.12, 0, -0.16];
            p.shinL = [0.25, 0, 0]; p.shinR = [0.22, 0, 0];
            h.y = -0.07; h.z = reach * 0.14;
            break;
        }
        case 'guard': {
            const recoil = guardRecoil(f);
            p.armL = [-0.48, -0.18, 0.12]; p.foreL = [-0.70, -0.04, 0];
            p.armR = [-0.38, 0.18, -0.12]; p.foreR = [-0.64, 0.04, 0];
            p.handL = [0.16, 0, 0.10]; p.handR = [0.16, 0, -0.10];
            p.reachL = [-0.19, 0.14, 0.41 - recoil * 0.12, 0.95, 0.36];
            p.reachR = [0.20, 0.10, 0.46 - recoil * 0.16, 0.95, 0.36];
            p.spine = [0.18 - recoil * 0.1, -0.09, 0.035]; p.chest = [0.08, 0.05, 0];
            p.head = [-0.12, 0.04, -0.02];
            p.legL = [0.06, -0.09, 0.17]; p.legR = [-0.19, 0.09, -0.17];
            p.shinL = [0.25, 0, 0]; p.shinR = [0.32, 0, 0];
            h.y = -0.11 - recoil * 0.03; h.z = -0.04 - recoil * 0.10;
            break;
        }
        case 'charge': {
            const brace = poseEase(t / 0.45);
            const tremor = sin(c * 20) * 0.012 * brace;
            p.spine = [0.12 + brace * 0.13, 0, 0]; p.chest = [-0.1 - brace * 0.07, 0, 0];
            p.armL = [0.1 + brace * 0.22, 0, 0.25 + tremor]; p.foreL = [-0.44, 0, 0];
            p.armR = [0.1 + brace * 0.22, 0, -0.25 - tremor]; p.foreR = [-0.44, 0, 0];
            p.legL = [0.05, 0, 0.19]; p.legR = [-0.15, 0, -0.19];
            p.shinL = [0.21 + brace * 0.08, 0, 0]; p.shinR = [0.23 + brace * 0.08, 0, 0];
            p.head = [-0.08 - brace * 0.12, 0, tremor];
            h.y = -0.06 - brace * 0.06 + tremor;
            break;
        }
        case 'ultimate': {
            const windup = Math.max(0.01, f.stats.ult.windup);
            const release = poseEase((t - windup + 0.09) / 0.09);
            const coil = poseEase(t / (windup * 0.77)) * (1 - release);
            const retract = poseEase((t - windup - 0.30) / 0.52);
            const reach = release * (1 - retract);
            p.chest = [0.035 - coil * 0.09, -0.52 * coil + 0.42 * reach, 0.13 * coil - reach * 0.07];
            p.spine = [0.09 + coil * 0.14 + reach * 0.22, -coil * 0.16 + reach * 0.13, 0];
            p.armR = [-0.15 + coil * 1.03 - reach * 1.06, 0.11 - coil * 0.2, -0.095 - coil * 0.23];
            p.foreR = [-0.44 - coil * 0.34 + reach * 1.00, 0, 0];
            p.handR = [coil * 0.13 - reach * 0.075, 0, -coil * 0.10];
            p.armL = [-0.22 - coil * 0.27 + reach * 0.47, -0.15, 0.12 + reach * 0.05];
            p.foreL = [-0.42 - coil * 0.09 + reach * 0.14, 0, 0];
            p.reachR = [0.10 - coil * 0.54 + reach * 0.03, -0.24 - coil * 0.23 - reach * 0.16, 0.47 - coil * 0.70 + reach * 0.49, 0.98, 0.43];
            p.reachL = [-0.13 - coil * 0.08 + reach * 0.32, -0.23 + coil * 0.15 - reach * 0.30, 0.42 + coil * 0.16 - reach * 0.43, 0.85, 0.28];
            p.head = [-0.08 - reach * 0.11, 0.23 * coil - reach * 0.19, 0];
            p.legL = [-0.18 - reach * 0.16, -0.05, 0.17]; p.legR = [0.12 + reach * 0.18, 0.05, -0.19];
            p.shinL = [0.23 + coil * 0.21 + reach * 0.12, 0, 0];
            p.shinR = [0.24 + coil * 0.26 - reach * 0.10, 0, 0];
            h.z = -coil * 0.13 + reach * 0.19; h.y = -0.065 - coil * 0.10 + reach * 0.035;
            break;
        }
    }
    return result;
}

const guardedHumanPose = withGuardedSteps(humanPose);
const POSE_FN = {
    goku: guardedHumanPose,
    vegeta: guardedHumanPose,
    naruto: guardedHumanPose,
    tanjiro: guardedHumanPose,
    gojo: withGuardedSteps(gojoPose),
    luffy: withGuardedSteps(luffyPose),
    pikachu: pikachuPose,
    charizard: charizardPose,
};

// Velocidad con la que se llega a cada pose: los golpes son secos, el reposo es suave.
const POSE_RATE = { attack: 34, blast: 30, dash: 26, hurt: 28, guard: 22, ultimate: 16, charge: 12, run: 14, ko: 7, idle: 9 };

window.PoseRig = PoseRig;
window.POSE_FN = POSE_FN;
window.POSE_RATE = POSE_RATE;
