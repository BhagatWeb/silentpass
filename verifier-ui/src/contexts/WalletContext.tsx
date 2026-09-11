import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createConnectedSession, type ConnectedSession } from '../lib/midnight.js';

export interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  walletType: '1am' | 'lace' | null;
  isConnecting: boolean;
  walletStatus: 'checking' | 'detected' | 'not-found';
  session: ConnectedSession | null;
  networkId: string;
  connect: (network?: string) => Promise<ConnectedSession | undefined>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [walletType, setWalletType] = useState<'1am' | 'lace' | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletStatus, setWalletStatus] = useState<'checking' | 'detected' | 'not-found'>('checking');
  const [session, setSession] = useState<ConnectedSession | null>(null);
  const [networkId, setNetworkIdState] = useState<string>('preview');
  const connectingRef = useRef(false);

  // Poll for wallet injection
  useEffect(() => {
    const startedAt = Date.now();
    const id = setInterval(() => {
      const w1am = (window as any).midnight?.['1am'];
      const wLace = (window as any).midnight?.mnLace ?? (window as any).midnight?.lace;
      if (w1am) {
        setWalletType('1am');
        setWalletStatus('detected');
        clearInterval(id);
        return;
      }
      if (wLace) {
        setWalletType('lace');
        setWalletStatus('detected');
        clearInterval(id);
        return;
      }
      // Check any compatible wallet in window.midnight
      if ((window as any).midnight && Object.keys((window as any).midnight).length > 0) {
        setWalletType('lace');
        setWalletStatus('detected');
        clearInterval(id);
        return;
      }
      if (Date.now() - startedAt >= 4000) {
        setWalletStatus('not-found');
        clearInterval(id);
      }
    }, 200);
    return () => clearInterval(id);
  }, []);

  const connect = useCallback(async (targetNetwork?: string) => {
    if (connectingRef.current) return;
    connectingRef.current = true;
    setIsConnecting(true);

    try {
      const midnightObj = (window as any).midnight;
      const wallet =
        midnightObj?.['1am'] ??
        midnightObj?.mnLace ??
        midnightObj?.lace ??
        (midnightObj ? Object.values(midnightObj)[0] : null);

      if (!wallet) {
        throw new Error('No Midnight wallet found. Please install the 1AM or Lace browser extension.');
      }

      let api: any;
      let requested = targetNetwork ?? networkId ?? 'preview';

      try {
        api = await wallet.connect(requested);
      } catch (err: any) {
        // If wallet rejects with network mismatch (e.g. "Wallet is on preprod, requested preview"),
        // parse the actual network the wallet is on and auto-connect to it!
        const match = err?.message?.match(/Wallet is on (\w+)/i);
        if (match && match[1]) {
          const actualNetwork = match[1].toLowerCase();
          console.info(`Auto-negotiating with wallet active network: ${actualNetwork}`);
          api = await wallet.connect(actualNetwork);
          requested = actualNetwork;
        } else {
          throw err;
        }
      }

      const sess = await createConnectedSession(api);
      const activeNet = sess.networkId || requested || 'preview';
      setNetworkIdState(activeNet);
      setSession(sess);
      setAddress(sess.unshieldedAddress);
      setIsConnected(true);
      return sess;
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      throw err;
    } finally {
      connectingRef.current = false;
      setIsConnecting(false);
    }
  }, [networkId]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setIsConnected(false);
    setSession(null);
    setWalletStatus('detected');
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected,
        walletType,
        isConnecting,
        walletStatus,
        session,
        networkId,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextType {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return ctx;
}
