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
    window.modelLoader.preload(['goku', 'vegeta', 'naruto', 'tanjiro', 'pikachu', 'charizard'], (progress) => {
        bar.style.width = Math.round(progress * 100) + '%';
    }).then(() => {
        window.portraits = window.makePortraits(Object.keys(FIGHTER_STATS));
        // No ampliamos los modelos de respaldo si falló la descarga de un GLB.
        if (window.modelLoader.cache.goku) document.getElementById('title-hero').style.backgroundImage = `url(${window.portraits.goku})`;
        if (window.modelLoader.cache.vegeta) document.getElementById('title-rival').style.backgroundImage = `url(${window.portraits.vegeta})`;
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
    game.online = new OnlineMatch(game);
    game.animate();

    // Loading → Title
    runLoadingScreen(() => {
        buildRoster('roster-p1', selectedPlayer, (char) => {
            selectedPlayer = char;
            if (game.online.active) game.online.pick(char);
        });
        buildRoster('roster-p2', selectedEnemy, (char) => { selectedEnemy = char; });
        game.showTitleBackdrop();
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('title-screen').classList.remove('hidden');
        game.online.joinFromUrl();
    });

    // ── TITLE SCREEN ───────────────────────────
    document.getElementById('btn-play').addEventListener('click', () => {
        document.getElementById('title-screen').classList.add('hidden');
        document.getElementById('selection-screen').classList.remove('hidden');
    });

    document.getElementById('btn-selection-back').addEventListener('click', () => {
        document.getElementById('selection-screen').classList.add('hidden');
        document.getElementById('title-screen').classList.remove('hidden');
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
        if (game.online.active) { game.online.markReady(); return; }
        game.startMatch(selectedPlayer, selectedEnemy, difficulty);
    });

    // ── GAME OVER BUTTONS ──────────────────────
    document.getElementById('btn-rematch').addEventListener('click', () => {
        if (game.online.active) { game.online.markReady(); return; }
        document.getElementById('gameover-screen').classList.add('hidden');
        game.startMatch(selectedPlayer, selectedEnemy);
    });

    document.getElementById('btn-back-sel').addEventListener('click', () => {
        if (game.online.active) { game.online.backToSelection(); return; }
        document.getElementById('gameover-screen').classList.add('hidden');
        document.getElementById('selection-screen').classList.remove('hidden');
    });

    // Los celulares y tabletas necesitan orientación horizontal. La pausa de CPU
    // es explícita: al volver a horizontal el jugador decide cuándo continuar.
    const rotWarn = document.getElementById('rotate-warn');
    const checkOrientation = () => {
        const portrait = document.body.classList.contains('touch-device') && window.innerHeight > window.innerWidth;
        if (portrait && !document.body.classList.contains('orientation-locked')) game.input.reset();
        rotWarn.classList.toggle('hidden', !portrait);
        document.body.classList.toggle('orientation-locked', portrait);
        if (portrait && game.mode === 'cpu' && (game.state === 'fighting' || game.state === 'countdown')) game.togglePause();
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

// Marca a un luchador en un roster sin disparar la selección (lo usa el modo online).
function setRosterSelection(rosterId, type) {
    document.querySelectorAll(`#${rosterId} .char-tile`).forEach(tile => {
        const active = tile.dataset.char === type;
        tile.classList.toggle('selected', active);
        tile.setAttribute('aria-pressed', String(active));
    });
    const feature = document.getElementById(rosterId === 'roster-p1' ? 'feature-p1' : 'feature-p2');
    const fighter = FIGHTER_STATS[type];
    if (feature && fighter) {
        feature.style.setProperty('--fighter-color', '#' + fighter.aura.toString(16).padStart(6, '0'));
        feature.innerHTML = `<strong>${fighter.label}</strong><span>DEFINITIVO <b>${fighter.ult.name}</b></span>`;
    }
}
window.setRosterSelection = setRosterSelection;

function buildRoster(rosterId, selected, onChange) {
    const roster = document.getElementById(rosterId);
    roster.innerHTML = '';
    Object.keys(FIGHTER_STATS).forEach(type => {
        const s = FIGHTER_STATS[type];
        const tile = document.createElement('button');
        tile.className = 'char-tile' + (type === selected ? ' selected' : '');
        tile.dataset.char = type;
        tile.setAttribute('aria-label', s.label);
        tile.setAttribute('aria-pressed', String(type === selected));
        tile.style.setProperty('--tile', '#' + s.aura.toString(16).padStart(6, '0'));
        const stats = statPercents(s).map(([k, v]) => `<span class="stat-row">${k}<b style="--pct:${v}%"></b></span>`).join('');
        tile.innerHTML = `<div class="tile-art" style="background-image:url(${window.portraits[type]})"></div>
            <div class="tile-name">${s.label}</div>
            <div class="tile-stats">${stats}</div>`;
        tile.addEventListener('click', () => {
            setRosterSelection(rosterId, type);
            onChange(type);
            window.buzz(18);
        });
        roster.appendChild(tile);
    });
    setRosterSelection(rosterId, selected);
}
