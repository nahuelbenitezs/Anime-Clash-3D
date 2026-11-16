// Rig de poses: anima por huesos a los seis luchadores con el mismo sistema.
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
        legL: 'upper_legL', shinL: 'lower_legL', legR: 'upper_legR', shinR: 'lower_legR',
    },
    naruto: {
        spine: 'Spine02_', chest: 'Spine01_', neck: 'neck_', head: 'Head_',
        armL: 'LeftArm_', foreL: 'LeftForeArm_', armR: 'RightArm_', foreR: 'RightForeArm_',
        legL: 'LeftUpLeg_', shinL: 'LeftLeg_', legR: 'RightUpLeg_', shinR: 'RightLeg_',
    },
    vegeta: {
        spine: 'mixamorigSpine_', chest: 'mixamorigSpine2_', neck: 'mixamorigNeck_', head: 'mixamorigHead_',
        armL: 'mixamorigLeftArm_', foreL: 'mixamorigLeftForeArm_', armR: 'mixamorigRightArm_', foreR: 'mixamorigRightForeArm_',
        legL: 'mixamorigLeftUpLeg_', shinL: 'mixamorigLeftLeg_', legR: 'mixamorigRightUpLeg_', shinR: 'mixamorigRightLeg_',
    },
    tanjiro: {
        spine: 'C_Spine_1', chest: 'C_Spine_3', neck: 'C_Neck_1', head: 'C_Head_1',
        armL: 'L_UpperArm_1', foreL: 'L_Forearm_1', armR: 'R_UpperArm_1', foreR: 'R_Forearm_1',
        legL: 'L_Thigh_1', shinL: 'L_Knee_1', legR: 'R_Thigh_1', shinR: 'R_Knee_1',
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

const _q = new THREE.Quaternion();
const _qw = new THREE.Quaternion();
const _e = new THREE.Euler();

class PoseRig {
    constructor(root, bones) {
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
    }

    static forModel(type, model) {
        const map = BONE_MAPS[type];
        const all = [];
        model.traverse(o => { if (o.isBone) all.push(o); });
        const bones = {};
        for (const key in map) bones[key] = all.find(b => b.name.startsWith(map[key])) || null;
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
    const smash = (f.pendingHit && f.pendingHit.smash) || ((f.attackCd || 0) + t > 0.65);
    const impact = smash ? 0.2 : 0.1;
    const windEnd = impact - 0.035;
    const extension = poseEase((t - windEnd) / 0.035);
    const recover = poseEase((t - impact - 0.025) / Math.max(0.035, 0.26 - impact - 0.025));
    return { wind: 1 - extension, hit: extension * (1 - recover * 0.82), recover };
}

function dashBank(f) {
    if (!f.dashDir) return 0;
    return Math.max(-1, Math.min(1,
        f.dashDir.x * Math.cos(f.rotationY || 0) - f.dashDir.z * Math.sin(f.rotationY || 0)));
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
            const s = sin(c * cadence), lift = sin(c * cadence + 0.55);
            p.legL = [-s * 0.72 - 0.07, 0, 0.035]; p.shinL = [Math.max(0, lift) * 1.05, 0, 0];
            p.legR = [s * 0.72 - 0.07, 0, -0.035]; p.shinR = [Math.max(0, -lift) * 1.05, 0, 0];
            p.armL = [s * 0.55 - 0.12, 0, 0.05]; p.foreL = [-0.55, 0, 0];
            p.armR = [-s * 0.55 - 0.12, 0, -0.05]; p.foreR = [-0.55, 0, 0];
            p.spine = [0.22, s * 0.09, -s * 0.035];
            p.chest = [-0.08, -s * 0.13, 0];
            p.head = [-0.1, s * 0.035, s * 0.025];
            if (ninja) {
                p.armL = [0.95 + s * 0.08, 0, 0.18]; p.armR = [0.95 - s * 0.08, 0, -0.18];
                p.foreL = [-0.08, 0, 0]; p.foreR = [-0.08, 0, 0];
                p.spine = [0.42, s * 0.06, -s * 0.035];
            } else if (swordsman) {
                // La espada se mantiene estable mientras las piernas amortiguan la carrera.
                p.armR = [-0.35, -0.1, -0.15]; p.foreR = [-0.65, 0, 0];
                p.armL = [s * 0.38 - 0.2, 0, 0.08];
            }
            h.y = Math.abs(s) * 0.07;
            h.rz = -s * 0.025;
            break;
        }
        case 'attack': {
            const step = f.animStep;
            const { wind, hit, recover } = strikePhase(f, t);
            const side = step === 1 ? -1 : 1;
            p.legL = [0.12, 0, 0.11]; p.legR = [-0.18, 0, -0.13];
            p.shinL = [0.18, 0, 0]; p.shinR = [0.2, 0, 0];
            p.head = [-0.08, -side * hit * 0.12, 0];
            if (swordsman) {
                // Tajo diagonal y recuperación de la espada.
                p.spine = [0.08 + hit * 0.12, side * (-wind * 0.25 + hit * 0.28), side * hit * 0.08];
                p.chest = [hit * 0.13, side * (-wind * 0.45 + hit * 0.75), 0];
                p.armR = [-0.5 - wind * 0.5 - hit * 0.55, -0.2 + hit * 0.35, -wind * 0.35 + hit * 0.5];
                p.foreR = [-0.65 + hit * 0.45, 0, 0];
                p.armL = [-0.4 - wind * 0.3 - hit * 0.5, -0.15, 0.25];
                p.foreL = [-0.75 + hit * 0.35, 0, 0];
                h.y = -0.04 + hit * (step === 2 ? 0.15 : 0.03);
            } else if (step === 0 || step === 1) {
                p.chest = [0.1, side * (-wind * 0.42 + hit * 0.62), side * hit * 0.04];
                p.spine = [0.06 + hit * 0.1, side * hit * 0.12, 0];
                const strikingArm = [wind * 0.25 - hit * 1.3 - recover * 0.25, -side * hit * 0.18, -side * hit * 0.04];
                const strikingFore = [-1.1 + hit * 1.02, 0, 0];
                p[step === 0 ? 'armR' : 'armL'] = strikingArm;
                p[step === 0 ? 'foreR' : 'foreL'] = strikingFore;
                p[step === 0 ? 'armL' : 'armR'] = [-0.45, 0, side * 0.12];
                p[step === 0 ? 'foreL' : 'foreR'] = [-1.0, 0, 0];
                h.y = -wind * 0.035 + hit * 0.015;
            } else {
                p.spine = [-0.18 - hit * 0.12, -wind * 0.38 + hit * 0.6, -hit * 0.09];
                p.legR = [wind * 0.58 - hit * 1.55, 0, -hit * 0.2];
                p.shinR = [wind * 1.1 + (1 - hit) * 0.05, 0, 0];
                p.armL = [-0.7, 0, 0.18]; p.foreL = [-0.7, 0, 0];
                p.armR = [0.2 + hit * 0.25, 0, -0.35]; p.foreR = [-0.35, 0, 0];
                h.y = -wind * 0.06 + hit * 0.18;
            }
            h.z = hit * 0.12 - wind * 0.035;
            break;
        }
        case 'blast': {
            const release = poseEase(t / 0.065), settle = poseEase((t - 0.17) / 0.13);
            p.chest = [0, 0.4 * (1 - settle), 0];
            p.armR = [-0.8 - release * 0.65 + settle * 0.7, -0.2, 0];
            p.foreR = [-0.6 * (1 - release) - settle * 0.65, 0, 0];
            p.armL = [-0.25, 0, 0.18]; p.foreL = [-0.65, 0, 0];
            p.spine = [-sin(Math.min(1, t / 0.3) * PI) * 0.1, 0, 0];
            h.z = -sin(Math.min(1, t / 0.3) * PI) * 0.07;
            break;
        }
        case 'guard': {
            p.armL = [-0.9, -0.35, 0]; p.foreL = [-1.35, 0, 0];
            p.armR = [-0.9, 0.35, 0];  p.foreR = [-1.35, 0, 0];
            p.spine = [0.3, 0, 0];
            p.head = [-0.15, 0, 0];
            h.y = -0.08;
            break;
        }
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
            const firing = t > f.stats.ult.windup;
            const gather = poseEase(t / Math.max(0.01, f.stats.ult.windup));
            const recoil = firing ? Math.exp(-(t - f.stats.ult.windup) * 8) : 0;
            if (!firing) {
                if (finalFlash) {
                    // Brazos abiertos en cruz antes de unir las manos
                    const close = poseEase((gather - 0.58) / 0.42);
                    p.armL = [-close * 1.15, -close * 0.2, 1.15 * (1 - close)];
                    p.armR = [-close * 1.15, close * 0.2, -1.15 * (1 - close)];
                    p.foreL = [-close * 0.25, 0, 0]; p.foreR = [-close * 0.25, 0, 0];
                    p.chest = [-0.14, 0, 0]; p.head = [-0.08, 0, 0];
                } else if (ninja) {
                    // Palma derecha abierta; la izquierda moldea el chakra encima.
                    p.chest = [0.05, -0.32, 0];
                    p.armR = [-0.55, -0.18, -0.28]; p.foreR = [-0.9, 0.15, 0];
                    p.armL = [-0.85, -0.45, 0.18]; p.foreL = [-1.05, 0, 0];
                    p.head = [0.08, -0.12, 0];
                } else if (swordsman) {
                    p.chest = [0.05, -0.55 * gather, 0];
                    p.spine = [0.14, -0.18, 0];
                    p.armR = [-0.45 - gather * 0.65, -0.25, -0.22]; p.foreR = [-0.9, 0, 0];
                    p.armL = [-0.65 - gather * 0.3, -0.5, 0.3]; p.foreL = [-1.1, 0, 0];
                    p.head = [-0.1, 0.15, 0];
                } else {
                    // Manos juntas a un costado, recogiendo energía
                    p.chest = [0, -0.65 - gather * 0.1, 0];
                    p.armR = [0.45, -0.5, 0]; p.foreR = [-1.25 - gather * 0.08, 0, 0];
                    p.armL = [-0.25, -0.8, 0]; p.foreL = [-1.15, 0, 0];
                    p.head = [-0.06, 0.26, 0];
                }
            } else {
                p.chest = [0.05, 0, 0];
                p.armL = [-1.5, -0.25, 0]; p.foreL = [-0.05, 0, 0];
                p.armR = [-1.5, 0.25, 0];  p.foreR = [-0.05, 0, 0];
                p.spine = [0.14 - recoil * 0.18, 0, 0];
                p.head = [-0.08, 0, 0];
                if (ninja) {
                    p.chest = [0.12, 0.35, 0];
                    p.armL = [0.15, 0, 0.25]; p.foreL = [-0.6, 0, 0];
                    p.armR = [-1.45, -0.1, 0];
                } else if (swordsman) {
                    p.chest = [0.12, 0.45 + sin(c * 8) * 0.04, -0.08];
                    p.armR = [-1.05, 0.25, 0.35]; p.foreR = [-0.2, 0, 0];
                    p.armL = [-0.9, -0.1, 0.2]; p.foreL = [-0.5, 0, 0];
                }
            }
            p.legL = [0.1, 0, 0.18]; p.legR = [-0.1, 0, -0.18];
            p.shinL = [0.2, 0, 0]; p.shinR = [0.22, 0, 0];
            h.y = -0.08 + (firing ? sin(c * 30) * 0.008 : sin(c * 20) * 0.007 * gather);
            h.z = -recoil * 0.13;
            break;
        }
        case 'hurt': {
            p.spine = [-0.45, 0, 0.12];
            p.head = [-0.4, 0, 0];
            p.armL = [0.6, 0, 0.5]; p.armR = [0.6, 0, -0.5];
            const recoil = Math.exp(-t * 7);
            p.shinL = [0.2, 0, 0]; p.shinR = [0.1, 0, 0];
            h.rx = -0.14 - recoil * 0.08;
            h.y = -0.05 * (1 - recoil);
            break;
        }
        case 'dash': {
            const bank = dashBank(f), acceleration = sin(Math.min(1, t / 0.22) * PI);
            p.spine = [0.5 + acceleration * 0.12, -bank * 0.12, -bank * 0.12];
            p.armL = [0.9, 0, 0.2]; p.armR = [0.9, 0, -0.2];
            p.foreL = [-0.25, 0, 0]; p.foreR = [-0.25, 0, 0];
            p.legL = [0.5, 0, 0]; p.shinL = [0.9, 0, 0];
            p.legR = [-0.6, 0, 0]; p.shinR = [0.5, 0, 0];
            p.head = [-0.16, bank * 0.08, 0];
            h.y = 0.08 + acceleration * 0.1;
            h.rz = -bank * 0.14;
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
                p.armR = [-0.4, -0.1, -0.15]; p.foreR = [-0.65, 0, 0];
                p.armL = [-0.28, 0, 0.1];
            } else if (ninja) {
                p.armL = [-0.25, 0, 0.1]; p.foreL = [-0.7, 0, 0];
                p.armR = [0.12, -0.1, -0.08]; p.foreR = [-0.3, 0, 0];
            }
            p.head = [breath * 0.015, 0, -breath * 0.012];
            p.legL = [0.08, 0, 0.06]; p.legR = [-0.08, 0, -0.06];
            p.shinL = [0.09, 0, 0]; p.shinR = [0.08, 0, 0];
            h.y = breath * 0.013 - 0.025;
        }
    }
    return { pose: p, body: h };
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
            const s = sin(c * 18);
            p.legL = [-s * 0.8, 0, 0]; p.legR = [s * 0.8, 0, 0];
            p.shinL = [Math.max(0, sin(c * 18 + 0.6)) * 0.65, 0, 0];
            p.shinR = [Math.max(0, -sin(c * 18 + 0.6)) * 0.65, 0, 0];
            p.spine = [0.4, s * 0.06, -s * 0.05];
            p.head = [-0.12, 0, s * 0.035];
            p.armL = [0.9, 0, -0.3]; p.armR = [0.9, 0, 0.3];
            p.tail1 = [-0.3, s * 0.3, 0];
            p.tail2 = [sin(c * 18 - 0.5) * 0.16, -s * 0.18, 0];
            p.earL = [sin(c * 18 - 0.4) * 0.16, 0, 0];
            p.earR = [sin(c * 18 - 0.8) * 0.16, 0, 0];
            h.y = Math.abs(s) * 0.15;
            h.rz = -s * 0.025;
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
            p.armL = [-0.6, 0.5, -0.2]; p.armR = [-0.6, -0.5, 0.2];
            p.spine = [0.5, 0, 0];
            p.earL = [0.7, 0, 0]; p.earR = [0.7, 0, 0];
            h.y = -0.05;
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
            p.spine = [-0.6, 0, 0];
            p.head = [-0.3, 0, 0];
            p.armL = [0.1, 0, 0.3]; p.armR = [0.1, 0, -0.3];
            h.rx = -0.25;
            break;
        }
        case 'dash': {
            const bank = dashBank(f);
            p.spine = [0.9, 0, 0];
            p.head = [-0.25, bank * 0.12, 0];
            p.armL = [1.2, 0, -0.1]; p.armR = [1.2, 0, 0.1];
            p.tail1 = [-0.8, 0, 0];
            p.earL = [0.75, 0, 0]; p.earR = [0.75, 0, 0];
            h.y = 0.25;
            h.rz = -bank * 0.2;
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
            const s = sin(c * 9);
            p.legL = [-s * 0.6, 0, 0]; p.legR = [s * 0.6, 0, 0];
            p.spine = [0.2, s * 0.1, 0];
            p.neck = [-0.08, -s * 0.07, 0];
            p.head = [-0.04, -s * 0.03, 0];
            p.shinL = [Math.max(0, sin(c * 9 + 0.5)) * 0.6, 0, 0];
            p.shinR = [Math.max(0, -sin(c * 9 + 0.5)) * 0.6, 0, 0];
            p.armL = [s * 0.25, 0, 0]; p.armR = [-s * 0.25, 0, 0];
            const beat = sin(c * 9);
            p.wingL = [0, beat * 0.3, beat * 0.25]; p.wingR = [0, -beat * 0.3, -beat * 0.25];
            h.y = 0.06 + Math.abs(s) * 0.1;
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
            p.wingL = [0.1, 0.9, 0]; p.wingR = [0.1, -0.9, 0];
            p.armL = [-0.7, 0.4, 0]; p.armR = [-0.7, -0.4, 0];
            p.neck = [0.3, 0, 0];
            p.spine = [0.2, 0, 0];
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
            p.neck = [-0.5, 0, 0.2];
            p.chest = [-0.3, 0, 0];
            p.wingL = [0, -0.3, 0.3]; p.wingR = [0, 0.3, -0.3];
            h.rx = -0.12;
            break;
        }
        case 'dash': {
            const beat = sin(c * 22);
            const bank = dashBank(f);
            p.wingL = [0, 0.4, beat * 0.3]; p.wingR = [0, -0.4, -beat * 0.3];
            p.spine = [0.45, -bank * 0.1, -bank * 0.1];
            p.neck = [0.18, bank * 0.12, 0];
            p.legL = [0.4, 0, 0.12]; p.legR = [0.4, 0, -0.12];
            p.shinL = [0.7, 0, 0]; p.shinR = [0.7, 0, 0];
            p.tail1 = [0.1, -bank * 0.2, 0];
            h.y = 0.45;
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

const POSE_FN = { goku: humanPose, vegeta: humanPose, naruto: humanPose, tanjiro: humanPose, pikachu: pikachuPose, charizard: charizardPose };

// Velocidad con la que se llega a cada pose: los golpes son secos, el reposo es suave.
const POSE_RATE = { attack: 34, blast: 30, dash: 26, hurt: 28, guard: 22, ultimate: 16, charge: 12, run: 14, ko: 7, idle: 9 };

window.PoseRig = PoseRig;
window.POSE_FN = POSE_FN;
window.POSE_RATE = POSE_RATE;
