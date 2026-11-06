// Rig de poses: anima por huesos a los cuatro luchadores con el mismo sistema.
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

function humanPose(f, t, c) {
    const p = {};
    const h = bodyOffset();
    const breath = sin(c * 3.2);
    const finalFlash = f.type === 'vegeta';

    switch (f.state) {
        case 'run': {
            const s = sin(c * 13);
            p.legL = [-s * 0.75 - 0.05, 0, 0]; p.shinL = [Math.max(0, s) * 0.9, 0, 0];
            p.legR = [s * 0.75 - 0.05, 0, 0];  p.shinR = [Math.max(0, -s) * 0.9, 0, 0];
            p.armL = [s * 0.6, 0, 0];  p.armR = [-s * 0.6, 0, 0];
            p.spine = [0.22, s * 0.12, 0];
            h.y = Math.abs(sin(c * 13)) * 0.09;
            break;
        }
        case 'attack': {
            const step = f.animStep;
            const wind = t < 0.06;
            if (step === 0) {
                p.chest = [0.1, wind ? -0.5 : 0.7, 0];
                p.armR = wind ? [0.5, 0, 0] : [-1.25, -0.2, 0];
                p.foreR = wind ? [-1.2, 0, 0] : [-0.1, 0, 0];
                p.armL = [-0.2, 0, 0];
            } else if (step === 1) {
                p.chest = [0.1, wind ? 0.5 : -0.7, 0];
                p.armL = wind ? [0.5, 0, 0] : [-1.25, 0.2, 0];
                p.foreL = wind ? [-1.2, 0, 0] : [-0.1, 0, 0];
                p.armR = [-0.2, 0, 0];
            } else {
                p.spine = [-0.3, wind ? -0.5 : 0.6, 0];
                p.legR = wind ? [0.6, 0, 0] : [-1.55, 0, -0.2];
                p.shinR = wind ? [1.2, 0, 0] : [0.05, 0, 0];
                p.armL = [-0.8, 0, 0];
                p.armR = [0.4, 0, -0.4];
                h.y = wind ? 0 : 0.18;
            }
            break;
        }
        case 'blast': {
            p.chest = [0, 0.55, 0];
            p.armR = [-1.45, -0.2, 0];
            p.foreR = [-0.05, 0, 0];
            p.armL = [0.2, 0, 0.3];
            p.spine = [t < 0.08 ? -0.1 : 0.12, 0, 0];
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
            const tremble = sin(c * 60) * 0.02;
            p.armL = [0.15, 0, 0.55 + tremble]; p.foreL = [-0.3, 0, 0];
            p.armR = [0.15, 0, -0.55 - tremble]; p.foreR = [-0.3, 0, 0];
            p.chest = [-0.18, 0, 0];
            p.head = [-0.3, 0, tremble];
            p.legL = [0, 0, 0.12]; p.legR = [0, 0, -0.12];
            h.y = -0.1 + tremble;
            break;
        }
        case 'ultimate': {
            const firing = t > f.stats.ult.windup;
            if (!firing) {
                if (finalFlash) {
                    // Brazos abiertos en cruz antes de unir las manos
                    p.armL = [0, 0, 1.2];  p.armR = [0, 0, -1.2];
                    p.chest = [-0.15, 0, 0];
                } else {
                    // Manos juntas a un costado, recogiendo energía
                    p.chest = [0, -0.75, 0];
                    p.armR = [0.55, -0.5, 0]; p.foreR = [-1.3, 0, 0];
                    p.armL = [-0.25, -0.9, 0]; p.foreL = [-1.2, 0, 0];
                }
            } else {
                p.chest = [0.05, 0, 0];
                p.armL = [-1.5, -0.25, 0]; p.foreL = [-0.05, 0, 0];
                p.armR = [-1.5, 0.25, 0];  p.foreR = [-0.05, 0, 0];
                p.spine = [0.14, 0, 0];
            }
            p.legL = [0.1, 0, 0.18]; p.legR = [-0.1, 0, -0.18];
            h.y = -0.08;
            break;
        }
        case 'hurt': {
            p.spine = [-0.45, 0, 0.12];
            p.head = [-0.4, 0, 0];
            p.armL = [0.6, 0, 0.5]; p.armR = [0.6, 0, -0.5];
            h.rx = -0.14;
            break;
        }
        case 'dash': {
            p.spine = [0.65, 0, 0];
            p.armL = [1.0, 0, 0.2]; p.armR = [1.0, 0, -0.2];
            p.legL = [0.5, 0, 0]; p.shinL = [0.9, 0, 0];
            p.legR = [-0.6, 0, 0]; p.shinR = [0.5, 0, 0];
            h.y = 0.14;
            break;
        }
        case 'ko': {
            p.armL = [0, 0, 0.9]; p.armR = [0, 0, -0.9];
            p.head = [-0.3, 0.3, 0];
            h.rx = -PI / 2; h.y = 0.2;
            break;
        }
        default: { // idle
            p.chest = [0.02 + breath * 0.02, 0, 0];
            p.armL = [breath * 0.03, 0, 0];
            p.armR = [-breath * 0.03, 0, 0];
            h.y = breath * 0.012;
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
            p.spine = [0.45, 0, 0];
            p.armL = [0.9, 0, -0.3]; p.armR = [0.9, 0, 0.3];
            p.tail1 = [-0.3, s * 0.3, 0];
            h.y = Math.abs(s) * 0.2;
            break;
        }
        case 'attack': {
            const step = f.animStep;
            const wind = t < 0.06;
            if (step === 2) {
                // Coletazo girando sobre sí mismo
                h.ry = Math.min(1, t / 0.2) * PI * 2;
                h.y = 0.3;
                p.tail1 = [-0.5, 0, 0]; p.tail2 = [-0.3, 0, 0];
            } else {
                const sign = step === 0 ? 1 : -1;
                p.spine = [0.3, wind ? -0.4 * sign : 0.5 * sign, 0];
                if (step === 0) { p.armR = wind ? [0.9, 0, 0.3] : [-1.2, 0, 0]; }
                else { p.armL = wind ? [0.9, 0, -0.3] : [-1.2, 0, 0]; }
                h.z = wind ? 0 : 0.2;
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
            p.armL = [0, 0, firing ? 0.2 : 0.05]; p.armR = [0, 0, firing ? -0.2 : -0.05];
            p.spine = [firing ? -0.25 : 0.25, 0, 0];
            p.tail1 = [-0.7, sin(c * 40) * 0.15, 0];
            h.y = firing ? 0.35 + sin(c * 30) * 0.03 : 0;
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
            p.spine = [0.9, 0, 0];
            p.armL = [1.2, 0, -0.1]; p.armR = [1.2, 0, 0.1];
            p.tail1 = [-0.8, 0, 0];
            h.y = 0.25;
            break;
        }
        case 'ko': {
            p.armL = [0, 0, 0.2]; p.armR = [0, 0, -0.2];
            h.rx = -PI / 2; h.y = 0.35;
            break;
        }
        default: {
            p.chest = [breath * 0.03, 0, 0];
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

    switch (f.state) {
        case 'run': {
            const s = sin(c * 9);
            p.legL = [-s * 0.6, 0, 0]; p.legR = [s * 0.6, 0, 0];
            p.spine = [0.2, s * 0.1, 0];
            p.armL = [s * 0.25, 0, 0]; p.armR = [-s * 0.25, 0, 0];
            const beat = sin(c * 9);
            p.wingL = [0, beat * 0.3, beat * 0.25]; p.wingR = [0, -beat * 0.3, -beat * 0.25];
            h.y = 0.06 + Math.abs(s) * 0.1;
            break;
        }
        case 'attack': {
            const step = f.animStep;
            const wind = t < 0.07;
            if (step === 2) {
                // Coletazo: gira con todo el cuerpo
                h.ry = Math.min(1, t / 0.24) * PI * 2;
                p.tail1 = [0.1, 0.3, 0]; p.tail2 = [0, 0.3, 0];
                h.y = 0.1;
            } else {
                const right = step === 0;
                p.chest = [0.2, wind ? (right ? -0.5 : 0.5) : (right ? 0.6 : -0.6), 0];
                if (right) { p.armR = wind ? [0.6, 0, -0.3] : [-1.1, -0.3, 0]; }
                else { p.armL = wind ? [0.6, 0, 0.3] : [-1.1, 0.3, 0]; }
                p.neck = [0.2, 0, 0];
                p.jaw = wind ? [0, 0, 0] : [0.3, 0, 0];
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
            p.neck = firing ? [0.45, sin(c * 3) * 0.08, 0] : [-0.6, 0, 0];
            p.head = firing ? [0.18, 0, 0] : [-0.3, 0, 0];
            p.jaw = firing ? [0.6, 0, 0] : [0.15, 0, 0];
            p.chest = firing ? [0.2, 0, 0] : [-0.2, 0, 0];
            p.wingL = [0, 0.3, 0.2]; p.wingR = [0, -0.3, -0.2];
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
            p.wingL = [0, 0.4, beat * 0.3]; p.wingR = [0, -0.4, -beat * 0.3];
            p.spine = [0.45, 0, 0];
            p.neck = [0.3, 0, 0];
            h.y = 0.45;
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

const POSE_FN = { goku: humanPose, vegeta: humanPose, pikachu: pikachuPose, charizard: charizardPose };

// Velocidad con la que se llega a cada pose: los golpes son secos, el reposo es suave.
const POSE_RATE = { attack: 34, blast: 30, dash: 26, hurt: 28, guard: 22, ultimate: 16, charge: 12, run: 14, ko: 7, idle: 9 };

window.PoseRig = PoseRig;
window.POSE_FN = POSE_FN;
window.POSE_RATE = POSE_RATE;
