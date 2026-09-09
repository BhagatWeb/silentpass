import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';

export interface ConnectedSession {
  unshieldedAddress: string;
  shieldedAddress: {
    shieldedCoinPublicKey: string;
    shieldedEncryptionPublicKey: string;
  };
  config: any;
  networkId: string;
  providers: {
    privateStateProvider: any;
    publicDataProvider: any;
    zkConfigProvider: any;
    proofProvider: any;
    walletProvider: any;
    midnightProvider: any;
  };
  api: any;
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function fromHex(hex: string): Uint8Array {
  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (normalized.length % 2 !== 0) throw new Error('Invalid hex string from wallet.');
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
  }
  return bytes;
}

export async function createConnectedSession(api: any): Promise<ConnectedSession> {
  const [config, unshieldedAddrObj, shieldedAddress] = await Promise.all([
    api.getConfiguration(),
    api.getUnshieldedAddress(),
    api.getShieldedAddresses(),
  ]);

  const unshieldedAddress =
    typeof unshieldedAddrObj === 'string'
      ? unshieldedAddrObj
      : unshieldedAddrObj?.unshieldedAddress ?? String(unshieldedAddrObj);

  // Set the active network (Preview / Preprod)
  setNetworkId(config.networkId);

  // Serve compiled ZK keys & artifacts from origin (/managed or /zkir)
  const zkConfigProvider = new FetchZkConfigProvider(
    new URL('/managed/passport', window.location.origin).toString(),
    window.fetch.bind(window),
  );

  let provingProvider: any = null;
  try {
    if (typeof api.getProvingProvider === 'function') {
      provingProvider = await api.getProvingProvider(zkConfigProvider);
    }
  } catch (err) {
    console.warn('api.getProvingProvider warning:', err);
  }

  const proofProvider = {
    async proveTx(unprovenTx: any, _config?: any) {
      if (provingProvider) {
        try {
          const { CostModel } = await import('@midnight-ntwrk/ledger-v8');
          return await unprovenTx.prove(provingProvider, CostModel.initialCostModel());
        } catch {
          return await unprovenTx.prove(provingProvider);
        }
      }
      throw new Error(
        'Proving provider not available. Please verify your 1AM or Lace wallet proof server configuration.',
      );
    },
  };

  const walletProvider = {
    getCoinPublicKey: () => shieldedAddress.shieldedCoinPublicKey,
    getEncryptionPublicKey: () => shieldedAddress.shieldedEncryptionPublicKey,
    balanceTx: async (tx: any, ttl?: Date) => {
      void ttl;
      const txHex = toHex(tx.serialize());
      const balanced = await api.balanceUnsealedTransaction(txHex);
      if (!balanced?.tx) throw new Error('balanceUnsealedTransaction failed');
      const { Transaction } = await import('@midnight-ntwrk/ledger-v8');
      return Transaction.deserialize('signature', 'proof', 'binding', fromHex(balanced.tx));
    },
  };

  const midnightProvider = {
    submitTx: async (tx: any) => {
      const txHex = toHex(tx.serialize());
      const result = await api.submitTransaction(txHex);
      if (typeof result === 'string' && result) return result;
      if (result?.transactionId) return result.transactionId;
      if (result?.id) return result.id;
      return txHex.slice(0, 64);
    },
  };

  const privateStateStorage: Record<string, any> = {};
  const privateStateProvider = {
    get: async (key: string) => {
      const stored = localStorage.getItem(`midnight:state:${key}`);
      return stored ? JSON.parse(stored) : privateStateStorage[key] ?? null;
    },
    set: async (key: string, val: any) => {
      privateStateStorage[key] = val;
      try {
        localStorage.setItem(`midnight:state:${key}`, JSON.stringify(val));
      } catch {
        // ignore storage errors
      }
    },
    setContractAddress: () => {},
    setSigningKey: () => {},
  };

  let publicDataProvider: any = null;
  if (typeof api.getPublicDataProvider === 'function') {
    try {
      publicDataProvider = await api.getPublicDataProvider();
    } catch {
      publicDataProvider = null;
    }
  }
  if (!publicDataProvider && config.indexerUri) {
    publicDataProvider = indexerPublicDataProvider(config.indexerUri, config.indexerWsUri ?? '');
  }

  return {
    unshieldedAddress,
    shieldedAddress,
    config,
    networkId: config.networkId,
    api,
    providers: {
      privateStateProvider,
      publicDataProvider,
      zkConfigProvider,
      proofProvider,
      walletProvider,
      midnightProvider,
    },
  };
}
