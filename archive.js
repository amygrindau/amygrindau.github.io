// =====================================================================
// ARCHIVE: a strip of moving watercolour on the right edge.
// Click it and the colour flows from right to left over the page
// (everything but the header) and opens the archive: all work, 2020 to 2026,
// loosely on a timeline. Works with a page in the magazine can be clicked.
// =====================================================================
(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const phone = matchMedia("(max-width: 760px)");

  /* ---------------- the watercolour (WebGL) ---------------- */
  const VERT = `attribute vec2 p; varying vec2 uv; void main(){ uv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;
  const FRAG = `
precision mediump float;
varying vec2 uv;
uniform float t, reveal, rest, dir, aspect, span;
uniform vec3 mouse;        // x, y (screen 0..1), strength
uniform vec3 drops[6];     // x, y, age in seconds (age < 0 = unused)
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float v = 0., a = .5; for (int k = 0; k < 5; k++){ v += a * n(p); p = p * 2.03 + 7.1; a *= .5; } return v; }
// soft watercolour pigments: rose, magenta, lilac, periwinkle, a touch of butter yellow
vec3 pal(float x){
  vec3 c1 = vec3(.96,.74,.84), c2 = vec3(.90,.45,.66), c3 = vec3(.78,.66,.90), c4 = vec3(.64,.68,.92), c5 = vec3(.95,.88,.66), c6 = vec3(.88,.58,.82);
  x = fract(x) * 6.;
  if (x < 1.) return mix(c1, c2, x); if (x < 2.) return mix(c2, c3, x - 1.); if (x < 3.) return mix(c3, c4, x - 2.);
  if (x < 4.) return mix(c4, c5, x - 3.); if (x < 5.) return mix(c5, c6, x - 4.); return mix(c6, c1, x - 5.);
}
void main(){
  vec2 q = dir < .5 ? vec2(1. - span + uv.x * span, uv.y) : vec2(uv.x, uv.y * span);
  vec2 asp = vec2(aspect * (dir < .5 ? 1. / span : 1.), 1.);
  vec2 uv2 = q;
  // water: the cursor pushes the paint aside, drops send rings through it
  vec2 dm = q - mouse.xy; float rm = length(dm * asp);
  q += normalize(dm + 1e-5) * exp(-rm * rm * 30.) * .035 * mouse.z;
  for (int i = 0; i < 6; i++) {
    vec3 d = drops[i];
    if (d.z < 0.) continue;
    vec2 dd = q - d.xy; float r = length(dd * asp);
    float wave = sin(r * 55. - d.z * 9.) * exp(-d.z * 1.4) * exp(-abs(r - d.z * .16) * 12.);
    q += normalize(dd + 1e-5) * wave * .008;
  }
  float along = dir < .5 ? q.x : q.y;
  float across = dir < .5 ? q.y : q.x;
  vec2 w = vec2(across * 5.0, along * 1.3);
  float warp = fbm(w + vec2(t * .04, t * .015));
  float bands = fbm(vec2(across * 7.0 + warp * 2.0, along * 1.1 + t * .025));
  float x = along * .7 + (bands - .5) * .6 + (warp - .5) * .3 + (1. - across) * .8 * (1. - reveal);
  vec3 pig = pal(x * .8 + .1);
  // pigment density: washes, paper shows through between the bands
  float dens = smoothstep(.25, .8, fbm(vec2(across * 9. + warp, along * 2.2 - t * .02)));
  vec3 paper = vec3(.95, .93, .90);
  vec3 col = mix(paper, pig, .45 + dens * .45);
  // the wet edge: frayed, with a darker pigment rim (deep blue and magenta, like dried watercolour)
  float edge = mix(1. - rest, -.12, reveal);
  float fray = (fbm(vec2(across * 16., t * .2)) - .5) * (.006 + reveal * .09) + (fbm(vec2(across * 40., 3.)) - .5) * .012;
  float dist = along + fray - edge;
  float a = smoothstep(-.004, .016, dist);
  float rim = exp(-max(dist, 0.) * 55.) * a;
  vec3 rimCol = mix(vec3(.22,.24,.62), vec3(.80,.25,.55), fbm(vec2(across * 6., t * .1)));
  col = mix(col, rimCol, rim * .75);
  // white paint dropped into the wet colour: it blooms outward with a frayed edge
  for (int i = 0; i < 6; i++) {
    vec3 d = drops[i];
    if (d.z < 0.) continue;
    vec2 dd = (uv2 - d.xy) * asp;
    float grow = .035 + .11 * (1. - exp(-d.z * 1.3));
    float ang = atan(dd.y, dd.x);
    float wobble = (fbm(vec2(ang * 2.5 + float(i) * 3.1, d.z * .25)) - .5) * .05;
    float r = length(dd) + wobble;
    float life = 1. - smoothstep(9., 14., d.z);
    float wet = smoothstep(grow, grow - .03, r) * life;
    float ring = exp(-pow((r - grow) * 60., 2.)) * .35 * life;
    col = mix(col, vec3(.98, .97, .96), wet * .92);
    col = mix(col, pig * .8, ring);
  }
  col *= .97 + .05 * n(gl_FragCoord.xy * .8);   // paper grain
  gl_FragColor = vec4(col, a);
}`;

  const canvas = document.createElement("canvas");
  canvas.className = "wc";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  const gl = canvas.getContext("webgl", { premultipliedAlpha: false, alpha: true, antialias: false });
  let prog, loc = {};
  if (gl) {
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const p = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(p);
    gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);
    ["t", "reveal", "rest", "dir", "aspect", "span", "mouse"].forEach((k) => (loc[k] = gl.getUniformLocation(prog, k)));
    loc.drops = gl.getUniformLocation(prog, "drops");
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  } else {
    canvas.classList.add("wc--fallback"); // no WebGL: a still gradient
  }

  const state = { reveal: 0, target: 0, rest: 0, restTarget: 0 };
  // the cursor and clicks move the paint like water (screen coordinates 0..1, y up, below the header)
  const pointer = { x: 2, y: 2, z: 0, on: false }, drops = [];
  const toScreen = (e) => [e.clientX / innerWidth, 1 - (e.clientY - 44) / (innerHeight - 44)];
  addEventListener("pointermove", (e) => { [pointer.x, pointer.y] = toScreen(e); pointer.on = true; }, { passive: true });
  document.addEventListener("pointerleave", () => (pointer.on = false));
  addEventListener("pointerdown", (e) => {
    if (!document.body.classList.contains("archive-open") && !e.target.closest(".wc-edge")) return;
    const [x, y] = toScreen(e);
    drops.unshift({ x, y, t: performance.now() }); drops.length = Math.min(drops.length, 6);
  }, { passive: true });
  const scale = 0.5; // render at half resolution: soft anyway, and cheap
  // at rest the canvas only covers the edge strip (cheap); while flowing and open, the whole screen
  let span = 1;
  function size() {
    if (!gl) return; // fallback: a still strip, styled in CSS
    const full = state.target > 0 || state.reveal > .002 || state.restTarget > restWidth() * 1.2 || state.rest > restWidth() * 1.2;
    span = full ? 1 : Math.min(1, restWidth() * 4);
    const w = innerWidth, h = innerHeight - 44, vertical = phone.matches;
    canvas.style.left = vertical ? "0" : `${(1 - span) * 100}%`;
    canvas.style.top = vertical ? `calc(44px + ${(1 - span) * 100}%)` : "44px";
    canvas.style.width = vertical ? "100%" : `${span * 100}%`;
    canvas.style.height = vertical ? `calc((100% - 44px) * ${span})` : "calc(100% - 44px)";
    canvas.width = Math.max(1, Math.round(w * (vertical ? 1 : span) * scale));
    canvas.height = Math.max(1, Math.round(h * (vertical ? span : 1) * scale));
    gl?.viewport(0, 0, canvas.width, canvas.height);
  }
  const restWidth = () => (phone.matches ? 26 / (innerHeight - 44) : .04); // the strip: 4 % of the width (phones: 26 px high)
  addEventListener("resize", () => { state.restTarget = restWidth(); size(); });
  state.restTarget = state.rest = restWidth();
  size();

  let t0 = performance.now(), last = 0, clock = 0;
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000 || .016); last = now;
    // ease the reveal like liquid: slow start, soft landing
    const k = reduced ? 1 : 1 - Math.exp(-dt * 2.4);
    state.reveal += (state.target - state.reveal) * k;
    state.rest += (state.restTarget - state.rest) * (reduced ? 1 : 1 - Math.exp(-dt * 6));
    const wantFull = state.target > 0 || state.reveal > .002 || state.rest > restWidth() * 1.2;
    if (wantFull !== (span === 1)) size();
    if (gl) {
      // at rest the strip moves faster and breathes; open, the colour drifts slowly
      clock += dt * (reduced ? 0 : 1 + 2.2 * (1 - state.reveal));
      gl.uniform1f(loc.t, reduced ? 3 : clock);
      gl.uniform1f(loc.reveal, state.reveal);
      gl.uniform1f(loc.rest, state.rest * (1 + .18 * Math.sin(clock * .9) * (1 - state.reveal)));
      gl.uniform1f(loc.dir, phone.matches ? 1 : 0);
      gl.uniform1f(loc.aspect, canvas.width / canvas.height);
      gl.uniform1f(loc.span, span);
      pointer.z += ((pointer.on ? 1 : 0) - pointer.z) * (1 - Math.exp(-dt * 4));
      gl.uniform3f(loc.mouse, pointer.x, pointer.y, reduced ? 0 : pointer.z);
      const arr = new Float32Array(18);
      for (let i = 0; i < 6; i++) {
        const d = drops[i], age = d ? (now - d.t) / 1000 : -1;
        arr.set([d ? d.x : 0, d ? d.y : 0, d && age < 14 ? age : -1], i * 3);
      }
      gl.uniform3fv(loc.drops, arr);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    if (waiting && state.reveal > .82) show();
    if (document.hidden) { running = false; return; }
    requestAnimationFrame(frame);
  }
  let running = true;
  requestAnimationFrame(frame);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && !running) { running = true; last = 0; requestAnimationFrame(frame); } });

  /* ---------------- the strip (the way in) ---------------- */
  const edge = document.createElement("button");
  edge.className = "wc-edge";
  edge.innerHTML = `<span>Archive</span>`;
  edge.setAttribute("aria-label", "Open the archive");
  document.body.appendChild(edge);
  edge.addEventListener("mouseenter", () => { if (!state.target) state.restTarget = restWidth() * 1.8; });
  edge.addEventListener("mouseleave", () => { state.restTarget = restWidth(); });

  /* ---------------- the archive ---------------- */
  const thumb = (p) => p.poster || p.still || p.key?.src || p.key?.collage?.[0];
  const firstYear = (y) => parseInt(String(y), 10);
  const items = [
    ...projects.filter((p) => !(DATA.archiveSkip || []).includes(p.id))
      .map((p) => ({ title: p.title, kind: p.kind, year: firstYear(p.year), src: thumb(p), link: p.id, issue: p.section !== "Archive" })),
    ...(DATA.archive || []).map((a) => ({ ...a, issue: false })),
  ].filter((a) => a.src && a.year).sort((a, b) => b.year - a.year);

  const Y0 = Math.min(2020, ...items.map((i) => i.year)), Y1 = 2026;
  const years = [...new Set(items.map((i) => i.year))];
  const layer = document.createElement("section");
  layer.className = "archive";
  layer.hidden = true;
  layer.setAttribute("aria-label", "Archive");
  layer.innerHTML = `
    <header class="archive__head">
      <h2 class="archive__title serif">Archive</h2>
      <p class="archive__sub">${Y1} to ${Y0}</p>
      <button class="archive__close" data-archive-close>Close →</button>
    </header>
    <div class="archive__scroll" tabindex="0">
      <div class="archive__row">
        ${years.map((y) => `<div class="archive__group">
          <p class="archive__year serif">${y}</p>
          <div class="archive__items">${items.filter((i) => i.year === y).map((it, n) => {
            const tag = it.link ? "a" : "div";
            const src = SIZES[it.src] ? small(it.src) : it.src;
            return `<${tag} class="archive__item${it.link ? " is-link" : ""}" ${it.link ? `href="${urlFor(it.link)}" data-archive-go="${it.link}"` : ""}>
              <span class="archive__img"><img src="${encodeURI(src)}" alt="${it.title}, ${it.kind || ""}, ${it.year}" loading="lazy" decoding="async"></span>
              <span class="archive__cap"><b>${it.title}</b><span>${it.kind || ""}</span></span>
            </${tag}>`;
          }).join("")}</div>
        </div>`).join("")}
      </div>
    </div>`;
  document.body.appendChild(layer);
  const scroller = layer.querySelector(".archive__scroll");

  // a mouse wheel scrolls the timeline sideways
  scroller.addEventListener("wheel", (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { scroller.scrollLeft += e.deltaY; e.preventDefault(); }
  }, { passive: false });

  let openTimer, waiting = false;
  function show() {
    waiting = false;
    layer.hidden = false;
    layer.querySelectorAll("img").forEach((i) => (i.loading = "eager"));
    setTimeout(() => layer.classList.add("is-in"), 20);
    scroller.scrollLeft = 0; // start at today, on the left
    layer.querySelector("[data-archive-close]").focus({ preventScroll: true });
  }
  function open() {
    if (!layer.hidden || waiting) return;
    state.target = 1;
    document.body.classList.add("archive-open");
    // the content appears once the colour has (nearly) filled the screen; at the latest after 2 s
    waiting = true;
    clearTimeout(openTimer);
    if (reduced || !gl) show(); else openTimer = setTimeout(() => waiting && show(), 2000);
    if (location.hash !== "#/archive") history.pushState({ archive: 1 }, "", "#/archive");
  }
  function close(push = true) {
    if (!document.body.classList.contains("archive-open")) return;
    clearTimeout(openTimer);
    waiting = false;
    layer.classList.remove("is-in");
    setTimeout(() => { layer.hidden = true; }, reduced ? 0 : 300);
    state.target = 0;
    state.restTarget = restWidth();
    document.body.classList.remove("archive-open");
    if (push && location.hash === "#/archive") history.back();
  }
  edge.addEventListener("click", open);
  const back = document.createElement("button");
  back.className = "wc-back";
  back.innerHTML = `<span>← Issue</span>`;
  back.setAttribute("aria-label", "Back to the magazine");
  document.body.appendChild(back);
  back.addEventListener("click", () => close());
  document.addEventListener("click", (e) => { if (e.target.closest("[data-open-archive]")) open(); });
  layer.addEventListener("click", (e) => {
    if (e.target.closest("[data-archive-close]")) return close();
    const go = e.target.closest("[data-archive-go]");
    if (go) {
      e.preventDefault();
      close(false);
      const i = indexOf(go.dataset.archiveGo);
      history.replaceState(null, "", urlFor(go.dataset.archiveGo));
      if (i >= 0) turn(i, false);
    }
  });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !layer.hidden) close(); });
  addEventListener("popstate", () => { if (location.hash === "#/archive") open(); else close(false); });
  if (START_HASH === "#/archive") setTimeout(open, 400);
})();
