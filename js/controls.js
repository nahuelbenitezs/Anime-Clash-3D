// Mobile Touch & Keyboard Input Manager
class InputManager {
    constructor() {
        this.moveVector = { x: 0, z: 0 };
        this.actions = {
            attack: false,
            blast: false,
            charge: false,
            dash: false,
            ultimate: false,
            guard: false
        };
        // Un toque rápido entre dos cuadros no se puede perder: queda anotado hasta leerlo
        this.latched = {};

        this.keys = {};
        this.joystickTouchId = null;
        this.joystickCenter = { x: 0, y: 0 };
        this.joystickRadius = 45;

        this.preventBattleZoom();
        this.setupKeyboard();
        this.setupTouchControls();
    }

    // En Safari iOS el zoom por doble toque puede ignorar touch-action. Se cancela
    // solo sobre la arena durante la pelea; los menús conservan su navegación.
    preventBattleZoom() {
        let lastTap = 0;
        document.addEventListener('touchend', e => {
            if (!document.body.classList.contains('in-battle') || document.body.classList.contains('is-paused')) { lastTap = 0; return; }
            if (e.target.closest && e.target.closest('button, input, .overlay')) { lastTap = 0; return; }
            if (e.changedTouches.length !== 1 || e.touches.length) { lastTap = 0; return; }
            const now = performance.now();
            if (lastTap && now - lastTap < 350 && e.cancelable) e.preventDefault();
            lastTap = now;
        }, { passive: false });
        document.addEventListener('gesturestart', e => {
            if (document.body.classList.contains('in-battle') && !document.body.classList.contains('is-paused') && e.cancelable) e.preventDefault();
        }, { passive: false });
    }

    setupKeyboard() {
        const gameKeys = new Set([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']);
        const keyAction = {
            j: 'attack', z: 'attack', k: 'blast', x: 'blast', l: 'charge', c: 'charge',
            u: 'ultimate', v: 'ultimate', i: 'guard', b: 'guard', ' ': 'dash', shift: 'dash',
        };
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (gameKeys.has(key)) e.preventDefault();
            if (document.body.classList.contains('orientation-locked')) return;
            if (!e.repeat && keyAction[key]) this.latched[keyAction[key]] = true;
            this.keys[key] = true;
            this.updateKeyboardInput();
        });

        // Si la ventana pierde el foco, el keyup nunca llega y las teclas quedarían trabadas
        window.addEventListener('blur', () => {
            this.keys = {};
            this.updateKeyboardInput();
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.updateKeyboardInput();
        });
    }

    updateKeyboardInput() {
        let x = 0;
        let z = 0;

        if (this.keys['a'] || this.keys['arrowleft']) x -= 1;
        if (this.keys['d'] || this.keys['arrowright']) x += 1;
        if (this.keys['w'] || this.keys['arrowup']) z -= 1;
        if (this.keys['s'] || this.keys['arrowdown']) z += 1;

        // Normalize
        const len = Math.hypot(x, z);
        if (len > 0) {
            this.moveVector.x = x / len;
            this.moveVector.z = z / len;
        } else if (this.joystickTouchId === null) {
            this.moveVector.x = 0;
            this.moveVector.z = 0;
        }

        // Action Keys
        this.actions.attack = !!(this.keys['j'] || this.keys['z']);
        this.actions.blast = !!(this.keys['k'] || this.keys['x']);
        this.actions.charge = !!(this.keys['l'] || this.keys['c']);
        this.actions.dash = !!(this.keys[' '] || this.keys['shift']);
        this.actions.ultimate = !!(this.keys['u'] || this.keys['v']);
        this.actions.guard = !!(this.keys['i'] || this.keys['b']);
    }

    wants(action) {
        return this.actions[action] || !!this.latched[action];
    }

    reset() {
        this.keys = {};
        this.latched = {};
        this.joystickTouchId = null;
        this.moveVector.x = this.moveVector.z = 0;
        Object.keys(this.actions).forEach(action => { this.actions[action] = false; });
        const knob = document.getElementById('joystick-knob');
        if (knob) knob.style.transform = 'translate(0px, 0px)';
        document.querySelectorAll('#touch-controls .active').forEach(button => button.classList.remove('active'));
    }

    endFrame() {
        this.latched = {};
    }

    setupTouchControls() {
        const joyZone = document.getElementById('joystick-zone');
        const joyKnob = document.getElementById('joystick-knob');

        if (joyZone && joyKnob) {
            const handleTouchStart = (e) => {
                if (e.cancelable) e.preventDefault();
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const touch = e.changedTouches[i];
                    if (this.joystickTouchId === null) {
                        this.joystickTouchId = touch.identifier;
                        const rect = joyZone.getBoundingClientRect();
                        this.joystickCenter = {
                            x: rect.left + rect.width / 2,
                            y: rect.top + rect.height / 2
                        };
                        this.updateJoystick(touch.clientX, touch.clientY, joyKnob);
                        break;
                    }
                }
            };

            const handleTouchMove = (e) => {
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const touch = e.changedTouches[i];
                    if (touch.identifier === this.joystickTouchId) {
                        if (e.cancelable) e.preventDefault();
                        this.updateJoystick(touch.clientX, touch.clientY, joyKnob);
                        break;
                    }
                }
            };

            const handleTouchEnd = (e) => {
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const touch = e.changedTouches[i];
                    if (touch.identifier === this.joystickTouchId) {
                        this.joystickTouchId = null;
                        this.moveVector.x = 0;
                        this.moveVector.z = 0;
                        joyKnob.style.transform = `translate(0px, 0px)`;
                        break;
                    }
                }
            };

            joyZone.addEventListener('touchstart', handleTouchStart, { passive: false });
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('touchend', handleTouchEnd, { passive: false });
            window.addEventListener('touchcancel', handleTouchEnd, { passive: false });
        }

        // Action Buttons Binding
        this.bindActionButton('btn-attack', 'attack');
        this.bindActionButton('btn-blast', 'blast');
        this.bindActionButton('btn-charge', 'charge', true); // continuous charge
        this.bindActionButton('btn-ultimate', 'ultimate');
        this.bindActionButton('btn-dash', 'dash');
        this.bindActionButton('btn-guard', 'guard', true);
    }

    updateJoystick(clientX, clientY, knobElement) {
        const dx = clientX - this.joystickCenter.x;
        const dy = clientY - this.joystickCenter.y;
        const dist = Math.hypot(dx, dy);

        const clampedDist = Math.min(dist, this.joystickRadius);
        const angle = Math.atan2(dy, dx);

        const knobX = Math.cos(angle) * clampedDist;
        const knobY = Math.sin(angle) * clampedDist;
        knobElement.style.transform = `translate(${knobX}px, ${knobY}px)`;

        if (dist > 10) {
            this.moveVector.x = knobX / this.joystickRadius;
            this.moveVector.z = knobY / this.joystickRadius;
        } else {
            this.moveVector.x = 0;
            this.moveVector.z = 0;
        }
    }

    bindActionButton(elementId, actionName, isHold = false) {
        const btn = document.getElementById(elementId);
        if (!btn) return;

        const press = (e) => {
            if (e.cancelable) e.preventDefault();
            btn.classList.add('active');
            this.actions[actionName] = true;
            this.latched[actionName] = true;
            window.buzz(20);
        };

        const release = (e) => {
            if (e.cancelable) e.preventDefault();
            btn.classList.remove('active');
            this.actions[actionName] = false;
        };

        btn.addEventListener('touchstart', press, { passive: false });
        btn.addEventListener('touchend', release, { passive: false });
        btn.addEventListener('touchcancel', release, { passive: false });

        btn.addEventListener('mousedown', press);
        btn.addEventListener('mouseup', release);
        btn.addEventListener('mouseleave', release);
    }
}

window.InputManager = InputManager;
