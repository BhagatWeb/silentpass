import React from 'react';
import { Lock, Check } from './Icons.js';

interface PrivacyHealthBadgeProps {
  networkId?: string;
  contractActive?: boolean;
}

export function PrivacyHealthBadge({ networkId = 'preview', contractActive = true }: PrivacyHealthBadgeProps) {
  return (
    <div className="panel" style={{ marginTop: 24 }}>
      <div className="panel__top">
        <span className="panel__n"><Lock size={12} /></span>
        <span className="panel__title">Kachina Privacy & Cryptographic Guarantees</span>
        <span className="panel__done tag ok">active</span>
      </div>
      <p className="panel__desc">
        SilentPass leverages Midnight's Kachina zero-knowledge computation model. Neither verifiers nor indexers can reconstruct your identity attributes from on-chain transactions.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 16 }}>
        <div style={{ padding: 12, background: 'rgba(255, 255, 255, 0.03)', borderRadius: 6, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ fontSize: '0.75rem', opacity: 0.6, textTransform: 'uppercase' }}>Zero-Knowledge Soundness</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: 4, color: '#4ade80' }}>100% Client-Side</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: 2 }}>Attributes never leave browser</div>
        </div>

        <div style={{ padding: 12, background: 'rgba(255, 255, 255, 0.03)', borderRadius: 6, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ fontSize: '0.75rem', opacity: 0.6, textTransform: 'uppercase' }}>Unlinkability Guarantee</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: 4, color: '#60a5fa' }}>Domain-Separated</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: 2 }}>BLAKE2b scoped nullifiers</div>
        </div>

        <div style={{ padding: 12, background: 'rgba(255, 255, 255, 0.03)', borderRadius: 6, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ fontSize: '0.75rem', opacity: 0.6, textTransform: 'uppercase' }}>Target Network</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: 4 }}>Midnight {networkId}</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: 2 }}>{contractActive ? 'Smart contract connected' : 'Awaiting connection'}</div>
        </div>

        <div style={{ padding: 12, background: 'rgba(255, 255, 255, 0.03)', borderRadius: 6, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ fontSize: '0.75rem', opacity: 0.6, textTransform: 'uppercase' }}>Curve Standard</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: 4 }}>Jubjub / BLS12-381</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: 2 }}>Compact v0.27 circuits</div>
        </div>
      </div>
    </div>
  );
}
