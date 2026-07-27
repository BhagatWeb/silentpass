import { short } from '../lib/format.js';
import type { SilentPassController } from '../hooks/useSilentPass.js';

export function Nav({ ctl }: { ctl: SilentPassController }) {
  const { connected, session, connect, disconnect, busy } = ctl;
  return (
    <header className="nav">
      <div className="nav__in wrap">
        <a className="brand" href="#top" aria-label="SilentPass home">
          <span className="brand__word">SilentPass</span>
        </a>
        <nav className="nav__links" aria-label="Primary">
          <a href="#try">Try it</a>
          <a href="#how">How it works</a>
          <a href="#why">Why Midnight</a>
          <a href="#install">Install</a>
          <a href="/docs">Docs</a>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {connected && session ? (
            <>
              <span className="wchip" title={session.shieldedCoinPublicKey}>
                <span className="live" />
                {short(session.shieldedCoinPublicKey, 5)} · {session.networkId}
              </span>
              <button
                id="btn-disconnect-wallet"
                className="btn btn--sm"
                style={{ opacity: 0.7 }}
                onClick={disconnect}
                title="Disconnect wallet"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button className="btn btn--primary btn--sm" id="btn-connect-wallet" onClick={connect} disabled={busy !== null}>
              {busy === 'connect' ? <span className="spinner" /> : null}
              Connect wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
