import { toHex, fromHex } from '@midnight-ntwrk/midnight-js-utils';

export { toHex, fromHex };

/** Cryptographically random bytes (browser + Node WebCrypto). */
export const randomBytes = (length: number): Uint8Array => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
};

/** Fresh opaque 32-byte session id, hex-encoded. */
export const newSessionId = (): string => toHex(randomBytes(32));

export const asBytes = (value: string | Uint8Array): Uint8Array =>
  typeof value === 'string' ? fromHex(value) : value;

/**
 * Coerces an arbitrary scope identifier into a 32-byte value. A 64-char hex
 * string (e.g. a contract address) is used verbatim; anything else is hashed
 * to 32 bytes via SHA-256 so any dApp-chosen string works as a scope.
 */
export const scopeToBytes = async (scope: string | Uint8Array): Promise<Uint8Array> => {
  if (scope instanceof Uint8Array) return fit32(scope);
  if (/^[0-9a-fA-F]{64}$/.test(scope)) return fromHex(scope);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(scope));
  return new Uint8Array(digest);
};

const fit32 = (bytes: Uint8Array): Uint8Array => {
  if (bytes.length === 32) return bytes;
  const out = new Uint8Array(32);
  out.set(bytes.slice(0, 32));
  return out;
};

/** Canonical form of a legal name for hashing: lowercase, single-spaced, trimmed. */
export const normalizeName = (name: string): string =>
  name.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();

/**
 * Deterministic 32-byte hash of a normalized name. The issuer commits to this
 * at issuance; a verifier computes it from the name it is checking. The circuit
 * only ever compares the two hashes, so the name itself stays private.
 */
export const nameHash = async (name: string): Promise<Uint8Array> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('zkp:name:' + normalizeName(name)));
  return new Uint8Array(digest);
};

/**
 * Derives a deterministic personhood nullifier from KYC identity attributes
 * (full name, birthDate, and country). This gives true cross-enrollment
 * deduplication on the issuer side to prevent one human from enrolling
 * multiple times with different keypairs.
 */
export const derivePersonhoodNullifier = async (
  name: string,
  birthDate: Date | string | bigint,
  country?: number,
): Promise<Uint8Array> => {
  const normName = normalizeName(name);
  const bDateStr = typeof birthDate === 'bigint' ? birthDate.toString() : yyyymmdd(birthDate).toString();
  const cStr = String(country ?? 0);
  const tag = `zkp:personhood:${normName}:${bDateStr}:${cStr}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(tag));
  return new Uint8Array(digest);
};

/**
 * Encodes a date as YYYYMMDD (UTC). This encoding makes age arithmetic exact:
 * age >= t  <=>  asOfDate >= birthDate + t * 10000.
 */
export const yyyymmdd = (date: Date | string): bigint => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${String(date)}`);
  }
  return BigInt(d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate());
};

/** Parses a YYYYMMDD number back into a UTC date. */
export const fromYyyymmdd = (value: number | bigint): Date => {
  const n = Number(value);
  return new Date(Date.UTC(Math.floor(n / 10000), Math.floor((n % 10000) / 100) - 1, n % 100));
};

/** Whole calendar days between two dates (a - b). */
export const daysBetween = (a: Date, b: Date): number =>
  Math.round((a.getTime() - b.getTime()) / 86_400_000);

export interface SessionBinding {
  venue: string;
  policy: string;
  challenge: string;
}

/**
 * Cryptographically binds a 32-byte sessionId to a venue, policy, and fresh challenge
 * via domain-separated SHA-256 to prevent cross-context replay and cross-application acceptance.
 */
export const bindSessionId = async (
  venue: string,
  policy: string,
  challenge?: string | Uint8Array,
): Promise<{ sessionId: string; venue: string; policy: string; challenge: string }> => {
  const challengeHex = challenge
    ? (typeof challenge === 'string' ? challenge : toHex(challenge))
    : toHex(randomBytes(16));
  const normVenue = venue.trim().toLowerCase();
  const normPolicy = policy.trim().toLowerCase();
  const tag = `zkp:session:v2:${normVenue}:${normPolicy}:${challengeHex}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(tag));
  const sessionId = toHex(new Uint8Array(digest));
  return {
    sessionId,
    venue: normVenue,
    policy: normPolicy,
    challenge: challengeHex,
  };
};

/**
 * Verifies that a given sessionId correctly binds to the specified venue, policy, and challenge.
 */
export const verifySessionBinding = async (
  sessionId: string,
  binding: { venue: string; policy: string; challenge: string },
): Promise<boolean> => {
  const derived = await bindSessionId(binding.venue, binding.policy, binding.challenge);
  return sessionId.toLowerCase() === derived.sessionId.toLowerCase();
};

/**
 * Serializes and encrypts holder private state using AES-GCM (256-bit) and PBKDF2.
 */
export const encryptHolderState = async (
  state: unknown,
  passphrase: string,
): Promise<string> => {
  if (!passphrase || passphrase.length < 6) {
    throw new Error('Passphrase must be at least 6 characters.');
  }
  const salt = randomBytes(16);
  const iv = randomBytes(12);

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  );

  const serialized = JSON.stringify(state, (_key, val) => {
    if (val instanceof Uint8Array) {
      return { __u8: toHex(val) };
    }
    if (typeof val === 'bigint') {
      return { __big: val.toString() };
    }
    return val;
  });

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    enc.encode(serialized),
  );

  return JSON.stringify({
    version: 1,
    cipher: 'AES-GCM-256',
    kdf: 'PBKDF2-SHA256-100K',
    salt: toHex(salt),
    iv: toHex(iv),
    ciphertext: toHex(new Uint8Array(ciphertext)),
  });
};

/**
 * Decrypts and deserializes holder private state previously encrypted with encryptHolderState.
 */
export const decryptHolderState = async <T = any>(
  encryptedBlob: string,
  passphrase: string,
): Promise<T> => {
  let envelope: {
    version: number;
    salt: string;
    iv: string;
    ciphertext: string;
  };
  try {
    envelope = JSON.parse(encryptedBlob);
  } catch {
    throw new Error('Invalid encrypted state format: JSON parse failure.');
  }

  if (!envelope.salt || !envelope.iv || !envelope.ciphertext) {
    throw new Error('Invalid encrypted state envelope: missing salt, iv, or ciphertext.');
  }

  const salt = fromHex(envelope.salt);
  const iv = fromHex(envelope.iv);
  const ciphertext = fromHex(envelope.ciphertext);

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );

  let decryptedBuffer: ArrayBuffer;
  try {
    decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      ciphertext as unknown as BufferSource,
    );
  } catch {
    throw new Error('Decryption failed: incorrect passphrase or corrupted data.');
  }

  const dec = new TextDecoder();
  const jsonStr = dec.decode(decryptedBuffer);

  return JSON.parse(jsonStr, (_key, val) => {
    if (val && typeof val === 'object') {
      if (typeof val.__u8 === 'string') {
        return new Uint8Array(fromHex(val.__u8));
      }
      if (typeof val.__big === 'string') {
        return BigInt(val.__big);
      }
    }
    return val;
  }) as T;
};

