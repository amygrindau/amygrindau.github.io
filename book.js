// =====================================================================
// Book — a magazine you can open, flip through and close.
// Used for the whole website AND for the small magazine viewers.
//
// spreads: [{ id, left: html|null, right: html|null }]
//   left = null  → closed front cover (only the right page shows)
//   right = null → closed back cover  (only the left page shows)
//
// The turning sheet is one leaf with a front and a back face; light,
// shadow and a cast shadow on the page underneath make it feel like paper.
// =====================================================================

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // easeInOutCubic

class Book {
  constructor(el, spreads, { onChange, onSwipe, clickToTurn = false, duration = 1250, ratio } = {}) {
    this.el = el;
    this.spreads = spreads;
    this.onChange = onChange;
    this.duration = duration;
    this.i = 0;
    this.busy = false;
    this.mobile = matchMedia("(max-width: 760px)");
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)");

    el.classList.add("book");
    if (ratio) el.style.aspectRatio = String(2 * ratio); // page width / height
    el.innerHTML = `
      <div class="book__inner">
        <div class="book__page book__page--left"></div>
        <div class="book__page book__page--right"></div>
        <div class="book__leaf" aria-hidden="true"></div>
      </div>`;
    this.inner = el.querySelector(".book__inner");
    this.left = el.querySelector(".book__page--left");
    this.right = el.querySelector(".book__page--right");
    this.leaf = el.querySelector(".book__leaf");

    // touch: swipe left = next page, swipe right = back; vertical swipes still scroll the page
    let sx = 0, sy = 0, swiped = false;
    const swipe = onSwipe || ((d) => this.go(this.i + d));
    el.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") { sx = e.clientX; sy = e.clientY; swiped = false; } });
    el.addEventListener("pointerup", (e) => {
      if (e.pointerType === "mouse") return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) { swiped = true; swipe(dx < 0 ? 1 : -1); }
    });
    el.addEventListener("click", (e) => { if (swiped) { e.stopPropagation(); e.preventDefault(); swiped = false; } }, true);

    if (clickToTurn) {
      this.left.addEventListener("click", () => this.prev());
      this.right.addEventListener("click", () => this.next());
    }
    this.show(0);
  }

  setPage(pageEl, html) {
    if (pageEl._html === html) return; // unchanged → no repaint, no flicker
    pageEl._html = html;
    pageEl.innerHTML = html || "";
    pageEl.classList.toggle("is-empty", !html);
  }

  setClosed(spread) {
    this.el.classList.toggle("is-closed-front", !spread.left);
    this.el.classList.toggle("is-closed-back", !spread.right);
  }

  show(i) { // instant, no animation
    const s = this.spreads[i];
    this.i = i;
    this.setPage(this.left, s.left);
    this.setPage(this.right, s.right);
    this.setClosed(s);
    this.onChange?.(i, s);
  }

  next() { return this.go(this.i + 1); }
  prev() { return this.go(this.i - 1); }

  async go(t) {
    if (this.busy || t === this.i || t < 0 || t >= this.spreads.length) return;
    if (this.reduced.matches) return this.show(t);
    if (this.mobile.matches) return this.fade(t);

    this.busy = true;
    this.el.classList.add("is-turning"); // 3D only while turning → flat and crisp at rest
    const dir = t > this.i ? 1 : -1;
    const cur = this.spreads[this.i];
    const nxt = this.spreads[t];
    const pw = this.right.offsetWidth || this.left.offsetWidth;

    // front = the page we lift, back = the page that lands
    const front = dir > 0 ? cur.right : cur.left;
    const back = dir > 0 ? nxt.left : nxt.right;
    this.buildLeaf(dir, front, back, pw);
    if (dir > 0) this.setPage(this.right, nxt.right); // revealed underneath
    else this.setPage(this.left, nxt.left);
    this.setClosed(nxt); // opening/closing slides the book to the centre in parallel

    await this.animateLeaf(dir);

    if (dir > 0) this.setPage(this.left, nxt.left);
    else this.setPage(this.right, nxt.right);
    this.leaf.style.display = "none";
    this.leaf.innerHTML = "";
    this.el.classList.remove("is-turning");
    this.i = t;
    this.busy = false;
    this.onChange?.(t, nxt);
  }

  // One sheet with two faces. A light/shadow sweep and a soft cast shadow on the
  // page underneath give the feeling of paper lifting — without seams or flicker.
  buildLeaf(dir, frontHTML, backHTML, pw) {
    const face = (html, back) => `
      <div class="leaf__face ${back ? "leaf__face--back" : "leaf__face--front"}">
        <div class="leaf__content" style="width:${pw}px">${html || ""}</div>
        <div class="leaf__shade"></div>
      </div>`;
    this.leaf.className = `book__leaf ${dir > 0 ? "on-right" : "on-left"}`;
    this.leaf.innerHTML = face(frontHTML, false) + face(backHTML, true);
    this.leaf.style.display = "block";
  }

  animateLeaf(dir) {
    const N = 40, turn = [], shadeF = [], shadeB = [], cast = [];
    for (let f = 0; f <= N; f++) {
      const e = ease(f / N);
      const lift = Math.sin(Math.PI * e);                  // 0 → 1 → 0
      turn.push({ transform: `translateZ(${(lift * 18).toFixed(2)}px) rotateY(${(-180 * e * dir).toFixed(2)}deg)` });
      shadeF.push({ opacity: Math.min(1, e * 2) * 0.32 });  // the front darkens as it turns away
      shadeB.push({ opacity: Math.max(0, 1 - e * 2) * 0.32 + lift * 0.06 }); // the back brightens as it lands
      cast.push({ opacity: lift * 0.9 });
    }
    const opts = { duration: this.duration, easing: "linear", fill: "forwards" };
    // the cast shadow goes onto the page that is revealed underneath (already set by go())
    const under = dir > 0 ? this.right : this.left;
    under.insertAdjacentHTML("beforeend", `<div class="book__cast ${dir > 0 ? "from-left" : "from-right"}"></div>`);
    const castEl = under.querySelector(".book__cast");
    const anims = [
      this.leaf.animate(turn, opts),
      this.leaf.querySelector(".leaf__face--front .leaf__shade").animate(shadeF, opts),
      this.leaf.querySelector(".leaf__face--back .leaf__shade").animate(shadeB, opts),
      castEl?.animate(cast, opts),
    ].filter(Boolean);
    return Promise.all(anims.map((a) => a.finished)).then(() => castEl?.remove());
  }

  async fade(t) { // simple swap on phones
    this.busy = true;
    await this.inner.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: "forwards" }).finished;
    this.show(t);
    await this.inner.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, fill: "forwards" }).finished;
    this.busy = false;
  }
}
