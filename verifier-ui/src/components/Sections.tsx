import { useState } from 'react';
import { contractUrl } from '../lib/format.js';
import { CodeWindow } from './Code.js';

const CONTRACT = 'a2f3e16eb2f8d0b6d678b21308f37f3dbdd1c484636bc540b256af8ee1df9c7e';

const STEPS = [
  {
    n: '01',
    title: 'The Issuer verifies you once',
    body: 'A trusted Verification Issuer reads your government ID with a vision model, checks it against your name, and attests. It writes only a commitment to the chain, and never stores the document.',
    meta: 'writes a commitment',
  },
  {
    n: '02',
    title: 'You hold it privately',
    body: 'Your birthdate, country, and keys live in your private state. They become witnesses to proofs generated on your own machine. They never travel.',
    meta: 'holds the secret',
  },
  {
    n: '03',
    title: 'Any Verifier verifies',
    body: 'A Verifier hands you a random session id and asks for a proof. It reads back a verified result from the indexer, with no wallet and no access to your data.',
    meta: 'reads a verified result',
  },
];

export function HowItWorks() {
  return (
    <section className="section" id="how">
      <div className="wrap">
        <div className="section__head center" data-reveal>
          <p className="kicker">How it works</p>
          <h2>Three roles, one credential, zero leakage.</h2>
          <p>
            Privacy is load bearing, not decorative. Midnight keeps your attributes on your own
            device, and Compact makes every value that reaches the chain explicit, so nothing leaks
            by accident.
          </p>
        </div>
        <div className="steps3" data-reveal-group>
          {STEPS.map((s) => (
            <div className="stepc" data-reveal key={s.n}>
              <div className="stepc__hd">
                <span className="stepc__n">{s.n}</span>
                <span className="stepc__rule" />
              </div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
              <div className="stepc__meta">{s.meta}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Why() {
  return (
    <section className="section section--paper2" id="why">
      <div className="wrap split">
        <div className="split__text" data-reveal>
          <p className="kicker">Why it must be on Midnight</p>
          <h2>One deployment. Every app. A single bit.</h2>
          <p>
            The silentpass contract is deployed once and becomes a shared primitive. Membership is
            proven against a Merkle root, so a proof never reveals which credential it uses. Proofs
            cannot be linked back to issuance.
          </p>
          <ul className="checks">
            <li>Age today. Residency, accreditation, and unique humanity are already designed in.</li>
            <li>The revocation nullifier is derived from a private salt, so no observer can link a proof to its issuance.</li>
            <li>The unique human nullifier is scoped per app, so it cannot be correlated across services.</li>
            <li>Every secret is read once and threaded through, so a forged proof is impossible.</li>
          </ul>
        </div>
        <div className="split__code" data-reveal>
          <CodeWindow
            file="venue.ts"
            lang="ts"
            code={`// a verifier needs only an indexer connection
import { Verifier } from 'silentpass';

const v = Verifier.connect(CONTRACT);
const session = v.newSessionId();
// hand the session to the user to prove against

const { verified } =
  await v.verifyIdentity(session, 18);
// name matched and age >= 18. One bit, no data.`}
          />
        </div>
      </div>
    </section>
  );
}

export function Install() {
  return (
    <section className="section" id="install">
      <div className="wrap">
        <div className="section__head center" data-reveal>
          <p className="kicker">Install</p>
          <h2>Plug it into your stack.</h2>
          <p>
            A small, well typed TypeScript surface. Copy a block, point it at the contract, ship a
            gate. Full guides live in the <a href="/docs">documentation</a>.
          </p>
        </div>
        <div className="pkgs pkgs--2" data-reveal-group>
          <div className="pkg" data-reveal>
            <div className="pkg__top">
              <span className="pkg__name">silentpass</span>
              <span className="pkg__eco">npm</span>
            </div>
            <p className="pkg__desc">The core primitive: Issuer, Holder, and Verifier.</p>
            <CodeWindow file="terminal" lang="bash" code={`npm i silentpass`} />
            <CodeWindow
              file="verify.ts"
              lang="ts"
              code={`const v = Verifier.connect(CONTRACT);
const session = v.newSessionId();
// the user proves name + age on their device
const { verified } =
  await v.verifyIdentity(session, 18);`}
            />
          </div>
          <div className="pkg" data-reveal>
            <div className="pkg__top">
              <span className="pkg__name">silentpass-react</span>
              <span className="pkg__eco">npm</span>
            </div>
            <p className="pkg__desc">A drop-in identity gate for any React app.</p>
            <CodeWindow file="terminal" lang="bash" code={`npm i silentpass-react silentpass`} />
            <CodeWindow
              file="Gate.tsx"
              lang="tsx"
              code={`import { ProveAgeGate } from 'silentpass-react';

<ProveAgeGate
  contractAddress={CONTRACT}
  connect={connectWallet}
  threshold={18}>
  <MembersOnly />
</ProveAgeGate>`}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function Docs() {
  return (
    <section className="section section--paper2">
      <div className="wrap">
        <div className="section__head" data-reveal>
          <p className="kicker">Live and docs</p>
          <h2>It is running on preprod right now.</h2>
        </div>
        <div className="docs" data-reveal-group>
          <a className="doc" data-reveal href={contractUrl(CONTRACT)} target="_blank" rel="noreferrer">
            <div className="doc__k">deployed contract</div>
            <div className="doc__addr">{CONTRACT}</div>
            <div className="doc__cta">Open the preprod explorer</div>
          </a>
          <a className="doc" data-reveal href="#try">
            <div className="doc__k">demo</div>
            <div className="doc__big">Issue, prove, verified.</div>
            <div className="doc__cta">Run it above</div>
          </a>
          <a className="doc" data-reveal href="/docs">
            <div className="doc__k">documentation</div>
            <div className="doc__big">Guides and API reference.</div>
            <div className="doc__cta">Read the docs</div>
          </a>
        </div>
      </div>
    </section>
  );
}

const DISPATCH_POSTS = [
  {
    id: '1',
    date: '1 day ago',
    tag: 'Security & Integrity',
    title: 'Cross-Context Session Binding & Replay Prevention',
    content: '🔐 Security Upgrade: SilentPass session IDs are now cryptographically bound to (venue, policy, fresh challenge) via domain-separated SHA-256. A zero-knowledge proof produced for Venue A cannot be accepted or replayed at Venue B. Complete cross-context isolation. #ZeroKnowledge #MidnightNetwork',
    url: 'https://x.com/silentpassmid/status/2098406980679553426?s=20',
  },
  {
    id: '2',
    date: '3 days ago',
    tag: 'Holder Privacy',
    title: 'Client-Side AES-256-GCM Private State & Device Recovery',
    content: '🛡️ Holder Privacy & Recovery: Added client-side AES-GCM (256-bit) encryption key-derived via PBKDF2 (100,000 iterations). Back up your private credentials securely off-device. Lost a device? On-chain revocation instantly invalidates it across all apps without doxxing your identity. #Web3Privacy #ZK',
    url: 'https://x.com/silentpassmid',
  },
  {
    id: '3',
    date: '5 days ago',
    tag: 'Proof of Personhood',
    title: 'Real-World Identity Deduplication for Sybil Resistance',
    content: '👤 Sybil-Resistant Personhood: How to guarantee one credential per human without keeping IDs on-chain? Our Issuer Trust Model derives deterministic enrollment nullifiers from verified real-world identity attributes. 1 human = 1 credential. Unique humanity proven with per-dApp scoped nullifiers. #Identity',
    url: 'https://x.com/silentpassmid',
  },
  {
    id: '4',
    date: '6 days ago',
    tag: 'Live Preprod Testnet',
    title: 'Full Credential Lifecycle & On-Chain Revocation Verified',
    content: '⚡ Live on Midnight Preprod (9d85e7b71d…): Full credential lifecycle verified against indexers: enrollment -> issuance -> successful verification (verified ✓) -> issuer revocation -> immediate in-circuit assertion rejection on subsequent entry. Verifiable on-chain now! #MidnightPreprod',
    url: 'https://preprod.midnightexplorer.com/contracts/9d85e7b71df758f53c2782b2e1cfe513c2ca6ffb4d8f7ef2f94cfd38cd46501a',
  },
];

export function ProductUpdates() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <section className="section" id="updates">
      <div className="wrap">
        <div className="section__head center" data-reveal>
          <p className="kicker">Product Updates & Community Dispatch</p>
          <h2>Fresh from the Lab & @silentpassmid on X</h2>
          <p>
            Zero-knowledge privacy moves fast. Here are the latest architectural upgrades,
            security guarantees, and live Preprod developments shipped by the SilentPass team.
          </p>
        </div>

        <div className="updates-grid" data-reveal-group>
          {DISPATCH_POSTS.map((post) => (
            <article className="update-card" data-reveal key={post.id}>
              <div>
                <div className="update-card__top">
                  <span className="update-card__tag">{post.tag}</span>
                  <span className="update-card__date">{post.date}</span>
                </div>
                <h3>{post.title}</h3>
                <p>{post.content}</p>
              </div>
              <div className="update-card__foot">
                <a
                  className="update-card__link"
                  href={post.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>View on X ↗</span>
                </a>
                <button
                  type="button"
                  className="update-card__copy"
                  onClick={() => handleCopy(post.id, post.content)}
                >
                  {copiedId === post.id ? '✓ Copied!' : 'Copy Post'}
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="social-bar" data-reveal>
          <a
            className="btn btn--primary"
            href="https://x.com/silentpassmid"
            target="_blank"
            rel="noreferrer"
          >
            Follow @silentpassmid on X
          </a>
          <a
            className="btn btn--secondary"
            href="https://x.com/silentpassmid/status/2098406980679553426?s=20"
            target="_blank"
            rel="noreferrer"
          >
            Read the Official Launch Thread
          </a>
        </div>
      </div>
    </section>
  );
}

export function Closing() {
  return (
    <section className="closing">
      <div className="wrap" data-reveal>
        <h2 className="display">Get verified once. Enter any Verifier. Reveal nothing.</h2>
        <p>Any app can consume this credential for a verified result.</p>
        <div className="hero__cta" style={{ justifyContent: 'center' }}>
          <a className="btn btn--primary" href="#try">Try the live demo</a>
          <a className="btn btn--secondary" href="/docs">Read the docs</a>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="foot">
      <div className="wrap foot__in">
        <span>silentpass, Zero-Knowledge Age & Identity Verification for Exclusive Verifiers on Midnight</span>
        <span className="muted">preprod, Apache 2.0</span>
      </div>
    </footer>
  );
}
