import { pureCircuits } from 'silentpass-contract';
import type { PassportAPI } from './api.js';
import type { CredentialAttributes, CredentialFile } from './types.js';
import {
  asBytes,
  derivePersonhoodNullifier,
  nameHash,
  randomBytes,
  toHex,
  yyyymmdd,
} from './encoding.js';

/**
 * Issuer role: attests real-world attributes after off-chain verification
 * (KYC, document check, proof-of-personhood — whatever the deployment demands)
 * and records ONLY an opaque commitment on-chain.
 *
 * ISSUER TRUST MODEL:
 * 1. Authority: Issuers are registered on-chain in the `issuers` set governed by
 *    the contract admin (`addIssuer`, `removeIssuer`).
 * 2. Data Minimization: The issuer performs verification off-chain and NEVER submits
 *    raw documents or personal attributes (name, DOB, nationality) to the ledger.
 * 3. Personhood & Sybil Resistance: For personhood claims (unique human checks),
 *    real-world identity deduplication is an EXPLICIT, MANDATORY requirement. The
 *    issuer derives the on-chain enrollment nullifier deterministically from verified
 *    real-world identity attributes (`derivePersonhoodNullifier`). If a human attempts to
 *    enroll multiple times using different keypairs, the on-chain contract rejects
 *    duplicate nullifiers (`assert(!enrollmentNullifiers.member(dNullifier))`).
 * 4. Revocation: The issuer holds the commitment opening salt and can revoke a credential
 *    by publishing `revocationNullifier(commitment, salt)` without exposing user identity.
 * 5. Soundness: Issuers cannot forge proofs for users because proof generation requires
 *    the user's private key (`userSecretKey`), which is never shared with the issuer.
 */
export class Issuer {
  constructor(private readonly api: PassportAPI) {}

  /** The issuer's public key, as registered in the on-chain issuer set. */
  async publicKey(): Promise<Uint8Array> {
    const ps = await this.api.privateState();
    if (!ps.issuerSecretKey) {
      throw new Error('This session has no issuer key. Deploy the contract or call importSecretKey().');
    }
    return pureCircuits.publicKey(ps.issuerSecretKey);
  }

  /** Imports an issuer secret key into private state (e.g. when joining a contract). */
  async importSecretKey(secretKey: string | Uint8Array): Promise<void> {
    const ps = await this.api.privateState();
    await this.api.setPrivateState({ ...ps, issuerSecretKey: asBytes(secretKey) });
  }

  /**
   * Issues a credential with explicit, mandatory real-world identity deduplication
   * required for Sybil-resistant personhood claims.
   */
  async issuePersonhoodCredential(
    attributes: CredentialAttributes,
    subject: { publicKey: string | Uint8Array; enrollmentNullifier?: string | Uint8Array },
  ): Promise<CredentialFile> {
    return this.issueCredential(attributes, subject, {
      deduplicateIdentity: true,
      requirePersonhoodDedup: true,
    });
  }

  /**
   * Issues a credential for a subject the issuer has verified off-chain.
   *
   * The subject supplies their public key and humanity nullifier (both derived
   * from their secret, which they never share). The chain records only the
   * commitment and the nullifier — never the attributes.
   *
   * @param attributes Verified attributes (name, birthDate, country, accredited).
   * @param subject Subject public key and optional enrollment nullifier.
   * @param options.deduplicateIdentity Derive enrollment nullifier deterministically from identity attributes.
   * @param options.requirePersonhoodDedup Explicitly require identity deduplication for personhood claims.
   * @returns The credential file to hand to the subject over a private channel.
   */
  async issueCredential(
    attributes: CredentialAttributes,
    subject: { publicKey: string | Uint8Array; enrollmentNullifier?: string | Uint8Array },
    options?: { deduplicateIdentity?: boolean; requirePersonhoodDedup?: boolean },
  ): Promise<CredentialFile> {
    if (!attributes.name || !attributes.name.trim()) {
      throw new Error('Credential requires a verified legal name.');
    }
    const birthDate = yyyymmdd(attributes.birthDate);
    const country = BigInt(attributes.country ?? 0);
    const accredited = attributes.accredited ?? false;
    const nh = await nameHash(attributes.name);

    const subjectPk = asBytes(subject.publicKey);
    // Real-world identity deduplication is mandatory for personhood claims to prevent
    // sybil multi-enrollment across distinct keypairs for the same human.
    let enrollNullifier: Uint8Array;
    if (options?.requirePersonhoodDedup || options?.deduplicateIdentity) {
      enrollNullifier = await derivePersonhoodNullifier(attributes.name, birthDate, Number(country));
    } else if (subject.enrollmentNullifier) {
      enrollNullifier = asBytes(subject.enrollmentNullifier);
    } else {
      enrollNullifier = await derivePersonhoodNullifier(attributes.name, birthDate, Number(country));
    }
    const salt = randomBytes(32);

    const attrsHash = pureCircuits.attributesHash(birthDate, country, accredited, nh);
    const commitment = pureCircuits.credentialCommitment(subjectPk, attrsHash, salt);

    this.api.logger?.info({ issueCredential: { commitment: toHex(commitment) } });
    const txData = await this.api.deployedContract.callTx.issueCredential(
      commitment,
      enrollNullifier,
    );
    this.api.logger?.info({ issued: { txHash: txData.public.txHash } });

    return {
      version: 1,
      contractAddress: this.api.contractAddress,
      subjectPublicKey: toHex(subjectPk),
      commitment: toHex(commitment),
      salt: toHex(salt),
      nameHash: toHex(nh),
      attributes: {
        name: attributes.name,
        birthDate: Number(birthDate),
        country: Number(country),
        accredited,
      },
    };
  }

  /**
   * Revokes an issued credential. The revocation nullifier is derived from the
   * credential's private salt (which the issuer generated at issuance), so only
   * the issuing issuer can revoke it — it is not computable from public data.
   */
  async revoke(credential: Pick<CredentialFile, 'commitment' | 'salt'>): Promise<void> {
    const revNullifier = pureCircuits.revocationNullifier(
      asBytes(credential.commitment),
      asBytes(credential.salt),
    );
    await this.api.deployedContract.callTx.revoke(revNullifier);
  }

  /** Admin-only: registers an additional trusted issuer public key. */
  async addIssuer(newIssuerPublicKey: string | Uint8Array): Promise<void> {
    await this.api.deployedContract.callTx.addIssuer(asBytes(newIssuerPublicKey));
  }
}
