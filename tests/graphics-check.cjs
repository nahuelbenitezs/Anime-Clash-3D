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
for (let round = 0; round < 12; round++) {
    for (const kind of ['beam', 'bolt', 'flame', 'water', 'vortex']) {
        const beam = fx.spawnBeam(owner, origin, direction, { kind, duration: .3, radius: 1.2, length: 20 });
        assert.equal(beam.kind, kind);
        assert.equal(beam.radius, 1.2);
        assert(beam.direction.equals(direction));
        beam.ownMaterials.forEach(material => material.addEventListener('dispose', () => disposed++));
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
assert(disposed >= 12 * 5 * 2, 'Transient beam materials must be released');
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
console.log('OK: five beam kinds, 12 round resets, material cleanup and six fighter animations');
