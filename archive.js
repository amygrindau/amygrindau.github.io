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
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float v = 0., a = .5; for (int k = 0; k < 5; k++){ v += a * n(p); p = p * 2.03 + 7.1; a *= .5; } return v; }
// palette from the reference: lilac, pink, green, deep blue, orange, cream
vec3 pal(float x){
  vec3 c1 = vec3(.80,.82,.95), c2 = vec3(.86,.60,.84), c3 = vec3(.35,.55,.30), c4 = vec3(.13,.12,.28), c5 = vec3(.93,.58,.25), c6 = vec3(.95,.90,.86);
  x = clamp(x, 0., 1.) * 5.;
  if (x < 1.) return mix(c1, c2, x); if (x < 2.) return mix(c2, c3, x - 1.); if (x < 3.) return mix(c3, c4, x - 2.);
  if (x < 4.) return mix(c4, c5, x - 3.); return mix(c5, c6, x - 4.);
}
void main(){
  // the canvas may only cover the edge of the screen: map back to screen coordinates
  vec2 q = dir < .5 ? vec2(1. - span + uv.x * span, uv.y) : vec2(uv.x, uv.y * span);
  float along = dir < .5 ? q.x : q.y;          // the direction the colour flows in
  float across = dir < .5 ? q.y : q.x;
  // smeared horizontally like wet paint: stretch the noise across, warp it slowly
  vec2 w = vec2(across * 6.0, along * 1.4);
  float warp = fbm(w + vec2(t * .05, t * .02));
  float bands = fbm(vec2(across * 9.0 + warp * 2.2, along * 1.2 + t * .03));
  // at rest (the strip) all colours run from top to bottom; once it flows, they spread across
  float x = along * .85 + (bands - .5) * .55 + (warp - .5) * .25 + (1. - across) * .75 * (1. - reveal);
  vec3 col = pal(fract(x * .9 + .05));
  col = mix(col, vec3(.96, .94, .92), smoothstep(.55, 1., fbm(w * 2. + t * .04)) * .35 * reveal); // paper showing through
  col *= .96 + .08 * n(gl_FragCoord.xy * .7);                                            // grain
  // the wet edge: where the colour stops, with a frayed watercolour border
  float edge = mix(1. - rest, -.12, reveal);
  float fray = (fbm(vec2(across * 14., t * .25)) - .5) * (.004 + reveal * .1);
  float a = smoothstep(edge - .004, edge + .018, along + fray);
  float rim = smoothstep(.03, 0., abs(along + fray - edge - .01)) * .18;                 // darker drying rim
  gl_FragColor = vec4(col * (1. - rim), a);
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
    ["t", "reveal", "rest", "dir", "aspect", "span"].forEach((k) => (loc[k] = gl.getUniformLocation(prog, k)));
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  } else {
    canvas.classList.add("wc--fallback"); // no WebGL: a still gradient
  }

  const state = { reveal: 0, target: 0, rest: 0, restTarget: 0 };
  const scale = 0.5; // render at half resolution: soft anyway, and cheap
  // at rest the canvas only covers the edge strip (cheap); while flowing and open, the whole screen
  let span = 1;
  function size() {
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
  const restWidth = () => (phone.matches ? 14 / (innerHeight - 44) : 22 / innerWidth); // the strip: 22 px wide (phones: 14 px high)
  addEventListener("resize", () => { state.restTarget = restWidth(); size(); });
  state.restTarget = state.rest = restWidth();
  size();

  let t0 = performance.now(), last = 0;
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000 || .016); last = now;
    // ease the reveal like liquid: slow start, soft landing
    const k = reduced ? 1 : 1 - Math.exp(-dt * 2.4);
    state.reveal += (state.target - state.reveal) * k;
    state.rest += (state.restTarget - state.rest) * (reduced ? 1 : 1 - Math.exp(-dt * 6));
    const wantFull = state.target > 0 || state.reveal > .002 || state.rest > restWidth() * 1.2;
    if (wantFull !== (span === 1)) size();
    if (gl) {
      gl.uniform1f(loc.t, reduced ? 3 : (now - t0) / 1000);
      gl.uniform1f(loc.reveal, state.reveal);
      gl.uniform1f(loc.rest, state.rest);
      gl.uniform1f(loc.dir, phone.matches ? 1 : 0);
      gl.uniform1f(loc.aspect, canvas.width / canvas.height);
      gl.uniform1f(loc.span, span);
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
  edge.addEventListener("mouseenter", () => { if (!state.target) state.restTarget = restWidth() * 2.6; });
  edge.addEventListener("mouseleave", () => { state.restTarget = restWidth(); });

  /* ---------------- the archive ---------------- */
  const thumb = (p) => p.poster || p.still || p.key?.src || p.key?.collage?.[0];
  const firstYear = (y) => parseInt(String(y), 10);
  const items = [
    ...projects.filter((p) => !(DATA.archiveSkip || []).includes(p.id))
      .map((p) => ({ title: p.title, kind: p.kind, year: firstYear(p.year), src: thumb(p), link: p.id, issue: p.section !== "Archive" })),
    ...(DATA.archive || []).map((a) => ({ ...a, issue: false })),
  ].filter((a) => a.src && a.year).sort((a, b) => a.year - b.year);

  const Y0 = 2020, Y1 = 2026;
  // a stable "random" per title, so the layout is the same on every visit
  const rnd = (str, salt) => { let h = 2166136261 ^ salt; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 1000) / 1000; };
  const byYear = {};
  items.forEach((it) => (byYear[it.year] = (byYear[it.year] || []).concat(it)));

  const layer = document.createElement("section");
  layer.className = "archive";
  layer.hidden = true;
  layer.setAttribute("aria-label", "Archive");
  layer.innerHTML = `
    <header class="archive__head">
      <h2 class="archive__title serif">Archive</h2>
      <p class="archive__sub">Everything, ${Y0} to ${Y1}. Pieces with a page in the magazine open it.</p>
      <button class="archive__close" data-archive-close>Close →</button>
    </header>
    <div class="archive__scroll" tabindex="0">
      <div class="archive__track" style="--years:${Y1 - Y0 + 1}">
        ${Array.from({ length: Y1 - Y0 + 1 }, (_, k) => `<span class="archive__year serif" style="--k:${k}">${Y0 + k}</span>`).join("")}
        <span class="archive__line"></span>
        ${items.map((it) => {
          const list = byYear[it.year], i = list.indexOf(it), n = list.length;
          const x = (it.year - Y0 + (i + .5) / n * .86 + .07) / (Y1 - Y0 + 1) * 100;
          const y = 8 + rnd(it.title, 1) * 52;
          const w = (it.issue ? 15 : 10) + rnd(it.title, 2) * 6;
          const tag = it.link ? "a" : "div";
          const src = SIZES[it.src] ? small(it.src) : it.src;
          return `<${tag} class="archive__item${it.link ? " is-link" : ""}${it.issue ? " is-issue" : ""}" ${it.link ? `href="${urlFor(it.link)}" data-archive-go="${it.link}"` : ""}
            style="left:${x}%;top:${y}%;--w:${w}vh;rotate:${(rnd(it.title, 3) - .5) * 5}deg">
            <img src="${encodeURI(src)}" alt="${it.title}, ${it.kind || ""}, ${it.year}" loading="lazy" decoding="async">
            <span class="archive__cap"><b>${it.title}</b>${it.kind ? `, ${it.kind}` : ""} · ${it.year}</span>
          </${tag}>`;
        }).join("")}
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
    scroller.scrollLeft = scroller.scrollWidth; // start at today
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
