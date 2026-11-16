// Bloom a media resolución y acabado final. La calidad baja dibuja sin postproceso.
class CinematicRenderer {
    constructor(renderer, scene, camera) {
        Object.assign(this, { renderer, scene, camera, enabled: true, energy: 0 });
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.size = new THREE.Vector2();
        this.target = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: true, stencilBuffer: false });
        this.target.texture.encoding = THREE.sRGBEncoding;
        this.blurA = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false, stencilBuffer: false });
        this.blurB = this.blurA.clone();
        const vertexShader = `varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
        this.blur = new THREE.ShaderMaterial({
            uniforms: { tSource: { value: null }, uStep: { value: new THREE.Vector2() }, uExtract: { value: 1 } },
            vertexShader, depthTest: false, depthWrite: false, toneMapped: false,
            fragmentShader: `varying vec2 vUv; uniform sampler2D tSource; uniform vec2 uStep; uniform float uExtract;
                vec3 light(vec2 uv){vec3 c=texture2D(tSource,uv).rgb;float b=max(c.r,max(c.g,c.b));return mix(c,c*smoothstep(.73,1.,b),uExtract);}
                void main(){vec3 c=light(vUv)*.227027;
                    c+=(light(vUv+uStep*1.384615)+light(vUv-uStep*1.384615))*.316216;
                    c+=(light(vUv+uStep*3.230769)+light(vUv-uStep*3.230769))*.070270;
                    gl_FragColor=vec4(c,1.);}`
        });
        this.finish = new THREE.ShaderMaterial({
            uniforms: { tScene: { value: this.target.texture }, tBloom: { value: this.blurB.texture },
                uEnergy: { value: 0 }, uTime: { value: 0 }, uMotion: { value: this.reducedMotion ? 0 : 1 } },
            vertexShader, depthTest: false, depthWrite: false, toneMapped: false,
            fragmentShader: `varying vec2 vUv;uniform sampler2D tScene,tBloom;uniform float uEnergy,uTime,uMotion;
                void main(){vec2 p=vUv-.5;vec3 c=texture2D(tScene,vUv).rgb;vec3 glow=texture2D(tBloom,vUv).rgb;
                    c+=glow*(.19+uEnergy*.15)*(1.-c*.65);
                    float lum=dot(c,vec3(.2126,.7152,.0722));
                    c=mix(c,c*vec3(.96,1.015,1.045),.22*(1.-lum));
                    float edge=smoothstep(.15,.68,length(p*vec2(1.,.85)));
                    c*=1.-edge*(.12+uEnergy*.07);
                    float a=atan(p.y,p.x);float lines=pow(max(0.,sin(a*92.+uTime*3.)),28.);
                    c+=vec3(.11,.17,.2)*lines*edge*uEnergy*.24*uMotion;
                    gl_FragColor=vec4(c,1.);}`
        });
        this.quadScene = new THREE.Scene();
        this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.finish);
        this.quad.frustumCulled = false;
        this.quadScene.add(this.quad);
        this.quadCamera = new THREE.Camera();
        this.resize();
    }
    resize() {
        this.renderer.getDrawingBufferSize(this.size);
        this.target.setSize(this.size.x, this.size.y);
        const w = Math.max(1, Math.round(Math.min(960, this.size.x * .45)));
        const h = Math.max(1, Math.round(w * this.size.y / this.size.x));
        this.blurA.setSize(w, h); this.blurB.setSize(w, h);
    }
    setQuality(q) { this.enabled = q >= .65; }
    render(dt, energy = 0) {
        if (!this.enabled) { this.renderer.render(this.scene, this.camera); return; }
        this.energy += (energy - this.energy) * (1 - Math.exp(-dt * 9));
        const r = this.renderer;
        r.setRenderTarget(this.target); r.render(this.scene, this.camera);
        this.quad.material = this.blur;
        this.blur.uniforms.tSource.value = this.target.texture;
        this.blur.uniforms.uExtract.value = 1;
        this.blur.uniforms.uStep.value.set(1 / this.blurA.width, 0);
        r.setRenderTarget(this.blurA); r.render(this.quadScene, this.quadCamera);
        this.blur.uniforms.tSource.value = this.blurA.texture;
        this.blur.uniforms.uExtract.value = 0;
        this.blur.uniforms.uStep.value.set(0, 1 / this.blurA.height);
        r.setRenderTarget(this.blurB); r.render(this.quadScene, this.quadCamera);
        this.quad.material = this.finish;
        this.finish.uniforms.uEnergy.value = this.energy;
        this.finish.uniforms.uTime.value += dt;
        r.setRenderTarget(null); r.render(this.quadScene, this.quadCamera);
    }
    dispose() {
        [this.target, this.blurA, this.blurB, this.blur, this.finish, this.quad.geometry].forEach(r => r.dispose());
    }
}
window.CinematicRenderer = CinematicRenderer;
