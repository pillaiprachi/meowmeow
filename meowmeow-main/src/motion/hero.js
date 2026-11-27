import THREE from '../vendor/three.r128.min.cjs';

const clamp = (value, min=0, max=1) => Math.min(max, Math.max(min, value));
const ss = (start, end, value) => {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
};
const lerp = (start, end, t) => start + (end - start) * t;

const VS=`uniform float uT,uS,uA,uDrapeFit,uDrapeShift;uniform vec3 uBlade[8];uniform vec2 uArtSize;
attribute vec3 aDrape,aDrapeU,aDrapeV;
varying vec3 vN,vV,vTg;varying vec2 vT,vU;varying float vDrapeDepth,vCav;
float f(vec2 q){float t=uT;return uA*(sin(q.x*1.9+q.y*.8+t*.42)*.34+sin(q.x*3.6-q.y*1.5-t*.33+1.3)*.15+sin(q.y*2.5+q.x*.5+t*.55+2.1)*.12+sin(q.x*7.1+q.y*3.3+t*.7)*.022);}
vec2 bladeEdges(float y){
  for(int i=0;i<7;i++){
    vec3 a=uBlade[i],b=uBlade[i+1];
    if(y<=b.z)return mix(a.xy,b.xy,(y-a.z)/(b.z-a.z));
  }
  return uBlade[7].xy;
}
void main(){
float v=1.-uv.y;
vec3 shoulder=uBlade[0];
float bladeLength=uBlade[7].z-shoulder.z;
float y=shoulder.z+v*bladeLength;
vec2 lr=bladeEdges(y);
float x=mix(lr.x,lr.y,uv.x);
vec2 tp=vec2((x-.5*(shoulder.x+shoulder.y))*5.6/bladeLength,(uv.y-.5)*5.6),sp=vec2((uv.x-.5)*6.4,(uv.y-.5)*4.4);
float s=smoothstep(0.,1.,clamp(uS*1.6-v*.6,0.,1.));vec2 p=mix(sp,tp,s);
float z=f(p);vec2 e=vec2(.03,0.);float dx=(f(p+e.xy)-f(p-e.xy))/.06,dy=(f(p+e.yx)-f(p-e.yx))/.06;
// The opening drape settles into the existing shape morph. The wave stays in its original coordinates.
float drape=1.-s;
vec3 normal=vec3(-dx,-dy,1.);
// Weft direction (across the tie). The fragment shader derives the warp from it.
vec3 tangent=vec3(1.,0.,dx);
vec3 surface=vec3(p,z);
vDrapeDepth=aDrape.z;
if(drape>0.){
  vec3 du=aDrapeU*uDrapeFit+vec3(0.,0.,dx*6.4);
  vec3 dv=aDrapeV*uDrapeFit+vec3(0.,0.,dy*4.4);
  normal=mix(normalize(normal),normalize(cross(du,dv)),drape);
  tangent=mix(normalize(tangent),normalize(du),drape);
  surface+=(aDrape*uDrapeFit+vec3(0.,uDrapeShift,0.)-vec3(sp,0.))*drape;
}
// Depth below the mean surface, used to darken fold valleys.
vCav=-z;
// Sample just inside the front blade so the source photo's background stays outside the mesh.
float printX=mix(lr.x,lr.y,mix(.018,.982,uv.x));
vT=vec2(printX/uArtSize.x,1.-y/uArtSize.y);
vN=normalize(normalMatrix*normal);
vTg=normalize((modelViewMatrix*vec4(tangent,0.)).xyz);
vec4 mv=modelViewMatrix*vec4(surface,1.);vV=-mv.xyz;vU=uv;gl_Position=projectionMatrix*mv;}`;

const FS=`uniform sampler2D uTex;uniform vec3 uCol;uniform float uPr,uS;
varying vec3 vN,vV,vTg;varying vec2 vT,vU;varying float vDrapeDepth,vCav;
vec3 toLinear(vec3 c){return pow(c,vec3(2.2));}
// Values below 0.8 pass through unchanged, so the printed photo still matches the product shot.
// Brighter highlights roll off smoothly instead of clipping to flat white.
vec3 toDisplay(vec3 c){vec3 o=max(c-.8,0.);c=min(c,.8)+.2*(1.-exp(-o/.2));return pow(c,vec3(1./2.2));}
// Thread highlight: silk reflects along its fibres as a band, not as a round spot.
float fibre(vec3 T,vec3 H,float p){float t=dot(T,H);return pow(sqrt(max(1.-t*t,0.)),p);}
void main(){
  vec3 N=normalize(vN);if(!gl_FrontFacing)N=-N;
  vec3 V=normalize(vV);float v=1.-vU.y;
  vec3 weft=normalize(vTg-N*dot(vTg,N));
  vec3 warp=cross(N,weft);
  vec4 tc=texture2D(uTex,vT);
  float fr=mix(.4,1.08,uPr);float pr=1.-smoothstep(fr-.07,fr,v);
  vec3 alb=toLinear(mix(uCol,tc.rgb,pr*tc.a));

  vec3 L1=normalize(vec3(-.45,.7,.8)),L2=normalize(vec3(.85,-.2,.5));
  float n1=max(dot(N,L1),0.),n2=max(dot(N,L2),0.);
  float pocket=mix(mix(.76,1.04,smoothstep(-.55,.57,vDrapeDepth)),1.,uS);
  float occ=(1.-.35*smoothstep(0.,.55,vCav))*pocket;
  // Normalised so a flat patch facing the camera is lit at exactly 1.
  vec3 col=alb*(.1+.84*n1+.2*n2)/.78*occ;

  vec3 H=normalize(L1+V);
  vec3 dye=alb/max(max(alb.r,alb.g),max(alb.b,.02));
  vec3 tint=mix(vec3(1.),dye,.6);
  float sheen=(fibre(warp,H,96.)*.5+fibre(weft,H,28.)*.12)*smoothstep(0.,.25,n1);
  float rim=pow(1.-max(dot(N,V),0.),4.);
  col+=(tint*sheen+mix(alb,vec3(1.),.25)*rim*.45)*occ*(1.-pr*.35);

  // The weave fades out before it gets finer than the pixels, so it never turns into moiré.
  vec2 cycles=vU*vec2(700.,900.)/6.2832;
  float fine=1.-smoothstep(.2,.45,max(fwidth(cycles.x),fwidth(cycles.y)));
  col*=1.+.03*fine*sin(vU.x*700.)*sin(vU.y*900.);
  col+=vec3(.93,.87,.72)*(1.-smoothstep(0.,.012,abs(v-fr)))*step(.01,uPr)*step(uPr,.99)*.35;
  gl_FragColor=vec4(toDisplay(col),1.);
}`;

// Corresponding points on the upper and lower selvedges, in the opening composition.
const drapeEdges = [
  [112,20,185,185],[134,15,201,180],[160,21,218,177],
  [186,36,236,176],[212,55,253,170],[235,64,268,155],
  [258,55,284,129],[283,40,301,105],[310,30,322,95],
  [338,33,348,99],[365,43,374,94],[391,56,399,85],[422,85,420,88]
];
const drapeScale = 106 / (8.2 * Math.tan(35 * Math.PI / 360));
const fold = (distance, width) => Math.exp(-(distance * distance) / (width * width));
function openingDrape(u, v) {
  const last = drapeEdges.length - 1;
  const at = clamp(u) * last;
  const i = Math.min(Math.floor(at), last - 1);
  const t = at - i;
  const across = 1 - v;
  const edge = component => {
    const a = drapeEdges[Math.max(0, i - 1)][component];
    const b = drapeEdges[i][component];
    const c = drapeEdges[i + 1][component];
    const d = drapeEdges[Math.min(last, i + 2)][component];
    return b + .5 * t * (c - a + t * (2*a - 5*b + 4*c - d + t * (3*b - a - 3*c + d)));
  };
  const bow = Math.sin(Math.PI * across);
  const x = lerp(edge(0), edge(2), across) + (1-u)**3 * bow * (34 - 38*across);
  const y = lerp(edge(1), edge(3), across) + 7*bow*Math.sin(2*Math.PI*u + .4) + 5*across**3*(1-u)**2;
  const lip = .235 + .38*fold(u - .33, .205) - .12*u;
  const lower = .84 - .37*u + .095*Math.sin(6*u);
  const z = (1.1-.17*u)*fold(across - lip, .19)
    - .66*fold(across - lip - .23, .15)*(.22 + .78*fold(u - .46, .32))
    + .87*fold(across - lower, .17)*fold(u - .27, .30)
    + .25*fold(u - .16 - .12*across, .06)*fold(across - .76, .25)
    - .33*fold(across - .055, .20) + .32*Math.sin(5.8*u + 1.4*across);
  const perspective = (1 - z / 8.2) / drapeScale;
  return [(x - 247)*perspective - .5, (106 - y)*perspective, z];
}

function addOpeningDrape(geometry) {
  const uv = geometry.attributes.uv;
  const position = new Float32Array(uv.count * 3);
  const tangentU = new Float32Array(position.length);
  const tangentV = new Float32Array(position.length);
  for (let i = 0; i < uv.count; i++) {
    const u = uv.getX(i), v = uv.getY(i), offset = i * 3;
    const point = openingDrape(u, v);
    const u0 = clamp(u - .003), u1 = clamp(u + .003);
    const v0 = clamp(v - .003), v1 = clamp(v + .003);
    const left = openingDrape(u0, v), right = openingDrape(u1, v);
    const bottom = openingDrape(u, v0), top = openingDrape(u, v1);
    position.set(point, offset);
    for (let axis = 0; axis < 3; axis++) {
      tangentU[offset + axis] = (right[axis] - left[axis]) / (u1 - u0);
      tangentV[offset + axis] = (top[axis] - bottom[axis]) / (v1 - v0);
    }
  }
  geometry.setAttribute('aDrape', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('aDrapeU', new THREE.BufferAttribute(tangentU, 3));
  geometry.setAttribute('aDrapeV', new THREE.BufferAttribute(tangentV, 3));
}

export function mountHero(canvas, heroSection, siteNav, onStage) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({canvas, alpha: true, antialias: true});
  } catch {
    return null;
  }
  const listeners = new AbortController();
  const {signal} = listeners;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 50);
  const texture = new THREE.TextureLoader().load('/hero-assets/la-corsa.webp');
  // Mipmaps keep the print clean when the cloth is small and let anisotropy work at grazing angles.
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  // Left edge, right edge and row in the La Corsa photo, from shoulder to tip.
  const blade = [
    [32,103,10],[29,105,100],[25,107,240],[21,108,350],
    [16,110,510],[12,113,635],[10,115,734],[63,63,787]
  ].map(point=>new THREE.Vector3(...point));
  const uniforms = {
    uT: {value: 0}, uS: {value: 0}, uA: {value: 1}, uPr: {value: 0},
    uDrapeFit: {value: 1}, uDrapeShift: {value: 0}, uTex: {value: texture},
    uCol: {value: new THREE.Vector3(.35, .40, .20)},
    uBlade: {value: blade}, uArtSize: {value: new THREE.Vector2(284, 800)}
  };
  const material = new THREE.ShaderMaterial({
    uniforms, vertexShader: VS, fragmentShader: FS, side: THREE.DoubleSide,
    extensions: {derivatives: true}
  });
  const geometry = new THREE.PlaneGeometry(1, 1, 72, 110);
  addOpeningDrape(geometry);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  const cloth = new THREE.Group();
  cloth.add(mesh);
  scene.add(cloth);
  let mobile = false, pointerX = 0, pointerY = 0, tiltX = 0, tiltY = 0, progress = 0;

  function resize() {
    // Use the canvas's real size (100svh), not innerHeight, so mobile browser bars don't stretch it.
    const width = canvas.clientWidth, height = canvas.clientHeight, header = siteNav.offsetHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    mobile = width < 760;
    uniforms.uDrapeFit.value = Math.min(Math.max(.35, 1 - header / height), width / height * (mobile ? 1 : .51));
    const openingScale = drapeScale * height / 212 * (mobile ? .6 : 1);
    uniforms.uDrapeShift.value = -.5 * header / openingScale;
  }
  const sizing = new ResizeObserver(resize);
  sizing.observe(canvas);
  resize();
  window.addEventListener('pointermove', event => {
    pointerX = event.clientX / innerWidth - .5;
    pointerY = event.clientY / innerHeight - .5;
  }, {signal});

  const start = performance.now();
  let frame, stage = -1, last = start;
  function draw(now) {
    frame = requestAnimationFrame(draw);
    const dt = Math.min((now - last) / 1000, .1);
    last = now;
    const {top, bottom, height} = heroSection.getBoundingClientRect();
    if (bottom < 0 || top > innerHeight) return;

    const view = canvas.clientHeight || innerHeight;
    const scroll = clamp(-top / (height - view));
    // The same easing at 60 Hz and 120 Hz.
    progress = reduced.matches ? scroll : lerp(progress, scroll, 1 - Math.exp(-dt * 4.4));
    // One change at a time, with a pause between each:
    // the silk settles, folds into the tie, takes the print, then the close-up.
    const calm = ss(.06, .22, progress);
    const shape = ss(.14, .40, progress);
    const print = ss(.50, .72, progress);
    const zoom = ss(.82, .97, progress);
    const time = reduced.matches ? 0 : (now - start) / 1000;
    uniforms.uT.value = time;
    uniforms.uS.value = shape;
    uniforms.uA.value = lerp(1, .1, calm);
    uniforms.uPr.value = print;

    const cameraY = mobile ? -1.85 * ss(.70, .90, progress) : -1.1 * zoom;
    camera.position.set(0, cameraY, lerp(lerp(8.2, 10.4, shape), mobile ? 7.2 : 6.4, zoom));
    camera.lookAt(0, cameraY, 0);
    cloth.position.x = mobile ? 0 : lerp(.5, 0, shape);
    cloth.scale.setScalar(mobile ? lerp(.6, .95, shape) : 1);
    // A gentle, smoothed response to the pointer so it doesn't compete with the scroll.
    const follow = 1 - Math.exp(-dt * 3);
    tiltX = lerp(tiltX, pointerX, follow);
    tiltY = lerp(tiltY, pointerY, follow);
    cloth.rotation.set(
      tiltY * .08 - .07 * (1 - shape),
      tiltX * .18 + Math.sin(time * .2) * .05 * (1 - shape),
      Math.sin(time * .5) * .012 * shape - .03 * (1 - shape)
    );
    renderer.render(scene, camera);

    const nextStage = progress < .14 ? 0 : progress < .50 ? 1 : progress < .82 ? 2 : 3;
    if (nextStage !== stage) {
      stage = nextStage;
      onStage(stage);
    }
  }
  frame = requestAnimationFrame(draw);
  return () => {
    listeners.abort();
    sizing.disconnect();
    cancelAnimationFrame(frame);
    geometry.dispose();
    material.dispose();
    texture.dispose();
    renderer.dispose();
  };
}
