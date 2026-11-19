const { put, get } = require('@vercel/blob');
const crypto = require('crypto');
module.exports = async (req, res) => {
  const pass = process.env.TEAM_PASSWORD;
  res.setHeader('Cache-Control', 'no-store');
  if (!pass) return res.status(500).json({ error: 'TEAM_PASSWORD not set' });
  if (req.headers['x-team-pass'] !== pass) return res.status(401).json({ error: 'wrong password' });
  const name = 'els-' + crypto.createHash('sha256').update(pass + ':letters').digest('hex').slice(0, 24) + '.json';
  try {
    if (req.method === 'GET') {
      const r = await get(name, { access: 'private', useCache: false });
      if (!r || r.statusCode !== 200) return res.status(200).json({ list: [], deleted: {} });
      const txt = await new Response(r.stream).text();
      return res.status(200).json(JSON.parse(txt));
    }
    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      await put(name, JSON.stringify({ list: body.list || [], deleted: body.deleted || {} }), {
        access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', cacheControlMaxAge: 0
      });
      return res.status(200).json({ ok: true });
    }
    res.status(405).end();
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
};
