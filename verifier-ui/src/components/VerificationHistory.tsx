import React, { useState, useEffect } from 'react';
import { contractUrl, short } from '../lib/format.js';
import { Check, Lock } from './Icons.js';

export interface VerificationRecord {
  id: string;
  type: 'age_18' | 'age_21' | 'residency' | 'accredited' | 'composite';
  timestamp: string;
  scope: string;
  nullifier: string;
  txHash?: string;
  status: 'verified' | 'tampered' | 'pending';
  disclosed: string;
}

const STORAGE_KEY = 'silentpass_proof_history';

export function VerificationHistory({ activeTxHash }: { activeTxHash?: string }) {
  const [records, setRecords] = useState<VerificationRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    // Default sample entries if fresh
    return [
      {
        id: 'rec-sample-1',
        type: 'age_18',
        timestamp: new Date(Date.now() - 3600000).toLocaleTimeString(),
        scope: 'demo.silentpass.id',
        nullifier: 'c0a8019b...f4e2',
        status: 'verified',
        disclosed: 'Predicate: age >= 18 (DOB hidden)',
      },
    ];
  });

  useEffect(() => {
    if (activeTxHash) {
      const newRec: VerificationRecord = {
        id: 'rec-' + Date.now(),
        type: 'composite',
        timestamp: new Date().toLocaleTimeString(),
        scope: 'demo.silentpass.id',
        nullifier: short(activeTxHash, 8),
        txHash: activeTxHash,
        status: 'verified',
        disclosed: 'Zero-Knowledge Proof verified on Midnight',
      };
      setRecords((prev) => {
        const updated = [newRec, ...prev.slice(0, 9)];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    }
  }, [activeTxHash]);

  const clearHistory = () => {
    setRecords([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const exportReceipts = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `silentpass-proof-audit-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="panel" style={{ marginTop: 24 }}>
      <div className="panel__top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="panel__n">04</span>
          <span className="panel__title">Proof Audit Log & Receipts</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn--secondary btn--sm" onClick={exportReceipts} disabled={records.length === 0}>
            Export Audit JSON
          </button>
          <button className="btn btn--secondary btn--sm" onClick={clearHistory} disabled={records.length === 0}>
            Clear
          </button>
        </div>
      </div>
      <p className="panel__desc">
        Local proof receipt ledger. Every zero-knowledge verification generates a cryptographic receipt containing the scoped nullifier and explorer transaction reference.
      </p>

      {records.length === 0 ? (
        <div className="log__empty" style={{ padding: '24px 0' }}>No verification proofs logged in this session yet.</div>
      ) : (
        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color, #333)', textAlign: 'left', opacity: 0.7 }}>
                <th style={{ padding: '8px 4px' }}>Time</th>
                <th style={{ padding: '8px 4px' }}>Circuit Type</th>
                <th style={{ padding: '8px 4px' }}>Scoped Nullifier</th>
                <th style={{ padding: '8px 4px' }}>Status</th>
                <th style={{ padding: '8px 4px' }}>Explorer Tx</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color, #222)' }}>
                  <td style={{ padding: '8px 4px', fontFamily: 'monospace' }}>{r.timestamp}</td>
                  <td style={{ padding: '8px 4px' }}>
                    <span className="tag" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                      {r.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '8px 4px', fontFamily: 'monospace', opacity: 0.8 }}>
                    {r.nullifier}
                  </td>
                  <td style={{ padding: '8px 4px' }}>
                    <span className={`tag ${r.status === 'verified' ? 'ok' : 'alert'}`}>
                      {r.status === 'verified' ? <Check size={10} style={{ marginRight: 4 }} /> : null}
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px 4px' }}>
                    {r.txHash ? (
                      <a href={`https://preview.midnightexplorer.com/tx/${r.txHash}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>
                        {short(r.txHash, 8)}
                      </a>
                    ) : (
                      <span style={{ opacity: 0.5 }}>Local ZK</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
