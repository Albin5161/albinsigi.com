// Which case studies show on the site. Stored in the same Redis store as the
// visit counter, so it can change from /admin.html without a redeploy.
//
//   GET  /api/projects                          -> { projects, hidden }
//   POST /api/projects { password }             -> checks the password only
//   POST /api/projects { password, hidden }     -> saves the hidden list
//
// The password is the ADMIN_PASSWORD env var in Vercel. Without it, saving
// is refused. Without the store, nothing is hidden.

import { timingSafeEqual } from "node:crypto";

// every case study, in site order; the slug is the file name in /work/
export const PROJECTS = [
  { slug: "intelligence-dashboard", title: "Law Enforcement Intelligence Dashboard" },
  { slug: "referral-status", title: "Referral Status, a LinkedIn Concept" },
  { slug: "xplore", title: "Xplore, a Travel App Built on Real APIs" },
  { slug: "citizen-safety-app", title: "Citizen Safety App" },
  { slug: "nucleus-design-system", title: "Nucleus Design System" },
  { slug: "cinema-ticketing", title: "CinePass, a Cinema Ticketing App" },
  { slug: "mx-ad-break", title: "The Ad Break, an MX Player Concept" },
];

const KEY = "portfolio:hidden";

function store() {
  const base = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return base && token ? { base, token } : null;
}

async function redis(s, command) {
  const r = await fetch(s.base, {
    method: "POST",
    headers: { Authorization: `Bearer ${s.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  const data = await r.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

function passwordOk(given) {
  const real = process.env.ADMIN_PASSWORD;
  if (!real || typeof given !== "string") return false;
  const a = Buffer.from(given);
  const b = Buffer.from(real);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const s = store();

  if (req.method === "GET") {
    let hidden = [];
    if (s) {
      try {
        hidden = JSON.parse((await redis(s, ["GET", KEY])) || "[]");
      } catch (e) {
        hidden = [];
      }
    }
    res.status(200).json({ projects: PROJECTS, hidden });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  if (!process.env.ADMIN_PASSWORD) {
    res.status(503).json({ error: "ADMIN_PASSWORD is not set in Vercel yet." });
    return;
  }
  if (!passwordOk(body.password)) {
    res.status(401).json({ error: "Wrong password." });
    return;
  }
  if (body.hidden === undefined) {
    res.status(200).json({ ok: true });
    return;
  }
  if (!s) {
    res.status(503).json({ error: "The Redis store is not attached." });
    return;
  }

  const known = new Set(PROJECTS.map((p) => p.slug));
  const hidden = Array.isArray(body.hidden) ? [...new Set(body.hidden.filter((h) => known.has(h)))] : [];
  try {
    await redis(s, ["SET", KEY, JSON.stringify(hidden)]);
    res.status(200).json({ ok: true, hidden });
  } catch (e) {
    res.status(500).json({ error: "Could not save. Try again." });
  }
}
