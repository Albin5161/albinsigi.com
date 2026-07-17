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
