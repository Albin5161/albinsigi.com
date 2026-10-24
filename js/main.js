// Albin Sigi | portfolio v2 (black & white)
// Dependency-free. Everything respects prefers-reduced-motion.

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// asset paths work from both the root page and /work/ pages
const assetPrefix = location.pathname.includes("/work/") ? "../" : "";

/* ---- logo in the nav (swaps in when assets/logo.png exists) ---- */
const navMark = document.querySelector(".nav__mark");
if (navMark) {
  const logo = new Image();
  logo.onload = () => {
    logo.className = "nav__logo";
    logo.alt = "";
    navMark.replaceWith(logo);
  };
  logo.src = assetPrefix + "assets/logo.png";
}

/* ---- then/now photo: tap to flip on touch screens ---- */
const flipPhoto = document.getElementById("flip-photo");
if (flipPhoto) {
  flipPhoto.addEventListener("click", () => flipPhoto.classList.toggle("is-flipped"));
}

/* ---- AI section: type the terminal command when it scrolls in ---- */
const termTyped = document.getElementById("term-typed");
if (termTyped) {
  const cmd = "ls ./ai-explorations";
  if (reducedMotion || !("IntersectionObserver" in window)) {
    termTyped.textContent = cmd;
  } else {
    const typeObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        typeObserver.disconnect();
        let i = 0;
        const typeNext = () => {
          termTyped.textContent = cmd.slice(0, ++i);
          if (i < cmd.length) setTimeout(typeNext, 45);
        };
        setTimeout(typeNext, 300);
      });
    }, { threshold: 0.3 });
    typeObserver.observe(document.getElementById("ai-terminal"));
  }
}

/* ---- scroll reveal ---- */
const revealEls = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !reducedMotion) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("is-visible"));
}

/* ---- nav border on scroll ---- */
const nav = document.querySelector(".nav");
if (nav) {
  window.addEventListener(
    "scroll",
    () => nav.classList.toggle("is-scrolled", window.scrollY > 10),
    { passive: true }
  );
}

/* ---- custom cursor (inverts what's under it) ---- */
const cursor = document.querySelector(".cursor-dot");
if (cursor && window.matchMedia("(hover: hover)").matches && !reducedMotion) {
  // if the childhood photo exists, the cursor becomes it
  const childPhoto = new Image();
  childPhoto.onload = () => {
    cursor.style.setProperty("--cursor-photo", `url("${childPhoto.src}")`);
    cursor.classList.add("cursor-dot--photo");
  };
  childPhoto.src = assetPrefix + "assets/photo-child.webp";

  /* The kid cursor can be switched off from the homepage footer.
     The choice is remembered in this browser. */
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
  };
  let kidOn = store.get("kid-cursor") !== "off";
  let footerSwitch = null;
  const setKid = (on) => {
    kidOn = on;
    store.set("kid-cursor", on ? "on" : "off");
    cursor.hidden = !on;
    if (footerSwitch) {
      footerSwitch.textContent = `Kid cursor: ${on ? "on" : "off"}`;
      footerSwitch.setAttribute("aria-pressed", String(on));
    }
  };
  cursor.hidden = !kidOn;

  const footerMeta = document.querySelector(".footer__meta");
  if (footerMeta) {
    const dot = document.createElement("span");
    dot.className = "footer__dot";
    dot.setAttribute("aria-hidden", "true");
    dot.textContent = "·";
    footerSwitch = document.createElement("button");
    footerSwitch.type = "button";
    footerSwitch.className = "footer__switch";
    footerSwitch.id = "kid-switch";
    footerSwitch.addEventListener("click", () => setKid(!kidOn));
    footerMeta.append(dot, footerSwitch);
    setKid(kidOn);
    // the About line that points here only makes sense once the switch exists
    const aboutNote = document.querySelector(".about__kid-off");
    if (aboutNote) aboutNote.hidden = false;
  }

  let cx = -100, cy = -100, tx = -100, ty = -100;

  // homepage: the first fold (hero and ticker) keeps the plain system cursor
  const firstFold = document.querySelector(".marquee") || document.querySelector(".hero");

  // when the mouse rests (usually someone reading), the photo steps away; any move brings it back
  // (some browsers and devices fire mousemove without moving, so only a real change counts)
  let idleTimer = 0;
  window.addEventListener("mousemove", (e) => {
    const moved = Math.abs(e.clientX - tx) + Math.abs(e.clientY - ty) > 2;
    tx = e.clientX;
    ty = e.clientY;
    const inFirstFold = firstFold && e.clientY < firstFold.getBoundingClientRect().bottom;
    cursor.classList.toggle("is-active", !inFirstFold);
    if (!moved) return;
    cursor.classList.remove("is-idle");
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => cursor.classList.add("is-idle"), 1100);
  });

  document.querySelectorAll("a, button").forEach((el) => {
    el.addEventListener("mouseenter", () => cursor.classList.add("is-hovering"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("is-hovering"));
  });

  // the photo trails beside the pointer (below right), never on top of what it points at;
  // the plain dot stays centred on it
  (function follow() {
    cx += (tx - cx) * 0.2;
    cy += (ty - cy) * 0.2;
    const photo = cursor.classList.contains("cursor-dot--photo");
    const ox = photo ? 30 : 0, oy = photo ? 34 : 0;
    cursor.style.transform = `translate(${cx + ox}px, ${cy + oy}px) translate(-50%, -50%)`;
    requestAnimationFrame(follow);
  })();
}

/* ---- copy email ---- */
const copyBtn = document.getElementById("copy-email");
const copyHint = document.getElementById("copy-hint");
if (copyBtn) {
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("sigi.albin@gmail.com");
      copyHint.textContent = "copied ✓";
    } catch {
      copyHint.textContent = "select & copy";
    }
    setTimeout(() => (copyHint.textContent = "click to copy"), 2200);
  });
}

/* ---- Kottayam local time (IST) ---- */
const timeEl = document.getElementById("local-time");
function tick() {
  timeEl.textContent = new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date());
}
if (timeEl) {
  tick();
  setInterval(tick, 30_000);
}

/* ---- Visit counter (homepage only) ----
   Counts once per browser session, reads the total on repeat views.
   Stays hidden if the store isn't attached or the request fails, so it
   never shows a broken number to a visitor. */
(function () {
  const el = document.getElementById("visit-count");
  if (!el) return;
  const sep = document.querySelector(".footer__visits-sep");
  const COUNTED = "pv-counted";
  const alreadyCounted = sessionStorage.getItem(COUNTED);
  fetch("/api/views" + (alreadyCounted ? "?peek=1" : ""))
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (!d || d.views == null) return;
      sessionStorage.setItem(COUNTED, "1");
      el.textContent = d.views.toLocaleString("en-IN") + (d.views === 1 ? " visit" : " visits");
      el.hidden = false;
      if (sep) sep.hidden = false;
    })
    .catch(() => {});
})();

/* ---- Work list: case studies 4 to 7 start folded behind a toggle ---- */
(function () {
  const more = document.getElementById("work-more");
  const toggle = document.querySelector(".work-toggle");
  if (!more || !toggle) return;
  const label = toggle.querySelector(".work-toggle__label");
  const icon = toggle.querySelector(".work-toggle__icon");
  const count = more.querySelectorAll(".work-row").length;

  function set(open) {
    more.classList.toggle("is-folded", !open);
    more.inert = !open;
    toggle.setAttribute("aria-expanded", String(open));
    label.textContent = open ? "Show fewer" : `${count} more case studies`;
    icon.textContent = open ? "\u2212" : "+";
  }
  set(false);
  toggle.hidden = false;

  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    if (open) return set(true);
    // fold instantly and scroll by the same amount, so the button stays under the pointer
    const before = toggle.getBoundingClientRect().top;
    more.classList.add("no-anim");
    set(false);
    window.scrollBy({ top: toggle.getBoundingClientRect().top - before, behavior: "instant" });
    requestAnimationFrame(() => more.classList.remove("no-anim"));
  });
})();

/* ---- Work-row hover preview (pointer devices only) ----
   Shows a small thumbnail near the cursor when a project row is hovered,
   easing toward the pointer. Disabled on touch and reduced-motion. */
(function () {
  const rows = document.querySelectorAll(".work-row[data-preview]");
  if (!rows.length) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const box = document.createElement("div");
  box.className = "work-preview";
  box.setAttribute("aria-hidden", "true");
  const img = document.createElement("img");
  img.alt = "";
  box.appendChild(img);
  document.body.appendChild(box);

  rows.forEach((r) => {
    const pre = new Image();
    pre.src = r.dataset.preview;
  });

  // the previews are cut-out devices of different shapes, so the height comes from the image
  const W = 320, OFF = 24;
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = null, active = false;

  function target(e) {
    const H = box.offsetHeight || W * 0.75;
    let x = e.clientX + OFF, y = e.clientY + OFF;
    if (x + W > window.innerWidth) x = e.clientX - W - OFF;
    if (y + H > window.innerHeight) y = e.clientY - H - OFF;
    return { x, y };
  }
  function loop() {
    const ease = reduce ? 1 : 0.18;
    cx += (tx - cx) * ease;
    cy += (ty - cy) * ease;
    box.style.left = Math.round(cx) + "px";
    box.style.top = Math.round(cy) + "px";
    if (active || Math.abs(tx - cx) > 0.5 || Math.abs(ty - cy) > 0.5) {
      raf = requestAnimationFrame(loop);
    } else {
      raf = null;
    }
  }
  rows.forEach((row) => {
    row.addEventListener("mouseenter", (e) => {
      if (img.getAttribute("src") !== row.dataset.preview) img.src = row.dataset.preview;
      const p = target(e);
      cx = tx = p.x;
      cy = ty = p.y;
      box.style.left = Math.round(p.x) + "px";
      box.style.top = Math.round(p.y) + "px";
      active = true;
      box.classList.add("is-visible");
      if (!raf) raf = requestAnimationFrame(loop);
    });
    row.addEventListener("mousemove", (e) => {
      const p = target(e);
      tx = p.x;
      ty = p.y;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    row.addEventListener("mouseleave", () => {
      active = false;
      box.classList.remove("is-visible");
    });
  });
})();

/* Doodle hover sounds: real recordings (a strum from Albin's own guitar
   video, a camera shutter and a child's laugh from Mixkit's free sound
   library, and for travel the chime before an announcement at a Kerala
   railway station: "Indian Railway announcement" by egovind on Freesound, CC0).
   Browsers only allow audio after a real user gesture (click/tap/key),
   so the context unlocks on the first interaction and hovers stay
   silent until then. Doodles are hover-only; the "little Albin" giggle
   also plays on tap. All skipped with reduced motion. */
(function () {
  const cards = document.querySelectorAll(".doodle[data-sound]");
  const kid = document.querySelector(".about__giggle");
  if (!cards.length && !kid) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  let ctx = null;
  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx.state === "running" ? ctx : null;
  }
  ["pointerdown", "keydown"].forEach((ev) =>
    window.addEventListener(ev, () => { ensureCtx(); if (ctx) loadSamples(ctx); }, { once: true, passive: true })
  );

  /* Recorded sounds: fetched once, the first time sound is allowed,
     so they cost nothing on page load (about 75 KB together). */
  const SAMPLES = { guitar: 0.75, camera: 0.5, giggle: 0.8, train: 0.7 };   // name: volume
  const buffers = {};
  let loading = null;
  function loadSamples(c) {
    if (!loading) loading = Promise.all(Object.keys(SAMPLES).map((name) =>
      fetch(assetPrefix + "assets/sounds/" + name + ".mp3")
        .then((r) => r.arrayBuffer())
        .then((data) => new Promise((ok, fail) => c.decodeAudioData(data, ok, fail)))
        .then((buf) => { buffers[name] = buf; })
        .catch(() => {})
    ));
    return loading;
  }
  function sample(c, name) {
    const run = () => {
      if (!buffers[name]) return;
      const src = c.createBufferSource();
      src.buffer = buffers[name];
      const g = c.createGain();
      g.gain.value = SAMPLES[name];
      src.connect(g).connect(c.destination);
      src.start();
    };
    if (buffers[name]) run(); else loadSamples(c).then(run);
  }

  const play = {
    guitar(c) { sample(c, "guitar"); },
    camera(c) { sample(c, "camera"); },
    giggle(c) { sample(c, "giggle"); },
    train(c) { sample(c, "train"); },
  };

  if (finePointer) cards.forEach((card) => {
    let last = 0;
    card.addEventListener("mouseenter", () => {
      const now = performance.now();
      if (now - last < 400) return;
      last = now;
      const c = ensureCtx();
      const fn = play[card.dataset.sound];
      if (c && fn) fn(c);
    });
  });

  /* "little Albin" giggles only when someone hovers or taps him. */
  if (kid) {
    let last = 0;
    const giggle = (fromTap) => {
      const now = performance.now();
      if (now - last < 900) return;
      let c = ensureCtx();
      // a tap is itself the gesture that unlocks sound, so wait for it once
      if (!c && fromTap === true && ctx) { ctx.resume().then(() => giggle()); return; }
      if (!c) return;
      last = now;
      play.giggle(c);
      kid.classList.remove("is-giggling"); void kid.offsetWidth; kid.classList.add("is-giggling");
    };
    if (finePointer) kid.addEventListener("mouseenter", () => giggle());
    kid.addEventListener("click", () => giggle(true));
  }
})();

/* Back-to-top button on case study pages. Injected here so every case
   page gets it without editing each file. Appears after scrolling down. */
(function () {
  const caseMain = document.querySelector("main.case");
  if (!caseMain) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "to-top";
  btn.setAttribute("aria-label", "Back to top");
  btn.innerHTML = '<span aria-hidden="true">↑</span>';
  document.body.appendChild(btn);

  const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
  });

  const onScroll = () => btn.classList.toggle("is-visible", window.scrollY > 600);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();

/* On-this-page table of contents for case studies. Built from the page's
   h2 headings, so every case page gets it without editing each file.
   Highlights the section you're reading (scrollspy) and jumps on click. */
(function () {
  const caseMain = document.querySelector("main.case");
  if (!caseMain) return;
  // A page can mark its main chapters with data-toc="Short name"; then only
  // those show in the list. Pages without any marks list every h2, as before.
  const marked = Array.from(caseMain.querySelectorAll("h2[data-toc]"));
  const headings = marked.length ? marked : Array.from(caseMain.querySelectorAll("h2"));
  if (headings.length < 3) return;

  const slug = (s) =>
    s.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 40);

  const nav = document.createElement("nav");
  nav.className = "case-toc";
  nav.setAttribute("aria-label", "On this page");

  const links = headings.map((h, i) => {
    if (!h.id) h.id = slug(h.textContent) || "section-" + i;
    const a = document.createElement("a");
    a.className = "case-toc__link";
    a.href = "#" + h.id;
    a.innerHTML =
      '<span class="case-toc__tick" aria-hidden="true"></span>' +
      '<span class="case-toc__label"></span>';
    a.querySelector(".case-toc__label").textContent = h.dataset.toc || h.textContent;
    nav.appendChild(a);
    return a;
  });
  document.body.appendChild(nav);

  // Labels sit in the gutter beside the text. When the longest one would run
  // into the reading column, switch to short names ("The problem: a real…"
  // becomes "The problem") and cap the width to the free space.
  const labels = links.map((a) => a.querySelector(".case-toc__label"));
  const full = labels.map((l) => l.textContent);
  const short = full.map((t) => t.split(/[:,]/)[0].trim());
  function fitLabels() {
    if (getComputedStyle(nav).display === "none") return;
    let textRight = 0;
    caseMain.querySelectorAll("p").forEach((p) => {
      if (!p.closest("figure")) textRight = Math.max(textRight, p.getBoundingClientRect().right);
    });
    const room = Math.floor(nav.getBoundingClientRect().right - 44 - textRight - 16);
    nav.style.removeProperty("--toc-label-max");
    labels.forEach((l, i) => (l.textContent = full[i]));
    const widest = Math.max(...labels.map((l) => l.offsetWidth)) * 1.05; // current one is bold
    if (widest <= room) return;
    labels.forEach((l, i) => (l.textContent = short[i]));
    nav.style.setProperty("--toc-label-max", Math.max(room, 80) + "px");
  }
  fitLabels();
  window.addEventListener("resize", fitLabels, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitLabels);

  // scrollspy: active = last heading whose top has passed a line near the top
  let ticking = false;
  function updateActive() {
    ticking = false;
    let current = 0;
    for (let i = 0; i < headings.length; i++) {
      if (headings[i].getBoundingClientRect().top <= 130) current = i;
    }
    links.forEach((a, i) => a.classList.toggle("is-current", i === current));
  }
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateActive);
      }
    },
    { passive: true }
  );
  updateActive();
})();

/* Corner mascot (homepage only): an autonomous little "kid-me" that
   wanders the bottom-left and does activities (walk, sit, sleep, stretch,
   code, guitar, photo, design), and copies the About tile under the pointer.
   Silent. Fades out over the dark contact section so a dark-bodied mascot
   doesn't vanish on black. */
(function () {
  const mascot = document.getElementById("mascot");
  if (!mascot) return;                                   // homepage only (runs on mobile too)
  const stage = document.getElementById("mascot-stage");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Frame-based mascot. Each action = a group of <img> frames + timing.
  // Stationary actions lazy-load (data-src) and play in place; walk moves + mirrors.
  const NAMES = ["walk", "wave", "sleep", "stretch", "guitar", "photo", "design"];
  const groups = {}, imgs = {};
  NAMES.forEach((n) => {
    groups[n] = document.getElementById("mc-" + n);
    imgs[n] = groups[n] ? [...groups[n].querySelectorAll("img")] : [];
  });
  const A = {
    walk:    { fps: 8, loop: true,  moves: true },   // walk stays lively
    wave:    { fps: 5, loop: false, hold: 1300 },     // activities slower
    sleep:   { fps: 4, loop: false, hold: 3200 },
    stretch: { fps: 3, loop: true,  dur: 7000 },      // really slow, repeats ~3-4x
    guitar:  { fps: 5, loop: true,  dur: 4200 },
    photo:   { fps: 5, loop: false, hold: 1100 },
    design:  { fps: 3, loop: true,  dur: 5200 },      // really slow
  };
  const flashEl = mascot.querySelector(".mc-flash");
  function fireFlash() {
    if (!flashEl) return;
    flashEl.classList.remove("fire"); void flashEl.offsetWidth; flashEl.classList.add("fire");
  }
  const ACTIVITIES = ["wave", "sleep", "stretch", "guitar", "photo", "design"];

  let action = "walk", f = 0, x = 40, dir = 1;
  let animT = 0, moveT = 0, holdT = 0, stateEnd = 0;
  const pxPerSec = 48;
  const W = () => mascot.offsetWidth || 86;
  const maxX = () => window.innerWidth - W() - 8;
  const rand = (a, b) => a + Math.random() * (b - a);

  function ensureLoaded(name) {
    imgs[name].forEach((im) => { if (im.dataset.src) { im.src = im.dataset.src; im.removeAttribute("data-src"); } });
  }
  function show(name) { for (const k in groups) if (groups[k]) groups[k].hidden = (k !== name); }
  function setFrame(name, i) { imgs[name].forEach((im, j) => im.classList.toggle("on", j === i)); }
  // only mirror while walking; activities are drawn front/side and render unmirrored
  function apply() {
    const facing = A[action].moves ? dir : 1;
    mascot.style.transform = `translateX(${x}px) scaleX(${facing})`;
  }

  function startWalk(now) {
    action = "walk"; f = 0; show("walk"); setFrame("walk", 0);
    stateEnd = now + rand(2800, 6200); animT = moveT = now; apply();
  }
  function startActivity(now, name = ACTIVITIES[(Math.random() * ACTIVITIES.length) | 0]) {
    ensureLoaded(name);
    action = name; f = 0; holdT = 0;                      // keep dir so walk resumes the same way; apply() unmirrors activities
    show(name); setFrame(name, 0);
    if (A[name].loop) stateEnd = now + A[name].dur;
    animT = now; apply();
  }

  function loop(now) {
    const a = A[action];
    if (now - animT >= 1000 / a.fps) {
      if (a.loop) { f = (f + 1) % imgs[action].length; setFrame(action, f); }
      else if (f < imgs[action].length - 1) { f++; setFrame(action, f); if (f === imgs[action].length - 1) holdT = now; }
      if (action === "photo" && f === 3) fireFlash();   // camera flash on the shutter frame
      animT = now;
    }
    if (a.moves) {
      const dt = Math.min((now - moveT) / 1000, 0.05);
      x += dir * pxPerSec * dt;
      if (x >= maxX()) { x = maxX(); dir = -1; }
      else if (x <= 8) { x = 8; dir = 1; }
      apply();
      if (now >= stateEnd) startActivity(now);
    } else if (a.loop) {
      if (now >= stateEnd && pinned !== action) startWalk(now);
    } else if (holdT && now - holdT >= a.hold) {
      startWalk(now);
    }
    moveT = now;
    requestAnimationFrame(loop);
  }

  if (reduce) { show("walk"); setFrame("walk", 0); apply(); return; }   // static, no motion

  /* Copycat: hovering the guitar clip in About makes him play along for as
     long as the pointer stays; hovering a photo or a travel clip makes him
     snap one. Pointer devices only, and only once he is up and walking. */
  let booted = false, pinned = null;
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.querySelectorAll(".life__tile").forEach((tile) => {
      const name = tile.classList.contains("life__tile--guitar") ? "guitar" : "photo";
      tile.addEventListener("mouseenter", () => {
        if (!booted) return;
        const now = performance.now();
        if (name === "guitar") pinned = "guitar";
        if (action === name && (A[name].loop || !holdT)) return;   // already at it
        startActivity(now, name);
      });
      tile.addEventListener("mouseleave", () => {
        if (pinned !== name) return;
        pinned = null;
        stateEnd = Math.min(stateEnd, performance.now() + 1200);   // finish the strum, then wander off
      });
    });
  }

  // Defer ALL mascot startup to idle so it never competes with first paint / LCP.
  // walk_0 is the only eager frame; load the rest of walk + wave when we actually start.
  function boot() {
    ensureLoaded("walk"); ensureLoaded("wave");
    booted = true;
    startWalk(performance.now());
    requestAnimationFrame(loop);
    // then preload the activity frames on a later idle tick
    const preload = () => ACTIVITIES.forEach(ensureLoaded);
    if ("requestIdleCallback" in window) requestIdleCallback(preload, { timeout: 6000 });
    else setTimeout(preload, 3000);
  }
  if ("requestIdleCallback" in window) requestIdleCallback(boot, { timeout: 3000 });
  else setTimeout(boot, 1200);
})();

/* ---- before/after compare slider (case studies) ---- */
(function () {
  const sliders = document.querySelectorAll(".compare-slider");
  if (!sliders.length) return;
  sliders.forEach((el) => {
    const range = el.querySelector(".compare-slider__range");
    const before = el.querySelector(".compare-slider__before");
    const handle = el.querySelector(".compare-slider__handle");
    if (!range || !before || !handle) return;
    const tagBefore = el.querySelector(".compare-slider__tag--before");
    const tagAfter = el.querySelector(".compare-slider__tag--after");
    const frame = el.querySelector(".compare-slider__frame");
    const update = (pos) => {
      const v = typeof pos === "number" ? pos : range.value;
      before.style.clipPath = `inset(0 ${100 - v}% 0 0)`;
      handle.style.left = v + "%";
      // A label only stays while its own side is showing behind it
      const x = (v / 100) * frame.clientWidth;
      if (tagBefore) tagBefore.classList.toggle("is-hidden", x < tagBefore.offsetLeft + tagBefore.offsetWidth);
      if (tagAfter) tagAfter.classList.toggle("is-hidden", x > tagAfter.offsetLeft);
    };
    range.addEventListener("input", update);
    update();

    // Hint that it drags: the divider sways a little while the slider is on
    // screen, and stops for good the first time someone touches it.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0, start = 0, touched = false;
    const sway = (t) => {
      if (!start) start = t;
      const p = ((t - start) % 3200) / 3200;           // one sway, then a rest
      const k = p < 0.5 ? Math.sin(p * 4 * Math.PI) : 0;
      update(50 + k * 7);                              // range steps are whole numbers; draw the fraction
      raf = requestAnimationFrame(sway);
    };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    const io = new IntersectionObserver(([e]) => {
      if (touched) return;
      if (e.isIntersecting && !raf) { start = 0; raf = requestAnimationFrame(sway); }
      else if (!e.isIntersecting) { stop(); update(); }
    }, { threshold: 0.5 });
    io.observe(el);
    const done = () => { touched = true; stop(); io.disconnect(); };
    ["pointerdown", "keydown", "touchstart"].forEach((ev) =>
      range.addEventListener(ev, done, { once: true, passive: true }));
  });
})();

/* ---- AI section: the film plays inside a terminal window ----
   Picks the 9:16 or 16:9 cut to fit the screen. Without <dialog>
   support the card stays a plain link to the mp4. */
(function () {
  const dialog = document.getElementById("film");
  const opener = document.querySelector("[data-film-open]");
  if (!dialog || !opener || typeof dialog.showModal !== "function") return;
  const video = dialog.querySelector(".film__video");
  const cuts = [...dialog.querySelectorAll(".film__cut")];
  const base = assetPrefix + "assets/ai/india-through-claude/";

  const pickCut = () => {
    const portrait = window.matchMedia("(max-aspect-ratio: 1/1)").matches;
    dialog.classList.toggle("film--portrait", portrait);
    const src = base + (portrait ? "film-v.mp4" : "film-h.mp4");
    if (!video.src.endsWith(src)) {
      video.poster = base + (portrait ? "poster-v.webp" : "poster-h.webp");
      video.src = src;
    }
  };
  const play = (t) => {
    video.currentTime = t;
    video.play().catch(() => {}); // blocked autoplay just leaves the controls visible
  };

  opener.addEventListener("click", (e) => {
    e.preventDefault();
    pickCut();
    dialog.showModal();
    play(0);
  });
  dialog.querySelector("[data-film-close]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); }); // backdrop
  dialog.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.preventDefault(); dialog.close(); } });
  dialog.addEventListener("close", () => video.pause());
  cuts.forEach((b) => b.addEventListener("click", () => play(+b.dataset.t)));
  video.addEventListener("timeupdate", () => {
    const t = video.currentTime;
    cuts.forEach((b) => {
      const c = +b.dataset.cut;
      b.classList.toggle("is-current", t >= c - 0.8 && t < c + 1.2);
    });
  });
})();

/* ---- About: the guitar and travel clips ----
   They load only when they come near the screen and pause when they leave,
   so they cost nothing on first load, and loop silently (with reduced motion
   they stay still until clicked). A click (or Enter/Space) on a clip with
   sound turns its sound on from the start; the next click pauses it, the one
   after plays on. Clips without sound just pause and play. Only one clip is
   heard at a time, and a paused clip stays paused when scrolled back. */
(function () {
  const videos = document.querySelectorAll(".life__video");
  if (!videos.length) return;
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const load = (v) => { if (!v.getAttribute("src")) v.src = v.dataset.src; };

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(({ target: v, isIntersecting }) => {
        if (isIntersecting) { load(v); if (!v.dataset.held && (!still || !v.muted)) v.play().catch(() => {}); }
        else if (v.getAttribute("src")) v.pause();
      });
    }, { rootMargin: "200px 0px" });
    videos.forEach((v) => io.observe(v));
  } else {
    videos.forEach(load);
  }

  const setHeld = (v, held) => {
    if (held) v.dataset.held = "1"; else delete v.dataset.held;
    v.closest(".life__tile").classList.toggle("is-paused", held);
  };
  const setMuted = (v, muted) => {
    v.muted = muted;
    v.closest(".life__tile").classList.toggle("is-loud", !muted);
  };
  videos.forEach((v) => {
    v.tabIndex = 0;
    const toggle = () => {
      load(v);
      if (v.paused) {
        if (v.hasAttribute("data-sound")) {
          videos.forEach((o) => { if (o !== v && !o.muted) setMuted(o, true); });
          setMuted(v, false);
        }
        setHeld(v, false);
        v.play().catch(() => {});
      } else if (v.muted && v.hasAttribute("data-sound")) {
        videos.forEach((o) => { if (o !== v && !o.muted) setMuted(o, true); });
        setMuted(v, false);
        v.currentTime = 0;
      } else {
        setHeld(v, true);
        v.pause();
      }
    };
    v.addEventListener("click", toggle);
    v.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
  });
})();
