import { useCallback, useMemo, useState } from 'react';
import {
  Guest,
  SilentPassAPI,
  Venue,
  type AgeVerificationResult,
  type PassportProviders,
} from 'silentpass';

export type SilentPassStatus =
  | 'idle'
  | 'connecting'
  | 'ready'
  | 'proving'
  | 'verified'
  | 'rejected'
  | 'error';

export interface UseSilentPassOptions {
  /** Deployed passport contract address (hex). */
  contractAddress: string;
  /**
   * Builds the Midnight.js providers around the user's connected wallet.
   * Supply your app's wallet wiring (see the SDK docs / example). The widget
   * stays wallet-agnostic: Lace, 1AM, or any DApp-Connector-4.x wallet.
   */
  connect: () => Promise<PassportProviders>;
  /** Age threshold to prove. Default 18. */
  threshold?: number;
  onVerified?: (result: AgeVerificationResult & { sessionId: string }) => void;
  onError?: (error: Error) => void;
}

export interface UseSilentPass {
  status: SilentPassStatus;
  error: string | null;
  result: (AgeVerificationResult & { sessionId: string }) | null;
  /** True once a wallet is connected and the contract joined. */
  isReady: boolean;
  /** Connect the wallet + join the contract. Safe to call repeatedly. */
  ready: () => Promise<void>;
  /** Prove age ≥ threshold, then read back the verified flag. */
  proveAgeOver: (threshold?: number) => Promise<AgeVerificationResult & { sessionId: string }>;
  reset: () => void;
}

/**
 * Headless hook powering an age-gate. Handles connect → prove → verify against
 * a deployed zkPassport contract on Midnight. The user's birthdate never leaves
 * their machine; your dApp receives only a `verified` boolean (+ the threshold).
 */
export function useSilentPass(options: UseSilentPassOptions): UseSilentPass {
  const { contractAddress, connect, threshold = 18, onVerified, onError } = options;

  const [status, setStatus] = useState<SilentPassStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<(AgeVerificationResult & { sessionId: string }) | null>(null);
  const [api, setApi] = useState<SilentPassAPI | null>(null);

  const fail = useCallback(
    (e: unknown) => {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err.message);
      setStatus('error');
      onError?.(err);
      throw err;
    },
    [onError],
  );

  const ready = useCallback(async () => {
    if (api) return;
    setStatus('connecting');
    setError(null);
    try {
      const providers = await connect();
      const joined = await SilentPassAPI.join(providers, contractAddress);
      setApi(joined);
      setStatus('ready');
    } catch (e) {
      fail(e);
    }
  }, [api, connect, contractAddress, fail]);

  const proveAgeOver = useCallback(
    async (t: number = threshold) => {
      setStatus('proving');
      setError(null);
      try {
        let current = api;
        if (!current) {
          const providers = await connect();
          current = await SilentPassAPI.join(providers, contractAddress);
          setApi(current);
        }
        const guest = new Guest(current);
        const venue = new Venue(current.providers.publicDataProvider, contractAddress);
        const sessionId = verifier.newSessionId();
        await holder.proveAgeOver(t, { sessionId });
        const verification = await verifier.verifyAgeOver(sessionId, t);
        const full = { ...verification, sessionId };
        setResult(full);
        setStatus(verification.verified ? 'verified' : 'rejected');
        if (verification.verified) onVerified?.(full);
        return full;
      } catch (e) {
        return fail(e);
      }
    },
    [api, connect, contractAddress, threshold, onVerified, fail],
  );

  const reset = useCallback(() => {
    setStatus(api ? 'ready' : 'idle');
    setError(null);
    setResult(null);
  }, [api]);

  return useMemo(
    () => ({
      status,
      error,
      result,
      isReady: api !== null,
      ready,
      proveAgeOver,
      reset,
    }),
    [status, error, result, api, ready, proveAgeOver, reset],
  );
}
