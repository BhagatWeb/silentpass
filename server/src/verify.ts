/*
 * Read-only verification gateway. Decodes the passport contract's public
 * ledger state (via the compiled contract + indexer) so non-JS clients — the
 * Python package, the website demo, any backend — can consume a `verified ✓`
 * without running Midnight.js themselves.
 */
import {
  Verifier,
  Venue,
  newSessionId,
  bindSessionId,
  verifySessionBinding,
  type SessionBinding,
} from 'silentpass';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

let networkReady = false;
const ensureNetwork = () => {
  if (!networkReady) {
    setNetworkId('preprod');
    networkReady = true;
  }
};

export const makeSessionId = (): string => newSessionId();

/**
 * Creates a cryptographically bound session ID to prevent cross-context replay/acceptance.
 */
export async function makeBoundSessionId(
  venue: string,
  policy: string,
  challenge?: string,
): Promise<{ sessionId: string; venue: string; policy: string; challenge: string }> {
  return bindSessionId(venue, policy, challenge);
}

export { verifySessionBinding, type SessionBinding };

export async function verifyAgeOver(
  contractAddress: string,
  sessionId: string,
  minThreshold = 18,
  maxSkewDays = 3650,
  expectedBinding?: SessionBinding,
) {
  ensureNetwork();
  const verifier = Verifier.connect(contractAddress);
  return verifier.verifyAgeOver(sessionId, minThreshold, maxSkewDays, expectedBinding);
}

export async function verifyUniqueHuman(
  contractAddress: string,
  sessionId: string,
  expectedBinding?: SessionBinding,
) {
  ensureNetwork();
  const verifier = Verifier.connect(contractAddress);
  return verifier.verifyUniqueHuman(sessionId, expectedBinding);
}
