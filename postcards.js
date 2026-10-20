// =====================================================================
// FLORILEGIUM — postcards on a table
// DISCOVER → PICK UP → FLIP → READ → CREATE
//
// · 18 original postcards + one blank "make your own" card
// · cards are built at full size and only scaled DOWN on the table,
//   so a picked-up card is shown at its original resolution
// · every card is moved by a small spring simulation (mass, inertia,
//   overshoot) — no linear tweens
// · uploaded images run through a WebGL translation of the original
//   TouchDesigner network (Test.4.toe):
//   moviefilein → blur → fit → comp(noise) → feedback ⟲
//   noise ×4 → reorder → displace → blur → displace → comp → level(sat) → res
// Everything happens in the browser; uploaded images never leave it.
// =====================================================================

/* --------------------------------------------------------------------
   Curated composition — a dense pile, some cards running off the table.
   (centre x %, centre y %, rotation °). The last one is "make your own".
   -------------------------------------------------------------------- */
const TABLE = [
  [5, 10, -12], [21, 6, 88], [38, 12, 8], [58, 6, -84], [79, 10, 14],
  [10, 40, 82], [29, 36, -9], [47, 42, -91], [65, 37, 6], [86, 40, -79],
  [3, 70, -7], [52, 70, 85], [71, 67, -14], [91, 72, -88],
  [11, 96, -86], [42, 94, 9], [70, 97, -6], [92, 95, 83],
  [25, 65, 6],
];
// Phone: the table is upright (3:4), so the cards lie in five loose rows and are larger
const TABLE_PHONE = [
  [12, 13, -8], [38, 12, 86], [63, 14, -5], [89, 12, 9],
  [24, 32, 6], [50, 31, -87], [77, 33, -11], [100, 30, 82],
  [10, 51, 88], [37, 52, -4], [64, 50, 7], [90, 52, -84],
  [22, 70, -9], [78, 69, 12],
  [11, 88, 5], [37, 87, -86], [63, 89, 10], [89, 87, -7],
  [50, 70, -3],
];
const phone = matchMedia("(max-width: 760px)");
const layout = () => (phone.matches ? TABLE_PHONE : TABLE);
const cardW = () => (phone.matches ? 0.3 : 0.19);
const CARD_W = 0.19;           // card width on the table, as part of the table width (desktop)
const CARD_RATIO = 297 / 419;  // A6 postcard, the same on both sides
// measured on the original fronts: image window + caption line
const WIN = { l: 0.0911, r: 0.0922, t: 0.067, b: 0.108 };
const CAPTION_Y = 0.951;
// the frame (FrameFinal.svg, "Rectangle ontop"): outer mat and window
const FRAME = { outer: [1299, 1807], window: [1011, 1439] };
// TouchDesigner constants (constant1)
const TD = { flow: 2.03, density: 0.0027, sat: 2.062 };

// Drivers, as in the original network:
//   latitude    → noise period     longitude × 10 → noise seed
//   day of year → flow / density   hour of day    → saturation + gamma (level TOP)
// Without location data the original constants are used.
function drivers({ lat, lon, when }) {
  const start = new Date(when.getFullYear(), 0, 0);
  const day = Math.floor((when - start) / 864e5);
  const hour = when.getHours() + when.getMinutes() / 60;
  const has = lat != null && lon != null;
  return {
    period: has ? 0.7 + (Math.abs(lat) / 90) * 1.9 : 1,
    seed: has ? ((lon * 10) % 1000) * 0.1 : 12.695,
    flow: 1.1 + (day / 366) * 2.2,
    sat: 1.15 + Math.sin((Math.PI * hour) / 24) * 1.1,
    gamma: 0.82 + (hour / 24) * 0.3,
    label: `Day ${day} → flow · ${String(when.getHours()).padStart(2, "0")}:${String(when.getMinutes()).padStart(2, "0")} → saturation · ${has ? `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? "N" : "S"} → noise` : "no GPS"}`,
  };
}

/* --------------------------------------------------------------------
   Spring — slightly under-damped, so things settle with a soft overshoot
   -------------------------------------------------------------------- */
class Spring {
  constructor(v, k = 170, c = 21) { this.x = v; this.v = 0; this.t = v; this.k = k; this.c = c; }
  step(dt) {
    this.v += (this.k * (this.t - this.x) - this.c * this.v) * dt;
    this.x += this.v * dt;
    return Math.abs(this.v) > 0.0005 || Math.abs(this.t - this.x) > 0.0005;
  }
}

/* --------------------------------------------------------------------
   Minimal EXIF reader (JPEG): date/time + GPS
   -------------------------------------------------------------------- */
function readExif(buf) {
  const v = new DataView(buf);
  if (v.byteLength < 4 || v.getUint16(0) !== 0xffd8) return {};
  let o = 2;
  while (o < v.byteLength - 4) {
    const marker = v.getUint16(o), size = v.getUint16(o + 2);
    if (marker === 0xffe1 && v.getUint32(o + 4) === 0x45786966) {
      try { return parseTiff(v, o + 10); } catch { return {}; }
    }
    if ((marker & 0xff00) !== 0xff00) break;
    o += 2 + size;
  }
  return {};
}
function parseTiff(v, t) {
  const le = v.getUint16(t) === 0x4949;
  const u16 = (p) => v.getUint16(p, le), u32 = (p) => v.getUint32(p, le);
  const ifd = (p) => {
    const out = {}, n = u16(p);
    for (let i = 0; i < n; i++) {
      const e = p + 2 + i * 12, tag = u16(e), type = u16(e + 2), cnt = u32(e + 4);
      const valOff = cnt * ([0, 1, 1, 2, 4, 8][type] || 1) > 4 ? t + u32(e + 8) : e + 8;
      if (type === 2) out[tag] = String.fromCharCode(...new Uint8Array(v.buffer, valOff, Math.max(0, cnt - 1)));
      else if (type === 5) out[tag] = Array.from({ length: cnt }, (_, k) => u32(valOff + k * 8) / u32(valOff + k * 8 + 4));
      else if (type === 3) out[tag] = u16(valOff);
      else if (type === 4) out[tag] = u32(valOff);
    }
    return out;
  };
  const ifd0 = ifd(t + u32(t + 4));
  const exif = ifd0[0x8769] ? ifd(t + ifd0[0x8769]) : {};
  const gps = ifd0[0x8825] ? ifd(t + ifd0[0x8825]) : {};
  const res = {};
  const dt = exif[0x9003] || ifd0[0x0132];
  if (dt && dt.includes(" ")) {
    const [d, tm] = dt.split(" "); const [Y, M, D] = d.split(":");
    res.date = `${D}${M}${Y.slice(2)}`; res.time = tm.slice(0, 5);
    const [h, mi] = tm.split(":");
    res.when = new Date(+Y, +M - 1, +D, +h, +mi);
  }
  const deg = (a) => a && a[0] + a[1] / 60 + a[2] / 3600;
  if (gps[2] && gps[4]) {
    res.lat = deg(gps[2]) * (gps[1] === "S" ? -1 : 1);
    res.lon = deg(gps[4]) * (gps[3] === "W" ? -1 : 1);
  }
  return res;
}

/* --------------------------------------------------------------------
   The TouchDesigner network in WebGL2
   -------------------------------------------------------------------- */
const GLSL_NOISE = `
  float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
  float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
  float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=0.5; } return v; }`;

const VERT = `#version 300 es
  in vec2 p; out vec2 vUv;
  void main(){ vUv = p*0.5+0.5; gl_Position = vec4(p,0,1); }`;

// feedback1 → displace1 → blur1 → displace2 → comp2 (feedback target), fed by
// moviefilein → blur2 → fit1 → comp1 (+noise1)
const FEEDBACK = `#version 300 es
  precision highp float;
  in vec2 vUv; out vec4 o;
  uniform sampler2D uImg, uPrev;
  uniform float uT, uFlow, uInject, uSeed, uPeriod;
  uniform vec2 uScale, uOff, uPx;
  ${GLSL_NOISE}
  vec3 inputChain(vec2 uv){
    vec2 iuv = uv * uScale + uOff;                    // fit1 (cover)
    iuv.y = 1.0 - iuv.y;
    vec3 c = vec3(0.0);                               // blur2
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) c += texture(uImg, iuv + vec2(x, y) * 0.0035).rgb;
    c /= 9.0;
    float n1 = noise(uv * 9.0 + uSeed + uT * 0.15);   // comp1 with noise1
    return c * (0.88 + 0.24 * n1);
  }
  void main(){
    vec2 uv = vUv;
    float t = uT;
    // noise2–5 → reorder: two displacement maps (+ a blocky one for the patches)
    vec2 m1 = vec2(fbm(uv * 1.7 * uPeriod + vec2(t * 0.04, uSeed)), fbm(uv * 1.7 * uPeriod + vec2(uSeed, -t * 0.04) + 12.3)) - 0.5;
    vec2 m2 = vec2(fbm(uv * 3.3 * uPeriod - t * 0.03 + 4.1 + uSeed), fbm(uv * 3.3 * uPeriod + t * 0.02 + 7.7 + uSeed)) - 0.5;
    vec2 blocks = vec2(smoothstep(0.4, 0.6, noise(uv * 3.6 * uPeriod + uSeed + 3.0 + t * 0.02)), smoothstep(0.4, 0.6, noise(uv * 3.6 * uPeriod + uSeed + 9.0 - t * 0.02))) - 0.5;
    float flow = uFlow * 0.0021;
    // displace1 + blur1
    vec2 d1 = uv + (m1 * 0.7 + blocks * 1.7) * flow;
    vec3 a = vec3(0.0);
    for (int k = 0; k < 4; k++) { float ang = float(k) * 1.5708 + 0.4; a += texture(uPrev, d1 + vec2(cos(ang), sin(ang)) * uPx * 1.5).rgb; }
    a *= 0.25;
    // displace2 (second map, also pushed by the blurred image itself, like slope1)
    vec2 d2 = uv + m2 * flow * 0.8 + (a.rg - a.gb) * flow * 0.6;
    vec3 b = mix(a, texture(uPrev, d2).rgb, 0.5);
    // comp2: feedback with a thin stream of the input (density)
    vec3 src = inputChain(uv);
    o = vec4(mix(b, src, uInject), 1.0);
  }`;

// comp4 → level1 (saturation) → res1
const DISPLAY = `#version 300 es
  precision highp float;
  in vec2 vUv; out vec4 o;
  uniform sampler2D uFb; uniform float uSat, uGamma, uT;
  ${GLSL_NOISE}
  vec2 hash2(vec2 q){ q = vec2(dot(q, vec2(127.1, 311.7)), dot(q, vec2(269.5, 183.3))); return fract(sin(q) * 43758.5453); }
  // soft paint dabs (warped cells) — the blotchy surface of the printed originals
  vec4 dabs(vec2 uv, vec2 grid){
    vec2 w = uv + (vec2(fbm(uv * 3.0 + uT * 0.01), fbm(uv * 3.0 + 7.0)) - 0.5) * 0.08;
    vec2 g = w * grid, i = floor(g), f = fract(g);
    float d1 = 8.0, d2 = 8.0; vec2 c1 = vec2(0.0);
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
      vec2 n = vec2(float(x), float(y)), h = hash2(i + n);
      vec2 r = n + 0.5 + 0.42 * sin(uT * 0.1 + 6.2831 * h) - f; float d = dot(r, r);
      if (d < d1) { d2 = d1; d1 = d; c1 = i + n + 0.5 + 0.42 * sin(uT * 0.1 + 6.2831 * h); } else if (d < d2) d2 = d;
    }
    return vec4(texture(uFb, clamp(c1 / grid, 0.0, 1.0)).rgb, smoothstep(0.0, 0.5, sqrt(d2) - sqrt(d1)));
  }
  void main(){
    vec3 c = texture(uFb, vUv).rgb;
    vec4 d = dabs(vUv, vec2(8.0, 10.5));
    c = mix(c, d.rgb, 0.5 * d.a);                                 // comp4
    float l = dot(c, vec3(.299, .587, .114));
    c = mix(vec3(l), c, uSat);                                    // level1: saturation
    c = (c - 0.5) * 1.06 + 0.5;
    c = pow(clamp(c, 0.0, 1.0), vec3(uGamma));                  // level1: gamma
    c += (hash(vUv * 900.0 + uT) - 0.5) * 0.018;                  // a breath of grain, like print
    o = vec4(clamp(c, 0.0, 1.0), 1.0);
  }`;

class Echo {
  constructor(canvas, image, params) {
    this.params = params;
    const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true, premultipliedAlpha: false, antialias: false });
    if (!gl) throw new Error("no webgl2");
    this.gl = gl; this.canvas = canvas; this.t = 0; this.frame = 0;
    const prog = (fs) => {
      const p = gl.createProgram();
      for (const [type, src] of [[gl.VERTEX_SHADER, VERT], [gl.FRAGMENT_SHADER, fs]]) {
        const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        gl.attachShader(p, s);
      }
      gl.bindAttribLocation(p, 0, "p"); gl.linkProgram(p); return p;
    };
    this.fb = prog(FEEDBACK); this.disp = prog(DISPLAY);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const tex = (w, h, data) => {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      if (data) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
      return t;
    };
    this.img = tex(0, 0, image);
    const W = canvas.width, H = canvas.height;
    this.px = [1 / W, 1 / H];
    this.ping = [0, 1].map(() => {
      const t = tex(W, H), f = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, f);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      return { t, f };
    });
    const ia = image.width / image.height, wa = W / H;
    this.scale = ia > wa ? [wa / ia, 1] : [1, ia / wa];
    this.off = [(1 - this.scale[0]) / 2, (1 - this.scale[1]) / 2];
    this.render(1 / 60, 240); // let the feedback grow before the first look
  }
  render(dt = 1 / 60, iterations = 1) {
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    for (let n = 0; n < iterations; n++) {
      const [a, b] = this.ping;
      this.t += dt;
      gl.useProgram(this.fb);
      gl.bindFramebuffer(gl.FRAMEBUFFER, b.f);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.img);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, a.t);
      const U = (k) => gl.getUniformLocation(this.fb, k);
      gl.uniform1i(U("uImg"), 0); gl.uniform1i(U("uPrev"), 1);
      gl.uniform1f(U("uT"), this.t); gl.uniform1f(U("uSeed"), this.params.seed); gl.uniform1f(U("uPeriod"), this.params.period);
      gl.uniform1f(U("uFlow"), this.params.flow);
      // the first frame is the plain input; afterwards a thin stream keeps the photo recognisable
      gl.uniform1f(U("uInject"), this.frame === 0 ? 1 : 0.006 + TD.density * 3);
      gl.uniform2fv(U("uScale"), this.scale); gl.uniform2fv(U("uOff"), this.off); gl.uniform2fv(U("uPx"), this.px);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      this.ping.reverse();
      this.frame++;
    }
    gl.useProgram(this.disp);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.ping[0].t);
    gl.uniform1i(gl.getUniformLocation(this.disp, "uFb"), 0);
    gl.uniform1f(gl.getUniformLocation(this.disp, "uSat"), this.params.sat);
    gl.uniform1f(gl.getUniformLocation(this.disp, "uGamma"), this.params.gamma);
    gl.uniform1f(gl.getUniformLocation(this.disp, "uT"), this.t);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

/* --------------------------------------------------------------------
   The table
   -------------------------------------------------------------------- */
function mountPostcards(root, cards) {
  const all = [...cards, { own: true, no: 19, name: "Your postcard" }];
  const OWN = all.length - 1;
  const pad2 = (n) => String(n).padStart(2, "0");
  const now = new Date();
  const own = {
    image: null, echo: null, coords: "",
    date: `${pad2(now.getDate())}${pad2(now.getMonth() + 1)}${String(now.getFullYear()).slice(2)}`,
    time: `${pad2(now.getHours())}:${pad2(now.getMinutes())}`,
  };

  root.innerHTML = `
    <div class="pt__table" data-pt-table>
      ${all.map((c, i) => c.own ? `
        <div class="pc pc--own" data-pc="${i}" role="button" tabindex="0" aria-label="Make your own postcard">
          <div class="pc__inner">
            <div class="pc__face pc__front">
              <div class="own__blank"><span class="own__label">Make your<br>own postcard</span><span class="own__plus">+</span></div>
              <div class="own__art" hidden>
                <canvas width="1120" height="${Math.round(1120 * ((1 - WIN.t - WIN.b) / CARD_RATIO) / (1 - WIN.l - WIN.r))}"></canvas>
                <span class="own__caption">Specimen 19 - Your Flower</span>
              </div>
            </div>
            <div class="pc__face pc__back own__back">
              <div class="own__meta">
                <span data-own="city" contenteditable="true" spellcheck="false">YOUR CITY</span>
                <span data-own="date">${own.date}</span><span data-own="time">${own.time}</span>
              </div>
              <div class="own__msg" contenteditable="true" spellcheck="false" data-placeholder="Write your message…"></div>
              <span class="own__caption">Specimen 19 - Your Flower</span>
            </div>
          </div>
        </div>` : `
        <div class="pc" data-pc="${i}" role="button" tabindex="0" aria-label="N°${c.no} ${c.name}">
          <div class="pc__inner">
            <div class="pc__face pc__front">
              <img src="${c.src}" alt="N°${c.no} ${c.name}" draggable="false">
              <span class="pc__veil" aria-hidden="true"></span><img class="pc__sheet" src="${c.overlay}" alt="" draggable="false">
            </div>
            <div class="pc__face pc__back"><img src="${c.back}" alt="" draggable="false"></div>
          </div>
        </div>`).join("")}
      <input type="file" accept="image/*" data-own-file hidden>
    </div>
    <div class="pt__panel" data-pt-panel>
      <div class="pt__info"><span class="pt__no"></span><span class="pt__name"></span><span class="pt__meta"></span></div>
      <div class="pt__ctrl">
        <button data-pt-upload hidden>Upload an image</button>
        <button data-pt-sheet hidden>Lay the transparent sheet</button>
        <button data-pt-flip>Turn over</button>
        <button data-pt-save>Save</button>
        <button data-pt-back>Put back</button>
      </div>
    </div>
    <p class="pt__hint">Pick up a postcard</p>`;

  const table = root.querySelector("[data-pt-table]");
  const panel = root.querySelector("[data-pt-panel]");
  const els = [...root.querySelectorAll("[data-pc]")];
  const ownEl = els[OWN];
  const file = root.querySelector("[data-own-file]");
  const canvas = ownEl.querySelector("canvas");

  const S = els.map((_, i) => ({
    x: new Spring(layout()[i][0]), y: new Spring(layout()[i][1]), r: new Spring(layout()[i][2]),
    s: new Spring(0.3), lift: new Spring(0, 140, 20), flip: new Spring(0, 95, 13),
  }));
  let picked = -1, hover = -1, flipped = false, sheet = false, running = false, lastT = 0;
  let bigW = 0, rest = 0.3;

  // cards are as large as they will be in the hand; on the table they are scaled down
  function size() {
    const H = table.clientHeight, W = table.clientWidth;
    bigW = Math.min(H * 0.86 * CARD_RATIO, W * 0.6);
    els.forEach((el) => { el.style.width = `${bigW}px`; el.style.height = `${bigW / CARD_RATIO}px`; });
    rest = (W * cardW()) / bigW;
  }

  function targets() {
    els.forEach((el, i) => {
      const s = S[i], [x, y, r] = layout()[i];
      if (i === picked) {
        s.x.t = 50; s.y.t = 48; s.r.t = 0; s.s.t = 1; s.lift.t = 1; s.flip.t = flipped ? 180 : 0;
      } else {
        const h = i === hover && picked === -1;
        s.x.t = x; s.y.t = h ? y - 1.5 : y; s.r.t = h ? r + (r > 0 ? 3 : -3) : r;
        s.s.t = rest * (h ? 1.06 : 1); s.lift.t = h ? 0.5 : 0; s.flip.t = 0;
      }
      el.classList.toggle("is-sheet", i === picked && sheet);
    });
    root.classList.toggle("is-picked", picked !== -1);
    kick();
  }

  function draw(now) {
    const dt = Math.min(0.1, (now - lastT) / 1000 || 0.016);
    lastT = now;
    let moving = false;
    const W = table.clientWidth, H = table.clientHeight;
    const steps = Math.max(1, Math.ceil(dt / (1 / 120))), h = dt / steps; // same speed at any frame rate
    els.forEach((el, i) => {
      const s = S[i];
      for (const k of ["x", "y", "r", "s", "lift", "flip"]) for (let n = 0; n < steps; n++) moving = s[k].step(h) || moving;
      // inertia: the card tips in the direction it travels — flat again when it rests
      const tiltX = Math.max(-12, Math.min(12, -s.y.v * 0.8));
      const tiltY = Math.max(-12, Math.min(12, s.x.v * 0.5));
      const tilt = Math.abs(tiltX) + Math.abs(tiltY) > 0.05 ? ` rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)` : "";
      el.style.transform = `translate(${((s.x.x / 100) * W).toFixed(1)}px, ${((s.y.x / 100) * H).toFixed(1)}px) translate(-50%, -50%) rotate(${s.r.x.toFixed(3)}deg)${tilt} scale(${s.s.x.toFixed(4)})`;
      el.style.setProperty("--lift", Math.max(0, s.lift.x).toFixed(3));
      const f = s.flip.x;
      el.querySelector(".pc__inner").style.transform = Math.abs(f) < 0.05 ? "" : `rotateY(${f.toFixed(2)}deg)`;
      // perspective only while something tips or turns — at rest the card is drawn flat and sharp
      el.style.perspective = tilt || (Math.abs(f) > 0.05 && Math.abs(f - 180) > 0.05) ? `${bigW * 3}px` : "";
      el.style.zIndex = i === picked ? 100 : i === hover ? 60 : 10 + i;
    });
    if (own.echo && picked === OWN && !flipped) { own.echo.render(dt, 1); moving = true; }
    if (moving) requestAnimationFrame(draw); else running = false;
  }
  function kick() { if (!running) { running = true; lastT = performance.now(); requestAnimationFrame(draw); } }

  function info() {
    const c = all[picked];
    panel.querySelector(".pt__no").textContent = c ? `N°${pad2(c.no)}` : "";
    panel.querySelector(".pt__name").textContent = c ? c.name : "";
    panel.querySelector(".pt__meta").textContent = !c ? "" : c.own
      ? (own.image ? own.drivers?.label || "Turn it over and write on the back" : "Upload a photo, it never leaves your browser")
      : `${c.city} · ${c.date} · ${c.time}`;
    const isOwn = !!(c && c.own);
    panel.querySelector("[data-pt-upload]").hidden = !isOwn;
    panel.querySelector("[data-pt-upload]").textContent = own.image ? "Replace image" : "Upload an image";
    panel.querySelector("[data-pt-sheet]").hidden = !c || isOwn || flipped;
    panel.querySelector("[data-pt-sheet]").textContent = sheet ? "Lift the sheet" : "Lay the transparent sheet";
    panel.querySelector("[data-pt-save]").hidden = isOwn && !own.image;
    panel.querySelector("[data-pt-flip]").textContent = flipped ? "Turn to the front" : "Turn over";
  }

  const pick = (i) => { picked = i; flipped = false; sheet = false; hover = -1; targets(); info(); };
  const putBack = () => { picked = -1; flipped = false; sheet = false; targets(); info(); };
  const flip = () => { if (picked === -1) return; flipped = !flipped; targets(); info(); };
  const step = (d) => { if (picked !== -1) pick((picked + d + all.length) % all.length); };

  root.addEventListener("click", (e) => {
    if (e.target.closest("[contenteditable]")) return;
    if (e.target.closest("[data-pt-back]")) return putBack();
    if (e.target.closest("[data-pt-flip]")) return flip();
    if (e.target.closest("[data-pt-upload]")) return file.click();
    if (e.target.closest("[data-pt-sheet]")) { sheet = !sheet; targets(); return info(); }
    if (e.target.closest("[data-pt-save]")) return save();
    if (e.target.closest("[data-pt-panel]")) return;
    const card = e.target.closest("[data-pc]");
    const i = card ? Number(card.dataset.pc) : -1;
    if (picked === -1) { if (i !== -1) pick(i); return; }
    // a card is in the hand: clicking it flips it (or asks for an image),
    // clicking anywhere else puts it back — no accidental swapping
    if (i === picked) return all[i].own && !own.image ? file.click() : flip();
    putBack();
  });
  root.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches("[data-pc]")) { e.preventDefault(); e.target.click(); }
  });
  // while a card is held, ←/→ move through the cards and Esc puts it back —
  // the magazine underneath must not turn its pages
  addEventListener("keydown", (e) => {
    if (picked === -1 || e.target.closest?.("[contenteditable]")) return;
    if (!["ArrowLeft", "ArrowRight", "Escape"].includes(e.key)) return;
    e.stopImmediatePropagation(); e.preventDefault();
    if (e.key === "Escape") putBack(); else step(e.key === "ArrowRight" ? 1 : -1);
  }, true);
  table.addEventListener("pointerover", (e) => {
    const card = e.target.closest("[data-pc]");
    const i = card ? Number(card.dataset.pc) : -1;
    if (i !== hover && picked === -1) { hover = i; targets(); }
  });
  table.addEventListener("pointerleave", () => { if (hover !== -1) { hover = -1; targets(); } });

  // upload → the TouchDesigner network
  file.addEventListener("change", async () => {
    const f = file.files[0];
    if (!f) return;
    const buf = await f.arrayBuffer();
    const exif = readExif(buf);
    const im = new Image();
    im.onload = () => {
      try {
        own.drivers = drivers({ lat: exif.lat, lon: exif.lon, when: exif.when || new Date(f.lastModified || Date.now()) });
        own.echo = new Echo(canvas, im, own.drivers);
      } catch {
        const ctx = canvas.getContext("2d"); // fallback without WebGL2
        ctx.filter = "saturate(1.6) contrast(1.05) blur(4px)";
        const k = Math.max(canvas.width / im.width, canvas.height / im.height);
        ctx.drawImage(im, (canvas.width - im.width * k) / 2, (canvas.height - im.height * k) / 2, im.width * k, im.height * k);
      }
      own.image = im;
      ownEl.querySelector(".own__blank").hidden = true;
      ownEl.querySelector(".own__art").hidden = false;
      if (exif.date) { own.date = exif.date; own.time = exif.time; }
      own.coords = exif.lat != null
        ? `${Math.abs(exif.lat).toFixed(3)}°${exif.lat >= 0 ? "N" : "S"} ${Math.abs(exif.lon).toFixed(3)}°${exif.lon >= 0 ? "E" : "W"}` : "";
      ownEl.querySelector('[data-own="date"]').textContent = own.date;
      ownEl.querySelector('[data-own="time"]').textContent = own.coords ? `${own.time} · ${own.coords}` : own.time;
      info(); kick();
    };
    im.onerror = () => { panel.querySelector(".pt__meta").textContent = "This browser can't open this format (e.g. HEIC in Chrome), please choose a JPG or PNG."; };
    im.src = URL.createObjectURL(new Blob([buf], { type: f.type }));
    file.value = "";
  });

  /* ---------------- export: the postcard in its frame ---------------- */
  const loadImg = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = src; });

  async function cardFace(c, back) {
    const w = 1400, h = Math.round(w / CARD_RATIO);
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    const g = cv.getContext("2d");
    g.fillStyle = "#fff"; g.fillRect(0, 0, w, h);
    if (!c.own) {
      g.drawImage(await loadImg(back ? c.back : c.src), 0, 0, w, h);
      if (!back && sheet) { g.globalCompositeOperation = "multiply"; g.drawImage(await loadImg(c.overlay), 0, 0, w, h); g.globalCompositeOperation = "source-over"; }
      return cv;
    }
    const script = `"Snell Roundhand", "Pinyon Script", cursive`;
    g.fillStyle = "#1a1a1a"; g.textAlign = "center";
    if (!back) {
      g.drawImage(canvas, w * WIN.l, h * WIN.t, w * (1 - WIN.l - WIN.r), h * (1 - WIN.t - WIN.b));
    } else {
      g.textAlign = "right"; g.font = `700 ${Math.round(h * 0.0125)}px Poppins, sans-serif`;
      [...ownEl.querySelectorAll(".own__meta span")].forEach((s, n) => g.fillText(s.textContent.toUpperCase(), w * 0.93, h * 0.045 + n * h * 0.015));
      g.textAlign = "center"; g.font = `${Math.round(h * 0.03)}px ${script}`;
      const lines = ownEl.querySelector(".own__msg").innerText.trim().split("\n");
      lines.forEach((l, n) => g.fillText(l, w / 2, h * 0.5 + (n - (lines.length - 1) / 2) * h * 0.042));
    }
    g.textAlign = "center"; g.font = `${Math.round(h * 0.022)}px ${script}`;
    g.fillText("Specimen 19 - Your Flower", w / 2, h * CAPTION_Y);
    return cv;
  }

  // Save: front and back as two separate JPEGs, in the original postcard size
  async function save() {
    const c = all[picked];
    if (!c) return;
    const name = `florilegium-${c.own ? "my-postcard" : c.name.toLowerCase().replace(/\s+/g, "-")}`;
    for (const [back, suffix] of [[false, "front"], [true, "back"]]) {
      const face = await cardFace(c, back);
      const out = document.createElement("canvas");
      out.width = face.width; out.height = face.height;
      const g = out.getContext("2d");
      g.fillStyle = "#fff"; g.fillRect(0, 0, out.width, out.height);
      g.drawImage(face, 0, 0);
      const a = document.createElement("a");
      a.download = `${name}-${suffix}.jpg`;
      a.href = out.toDataURL("image/jpeg", .92);
      a.click();
      await new Promise((r) => setTimeout(r, 400)); // two downloads, one after the other
    }
  }

  addEventListener("resize", () => { size(); targets(); });
  size();
  S.forEach((s) => { s.s.x = rest; });
  info();
  targets();
}
