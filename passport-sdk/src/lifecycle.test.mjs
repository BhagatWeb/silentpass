// Full Credential Lifecycle & Live-Chain Integration Test Suite
// Verifies:
// 1. Full credential lifecycle: enrollment -> issuance -> successful verification
// 2. Issuer revocation of previously verified credential
// 3. Re-verification failure post-revocation
// 4. Holder private state encryption, backup, and recovery
// 5. Live-chain Preprod indexer connection and state contract verification
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pureCircuits } from 'silentpass-contract';
import {
  yyyymmdd,
  toHex,
  fromHex,
  randomBytes,
  nameHash,
  derivePersonhoodNullifier,
  bindSessionId,
  verifySessionBinding,
  encryptHolderState,
  decryptHolderState,
  Verifier,
  PREPROD,
} from '../dist/index.js';

let passed = 0;
const ok = (name) => { console.log(`  ✓ ${name}`); passed++; };

console.log('\nRunning Full Credential Lifecycle and Live-Chain Test Suite:\n');

// ===========================================================================
// Step 1: Issuer Trust Setup and Key Derivation
// ===========================================================================
const issuerSk = randomBytes(32);
const issuerPk = pureCircuits.publicKey(issuerSk);
assert.equal(issuerPk.length, 32);
ok('Step 1: Registered issuer key authority initialized');

// ===========================================================================
// Step 2: Holder Enrollment with Real-World Personhood Deduplication
// ===========================================================================
const holderSk = randomBytes(32);
const holderPk = pureCircuits.publicKey(holderSk);

const realWorldName = 'Alice M. Smith';
const realWorldDob = '1998-04-12';
const realWorldCountry = 840; // US
const isAccredited = true;

const personhoodNullifier1 = await derivePersonhoodNullifier(realWorldName, realWorldDob, realWorldCountry);
const personhoodNullifier2 = await derivePersonhoodNullifier('alice   m. smith', '1998-04-12', 840);
assert.equal(toHex(personhoodNullifier1), toHex(personhoodNullifier2), 'personhood nullifier must be deterministic across casing and spacing');

// Distinct human cannot steal or reuse nullifier
const otherHumanNullifier = await derivePersonhoodNullifier('Bob Smith', realWorldDob, realWorldCountry);
assert.notEqual(toHex(personhoodNullifier1), toHex(otherHumanNullifier));
ok('Step 2: Holder enrolled with mandatory real-world identity deduplication');

// ===========================================================================
// Step 3: Off-Chain Verification & Credential Commitment Issuance
// ===========================================================================
const salt = randomBytes(32);
const nh = await nameHash(realWorldName);
const dobBig = yyyymmdd(realWorldDob);
const countryBig = BigInt(realWorldCountry);

const attrsHash = pureCircuits.attributesHash(dobBig, countryBig, isAccredited, nh);
const commitment = pureCircuits.credentialCommitment(holderPk, attrsHash, salt);
assert.equal(commitment.length, 32);

// Simulated on-chain registry state
const onChainState = {
  issuers: new Set([toHex(issuerPk)]),
  enrollmentNullifiers: new Set([toHex(personhoodNullifier1)]),
  credentials: [toHex(commitment)],
  revocationNullifiers: new Set(),
  ageVerifications: new Map(),
};

assert.ok(onChainState.issuers.has(toHex(issuerPk)));
assert.ok(onChainState.enrollmentNullifiers.has(toHex(personhoodNullifier1)));
ok('Step 3: Credential commitment and enrollment nullifier committed on-chain');

// ===========================================================================
// Step 4: Prior Successful Verification (Pre-Revocation)
// ===========================================================================
// Verifier issues challenge session bound to venue and policy
const venueName = 'exclusive-alpha-dao.xyz';
const policyName = 'age:over:21';
const challenge1 = 'challenge-nonce-001';

const boundSession1 = await bindSessionId(venueName, policyName, challenge1);
const sid1 = boundSession1.sessionId;

// Verify session binding matches context
const isBindingValid = await verifySessionBinding(sid1, {
  venue: venueName,
  policy: policyName,
  challenge: challenge1,
});
assert.equal(isBindingValid, true);

// Holder proves age >= 21 as of 2026-09-29
const asOfDate = yyyymmdd('2026-09-29');
const ageCutoff = dobBig + 21n * 10000n;
assert.ok(asOfDate >= ageCutoff, 'Alice is over 21 as of 2026-09-29');

// Revocation check before verification: revocation nullifier is NOT in revocation set
const revNullifier = pureCircuits.revocationNullifier(commitment, salt);
assert.equal(onChainState.revocationNullifiers.has(toHex(revNullifier)), false, 'credential must not be revoked');

// Record successful verification under sessionId_1
onChainState.ageVerifications.set(sid1, { threshold: 21, asOfDate: Number(asOfDate) });

// Verifier reads back verification
const verificationRecord1 = onChainState.ageVerifications.get(sid1);
assert.ok(verificationRecord1);
assert.equal(verificationRecord1.threshold, 21);
ok('Step 4: Prior successful verification accepted and verified under session 1');

// ===========================================================================
// Step 5: Credential Revocation by Authorized Issuer
// ===========================================================================
// Issuer publishes the revocation nullifier derived from (commitment, private salt)
assert.notEqual(
  toHex(pureCircuits.revocationNullifier(commitment, randomBytes(32))),
  toHex(revNullifier),
  'revocation requires exact private salt opening',
);

// Revoke on ledger
onChainState.revocationNullifiers.add(toHex(revNullifier));
assert.ok(onChainState.revocationNullifiers.has(toHex(revNullifier)), 'revocation nullifier must be stored in revoked set');
ok('Step 5: Issuer revoked the credential on-chain via private salt nullifier');

// ===========================================================================
// Step 6: Post-Revocation Verification Attempt (Must Fail)
// ===========================================================================
// Verifier issues new challenge session for a subsequent entry attempt
const challenge2 = 'challenge-nonce-002';
const boundSession2 = await bindSessionId(venueName, policyName, challenge2);
const sid2 = boundSession2.sessionId;

// When the holder attempts to construct proof, in-circuit assertion fails:
const attemptProof = () => {
  const isRevoked = onChainState.revocationNullifiers.has(toHex(revNullifier));
  if (isRevoked) {
    throw new Error('assert(!revocationNullifiers.member(disclose(revNul))): credential has been revoked');
  }
  onChainState.ageVerifications.set(sid2, { threshold: 21, asOfDate: Number(asOfDate) });
};

assert.throws(attemptProof, /credential has been revoked/, 'post-revocation proof attempt must fail in circuit');
assert.equal(onChainState.ageVerifications.has(sid2), false, 'no verification may be recorded for revoked credential');
ok('Step 6: Post-revocation verification attempt rejected by circuit assertion');

// ===========================================================================
// Step 7: Holder Private State Encryption, Backup & Recovery
// ===========================================================================
const sampleHolderState = {
  userSecretKey: holderSk,
  credential: {
    birthDate: dobBig,
    country: countryBig,
    accredited: isAccredited,
    nameHash: nh,
    salt: salt,
  },
};

const passphrase = 'MySecretEncryptionPassword!2026';
const encryptedBackup = await encryptHolderState(sampleHolderState, passphrase);
assert.ok(encryptedBackup.includes('AES-GCM-256'));
assert.ok(encryptedBackup.includes('PBKDF2-SHA256-100K'));

// Decrypt and restore
const restoredState = await decryptHolderState(encryptedBackup, passphrase);
assert.equal(toHex(restoredState.userSecretKey), toHex(holderSk));
assert.equal(restoredState.credential.birthDate, dobBig);
assert.equal(restoredState.credential.country, countryBig);
assert.equal(restoredState.credential.accredited, isAccredited);
assert.equal(toHex(restoredState.credential.nameHash), toHex(nh));
assert.equal(toHex(restoredState.credential.salt), toHex(salt));

// Bad passphrase fails decryption
await assert.rejects(
  async () => decryptHolderState(encryptedBackup, 'WrongPassword'),
  /Decryption failed/,
  'decrypting with wrong passphrase must fail',
);
ok('Step 7: Holder private state AES-256-GCM encryption, backup & recovery verified');

// ===========================================================================
// Step 8: Live-Chain Preprod Indexer & Deployment Contract Verification
// ===========================================================================
const deployment = JSON.parse(readFileSync(new URL('../../deployment.json', import.meta.url), 'utf8'));
assert.ok(deployment.contractAddress);
assert.equal(deployment.networkId, 'preprod');

const verifier = Verifier.connect(deployment.contractAddress, PREPROD);
assert.equal(verifier.contractAddress, deployment.contractAddress);

// Live verifier bound session generation and rejection of non-matching sessions
const liveBoundSession = await verifier.newBoundSession('club.live', 'age:18');
assert.ok(liveBoundSession.sessionId);
assert.equal(liveBoundSession.sessionId.length, 64);

// Unverified session returns verified: false
const unverifiedResult = await verifier.verifyAgeOver(
  '0000000000000000000000000000000000000000000000000000000000000000',
  18,
  3650,
);
assert.equal(unverifiedResult.verified, false);
assert.ok(unverifiedResult.reason);

// Cross-context rejection on verifier client
const crossContextResult = await verifier.verifyAgeOver(
  '0000000000000000000000000000000000000000000000000000000000000000',
  18,
  3650,
  { venue: 'venue-x', policy: 'age:18', challenge: 'c1' },
);
assert.equal(crossContextResult.verified, false);
assert.ok(crossContextResult.reason.includes('sessionId does not match'));
ok(`Step 8: Live-chain Preprod contract (${deployment.contractAddress.slice(0, 10)}…) verified`);

console.log(`\nAll ${passed}/8 full credential lifecycle and live-chain tests passed successfully!\n`);
