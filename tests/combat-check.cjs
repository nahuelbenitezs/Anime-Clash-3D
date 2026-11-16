const fs=require('fs'),vm=require('vm'),assert=require('assert');global.THREE=require('../vendor/three.min.js');global.window=global;window.soundManager={startKiCharge(){},stopKiCharge(){},playPunch(){},playDash(){},playExplosion(){},playUltimateBeam(){},playBlast(){}};
for(const p of ['js/roster.js','js/rig.js','js/characters.js','js/online.js']) vm.runInThisContext(fs.readFileSync(p,'utf8'),{filename:p});
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
