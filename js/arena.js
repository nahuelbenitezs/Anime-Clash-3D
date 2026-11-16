// Canyon sanctuary: physically lit stone, layered terrain and GPU-driven atmosphere.
// The fighting surface remains 25 x 15 units, exactly at y = 0.
const ARENA_COLORS = {
    skyTop: '#29394f', skyMid: '#bc8177', skyLow: '#f4bf83',
    ink: '#171b24', farHill: '#a58e90', midHill: '#775c5b', nearHill: '#4e4247',
    stone: '#c3bdab', stoneDark: '#665f59', stoneLine: '#4c4948', fog: 0xb89c8d,
};

function canvasTexture(w, h, draw) {
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    draw(canvas.getContext('2d'), w, h);
    const tex = new THREE.CanvasTexture(canvas);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
}

function seededRandom(seed) {
    let s = seed;
    return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

class Arena {
    constructor(scene) {
        this.scene = scene;
        this.root = new THREE.Group();
        this.root.name = 'Canyon sanctuary';
        scene.add(this.root);
        this.time = 0;
        this.quality = 1;
        this.textures = [];
        this.disposed = false;
        this.matrix = new THREE.Matrix4();
        this.dummy = new THREE.Object3D();
        this.buildSky();
        this.buildTerrain();
        this.buildRing();
        this.buildSanctuary();
        this.buildAtmosphere();
        this.loadStone();
    }

    material(color, roughness = 0.88) {
        return new THREE.MeshStandardMaterial({ color: window.inkColor(color), roughness, metalness: 0.04 });
    }

    mesh(geometry, material, x, y, z) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        this.root.add(mesh);
        return mesh;
    }

    // Repeated stones share geometry/material and are submitted in one draw call.
    instances(geometry, material, entries, shadows = false) {
        const mesh = new THREE.InstancedMesh(geometry, material, entries.length);
        const d = this.dummy;
        entries.forEach((e, i) => {
            d.position.set(e.x || 0, e.y || 0, e.z || 0);
            d.rotation.set(e.rx || 0, e.ry || 0, e.rz || 0);
            d.scale.set(e.sx || 1, e.sy || 1, e.sz || 1);
            d.updateMatrix(); mesh.setMatrixAt(i, d.matrix);
            if (e.color !== undefined) mesh.setColorAt(i, new THREE.Color(e.color));
        });
        mesh.castShadow = shadows; mesh.receiveShadow = true;
        mesh.instanceMatrix.needsUpdate = true;
        this.root.add(mesh);
        return mesh;
    }

    buildSky() {
        const material = new THREE.ShaderMaterial({
            side: THREE.BackSide, depthWrite: false, fog: false,
            uniforms: { uTime: { value: 0 } },
            vertexShader: `varying vec3 vDirection; void main() {
                vDirection = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }`,
            fragmentShader: `varying vec3 vDirection; uniform float uTime;
                float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
                float noise(vec2 p) { vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
                    return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y); }
                void main() {
                    vec3 d=normalize(vDirection); float h=clamp(d.y*2.1+0.15,0.,1.);
                    vec3 sky=mix(vec3(.97,.70,.46),vec3(.15,.23,.34),pow(h,.65));
                    vec2 uv=vec2(atan(d.x,-d.z)*3.,d.y*13.);
                    float n=noise(uv*vec2(1.,3.)+vec2(uTime*.009,0.));
                    n+=noise(uv*vec2(2.,5.)-vec2(uTime*.013,0.))*.35;
                    float clouds=smoothstep(.65,1.05,n)*smoothstep(.02,.2,d.y)*(1.-smoothstep(.48,.8,d.y));
                    sky=mix(sky,vec3(.88,.66,.58),clouds*.55);
                    float sun=max(0.,dot(d,normalize(vec3(-.25,.2,-1.))));
                    sky+=vec3(1.,.47,.16)*pow(sun,22.)*.28;
                    gl_FragColor=vec4(sky,1.);
                }`,
        });
        this.sky = this.mesh(new THREE.SphereGeometry(145, 24, 16), material, 0, 0, 0);
        this.sky.renderOrder = -10;
        const halo = canvasTexture(256, 256, (ctx, w) => {
            const g = ctx.createRadialGradient(w/2,w/2,0,w/2,w/2,w/2);
            g.addColorStop(0,'rgba(255,246,211,1)'); g.addColorStop(.12,'rgba(255,224,163,.95)');
            g.addColorStop(.23,'rgba(255,193,102,.22)'); g.addColorStop(1,'rgba(255,154,70,0)');
            ctx.fillStyle=g; ctx.fillRect(0,0,w,w);
        });
        this.textures.push(halo);
        const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
        sun.position.set(-22,18,-87); sun.scale.set(43,43,1); this.root.add(sun);
        // Matte painting original en el horizonte; el cielo procedural queda de respaldo.
        new THREE.TextureLoader().load('assets/environment/sunset-sky.png', texture => {
            if (this.disposed) { texture.dispose(); return; }
            texture.encoding = THREE.sRGBEncoding;
            this.textures.push(texture);
            const backdrop = this.mesh(new THREE.PlaneGeometry(360, 180), new THREE.MeshBasicMaterial({
                map: texture, fog: false, depthWrite: false, toneMapped: false,
            }), 0, 55, -110);
            backdrop.renderOrder = -9;
            sun.visible = false;
        }, undefined, () => {});
    }

    buildTerrain() {
        const groundMat = this.material(0x6b625b);
        const ground = this.mesh(new THREE.PlaneGeometry(260, 220),groundMat,0,-2.45,-35);
        ground.rotation.x=-Math.PI/2; ground.receiveShadow=true;
        this.rockMat = this.material(0x867a6d);
        const farMat = this.material(0xa39491);
        const rockGeo = new THREE.DodecahedronGeometry(1,1);
        const rand=seededRandom(812), far=[], near=[], rubble=[];
        // Real volumes instead of background cards: perspective changes during the cinematic.
        for(let i=0;i<34;i++) {
            const x=-92+i*5.6, h=5+rand()*13;
            far.push({x,y:h*.32-4,z:-65-rand()*20,sx:7+rand()*5,sy:h*.72,sz:6+rand()*8,ry:rand()*6,rz:(rand()-.5)*.35});
        }
        for(let i=0;i<26;i++) {
            const side=i%2?1:-1, x=side*(23+rand()*40), h=7+rand()*18;
            near.push({x,y:h*.29-3,z:-22-rand()*36,sx:5+rand()*7,sy:h*.65,sz:4+rand()*6,ry:rand()*6,rz:(rand()-.5)*.45});
        }
        for(let i=0;i<62;i++) {
            const side=i%2?1:-1, size=.25+rand()*1.8;
            rubble.push({x:side*(15+rand()*22),y:-2.3+size*.38,z:-13+rand()*32,sx:size*1.5,sy:size*.75,sz:size,rx:rand()*2,ry:rand()*6,color:i%3?0x8a8071:0x5d5a55});
        }
        this.instances(rockGeo,farMat,far);
        this.instances(rockGeo,this.rockMat,near);
        this.instances(rockGeo,this.rockMat,rubble,true);
        // Shore sand and sparse, wind-swept grass soften the silhouette of the platform.
        const grasses=[];
        for(let i=0;i<100;i++) {
            const side=i%2?1:-1;
            grasses.push({x:side*(14+rand()*10),y:-2.1,z:-9+rand()*23,sx:.035,sy:.35+rand()*.6,sz:.035,rz:(rand()-.5)*.4,color:i%2?0xa5976e:0x706f55});
        }
        this.grass=this.instances(new THREE.BoxGeometry(1,1,1),this.material(0xa5976e),grasses);
        this.groundMat=groundMat;
    }

    buildRing() {
        const box=new THREE.BoxGeometry(1,1,1);
        const base=this.material(0x484a4d), trim=this.material(0x8f8170), tileMat=this.material(0x9a9c94,.82);
        this.tileMat=tileMat;
        const foundation=this.mesh(new THREE.BoxGeometry(28,1.2,18),base,0,-1.8,0); foundation.receiveShadow=true;
        const upper=this.mesh(new THREE.BoxGeometry(26,0.6,16),trim,0,-.9,0); upper.receiveShadow=true;
        const under=this.mesh(new THREE.BoxGeometry(25.3,.34,15.3),base,0,-.43,0); under.receiveShadow=true;
        const rand=seededRandom(17), tiles=[];
        for(let z=0;z<6;z++)for(let x=0;x<10;x++) {
            const shade=.82+rand()*.14;
            tiles.push({x:-11.25+x*2.5,y:-.13,z:-6.25+z*2.5,sx:2.478,sy:.26,sz:2.478,color:new THREE.Color(shade,shade*.985,shade*.955).getHex()});
        }
        this.instances(box,tileMat,tiles);
        // Recessed bronze edge, with an emissive core kept deliberately thin.
        const edges=[];
        for(const z of [-7.4,7.4])edges.push({x:0,y:-.012,z,sx:24.8,sy:.035,sz:.075});
        for(const x of [-12.4,12.4])edges.push({x,y:-.012,z:0,sx:.075,sy:.035,sz:14.8});
        this.instances(box,this.material(0xc5a06a,.4),edges);
        const etches=canvasTexture(1024,614,(ctx,w,h)=>{
            const r=seededRandom(10); ctx.clearRect(0,0,w,h);
            for(let i=0;i<80;i++) {
                let x=r()*w,y=r()*h; ctx.strokeStyle='rgba(39,41,44,.27)';ctx.lineWidth=.7+r()*1.5;ctx.beginPath();ctx.moveTo(x,y);
                for(let j=0;j<3;j++){x+=(r()-.5)*35;y+=(r()-.5)*25;ctx.lineTo(x,y);}ctx.stroke();
            }
            ctx.translate(w/2,h/2);ctx.scale(w/25,h/15);
            ctx.strokeStyle='rgba(52,66,68,.48)';ctx.lineWidth=.035;
            for(const radius of [2.9,3.1,4.5,4.6]){ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.stroke();}
            for(let i=0;i<32;i++) {
                const a=i*Math.PI/16;ctx.save();ctx.rotate(a);ctx.fillStyle='rgba(57,65,65,.5)';ctx.fillRect(3.4,-.025,i%4===0?.75:.3,.05);ctx.restore();
            }
            ctx.strokeStyle='rgba(59,68,66,.55)';ctx.lineWidth=.06;ctx.beginPath();
            for(let i=0;i<7;i++){const a=i*Math.PI/3;ctx.lineTo(Math.cos(a)*1.35,Math.sin(a)*1.35);}ctx.stroke();
            ctx.lineWidth=.035;ctx.beginPath();ctx.moveTo(-1.1,0);ctx.lineTo(1.1,0);ctx.moveTo(0,-1.1);ctx.lineTo(0,1.1);ctx.stroke();
        });
        this.textures.push(etches);
        const decal=this.mesh(new THREE.PlaneGeometry(25,15),new THREE.MeshBasicMaterial({map:etches,transparent:true,depthWrite:false,opacity:.8}),0,.007,0);
        decal.rotation.x=-Math.PI/2;
        this.energyMaterial=new THREE.MeshStandardMaterial({color:0x7ce2d5,emissive:0x3ba998,emissiveIntensity:.6,roughness:.35,metalness:.25});
        const ring=this.mesh(new THREE.TorusGeometry(4.55,.018,4,96),this.energyMaterial,0,.016,0);ring.rotation.x=Math.PI/2;
        const runes=[];
        for(let i=0;i<16;i++){const a=i*Math.PI/8;runes.push({x:Math.cos(a)*4.15,y:.015,z:Math.sin(a)*4.15,sx:.18,sy:.018,sz:.035,ry:-a});}
        this.instances(box,this.energyMaterial,runes);
        // Steps connect the structure to its surroundings; none rise above the fighting plane.
        this.instances(box,trim,[
            {x:0,y:-2.18,z:10,sx:9,sy:.5,sz:2.8},
            {x:0,y:-1.77,z:9.2,sx:8.5,sy:.4,sz:2.4},
            {x:0,y:-1.4,z:8.4,sx:8,sy:.35,sz:1.7},
        ]);
        // Fine warm strip and chamfer-like bands make the base read as an engineered ruin.
        const bands=[];
        for(const z of [-8.99,8.99])bands.push({x:0,y:-1.5,z,sx:27.8,sy:.065,sz:.04});
        this.instances(box,new THREE.MeshBasicMaterial({color:0xe6ac68}),bands);
    }

    buildSanctuary() {
        const stone=this.material(0x9a8f7c), dark=this.material(0x5b5e5b), bronze=this.material(0x9d8460,.53);
        this.archMat=stone;
        const blocks=[], darkBlocks=[], bronzeBlocks=[];
        // An ancient gateway anchors the centre of the canyon without occluding the ring.
        for(const x of [-9.5,9.5]) {
            blocks.push({x,y:2.4,z:-20,sx:2.4,sy:9.7,sz:2.4});
            darkBlocks.push({x,y:-1.7,z:-20,sx:3.5,sy:1.5,sz:3.5},{x,y:6.7,z:-20,sx:3.5,sy:.55,sz:3.5});
            bronzeBlocks.push({x,y:3.8,z:-20,sx:2.5,sy:.16,sz:2.5});
        }
        blocks.push({x:0,y:7.45,z:-20,sx:23,sy:1.2,sz:2.5},{x:0,y:8.27,z:-20,sx:25,sy:.5,sz:3});
        darkBlocks.push({x:0,y:6.9,z:-20,sx:20,sy:.22,sz:2.7});
        // Broken side colonnades become a visual frame, never foreground obstacles.
        [[-17,-13,5.5],[-21,-20,7.5],[17,-14,6.6],[22,-23,8.4]].forEach(([x,z,h],i)=>{
            blocks.push({x,y:h*.5-2.4,z,sx:2,sy:h,sz:2,rz:i%2?.045:-.03});
            darkBlocks.push({x,y:h-2.4,z,sx:2.9,sy:.4,sz:2.9},{x,y:-2,z,sx:3,sy:.8,sz:3});
            bronzeBlocks.push({x,y:h*.6-2.4,z,sx:2.1,sy:.12,sz:2.1});
        });
        const cube=new THREE.BoxGeometry(1,1,1);
        this.instances(cube,stone,blocks,true);this.instances(cube,dark,darkBlocks);this.instances(cube,bronze,bronzeBlocks);
        const haloMaterial=new THREE.MeshBasicMaterial({color:0xffc784,transparent:true,opacity:.23,blending:THREE.AdditiveBlending,depthWrite:false});
        this.portal=this.mesh(new THREE.TorusGeometry(2.7,.035,4,64),this.energyMaterial,0,3.8,-20);
        this.portalGlow=this.mesh(new THREE.TorusGeometry(2.7,.12,4,64),haloMaterial,0,3.8,-20.01);
        const lanterns=[];
        for(const x of [-12.5,12.5]){
            lanterns.push({x,y:.75,z:-7.7,sx:.5,sy:.7,sz:.5});
        }
        this.instances(cube,new THREE.MeshStandardMaterial({color:0xffd99c,emissive:0xffb85f,emissiveIntensity:1.6}),lanterns);
        this.instances(cube,dark,[{x:-12.5,y:-.1,z:-7.7,sx:1,sy:1.05,sz:1},{x:12.5,y:-.1,z:-7.7,sx:1,sy:1.05,sz:1}]);
    }

    buildAtmosphere() {
        const count=140, rand=seededRandom(622), positions=new Float32Array(count*3),phase=new Float32Array(count);
        for(let i=0;i<count;i++){positions[i*3]=(rand()-.5)*64;positions[i*3+1]=rand()*13;positions[i*3+2]=-34+rand()*55;phase[i]=rand()*10;}
        const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setAttribute('aPhase',new THREE.BufferAttribute(phase,1));
        this.dust=new THREE.Points(geo,new THREE.ShaderMaterial({
            transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
            uniforms:{uTime:{value:0},uOpacity:{value:.6}},
            vertexShader:`attribute float aPhase;uniform float uTime;varying float vAlpha;
                void main(){vec3 p=position;p.x+=sin(uTime*.13+aPhase)*1.3;p.y+=sin(uTime*.21+aPhase)*.7;
                    vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(38./max(1.,-mv.z),1.,3.);
                    vAlpha=(.3+.3*sin(aPhase+uTime*.7))*clamp((-mv.z-3.)/12.,0.,1.);}`,
            fragmentShader:`varying float vAlpha;uniform float uOpacity;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;
                gl_FragColor=vec4(1.,.79,.48,(1.-d*d)*vAlpha*uOpacity);}`,
        }));
        this.dust.frustumCulled=false;this.root.add(this.dust);
        // Slanted haze planes simulate shafts without an expensive volumetric pass.
        const shaftTex=canvasTexture(64,256,(ctx,w,h)=>{
            const g=ctx.createLinearGradient(0,0,w,0);g.addColorStop(0,'rgba(255,226,181,0)');g.addColorStop(.5,'rgba(255,226,181,.22)');g.addColorStop(1,'rgba(255,226,181,0)');
            ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
            ctx.globalCompositeOperation='destination-in';const a=ctx.createLinearGradient(0,0,0,h);a.addColorStop(0,'rgba(0,0,0,0)');a.addColorStop(.4,'rgba(0,0,0,1)');a.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=a;ctx.fillRect(0,0,w,h);
        });
        this.textures.push(shaftTex);
        this.shafts=new THREE.Group();this.root.add(this.shafts);
        const shaftMat=new THREE.MeshBasicMaterial({map:shaftTex,transparent:true,opacity:.3,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
        for(let i=0;i<3;i++){
            const beam=new THREE.Mesh(new THREE.PlaneGeometry(4+i*1.5,24),shaftMat);beam.position.set(-13+i*9,8,-16-i*5);beam.rotation.z=-.43;this.shafts.add(beam);
        }
    }

    loadStone() {
        const loader=new THREE.TextureLoader();
        const load=(name,targets,key,repeat,color)=>{
            loader.load(`assets/environment/stone-${name}.jpg`,texture=>{
                if(this.disposed){texture.dispose();return;}
                texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(repeat,repeat);texture.anisotropy=4;
                if(color)texture.encoding=THREE.sRGBEncoding;
                this.textures.push(texture);
                targets.forEach(material=>{material[key]=texture;material.needsUpdate=true;});
            },undefined,()=>{}); // Geometry and base colours still work when an asset is unavailable.
        };
        load('color',[this.rockMat,this.groundMat,this.archMat],'map',5,true);
        load('normal',[this.tileMat],'normalMap',2,false);
        this.tileMat.normalScale=new THREE.Vector2(.18,.18);
        load('roughness',[this.tileMat,this.rockMat],'roughnessMap',2,false);
    }

    update(dt) {
        this.time+=Math.min(dt,.1);
        this.sky.material.uniforms.uTime.value=this.time;
        this.dust.material.uniforms.uTime.value=this.time;
        this.energyMaterial.emissiveIntensity=.5+Math.sin(this.time*.8)*.08;
        this.portal.rotation.z=this.time*.025;
        this.portalGlow.material.opacity=.19+Math.sin(this.time*1.2)*.035;
    }

    setQuality(quality) {
        this.quality=quality;
        this.dust.geometry.setDrawRange(0,quality<.7?60:140);
        this.shafts.visible=quality>=.7;
        this.grass.visible=quality>=.6;
    }

    dispose() {
        this.disposed=true;
        const geometries=new Set(),materials=new Set();
        this.root.traverse(object=>{
            if(object.geometry)geometries.add(object.geometry);
            if(object.material)(Array.isArray(object.material)?object.material:[object.material]).forEach(m=>materials.add(m));
        });
        geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());this.textures.forEach(t=>t.dispose());
        this.scene.remove(this.root);
    }
}

window.Arena=Arena;
window.ARENA_COLORS=ARENA_COLORS;
window.canvasTexture=canvasTexture;
