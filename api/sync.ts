import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

// Single-owner cross-device sync for personal notes + canonical-callout
// overrides. The deployed site is public, so this endpoint is gated by a
// shared passphrase the owner sets as OWNER_PASSPHRASE in Vercel env vars;
// anyone without it falls back to localStorage like before.
//
// Vercel KV holds ONE blob under godview:owner:store. Last-write-wins —
// the personal scope means we don't bother with merge/CRDT machinery.
//
// Required Vercel env vars:
//   OWNER_PASSPHRASE       — the secret you type once per device
//   KV_REST_API_URL        — auto-injected by Vercel KV
//   KV_REST_API_TOKEN      — auto-injected by Vercel KV

const KEY = 'godview:owner:store';

interface StorePayload {
  notes: Record<string, string>;
  overrides: Record<string, Record<string, string>>;
  updatedAt: number;
}

function authorized(req: VercelRequest): boolean {
  const expected = process.env.OWNER_PASSPHRASE;
  if (!expected) return false; // refuse if not configured
  const auth = req.headers.authorization;
  if (!auth) return false;
  const m = /^Bearer\s+(.+)$/i.exec(auth);
  if (!m) return false;
  // Constant-time-ish compare — Node's strings aren't constant-time but
  // for a personal passphrase + low traffic it's fine.
  return m[1] === expected;
}

function sanitizeNotes(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === 'string' && v.trim()) out[k] = v;
  }
  return out;
}

function sanitizeOverrides(
  raw: unknown,
): Record<string, Record<string, string>> {
  if (!raw || typeof raw !== 'object') return {};
  const fields = [
    'whyItMatters',
    'mentalModel',
    'tradeoffs',
    'failureModes',
    'metricsToMonitor',
  ];
  const out: Record<string, Record<string, string>> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!v || typeof v !== 'object') continue;
    const ov: Record<string, string> = {};
    for (const f of fields) {
      const val = (v as Record<string, unknown>)[f];
      if (typeof val === 'string' && val.trim()) ov[f] = val;
    }
    if (Object.keys(ov).length > 0) out[k] = ov;
  }
  return out;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Permissive CORS — same-origin in production, but the deployed site
  // sometimes loads under preview URLs too. Mirror origin in.
  const origin = req.headers.origin ?? '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type',
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (!authorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Sanity-check KV credentials before touching the SDK — without this
  // missing env vars surface as an opaque crash inside @vercel/kv.
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return res.status(500).json({
      error: 'KV not configured',
      detail:
        'KV_REST_API_URL or KV_REST_API_TOKEN is missing. Connect an Upstash Redis store to the project under Vercel → Storage and redeploy.',
    });
  }

  if (req.method === 'GET') {
    try {
      const data = await kv.get<StorePayload>(KEY);
      return res.status(200).json(
        data ?? { notes: {}, overrides: {}, updatedAt: 0 },
      );
    } catch (err) {
      return res.status(500).json({
        error: 'KV read failed',
        detail: (err as Error)?.message,
      });
    }
  }

  if (req.method === 'PUT') {
    let body: unknown = req.body;
    // Vercel's parser may hand us a string if content-type is off.
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
    }
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Body must be an object' });
    }
    const b = body as Record<string, unknown>;
    const payload: StorePayload = {
      notes: sanitizeNotes(b.notes),
      overrides: sanitizeOverrides(b.overrides),
      updatedAt: Date.now(),
    };
    try {
      await kv.set(KEY, payload);
      return res.status(200).json(payload);
    } catch (err) {
      return res.status(500).json({
        error: 'KV write failed',
        detail: (err as Error)?.message,
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
