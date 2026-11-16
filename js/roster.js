// Estadísticas de cada luchador. Es la única fuente de verdad del equilibrio:
// el combate, la IA y la pantalla de selección leen de acá.
const FIGHTER_STATS = {
    goku: {
        label: 'GOKU',
        hp: 150, speed: 6.6, power: 1.05, reach: 2.5, kiCharge: 24,
        hitRadius: 0.8, attackRate: 1.0, dashCooldown: 0.85,
        height: 2.1, muzzleY: 1.3,
        aura: 0xffd700,
        blast: { cost: 15, damage: 9, speed: 17, size: 0.4, cooldown: 0.5 },
        ult: { name: 'KAMEHAMEHA', cost: 70, damage: 30, windup: 0.65, duration: 1.3, radius: 1.0, length: 26, color: 0x4fc3ff },
        ai: { range: 2.2, blastBias: 0.35, chargeBelow: 55, aggression: 0.7 },
    },
    vegeta: {
        label: 'VEGETA',
        hp: 144, speed: 6.3, power: 1.07, reach: 2.4, kiCharge: 26,
        hitRadius: 0.8, attackRate: 1.0, dashCooldown: 0.85,
        height: 2.05, muzzleY: 1.3,
        aura: 0x6a8dff,
        blast: { cost: 16, damage: 10, speed: 19, size: 0.42, cooldown: 0.55 },
        ult: { name: 'FINAL FLASH', cost: 75, damage: 34, windup: 0.85, duration: 1.0, radius: 1.25, length: 26, color: 0xffe066 },
        ai: { range: 2.2, blastBias: 0.3, chargeBelow: 60, aggression: 0.85 },
    },
    naruto: {
        label: 'NARUTO', hp: 140, speed: 7.2, power: 1.0, reach: 2.4, kiCharge: 27,
        hitRadius: 0.8, attackRate: 1.05, dashCooldown: 0.75, height: 2.0, muzzleY: 1.2,
        aura: 0xff9e20,
        blast: { cost: 14, damage: 9, speed: 19, size: 0.4, cooldown: 0.48 },
        ult: { name: 'RASENGAN', cost: 70, damage: 30, windup: 0.6, duration: 1.2, radius: 1.0, length: 20, color: 0x55caff },
        ai: { range: 2.3, blastBias: 0.35, chargeBelow: 55, aggression: 0.8 },
    },
    tanjiro: {
        label: 'TANJIRO', hp: 138, speed: 7.0, power: 1.03, reach: 2.55, kiCharge: 25,
        hitRadius: 0.8, attackRate: 1.05, dashCooldown: 0.8, height: 2.0, muzzleY: 1.2,
        aura: 0x38c5b5,
        blast: { cost: 15, damage: 9, speed: 18, size: 0.4, cooldown: 0.5 },
        ult: { name: 'RESPIRACIÓN DEL AGUA', cost: 70, damage: 30, windup: 0.65, duration: 1.2, radius: 1.1, length: 20, color: 0x42bfff },
        ai: { range: 2.4, blastBias: 0.3, chargeBelow: 55, aggression: 0.8 },
    },
    pikachu: {
        label: 'PIKACHU',
        hp: 122, speed: 8.0, power: 0.92, reach: 2.25, kiCharge: 30,
        hitRadius: 0.62, attackRate: 1.15, dashCooldown: 0.68,
        height: 1.5, muzzleY: 0.8,
        aura: 0x00e5ff,
        blast: { cost: 10, damage: 8, speed: 23, size: 0.3, cooldown: 0.38 },
        ult: { name: 'IMPACTRUENO', kind: 'bolt', cost: 60, damage: 27, windup: 0.4, duration: 1.1, radius: 1.15, length: 22, color: 0xfff176 },
        ai: { range: 4.2, blastBias: 0.65, chargeBelow: 50, aggression: 0.75 },
    },
    charizard: {
        label: 'CHARIZARD',
        hp: 152, speed: 5.5, power: 1.1, reach: 2.7, kiCharge: 20,
        hitRadius: 0.95, attackRate: 0.92, dashCooldown: 1.0,
        height: 3.0, muzzleY: 1.9,
        aura: 0xff5a1f,
        blast: { cost: 20, damage: 13, speed: 14, size: 0.55, cooldown: 0.75 },
        ult: { name: 'LANZALLAMAS', kind: 'flame', cost: 80, damage: 32, windup: 0.7, duration: 1.5, radius: 1.7, length: 15, color: 0xff7a1a },
        ai: { range: 2.8, blastBias: 0.3, chargeBelow: 65, aggression: 0.75 },
    },
};

window.FIGHTER_STATS = FIGHTER_STATS;
