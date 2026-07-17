/**
 * The obsidian cube.
 * Six faces, six case studies. Centre tile = the case (a button). The four edge
 * tiles = the four skills that case used. Corners stay plain.
 *
 * Physical behaviour follows CUBE-SPEC.md: rigid layer turns, 90/180/270 only,
 * ease-in / fast middle / magnetic snap, counter-tilt for mass, museum drift.
 *
 * Only outer-layer (face) turns are ever used, never middle slices, so the six
 * centres physically cannot move. That is what makes them reliable buttons.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';

const GOLD = '#C9A24B';
const GOLD_LIT = '#E8C877';
const BODY = '#0E0C0A';

/* ---------- the six faces ---------- */
/* Placement note: the cube rests in a 3/4 view, so +Z / +X / -Z / -X rotate past
   the viewer on the idle drift and +Y (top) stays visible. -Y (bottom) is only
   reachable by dragging, so the weakest piece lives there. */
const FACES = [
  { key:'fmcg',       axis:'z', dir: 1, mark:'colander',
    name:'FMCG Research',      tag:'Research & Insight',   href:'Regional-Palate-Case-Study.html',
    tiles:['INSIGHT','RESEARCH','BRAND','PACKAGING'],
    skills:['Consumer Insight','Market Research (qual)','Brand Strategy & Positioning','Product & Packaging Strategy'] },
  { key:'ramayana',   axis:'x', dir: 1, mark:'bow',
    name:'Ramayana',           tag:'Campaign & Media',     href:'Ramayana-Case-Study.html',
    tiles:['CAMPAIGN','MEDIA','INSIGHT','COMMS'],
    skills:['Campaign Strategy','Media Planning','Consumer Insight','Comms & Messaging'] },
  { key:'district',   axis:'y', dir: 1, mark:'pin',
    name:'District: The Plot', tag:'Product Thinking',     href:'District-Plot-Case-Study.html',
    tiles:['INSIGHT','BRAND','ANALYTICS','CONTENT'],
    skills:['Consumer Insight','Brand Strategy & Positioning','Marketing Analytics','Content Ideation'] },
  { key:'comet',      axis:'x', dir:-1, mark:'star',
    name:'Comet',              tag:'Performance',          href:'Comet-Case-Study.html',
    tiles:['MEDIA','PERFORM','CAMPAIGN','INSIGHT'],
    skills:['Media Planning','Performance / D2C Marketing','Campaign Strategy','Consumer Insight'] },
  { key:'crumbrella', axis:'z', dir:-1, mark:'cupcake',
    name:'Crumbrella',         tag:'Email & CRM',          href:'Crumbrella-Case-Study.html',
    tiles:['CRM','EMAIL','INSIGHT','CONCEPT'],
    skills:['CRM & Lifecycle','Email Copywriting','Consumer Insight','Creative Concept'] },
  { key:'absolut',    axis:'y', dir:-1, mark:'bottle',
    name:'Absolut Truth',      tag:'Branded Content',      href:'Absolut-Truth-Case-Study.html',
    tiles:['BRAND','INSIGHT','CONTENT','BUDGET'],
    skills:['Brand Strategy & Positioning','Consumer Insight','Content Ideation','Budgeting'] }
];

const AXIS_I = { x:0, y:1, z:2 };

/* ---------- sticker textures, drawn on canvas ---------- */
const S = 256;
function baseTile(){
  const c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d');
  x.fillStyle = BODY; x.fillRect(0,0,S,S);
  // the hairline gold seam that gives the cube its grid, etched not printed
  x.strokeStyle = 'rgba(201,162,75,0.55)'; x.lineWidth = 3;
  x.strokeRect(9,9,S-18,S-18);
  return { c, x };
}
/* Each mark comes from its own project, never a stock category icon.
   Drawn in a 24x24 space and scaled up, so the strokes stay proportional. */
const MARKS = {
  // the colander from Neil's own painting: raw numbers in, insight draining out
  colander:{ paths:['M4 9h14a7 7 0 0 1-14 0z','M18 9l3.2-1.7','M9 18.6v2.2M12 19.2v2.4M15 18.6v2.2'],
             dots:[[8.4,12,0.7],[11,13.4,0.7],[13.6,12,0.7]] },
  // Rama's bow, straight out of the painting
  bow:      { paths:['M8 3.2A13 13 0 0 1 8 20.8','M8 3.2L8 20.8','M8 12h10','M15.6 9.6L18 12l-2.4 2.4'] },
  // Comet's own four-pointed star and its trail
  star:     { paths:['M16.5 4.5c.6 4 2 5.4 5.5 6-3.5.6-4.9 2-5.5 6-.6-4-2-5.4-5.5-6 3.5-.6 4.9-2 5.5-6z',
                     'M9 13.5L2.5 17','M8 10.5L3.5 12'] },
  // the bottle that frames the host in the key art
  bottle:   { paths:['M10 2.5h4v3.2c0 1.4 2.6 2.6 2.6 5.2v8.6a2 2 0 0 1-2 2H9.4a2 2 0 0 1-2-2v-8.6C7.4 8.3 10 7.1 10 5.7z',
                     'M7.4 13.5h9.2'] },
  // a cupcake: the thing in the box
  cupcake:  { paths:['M6.6 13a5.4 5.4 0 0 1 10.8 0z',
                     'M6.9 13.4l1.3 7.1a1.2 1.2 0 0 0 1.2 1h5.2a1.2 1.2 0 0 0 1.2-1l1.3-7.1z',
                     'M10.4 14.2v6.9M13.6 14.2v6.9'],
             circles:[[12,5.2,1.3]] },
  // a pin: the plot you plot
  pin:      { paths:['M12 21.4s7-6.1 7-11.2a7 7 0 1 0-14 0c0 5.1 7 11.2 7 11.2z'], circles:[[12,10,2.6]] }
};
function centreTexture(mark){
  const { c, x } = baseTile();
  const m = MARKS[mark];
  const s = (S / 24) * 0.80;                   // scale the 24-space drawing, leaving a margin
  x.save();
  x.translate(S/2 - 12*s, S/2 - 12*s);
  x.scale(s, s);
  x.strokeStyle = GOLD_LIT; x.fillStyle = GOLD_LIT;
  x.lineWidth = 1.25; x.lineCap = 'round'; x.lineJoin = 'round';   // in 24-space, so it scales with the mark
  m.paths.forEach(d => x.stroke(new Path2D(d)));
  (m.circles || []).forEach(([cx, cy, r]) => { x.beginPath(); x.arc(cx, cy, r, 0, Math.PI*2); x.stroke(); });
  (m.dots || []).forEach(([cx, cy, r]) => { x.beginPath(); x.arc(cx, cy, r, 0, Math.PI*2); x.fill(); });
  x.restore();
  return new THREE.CanvasTexture(c);
}
function edgeTexture(word){
  const { c, x } = baseTile();
  x.fillStyle = GOLD_LIT;
  x.textAlign = 'center'; x.textBaseline = 'middle';
  let size = 34;
  x.font = `500 ${size}px "IBM Plex Mono", monospace`;
  if (x.letterSpacing !== undefined) x.letterSpacing = '3px';
  while (x.measureText(word).width > S - 54 && size > 15) {
    size -= 2; x.font = `500 ${size}px "IBM Plex Mono", monospace`;
  }
  x.fillText(word, S/2, S/2 + 1);
  return new THREE.CanvasTexture(c);
}
function cornerTexture(){
  const { c, x } = baseTile();
  x.strokeStyle = 'rgba(201,162,75,0.5)'; x.lineWidth = 4; x.lineCap = 'round';
  x.beginPath(); x.moveTo(96,160); x.lineTo(160,96); x.stroke();   // a single etched stroke, nothing more
  return new THREE.CanvasTexture(c);
}

/* ---------- motion curves ---------- */
// ease in, fast through the middle, then a magnetic overshoot and settle: the click.
function snapEase(t){
  const eio = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2;
  return eio + Math.sin(Math.min(1, Math.max(0,(t-0.86)/0.14)) * Math.PI) * 0.022;
}
const easeOut = t => 1 - Math.pow(1 - t, 3);
const now = () => performance.now();
const wait = ms => new Promise(r => setTimeout(r, ms));

export async function mountCube(stage, opts = {}){
  const caption = opts.caption;
  try { await document.fonts.ready; } catch(e){}

  /* ---------- scene ---------- */
  // Opaque canvas, cleared to the page's exact black. A transparent canvas looks tidier but
  // kills the dust: additive blending accumulates almost no alpha, so the motes composite over
  // the page at ~4% opacity and vanish. Measured: 49 lit pixels transparent vs 502 opaque.
  const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'low-power' });
  // phones pack huge pixel ratios (often 3); cap tighter there, the quality loss is invisible on a small screen and it saves a lot of fill
  const coarse = matchMedia('(pointer: coarse)').matches;
  renderer.setPixelRatio(Math.min(coarse ? 1.6 : 2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setClearColor(0x0B0A09, 1);   // verified to round-trip to rgb(11,10,9): invisible against the page
  // absolute, not a flex child: percentage heights don't resolve reliably in a centred flex box
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab;touch-action:none;';
  stage.replaceChildren(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 100);
  camera.position.set(0, 0, 8.4);

  // one warm key from above left, the gallery spot. everything else is falloff.
  const key = new THREE.DirectionalLight(0xffd9a0, 3.1); key.position.set(-4, 6.5, 5);
  const rim = new THREE.DirectionalLight(0xC9A24B, 1.25); rim.position.set(5, -2, -4);
  const fill = new THREE.DirectionalLight(0xbfd4ff, 0.22); fill.position.set(4, 1, 6);
  scene.add(key, rim, fill, new THREE.AmbientLight(0xffffff, 0.13));

  const root = new THREE.Group();      // drift + orientation
  const cubeGroup = new THREE.Group(); // holds the cubies
  const pivot = new THREE.Group();     // the layer being turned
  root.add(cubeGroup); cubeGroup.add(pivot); scene.add(root);

  /* ---------- cubies ---------- */
  const SIZE = 0.95;                   // < 1 so the seams are real gaps, per the spec
  const geo = new RoundedBoxGeometry(SIZE, SIZE, SIZE, 3, 0.062);
  const bodyMat = new THREE.MeshStandardMaterial({ color:0x0E0C0A, roughness:0.52, metalness:0.18 });
  const plane = new THREE.PlaneGeometry(SIZE*0.86, SIZE*0.86);

  const cubies = [];
  const stickers = [];
  const byFace = {};
  FACES.forEach(f => byFace[f.key] = []);

  const faceFor = (ax, d) => FACES.find(f => f.axis === ax && f.dir === d);

  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++){
    if (!x && !y && !z) continue;                       // the core is never seen
    const m = new THREE.Mesh(geo, bodyMat);
    m.position.set(x, y, z);
    cubeGroup.add(m); cubies.push(m);

    const coord = { x, y, z };
    for (const ax of ['x','y','z']){
      const d = coord[ax];
      if (d === 0) continue;                            // inward face, stays black
      const face = faceFor(ax, d);
      if (!face) continue;

      // which of the nine cells is this? centre / edge / corner
      const others = ['x','y','z'].filter(a => a !== ax).map(a => coord[a]);
      const offAxis = others.filter(v => v !== 0).length;
      let tex, role;
      if (offAxis === 0){ role = 'centre'; tex = centreTexture(face.mark); }
      else if (offAxis === 1){
        role = 'edge';
        // deterministic, so a given skill always sits on the same edge
        const idx = byFace[face.key].filter(s => s.userData.role === 'edge').length;
        tex = edgeTexture(face.tiles[idx % 4]);
      } else { role = 'corner'; tex = cornerTexture(); }
      tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;

      const restE = role === 'centre' ? 0.42 : role === 'edge' ? 0.05 : 0.03;
      const mat = new THREE.MeshStandardMaterial({
        map:tex, emissive:0xffffff, emissiveMap:tex, emissiveIntensity:restE,
        roughness:0.42, metalness:0.05
      });
      const st = new THREE.Mesh(plane, mat);
      const o = SIZE/2 + 0.004;
      if (ax === 'x'){ st.position.x = d*o; st.rotation.y = d > 0 ? Math.PI/2 : -Math.PI/2; }
      if (ax === 'y'){ st.position.y = d*o; st.rotation.x = d > 0 ? -Math.PI/2 : Math.PI/2; }
      if (ax === 'z'){ st.position.z = d*o; if (d < 0) st.rotation.y = Math.PI; }
      st.userData = { face, role, restE, mat };
      m.add(st); stickers.push(st); byFace[face.key].push(st);
    }
  }

  /* ---------- the gold dust ---------- */
  /* Generative, but atmosphere rather than spectacle: low density, slow, and it lives in the
     scene (not the root) so it hangs in the room while the cube turns inside it. Real depth,
     so the cube occludes the motes behind it. */
  const DUST_N = 195;   // 30% denser
  function dustSprite(){
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    // A whiter, harder core is the only dial that buys shine here. Raising the colour gain does
    // nothing: ACES tone mapping saturates and a 20% boost measured as literally zero change.
    // Widening this core instead: avg brightness +26%, clearly-visible pixels +45%.
    const grad = g.createRadialGradient(32,32,0,32,32,32);
    grad.addColorStop(0,   'rgba(255,252,240,1)');
    grad.addColorStop(0.26,'rgba(255,240,200,1)');
    grad.addColorStop(0.55,'rgba(220,180,90,0.45)');
    grad.addColorStop(1,   'rgba(201,162,75,0)');
    g.fillStyle = grad; g.fillRect(0,0,64,64);
    return new THREE.CanvasTexture(c);
  }
  const dustGeo = new THREE.BufferGeometry();
  const dPos = new Float32Array(DUST_N*3);
  const dCol = new Float32Array(DUST_N*3);
  const dSeed = new Float32Array(DUST_N);
  const dRise = new Float32Array(DUST_N);
  const dBase = new Float32Array(DUST_N);
  for (let i = 0; i < DUST_N; i++){
    dPos[i*3]   = (Math.random() - 0.5) * 11;
    dPos[i*3+1] = (Math.random() - 0.5) * 8.4;
    dPos[i*3+2] = -7 + Math.random() * 8.5;        // mostly behind the cube
    dSeed[i] = Math.random() * Math.PI * 2;
    dRise[i] = 0.05 + Math.random() * 0.13;        // slow. dust, not sparks
    dBase[i] = 1.08 + Math.random() * 2.52;        // additive light on near-black needs real gain to register; +20% shine
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  dustGeo.setAttribute('color',    new THREE.BufferAttribute(dCol, 3));
  const dustTex = dustSprite();
  const dustMat = new THREE.PointsMaterial({
    size:0.12, map:dustTex, vertexColors:true, transparent:true,
    depthWrite:false, blending:THREE.AdditiveBlending, sizeAttenuation:true
  });
  scene.add(new THREE.Points(dustGeo, dustMat));

  function stepDust(dt, tt){
    const p = dustGeo.attributes.position.array;
    const c = dustGeo.attributes.color.array;
    for (let i = 0; i < DUST_N; i++){
      p[i*3+1] += dRise[i] * dt / 1000;
      p[i*3]   += Math.sin(tt * 0.5 + dSeed[i]) * 0.00028 * dt;
      if (p[i*3+1] > 4.4){ p[i*3+1] = -4.4; p[i*3] = (Math.random() - 0.5) * 11; }
      const b = dBase[i] * (0.55 + 0.45 * Math.sin(tt * 1.3 + dSeed[i]));
      c[i*3] = 0.79*b; c[i*3+1] = 0.64*b; c[i*3+2] = 0.29*b;
    }
    dustGeo.attributes.position.needsUpdate = true;
    dustGeo.attributes.color.needsUpdate = true;
  }

  /* ---------- the turn engine ---------- */
  let busy = false;
  function layerOf(mesh, ax){ return Math.round(mesh.position[ax]); }

  function turn(ax, layer, dir, ms){
    return new Promise(resolve => {
      const picked = cubies.filter(c => layerOf(c, ax) === layer);
      picked.forEach(c => pivot.attach(c));
      const target = dir * Math.PI/2;
      const t0 = now();
      // counter-tilt: the whole body reacts to the layer's mass, then settles
      const tiltAxis = ax === 'y' ? 'z' : 'y';
      const tiltMax = -dir * 0.030;
      (function step(){
        const t = Math.min(1, (now() - t0) / ms);
        pivot.rotation[ax] = target * snapEase(t);
        cubeGroup.rotation[tiltAxis] = tiltMax * Math.sin(t * Math.PI);
        if (t < 1) requestAnimationFrame(step);
        else {
          pivot.rotation[ax] = target;
          cubeGroup.rotation[tiltAxis] = 0;
          picked.forEach(c => {
            cubeGroup.attach(c);
            c.position.set(Math.round(c.position.x), Math.round(c.position.y), Math.round(c.position.z));
          });
          pivot.rotation.set(0,0,0);
          resolve();
        }
      })();
    });
  }
  function turnInstant(ax, layer, dir){
    const picked = cubies.filter(c => layerOf(c, ax) === layer);
    picked.forEach(c => pivot.attach(c));
    pivot.rotation[ax] = dir * Math.PI/2;
    picked.forEach(c => {
      cubeGroup.attach(c);
      c.position.set(Math.round(c.position.x), Math.round(c.position.y), Math.round(c.position.z));
    });
    pivot.rotation.set(0,0,0);
  }

  // only outer layers: face turns never move the centres
  function randomSeq(n){
    const seq = []; let lastKey = '';
    while (seq.length < n){
      const ax = ['x','y','z'][(Math.random()*3)|0];
      const layer = Math.random() < 0.5 ? -1 : 1;
      const k = ax + layer;
      if (k === lastKey) continue;
      lastKey = k;
      seq.push({ ax, layer, dir: Math.random() < 0.5 ? 1 : -1 });
    }
    return seq;
  }
  const inverse = seq => seq.slice().reverse().map(m => ({ ...m, dir: -m.dir }));

  async function play(seq, ms){ for (const m of seq) await turn(m.ax, m.layer, m.dir, ms); }

  /* ---------- orientation + drift ---------- */
  const BASE_X = -0.30;                          // 3/4 view, so the top face is in play
  let driftY = -0.55, oscT = Math.random()*10;
  let oscX = 0, oscZ = 0;                        // frozen, not recomputed, when drift stops: otherwise the wobble vanishes mid-frame and the cube jerks
  let userX = 0, userY = 0;                      // drag offsets
  let drifting = true;
  let held = false;                              // once aimed at a face, nothing else may touch the rotation
  const orient = { active:false, from:new THREE.Euler(), to:new THREE.Euler(), t0:0, ms:1 };

  function faceEuler(face){
    if (face.axis === 'z') return new THREE.Euler(0, face.dir > 0 ? 0 : Math.PI, 0);
    if (face.axis === 'x') return new THREE.Euler(0, face.dir > 0 ? -Math.PI/2 : Math.PI/2, 0);
    return new THREE.Euler(face.dir > 0 ? Math.PI/2 : -Math.PI/2, 0, 0);
  }
  function orientTo(face, ms){
    drifting = false; held = true;               // hold it there afterwards, or the loop snaps it back to the drift angle
    orient.from.copy(root.rotation);
    orient.to.copy(faceEuler(face));
    orient.t0 = now(); orient.ms = ms; orient.active = true;
    return wait(ms);
  }

  /* ---------- hover ---------- */
  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2();
  let hovered = null;

  function lightFace(key, on){
    (byFace[key] || []).forEach(st => {
      st.userData.targetE = on
        ? (st.userData.role === 'centre' ? 1.15 : st.userData.role === 'edge' ? 0.95 : 0.22)
        : st.userData.restE;
    });
  }
  stickers.forEach(st => st.userData.targetE = st.userData.restE);

  function setHover(key){
    if (hovered === key) return;
    if (hovered) lightFace(hovered, false);
    hovered = key;
    if (key){
      lightFace(key, true);
      const f = FACES.find(x => x.key === key);
      if (caption){
        caption.innerHTML =
          `<span class="cc-name">${f.name}</span>` +
          `<span class="cc-tag">${f.tag}</span>` +
          `<span class="cc-skills">${f.skills.join(' &middot; ')}</span>`;
        caption.classList.add('on');
      }
      renderer.domElement.style.cursor = 'pointer';
    } else {
      if (caption) caption.classList.remove('on');
      renderer.domElement.style.cursor = dragging ? 'grabbing' : 'grab';
    }
  }

  function pick(ev){
    const r = renderer.domElement.getBoundingClientRect();
    ptr.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    ptr.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(ptr, camera);
    return ray.intersectObjects(stickers, false)[0] || null;
  }

  /* ---------- input ---------- */
  let dragging = false, moved = 0, lx = 0, ly = 0;
  let velY = 0, velX = 0, lastMove = 0;         // the throw: an object with mass keeps going
  const TILT_LIMIT = 1.15;
  // resistance past the limit rather than an invisible wall. Real things give a little.
  const softClamp = v => Math.abs(v) <= TILT_LIMIT
    ? v
    : Math.sign(v) * (TILT_LIMIT + (Math.abs(v) - TILT_LIMIT) * 0.25);
  const el = renderer.domElement;

  el.addEventListener('pointerdown', e => {
    if (busy) return;
    dragging = true; moved = 0; lx = e.clientX; ly = e.clientY;
    velY = velX = 0; lastMove = now();          // catching it kills the spin, as it should
    drifting = false; held = false;             // a hand on it always wins
    el.style.cursor = 'grabbing'; el.setPointerCapture(e.pointerId);
  });
  el.addEventListener('pointermove', e => {
    if (dragging){
      const dx = e.clientX - lx, dy = e.clientY - ly;
      moved += Math.abs(dx) + Math.abs(dy);
      const ay = dx * 0.0075, ax = dy * 0.006;
      userY += ay;
      userX = softClamp(userX + ax);
      const t = now(), dtm = Math.max(8, t - lastMove); lastMove = t;
      // smoothed, so one jittery final pixel doesn't decide the whole throw
      velY = velY * 0.6 + (ay / dtm) * 0.4;
      velX = velX * 0.6 + (ax / dtm) * 0.4;
      lx = e.clientX; ly = e.clientY;
      return;
    }
    if (busy) return;
    const hit = pick(e);
    setHover(hit ? hit.object.userData.face.key : null);
  });
  el.addEventListener('pointerup', e => {
    if (!dragging) return;
    dragging = false; el.style.cursor = 'grab';
    if (moved < 6 && !busy){
      velY = velX = 0;                          // a tap is not a throw
      const hit = pick(e);
      // only the centre tile is the door. everything else is just the object.
      if (hit && hit.object.userData.role === 'centre') enter(hit.object.userData.face);
    }
    // a stale flick shouldn't count: only carry momentum if the release was recent
    if (now() - lastMove > 90) velY = velX = 0;
    // cap it: even a hard flick stays a graceful turn, never a blur
    const CAP = 0.006;
    velY = Math.max(-CAP, Math.min(CAP, velY));
    velX = Math.max(-CAP, Math.min(CAP, velX));
    setTimeout(() => { if (!busy && !dragging) drifting = true; }, 2200);
  });
  el.addEventListener('pointerleave', () => { if (!busy) setHover(null); });

  /* ---------- entering a case ---------- */
  // the door doesn't open, it swallows you: fly the camera into the centre tile
  function diveIntoCentre(){
    const veil = document.createElement('div');
    veil.className = 'cube-dive-veil';
    veil.style.cssText = 'position:fixed;inset:0;background:#0B0A09;opacity:0;pointer-events:none;z-index:200;';
    document.body.appendChild(veil);
    const z0 = camera.position.z, z1 = 1.02, t0 = now(), ms = 780;
    return new Promise(res => {
      (function step(){
        const t = Math.min(1, (now() - t0) / ms);
        camera.position.z = z0 + (z1 - z0) * Math.pow(t, 2.1);   // accelerating: pulled in, not drifting in
        if (t > 0.5) veil.style.opacity = String(Math.min(1, (t - 0.5) / 0.5));
        if (t < 1) requestAnimationFrame(step); else res();
      })();
    });
  }

  async function enter(face){
    if (busy) return;
    busy = true; setHover(face.key); drifting = false;
    if (caption) caption.classList.add('going');
    // scramble, then solve straight back to it: choreography, not a puzzle the visitor can break
    const seq = randomSeq(3);
    await play(seq, 210);
    await play(inverse(seq), 250);
    await orientTo(face, 520);
    await diveIntoCentre();
    const go = () => { window.location.href = face.href; };
    if (document.startViewTransition) document.startViewTransition(go); else go();
  }

  /* ---------- coming back ---------- */
  // The back button restores this page from the bfcache exactly as we left it: mid-dive,
  // busy, not drifting. Without this the cube is dead on return.
  function wake(){
    busy = false; dragging = false; drifting = true; held = false;
    velY = velX = 0;                            // don't inherit a mid-throw spin from before we left
    orient.active = false;
    camera.position.z = stage.clientWidth < 520 ? 9.6 : 8.4;
    document.querySelectorAll('.cube-dive-veil').forEach(v => v.remove());
    hovered = null;
    if (caption) caption.classList.remove('on', 'going');
    stickers.forEach(st => st.userData.targetE = st.userData.restE);
    renderer.domElement.style.cursor = 'grab';
    last = now();
  }
  window.addEventListener('pageshow', e => { if (e.persisted) wake(); });

  /* ---------- the entrance: arrives scrambled, solves itself once ---------- */
  // Browsers freeze requestAnimationFrame in hidden tabs. Open the site in a background
  // tab and the entrance would burn away unseen, so hold it until someone is looking.
  function whenPageVisible(){
    if (document.visibilityState === 'visible') return Promise.resolve();
    return new Promise(res => {
      const h = () => {
        if (document.visibilityState !== 'visible') return;
        document.removeEventListener('visibilitychange', h); res();
      };
      document.addEventListener('visibilitychange', h);
    });
  }
  async function intro(){
    busy = true;
    await whenPageVisible();
    const seq = randomSeq(7);
    seq.forEach(m => turnInstant(m.ax, m.layer, m.dir));
    await wait(320);
    await play(inverse(seq), 400);   // the luxury tempo: nobody is waiting to click yet
    busy = false; drifting = true;
  }

  /* ---------- loop ---------- */
  let raf = 0, last = now(), visible = true;
  let tt = 0;   // the dust keeps its own clock: it must breathe even while the cube is held still
  const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold:0.01 });
  io.observe(stage);

  function resize(){
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    camera.position.z = w < 520 ? 9.6 : 8.4;
  }
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  function frame(){
    raf = requestAnimationFrame(frame);
    const t = now(), dt = Math.min(64, t - last); last = t;
    if (!visible) return;                       // no work while it is off-screen
    tt += dt / 1000;
    stepDust(dt, tt);

    if (orient.active){
      const k = Math.min(1, (t - orient.t0) / orient.ms), e = easeOut(k);
      root.rotation.x = orient.from.x + (orient.to.x - orient.from.x) * e;
      root.rotation.y = orient.from.y + (orient.to.y - orient.from.y) * e;
      root.rotation.z = orient.from.z + (orient.to.z - orient.from.z) * e;
      if (k >= 1) orient.active = false;
    } else if (!held) {
      // the throw: after release the object keeps spinning and eases to rest, it doesn't stop dead
      if (!dragging && (velY || velX)){
        userY += velY * dt;
        userX = softClamp(userX + velX * dt);
        const decay = Math.pow(0.945, dt / 16.67);         // coasts for roughly a second
        velY *= decay; velX *= decay;
        if (Math.abs(velY) < 2e-5) velY = 0;
        if (Math.abs(velX) < 2e-5) velX = 0;
      }
      // held means we have aimed at a face and are diving in: leave the rotation exactly where orientTo left it
      if (drifting){
        oscT += dt / 1000;
        driftY += (dt / 1000) * (Math.PI * 2 / 30);        // one full turn per 30s: museum, not screensaver
        oscX = Math.sin(oscT * 0.21) * 0.070;              // ±4°
        oscZ = Math.sin(oscT * 0.16) * 0.035;              // ±2°
      }
      // oscX / oscZ keep their last values when drift stops, so nothing jerks on click
      root.rotation.y = driftY + userY;
      root.rotation.x = BASE_X + oscX + userX;
      root.rotation.z = oscZ;
    }

    // ease the etched tiles toward their target glow
    for (const st of stickers){
      const m = st.userData.mat, tgt = st.userData.targetE;
      if (Math.abs(m.emissiveIntensity - tgt) > 0.001)
        m.emissiveIntensity += (tgt - m.emissiveIntensity) * Math.min(1, dt / 90);
    }
    renderer.render(scene, camera);
  }
  frame();
  intro();

  return {
    destroy(){
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      renderer.dispose(); geo.dispose(); plane.dispose();
      dustGeo.dispose(); dustMat.dispose(); dustTex.dispose();
      stickers.forEach(s => { s.userData.mat.map.dispose(); s.userData.mat.dispose(); });
    }
  };
}
