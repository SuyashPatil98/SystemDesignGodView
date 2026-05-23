import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Cloud, CloudOff, Loader2, RefreshCcw, X } from 'lucide-react';
import {
  getCachedToken,
  setCachedToken,
  useSyncEngine,
  verifyToken,
  type SyncState,
} from '../lib/sync';
import { useGraphStore } from '../store/useGraphStore';
import { fetchRemote } from '../lib/sync';

// Top-bar affordance for cross-device sync. Shows current state and lets
// the user enter / change / clear the passphrase. Lives in the top bar's
// right cluster on desktop and the right header slot on mobile.

const ACCENT = 'var(--mint)';
const ACCENT_DIM = 'var(--mint-dim)';

export default function SyncChip() {
  const [sync, setSyncState] = useState<SyncState>({
    status: getCachedToken() ? 'fetching' : 'idle',
    lastError: null,
    lastSyncedAt: null,
  });
  const [modalOpen, setModalOpen] = useState(false);

  const setSync = (next: Partial<SyncState>) =>
    setSyncState((prev) => ({ ...prev, ...next }));

  useSyncEngine(setSync);

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        aria-label={
          sync.status === 'idle'
            ? 'Enable cross-device sync'
            : 'Sync settings'
        }
        title={statusTitle(sync)}
        className="flex items-center gap-1.5 font-mono uppercase transition-colors"
        style={{
          fontSize: 9,
          letterSpacing: '0.22em',
          padding: '6px 10px',
          color: sync.status === 'error' ? '#fb7185' : ACCENT,
          border: `1px solid ${
            sync.status === 'error' ? 'rgba(251,113,133,0.5)' : ACCENT_DIM
          }`,
          background: 'transparent',
          cursor: 'pointer',
        }}
      >
        <StatusIcon status={sync.status} />
        <span className="hidden md:inline">{statusLabel(sync.status)}</span>
      </button>

      {modalOpen && (
        <SyncModal
          sync={sync}
          setSync={setSync}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

function StatusIcon({ status }: { status: SyncState['status'] }) {
  if (status === 'fetching' || status === 'syncing')
    return (
      <Loader2
        size={11}
        style={{ animation: 'spin 1s linear infinite' }}
      />
    );
  if (status === 'idle') return <CloudOff size={11} />;
  if (status === 'error') return <CloudOff size={11} />;
  return <Cloud size={11} />;
}

function statusLabel(status: SyncState['status']): string {
  switch (status) {
    case 'idle':
      return 'Sync off';
    case 'fetching':
      return 'Loading';
    case 'syncing':
      return 'Saving';
    case 'synced':
      return 'Synced';
    case 'error':
      return 'Sync error';
  }
}

function statusTitle(sync: SyncState): string {
  if (sync.status === 'idle')
    return 'Click to set up cross-device sync';
  if (sync.status === 'error')
    return `Sync error: ${sync.lastError ?? 'unknown'}`;
  if (sync.lastSyncedAt) {
    return `Last synced ${new Date(sync.lastSyncedAt).toLocaleString()}`;
  }
  return statusLabel(sync.status);
}

// ── modal ──────────────────────────────────────────────────────────────────
function SyncModal({
  sync,
  setSync,
  onClose,
}: {
  sync: SyncState;
  setSync: (next: Partial<SyncState>) => void;
  onClose: () => void;
}) {
  const cached = getCachedToken();
  const [passphrase, setPassphrase] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const applyRemoteStore = useGraphStore((s) => s.applyRemoteStore);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const onSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = passphrase.trim();
    if (!trimmed) return;
    setVerifying(true);
    setError(null);
    try {
      const ok = await verifyToken(trimmed);
      if (!ok) {
        setError('Wrong passphrase');
        setVerifying(false);
        return;
      }
      setCachedToken(trimmed);
      // Pull remote once so the user sees their data immediately.
      try {
        const remote = await fetchRemote(trimmed);
        const remoteHasData =
          Object.keys(remote.notes ?? {}).length > 0 ||
          Object.keys(remote.overrides ?? {}).length > 0;
        if (remoteHasData) {
          applyRemoteStore({
            notes: remote.notes ?? {},
            overrides: remote.overrides ?? {},
          });
        }
        setSync({
          status: 'synced',
          lastError: null,
          lastSyncedAt: remote.updatedAt ?? Date.now(),
        });
      } catch (err) {
        setSync({
          status: 'error',
          lastError: (err as Error).message,
        });
      }
      setVerifying(false);
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Sync error');
      setVerifying(false);
    }
  };

  const onDisconnect = () => {
    setCachedToken(null);
    setSync({ status: 'idle', lastError: null, lastSyncedAt: null });
    onClose();
  };

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(6px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex flex-col gap-4 p-6"
        style={{
          width: 'min(440px, 92vw)',
          background: 'rgba(8,10,12,0.96)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-baseline justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span
              className="font-mono uppercase"
              style={{
                fontSize: 9,
                letterSpacing: '0.28em',
                color: ACCENT_DIM,
              }}
            >
              .S1
            </span>
            <span
              className="font-mono uppercase"
              style={{
                fontSize: 11,
                letterSpacing: '0.32em',
                color: ACCENT,
              }}
            >
              Cross-device sync
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="transition-colors"
            style={{
              color: 'rgba(255,255,255,0.6)',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            <X size={14} />
          </button>
        </div>

        <p
          className="font-serif italic"
          style={{
            fontSize: 13,
            lineHeight: 1.5,
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          {cached
            ? 'Sync is on for this device. Notes and callout edits save to a private store and load on every other device you sign in from.'
            : 'Type the passphrase you set as OWNER_PASSPHRASE in Vercel. Each device you enter it on will share notes and callout edits.'}
        </p>

        {!cached ? (
          <form
            onSubmit={onSubmit}
            className="flex flex-col gap-3"
            autoComplete="off"
          >
            {/* Plain text input with CSS-masked glyphs. type="password"
                used to trigger Edge's 'Requirements & constraints' popup
                and the 1Password / LastPass auto-suggest tooltips over
                the field. Browsers reserve those for actual password
                inputs, so by going type="text" with -webkit-text-security
                masking + a wall of opt-out data-* attributes, the field
                stays visually private without inviting any manager UI. */}
            <input
              ref={inputRef}
              type="text"
              name="godview-owner-key"
              id="godview-owner-key"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-form-type="other"
              data-1p-ignore="true"
              data-lpignore="true"
              data-bwignore="true"
              data-ms-editor="false"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Owner passphrase"
              className="font-mono bg-transparent outline-none"
              style={{
                fontSize: 12,
                padding: '10px 12px',
                color: '#fff',
                border: `1px solid ${error ? '#fb7185' : ACCENT_DIM}`,
                background: 'rgba(94,234,183,0.04)',
                // Mask the characters as dots without using type=password.
                // Works in Chromium and Safari; Firefox falls back to
                // plain text which is acceptable for a personal app.
                WebkitTextSecurity: 'disc',
                textSecurity: 'disc',
                letterSpacing: '0.12em',
              } as CSSProperties}
            />
            {error && (
              <div
                className="font-mono uppercase"
                style={{
                  fontSize: 9,
                  letterSpacing: '0.22em',
                  color: '#fb7185',
                }}
              >
                {error}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={verifying || !passphrase.trim()}
                className="font-mono uppercase"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  padding: '8px 14px',
                  color: ACCENT,
                  border: `1px solid ${ACCENT}`,
                  background: 'rgba(94,234,183,0.08)',
                  cursor: verifying ? 'wait' : 'pointer',
                  opacity: verifying || !passphrase.trim() ? 0.6 : 1,
                }}
              >
                {verifying ? 'Verifying…' : 'Connect'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="font-mono uppercase"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  padding: '8px 14px',
                  color: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-3">
            <div
              className="flex items-baseline justify-between font-mono"
              style={{ fontSize: 10, letterSpacing: '0.18em' }}
            >
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                STATUS
              </span>
              <span style={{ color: ACCENT }}>
                {statusLabel(sync.status).toUpperCase()}
              </span>
            </div>
            {sync.lastSyncedAt && (
              <div
                className="flex items-baseline justify-between font-mono"
                style={{ fontSize: 10, letterSpacing: '0.18em' }}
              >
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                  LAST SYNCED
                </span>
                <span style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {new Date(sync.lastSyncedAt).toLocaleString()}
                </span>
              </div>
            )}
            {sync.lastError && (
              <div
                className="font-mono uppercase"
                style={{
                  fontSize: 9,
                  letterSpacing: '0.22em',
                  color: '#fb7185',
                }}
              >
                {sync.lastError}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={async () => {
                  setSync({ status: 'fetching', lastError: null });
                  try {
                    const remote = await fetchRemote(cached);
                    applyRemoteStore({
                      notes: remote.notes ?? {},
                      overrides: remote.overrides ?? {},
                    });
                    setSync({
                      status: 'synced',
                      lastSyncedAt: remote.updatedAt ?? Date.now(),
                    });
                  } catch (err) {
                    setSync({
                      status: 'error',
                      lastError: (err as Error).message,
                    });
                  }
                }}
                className="flex items-center gap-1.5 font-mono uppercase"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  padding: '8px 12px',
                  color: ACCENT,
                  border: `1px solid ${ACCENT_DIM}`,
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                <RefreshCcw size={11} /> Pull now
              </button>
              <button
                type="button"
                onClick={onDisconnect}
                className="font-mono uppercase ml-auto"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  padding: '8px 12px',
                  color: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                Disconnect this device
              </button>
            </div>
          </div>
        )}

        <p
          className="font-mono uppercase"
          style={{
            fontSize: 8,
            letterSpacing: '0.22em',
            color: 'rgba(255,255,255,0.32)',
            lineHeight: 1.6,
            marginTop: 4,
          }}
        >
          Stored only in your browser + a private Vercel KV bucket.
          Nothing leaves your control.
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}
