# Project Spec: SilentPass | Premium Zero-Knowledge Identity Venue on Midnight

## 1. Overview
A decentralized application (dApp) that provides a reusable zero-knowledge identity credential on Midnight. A user verifies a real-world attribute once to obtain an exclusive SilentPass, holds it privately on their own device, and proves facts about it (e.g., being over 18 or having a specific identity) to any app. The verifying app learns a single bit of information (`verified`) and never sees the user's name, birthdate, or raw documents.

---

## 2. Core Architecture

### Components
```
   [ Issuer Authority ] ──(Issues SilentPass)──> [ Holder Device/Wallet ]
                                                            │
                                                     (Generates ZK Proof)
                                                            │
                                                            ▼
 [ 3rd Party Verifier ] <──(Reads verified result)── [ Compact Contract ]
```

1. **Issuer Authority**:
   - Performs an off-chain check and attests by writing an opaque commitment to the ledger. 
   - Attributes are never passed as parameters to the contract.
2. **Holder Device/Wallet (Client)**:
   - Holds the SilentPass (name, birthdate, country, secret key) in private local state.
   - Proves attributes locally against a `sessionId` handed over by a Verifier.
3. **Compact Contract (Smart Contract)**:
   - Contains the verification circuits for identity, age, and uniqueness.
   - Validates the ZK proof without revealing the raw attributes on the public ledger.
4. **Verifier (Any App)**:
   - Mints a `sessionId`, hands it to the Holder, and reads back a single verified result from the Midnight indexer. Needs no wallet or proof server.

---

## 3. Privacy & Security Model

| Data Point | What is Public (Ledger) | What is Private (Witness) | Cryptographic Guarantee |
| :--- | :--- | :--- | :--- |
| **Holder Identity** | None (credential commitments are opaque) | Name, birthdate, country, raw document bytes | Personal attributes never touch chain or verifier |
| **Age / Identity Match** | Only the binary `verified` result | Exact Birthdate / Name string | Evaluates `asOfDate >= birthDate + threshold * 10000` inside circuit |
| **Verification State**| Session ID to verified result (`true`/`false`) | The credential salt & secret key | Unlinkable to wallet address or identity |
| **Issuer Authority** | Issuer public keys & revocation nullifiers | The Merkle path used in the proof | Verifier cannot identify which credential produced the proof |
| **Session Binding** | Domain-separated `sessionId` hash | Venue, policy, challenge parameters | Prevents cross-context replay between venues or policies |
| **Holder Storage** | None | AES-GCM-256 encrypted private state | Protected at rest with PBKDF2 (100k rounds) |

---

## 4. Issuer Trust Model & Mandatory Personhood Deduplication

1. **Governance & Registry**: Issuers are authorized on-chain in the `issuers` set governed by the contract `admin` via `addIssuer` and `removeIssuer` circuits.
2. **Data Minimization**: The issuer validates documents off-chain and NEVER submits identity plaintext or images to the blockchain.
3. **Mandatory Deduplication for Personhood**: To achieve genuine Sybil resistance, holder keypair generation alone is insufficient (a user could generate unlimited keys). For personhood claims, the issuer is strictly required to derive the on-chain `enrollmentNullifier` deterministically from real-world verified identity attributes:
   $$\text{enrollmentNullifier} = \text{SHA-256}(\text{"zkp:personhood:"} \parallel \text{normalizeName(name)} \parallel \text{birthDate} \parallel \text{country})$$
   The contract strictly enforces single enrollment:
   ```compact
   assert(!enrollmentNullifiers.member(dNullifier), "credential already issued for this enrollment");
   ```
4. **Separation of Capabilities**: Issuers cannot forge proofs for holders because circuit proving requires the holder's private `userSecretKey`, which is never shared with the issuer.

---

## 5. Session ID Binding & Cross-Context Acceptance Prevention

To prevent an attacker or dishonest verifier from taking a verification generated for Venue A (e.g. `casino.com`, `age:18`) and replaying it at Venue B (e.g. `dao.org`, `age:21`), session IDs are cryptographically bound:
$$\text{sessionId} = \text{SHA-256}(\text{"zkp:session:v2:"} \parallel \text{venue} \parallel \text{policy} \parallel \text{challenge})$$
Consuming dApps and the verification gateway enforce that a presented `sessionId` matches the expected context before accepting the verification.

---

## 6. Holder Private State Encryption & Threat Modeling

1. **At-Rest Encryption**: Holder state (secret key, attributes, commitment salt) is encrypted client-side using **AES-GCM (256-bit key)** with key derivation via **PBKDF2-SHA256 (100,000 iterations)**.
2. **Backup & Recovery**: Holders export portable encrypted JSON envelopes containing salt, IV, and ciphertext. Restoration requires the holder passphrase.
3. **Device Compromise Risks & Revocation**:
   - *Risk*: An attacker with physical or malware access to an unlocked device could generate proofs until the credential is revoked.
   - *Mitigation*: Passphrase encryption at rest prevents extraction from storage.
   - *Cryptographic Kill Switch*: If a device is compromised or lost, the holder contacts the issuing authority. The issuer publishes the credential's `revocationNullifier(commitment, salt)` on-chain. The Compact contract circuit instantly rejects all future proofs for that credential:
     ```compact
     assert(!revocationNullifiers.member(disclose(revNul)), "credential has been revoked");
     ```

---

## 7. Implementation Roadmap & Verifiable Milestones

- **Phase 1 (Level 1)**: Midnight toolchain, `passport.compact` compilation (10 circuits), and initial Preprod deployment.
- **Phase 2 (Level 2)**: Frontend integration with 1AM/Lace wallets and client-side ZK proof generation.
- **Phase 3 (Level 3)**: Automated headless test suite, CI/CD pipelines, and session verification.
- **Phase 4 (Level 4)**: Verification gateway with bound sessions, executable gateway tests, encrypted state export/import, and full credential lifecycle testing (including revocation after prior successful verification) on Midnight Preprod.

