// Modo online: dos navegadores conectados de forma directa (WebRTC), sin servidor propio.
// PeerJS solo se usa para que se encuentren a partir del código de sala.
//
// Un jugador es el anfitrión y simula la pelea. El invitado le manda lo que toca y recibe
// el estado de la pelea 20 veces por segundo, más los efectos y sonidos como eventos.
const ROOM_PREFIX = 'anime-clash-3d-sala-';
const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const INPUT_ACTIONS = ['attack', 'blast', 'charge', 'dash', 'ultimate', 'guard'];
const NET_STATES = ['idle', 'run', 'attack', 'blast', 'guard', 'charge', 'ultimate', 'hurt', 'dash', 'ko'];
const GAME_STATES = ['countdown', 'fighting', 'ended', 'gameover'];
const CONNECTION_TIMEOUT_MS = 15000;
const SILENCE_TIMEOUT_MS = 8000;

function randomRoomCode() {
    let code = '';
    for (let i = 0; i < 4; i++) code += ROOM_ALPHABET[Math.floor(Math.random() * ROOM_ALPHABET.length)];
    return code;
}

function round2(n) {
    return Math.round(n * 100) / 100;
}

function packFighter(f) {
    return [
        round2(f.position.x), round2(f.position.z), round2(f.rotationY),
        NET_STATES.indexOf(f.state), round2(f.stateTimer), f.animStep,
        round2(f.health), round2(f.ki), f.invuln > 0 ? 1 : 0,
    ];
}

class OnlineMatch {
    constructor(game) {
        this.game = game;
        this.peer = null;
        this.conn = null;
        this.role = null; // 'host' | 'guest'
        this.active = false;
        this.myType = 'goku';
        this.rivalType = 'goku';
        this.iAmReady = false;
        this.rivalReady = false;
        this.snapshotClock = 0;
        this.lastHeard = 0;
        this.projectiles = new Map();
        this.nextProjectileId = 1;
        this.remoteInput = {
            moveVector: { x: 0, z: 0 },
            held: {},
            latched: {},
            wants(action) { return !!(this.held[action] || this.latched[action]); },
            endFrame() { this.latched = {}; },
        };
        this.el = {
            screen: document.getElementById('online-screen'),
            status: document.getElementById('online-status'),
            room: document.getElementById('online-room'),
            code: document.getElementById('online-code'),
            input: document.getElementById('online-input'),
            start: document.getElementById('btn-start-fight'),
            rematch: document.getElementById('btn-rematch'),
        };
        this.bindUI();
    }

    bindUI() {
        document.getElementById('btn-online').addEventListener('click', () => this.openScreen());
        document.getElementById('btn-online-back').addEventListener('click', () => {
            this.leave();
            this.el.screen.classList.add('hidden');
            document.getElementById('title-screen').classList.remove('hidden');
        });
        document.getElementById('btn-online-create').addEventListener('click', () => this.createRoom());
        document.getElementById('btn-online-join').addEventListener('click', () => this.joinRoom(this.el.input.value));
        this.el.input.addEventListener('input', () => {
            this.el.input.value = this.el.input.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
        });
        this.el.input.addEventListener('keydown', e => {
            e.stopPropagation();
            if (e.key === 'Enter') this.joinRoom(this.el.input.value);
        });
        document.getElementById('btn-online-share').addEventListener('click', () => this.shareLink());
    }

    setStatus(text, isError = false) {
        this.el.status.textContent = text;
        this.el.status.classList.toggle('error', isError);
    }

    openScreen(prefill = '') {
        document.getElementById('title-screen').classList.add('hidden');
        this.el.screen.classList.remove('hidden');
        this.el.room.classList.add('hidden');
        this.el.input.value = prefill;
        this.setStatus('');
    }

    // Abre directo la sala si el link trae ?sala=CODIGO
    joinFromUrl() {
        const code = new URLSearchParams(location.search).get('sala');
        if (!code) return;
        this.openScreen(code.toUpperCase());
        this.joinRoom(code);
    }

    // ─────────────────────────────────────────────
    //  CONEXIÓN
    // ─────────────────────────────────────────────
    createRoom(attempt = 0) {
        this.leave();
        this.role = 'host';
        const code = randomRoomCode();
        this.setStatus('Creando la sala...');
        this.peer = new Peer(ROOM_PREFIX + code, { debug: 0 });
        this.peer.on('open', () => {
            this.code = code;
            this.el.code.textContent = code;
            this.el.room.classList.remove('hidden');
            this.setStatus('Esperando a tu rival. Pasale el código o el link.');
        });
        this.peer.on('connection', conn => {
            if (this.conn) { conn.on('open', () => conn.close()); return; }
            this.attach(conn);
        });
        this.peer.on('error', err => {
            if (err.type === 'unavailable-id' && attempt < 3) { this.createRoom(attempt + 1); return; }
            this.fail(this.describeError(err));
        });
    }

    joinRoom(rawCode) {
        const code = String(rawCode || '').toUpperCase().trim();
        if (code.length !== 4) { this.setStatus('El código tiene 4 caracteres.', true); return; }
        this.leave();
        this.role = 'guest';
        this.setStatus('Conectando...');
        this.peer = new Peer({ debug: 0 });
        this.peer.on('open', () => {
            this.attach(this.peer.connect(ROOM_PREFIX + code, { reliable: true, serialization: 'json' }));
        });
        this.peer.on('error', err => this.fail(this.describeError(err)));
    }

    describeError(err) {
        if (err.type === 'peer-unavailable') return 'No existe esa sala, o ya se cerró. Revisá el código.';
        if (err.type === 'network' || err.type === 'server-error' || err.type === 'socket-error') return 'No se pudo llegar al servidor de salas. Revisá tu conexión.';
        if (err.type === 'browser-incompatible') return 'Este navegador no permite jugar online.';
        return 'Falló la conexión. Probá de nuevo.';
    }

    attach(conn) {
        this.conn = conn;
        this.connectTimer = setTimeout(() => {
            this.fail('No se pudo conectar con tu rival. Algunas redes lo bloquean: probá con otra wifi o con datos.');
        }, CONNECTION_TIMEOUT_MS);
        conn.on('open', () => this.onConnected());
        conn.on('data', msg => this.onMessage(msg));
        conn.on('close', () => this.onLost());
        conn.on('error', () => this.onLost());
    }

    onConnected() {
        clearTimeout(this.connectTimer);
        this.active = true;
        this.iAmReady = false;
        this.rivalReady = false;
        this.lastHeard = performance.now();
        this.heartbeat = setInterval(() => this.tickHeartbeat(), 50);
        this.el.screen.classList.add('hidden');
        this.showSelection();
        this.send({ t: 'pick', type: this.myType });
    }

    send(msg) {
        if (this.conn && this.conn.open) this.conn.send(msg);
    }

    fail(text) {
        this.leave();
        this.el.screen.classList.remove('hidden');
        this.el.room.classList.add('hidden');
        this.setStatus(text, true);
    }

    onLost() {
        if (!this.active) { if (this.peer) this.fail('Se cortó la conexión.'); return; }
        this.game.quitToMenu();
        document.getElementById('title-screen').classList.add('hidden');
        document.getElementById('selection-screen').classList.add('hidden');
        document.getElementById('gameover-screen').classList.add('hidden');
        this.fail('Se cortó la conexión con tu rival.');
    }

    // Corta todo y deja el juego listo para jugar solo.
    leave() {
        const wasActive = this.active;
        this.active = false;
        clearTimeout(this.connectTimer);
        clearInterval(this.heartbeat);
        this.removeHostHooks();
        const conn = this.conn, peer = this.peer;
        this.conn = null;
        this.peer = null;
        if (conn) conn.close();
        if (peer) peer.destroy();
        document.body.classList.remove('online-mode');
        this.el.start.textContent = 'A PELEAR';
        this.el.rematch.textContent = 'REVANCHA';
        if (wasActive) this.game.mode = 'cpu';
    }

    // Se manda siempre, aunque no se esté tocando nada: si deja de llegar, se cortó.
    tickHeartbeat() {
        if (performance.now() - this.lastHeard > SILENCE_TIMEOUT_MS) { this.onLost(); return; }
        if (this.game.mode === 'guest' && this.game.state !== 'gameover') {
            const input = this.game.input;
            let held = 0, latched = 0;
            INPUT_ACTIONS.forEach((action, i) => {
                if (input.actions[action]) held |= 1 << i;
                if (input.latched[action]) latched |= 1 << i;
            });
            input.endFrame();
            this.send({ t: 'i', x: round2(input.moveVector.x), z: round2(input.moveVector.z), h: held, l: latched });
        } else {
            this.send({ t: 'ping' });
        }
    }

    // ─────────────────────────────────────────────
    //  SELECCIÓN
    // ─────────────────────────────────────────────
    showSelection() {
        document.body.classList.add('online-mode');
        document.getElementById('selection-screen').classList.remove('hidden');
        document.getElementById('sel-title-rival').textContent = 'RIVAL';
        this.iAmReady = false;
        this.rivalReady = false;
        this.el.start.textContent = 'LISTO';
        this.el.rematch.textContent = 'REVANCHA';
        window.setRosterSelection('roster-p1', this.myType);
        window.setRosterSelection('roster-p2', this.rivalType);
    }

    pick(type) {
        this.myType = type;
        this.iAmReady = false;
        this.el.start.textContent = 'LISTO';
        this.send({ t: 'pick', type });
    }

    // Vale tanto para LISTO en la selección como para REVANCHA al final.
    markReady() {
        window.soundManager.init();
        this.iAmReady = true;
        this.el.start.textContent = 'ESPERANDO...';
        this.el.rematch.textContent = 'ESPERANDO...';
        this.send({ t: 'ready' });
        this.maybeStart();
    }

    backToSelection(notify = true) {
        if (notify) this.send({ t: 'select' });
        const g = this.game;
        g.tasks = [];
        g.mode = 'cpu';
        g.state = 'menu';
        g.clearFighters();
        g.vfx.clear();
        g.setBattleUI(false);
        g.announcerEl.classList.add('hidden');
        document.getElementById('cutin').classList.add('hidden');
        document.getElementById('pause-screen').classList.add('hidden');
        document.getElementById('gameover-screen').classList.add('hidden');
        window.soundManager.stopMusic();
        window.soundManager.stopKiCharge();
        g.showTitleBackdrop();
        this.showSelection();
    }

    maybeStart() {
        if (this.role !== 'host' || !this.iAmReady || !this.rivalReady) return;
        this.send({ t: 'start', host: this.myType, guest: this.rivalType });
        this.startAsHost();
    }

    startAsHost() {
        this.iAmReady = false;
        this.rivalReady = false;
        const g = this.game;
        this.installHostHooks();
        this.projectiles.clear();
        this.remoteInput.held = {};
        this.remoteInput.latched = {};
        this.remoteInput.moveVector = { x: 0, z: 0 };
        g.mode = 'host';
        g.startMatch(this.myType, this.rivalType);
        g.markOnlineNames(true);
    }

    startAsGuest(hostType, guestType) {
        this.iAmReady = false;
        this.rivalReady = false;
        const g = this.game;
        this.projectiles.clear();
        g.mode = 'guest';
        g.startMatch(hostType, guestType);
        g.markOnlineNames(false);
    }

    // ─────────────────────────────────────────────
    //  MENSAJES
    // ─────────────────────────────────────────────
    onMessage(msg) {
        this.lastHeard = performance.now();
        const g = this.game;
        switch (msg.t) {
            case 'ping': break;
            case 'pick':
                this.rivalType = msg.type;
                this.rivalReady = false;
                window.setRosterSelection('roster-p2', msg.type);
                break;
            case 'ready':
                this.rivalReady = true;
                this.maybeStart();
                break;
            case 'select':
                this.backToSelection(false);
                break;
            case 'i': {
                const r = this.remoteInput;
                r.moveVector = { x: msg.x, z: msg.z };
                INPUT_ACTIONS.forEach((action, i) => {
                    r.held[action] = !!(msg.h & (1 << i));
                    if (msg.l & (1 << i)) r.latched[action] = true;
                });
                break;
            }
            case 'start':
                this.startAsGuest(msg.host, msg.guest);
                break;
            case 'round':
                if (g.mode === 'guest') { g.round = msg.n; g.startRound(); }
                break;
            case 's':
                if (g.mode === 'guest') this.applySnapshot(msg);
                break;
            case 'fx':
                if (g.mode === 'guest') this.applyEffect(msg);
                break;
            case 'over':
                if (g.mode === 'guest') {
                    g.roundWins = msg.wins;
                    g.stats.playerDamageDealt = msg.dmg;
                    g.stats.playerUltimates = msg.ults;
                    g.showGameOver();
                }
                break;
        }
    }

    // ─────────────────────────────────────────────
    //  ANFITRIÓN: lo que se le manda al invitado
    // ─────────────────────────────────────────────
    tickHost(dt) {
        const g = this.game;
        this.snapshotClock += dt;
        if (this.snapshotClock < 0.05 || !g.player || !g.enemy) return;
        this.snapshotClock = 0;
        this.send({
            t: 's',
            g: GAME_STATES.indexOf(g.state),
            c: round2(g.matchTimer),
            w: [g.roundWins.player, g.roundWins.cpu],
            p: packFighter(g.player),
            e: packFighter(g.enemy),
        });
    }

    fx(kind, data = {}) {
        this.send(Object.assign({ t: 'fx', k: kind }, data));
    }

    side(fighter) {
        return fighter === this.game.player ? 'p' : 'e';
    }

    // Envuelve los efectos y sonidos para que, además de ocurrir acá, viajen al invitado.
    installHostHooks() {
        if (this.hooked) return;
        this.hooked = true;
        const g = this.game, vfx = g.vfx, sound = window.soundManager, self = this;

        vfx.spawnProjectile = function (owner, pos, dir, cfg) {
            const proj = VFXManager.prototype.spawnProjectile.call(vfx, owner, pos, dir, cfg);
            proj.netId = self.nextProjectileId++;
            self.fx('proj', { id: proj.netId, o: self.side(owner), pos: pos.toArray(), dir: dir.toArray(), cfg });
            return proj;
        };
        vfx.removeProjectile = function (index) {
            self.fx('projx', { id: vfx.projectiles[index].netId });
            VFXManager.prototype.removeProjectile.call(vfx, index);
        };
        vfx.spawnBeam = function (owner, pos, dir, cfg) {
            self.fx('beam', { o: self.side(owner), pos: pos.toArray(), dir: dir.toArray(), cfg });
            return VFXManager.prototype.spawnBeam.call(vfx, owner, pos, dir, cfg);
        };
        vfx.createHitSparks = function (pos, color, count) {
            self.fx('sparks', { pos: pos.toArray(), color, count });
            VFXManager.prototype.createHitSparks.call(vfx, pos, color, count);
        };
        vfx.shake = function (amount) {
            self.fx('shake', { amount });
            VFXManager.prototype.shake.call(vfx, amount);
        };

        ['playPunch', 'playBlast', 'playDash', 'playUltimateBeam', 'playExplosion'].forEach(name => {
            sound[name] = function (...args) {
                self.fx('snd', { name, args });
                SoundManager.prototype[name].apply(sound, args);
            };
        });

        const proto = Game.prototype;
        g.showAnnouncer = function (text, duration) {
            self.fx('ann', { text, duration });
            proto.showAnnouncer.call(g, text, duration);
        };
        g.showCutIn = function (f) {
            self.fx('cutin', { o: self.side(f) });
            proto.showCutIn.call(g, f);
        };
        g.spawnDamageNumber = function (pos, damage, critical) {
            self.fx('num', { pos: pos.toArray(), damage, critical });
            proto.spawnDamageNumber.call(g, pos, damage, critical);
        };
        g.spawnLabel = function (pos, text) {
            self.fx('label', { pos: pos.toArray(), text });
            proto.spawnLabel.call(g, pos, text);
        };
    }

    removeHostHooks() {
        if (!this.hooked) return;
        this.hooked = false;
        const g = this.game;
        ['spawnProjectile', 'removeProjectile', 'spawnBeam', 'createHitSparks', 'shake'].forEach(n => delete g.vfx[n]);
        ['playPunch', 'playBlast', 'playDash', 'playUltimateBeam', 'playExplosion'].forEach(n => delete window.soundManager[n]);
        ['showAnnouncer', 'showCutIn', 'spawnDamageNumber', 'spawnLabel'].forEach(n => delete g[n]);
    }

    // ─────────────────────────────────────────────
    //  INVITADO: reproducir lo que manda el anfitrión
    // ─────────────────────────────────────────────
    applySnapshot(msg) {
        const g = this.game;
        if (!g.player || !g.enemy) return;
        const next = GAME_STATES[msg.g];
        if (next && g.state !== 'gameover') g.state = next;
        g.matchTimer = msg.c;
        if (g.roundWins.player !== msg.w[0] || g.roundWins.cpu !== msg.w[1]) {
            g.roundWins = { player: msg.w[0], cpu: msg.w[1] };
            g.updatePips();
        }
        const myBefore = g.enemy.health;
        g.player.setNetTarget(msg.p, NET_STATES);
        g.enemy.setNetTarget(msg.e, NET_STATES);
        if (g.enemy.health < myBefore) g.triggerDamageFlash();
    }

    applyEffect(msg) {
        const g = this.game, vfx = g.vfx;
        const vec = a => new THREE.Vector3().fromArray(a);
        const owner = msg.o === 'p' ? g.player : g.enemy;
        switch (msg.k) {
            case 'proj': {
                const proj = vfx.spawnProjectile(owner, vec(msg.pos), vec(msg.dir), msg.cfg);
                this.projectiles.set(msg.id, proj);
                break;
            }
            case 'projx': {
                const proj = this.projectiles.get(msg.id);
                this.projectiles.delete(msg.id);
                const i = vfx.projectiles.indexOf(proj);
                if (i >= 0) vfx.removeProjectile(i);
                break;
            }
            case 'beam': vfx.spawnBeam(owner, vec(msg.pos), vec(msg.dir), msg.cfg); break;
            case 'sparks': vfx.createHitSparks(vec(msg.pos), msg.color, msg.count); break;
            case 'shake': vfx.shake(msg.amount); break;
            case 'snd': window.soundManager[msg.name](...msg.args); break;
            case 'ann': g.showAnnouncer(msg.text, msg.duration); break;
            case 'cutin': if (owner) g.showCutIn(owner); break;
            case 'num': g.spawnDamageNumber(vec(msg.pos), msg.damage, msg.critical); break;
            case 'label': g.spawnLabel(vec(msg.pos), msg.text); break;
            case 'combo': g.registerCombo(); break;
            case 'win': window.soundManager.playVictory(); break;
        }
    }

    // ─────────────────────────────────────────────
    //  COMPARTIR
    // ─────────────────────────────────────────────
    shareLink() {
        const url = `${location.origin}${location.pathname}?sala=${this.code}`;
        const text = 'Vení a pelear en Anime Clash 3D';
        if (navigator.share) {
            navigator.share({ title: 'Anime Clash 3D', text, url }).catch(() => {});
            return;
        }
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(
                () => this.setStatus('Link copiado. Pasáselo a tu rival.'),
                () => this.setStatus(url)
            );
            return;
        }
        this.setStatus(url);
    }
}

window.OnlineMatch = OnlineMatch;
