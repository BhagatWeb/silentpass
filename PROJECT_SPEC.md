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

## 3. Privacy Model

| Data Point | What is Public (Ledger) | What is Private (Witness) |
| :--- | :--- | :--- |
| **Holder Identity** | None (credential commitments are opaque) | Name, birthdate, country, document |
| **Age / Identity Match** | Only the binary `verified` result | Exact Birthdate / Name string |
| **Verification State**| Session ID to verified result (`true`/`false`) | The credential salt & secret key |
| **Issuer Authority** | Issuer public keys & revocation nullifiers | The Merkle path used in the proof |

Membership is proven against a Merkle root, meaning a proof never reveals which credential produced it and cannot be linked back to the original issuance.

---

## 4. Implementation Roadmap

- **Phase 1 (Level 1)**: Set up the Midnight environment, write the `.compact` contract circuits for identity and age verification, compile, write tests, and deploy to Preprod.
- **Phase 2 (Level 2)**: Wire the compiled smart contract APIs to a React/Vite frontend (the SilentPass App) using the `midnight-js` SDK and 1AM wallet provider.
- **Phase 3 (Level 3)**: Overhaul the UI with premium Dark Mode aesthetics, build out the documentation page, and ensure robust session-based verification flows.
