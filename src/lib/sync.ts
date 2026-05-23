// Cross-device sync for personal notes + canonical-callout overrides.
//
// The deployed app is public, so /api/sync is gated by a single passphrase
// you (the owner) set as OWNER_PASSPHRASE in Vercel. Each device caches a
// copy of the passphrase in localStorage under SYNC_TOKEN_KEY so the user
// only types it once per device.
//
// Wire model:
//   • On mount: if a token is cached, GET /api/sync once. If it returns
//     200 and the remote payload is newer/non-empty, apply it to the store.
//   • While running: subscribe to userNotes + overrides. Whenever they
//     change, schedule a debounced PUT (1500 ms) with the full current
//     state.
//   • Last-write-wins. Single-owner scope; concurrent writes from two
//     devices are rare and tolerated.

import { useEffect, useRef } from 'react';
import { useGraphStore, type NodeOverrides } from '../store/useGraphStore';

const SYNC_TOKEN_KEY = 'godview.sync.token.v1';
const SYNC_LAST_AT_KEY = 'godview.sync.lastAt.v1';
const DEBOUNCE_MS = 1500;

export type SyncStatus =
  | 'idle' // no token configured
  | 'fetching' // initial GET in flight
  | 'syncing' // PUT in flight
  | 'synced' // last op succeeded, currently quiet
  | 'error'; // last op failed; details in last error

export interface SyncState {
  status: SyncStatus;
  lastError: string | null;
  lastSyncedAt: number | null;
}

// ── token cache ────────────────────────────────────────────────────────────
export function getCachedToken(): string | null {
  try {
    return localStorage.getItem(SYNC_TOKEN_KEY);
  } catch {
    return null;
  }
}
export function setCachedToken(token: string | null) {
  try {
    if (token) localStorage.setItem(SYNC_TOKEN_KEY, token);
    else localStorage.removeItem(SYNC_TOKEN_KEY);
  } catch {}
}
function rememberLastSyncAt(t: number) {
  try {
    localStorage.setItem(SYNC_LAST_AT_KEY, String(t));
  } catch {}
}

// ── low-level network ──────────────────────────────────────────────────────
interface RemotePayload {
  notes: Record<string, string>;
  overrides: Record<string, NodeOverrides>;
  updatedAt: number;
}

// Read the response body on a non-OK status and turn it into a readable
// message — without this the user just sees 'Sync GET 500' with no clue
// whether the server hit KV trouble, a misconfigured env var, etc.
async function explain(res: Response, verb: string): Promise<string> {
  if (res.status === 401) return 'Wrong passphrase';
  let detail = '';
  try {
    const body = await res.json();
    if (body && typeof body === 'object') {
      const err = (body as { error?: string }).error;
      const sub = (body as { detail?: string }).detail;
      if (err) detail = err;
      if (sub) detail = detail ? `${detail}: ${sub}` : sub;
    }
  } catch {}
  if (!detail) detail = res.statusText || 'Sync error';
  return `${verb} ${res.status} — ${detail}`;
}

export async function fetchRemote(token: string): Promise<RemotePayload> {
  const res = await fetch('/api/sync', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await explain(res, 'GET'));
  return res.json();
}

export async function pushRemote(
  token: string,
  notes: Record<string, string>,
  overrides: Record<string, NodeOverrides>,
): Promise<RemotePayload> {
  const res = await fetch('/api/sync', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ notes, overrides }),
  });
  if (!res.ok) throw new Error(await explain(res, 'PUT'));
  return res.json();
}

// Validate a passphrase by trying a fetch. Doesn't apply the payload.
export async function verifyToken(token: string): Promise<boolean> {
  try {
    await fetchRemote(token);
    return true;
  } catch (e) {
    if ((e as Error).message === 'Wrong passphrase') return false;
    throw e;
  }
}

// ── React hook ─────────────────────────────────────────────────────────────
export function useSyncEngine(
  setSync: (next: Partial<SyncState>) => void,
): void {
  const userNotes = useGraphStore((s) => s.userNotes);
  const overrides = useGraphStore((s) => s.overrides);
  const applyRemoteStore = useGraphStore((s) => s.applyRemoteStore);

  const hydrated = useRef(false);
  const pendingTimer = useRef<number | null>(null);

  // 1) On mount (and when token changes via storage event), hydrate from
  //    the server once. Skip if no token cached.
  useEffect(() => {
    const tok = getCachedToken();
    if (!tok) {
      setSync({ status: 'idle' });
      return;
    }
    let cancelled = false;
    setSync({ status: 'fetching', lastError: null });
    fetchRemote(tok)
      .then((remote) => {
        if (cancelled) return;
        // Only overwrite local if the remote actually has data — first-ever
        // user on a fresh KV would otherwise clobber whatever they wrote
        // locally before configuring sync.
        const remoteHasData =
          Object.keys(remote.notes ?? {}).length > 0 ||
          Object.keys(remote.overrides ?? {}).length > 0;
        if (remoteHasData) {
          applyRemoteStore({
            notes: remote.notes ?? {},
            overrides: remote.overrides ?? {},
          });
        }
        hydrated.current = true;
        rememberLastSyncAt(remote.updatedAt ?? Date.now());
        setSync({
          status: 'synced',
          lastSyncedAt: remote.updatedAt ?? Date.now(),
          lastError: null,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        // Don't blow away the token on a transient error; only an explicit
        // 401 would tell us the passphrase is wrong. But for clarity, surface
        // it.
        setSync({
          status: 'error',
          lastError: (err as Error).message || 'Sync error',
        });
        if ((err as Error).message === 'Wrong passphrase') {
          setCachedToken(null);
          setSync({ status: 'idle' });
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) On any change to notes/overrides after hydration, debounced PUT.
  useEffect(() => {
    if (!hydrated.current) return;
    const tok = getCachedToken();
    if (!tok) return;

    if (pendingTimer.current != null) {
      window.clearTimeout(pendingTimer.current);
    }
    pendingTimer.current = window.setTimeout(() => {
      const notesObj: Record<string, string> = {};
      for (const [k, v] of userNotes) notesObj[k] = v;
      const ovObj: Record<string, NodeOverrides> = {};
      for (const [k, v] of overrides) ovObj[k] = v;

      setSync({ status: 'syncing' });
      pushRemote(tok, notesObj, ovObj)
        .then((res) => {
          rememberLastSyncAt(res.updatedAt ?? Date.now());
          setSync({
            status: 'synced',
            lastSyncedAt: res.updatedAt ?? Date.now(),
            lastError: null,
          });
        })
        .catch((err) => {
          setSync({
            status: 'error',
            lastError: (err as Error).message || 'Sync error',
          });
          if ((err as Error).message === 'Wrong passphrase') {
            setCachedToken(null);
            setSync({ status: 'idle' });
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      if (pendingTimer.current != null) {
        window.clearTimeout(pendingTimer.current);
        pendingTimer.current = null;
      }
    };
  }, [userNotes, overrides, setSync]);
}
