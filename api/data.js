import { get, put } from '@vercel/blob';
import { timingSafeEqual, createHash } from 'node:crypto';

const BOARDS = ['sales', 'renewals', 'apartments'];
const NUM_FIELDS = ['t', 'm', 'b', 'c', 'x', 's'];
const path = (board) => `race/${board}.json`;

function isAdmin(password) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof password !== 'string') return false;
  const h = (v) => createHash('sha256').update(v).digest();
  return timingSafeEqual(h(password), h(expected));
}

// שומרים רק שדות מוכרים, ומנקים תווים שיכולים להפוך ל-HTML בדף
function cleanRows(rows) {
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > 2000) return null;
  const out = [];
  for (const r of rows) {
    if (!r || typeof r.n !== 'string') return null;
    const row = { n: r.n.replace(/[<>&]/g, '').replace(/"/g, '״').trim().slice(0, 80) };
    if (!row.n) return null;
    for (const f of NUM_FIELDS) {
      if (r[f] === undefined) continue;
      if (typeof r[f] !== 'number' || !Number.isFinite(r[f])) return null;
      row[f] = r[f];
    }
    if (typeof row.s !== 'number') return null;
    if (r.team === 'digital' || r.team === 'call') row.team = r.team;
    out.push(row);
  }
  return out;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') {
      const board = String(req.query.board || '');
      if (!BOARDS.includes(board)) return res.status(400).json({ error: 'unknown board' });
      const result = await get(path(board), { access: 'private', useCache: false });
      if (!result || result.statusCode !== 200) return res.status(200).json({ data: null });
      const saved = JSON.parse(await new Response(result.stream).text());
      return res.status(200).json(saved);
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      if (!isAdmin(body.password)) return res.status(401).json({ error: 'unauthorized' });
      if (body.check) return res.status(200).json({ ok: true });

      if (!BOARDS.includes(body.board)) return res.status(400).json({ error: 'unknown board' });
      if (!/^\d{4}-\d{2}-\d{2}$/.test(body.dataDate || '')) return res.status(400).json({ error: 'bad date' });
      const data = cleanRows(body.data);
      if (!data) return res.status(400).json({ error: 'bad data' });

      await put(
        path(body.board),
        JSON.stringify({ data, dataDate: body.dataDate, updatedAt: new Date().toISOString() }),
        { access: 'private', allowOverwrite: true, addRandomSuffix: false, contentType: 'application/json' }
      );
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
}
