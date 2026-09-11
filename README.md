<div align="center">

# SilentPass

### Prove your eligibility. Keep your identity silent.

A zero-knowledge identity credential on [Midnight Network](https://midnight.network) designed for exclusive online venues, age-restricted platforms, and confidential compliance.

[![npm silentpass](https://img.shields.io/npm/v/silentpass?color=7928ca&label=silentpass&logo=npm)](https://www.npmjs.com/package/silentpass)
[![npm silentpass-react](https://img.shields.io/npm/v/silentpass-react?color=7928ca&label=silentpass-react&logo=npm)](https://www.npmjs.com/package/silentpass-react)
[![X Post](https://img.shields.io/badge/X-Launch_Post-black?logo=x)](https://x.com/amanrajbhagat11/status/2098406980679553426?s=20)
[![CI](https://github.com/BhagatWeb/silentpass/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/BhagatWeb/silentpass/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-Apache--2.0-111111)](LICENSE)
[![Midnight Preprod](https://img.shields.io/badge/Midnight-Preprod-1c7a4c)](https://preprod.midnightexplorer.com/contracts/a2f3e16eb2f8d0b6d678b21308f37f3dbdd1c484636bc540b256af8ee1df9c7e)
[![Midnight Preview](https://img.shields.io/badge/Midnight-Preview-0284c7)](https://preview.midnightexplorer.com/contracts/34b03973c1125b7bd89f2356841f1ddacc25404780f7139aebf47ce3c963c692)
[![Live Demo](https://img.shields.io/badge/Live_dApp-silentpass--midnight.netlify.app-00ad9f?logo=netlify)](https://silentpass-midnight.netlify.app/)

</div>

---

## Table of Contents
1. [Overview and Problem Statement](#overview-and-problem-statement)
2. [What is SilentPass?](#what-is-silentpass)
3. [Submission Verification Checklist](#submission-verification-checklist)
4. [Live Deployment](#live-deployment)
5. [Interface Screenshots](#interface-screenshots)
6. [How it Works: Public State vs Private Witness](#how-it-works-public-state-vs-private-witness)
7. [Hackathon Execution (Levels 1-4)](#hackathon-execution-levels-1-4)
   - [Level 1: New Moon - Setup and First Contract](#level-1-new-moon---setup-and-first-contract)
   - [Level 2: Waxing Crescent - Frontend Integration](#level-2-waxing-crescent---frontend-integration)
   - [Level 3: First Quarter - Production-Grade dApp](#level-3-first-quarter---production-grade-dapp)
   - [Level 4: Waxing Gibbous - MVP and Contract Logic](#level-4-waxing-gibbous---mvp-and-contract-logic)
8. [Privacy Model: What an Observer Learns](#privacy-model-what-an-observer-learns)
9. [Architecture](#architecture)
10. [Getting Started (Local Development)](#getting-started-local-development)
11. [Video Demo Walkthrough](#video-demo-walkthrough)
12. [License](#license)

---

## Overview and Problem Statement

Online users are routinely required to submit sensitive government identity documents, exact birthdates, and residential addresses to disparate web services to verify age, residency, or uniqueness. This practice exposes users to significant identity theft risks and transforms web applications into high-liability targets for data breaches.

Traditional identity verification systems demand complete disclosure of underlying documents even when a platform only needs confirmation of a single predicate (such as being 18 or older). SilentPass eliminates this systemic vulnerability by converting raw identity checks into portable zero-knowledge cryptographic proofs on Midnight Network.

---

## What is SilentPass?

**SilentPass** is a privacy-first identity credential protocol and verification platform built on Midnight.

Users verify their identity once with an authorized Verification Authority and receive a reusable cryptographic credential stored strictly on their client device. When an application (the Venue) requests verification, the user generates a local zero-knowledge proof proving compliance with eligibility criteria without revealing their name, exact birthdate, or raw documents.

The verifying application receives a single cryptographically verifiable boolean confirmation without needing wallet connectivity, a proof server, or custody of user personal data. SilentPass ensures regulatory compliance while preventing data collection liabilities.

---

## Submission Verification Checklist

| Requirement | Verification Method | Artifact / Resource Link |
| :--- | :--- | :--- |
| **Live Demo dApp** | Browser access | [silentpass-midnight.netlify.app](https://silentpass-midnight.netlify.app/) (Admin Deployer: [/admin](https://silentpass-midnight.netlify.app/admin)) |
| **Compact Smart Contract** | Review logic and circuits | [`contract/src/passport.compact`](contract/src/passport.compact) |
| **Circuits and Keys** | Inspect generated artifacts | [`contract/src/managed/passport/`](contract/src/managed/passport/) |
| **Preprod Deployment** | On-chain ledger query | [Preprod Contract on Explorer](https://preprod.midnightexplorer.com/contracts/a2f3e16eb2f8d0b6d678b21308f37f3dbdd1c484636bc540b256af8ee1df9c7e) |
| **Preview Deployment** | On-chain ledger query | [Preview Contract on Explorer](https://preview.midnightexplorer.com/contracts/34b03973c1125b7bd89f2356841f1ddacc25404780f7139aebf47ce3c963c692) |
| **Automated Test Suite** | Execute `npm test` | 15 passing tests across [`smoke.test.mjs`](passport-sdk/src/smoke.test.mjs) and [`eligibility.test.mjs`](passport-sdk/src/eligibility.test.mjs) |
| **CI/CD Pipeline** | GitHub Actions | [Workflow File](.github/workflows/ci.yml) and [Passing Action Runs](https://github.com/BhagatWeb/silentpass/actions) |
| **Wallet Integration** | Launch UI | Connect 1AM or Lace wallet in [`verifier-ui`](verifier-ui/) |
| **Privacy Model Documentation** | Review specification | [Privacy Model Section](#privacy-model-what-an-observer-learns) |
| **Video Demonstration** | Watch walkthrough | [Google Drive Demo Video](https://drive.google.com/file/d/1foaBYehoTPS_apZJBb48Wq6qu6mCcoWl/view?usp=sharing) |
| **Public Announcement** | Verified post on X | [Launch Post on X](https://x.com/amanrajbhagat11/status/2098406980679553426?s=20) |

---

## Live Deployment

| Component | Network | Address / Details | Operational Status |
| :--- | :--- | :--- | :--- |
| **Smart Contract (Preprod)** | Midnight Preprod | [`a2f3e16eb2f8d0b6d678b21308f37f3dbdd1c484636bc540b256af8ee1df9c7e`](https://preprod.midnightexplorer.com/contracts/a2f3e16eb2f8d0b6d678b21308f37f3dbdd1c484636bc540b256af8ee1df9c7e) | Active on-chain |
| **Smart Contract (Preview)** | Midnight Preview | [`34b03973c1125b7bd89f2356841f1ddacc25404780f7139aebf47ce3c963c692`](https://preview.midnightexplorer.com/contracts/34b03973c1125b7bd89f2356841f1ddacc25404780f7139aebf47ce3c963c692) | Active on-chain |
| **Production Web dApp** | Production Web (Netlify) | [https://silentpass-midnight.netlify.app/](https://silentpass-midnight.netlify.app/) | Live and Operational |
| **In-Browser Admin / Deployer** | Production Web (Netlify) | [https://silentpass-midnight.netlify.app/admin](https://silentpass-midnight.netlify.app/admin) | Live and Operational |

---

## Interface Screenshots

#### 1. In-Browser Contract Deployer and Admin Portal
Facilitates one-click deployment directly from connected Midnight browser wallets (1AM / Lace) to Preprod or Preview networks with automated provider configuration.

![Admin Deployer Portal](sub%20assets/ui1.png)

---

#### 2. Zero-Knowledge Document Verification and Credential Issuance
Holders verify identity attributes with the issuer authority. Attributes are cryptographically hashed into an opaque commitment with random salt, ensuring personal data never leaves the client device.

![ZK Verification and Credential Issuance](sub%20assets/ui2.png)

---

#### 3. Identity Proof and Verification Console
Real-time proof verification interface featuring scoped nullifiers, block explorer transaction verification, privacy audit indicators, and cryptographic receipt exports.

![Identity Proof Console](sub%20assets/ui3.png)

---

## How it Works: Public State vs Private Witness

SilentPass enforces a strict architectural boundary between on-chain ledger state and client-side private witnesses:

| Data Element | Public Ledger State | Private Client Witness | Cryptographic Privacy Guarantee |
| :--- | :--- | :--- | :--- |
| **Holder Identity** | None (credential commitment is opaque) | Name, birthdate, country, document bytes | Personal data is never stored or exposed on-chain |
| **Credential Binding** | `credentialCommitment` hash | Secret key, credential salt | Unlinkable to wallet address or public identifier |
| **Uniqueness / Anti-Sybil** | `enrollmentNullifier` (deterministic per secret key) | Secret key (`sk`) | Domain-separated nullifier prevents duplicate registrations |
| **Age Verification** | Single boolean: `verified = true / false` | Exact birthdate (`dob`), as-of date | Evaluates `asOfDate >= dob + threshold * 10000` inside circuit |
| **Session Verification** | `sessionId` mapped to `verified` state | Session nonce and private witness | Verifiers only read the final verification flag |
| **Revocation Check** | `revocationNullifier` in revoked set | Salt used in credential commitment | Revocation status cannot be precomputed by observers |

Zero-knowledge proofs are generated locally by the user. An observer or verifier **cannot identify which credential produced the proof**, nor link verification back to the original issuance transaction.

---

## Hackathon Execution (Levels 1-4)

### Level 1: New Moon - Setup and First Contract
* **Toolchain Installation**: Configured development environment with `compactc`, Midnight TypeScript SDKs (`@midnight-ntwrk/midnight-js-*`), Vite, Docker, and Node.js 24.
* **Smart Contract Development**: Implemented [`passport.compact`](contract/src/passport.compact) with public state management (authorities, revoked credentials, session verifications) and private witnesses.
* **Circuit Compilation**: Compiled using `compact compile src/passport.compact src/managed/passport`, generating 10 zero-knowledge circuits, ledger state definitions, and verifier keys in [`contract/src/managed/passport/`](contract/src/managed/passport/):
  ```text
  Generated circuits:
    - issueCredential (credential commitment binding)
    - revoke (authority revocation nullifier)
    - addIssuer (administrative authority enrollment)
    - removeIssuer (governance authority revocation)
    - proveAgeOver (threshold age evaluation)
    - proveIdentity (selective disclosure predicate)
    - proveUniqueHuman (scoped Sybil-resistance nullifier)
    - proveResidency (ISO jurisdiction matching)
    - proveAccredited (investor qualification bit)
    - proveEligibility (composite multi-predicate gate)
  ```
* **Contract Deployments**: Successfully deployed and verified on Midnight Preprod and Preview networks:
  - **Preprod Contract**: [`a2f3e16eb2f8d0b6d678b21308f37f3dbdd1c484636bc540b256af8ee1df9c7e`](https://preprod.midnightexplorer.com/contracts/a2f3e16eb2f8d0b6d678b21308f37f3dbdd1c484636bc540b256af8ee1df9c7e)
  - **Preview Contract**: [`34b03973c1125b7bd89f2356841f1ddacc25404780f7139aebf47ce3c963c692`](https://preview.midnightexplorer.com/contracts/34b03973c1125b7bd89f2356841f1ddacc25404780f7139aebf47ce3c963c692)
* **Product Concept**: Fully documented product architecture in [`SilentPass_Idea.txt`](SilentPass_Idea.txt).

### Level 2: Waxing Crescent - Frontend Integration
* **Browser Wallet Integration**: Integrated Lace and 1AM browser wallets via `@midnight-ntwrk/dapp-connector-api`. The UI manages connection status, network detection, and automatic network negotiation.
* **Client-Side Proving**: The `useSilentPass` React hook interfaces with the deployed contract to coordinate local ZK proof generation and submit transactions.
* **Observable Privacy Behavior**: When evaluating threshold predicates (such as age 18+ or accredited investor status), exact dates and financial attributes remain entirely within client memory. Only the cryptographic proof and verification boolean reach the ledger.
* **Live Web Deployment**: Deployed production application on Netlify with automated routing and WASM MIME headers: [https://silentpass-midnight.netlify.app/](https://silentpass-midnight.netlify.app/).

### Level 3: First Quarter - Production-Grade dApp
* **Selected Problem Statement**:
  - **Confidential Credentials**: Prove credential validity without exposing underlying data.
  - **Age / Eligibility Gate**: Prove threshold qualification without disclosing exact birthdate or identity.
* **Automated Test Suite**: Headless test suite (`npm test`) validating 15 cryptographic, boundary, and multi-attribute eligibility test scenarios.
* **CI/CD Automation**: Configured GitHub Actions workflow ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) executing dependency installation, contract compilation checks, TypeScript builds, and test suites with passing runs.
* **Privacy Model Documentation**: Formalized complete specification detailing public vs private ledger boundaries.

### Level 4: Waxing Gibbous - MVP and Contract Logic
* **Production Contract Circuits**:
  - **Residency Verification (`proveResidency`)**: Proves ISO 3166-1 country code match without revealing birthdate, name, or keys.
  - **Accreditation Verification (`proveAccredited`)**: Proves accredited investor qualification bit without disclosing underlying assets.
  - **Composite Eligibility (`proveEligibility`)**: Multi-predicate gate validating age threshold, jurisdiction whitelist, and accreditation status simultaneously in a single zero-knowledge proof.
  - **Issuer Governance (`removeIssuer`)**: Administrative circuit to revoke compromised authority keys.
* **Multi-Network Support**: Live deployments maintained and tested on both Preprod and Preview.
* **Public Social Presence**: Official announcement and demonstration thread published on X: [Launch Post on X](https://x.com/amanrajbhagat11/status/2098406980679553426?s=20).

---

## Privacy Model: What an Observer Learns

Midnight uses the Kachina model for zero-knowledge smart contracts, strictly isolating public ledger state updates from private witness inputs.

### What an Observer CAN Learn (Publicly Verifiable on Chain)
1. **Issuer Attestation Event**: An observer observes that an authorized Issuer Authority published a `credentialCommitment` hash and an `enrollmentNullifier`.
2. **Session Verification Flag**: An observer sees that a specific 32-byte `sessionId` has its verification status updated to `true` (or `false`).
3. **Revocation Records**: An observer can verify whether an authority added a `revocationNullifier` to the revocation set.
4. **Transaction Metadata**: Standard blockchain metadata including block height, transaction fee, and timestamp.

### What an Observer CANNOT Learn (Cryptographically Concealed)
1. **Holder Real Identity**: The user's name, document identifier, nationality, and biometric data remain exclusively in the user's browser.
2. **Exact Age or Birthdate**: The verifier and chain learn only that `asOfDate >= birthDate + threshold * 10000`. Users of different birth years produce indistinguishable valid proofs.
3. **Unlinkability Across Venues**: Scoped nullifiers (`scopedNullifier(sk, scope)`) prevent cross-application correlation. Activity at Venue A cannot be linked to Venue B.
4. **Issuance-to-Proof Linkability**: The proof verifies valid credential existence against the commitment tree without exposing the commitment index or wallet address.

---

## Architecture

The SilentPass repository is organized as a modular monorepo:

```text
silentpass/
├── contract/        Compact smart contract (passport.compact) and compiled ZK artifacts
├── passport-sdk/    Core SDK library implementing Authority, Guest, and Verifier roles
├── packages/react/  silentpass-react, reusable React hooks and components
├── kyc-api/         Serverless Verification Authority API endpoint
├── server/          Local authority service and read-only verification gateway
├── verifier-ui/     Production frontend dApp and in-browser admin deployer
├── issuer-cli/      Headless deployment and automated on-chain verification CLI
├── scripts/         Cross-platform build, synchronization, and testing utilities
└── sub assets/      Interface screenshots and demonstration media
```

---

## Getting Started (Local Development)

**Prerequisites:** Node.js 24+, Docker, Midnight-compatible wallet (1AM or Lace), and `compactc`.

> [!TIP]
> **Acquiring Test Tokens (tNIGHT and DUST)**:
> Use your **unshielded address** (`mn_addr_...`) on the active Nethermind faucets:
> - **Preprod Faucet**: [midnight-tmnight-preprod.nethermind.dev](https://midnight-tmnight-preprod.nethermind.dev/)
> - **Preview Faucet**: [midnight-tmnight-preview.nethermind.dev](https://midnight-tmnight-preview.nethermind.dev/)

1. **Start the Midnight Proof Server**
   ```bash
   docker run -d -p 6300:6300 --name midnight-proof-server \
     midnightntwrk/proof-server:8.0.3 midnight-proof-server -v
   ```

2. **Install Dependencies and Compile**
   ```bash
   npm install
   npm run compact
   npm run build
   ```

3. **Run Automated Test Suite**
   ```bash
   npm test
   ```
   Expected output:
   ```text
   Running cryptographic scheme checks:
     [PASS] publicKey is deterministic
     [PASS] enrollment nullifier is domain-separated from scoped nullifier
     [PASS] scoped nullifier: stable per scope, unlinkable across scopes
     [PASS] revocation nullifier is salt-derived
     [PASS] commitment binds attributes and name
     [PASS] YYYYMMDD age predicate is exact at boundary
     [PASS] subject binding: commitment is tied to holder public key
     [PASS] country binding: changing country code alters commitment
     [PASS] scoped nullifier: collision-resistant across distinct holders
     [PASS] multi-threshold age gate (21+) is exact at boundary

   10/10 crypto-scheme checks passed against compiled contract.

   Running eligibility and advanced verification circuit tests:
     [PASS] accreditation bit is cryptographically bound in attributesHash
     [PASS] credential commitment preserves accreditation distinction
     [PASS] country residency matching is deterministic and sound
     [PASS] composite multi-attribute eligibility gate correctly enforces conditions
     [PASS] unlinkability guarantee across independent verifiers holds

   5/5 eligibility and composite verification tests passed.
   ```

4. **Start the Frontend Application**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## Video Demo Walkthrough

A comprehensive demonstration video showing Lace and 1AM wallet connection, contract deployment on Midnight Preprod, zero-knowledge credential issuance, and local proof evaluation:

* **Google Drive Link**: [Watch SilentPass Demonstration Video](https://drive.google.com/file/d/1foaBYehoTPS_apZJBb48Wq6qu6mCcoWl/view?usp=sharing)
* **Local Repository Backup**: [`sub assets/demo video.mp4`](sub%20assets/demo%20video.mp4)

**Key Highlights in Video:**
1. **Wallet Connection**: Seamless 1AM / Lace connection on Midnight Preprod.
2. **In-Browser Deployment**: Admin portal deploying `passport.compact` without CLI overhead.
3. **Private Witness Proof**: Proving age 18+ and residency without disclosing raw birthdate or nationality on-chain.
4. **On-Chain Verification**: Instant ledger verification visible on Midnight Explorer.

---

## License

Apache-2.0. See [LICENSE](LICENSE) for details.
