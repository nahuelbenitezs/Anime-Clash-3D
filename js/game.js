// ═══════════════════════════════════════════════════
// GAME ENGINE — Anime Clash 3D
// Flujo de partida, rondas, entrada del jugador, colisiones, cámara y HUD.
// Toda la lógica corre en step(dt), separada del dibujo: así el tiempo se
// detiene de verdad en pausa y se pueden simular peleas para medir el equilibrio.
// ═══════════════════════════════════════════════════

class Game {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.clock = new THREE.Clock();

        // Match State: menu | countdown | fighting | ended | paused | gameover
        this.state = 'menu';
        this.resumeState = 'fighting';
        this.round = 1;
        this.maxRounds = 3;
        this.roundWins = { player: 0, cpu: 0 };
        this.matchTimer = 60;
        this.difficulty = 'normal';
        this.mode = 'cpu'; // cpu | host | guest
        this.online = null;
        this.matchTimerEl = document.getElementById('battle-timer');
        this.roundLabelEl = document.getElementById('round-label');

        this.resetStats();

        // Fighters
        this.player = null;
        this.enemy = null;
        this.playerType = 'goku';
        this.enemyType = 'pikachu';
        this.ai = null;
        this.autoPlayerAI = null; // solo para pruebas: la CPU maneja también al jugador

        // Systems
        this.vfx = null;
        this.arena = null;
        this.input = null;

        // Combo
        this.comboTimer = 0;
        this.comboCount = 0;
        this.comboEl = document.getElementById('p1-combo');
        this.comboNumEl = document.getElementById('p1-combo-num');

        // Tiempo de juego: tareas programadas, congelamiento de impacto y cámara lenta
        this.tasks = [];
        this.hitStop = 0;
        this.slowMo = 0;
        this.beamNumbers = new Map();
        this.headless = false;

        this.initThree();
        this.initHUD();
        this.initPauseUI();
    }

    resetStats() {
        this.stats = { playerDamageDealt: 0, playerCombos: 0, playerMaxCombo: 0, playerUltimates: 0 };
        this.rivalStats = { dmg: 0, ults: 0 };
    }

    // ─────────────────────────────────────────────
    //  Three.js Scene Setup
    // ─────────────────────────────────────────────
    initThree() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(ARENA_COLORS.fog, 28, 90);

        const w = window.innerWidth, h = window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 180);
        this.camera.position.set(0, 5.5, 17);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance',
            stencil: false
        });
        this.renderer.setSize(w, h);
        this.pixelRatio = Math.min(window.devicePixelRatio, 2);
        this.renderer.setPixelRatio(this.pixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.container.appendChild(this.renderer.domElement);

        const hemi = new THREE.HemisphereLight(0xffe2bd, 0x5c3a2c, 0.72);
        this.scene.add(hemi);

        const sun = new THREE.DirectionalLight(0xffe0b0, 1.0);
        sun.position.set(-11, 18, 10);
        sun.castShadow = true;
        sun.shadow.mapSize.setScalar(1024);
        sun.shadow.camera.left = -20;
        sun.shadow.camera.right = 20;
        sun.shadow.camera.top = 20;
        sun.shadow.camera.bottom = -10;
        sun.shadow.camera.near = 1;
        sun.shadow.camera.far = 60;
        sun.shadow.bias = -0.001;
        this.scene.add(sun);

        this.sun = sun;

        this.vfx = new VFXManager(this.scene);
        this.arena = new Arena(this.scene);
        this.input = new InputManager();

        this.camTarget = new THREE.Vector3(0, 5.5, 17);
        this.camLookAt = new THREE.Vector3(0, 1.4, 0);
        this.vfx.setViewportHeight(h * this.pixelRatio);

        // Control de rendimiento: si el celular no llega, se baja la calidad sola
        this.perf = { frames: 0, time: 0, level: 0 };

        window.addEventListener('resize', () => this.onResize());
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.vfx.setViewportHeight(window.innerHeight * this.renderer.getPixelRatio());
    }

    // Mide el promedio de cuadros y baja resolución, sombras y partículas por etapas.
    watchPerformance(dt) {
        const perf = this.perf;
        perf.frames++;
        perf.time += dt;
        if (perf.time < 2.5) return;
        const fps = perf.frames / perf.time;
        perf.frames = 0;
        perf.time = 0;
        perf.fps = fps;
        if (fps >= 42 || perf.level >= 3) return;

        perf.level++;
        if (perf.level === 1) {
            this.pixelRatio = Math.min(this.pixelRatio, 1.25);
            this.renderer.setPixelRatio(this.pixelRatio);
            this.vfx.quality = 0.7;
        } else if (perf.level === 2) {
            this.sun.castShadow = false;
            this.renderer.shadowMap.enabled = false;
            this.vfx.quality = 0.5;
        } else {
            this.pixelRatio = 1;
            this.renderer.setPixelRatio(1);
        }
        this.onResize();
    }

    // Antes de elegir luchador, los cuatro quedan posando detrás del título.
    showTitleBackdrop() {
        this.clearBackdrop();
        const types = Object.keys(FIGHTER_STATS);
        this.backdrop = types.map((type, i) => {
            const f = new Fighter(type, true, this.scene, this.vfx, {});
            f.position.set(0.8 + i * 2.35, 0, -1 + (i % 2) * 1.2);
            f.group.position.copy(f.position);
            f.group.rotation.y = -0.25;
            f.rotationY = f.targetRotationY = -0.25;
            return f;
        });
        this.camera.position.set(0.8, 2.5, 10.5);
        this.camera.lookAt(0.8, 1.4, 0);
    }

    clearBackdrop() {
        if (this.backdrop) this.backdrop.forEach(f => f.dispose());
        this.backdrop = null;
    }

    // ─────────────────────────────────────────────
    //  HUD Elements
    // ─────────────────────────────────────────────
    initHUD() {
        this.p1HP  = document.getElementById('p1-hp');
        this.p1Ki  = document.getElementById('p1-ki');
        this.p1NameEl = document.getElementById('p1-name');
        this.p2HP  = document.getElementById('p2-hp');
        this.p2Ki  = document.getElementById('p2-ki');
        this.p1HPLag = document.getElementById('p1-hp-lag');
        this.p2HPLag = document.getElementById('p2-hp-lag');
        this.p2NameEl = document.getElementById('p2-name');
        this.announcerEl = document.getElementById('announcer');
        this.btnUltimate = document.getElementById('btn-ultimate');
        this.damageFlash = document.getElementById('damage-flash');
    }

    initPauseUI() {
        const pauseBtn = document.getElementById('btn-pause');
        const resumeBtn = document.getElementById('btn-resume');
        const quitBtn = document.getElementById('btn-quit-match');
        const soundBtn = document.getElementById('btn-sound');
        const fsBtn = document.getElementById('btn-fs');

        soundBtn && soundBtn.addEventListener('click', () => {
            window.soundManager.init();
            const muted = window.soundManager.toggleMute();
            soundBtn.querySelector('use').setAttribute('href', muted ? '#i-mute' : '#i-sound');
            if (!muted && ['countdown', 'fighting'].includes(this.state)) window.soundManager.startMusic();
        });

        // iPhone no tiene pantalla completa para páginas web: se oculta el botón
        const root = document.documentElement;
        if (fsBtn && !root.requestFullscreen) fsBtn.classList.add('hidden');
        fsBtn && fsBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) root.requestFullscreen().catch(() => {});
            else document.exitFullscreen().catch(() => {});
        });

        pauseBtn && pauseBtn.addEventListener('click', () => this.togglePause());
        resumeBtn && resumeBtn.addEventListener('click', () => this.togglePause());
        quitBtn && quitBtn.addEventListener('click', () => this.quitToMenu());

        window.addEventListener('keydown', e => {
            if (e.key === 'Escape') this.togglePause();
        });

        // Si el celular cambia de app o se bloquea, la pelea se pausa sola
        document.addEventListener('visibilitychange', () => {
            if (this.mode !== 'cpu') return;
            if (document.hidden && (this.state === 'fighting' || this.state === 'countdown')) this.togglePause();
        });
    }

    setBattleUI(visible) {
        ['hud', 'touch-controls', 'btn-pause'].forEach(id => {
            document.getElementById(id).classList.toggle('hidden', !visible);
        });
        document.body.classList.toggle('in-battle', visible);
    }

    // ─────────────────────────────────────────────
    //  Match Flow
    // ─────────────────────────────────────────────
    startMatch(playerType, enemyType, difficulty = this.difficulty) {
        this.playerType = playerType;
        this.enemyType = enemyType;
        this.difficulty = difficulty;
        this.round = 1;
        this.roundWins = { player: 0, cpu: 0 };
        this.resetStats();
        this.clearBackdrop();

        window.soundManager.init();
        window.soundManager.startMusic();

        document.getElementById('selection-screen').classList.add('hidden');
        document.getElementById('gameover-screen').classList.add('hidden');
        this.setBattleUI(true);

        this.p1NameEl.textContent = FIGHTER_STATS[playerType].label;
        this.p2NameEl.textContent = FIGHTER_STATS[enemyType].label;
        if (window.portraits) {
            document.getElementById('p1-avatar').style.backgroundImage = `url(${window.portraits[playerType]})`;
            document.getElementById('p2-avatar').style.backgroundImage = `url(${window.portraits[enemyType]})`;
        }
        // La marca sobre la barra de ki indica cuánto hace falta para el definitivo
        document.getElementById('p1-ki-mark').style.left = FIGHTER_STATS[playerType].ult.cost + '%';
        document.getElementById('p2-ki-mark').style.right = FIGHTER_STATS[enemyType].ult.cost + '%';

        this.startRound();
    }

    startRound() {
        this.tasks = [];
        this.clearFighters();
        this.vfx.clear();
        this.beamNumbers.clear();
        this.hitStop = 0;
        this.slowMo = 0;
        this.comboCount = 0;
        this.comboTimer = 0;
        this.comboEl.classList.add('hidden');
        this.matchTimer = 60;

        if (this.mode === 'guest') {
            // El invitado no simula: los luchadores solo muestran lo que manda el anfitrión
            this.player = new Fighter(this.playerType, true, this.scene, this.vfx, {});
            this.enemy  = new Fighter(this.enemyType, false, this.scene, this.vfx, {});
            this.roundLabelEl.textContent = `RONDA ${this.round}`;
            this.updatePips();
            this.refreshHUD();
            this.state = 'countdown';
            return;
        }

        const events = {
            onHit: (attacker, target, dealt, info) => this.onFighterHit(attacker, target, dealt, info),
            onBlock: (f, perfect) => { window.soundManager.playPunch(false); this.spawnLabel(f.position, perfect ? '¡CONTRA!' : 'BLOQUEO'); },
            onSparking: (f) => this.spawnLabel(f.position, '¡MÁXIMO PODER!'),
            onVanish: (f) => this.spawnLabel(f.position, '¡DESAPARICIÓN!'),
            onUltimate: (f) => {
                if (f === this.player) this.stats.playerUltimates++;
                else this.rivalStats.ults++;
                this.showCutIn(f);
            },
        };
        this.player = new Fighter(this.playerType, true, this.scene, this.vfx, events);
        this.enemy  = new Fighter(this.enemyType, false, this.scene, this.vfx, events);
        this.ai = this.mode === 'cpu' ? new FighterAI(this.enemy, this.player, this.vfx, this.difficulty) : null;
        if (this.mode === 'host') this.online.send({ t: 'round', n: this.round });
        if (this.autoPlayerAI) this.autoPlayerAI = new FighterAI(this.player, this.enemy, this.vfx, this.autoPlayerAI.levelName || 'normal');

        this.roundLabelEl.textContent = `RONDA ${this.round}`;
        this.updatePips();
        this.hpLag = { p1: 1, p2: 1 };
        this.hpLagTimer = 0;
        this.refreshHUD();
        this.startCountdown();
    }

    clearFighters() {
        if (this.player) { this.player.dispose(); this.player = null; }
        if (this.enemy)  { this.enemy.dispose();  this.enemy  = null; }
    }

    // Tareas en tiempo de juego: se congelan en pausa y se cancelan al salir.
    after(seconds, fn) {
        this.tasks.push({ t: seconds, fn });
    }

    tickTasks(dt) {
        const due = [];
        this.tasks = this.tasks.filter(task => {
            task.t -= dt;
            if (task.t <= 0) { due.push(task.fn); return false; }
            return true;
        });
        due.forEach(fn => fn());
    }

    startCountdown() {
        this.state = 'countdown';
        const steps = ['3', '2', '1', '¡PELEA!'];
        steps.forEach((text, i) => this.after(i * 0.8, () => {
            this.showAnnouncer(text, 650);
            window.soundManager.playPunch(i === 3);
        }));
        this.after(2.5, () => {
            this.state = 'fighting';
            this.vfx.shake(0.12);
        });
    }

    togglePause() {
        const pauseScreen = document.getElementById('pause-screen');
        // Online no se puede frenar la pelea del otro: el menú se abre, pero sigue corriendo
        if (this.mode !== 'cpu') {
            if (this.state !== 'menu' && this.state !== 'gameover') pauseScreen.classList.toggle('hidden');
            return;
        }
        if (this.state === 'fighting' || this.state === 'countdown') {
            this.resumeState = this.state;
            this.state = 'paused';
            pauseScreen.classList.remove('hidden');
            document.body.classList.add('is-paused');
            window.soundManager.stopMusic();
            window.soundManager.stopKiCharge();
            if (this.player) this.player.isCharging = false;
            if (this.enemy) this.enemy.isCharging = false;
        } else if (this.state === 'paused') {
            this.state = this.resumeState;
            pauseScreen.classList.add('hidden');
            document.body.classList.remove('is-paused');
            window.soundManager.init();
            window.soundManager.startMusic();
            [this.player, this.enemy].forEach(f => {
                if (f && f.state === 'charge') f.setChargingSound(true);
            });
        }
    }

    quitToMenu() {
        if (this.online) this.online.leave();
        this.mode = 'cpu';
        this.tasks = [];
        this.state = 'menu';
        this.clearFighters();
        this.vfx.clear();
        document.getElementById('pause-screen').classList.add('hidden');
        document.body.classList.remove('is-paused');
        this.announcerEl.classList.add('hidden');
        this.setBattleUI(false);
        window.soundManager.stopMusic();
        window.soundManager.stopKiCharge();
        this.showTitleBackdrop();
        document.getElementById('title-screen').classList.remove('hidden');
    }

    updatePips() {
        const paint = (id, wins) => {
            document.querySelectorAll(`#${id} i`).forEach((pip, i) => pip.classList.toggle('won', i < wins));
        };
        paint('p1-pips', this.roundWins.player);
        paint('p2-pips', this.roundWins.cpu);
    }

    // El momento fuerte del juego: el definitivo corta la pantalla como una viñeta.
    // El mundo casi se detiene mientras dura, y la carga del golpe sigue después.
    showCutIn(f) {
        this.slowMo = Math.max(this.slowMo, 0.5);
        if (this.headless) return;
        const el = document.getElementById('cutin');
        const color = '#' + f.stats.aura.toString(16).padStart(6, '0');
        el.style.setProperty('--cutin', color);
        document.getElementById('cutin-name').textContent = f.stats.ult.name;
        document.getElementById('cutin-portrait').style.backgroundImage = window.portraits ? `url(${window.portraits[f.type]})` : '';
        el.classList.add('hidden');
        void el.offsetWidth;
        el.classList.remove('hidden');
        clearTimeout(this._cutinTimer);
        this._cutinTimer = setTimeout(() => el.classList.add('hidden'), 640);
    }

    showAnnouncer(text, duration = 1200) {
        const el = this.announcerEl;
        if (!el || this.headless) return;
        el.textContent = text;
        el.classList.remove('hidden', 'ann-out');
        el.classList.add('ann-in');

        clearTimeout(this._annTimer);
        clearTimeout(this._annHide);
        this._annTimer = setTimeout(() => {
            el.classList.remove('ann-in');
            el.classList.add('ann-out');
            this._annHide = setTimeout(() => el.classList.add('hidden'), 350);
        }, duration);
    }

    // ─────────────────────────────────────────────
    //  PLAYER INPUT
    // ─────────────────────────────────────────────
    // Vale para el jugador local y para el rival online: misma regla, otra fuente de datos.
    applyInput(p, foe, input, dt) {
        if (!p || p.isDead) return;
        const mv = input.moveVector;

        p.guard(input.wants('guard'));
        p.chargeKi(input.wants('charge'));
        if (input.wants('dash')) {
            if (input.wants('guard')) p.vanish(foe);
            else if (input.wants('charge')) p.rush(foe);
            else p.dash(mv.x, mv.z, foe);
        }
        if (input.wants('ultimate')) p.triggerUltimate(foe);
        if (input.wants('blast')) p.shootBlast(foe);
        if (input.wants('attack')) p.attack(foe);
        p.move(mv.x, mv.z, dt);
    }

    // En online cada uno ve "VOS" sobre su luchador.
    markOnlineNames(isHost) {
        const me = isHost ? this.p1NameEl : this.p2NameEl;
        me.textContent = `VOS · ${me.textContent}`;
    }

    localFighter() {
        return this.mode === 'guest' ? this.enemy : this.player;
    }

    // ─────────────────────────────────────────────
    //  GOLPES
    // ─────────────────────────────────────────────
    onFighterHit(attacker, target, dealt, info) {
        if (attacker !== this.player && this.mode === 'host') {
            this.rivalStats.dmg += dealt;
            if (info.kind === 'melee') this.online.fx('combo');
        }
        if (attacker === this.player) {
            this.stats.playerDamageDealt += dealt;
            if (info.kind === 'melee') this.registerCombo();
        } else {
            this.comboCount = 0;
            this.comboTimer = 0;
            this.comboEl.classList.add('hidden');
            this.triggerDamageFlash();
        }
        if (info.heavy) this.hitStop = Math.max(this.hitStop, 0.07);
        this.spawnDamageNumber(target.position, dealt, !!info.heavy);
        if (target.isDead) this.slowMo = 0.9;
    }

    registerCombo() {
        this.comboTimer = 1.1;
        this.comboCount++;
        if (this.comboCount > this.stats.playerMaxCombo) this.stats.playerMaxCombo = this.comboCount;
        if (this.comboCount >= 2 && !this.headless) {
            this.stats.playerCombos++;
            this.comboEl.classList.remove('hidden');
            this.comboNumEl.textContent = this.comboCount;
            this.comboEl.style.animation = 'none';
            void this.comboEl.offsetWidth;
            this.comboEl.style.animation = '';
        }
    }

    tickCombo(dt) {
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.comboCount = 0;
                this.comboEl.classList.add('hidden');
            }
        }
    }

    // ─────────────────────────────────────────────
    //  COLLISION
    // ─────────────────────────────────────────────
    opponentOf(f) {
        return f === this.player ? this.enemy : this.player;
    }

    checkCollisions(dt) {
        const projs = this.vfx.projectiles;
        for (let i = projs.length - 1; i >= 0; i--) {
            const p = projs[i];
            const target = this.opponentOf(p.owner);
            if (!target || target.isDead) continue;

            const hp = target.position.clone();
            hp.y = target.stats.muzzleY;
            if (p.mesh.position.distanceTo(hp) < p.radius + target.stats.hitRadius) {
                const dealt = target.receiveHit({ amount: p.damage, attacker: p.owner, kind: 'shot' });
                // Con invulnerabilidad el proyectil sigue de largo: esquivar se nota
                if (dealt <= 0) continue;
                this.vfx.createHitSparks(p.mesh.position, p.color, 14);
                window.soundManager.playPunch(false);
                this.onFighterHit(p.owner, target, dealt, { kind: 'shot' });
                this.vfx.removeProjectile(i);
            }
        }

        // Dos disparos que chocan se anulan
        for (let i = projs.length - 1; i > 0; i--) {
            for (let j = i - 1; j >= 0; j--) {
                if (projs[i].owner === projs[j].owner) continue;
                const reach = projs[i].radius + projs[j].radius;
                if (projs[i].mesh.position.distanceTo(projs[j].mesh.position) < reach) {
                    this.vfx.createHitSparks(projs[i].mesh.position, 0xffffff, 12);
                    this.vfx.removeProjectile(i);
                    this.vfx.removeProjectile(j);
                    i--;
                    break;
                }
            }
        }

        for (const b of this.vfx.beams) {
            const target = this.opponentOf(b.owner);
            if (!target || target.isDead) continue;
            const toT = target.position.clone().sub(b.startPos);
            toT.y = 0;
            const along = toT.dot(b.direction);
            if (along < 0 || along > b.length) continue;
            const lateral = toT.addScaledVector(b.direction, -along).length();
            if (lateral > b.radius + target.stats.hitRadius * 0.7) continue;

            const dealt = target.receiveHit({
                amount: (b.damage / b.duration) * dt, attacker: b.owner, kind: 'beam', continuous: true,
            });
            if (dealt <= 0) continue;
            if (b.owner === this.player) this.stats.playerDamageDealt += dealt;
            else {
                this.rivalStats.dmg += dealt;
                this.triggerDamageFlash();
            }

            // El daño del rayo se muestra agrupado, no un número por cuadro
            const acc = (this.beamNumbers.get(b) || 0) + dealt;
            if (acc >= 5 || target.isDead) {
                this.spawnDamageNumber(target.position, acc, false);
                this.vfx.createHitSparks(target.position.clone().setY(target.stats.muzzleY), b.color, 5);
                this.beamNumbers.set(b, 0);
            } else {
                this.beamNumbers.set(b, acc);
            }
            if (target.isDead) this.slowMo = 0.9;
        }
    }

    // ─────────────────────────────────────────────
    //  CAMERA
    // ─────────────────────────────────────────────
    updateCamera(dt) {
        if (!this.player || !this.enemy) return;
        const px = this.player.position.x, ex = this.enemy.position.x;
        const pz = this.player.position.z, ez = this.enemy.position.z;
        const midX = (px + ex) * 0.5;
        const midZ = (pz + ez) * 0.5;
        const gap  = Math.hypot(px - ex, pz - ez);

        // La distancia sale del ancho que hay que encuadrar y del formato de pantalla,
        // para que ningún luchador quede afuera ni en un celular angosto.
        const halfWidth = gap / 2 + 2.6;
        const tanH = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * this.camera.aspect;
        const dist = Math.max(8.5, halfWidth / tanH);
        const shake = this.vfx.cameraShakeOffset;

        this.camTarget.set(
            midX + shake.x,
            2.4 + dist * 0.2 + shake.y,
            midZ * 0.6 + dist + shake.z
        );
        this.camLookAt.set(midX, 1.35, midZ * 0.6);

        this.camera.position.lerp(this.camTarget, Math.min(1, dt * 5.5));
        this.camera.lookAt(this.camLookAt);
    }

    // ─────────────────────────────────────────────
    //  HUD UPDATE
    // ─────────────────────────────────────────────
    refreshHUD() {
        if (!this.player || !this.enemy || this.headless) return;
        // Barra de vida: la parte roja se vacía con demora para que se lea el daño
        const scaleFill = (el, lagEl, pct) => {
            const k = Math.max(0, pct);
            el.style.transform = `scaleX(${k})`;
            lagEl.style.transform = `scaleX(${k})`;
            el.classList.toggle('low', k < 0.25);
        };
        scaleFill(this.p1HP, this.p1HPLag, this.player.health / this.player.maxHealth);
        scaleFill(this.p2HP, this.p2HPLag, this.enemy.health / this.enemy.maxHealth);
        this.p1Ki.style.transform = `scaleX(${this.player.ki / this.player.maxKi})`;
        this.p2Ki.style.transform = `scaleX(${this.enemy.ki / this.enemy.maxKi})`;
        this.p1Ki.classList.toggle('sparking', this.player.sparking);
        this.p2Ki.classList.toggle('sparking', this.enemy.sparking);

        if (this.btnUltimate) {
            const me = this.localFighter();
            this.btnUltimate.classList.toggle('ready', me.ki >= me.ultimateCost);
        }

        const secs = Math.ceil(this.matchTimer);
        if (this.matchTimerEl.textContent !== String(secs)) this.matchTimerEl.textContent = secs;
        this.matchTimerEl.classList.toggle('urgent', secs <= 10);
    }

    // ─────────────────────────────────────────────
    //  MATCH END LOGIC
    // ─────────────────────────────────────────────
    checkRoundEnd(dt) {
        if (this.player.isDead || this.enemy.isDead) {
            let winner = 'draw';
            if (!this.player.isDead) winner = 'player';
            else if (!this.enemy.isDead) winner = 'cpu';
            this.endRound(winner, 'ko');
            return;
        }
        this.matchTimer = Math.max(0, this.matchTimer - dt);
        if (this.matchTimer <= 0) {
            const a = this.player.health / this.player.maxHealth;
            const b = this.enemy.health / this.enemy.maxHealth;
            const winner = Math.abs(a - b) < 0.001 ? 'draw' : (a > b ? 'player' : 'cpu');
            this.endRound(winner, 'time');
        }
    }

    endRound(winner, reason) {
        this.state = 'ended';
        if (winner !== 'draw') this.roundWins[winner]++;
        this.updatePips();

        [this.player, this.enemy].forEach(f => { f.chargeKi(false); f.guard(false); });

        const headline = reason === 'ko' ? 'K.O.' : '¡TIEMPO!';
        const winnerName = winner === 'draw' ? 'EMPATE'
            : `RONDA PARA ${FIGHTER_STATS[winner === 'player' ? this.playerType : this.enemyType].label}`;

        this.after(0.5, () => {
            this.showAnnouncer(headline, 900);
            if (winner === 'player') window.soundManager.playVictory();
            if (winner === 'cpu' && this.mode === 'host') this.online.fx('win');
        });
        this.after(1.6, () => this.showAnnouncer(winnerName, 900));
        this.after(3.0, () => {
            const decided = this.roundWins.player >= 2 || this.roundWins.cpu >= 2 || this.round >= this.maxRounds;
            if (decided) {
                this.showGameOver();
            } else {
                this.round++;
                this.startRound();
            }
        });
    }

    showGameOver() {
        this.state = 'gameover';
        if (this.mode === 'host') {
            this.online.send({ t: 'over', wins: this.roundWins, dmg: this.rivalStats.dmg, ults: this.rivalStats.ults });
        }
        // El invitado ve el resultado desde su lado: su luchador es el "enemigo" de la simulación
        const flip = this.mode === 'guest';
        const player = flip ? this.roundWins.cpu : this.roundWins.player;
        const cpu = flip ? this.roundWins.player : this.roundWins.cpu;
        const result = player === cpu ? 'draw' : (player > cpu ? 'win' : 'lose');
        this.lastResult = result;
        window.soundManager.stopMusic();
        if (this.headless) return;

        const title = document.getElementById('go-title');
        const sub   = document.getElementById('go-sub');
        const stats = document.getElementById('go-stats');
        const myType = flip ? this.enemyType : this.playerType;
        const rivalType = flip ? this.playerType : this.enemyType;
        const me = FIGHTER_STATS[myType].label;
        const rival = FIGHTER_STATS[rivalType].label;

        title.textContent = { win: '¡VICTORIA!', lose: 'DERROTA', draw: 'EMPATE' }[result];
        title.style.color = { win: 'var(--ink)', lose: 'var(--hit)', draw: 'var(--ink)' }[result];
        if (window.portraits) {
            const shown = result === 'lose' ? rivalType : myType;
            document.getElementById('go-portrait').style.backgroundImage = `url(${window.portraits[shown]})`;
        }
        sub.textContent = {
            win: `${me} venció a ${rival}`,
            lose: `${rival} venció a ${me}`,
            draw: `${me} y ${rival} terminaron igualados`,
        }[result];

        stats.innerHTML = `
            <div class="go-stat"><div class="go-stat-num">${Math.round(this.stats.playerDamageDealt)}</div><div class="go-stat-lbl">Daño total</div></div>
            <div class="go-stat"><div class="go-stat-num">${this.stats.playerMaxCombo}</div><div class="go-stat-lbl">Mejor combo</div></div>
            <div class="go-stat"><div class="go-stat-num">${this.stats.playerUltimates}</div><div class="go-stat-lbl">Definitivos</div></div>
            <div class="go-stat"><div class="go-stat-num">${player}-${cpu}</div><div class="go-stat-lbl">Rondas</div></div>
        `;

        this.setBattleUI(false);
        document.getElementById('gameover-screen').classList.remove('hidden');
    }

    // ─────────────────────────────────────────────
    //  VISUAL HELPERS
    // ─────────────────────────────────────────────
    triggerDamageFlash() {
        const el = this.damageFlash;
        if (!el || this.headless) return;
        el.classList.remove('flash-red', 'flash-blue');
        void el.offsetWidth;
        el.classList.add('flash-red');
    }

    screenPos(worldPos) {
        const v = worldPos.clone();
        v.x += (Math.random() - 0.5) * 1.2;
        v.y += 2.2;
        v.project(this.camera);
        return { x: (v.x * 0.5 + 0.5) * window.innerWidth, y: (1 - (v.y * 0.5 + 0.5)) * window.innerHeight };
    }

    spawnFloating(worldPos, text, className) {
        if (this.headless) return;
        const { x, y } = this.screenPos(worldPos);
        if (x < -50 || x > window.innerWidth + 50) return;
        const el = document.createElement('div');
        el.className = className;
        el.textContent = text;
        el.style.left = x + 'px';
        el.style.top  = y + 'px';
        document.body.appendChild(el);
        el.addEventListener('animationend', () => el.remove());
    }

    spawnDamageNumber(worldPos, damage, critical) {
        const n = Math.round(damage);
        if (n <= 0) return;
        this.spawnFloating(worldPos, n, 'dmg-text' + (critical ? ' critical' : ''));
    }

    spawnLabel(worldPos, text) {
        this.spawnFloating(worldPos, text, 'dmg-text');
    }

    // ─────────────────────────────────────────────
    //  MAIN LOOP
    // ─────────────────────────────────────────────
    step(rawDt) {
        if (this.state === 'menu' && this.backdrop) {
            this.backdrop.forEach(f => f.updatePose(rawDt));
            return;
        }
        if (this.mode === 'guest') {
            this.stepGuest(rawDt);
            return;
        }
        if (this.state === 'paused' || this.state === 'menu') return;

        // Impacto y cámara lenta afectan al mundo, no a los menús ni al reloj real
        let dt = rawDt;
        if (this.hitStop > 0) { this.hitStop -= rawDt; dt *= 0.08; }
        else if (this.slowMo > 0) { this.slowMo -= rawDt; dt *= 0.35; }

        if (this.state === 'fighting') {
            if (this.autoPlayerAI) this.autoPlayerAI.update(dt);
            else this.applyInput(this.player, this.enemy, this.input, dt);
            if (this.mode === 'host') this.applyInput(this.enemy, this.player, this.online.remoteInput, dt);
            else this.ai.update(dt);
            this.tickCombo(dt);
        }

        if (this.player && this.enemy) {
            this.player.update(dt, this.enemy);
            this.enemy.update(dt, this.player);
        }

        if (this.state === 'fighting') {
            this.checkCollisions(dt);
            this.checkRoundEnd(dt);
        }

        this.vfx.update(dt, this.camera);
        this.tickTasks(rawDt);
        this.input.endFrame();
        if (this.mode === 'host') {
            this.online.remoteInput.endFrame();
            this.online.tickHost(rawDt);
        }
        this.refreshHUD();
        this.updateCamera(dt);
    }

    // El invitado no simula: muestra lo último que recibió del anfitrión.
    stepGuest(dt) {
        if (this.state === 'gameover') return;
        if (this.player && this.enemy) {
            this.player.netTick(dt);
            this.enemy.netTick(dt);
        }
        this.vfx.update(dt, this.camera);
        this.tickCombo(dt);
        this.refreshHUD();
        this.updateCamera(dt);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const dt = Math.min(this.clock.getDelta(), 0.08);
        this.step(dt);
        this.renderer.render(this.scene, this.camera);
        if (this.state === 'fighting') this.watchPerformance(dt);
    }
}

window.Game = Game;
