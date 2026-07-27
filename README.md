<div align="center">

# SilentPass

### Prove your eligibility. Keep your identity silent.

A zero-knowledge identity credential on [Midnight](https://midnight.network) designed for exclusive online venues, age-restricted storefronts, and premium lounges.

A guest verifies their real-world identity once, holds the credential privately on their own device, and proves their eligibility to enter any venue. The venue learns a single bit — `verified` — and never sees the guest's name, birthdate, or document.

[![npm silentpass](https://img.shields.io/npm/v/silentpass?color=a855f7&label=silentpass&logo=npm)](https://www.npmjs.com/package/silentpass)
[![npm silentpass-react](https://img.shields.io/npm/v/silentpass-react?color=a855f7&label=silentpass-react&logo=npm)](https://www.npmjs.com/package/silentpass-react)
[![CI](https://github.com/npmdeep/silentpass/actions/workflows/ci.yml/badge.svg)](https://github.com/npmdeep/silentpass/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-Apache--2.0-111111)](LICENSE)
[![Midnight preprod](https://img.shields.io/badge/Midnight-preprod-1c7a4c)](https://midnight.network)

</div>

---

## Initial Product Idea

SilentPass is a premium, privacy-first identity verification venue built on Midnight. Users verify their real-world identity once with a trusted Issuer Authority and receive a reusable cryptographic credential that stays exclusively on their own device. When an application (the Venue) needs to verify a user, they simply request a cryptographic proof. Using Midnight's zero-knowledge capabilities, the user proves they satisfy the requirements (e.g., age over 18) without ever revealing their name, exact birthdate, or raw documents.

## What is SilentPass?

SilentPass turns invasive identity checks into portable, zero-knowledge proofs. Instead of handing your passport to every bouncer on the internet, you pass a verification check once with a Verification Authority. After that, any Venue can confirm you meet their criteria (e.g., you are 18+, or you are a unique human) without ever receiving your underlying data.

The verifying Venue needs **no wallet, no proof server, and no user data**. It needs only an indexer connection, a contract address, and a 32-byte session id.

## Public State vs Private Witness

In SilentPass, data is strictly separated into what is publicly verified on the ledger, and what is kept as a private witness on the user's device. 
- **Public State:** Only the credential commitments (an opaque hash), enrollment nullifiers, and a boolean `verified` result for a specific session are stored publicly.
- **Private Witness:** The user's actual attributes (Name, Birthdate, Document), secret keys, and credential salt are never published. They act as private witnesses injected into the zero-knowledge circuit during local proof generation. The network validates the proof without ever seeing these witnesses.

## How it works

| Written to the public ledger | Never leaves the Guest's device |
| --- | --- |
| Credential commitment (an opaque hash) | Name, birthdate, country, document |
| Enrollment nullifier (dedup marker) | The Guest's secret key |
| `sessionId` to `verified` result | The credential salt |
| Authority public keys, revocation nullifiers | The Merkle path used inside the proof |

Membership is proven against a Merkle root, so a proof does not reveal which credential produced it, and it cannot be linked back to issuance.

## Monorepo Architecture

```
contract/        Compact contract (`silentpass.compact`) and compiled artifacts
passport-sdk/    silentpass SDK, the reusable core primitive (Authority / Guest / Venue)
packages/react/  silentpass-react, the drop-in React integration
kyc-api/         Serverless Verification Authority function (Mock/Groq)
server/          Local Authority plus read-only verification gateway
verifier-ui/     The frontend: the Exclusive Venue UI and Demo
issuer-cli/      Headless deploy plus on-chain smoke cycle
scripts/         Cross-platform build helpers
```

## Running Locally

Prerequisites: Node 24 or newer, Docker, a Midnight wallet, and `compactc 0.31.x`.

```bash
# 1. Start the Midnight Proof Server
docker run -d -p 6300:6300 --name midnight-proof-server \
  midnightntwrk/proof-server:8.0.3 midnight-proof-server -v

# 2. Install dependencies and compile
npm install
npm run compact
npm run build

# 3. Start the Exclusive Venue UI
npm run dev
```

## Live Deployment

| Network | Contract Address |
| --- | --- |
| Midnight Preprod | `1904b5a37fdcc8eeb62a479e9924de30b51d0e227bc43b045b21806254f994ba` |

> Live demo: [silentpass.vercel.app](https://silentpass.vercel.app)

## Running Tests

```bash
npm test
# Runs 6/6 crypto-scheme checks against compiled ZK circuits:
#   ✓ publicKey is deterministic
#   ✓ enrollment nullifier is domain-separated from scoped nullifier
#   ✓ scoped nullifier: stable per scope, unlinkable across scopes
#   ✓ revocation nullifier is salt-derived (not precomputable from public commitment)
#   ✓ commitment binds attributes + name (reproducible + tamper-evident)
#   ✓ YYYYMMDD age predicate is exact at the boundary
```

## Security & Privacy

Privacy in SilentPass is enforced at the protocol level using Midnight's Kachina model:
- **Private state:** Attributes are kept on the holder's device as first-class protocol citizens.
- **`disclose()` discipline:** Every value that reaches the ledger is explicitly acknowledged.
- **Local proving:** Proofs are generated on the user's machine, so private data never touches a server.

### Privacy Claim (Level 2)
An observable privacy behavior is demonstrated when a user successfully proves their age is over a threshold. The credential's underlying attributes (like exact birthdate) are *never* shown or transmitted. The circuit proves the mathematical threshold locally and only reveals a verifiable cryptographic confirmation.

### Privacy Model: What an observer can and cannot learn (Level 3)
When examining the SilentPass contract on the public ledger:
- **An observer CAN learn**: That *someone* was issued a credential by an Authority (via public commitment), and that a particular `sessionId` was marked as `verified = true` or `verified = false`.
- **An observer CANNOT learn**: The name, age, birthdate, or country of the user. Furthermore, because proof of membership is generated against a Merkle root, an observer cannot link a verification proof back to the original issuance transaction or to the user's wallet address.

## Links

- 🐦 X / Twitter: [@SilentPassZK](https://x.com/SilentPassZK)
- 📖 Docs: [silentpass.vercel.app/docs](https://silentpass.vercel.app/docs)
- 💻 GitHub: [npmdeep/silentpass](https://github.com/npmdeep/silentpass)

## License
Apache-2.0. See [LICENSE](LICENSE).
