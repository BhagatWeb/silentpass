export const short = (s: string, n = 10): string =>
  s.length > 2 * n ? `${s.slice(0, n)}…${s.slice(-n)}` : s;

export const getActiveNetwork = (): string => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('DEPLOYED_NETWORK_ID');
    if (stored) return stored;
  }
  return import.meta.env.VITE_NETWORK_ID || 'preview';
};

export const EXPLORER =
  getActiveNetwork() === 'preview'
    ? 'https://preview.midnightexplorer.com/'
    : 'https://preprod.midnightexplorer.com/';

/** Deep link to a contract on the midnight explorer. */
export const contractUrl = (address: string): string => {
  const isPreview = getActiveNetwork() === 'preview';
  if (isPreview) {
    return `https://preview.midnightexplorer.com/contracts/${address}`;
  }
  const clean = address.startsWith('0x') ? address : `0x${address}`;
  return `https://preprod.midnightexplorer.com/contracts/${clean}`;
};

/** YYYYMMDD int (as stored on-chain) → human date. */
export const fromYyyymmdd = (n: number | undefined): string => {
  if (!n) return 'n/a';
  const s = String(n);
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
};
