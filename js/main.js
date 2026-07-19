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

/* ============================================================
   Hero dot grid | dots lean toward the cursor, then settle back
   ============================================================ */
const canvas = document.getElementById("dot-canvas");
if (canvas && !reducedMotion) {
  const ctx = canvas.getContext("2d");
  const GAP = 26;
  const dots = [];
  let mouseX = -9999, mouseY = -9999;
  let width = 0, height = 0, dpr = 1;

  function build() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.parentElement.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    dots.length = 0;
    for (let y = GAP; y < height; y += GAP) {
      for (let x = GAP; x < width; x += GAP) {
        dots.push({ ox: x, oy: y, x, y });
      }
    }
  }

  function frame() {
    ctx.clearRect(0, 0, width, height);
    const RADIUS = 140;

    for (const d of dots) {
      const dx = mouseX - d.ox;
      const dy = mouseY - d.oy;
      const dist = Math.hypot(dx, dy);

      let tx = d.ox, ty = d.oy;
      let size = 1.1;
      let shade = 210; // light gray

      if (dist < RADIUS) {
        const pull = (1 - dist / RADIUS) * 10;
        tx = d.ox + (dx / (dist || 1)) * pull;
        ty = d.oy + (dy / (dist || 1)) * pull;
        size = 1.1 + (1 - dist / RADIUS) * 1.8;
        shade = 210 - (1 - dist / RADIUS) * 190; // darkens to near black
      }

      d.x += (tx - d.x) * 0.14;
      d.y += (ty - d.y) * 0.14;

      ctx.beginPath();
      ctx.arc(d.x, d.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
      ctx.fill();
    }
    requestAnimationFrame(frame);
  }

  const hero = canvas.parentElement;
  hero.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });
  hero.addEventListener("mouseleave", () => {
    mouseX = -9999;
    mouseY = -9999;
  });

  window.addEventListener("resize", build);
  build();
  frame();

  // fonts can change the hero's height after first paint; rebuild so the
  // grid always reaches the bottom of the hero
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
  if ("ResizeObserver" in window) new ResizeObserver(build).observe(hero);
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
    cursor.classList.add("cursor-dot--photo");
    cursor.style.backgroundImage = `url("${childPhoto.src}")`;
  };
  childPhoto.src = assetPrefix + "assets/photo-child.png";

  let cx = -100, cy = -100, tx = -100, ty = -100;

  window.addEventListener("mousemove", (e) => {
    tx = e.clientX;
    ty = e.clientY;
    cursor.classList.add("is-active");
  });

  document.querySelectorAll("a, button").forEach((el) => {
    el.addEventListener("mouseenter", () => cursor.classList.add("is-hovering"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("is-hovering"));
  });

  (function follow() {
    cx += (tx - cx) * 0.2;
    cy += (ty - cy) * 0.2;
    cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
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

  const W = 300, H = (300 * 9) / 16, OFF = 24;
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = null, active = false;

  function target(e) {
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
