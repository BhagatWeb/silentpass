/*
 * Assembles the Midnight.js providers around a connected Lace wallet:
 * indexer (public data), local proof server (ZK proofs), ZK config served
 * from this app's origin, wallet (balance + sign), and node submission.
 *
 * Wiring mirrors example-bboard's browser manager 1:1.
 */
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { fromHex, toHex } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import {
  type Binding,
  type Proof,
  type SignatureEnabled,
  Transaction,
  CostModel,
  type FinalizedTransaction,
  type TransactionId,
} from '@midnight-ntwrk/midnight-js-protocol/ledger';
import type { UnboundTransaction } from '@midnight-ntwrk/midnight-js-types';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import {
  passportPrivateStateId,
  type PassportCircuitKeys,
  type PassportProviders,
} from 'silentpass';
import type { PassportPrivateState } from 'silentpass-contract';
import { localStoragePrivateStateProvider } from './local-storage-private-state-provider.js';
import { connectToWallet } from './wallet.js';

void passportPrivateStateId;

export interface WalletSession {
  readonly providers: PassportProviders;
  readonly connectedAPI: ConnectedAPI;
  readonly networkId: string;
  readonly indexerUri: string;
  readonly indexerWsUri: string;
  readonly proverServerUri: string | undefined;
  readonly shieldedCoinPublicKey: string;
}

export const initializeWalletSession = async (): Promise<WalletSession> => {
  let networkId = (import.meta.env.VITE_NETWORK_ID as string | undefined) ?? 'preprod';
  let connectedAPI;
  try {
    connectedAPI = await connectToWallet(networkId);
  } catch (err: any) {
    const match = err?.message?.match(/Wallet is on (\w+)/i);
    if (match && match[1]) {
      networkId = match[1].toLowerCase();
      connectedAPI = await connectToWallet(networkId);
    } else {
      throw err;
    }
  }

  const config = await connectedAPI.getConfiguration();

  // REQUIRED before building ANY transaction: midnight-js normalizes the
  // wallet's Bech32m keys against this global network id, and throws without
  // it. Use the wallet-reported id so it matches the keys' HRP.
  setNetworkId(config.networkId);

  const shieldedAddresses = await connectedAPI.getShieldedAddresses();

  if (!config.proverServerUri) {
    throw new Error(
      'Lace has no proof server configured. Set Settings » Midnight » Proof server to Local (http://localhost:6300).',
    );
  }

  const proverUri =
    (import.meta.env.VITE_PROVER_URI as string | undefined) ??
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:6300'
      : config.proverServerUri);

  const zkConfigProvider = new FetchZkConfigProvider<PassportCircuitKeys>(
    window.location.origin,
    fetch.bind(window),
  );

  let walletProvingProvider: any = null;
  try {
    if (typeof (connectedAPI as any).getProvingProvider === 'function') {
      walletProvingProvider = await (connectedAPI as any).getProvingProvider(zkConfigProvider);
    }
  } catch (err) {
    console.warn('connectedAPI.getProvingProvider:', err);
  }

  const httpProofProvider = httpClientProofProvider(proverUri, zkConfigProvider);

  const proofProvider = {
    async proveTx(unprovenTx: any, _config?: any) {
      if (walletProvingProvider) {
        try {
          return await unprovenTx.prove(walletProvingProvider, CostModel.initialCostModel());
        } catch (err) {
          console.warn('[ProofProvider] wallet provingProvider failed, trying direct proof server:', err);
        }
      }
      return await httpProofProvider.proveTx(unprovenTx, _config);
    },
  };

  const providers: PassportProviders = {
    privateStateProvider: localStoragePrivateStateProvider<
      typeof passportPrivateStateId,
      PassportPrivateState
    >(() => shieldedAddresses.shieldedCoinPublicKey || shieldedAddresses.shieldedEncryptionPublicKey),
    zkConfigProvider,
    proofProvider: proofProvider as any,
    publicDataProvider: indexerPublicDataProvider(config.indexerUri, config.indexerWsUri),
    walletProvider: {
      getCoinPublicKey(): string {
        return shieldedAddresses.shieldedCoinPublicKey;
      },
      getEncryptionPublicKey(): string {
        return shieldedAddresses.shieldedEncryptionPublicKey;
      },
      balanceTx: async (tx: UnboundTransaction, ttl?: Date): Promise<FinalizedTransaction> => {
        void ttl;
        try {
          const received = await connectedAPI.balanceUnsealedTransaction(toHex(tx.serialize()));
          return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
            'signature',
            'proof',
            'binding',
            fromHex(received.tx),
          );
        } catch (err: any) {
          const rawMsg = err?.message ?? String(err);
          if (rawMsg.toLowerCase().includes('dust') || rawMsg.toLowerCase().includes('balance failed')) {
            throw new Error(
              `Balance failed: Wallet DUST is not ready. In your wallet (Lace / 1AM on Preprod), ensure DUST generation is active (Tokens → tNIGHT → Generate DUST) and wait 1–2 minutes for DUST coins to accrue, or wait for locked coins to refresh, then retry.`
            );
          }
          throw err;
        }
      },
    },
    midnightProvider: {
      submitTx: async (tx: FinalizedTransaction): Promise<TransactionId> => {
        await connectedAPI.submitTransaction(toHex(tx.serialize()));
        return tx.identifiers()[0];
      },
    },
  };

  return {
    providers,
    connectedAPI,
    networkId,
    indexerUri: config.indexerUri,
    indexerWsUri: config.indexerWsUri,
    proverServerUri: proverUri,
    shieldedCoinPublicKey: shieldedAddresses.shieldedCoinPublicKey,
  };
};
