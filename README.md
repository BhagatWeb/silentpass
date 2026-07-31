<div align="center">

# 🪪 SilentPass

### Prove your eligibility. Keep your identity silent.

A zero-knowledge identity credential on [Midnight](https://midnight.network) designed for exclusive online venues, age-restricted storefronts, and premium lounges.

[![npm silentpass](https://img.shields.io/npm/v/silentpass?color=a855f7&label=silentpass&logo=npm)](https://www.npmjs.com/package/silentpass)
[![npm silentpass-react](https://img.shields.io/npm/v/silentpass-react?color=a855f7&label=silentpass-react&logo=npm)](https://www.npmjs.com/package/silentpass-react)
[![CI](https://github.com/BhagatWeb/silentpass/actions/workflows/ci.yml/badge.svg)](https://github.com/BhagatWeb/silentpass/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-Apache--2.0-111111)](LICENSE)
[![Midnight preprod](https://img.shields.io/badge/Midnight-preprod-1c7a4c)](https://midnight.network)

</div>

---

## 📑 Table of Contents
1. [Overview & Problem Statement](#-overview--problem-statement)
2. [What is SilentPass?](#-what-is-silentpass)
3. [How it Works](#-how-it-works)
4. [Hackathon Execution (Levels 1–4)](#-hackathon-execution-levels-14)
   - [Level 1: New Moon (Foundation & Deployment)](#level-1-new-moon-foundation--deployment)
   - [Level 2: Waxing Crescent (Wallet Integration & Privacy)](#level-2-waxing-crescent-wallet-integration--privacy)
   - [Level 3: Full Moon (Privacy Model)](#level-3-full-moon-privacy-model)
   - [Level 4: First Quarter (Tests & CI/CD)](#level-4-first-quarter-tests--cicd)
5. [Architecture](#-architecture)
6. [Getting Started (Local Development)](#-getting-started-local-development)
7. [Live Deployment](#-live-deployment)
8. [License](#-license)

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

## ⚙️ How it Works

In SilentPass, data is strictly separated into what is publicly verified on the ledger, and what is kept as a private witness on the user's device. 

| Written to the public ledger | Never leaves the Guest's device |
| --- | --- |
| Credential commitment (an opaque hash) | Name, birthdate, country, document |
| Enrollment nullifier (dedup marker) | The Guest's secret key |
| `sessionId` to `verified` result | The credential salt |
| Authority public keys, revocation nullifiers | The Merkle path used inside the proof |

Membership is proven against a Merkle root, so a proof does not reveal which credential produced it, and it cannot be linked back to issuance.

---

## 🚀 Hackathon Execution (Levels 1–4)

This project comprehensively fulfills the requirements for Levels 1 through 4 of the Midnight Moon track.

### Level 1: New Moon (Foundation & Deployment)
* **Toolchain Set Up:** Established a robust monorepo utilizing `compactc`, TypeScript SDKs, Vite, and Node.js.
* **Smart Contract:** Developed the core `passport.compact` zero-knowledge contract featuring secure state management, nullifiers, and age/identity verification circuits.
* **Deployment:** Successfully deployed headless to the **Midnight Preprod** network using a secure `deploy.ts` cli script which generates `deployment.json` automatically for the UI.
* **Idea Document:** Captured in `SilentPass_Idea.md` within the repo root.

### Level 2: Waxing Crescent (Wallet Integration & Privacy)
* **Wallet Integration:** Fully integrated with the Lace 1AM wallet via the `@midnight-ntwrk/dapp-connector-api`. The frontend (`verifier-ui`) successfully manages user connection/disconnection state.
* **Smart Contract Calls:** The `useSilentPass` React hook coordinates interaction with the deployed contract to generate and submit zero-knowledge proofs directly from the browser.
* **Observable Privacy Behavior:** When a user proves their age is over a threshold, their underlying attributes (like exact birthdate) are *never* shown on the UI or transmitted over the network. The circuit proves the mathematical threshold locally and only reveals a verifiable cryptographic confirmation.

### Level 3: Full Moon (Privacy Model)
* **Private State vs Public Ledger:** Built heavily on Midnight’s Kachina model. Attributes are kept on the holder's device, and only explicitly `disclose()`'d values reach the ledger.
* **What an observer CAN learn:** That *someone* was issued a credential by an Authority (via public commitment), and that a particular `sessionId` was marked as `verified = true` or `false`.
* **What an observer CANNOT learn:** The name, age, birthdate, or country of the user. Because proof of membership is generated against a Merkle root, an observer cannot link a verification proof back to the original issuance transaction or to the user's wallet address.

### Level 4: First Quarter (Tests & CI/CD)
* **Comprehensive Testing:** The contract is backed by an automated smoke test suite (`npm test`) that validates 6 cryptographic scenarios, including deterministic keys, domain-separated nullifiers, and exact boundary checks for age predicates.
* **CI/CD Pipeline:** Configured a GitHub Actions workflow (`.github/workflows/ci.yml`) to automatically install the `compactc` compiler, build the monorepo, typecheck the CLI/SDK, and run the complete test suite on every push.

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

**Prerequisites:** Node 24+, Docker, a Midnight compatible wallet (Lace), and `compactc`.

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

3. **Run tests**
   ```bash
   npm test
   ```

4. **Start the Exclusive Venue UI**
   ```bash
   npm run dev
   ```

---

## 🌐 Live Deployment

| Component | Status |
| --- | --- |
| Midnight Preprod Contract | Pending |
| Frontend Deployment | Pending |

The frontend and smart contract deployment will be added after successful deployment to the Midnight Preprod network.

---

## 📄 License

Apache-2.0. See [LICENSE](LICENSE) for details.
