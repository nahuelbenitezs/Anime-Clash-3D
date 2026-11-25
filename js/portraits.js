// Retratos reales de cada luchador, generados una vez al cargar a partir de su modelo 3D.
// Reemplazan a los emoji de la selección, el HUD, la viñeta y la pantalla final.
const PORTRAIT_FRAME = {
    goku: { x: 0, y: 1.5, dist: 2.2, turn: 0.45 },
    naruto: { x: 0, y: 1.5, dist: 2.2, turn: 0.4 },
    tanjiro: { x: 0, y: 1.5, dist: 2.2, turn: 0.4 },
    gojo: { x: 0, y: 1.56, dist: 2.35, turn: 0.3 },
    luffy: { x: 0, y: 1.48, dist: 2.45, turn: 0.35 },
    vegeta: { x: 0, y: 1.66, dist: 2.2, turn: 0.4 },
    pikachu: { x: 0, y: 0.95, dist: 2.3, turn: 0.3 },
    charizard: { x: -0.1, y: 2.3, dist: 4.4, turn: 0.1 },
};

function makePortraits(types) {
    const size = 256;
    const portraits = {};
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(size, size, false);
    renderer.setPixelRatio(1);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xfff2dc, 0x6b4a36, 0.85));
    const key = new THREE.DirectionalLight(0xfff0d6, 0.95);
    key.position.set(-3, 5, 5);
    scene.add(key);
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);

    // Los luchadores se reutilizan sin efectos ni eventos: solo interesa su aspecto
    const noVfx = { emitAura() {}, emitLightning() {} };
    types.forEach(type => {
        const fighter = new Fighter(type, true, scene, noVfx, {});
        const height = FIGHTER_STATS[type].height;
        const frame = PORTRAIT_FRAME[type] || { x: 0, y: height * 0.73, dist: height * 1.12, turn: 0.3 };
        fighter.group.position.set(0, 0, 0);
        fighter.group.rotation.y = frame.turn;
        fighter.updatePose(1);
        scene.updateMatrixWorld(true);

        camera.position.set(frame.x, frame.y + 0.1, frame.dist);
        camera.lookAt(frame.x, frame.y - 0.1, 0);
        renderer.render(scene, camera);
        portraits[type] = renderer.domElement.toDataURL('image/png');
        scene.remove(fighter.group);
    });

    renderer.dispose();
    if (renderer.forceContextLoss) renderer.forceContextLoss();
    return portraits;
}

window.makePortraits = makePortraits;
