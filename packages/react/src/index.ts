/**
 * silentpass-react — drop-in age-gating for any React dApp on Midnight.
 *
 * ```tsx
 * import { SilentPassGate } from 'silentpass-react';
 *
 * <SilentPassGate contractAddress={CONTRACT} connect={connectWallet} threshold={18}>
 *   <MembersOnlyContent />
 * </SilentPassGate>
 * ```
 *
 * `connect` returns Midnight.js `PassportProviders` for the user's wallet.
 * The birthdate never leaves the user's device — your dApp receives only a
 * `verified` boolean.
 */
export { useSilentPass } from './useSilentPass.js';
export type {
  UseSilentPass,
  UseSilentPassOptions,
  SilentPassStatus,
} from './useSilentPass.js';
export { SilentPassGate } from './SilentPassGate.js';
export type { SilentPassGateProps } from './SilentPassGate.js';
export type {
  AgeVerificationResult,
  PassportProviders,
} from 'silentpass';
