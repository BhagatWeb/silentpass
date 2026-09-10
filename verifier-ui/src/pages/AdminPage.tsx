import React, { useState, useCallback } from 'react';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { createUnprovenDeployTx, submitTxAsync } from '@midnight-ntwrk/midnight-js-contracts';
import { sampleSigningKey } from '@midnight-ntwrk/compact-runtime';
import { Contract, pureCircuits, witnesses } from 'silentpass-contract';
import { useWallet } from '../contexts/WalletContext.js';
import {
  Settings,
  Loader2,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Shield,
  RefreshCw,
  ArrowLeft,
  Key,
  Globe,
} from 'lucide-react';
import { toHex, randomBytes } from 'silentpass';
import { FALLBACK_CONTRACT_ADDRESS, getContractAddress } from '../config.js';

function getCompiledContract() {
  const assetUrl = new URL('/managed/passport', window.location.origin).toString();
  return CompiledContract.make('Passport', Contract).pipe(
    CompiledContract.withWitnesses(witnesses),
    CompiledContract.withCompiledFileAssets(assetUrl),
  ) as any;
}

export default function AdminPage() {
  const { session, isConnected, connect, networkId, disconnect } = useWallet();
  const [targetNetwork, setTargetNetwork] = useState<'preview' | 'preprod'>('preview');
  const [status, setStatus] = useState<'idle' | 'preparing' | 'signing' | 'submitting' | 'deployed' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deployedAddress, setDeployedAddress] = useState<string | null>(
    localStorage.getItem('DEPLOYED_CONTRACT_ADDRESS') || null,
  );
  const [copied, setCopied] = useState(false);
  const [adminSecretKeyHex, setAdminSecretKeyHex] = useState<string>(() => {
    return toHex(randomBytes(32));
  });

  const generateNewKey = () => {
    setAdminSecretKeyHex(toHex(randomBytes(32)));
  };

  const handleDeploy = useCallback(async () => {
    if (!session || !isConnected) return;
    setStatus('preparing');
    setErrorMsg(null);

    try {
      const compiledContract = getCompiledContract();

      // Convert or generate 32-byte issuer secret key
      let skBytes: Uint8Array;
      try {
        const cleanHex = adminSecretKeyHex.trim().replace(/^0x/, '');
        if (cleanHex.length !== 64) throw new Error('Secret key must be exactly 64 hex characters (32 bytes).');
        skBytes = new Uint8Array(cleanHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
      } catch {
        skBytes = randomBytes(32);
      }

      // Initial issuer public key derived from secret key
      const initialIssuerPk = pureCircuits.publicKey(skBytes);
      const constructorArgs = [initialIssuerPk];
      const initialPrivateState = { issuerSecretKey: skBytes };

      setStatus('signing');

      const deployTxData = await createUnprovenDeployTx(session.providers as any, {
        compiledContract,
        args: constructorArgs,
        initialPrivateState,
        signingKey: sampleSigningKey(),
      });

      const contractAddress = deployTxData.public.contractAddress;

      setStatus('submitting');

      await submitTxAsync(session.providers as any, {
        unprovenTx: deployTxData.private.unprovenTx,
      });

      // Persist private state so subsequent interactions can find it
      if (session.providers?.privateStateProvider) {
        try {
          await session.providers.privateStateProvider.set('PassportPrivateState', initialPrivateState);
        } catch {
          // ignore
        }
      }

      // Save to localStorage for instant dynamic pickup across the dApp
      setDeployedAddress(contractAddress);
      localStorage.setItem('DEPLOYED_CONTRACT_ADDRESS', contractAddress);
      localStorage.setItem('DEPLOYED_ISSUER_SECRET_KEY', toHex(skBytes));
      localStorage.setItem('DEPLOYED_NETWORK_ID', session.networkId || targetNetwork);

      setStatus('deployed');
    } catch (e: any) {
      console.error('Deployment failed:', e);
      setStatus('error');
      setErrorMsg(e?.message ?? String(e));
    }
  }, [session, isConnected, adminSecretKeyHex, targetNetwork]);

  const copyAddress = () => {
    if (!deployedAddress) return;
    navigator.clipboard.writeText(deployedAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetToCanonical = () => {
    localStorage.removeItem('DEPLOYED_CONTRACT_ADDRESS');
    setDeployedAddress(null);
  };

  const explorerBase =
    targetNetwork === 'preview' || session?.networkId === 'preview'
      ? 'https://preview.midnightexplorer.com/contracts'
      : 'https://preprod.midnight.network/explorer/contract';

  return (
    <div className="admin-wrapper" style={{ minHeight: '100vh', padding: '2rem 1rem', background: '#0a0a0f', color: '#e4e4e7' }}>
      <div style={{ maxWidth: '42rem', margin: '0 auto' }}>
        {/* Header navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <a
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#a1a1aa',
              textDecoration: 'none',
              fontSize: '0.875rem',
            }}
          >
            <ArrowLeft size={16} /> Back to SilentPass
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '0.75rem',
                padding: '0.25rem 0.625rem',
                borderRadius: '9999px',
                background: targetNetwork === 'preview' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                color: targetNetwork === 'preview' ? '#60a5fa' : '#c084fc',
                border: `1px solid ${targetNetwork === 'preview' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(168, 85, 247, 0.3)'}`,
              }}
            >
              <Globe size={12} /> {targetNetwork.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#f4f4f5' }}>
            Contract Deployment & Admin
          </h1>
          <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.925rem' }}>
            Deploy a new instance of the SilentPass Compact smart contract directly from your connected browser wallet (1AM / Lace).
          </p>
        </div>

        {/* Current Active Contract Banner */}
        <div
          style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            borderRadius: '0.5rem',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#71717a' }}>
              Active Contract Address
            </span>
            {localStorage.getItem('DEPLOYED_CONTRACT_ADDRESS') && (
              <button
                onClick={resetToCanonical}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f87171',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Reset to Default Preprod
              </button>
            )}
          </div>
          <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', wordBreak: 'break-all', color: '#cbd5e1' }}>
            {getContractAddress()}
          </div>
          <div style={{ marginTop: '0.25rem', fontSize: '0.7rem', color: '#64748b' }}>
            {localStorage.getItem('DEPLOYED_CONTRACT_ADDRESS')
              ? 'Using customized browser-deployed address (stored in localStorage)'
              : 'Using canonical Preprod deployment'}
          </div>
        </div>

        {/* Main Card */}
        <div
          style={{
            borderRadius: '0.75rem',
            background: '#12121a',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '1.75rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Settings size={20} color="#a855f7" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Deployer Panel</h2>
          </div>

          {!isConnected ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <Shield size={44} style={{ margin: '0 auto 1rem auto', color: '#71717a' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Connect Wallet to Deploy
              </h3>
              <p style={{ color: '#a1a1aa', fontSize: '0.875rem', marginBottom: '1.5rem', maxWidth: '24rem', margin: '0 auto 1.5rem auto' }}>
                Connect your 1AM or Lace wallet to sponsor gas and sign the deployment transaction.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  onClick={() => {
                    setTargetNetwork('preview');
                    connect('preview');
                  }}
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.75rem 1.75rem',
                    borderRadius: '0.5rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.9375rem',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
                  }}
                >
                  Connect on Preview Network (Recommended)
                </button>
                <button
                  onClick={() => {
                    setTargetNetwork('preprod');
                    connect('preprod');
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#a1a1aa',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '0.5rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  Connect on Preprod
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Connected Wallet Info */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '0.5rem',
                  marginBottom: '1.25rem',
                  fontSize: '0.8125rem',
                }}
              >
                <div>
                  <span style={{ color: '#71717a' }}>Connected: </span>
                  <span style={{ fontFamily: 'monospace', color: '#f4f4f5' }}>
                    {session?.unshieldedAddress.slice(0, 10)}...{session?.unshieldedAddress.slice(-8)}
                  </span>
                  <span style={{ marginLeft: '0.5rem', color: '#a855f7' }}>({session?.networkId})</span>
                </div>
                <button
                  onClick={disconnect}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#a1a1aa',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  Disconnect
                </button>
              </div>

              {/* Initial Issuer / Admin Key Configuration */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 500, color: '#d4d4d8', marginBottom: '0.5rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Key size={14} /> Initial Issuer Secret Key (32 bytes)
                  </span>
                  <button
                    onClick={generateNewKey}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#a855f7',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <RefreshCw size={12} /> Generate
                  </button>
                </label>
                <input
                  type="text"
                  value={adminSecretKeyHex}
                  onChange={(e) => setAdminSecretKeyHex(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    background: '#0a0a0f',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '0.375rem',
                    color: '#f4f4f5',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    boxSizing: 'border-box',
                  }}
                />
                <span style={{ fontSize: '0.7rem', color: '#71717a', marginTop: '0.25rem', display: 'block' }}>
                  The deployer automatically becomes the initial trusted Issuer Authority and Admin in <code>passport.compact</code>.
                </span>
              </div>

              {/* Action Buttons */}
              {status === 'idle' || status === 'error' ? (
                <button
                  onClick={handleDeploy}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    background: 'linear-gradient(135deg, #7928ca 0%, #ff0080 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: 600,
                    fontSize: '0.9375rem',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                  }}
                >
                  Deploy SilentPass Contract to {session?.networkId?.toUpperCase() || 'PREVIEW'}
                </button>
              ) : status === 'preparing' || status === 'signing' || status === 'submitting' ? (
                <button
                  disabled
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    background: 'rgba(121, 40, 202, 0.4)',
                    color: '#d4d4d8',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: 600,
                    fontSize: '0.9375rem',
                    cursor: 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Loader2 className="animate-spin" size={18} />
                  {status === 'preparing' && 'Constructing unproven deploy transaction...'}
                  {status === 'signing' && 'Please approve transaction in your wallet...'}
                  {status === 'submitting' && 'Submitting transaction to Midnight Network...'}
                </button>
              ) : (
                <div
                  style={{
                    padding: '1.25rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#a7f3d0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                    <CheckCircle size={20} color="#34d399" /> Successfully Deployed!
                  </div>
                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      padding: '0.625rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      wordBreak: 'break-all',
                    }}
                  >
                    <span>{deployedAddress}</span>
                    <button
                      onClick={copyAddress}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        marginLeft: '0.5rem',
                      }}
                      title="Copy Address"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                  {copied && (
                    <span style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '0.25rem', display: 'block' }}>
                      Copied address to clipboard!
                    </span>
                  )}
                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <a
                      href={`${explorerBase}/${deployedAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        fontSize: '0.8rem',
                        color: '#60a5fa',
                        textDecoration: 'none',
                      }}
                    >
                      View on Explorer <ExternalLink size={14} />
                    </a>
                    <a
                      href="/"
                      style={{
                        fontSize: '0.8rem',
                        color: '#a78bfa',
                        textDecoration: 'none',
                      }}
                    >
                      Return to Verification App →
                    </a>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {status === 'error' && errorMsg && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '0.5rem',
                    color: '#fca5a5',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    <AlertCircle size={18} color="#ef4444" /> Deployment Failed
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', fontFamily: 'monospace', wordBreak: 'break-word' }}>
                    {errorMsg}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
