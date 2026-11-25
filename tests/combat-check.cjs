const fs=require('fs'),vm=require('vm'),assert=require('assert');global.THREE=require('../vendor/three.min.js');global.window=global;window.soundManager={startKiCharge(){},stopKiCharge(){},playPunch(){},playDash(){},playExplosion(){},playUltimateBeam(){},playBlast(){}};
for(const p of ['js/roster.js','js/rig.js','js/characters.js','js/online.js','js/game.js']) vm.runInThisContext(fs.readFileSync(p,'utf8'),{filename:p});
const vfx={emitAura(){},emitLightning(){},createHitSparks(){},shake(){},spawnBeam(){},spawnProjectile(){}};
function fighter(x){let f=Object.create(Fighter.prototype);Object.assign(f,{type:'goku',stats:FIGHTER_STATS.goku,isPlayer:x<0,position:new THREE.Vector3(x,0,0),velocity:new THREE.Vector3(),dashDir:new THREE.Vector3(),group:new THREE.Group(),state:'idle',stateTimer:0,rotationY:x<0?Math.PI/2:-Math.PI/2,targetRotationY:x<0?Math.PI/2:-Math.PI/2,health:150,maxHealth:150,ki:30,maxKi:100,speed:6.6,attackCd:0,blastCd:0,dashCd:0,comboWindow:0,dashInvuln:0,invuln:0,perfectGuard:0,sparking:false,sparkingCharge:0,dragonDash:false,pendingHit:null,pendingUlt:null,isDead:false,isCharging:false,events:{},vfx,bodyOffset:{y:0,z:0,rx:0,ry:0,rz:0}});f.updatePose=()=>{};return f}
let a=fighter(-4),b=fighter(4);a.ki=14;assert.equal(a.rush(b),false);assert.equal(a.ki,14);a.ki=50;assert.equal(a.rush(b),true);assert.equal(a.ki,35);let start=a.position.x;a.update(.1,b);assert(a.position.x>start);assert.equal(a.dragonDash,true);
a=fighter(-1);b=fighter(1);b.guard(true);a.setAnimation('attack');let hp=b.health;assert.equal(b.receiveHit({amount:10,attacker:a,kind:'melee'}),0);assert.equal(b.health,hp);assert.equal(a.state,'hurt');b.guard(false);b.guard(true);b.perfectGuard=0;assert(b.receiveHit({amount:10,attacker:a,kind:'melee'})>0);
a=fighter(-4);b=fighter(4);a.ki=100;a.chargeKi(true);for(let i=0;i<11;i++){a.chargeKi(true);a.update(.1,b)} assert.equal(a.sparking,true);let energy=a.ki;a.update(.2,b);assert(a.ki<energy);let data=packFighter(a);assert.equal(data[9],1);let guest=fighter(-4);guest.setNetTarget(data,NET_STATES);assert.equal(guest.sparking,true);a.ki=.5;a.update(.1,b);assert.equal(a.sparking,false);
console.log('OK: persecucion, coste, contra, guardia, maximo poder y sincronizacion');

a=fighter(-4);b=fighter(2);a.ki=30;assert(a.vanish(b));assert.equal(a.ki,5);assert(Math.abs(a.position.x-(b.position.x+1.5))<1e-8);assert.equal(a.dashCd,a.stats.dashCooldown);
a=fighter(-4);b=fighter(10.5);b.rotationY=-Math.PI/2;a.ki=30;assert.equal(a.vanish(b),false);assert.equal(a.ki,30);
a=fighter(-1);b=fighter(1);b.rotationY=Math.PI/2;b.guard(true);assert.equal(b.receiveHit({amount:10,attacker:a,kind:'melee'}),10);
a=fighter(-4);b=fighter(4);a.ki=100;a.chargeKi(true);a.update(.6,b);a.chargeKi(false);assert.equal(a.sparkingCharge,0);a.chargeKi(true);a.update(.6,b);assert.equal(a.sparking,false);
console.log('OK: desaparición, límites de arena, golpes por la espalda e interrupción de carga');

a=fighter(-1);b=fighter(1);a.ki=14;assert.equal(a.smash(b),false);a.ki=50;assert(a.smash(b));assert.equal(a.ki,35);assert.equal(a.pendingHit.smash,true);a.update(.21,b);assert(b.health<135);assert(b.velocity.x>0);
a=fighter(-1);b=fighter(1);a.state='hurt';a.ki=29;assert.equal(a.revenge(b),false);a.ki=40;assert(a.revenge(b));assert.equal(a.ki,10);assert(b.health<150);assert.equal(a.state,'idle');
for(const type of ['goku','vegeta','naruto','tanjiro','pikachu','charizard']) for(const state of ['idle','run','attack','blast','guard','charge','ultimate','hurt','dash','ko']) {const f=fighter(-1);f.type=type;f.state=state;f.animStep=0;let result=POSE_FN[type](f,.1,1);for(const angles of Object.values(result.pose)) assert(angles.every(Number.isFinite));}
console.log('OK: impacto, contraataque y poses de los seis luchadores');

// Las texturas de huesos del clon se liberan; los materiales de la caché se conservan.
a=fighter(-1);a.scene=new THREE.Scene();a.scene.add(a.group);a.joints={};a.glbModel=new THREE.Group();
let released=0,sharedDisposed=0;const sharedMaterial=new THREE.MeshBasicMaterial();sharedMaterial.addEventListener('dispose',()=>sharedDisposed++);
const mesh=new THREE.Mesh(new THREE.BoxGeometry(),sharedMaterial);mesh.skeleton={dispose(){released++}};a.glbModel.add(mesh);a.group.add(a.glbModel);
a.dispose();a.dispose();assert.equal(released,1);assert.equal(sharedDisposed,0);assert.equal(a.scene.children.length,0);
console.log('OK: limpieza de esqueletos sin destruir materiales compartidos');

// Prueba el daño a través de la misma función que usa la partida del anfitrión.
for (const type of ['gojo', 'luffy']) {
    const caster = fighter(-4), rival = fighter(3);
    caster.type = type;
    caster.stats = FIGHTER_STATS[type];
    let beam;
    caster.vfx = { ...vfx, spawnBeam(owner, startPos, direction, config) {
        beam = { owner, startPos, direction, ...config, hitStart: 0, hitEnd: 0, hitRadius: config.radius };
    } };
    caster.ki = 100;
    assert(caster.triggerUltimate(rival));
    assert.equal(caster.ki, 100 - caster.stats.ult.cost);
    caster.update(caster.stats.ult.windup + .01, rival);
    assert.equal(beam.kind, caster.stats.ult.kind);
    const game = Object.assign(Object.create(Game.prototype), {
        player: caster, enemy: rival, vfx: { ...vfx, beams: [beam], projectiles: [] }, onFighterHit() {},
    });
    game.checkCollisions(1 / 60);
    assert.equal(rival.health, rival.maxHealth, 'el efecto todavía no llegó');
    beam.hitStart = 3;
    beam.hitEnd = 7;
    rival.dashInvuln = .1;
    game.checkCollisions(1 / 60);
    assert.equal(rival.health, rival.maxHealth, 'la esquiva evita el impacto');
    rival.dashInvuln = 0;
    game.checkCollisions(1 / 60);
    game.checkCollisions(1 / 60);
    assert.equal(rival.health, rival.maxHealth - caster.stats.ult.damage, 'aplica un solo impacto');
}
console.log('OK: Púrpura y King Kong Gun alcanzan al rival y aplican un solo impacto');

// La cadencia depende del recorrido real y la dirección queda en los ejes del luchador.
const walker = fighter(-1);
const dt = 1 / 60;
Object.assign(walker, {
    state: 'run', animClock: 0, lastPosePosition: walker.position.clone(), gait: { side: 0, forward: 0, phase: 0 },
    rig: { apply() {} }, glbHolder: new THREE.Group(),
});
function poseFrame() { Fighter.prototype.updatePose.call(walker, dt); }
walker.position.z += walker.speed * dt;
poseFrame();
assert(walker.gait.side < 0 && Math.abs(walker.gait.forward) < 1e-10, 'el desplazamiento lateral respeta la orientación');
const lastStep = walker.gait.phase;
poseFrame();
assert.equal(walker.gait.phase, lastStep, 'no avanza el ciclo al quedarse contra una pared');
walker.position.x += 8;
poseFrame();
assert.equal(walker.gait.phase, lastStep, 'el teletransporte no cuenta como una zancada');
walker.state = 'guard';
walker.position.x -= walker.speed * dt * 0.3;
poseFrame();
assert(walker.gait.forward < 0 && walker.gait.phase > lastStep, 'los pasos en guardia conservan su dirección y avanzan el ciclo');

const host = fighter(-1), observer = fighter(-1);
host.ki = 100;
assert(host.smash(fighter(1)));
observer.setNetTarget(packFighter(host), NET_STATES);
assert(observer.animSmash, 'el invitado distingue el golpe de impacto de un remate de combo');
host.setAnimation('hurt');
host.hurtDuration = 0.5;
host.setHitReaction(-1, 0, 1);
observer.setNetTarget(packFighter(host), NET_STATES);
assert.equal(observer.hurtDuration, 0.5);
assert.equal(observer.hitReaction.forward, -1);
console.log('OK: pasos direccionales, saltos de posición y estados de animación online');
