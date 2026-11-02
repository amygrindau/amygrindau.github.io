// =====================================================================
// MOTION (GSAP + ScrollTrigger, stored in /vendor): a few precise movements,
// never decoration for its own sake. Everything is off with "reduce motion".
// =====================================================================
(() => {
  if (!window.gsap || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  gsap.registerPlugin(ScrollTrigger);
  const ease = "expo.out";

  window.Motion = {
    // a page that is revealed underneath while the sheet turns: the picture settles, lists arrive
    reveal(page, spread, ms) {
      const d = ms / 1000;
      const visual = page.querySelector(".pg--r .bg, .collage");
      if (visual && spread.project) gsap.fromTo(visual, { scale: 1.06 }, { scale: 1, duration: d + .9, ease, clearProps: "transform" });
      const items = page.querySelectorAll(".chapter__list a, .mast__toc a, .mast__more > *");
      if (items.length) gsap.fromTo(items, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .9, ease, stagger: .05, delay: d * .35, clearProps: "transform,opacity" });
    },

    // the story below the spread
    below(root) {
      ScrollTrigger.getAll().forEach((t) => t.vars.id === "below" && t.kill());
      // section titles: the rule draws itself in from the left
      root.querySelectorAll(".block__title").forEach((h) => {
        gsap.fromTo(h, { "--rule": 0 }, { "--rule": 1, duration: 1.2, ease, scrollTrigger: { id: "below", trigger: h, start: "top 88%" } });
      });
      ScrollTrigger.refresh();
    },

    // the archive: the pieces arrive one after another
    archive(layer) {
      gsap.fromTo(layer.querySelectorAll(".archive__group"), { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 1.1, ease, stagger: .09, delay: .1, clearProps: "transform,opacity" });
    },
  };
})();
