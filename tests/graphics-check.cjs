const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
global.THREE = require('../vendor/three.min.js');
global.window = global;
window.inkColor = hex => new THREE.Color(hex).convertSRGBToLinear();
window.canvasTexture = () => new THREE.Texture();
window.buzz = () => {};
for (const file of ['js/roster.js', 'js/vfx.js', 'js/rig.js']) {
    vm.runInThisContext(fs.readFileSync(file, 'utf8'), { filename: file });
}
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1.8, .1, 180);
camera.position.set(0, 5, 14);
const fx = new VFXManager(scene);
const origin = new THREE.Vector3(-3, 1, 0);
const direction = new THREE.Vector3(1, 0, 0);
const owner = { type: 'goku', stats: FIGHTER_STATS.goku, position: new THREE.Vector3(-3, 0, 0),
    state: 'charge', stateTimer: .2, rotationY: Math.PI / 2, auraColor: 0xffd700 };
fx.updateFighterEffects([owner], 1 / 60, camera);
const stableChildren = scene.children.length;
let disposed = 0;
let expectedDisposed = 0;
let sharedDisposed = 0;
Object.values(fx.shared).forEach(resource => resource.addEventListener('dispose', () => sharedDisposed++));
for (let round = 0; round < 12; round++) {
    for (const kind of ['beam', 'bolt', 'flame', 'water', 'vortex', 'hollow', 'rubber']) {
        const beam = fx.spawnBeam(owner, origin, direction, { kind, duration: .3, radius: 1.2, length: 20 });
        assert.equal(beam.kind, kind);
        assert.equal(beam.radius, 1.2);
        assert(beam.direction.equals(direction));
        beam.ownMaterials.forEach(material => material.addEventListener('dispose', () => disposed++));
        expectedDisposed += beam.ownMaterials.length;
    }
    fx.spawnProjectile(owner, origin, direction);
    fx.createHitSparks(origin, 0xffdd66, 24);
    for (let frame = 0; frame < 60; frame++) {
        fx.updateFighterEffects([owner], 1 / 60, camera);
        fx.update(1 / 60, camera);
    }
    assert.equal(fx.beams.length, 0, 'All beam kinds must expire');
    fx.clear();
    assert.equal(fx.projectiles.length + fx.bursts.length + fx.bolts.length, 0);
    assert.equal(scene.children.length, stableChildren, 'Round resets must not accumulate scene objects');
    assert.equal(fx.fighterFX[0].group.visible, false);
    assert(fx.pPos.every(Number.isFinite));
    assert(fx.pAlpha.every(Number.isFinite));
}
assert.equal(disposed, expectedDisposed, 'Every transient beam material must be released exactly once');
assert.equal(sharedDisposed, 0, 'Round cleanup must preserve shared geometry and materials');

function near(actual, expected, message) {
    assert(Math.abs(actual - expected) < 1e-6, message + ': ' + actual + ' != ' + expected);
}
// Mismo contrato de cápsula que consume Game: offsets sobre la dirección y
// radio alrededor del segmento. El halo y el brazo no tienen daño propio.
function touches(beam, worldPoint, targetRadius = 0) {
    const delta = worldPoint.clone().sub(beam.startPos);
    const along = delta.dot(beam.direction);
    const nearest = Math.max(beam.hitStart, Math.min(beam.hitEnd, along));
    return delta.addScaledVector(beam.direction, -nearest).length() <= beam.hitRadius + targetRadius;
}
const diagonal = new THREE.Vector3(.6, 0, -.8);
for (const kind of ['hollow', 'rubber']) {
    const beam = fx.spawnBeam(owner, origin, diagonal, { kind, duration: 1.2, radius: 1, length: 20 });
    near(beam.hitStart, 0, kind + ': initial segment starts at caster');
    near(beam.hitEnd, 0, kind + ': initial segment does not cover the full arena');
    assert(!touches(beam, origin.clone().addScaledVector(diagonal, 10)), kind + ': no invisible distant hit at launch');
    for (const dt of [1 / 60, .04, .1, .2]) {
        const previous = beam.hitCenter;
        fx.update(dt, camera);
        near(beam.hitStart, Math.min(previous, beam.hitCenter), kind + ': swept segment start');
        near(beam.hitEnd, Math.max(previous, beam.hitCenter), kind + ': swept segment end');
        const tip = kind === 'rubber' ? beam.special.fist : beam.head;
        near(tip.position.z, beam.hitCenter, kind + ': visual tip and damage center agree');
        near(beam.hitRadius, tip.scale.x * (kind === 'rubber' ? .85 : 1), kind + ': visual size and damage radius agree');
        scene.updateMatrixWorld(true);
        const tipWorld = tip.getWorldPosition(new THREE.Vector3());
        const expectedWorld = origin.clone().addScaledVector(diagonal, beam.hitCenter);
        near(tipWorld.distanceTo(expectedWorld), 0, kind + ': hit capsule follows rotated visual');
        assert(touches(beam, tipWorld), kind + ': visible tip must hit');
        assert(!touches(beam, tipWorld.clone().add(new THREE.Vector3(0, beam.hitRadius + 2, 0))), kind + ': no damage outside tip');
        if (beam.hitStart > beam.hitRadius + .1) assert(!touches(beam, origin), kind + ': trailing arm or glow must not hit');
    }
    fx.clear();
}
for (const kind of ['beam', 'water', 'flame', 'bolt', 'vortex']) {
    const beam = fx.spawnBeam(owner, origin, diagonal, { kind, length: 20, radius: 1.2 });
    fx.update(.1, camera);
    near(beam.hitStart, 0, kind + ': continuous volume start');
    near(beam.hitEnd, 20, kind + ': continuous volume end');
    near(beam.hitRadius, 1.2, kind + ': continuous volume radius');
    fx.clear();
}
for (const kind of ['rubber-shot', 'red']) {
    const shot = fx.spawnProjectile(owner, origin, diagonal, { kind, range: 5, speed: 20, size: .4 });
    let shotDisposed = 0;
    shot.ownMaterials.forEach(material => material.addEventListener('dispose', () => shotDisposed++));
    fx.update(.4, camera); // El cuadro excede el tiempo necesario para recorrer su alcance.
    near(shot.prevPosition.distanceTo(origin), 0, kind + ': swept segment starts before movement');
    near(shot.distance, 5, kind + ': max range clamps even with a long frame');
    near(shot.mesh.position.distanceTo(origin), 5, kind + ': rendered projectile never overshoots');
    assert(shot.rangeReached && fx.projectiles.includes(shot), kind + ': endpoint survives one collision check');
    if (kind === 'rubber-shot') {
        near(shot.special.arm.scale.z, 5, 'Elastic arm length matches the fist travel');
        scene.updateMatrixWorld(true);
        const armOrigin = shot.mesh.localToWorld(new THREE.Vector3(0, 0, -shot.distance));
        near(armOrigin.distanceTo(origin), 0, 'Elastic arm remains attached to its launch point');
        assert(shot.special.fist.children.length >= 6, 'Rubber shot has a visible fist, thumb and knuckles');
    } else {
        assert.equal(shot.color, 0xff244b, 'Red defaults to a red energy sphere');
        assert.equal(shot.halo.material.color.getHex(), shot.color, 'Red halo keeps the projectile color');
    }
    fx.update(1 / 60, camera);
    assert(!fx.projectiles.includes(shot), kind + ': endpoint expires on the next update');
    assert.equal(shotDisposed, shot.ownMaterials.length, kind + ': all projectile materials released once');
    fx.clear();
}
for (const kind of ['rubber-shot', 'red']) {
    const shot = fx.spawnProjectile(owner, origin, diagonal, { kind, range: 8, speed: 27 });
    fx.update(.08, camera);
    const first = shot.mesh.position.clone();
    near(first.distanceTo(origin), 2.16, kind + ': fast shot advances at configured speed');
    fx.update(.08, camera);
    near(shot.prevPosition.distanceTo(first), 0, kind + ': previous position advances every frame');
    near(shot.mesh.position.distanceTo(shot.prevPosition), 2.16, kind + ': swept segment spans the last fast frame');
    fx.clear();
}
assert.equal(sharedDisposed, 0, 'Special attack cleanup must preserve shared resources');
for (const type of Object.keys(FIGHTER_STATS)) {
    const f = { ...owner, type, stats: FIGHTER_STATS[type], animStep: 0 };
    for (const state of ['idle', 'run', 'attack', 'dash', 'guard', 'charge', 'ultimate', 'hurt', 'ko']) {
        f.state = state;
        for (const time of [0, .04, .1, .2, .5, 1, 2]) {
            f.stateTimer = time;
            const result = POSE_FN[type](f, time, 2);
            assert(Object.values(result.body).every(Number.isFinite), type + ': invalid body offset');
            assert(Object.values(result.pose).flat().every(Number.isFinite), type + ': invalid pose');
        }
    }
}
fx.setQuality(.35);
fx.update(1 / 60, camera);
console.log('OK: seven beam kinds, moving hit capsules, ranged elastic/red shots, 12 round resets and fighter animations');
