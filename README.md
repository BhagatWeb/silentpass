<div align="center">

# 🪪 SilentPass

### Prove your eligibility. Keep your identity silent.

A zero-knowledge identity credential on [Midnight](https://midnight.network) designed for exclusive online venues, age-restricted storefronts, and premium lounges.

[![npm silentpass](https://img.shields.io/npm/v/silentpass?color=a855f7&label=silentpass&logo=npm)](https://www.npmjs.com/package/silentpass)
[![npm silentpass-react](https://img.shields.io/npm/v/silentpass-react?color=a855f7&label=silentpass-react&logo=npm)](https://www.npmjs.com/package/silentpass-react)
[![X Post](https://img.shields.io/badge/X-Launch_Post-black?logo=x)](https://x.com/amanrajbhagat11/status/2098406980679553426?s=20)
[![license](https://img.shields.io/badge/license-Apache--2.0-111111)](LICENSE)
[![Midnight preprod](https://img.shields.io/badge/Midnight-preprod-1c7a4c)](https://preprod.midnightexplorer.com/contracts/a2f3e16eb2f8d0b6d678b21308f37f3dbdd1c484636bc540b256af8ee1df9c7e)
[![Midnight preview](https://img.shields.io/badge/Midnight-preview-0284c7)](https://preview.midnightexplorer.com/contracts/34b03973c1125b7bd89f2356841f1ddacc25404780f7139aebf47ce3c963c692)
[![Live Demo](https://img.shields.io/badge/Live_dApp-silentpass--midnight.netlify.app-00c7b7?logo=netlify)](https://silentpass-midnight.netlify.app/)

</div>

---

## 📑 Table of Contents
1. [Overview & Problem Statement](#-overview--problem-statement)
2. [What is SilentPass?](#-what-is-silentpass)
3. [Submission Verification Checklist](#-submission-verification-checklist)
4. [Live Deployment](#-live-deployment)
5. [Interface Screenshots](#-interface-screenshots)
6. [How it Works: Public State vs Private Witness](#-how-it-works-public-state-vs-private-witness)
7. [Hackathon Execution (Levels 1–4)](#-hackathon-execution-levels-14)
   - [Level 1: New Moon — Setup & First Contract](#level-1-new-moon--setup--first-contract)
   - [Level 2: Waxing Crescent — Frontend Integration](#level-2-waxing-crescent--frontend-integration)
   - [Level 3: First Quarter — Production-Grade dApp](#level-3-first-quarter--production-grade-dapp)
   - [Level 4: Waxing Gibbous — MVP & Contract Logic](#level-4-waxing-gibbous--mvp--contract-logic)
8. [Privacy Model: What an Observer Learns](#-privacy-model-what-an-observer-learns)
9. [Architecture](#-architecture)
10. [Getting Started (Local Development)](#-getting-started-local-development)
11. [Video Demo Walkthrough](#-video-demo-walkthrough)
12. [License](#-license)

---

## 🌍 Overview & Problem Statement

Users online are constantly forced to hand over highly sensitive personal data—such as passports, driver's licenses, and exact birthdates—to dozens of different websites just to prove their age, residency, or uniqueness. This exposes users to massive identity theft risks and forces every application to become a honeypot of regulated, sensitive data.

Current online verification systems require users to repeatedly submit highly sensitive identity documents and exact personal information to disparate web applications. This creates enormous privacy risks, increases the likelihood of data breaches, and places a heavy regulatory and security burden on organizations that are forced to securely store this confidential information.

---

## 💡 What is SilentPass?

**SilentPass** is a premium, privacy-first identity verification venue built on Midnight. 

Users verify their real-world identity once with a trusted Issuer Authority and receive a reusable cryptographic credential that stays exclusively on their own device. When an application (the Venue) needs to verify a user, they simply request a cryptographic proof. Using Midnight's zero-knowledge capabilities, the user proves they satisfy the requirements (e.g., age over 18, unique human) without ever revealing their name, exact birthdate, or raw documents.

The verifying app needs **no wallet, no proof server, and receives zero user data**—just a single cryptographic "verified" bit. SilentPass turns invasive identity checks into portable, zero-knowledge proofs, protecting users while allowing platforms to remain compliant without the liability of data collection.

---

## 📋 Submission Verification Checklist

| Requirement | How to Verify | Artifact / Link |
| :--- | :--- | :--- |
| **Live Demo dApp** | Open in browser | [silentpass-midnight.netlify.app](https://silentpass-midnight.netlify.app/) (Admin: [/admin](https://silentpass-midnight.netlify.app/admin)) |
| **Compact Contract** | Review logic & circuits | [`contract/src/passport.compact`](contract/src/passport.compact) |
| **Circuits & Keys** | Inspect directory | [`contract/src/managed/passport/`](contract/src/managed/passport/) |
| **Preview Deployment** | On-chain query | [Preview Contract on Explorer](https://preview.midnightexplorer.com/contracts/34b03973c1125b7bd89f2356841f1ddacc25404780f7139aebf47ce3c963c692) |
| **Preprod Deployment** | On-chain query | [Preprod Contract on Explorer](https://preprod.midnightexplorer.com/contracts/a2f3e16eb2f8d0b6d678b21308f37f3dbdd1c484636bc540b256af8ee1df9c7e) |
| **Passing Tests** | Run `npm test` | 10 passing tests in [`passport-sdk/src/smoke.test.mjs`](passport-sdk/src/smoke.test.mjs) |
| **CI/CD Pipeline** | GitHub Actions | [Workflow File](.github/workflows/ci.yml) & [Actions Tab](https://github.com/BhagatWeb/silentpass/actions) |
| **Wallet Integration** | Launch UI | Connect Lace / 1AM wallet in [`verifier-ui`](verifier-ui/) |
| **Privacy Claim** | Review Spec | [Privacy Model Section](#-privacy-model-what-an-observer-learns) |
| **Product Launch on X** | Public Social Announcement | [Launch Post on X](https://x.com/amanrajbhagat11/status/2098406980679553426?s=20) |

---

## 🌐 Live Deployment

| Component | Network | Address / Details | Status |
| :--- | :--- | :--- | :--- |
| **Smart Contract (Preview)** | Midnight Preview | [`34b03973c1125b7bd89f2356841f1ddacc25404780f7139aebf47ce3c963c692`](https://preview.midnightexplorer.com/contracts/34b03973c1125b7bd89f2356841f1ddacc25404780f7139aebf47ce3c963c692) | ✅ Active on-chain |
| **Smart Contract (Preprod)** | Midnight Preprod | [`a2f3e16eb2f8d0b6d678b21308f37f3dbdd1c484636bc540b256af8ee1df9c7e`](https://preprod.midnightexplorer.com/contracts/a2f3e16eb2f8d0b6d678b21308f37f3dbdd1c484636bc540b256af8ee1df9c7e) | ✅ Active on-chain |
| **Live Frontend dApp** | Production Web (Netlify) | [https://silentpass-midnight.netlify.app/](https://silentpass-midnight.netlify.app/) | ✅ Live & Operational |
| **In-Browser Admin / Deployer** | Production Web (Netlify) | [https://silentpass-midnight.netlify.app/admin](https://silentpass-midnight.netlify.app/admin) | ✅ Live & Operational |

---

## 📸 Interface Screenshots

#### 1. In-Browser Contract Deployer & Admin Portal
Enables one-click deployment directly from connected Midnight browser wallets (1AM / Lace) to the Preview network with zero CLI memory overhead.

![Admin Deployer Portal](sub%20assets/ui1.png)

---

#### 2. Zero-Knowledge Document Verification & Credential Issuance
Holder verifies identity attributes once; attributes are hashed into a commitment with random salt, keeping all raw personal data strictly on-device.

![ZK Verification & Credential Issuance](sub%20assets/ui2.png)

---

#### 3. Identity Proof & Verification Console
Real-time proof verification console with scoped nullifiers, explorer verification links, privacy guarantees, and receipt export.

![Identity Proof Console](sub%20assets/ui3.png)



## ⚙️ How it Works: Public State vs Private Witness

In SilentPass, data is strictly separated into what is publicly verified on the ledger, and what is kept as a private witness on the user's device.

| Data Point | Written to Public Ledger (Public State) | Kept on Device (Private Witness) | Privacy Guarantee |
| :--- | :--- | :--- | :--- |
| **Holder Identity** | None (credential commitment is opaque) | Name, birthdate, country, document bytes | Never exposed or stored on-chain |
| **Credential Binding** | `credentialCommitment` hash | Secret key, credential salt | Unlinkable to wallet or holder identity |
| **Uniqueness / Anti-Sybil** | `enrollmentNullifier` (deterministic per secret key) | Secret key (`sk`) | Domain-separated; prevents double-enrollment |
| **Age Verification** | Single boolean: `verified = true / false` | Exact birthdate (`dob`), as-of date | Proves `asOfDate >= dob + threshold*10000` |
| **Session State** | `sessionId` mapped to `verified` state | Session nonce & private proof witness | Ephemeral; verifier only reads final result |
| **Revocation Check** | `revocationNullifier` in revoked set | Salt used in credential commitment | Revocation state cannot be precomputed |

Membership and validity are proven locally using zero-knowledge circuits, so a verification proof **never reveals which credential produced it**, and it cannot be linked back to the original issuance transaction.

---

## 🚀 Hackathon Execution (Levels 1–4)

### Level 1: New Moon — Setup & First Contract
* **Toolchain Set Up**: Full monorepo configured with `compactc`, Midnight TypeScript SDKs (`@midnight-ntwrk/midnight-js-*`), Vite, and Node.js 24.
* **Smart Contract**: Developed [`passport.compact`](contract/src/passport.compact) with public state management (authorities, revoked credentials, session verifications) and private witnesses for identity and age thresholds.
* **Circuits Generated**: Compiled using `compact compile src/passport.compact src/managed/passport` producing 10 zero-knowledge circuits, ledger state types, and verifier keys in [`contract/src/managed/passport/`](contract/src/managed/passport/):
  ```text
  Compiling src/passport.compact -> src/managed/passport
  Generated circuits:
    ✓ issueCredential (credential commitment binding)
    ✓ revoke (authority revocation nullifier)
    ✓ addIssuer (administrative authority enrollment)
    ✓ removeIssuer (governance authority revocation)
    ✓ proveAgeOver (threshold age evaluation)
    ✓ proveIdentity (selective disclosure predicate)
    ✓ proveUniqueHuman (scoped Sybil-resistance nullifier)
    ✓ proveResidency (ISO jurisdiction match)
    ✓ proveAccredited (investor qualification bit)
    ✓ proveEligibility (composite multi-predicate gate)
  ```
* **Contract Deployment**: Deployed and verified on Midnight **Preview** and **Preprod** networks:
  - **Preview Network Deployment**:
    ```text
    34b03973c1125b7bd89f2356841f1ddacc25404780f7139aebf47ce3c963c692
    ```
    Explorer Link: [View on Midnight Preview Explorer](https://preview.midnightexplorer.com/contracts/34b03973c1125b7bd89f2356841f1ddacc25404780f7139aebf47ce3c963c692)
  - **Preprod Network Deployment**:
    ```text
    a2f3e16eb2f8d0b6d678b21308f37f3dbdd1c484636bc540b256af8ee1df9c7e
    ```
    Explorer Link: [View on Midnight Preprod Explorer](https://preprod.midnightexplorer.com/contracts/a2f3e16eb2f8d0b6d678b21308f37f3dbdd1c484636bc540b256af8ee1df9c7e)
* **Initial Product Idea**: Detailed in [`SilentPass_Idea.txt`](SilentPass_Idea.txt) and summarized in the overview section.

### Level 2: Waxing Crescent — Frontend Integration
* **Wallet Integration**: Integrated browser wallet connection using Lace and 1AM wallet via `@midnight-ntwrk/dapp-connector-api`. The UI ([`verifier-ui`](verifier-ui/)) manages connect, disconnect, network status, and balance states.
* **Frontend Circuit Calls**: The `useSilentPass` React hook coordinates interaction with the deployed contract to generate local ZK proofs (via Midnight proof-server) and submit transactions.
* **Observable Privacy Behavior**: When a user proves their age meets a threshold (e.g. 18+ or 21+), their exact birthdate and document are never transmitted over the network or written to the chain. The circuit evaluates the predicate in private state, producing only a cryptographic proof and a verified bit.
* **Live Demo dApp**: Hosted and operational on Netlify at [https://silentpass-midnight.netlify.app/](https://silentpass-midnight.netlify.app/) (with Admin Deployer at [/admin](https://silentpass-midnight.netlify.app/admin)), configured with `netlify.toml` and `vercel.json` for continuous deployment.

### Level 3: First Quarter — Production-Grade dApp
* **Live Demo URL**: [https://silentpass-midnight.netlify.app/](https://silentpass-midnight.netlify.app/)
* **Selected Problem Statement**: 
  - **Confidential Credentials** — prove a credential is valid without disclosing it.
  - **Age / Eligibility Gate** — prove an age threshold without revealing the underlying birthdate.
* **Automated Test Suite**: Comprehensive headless test suite (`npm test`) validating 10 distinct cryptographic, boundary, and tamper-resistance scenarios against the compiled contract.
* **CI/CD Pipeline**: Configured GitHub Actions workflow ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) running on both `main` and `master` branches, performing dependency installation, contract compilation checks, SDK builds, UI build verification, and test execution.
* **Privacy Model Documentation**: Comprehensive specification of what an observer can and cannot learn.

### Level 4: Waxing Gibbous — MVP & Contract Logic
* **Production Contract Logic**: Upgraded [`passport.compact`](contract/src/passport.compact) with complete privacy-preserving circuits:
  - **Residency Verification (`proveResidency`)**: Proves ISO 3166-1 country code match without revealing birthdate, name, or secret keys; records on-chain in `residencyVerifications`.
  - **Accreditation Verification (`proveAccredited`)**: Proves accredited investor status without revealing underlying financial attributes.
  - **Composite Eligibility (`proveEligibility`)**: High-throughput multi-predicate gate validating age threshold, jurisdiction whitelist, and accreditation status simultaneously in a single zero-knowledge proof.
  - **Issuer Governance (`removeIssuer`)**: Admin circuit to revoke compromised or untrusted authority public keys.
  - **Pure Circuit Helpers**: Deterministic evaluation logic for age (`isAgeEligible`) and country matching (`isCountryMatch`).
* **Live Preprod & Preview Deployments**: Tested with browser wallet integration against Preview deployment [`34b03973c1125b7bd89f2356841f1ddacc25404780f7139aebf47ce3c963c692`](https://preview.midnightexplorer.com/contracts/34b03973c1125b7bd89f2356841f1ddacc25404780f7139aebf47ce3c963c692) and Preprod deployment [`a2f3e16eb2f8d0b6d678b21308f37f3dbdd1c484636bc540b256af8ee1df9c7e`](https://preprod.midnightexplorer.com/contracts/a2f3e16eb2f8d0b6d678b21308f37f3dbdd1c484636bc540b256af8ee1df9c7e).
* **Public Product Launch (X)**: Official product launch thread live on X at [@amanrajbhagat11 Post](https://x.com/amanrajbhagat11/status/2098406980679553426?s=20).
* **CI/CD Pipeline**: GitHub Actions running on `master` branch covering contract bindings, SDK, UI build, and crypto test suites.

---

## 🔒 Privacy Model: What an Observer Learns

Midnight uses the Kachina model for zero-knowledge smart contracts, separating public ledger state transitions from private witness computation.

### What an Observer CAN Learn (Publicly Verifiable on Chain)
1. **Issuer Attestation**: An observer sees that an authorized Issuer Authority published a `credentialCommitment` hash and an `enrollmentNullifier`.
2. **Session Verification Result**: An observer sees that a particular 32-byte `sessionId` has its verification status set to `true` (or `false`).
3. **Revocation Events**: An observer can see if an authority adds a `revocationNullifier` to the revocation set.
4. **Contract Interaction Gas & Timestamp**: Standard blockchain metadata (block height, transaction fee, and timestamp).

### What an Observer CANNOT Learn (Cryptographically Concealed)
1. **The Holder's Real Identity**: The user's name, document number, country of citizenship, and image never leave the user's browser.
2. **The User's Exact Age or Birthdate**: The verifier and chain only learn that `asOfDate >= birthDate + threshold*10000`. A user born in 1980 and a user born in 2005 produce an indistinguishable proof of being 18+.
3. **Unlinkability Across Venues**: Scoped nullifiers (`scopedNullifier(sk, scope)`) prevent tracking. A user visiting Venue A cannot be linked to the same user visiting Venue B.
4. **Issuance-to-Proof Correlation**: The verification proof does not disclose the original commitment or the holder's wallet address. It proves membership against the root without revealing the path index.

---

## 🏗 Architecture

The project is structured as a scalable monorepo:

```text
silentpass/
├── contract/        Compact contract (`passport.compact`) and compiled artifacts
├── passport-sdk/    SDK, the reusable core primitive (Authority / Guest / Venue)
├── packages/react/  silentpass-react, the drop-in React integration
├── kyc-api/         Serverless Verification Authority function
├── server/          Local Authority plus read-only verification gateway
├── verifier-ui/     The frontend: Exclusive Venue UI and Demo
├── issuer-cli/      Headless deploy plus on-chain smoke cycle
└── scripts/         Cross-platform build helpers
```

---

## 💻 Getting Started (Local Development)

**Prerequisites:** Node 24+, Docker, a Midnight compatible wallet (Lace / 1AM), and `compactc`.

> [!TIP]
> **Getting Test Tokens (tNIGHT & DUST)**:
> Use your **unshielded address** (`mn_addr_...`) from Lace or 1AM on the active Nethermind faucets:
> - **Preprod Faucet**: [midnight-tmnight-preprod.nethermind.dev](https://midnight-tmnight-preprod.nethermind.dev/)
> - **Preview Faucet**: [midnight-tmnight-preview.nethermind.dev](https://midnight-tmnight-preview.nethermind.dev/)


1. **Start the Midnight Proof Server**
   ```bash
   docker run -d -p 6300:6300 --name midnight-proof-server \
     midnightntwrk/proof-server:8.0.3 midnight-proof-server -v
   ```

2. **Install dependencies and compile**
   ```bash
   npm install
   npm run compact
   npm run build
   ```

3. **Run automated tests**
   ```bash
   npm test
   ```
   Expected output:
   ```text
     ✓ publicKey is deterministic
     ✓ enrollment nullifier is domain-separated from scoped nullifier
     ✓ scoped nullifier: stable per scope, unlinkable across scopes
     ✓ revocation nullifier is salt-derived (not precomputable from public commitment)
     ✓ commitment binds attributes + name (reproducible + tamper-evident)
     ✓ YYYYMMDD age predicate is exact at the boundary
     ✓ subject binding: commitment is tied to holder public key
     ✓ country binding: changing country code alters commitment
     ✓ scoped nullifier: collision-resistant across distinct holders in same scope
     ✓ multi-threshold age gate (21+) is exact at boundary

   10/10 crypto-scheme checks passed against the compiled contract.
   Running eligibility & advanced verification circuit tests:
     ✓ accreditation bit is cryptographically bound in attributesHash
     ✓ credential commitment preserves accreditation distinction
     ✓ country residency matching is deterministic and sound
     ✓ composite multi-attribute eligibility gate correctly enforces all conditions
     ✓ unlinkability guarantee across independent verifiers holds

   5/5 eligibility and composite verification tests passed.
   ```

4. **Start the Exclusive Venue UI**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 🎥 Video Demo Walkthrough

A 1-minute full demonstration video showing Lace / 1AM wallet connection, contract deployment on Preprod, credential issuance, and successful zero-knowledge circuit evaluation:

[![Demo Video](https://img.shields.io/badge/Demo_Video-Watch_Walkthrough-e11d48)](sub%20assets/demo%20video.mp4)

Direct repository video: [`sub assets/demo video.mp4`](sub%20assets/demo%20video.mp4)

> **Key Highlights in Demo:**
> 1. **Wallet Connect**: Instant Lace / 1AM connection on Midnight Preview.
> 2. **In-Browser Deployment**: Admin portal deploying `passport.compact` without CLI overhead.
> 3. **Private Witness Proof**: Proving age 18+ and residency without disclosing raw birthdate or country on-chain.
> 4. **On-Chain Explorer Verification**: Instant verification visible on Midnight Explorer.

---

## 📄 License

Apache-2.0. See [LICENSE](LICENSE) for details.
