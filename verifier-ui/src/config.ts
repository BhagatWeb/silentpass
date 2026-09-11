/**
 * Dynamic Contract Address Config
 *
 * Reads deployed contract address dynamically from localStorage first,
 * falling back to environment variables and finally the canonical Preprod deployment.
 */

export const PREVIEW_CONTRACT_ADDRESS =
  '34b03973c1125b7bd89f2356841f1ddacc25404780f7139aebf47ce3c963c692';

export const PREPROD_CONTRACT_ADDRESS =
  'a2f3e16eb2f8d0b6d678b21308f37f3dbdd1c484636bc540b256af8ee1df9c7e';

export const FALLBACK_CONTRACT_ADDRESS =
  (import.meta.env.VITE_NETWORK_ID as string) === 'preprod'
    ? PREPROD_CONTRACT_ADDRESS
    : PREVIEW_CONTRACT_ADDRESS;

export const getContractAddress = (): string => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('DEPLOYED_CONTRACT_ADDRESS');
    if (stored && stored.trim()) return stored.trim();
  }
  return import.meta.env.VITE_CONTRACT_ADDRESS || FALLBACK_CONTRACT_ADDRESS;
};

export const CONTRACT_ADDRESS = getContractAddress();
