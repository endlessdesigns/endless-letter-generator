const { put, list } = require('@vercel/blob');
const crypto = require('crypto');
module.exports = async (req, res) => {
  const pass = process.env.TEAM_PASSWORD;
  res.setHeader('Cache-Control', 'no-store');
  if (!pass) return res.status(500).json({ error: 'TEAM_PASSWORD not set' });
  if (req.headers['x-team-pass'] !== pass) return res.status(401).json({ error: 'wrong password' });
  const name = 'els-' + crypto.createHash('sha256').update(pass + ':letters').digest('hex').slice(0, 24) + '.json';
  try {
    if (req.method === 'GET') {
      const { blobs } = await list({ prefix: name });
      const b = blobs.find(x => x.pathname === name);
      if (!b) return res.status(200).json({ list: [], deleted: {} });
      const r = await fetch(b.url + '?t=' + Date.now(), { cache: 'no-store' });
      return res.status(200).json(await r.json());
    }
    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      await put(name, JSON.stringify({ list: body.list || [], deleted: body.deleted || {} }), {
        access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', cacheControlMaxAge: 0
      });
      return res.status(200).json({ ok: true });
    }
    res.status(405).end();
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
};
