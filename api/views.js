// Visit counter backed by a Redis store (Upstash REST, via env vars Vercel
// injects when you attach a KV/Redis store to the project). No npm deps: uses
// the built-in fetch, so the site stays a static deploy with one function.
//
//   GET /api/views          -> increment, return { views }
//   GET /api/views?peek=1    -> read only, return { views }
//
// If the store isn't attached yet, returns { views: null } so the UI hides
// gracefully instead of showing an error.

export default async function handler(req, res) {
  const base = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  res.setHeader("Cache-Control", "no-store");

  if (!base || !token) {
    res.status(200).json({ views: null });
    return;
  }

  const key = "portfolio:views";
  const peek = req.query && (req.query.peek === "1" || req.query.peek === "true");
  const command = peek ? `get/${key}` : `incr/${key}`;

  try {
    const r = await fetch(`${base}/${command}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await r.json();
    const raw = data.result;
    const views = raw == null ? 0 : parseInt(raw, 10) || 0;
    res.status(200).json({ views });
  } catch (e) {
    res.status(200).json({ views: null });
  }
}
