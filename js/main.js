// ═══════════════════════════════════════════════════
// MAIN ENTRY POINT — Anime Clash 3D
// ═══════════════════════════════════════════════════

window.soundManager = new SoundManager();

let game = null;
let selectedPlayer = 'goku';
let selectedEnemy  = 'pikachu';

// ─────────────────────────────────────────────────
//  LOADING SCREEN  (simulated progress + real init)
// ─────────────────────────────────────────────────
function runLoadingScreen(onComplete) {
    const bar  = document.getElementById('load-bar');
    const text = document.getElementById('load-text');
    text.textContent = 'Cargando luchadores...';
    window.modelLoader.preload(['goku', 'pikachu', 'charizard'], (progress) => {
        bar.style.width = Math.round(progress * 100) + '%';
    }).then(() => {
        window.portraits = window.makePortraits(Object.keys(FIGHTER_STATS));
        bar.style.width = '100%';
        text.textContent = '¡Listo!';
        setTimeout(onComplete, 250);
    });
}

// ─────────────────────────────────────────────────
//  INIT  (runs on DOMContentLoaded)
// ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // One-time audio unlock on first touch/click
    const audioUnlock = () => {
        window.soundManager.init();
        document.removeEventListener('touchstart', audioUnlock);
        document.removeEventListener('click',      audioUnlock);
    };
    document.addEventListener('touchstart', audioUnlock, { passive: true });
    document.addEventListener('click',      audioUnlock);

    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) document.body.classList.add('touch-device');

    // Boot Game object (starts rendering loop immediately)
    game = new Game();
    window.game = game;
    game.animate();

    // Loading → Title
    runLoadingScreen(() => {
        buildRoster('roster-p1', selectedPlayer, (char) => { selectedPlayer = char; });
        buildRoster('roster-p2', selectedEnemy, (char) => { selectedEnemy = char; });
        game.showTitleBackdrop();
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('title-screen').classList.remove('hidden');
    });

    // ── TITLE SCREEN ───────────────────────────
    document.getElementById('btn-play').addEventListener('click', () => {
        document.getElementById('title-screen').classList.add('hidden');
        document.getElementById('selection-screen').classList.remove('hidden');
    });

    // ── CHARACTER SELECTION ────────────────────
    let difficulty = 'normal';
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            difficulty = btn.dataset.level;
        });
    });

    document.getElementById('btn-start-fight').addEventListener('click', () => {
        game.startMatch(selectedPlayer, selectedEnemy, difficulty);
    });

    // ── GAME OVER BUTTONS ──────────────────────
    document.getElementById('btn-rematch').addEventListener('click', () => {
        document.getElementById('gameover-screen').classList.add('hidden');
        game.startMatch(selectedPlayer, selectedEnemy);
    });

    document.getElementById('btn-back-sel').addEventListener('click', () => {
        document.getElementById('gameover-screen').classList.add('hidden');
        document.getElementById('selection-screen').classList.remove('hidden');
    });

    // ── ORIENTATION HINT ───────────────────────
    const rotWarn = document.getElementById('rotate-warn');
    const checkOrientation = () => {
        const portrait = window.innerHeight > window.innerWidth * 1.1;
        rotWarn.classList.toggle('hidden', !portrait);
        // Es un aviso, no un bloqueo: en vertical también se puede jugar
        clearTimeout(rotWarn._timer);
        if (portrait) rotWarn._timer = setTimeout(() => rotWarn.classList.add('hidden'), 3500);
    };
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    checkOrientation();
});

// ─────────────────────────────────────────────────
//  Pantalla de selección: se arma con las estadísticas reales del roster
// ─────────────────────────────────────────────────
function statPercents(s) {
    const pct = (v, min, max) => Math.round(25 + 75 * (v - min) / (max - min));
    return [
        ['VID', pct(s.hp, 120, 152)],
        ['FUE', pct(s.power, 0.9, 1.1)],
        ['VEL', pct(s.speed, 5.4, 8)],
    ];
}

function buildRoster(rosterId, selected, onChange) {
    const roster = document.getElementById(rosterId);
    roster.innerHTML = '';
    Object.keys(FIGHTER_STATS).forEach(type => {
        const s = FIGHTER_STATS[type];
        const tile = document.createElement('button');
        tile.className = 'char-tile' + (type === selected ? ' selected' : '');
        tile.dataset.char = type;
        tile.style.setProperty('--tile', '#' + s.aura.toString(16).padStart(6, '0'));
        const stats = statPercents(s).map(([k, v]) => `<span class="stat-row">${k}<b style="--pct:${v}%"></b></span>`).join('');
        tile.innerHTML = `<div class="tile-art" style="background-image:url(${window.portraits[type]})"></div>
            <div class="tile-name">${s.label}</div>
            <div class="tile-stats">${stats}</div>`;
        tile.addEventListener('click', () => {
            roster.querySelectorAll('.char-tile').forEach(t => t.classList.remove('selected'));
            tile.classList.add('selected');
            onChange(type);
            if (navigator.vibrate) navigator.vibrate(18);
        });
        roster.appendChild(tile);
    });
}
