/*
 * Encrypted PrivateStateProvider persisted in localStorage.
 *
 * All private states and signing keys stored in localStorage are encrypted
 * using AES-GCM (256-bit key) with random IVs. The encryption key is derived
 * from the user's wallet key (or user-controlled passphrase/seed) via PBKDF2
 * using Web Crypto API.
 */
import type { ContractAddress, SigningKey } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import type {
  ExportPrivateStatesOptions,
  ExportSigningKeysOptions,
  ImportPrivateStatesOptions,
  ImportPrivateStatesResult,
  ImportSigningKeysOptions,
  ImportSigningKeysResult,
  PrivateStateExport,
  PrivateStateId,
  PrivateStateProvider,
  SigningKeyExport,
} from '@midnight-ntwrk/midnight-js-types';

const ENCRYPTED_STATES_KEY = 'zkpassport:enc-private-states:v2';
const ENCRYPTED_KEYS_KEY = 'zkpassport:enc-signing-keys:v2';
const SALT_KEY = 'zkpassport:storage-salt:v2';

// JSON codec that survives Uint8Array and bigint round-trips.
const encode = (value: unknown): string =>
  JSON.stringify(value, (_k, v) => {
    if (v instanceof Uint8Array) {
      return { __u8: Array.from(v, (b) => b.toString(16).padStart(2, '0')).join('') };
    }
    if (typeof v === 'bigint') {
      return { __big: v.toString() };
    }
    return v;
  });

const decode = <T>(value: string): T =>
  JSON.parse(value, (_k, v) => {
    if (v && typeof v === 'object') {
      if (typeof v.__u8 === 'string') {
        const hex = v.__u8 as string;
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
        return bytes;
      }
      if (v.type === 'Buffer' && Array.isArray(v.data)) return new Uint8Array(v.data);
      if (typeof v.__big === 'string') return BigInt(v.__big);
    }
    return v;
  }) as T;

function getOrGenerateSalt(): Uint8Array {
  const existing = localStorage.getItem(SALT_KEY);
  if (existing) {
    const bytes = new Uint8Array(existing.length / 2);
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(existing.slice(i * 2, i * 2 + 2), 16);
    return bytes;
  }
  const salt = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(salt);
  } else {
    for (let i = 0; i < 16; i++) salt[i] = Math.floor(Math.random() * 256);
  }
  const hex = Array.from(salt, (b) => b.toString(16).padStart(2, '0')).join('');
  localStorage.setItem(SALT_KEY, hex);
  return salt;
}

let cachedCryptoKey: CryptoKey | null = null;
let lastKeyMaterial: string | null = null;

async function getEncryptionKey(walletOrUserEntropy: string): Promise<CryptoKey> {
  if (cachedCryptoKey && lastKeyMaterial === walletOrUserEntropy) {
    return cachedCryptoKey;
  }

  const saltBytes = getOrGenerateSalt();
  const salt = new Uint8Array(saltBytes.length);
  salt.set(saltBytes);
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(walletOrUserEntropy || 'silentpass-default-local-entropy'),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );

  const derived = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );

  cachedCryptoKey = derived;
  lastKeyMaterial = walletOrUserEntropy;
  return derived;
}

async function encryptData(plaintext: string, walletOrUserEntropy: string): Promise<string> {
  const key = await getEncryptionKey(walletOrUserEntropy);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext),
  );

  const ivHex = Array.from(iv, (b) => b.toString(16).padStart(2, '0')).join('');
  const cipherHex = Array.from(new Uint8Array(ciphertext), (b) => b.toString(16).padStart(2, '0')).join('');
  return JSON.stringify({ iv: ivHex, ct: cipherHex });
}

async function decryptData(envelope: string, walletOrUserEntropy: string): Promise<string | null> {
  try {
    const { iv: ivHex, ct: cipherHex } = JSON.parse(envelope);
    const key = await getEncryptionKey(walletOrUserEntropy);
    const iv = new Uint8Array(ivHex.length / 2);
    for (let i = 0; i < iv.length; i++) iv[i] = parseInt(ivHex.slice(i * 2, i * 2 + 2), 16);

    const ciphertext = new Uint8Array(cipherHex.length / 2);
    for (let i = 0; i < ciphertext.length; i++) ciphertext[i] = parseInt(cipherHex.slice(i * 2, i * 2 + 2), 16);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext,
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
}

type StatesShape = Record<ContractAddress, Record<string, string>>;

export const encryptedLocalStoragePrivateStateProvider = <
  PSI extends PrivateStateId,
  PS = unknown,
>(keyMaterialProvider?: () => string): PrivateStateProvider<PSI, PS> => {
  let contractAddress: ContractAddress | null = null;

  const getKeyEntropy = (): string => {
    return keyMaterialProvider ? keyMaterialProvider() : (localStorage.getItem('zkpassport:user-key') || 'silentpass-local-seed');
  };

  const requireContractAddress = (): ContractAddress => {
    if (contractAddress === null) {
      throw new Error('Contract address not set. Call setContractAddress() first.');
    }
    return contractAddress;
  };

  const loadStates = async (): Promise<StatesShape> => {
    const enc = localStorage.getItem(ENCRYPTED_STATES_KEY);
    if (!enc) {
      // Clean up any legacy plaintext storage
      if (localStorage.getItem('zkpassport:private-states')) {
        localStorage.removeItem('zkpassport:private-states');
      }
      return {};
    }
    const decrypted = await decryptData(enc, getKeyEntropy());
    if (!decrypted) return {};
    try {
      return JSON.parse(decrypted) as StatesShape;
    } catch {
      return {};
    }
  };

  const saveStates = async (states: StatesShape): Promise<void> => {
    const plaintext = JSON.stringify(states);
    const encrypted = await encryptData(plaintext, getKeyEntropy());
    localStorage.setItem(ENCRYPTED_STATES_KEY, encrypted);
  };

  const loadKeys = async (): Promise<Record<ContractAddress, SigningKey>> => {
    const enc = localStorage.getItem(ENCRYPTED_KEYS_KEY);
    if (!enc) return {};
    const decrypted = await decryptData(enc, getKeyEntropy());
    if (!decrypted) return {};
    try {
      return JSON.parse(decrypted) as Record<ContractAddress, SigningKey>;
    } catch {
      return {};
    }
  };

  const saveKeys = async (keys: Record<ContractAddress, SigningKey>): Promise<void> => {
    const plaintext = JSON.stringify(keys);
    const encrypted = await encryptData(plaintext, getKeyEntropy());
    localStorage.setItem(ENCRYPTED_KEYS_KEY, encrypted);
  };

  return {
    setContractAddress(address: ContractAddress): void {
      contractAddress = address;
    },
    async set(key: PSI, state: PS): Promise<void> {
      const address = requireContractAddress();
      const states = await loadStates();
      states[address] = { ...(states[address] ?? {}), [key]: encode(state) };
      await saveStates(states);
    },
    async get(key: PSI): Promise<PS | null> {
      const address = requireContractAddress();
      const states = await loadStates();
      const raw = states[address]?.[key];
      return raw === undefined ? null : decode<PS>(raw);
    },
    async remove(key: PSI): Promise<void> {
      const address = requireContractAddress();
      const states = await loadStates();
      if (states[address]) {
        delete states[address][key];
        await saveStates(states);
      }
    },
    async clear(): Promise<void> {
      const address = requireContractAddress();
      const states = await loadStates();
      delete states[address];
      await saveStates(states);
    },
    async setSigningKey(address: ContractAddress, signingKey: SigningKey): Promise<void> {
      const keys = await loadKeys();
      keys[address] = signingKey;
      await saveKeys(keys);
    },
    async getSigningKey(address: ContractAddress): Promise<SigningKey | null> {
      const keys = await loadKeys();
      return keys[address] ?? null;
    },
    async removeSigningKey(address: ContractAddress): Promise<void> {
      const keys = await loadKeys();
      delete keys[address];
      await saveKeys(keys);
    },
    async clearSigningKeys(): Promise<void> {
      await saveKeys({});
    },
    async exportPrivateStates(options?: ExportPrivateStatesOptions): Promise<PrivateStateExport> {
      void options;
      const address = requireContractAddress();
      const states = await loadStates();
      const scoped = states[address] ?? {};
      return {
        format: 'midnight-private-state-export',
        encryptedPayload: encode({ contractAddress: address, states: scoped }),
        salt: 'zkpassport-encrypted-storage-provider',
      };
    },
    async importPrivateStates(
      exportData: PrivateStateExport,
      options?: ImportPrivateStatesOptions,
    ): Promise<ImportPrivateStatesResult> {
      const address = requireContractAddress();
      const conflictStrategy = options?.conflictStrategy ?? 'error';
      const payload = decode<{ states?: Record<string, string> }>(exportData.encryptedPayload);
      const incoming = payload.states ?? {};
      const states = await loadStates();
      const existing = states[address] ?? {};
      let imported = 0;
      let skipped = 0;
      let overwritten = 0;

      for (const [stateId, serialized] of Object.entries(incoming)) {
        if (stateId in existing) {
          if (conflictStrategy === 'skip') {
            skipped += 1;
            continue;
          }
          if (conflictStrategy === 'error') {
            return Promise.reject(new Error(`Private state conflict for '${stateId}'`));
          }
          overwritten += 1;
        } else {
          imported += 1;
        }
        existing[stateId] = serialized;
      }

      states[address] = existing;
      await saveStates(states);
      return { imported, skipped, overwritten };
    },
    async exportSigningKeys(options?: ExportSigningKeysOptions): Promise<SigningKeyExport> {
      void options;
      const keys = await loadKeys();
      return {
        format: 'midnight-signing-key-export',
        encryptedPayload: encode({ keys }),
        salt: 'zkpassport-encrypted-storage-provider',
      };
    },
    async importSigningKeys(
      exportData: SigningKeyExport,
      options?: ImportSigningKeysOptions,
    ): Promise<ImportSigningKeysResult> {
      const conflictStrategy = options?.conflictStrategy ?? 'error';
      const payload = decode<{ keys?: Record<ContractAddress, SigningKey> }>(
        exportData.encryptedPayload,
      );
      const incoming = payload.keys ?? {};
      const keys = await loadKeys();
      let imported = 0;
      let skipped = 0;
      let overwritten = 0;

      for (const [address, signingKey] of Object.entries(incoming)) {
        if (address in keys) {
          if (conflictStrategy === 'skip') {
            skipped += 1;
            continue;
          }
          if (conflictStrategy === 'error') {
            return Promise.reject(new Error(`Signing key conflict for '${address}'`));
          }
          overwritten += 1;
        } else {
          imported += 1;
        }
        keys[address] = signingKey;
      }

      await saveKeys(keys);
      return { imported, skipped, overwritten };
    },
  };
};

export const localStoragePrivateStateProvider = encryptedLocalStoragePrivateStateProvider;
