// Estadísticas de cada luchador. Es la única fuente de verdad del equilibrio:
// el combate, la IA y la pantalla de selección leen de acá.
const FIGHTER_STATS = {
    goku: {
        label: 'GOKU',
        hp: 100, speed: 6.6, power: 1.0, reach: 2.5, kiCharge: 24,
        height: 2.2, muzzleY: 1.35,
        aura: 0xffd700,
        blast: { cost: 15, damage: 12, speed: 17, size: 0.4, cooldown: 0.5 },
        ult: { name: 'KAMEHAMEHA', cost: 70, damage: 38, windup: 0.65, duration: 1.3, radius: 1.0, length: 26, color: 0x4fc3ff },
        ai: { range: 2.2, blastBias: 0.35, chargeBelow: 55, aggression: 0.7 },
    },
    vegeta: {
        label: 'VEGETA',
        hp: 95, speed: 6.3, power: 1.12, reach: 2.4, kiCharge: 26,
        height: 2.05, muzzleY: 1.3,
        aura: 0x6a8dff,
        blast: { cost: 16, damage: 14, speed: 19, size: 0.42, cooldown: 0.55 },
        ult: { name: 'FINAL FLASH', cost: 75, damage: 45, windup: 0.85, duration: 1.0, radius: 1.25, length: 26, color: 0xffe066 },
        ai: { range: 2.2, blastBias: 0.3, chargeBelow: 60, aggression: 0.85 },
    },
    pikachu: {
        label: 'PIKACHU',
        hp: 82, speed: 8.0, power: 0.82, reach: 2.1, kiCharge: 28,
        height: 1.35, muzzleY: 0.8,
        aura: 0x00e5ff,
        blast: { cost: 10, damage: 10, speed: 23, size: 0.3, cooldown: 0.38 },
        ult: { name: 'IMPACTRUENO', cost: 60, damage: 30, windup: 0.4, duration: 1.1, radius: 1.15, length: 22, color: 0xfff176 },
        ai: { range: 6.5, blastBias: 0.6, chargeBelow: 50, aggression: 0.5 },
    },
    charizard: {
        label: 'CHARIZARD',
        hp: 118, speed: 5.5, power: 1.22, reach: 3.0, kiCharge: 20,
        height: 2.6, muzzleY: 1.7,
        aura: 0xff5a1f,
        blast: { cost: 20, damage: 17, speed: 14, size: 0.55, cooldown: 0.75 },
        ult: { name: 'LANZALLAMAS', cost: 80, damage: 42, windup: 0.7, duration: 1.5, radius: 1.7, length: 15, color: 0xff7a1a },
        ai: { range: 2.8, blastBias: 0.3, chargeBelow: 65, aggression: 0.75 },
    },
};

window.FIGHTER_STATS = FIGHTER_STATS;
