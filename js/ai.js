// IA de la CPU. Usa la misma API de Fighter que el jugador, así que no hace
// trampa: tiene los mismos enfriamientos, el mismo ki y el mismo daño.
const AI_LEVELS = {
    easy:   { react: 0.42, guard: 0.15, dodge: 0.15, think: 0.55, idle: 0.35, aggression: 0.7 },
    normal: { react: 0.26, guard: 0.35, dodge: 0.40, think: 0.34, idle: 0.14, aggression: 1.0 },
    hard:   { react: 0.13, guard: 0.60, dodge: 0.70, think: 0.20, idle: 0.03, aggression: 1.15 },
};

class FighterAI {
    constructor(self, foe, vfx, level = 'normal') {
        this.self = self;
        this.foe = foe;
        this.vfx = vfx;
        this.level = AI_LEVELS[level] || AI_LEVELS.normal;
        this.profile = self.stats.ai;
        this.plan = 'approach';
        this.planTimer = 0;
        this.reactTimer = -1;
        this.reactTo = null;
        this.guardTimer = 0;
        this.strafeSign = Math.random() < 0.5 ? 1 : -1;
        this.clock = Math.random() * 10;
    }

    // Amenaza visible ahora: rayo, proyectil que viene de frente o golpe en curso.
    senseThreat(dist) {
        const s = this.self, f = this.foe;
        if (f.state === 'ultimate' || this.vfx.beams.some(b => b.owner === f)) return 'beam';
        for (const p of this.vfx.projectiles) {
            if (p.owner !== f) continue;
            const dx = s.position.x - p.mesh.position.x;
            const dz = s.position.z - p.mesh.position.z;
            const d = Math.hypot(dx, dz);
            if (d > 7) continue;
            const speed = Math.hypot(p.velocity.x, p.velocity.z) || 1;
            const lateral = Math.abs(dx * p.velocity.z - dz * p.velocity.x) / speed;
            if (lateral < 1.7 && dx * p.velocity.x + dz * p.velocity.z > 0) return 'shot';
        }
        if (f.state === 'attack' && dist < f.stats.reach + 0.6) return 'melee';
        return null;
    }

    sidestep() {
        const s = this.self, f = this.foe;
        const dx = f.position.x - s.position.x;
        const dz = f.position.z - s.position.z;
        const d = Math.hypot(dx, dz) || 1;
        // Perpendicular a la línea entre los dos, hacia el lado con más ring libre.
        let sx = -dz / d, sz = dx / d;
        if (Math.abs(s.position.z + sz * 3) > 5.5) { sx = -sx; sz = -sz; }
        return { x: sx, z: sz };
    }

    respond(threat) {
        const s = this.self;
        const roll = Math.random();
        if (threat === 'beam' || threat === 'shot') {
            if (roll < this.level.dodge) {
                const side = this.sidestep();
                s.chargeKi(false);
                s.dash(side.x, side.z, this.foe);
            } else if (roll < this.level.dodge + this.level.guard) {
                this.guardTimer = threat === 'beam' ? 1.2 : 0.45;
            }
        } else if (threat === 'melee' && roll < this.level.guard) {
            this.guardTimer = 0.4;
        }
    }

    decide(dist) {
        const s = this.self, f = this.foe, p = this.profile;
        const roll = Math.random();
        const ultReady = s.ki >= s.stats.ult.cost;
        const blastReady = s.ki >= s.stats.blast.cost && dist <= (s.stats.blast.range ?? Infinity);
        const foeOpen = f.state === 'hurt' || f.state === 'charge' || f.state === 'blast';

        this.planTimer = this.level.think * (0.7 + Math.random() * 0.8);

        if (Math.random() < this.level.idle) { this.plan = 'wait'; return; }
        if (ultReady && dist < s.stats.ult.length - 1 && (foeOpen || roll < 0.3)) { this.plan = 'ultimate'; return; }

        const inReach = dist < s.stats.reach - 0.2;
        const tooClose = dist < p.range - 1.2;
        const farAway = dist > p.range + 1.5;

        if (inReach && Math.random() < p.aggression * this.level.aggression * (this.plan === 'combo' ? 0.35 : 1)) {
            this.plan = 'combo';
            this.planTimer = 0.75;
            return;
        }
        if (tooClose) { this.plan = 'retreat'; return; }
        if (farAway) {
            if (blastReady && roll < p.blastBias) { this.plan = 'shoot'; return; }
            if (s.ki < p.chargeBelow && dist > 6 && roll < p.blastBias + 0.35) { this.plan = 'charge'; this.planTimer = 0.7 + Math.random() * 0.5; return; }
            this.plan = 'approach';
            return;
        }
        if (blastReady && roll < p.blastBias) { this.plan = 'shoot'; return; }
        this.plan = dist > s.stats.reach ? 'approach' : 'strafe';
    }

    update(dt) {
        const s = this.self, f = this.foe;
        if (s.isDead || f.isDead) { s.chargeKi(false); s.guard(false); return; }
        this.clock += dt;

        const dx = f.position.x - s.position.x;
        const dz = f.position.z - s.position.z;
        const dist = Math.hypot(dx, dz) || 0.001;
        const nx = dx / dist, nz = dz / dist;

        // Reaccionar con demora, como una persona: ver, procesar, actuar.
        const threat = this.senseThreat(dist);
        if (threat !== this.reactTo) {
            this.reactTo = threat;
            this.reactTimer = threat ? this.level.react : -1;
        }
        if (this.reactTimer >= 0) {
            this.reactTimer -= dt;
            if (this.reactTimer < 0) this.respond(threat);
        }

        if (this.guardTimer > 0) {
            this.guardTimer -= dt;
            s.chargeKi(false);
            s.guard(true);
            s.move(0, 0, dt);
            return;
        }
        s.guard(false);

        this.planTimer -= dt;
        if (this.planTimer <= 0) this.decide(dist);

        const strafe = Math.sin(this.clock * 1.7) * 0.45 * this.strafeSign;
        switch (this.plan) {
            case 'approach': {
                s.chargeKi(false);
                if (dist > 7 && s.ki >= 35 && Math.random() < dt * this.level.aggression * 0.35) s.rush(f);
                s.move(nx - nz * strafe, nz + nx * strafe, dt);
                break;
            }
            case 'retreat': {
                s.chargeKi(false);
                s.move(-nx - nz * strafe, -nz + nx * strafe, dt);
                break;
            }
            case 'strafe': {
                s.chargeKi(false);
                s.move(-nz * this.strafeSign, nx * this.strafeSign, dt);
                break;
            }
            case 'combo': {
                s.chargeKi(false);
                if (dist < s.stats.reach) { s.attack(f); s.move(0, 0, dt); }
                else s.move(nx, nz, dt);
                break;
            }
            case 'shoot': {
                s.chargeKi(false);
                if (dist <= (s.stats.blast.range ?? Infinity)) s.shootBlast(f);
                s.move(0, 0, dt);
                this.plan = 'wait';
                break;
            }
            case 'charge': {
                s.chargeKi(true);
                break;
            }
            case 'ultimate': {
                s.chargeKi(false);
                s.triggerUltimate(f);
                this.plan = 'wait';
                break;
            }
            default: {
                s.chargeKi(false);
                s.move(0, 0, dt);
            }
        }
    }
}

window.FighterAI = FighterAI;
window.AI_LEVELS = AI_LEVELS;
