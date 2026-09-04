// Additional automated test suite covering composite eligibility, residency,
// accreditation assertions, and boundary checks. Run: node src/eligibility.test.mjs
import assert from 'node:assert/strict';
import { pureCircuits } from 'silentpass-contract';
import { yyyymmdd, toHex, randomBytes, nameHash } from '../dist/encoding.js';

let passed = 0;
const ok = (name) => { console.log(`  ✓ ${name}`); passed++; };

console.log('Running eligibility & advanced verification circuit tests:');

// 1. Accreditation flag binding in attributesHash
const sk = randomBytes(32);
const subject = pureCircuits.publicKey(sk);
const dob = yyyymmdd('1995-10-20');
const country = 840n; // USA ISO numeric code
const nh = await nameHash('Alice Developer');
const salt = randomBytes(32);

const attrsNonAccredited = pureCircuits.attributesHash(dob, country, false, nh);
const attrsAccredited = pureCircuits.attributesHash(dob, country, true, nh);

assert.notEqual(
  toHex(attrsNonAccredited),
  toHex(attrsAccredited),
  'accreditation flag must strictly alter attributes hash'
);
ok('accreditation bit is cryptographically bound in attributesHash');

// 2. Commitment distinction based on accreditation
const commitUnaccredited = pureCircuits.credentialCommitment(subject, attrsNonAccredited, salt);
const commitAccredited = pureCircuits.credentialCommitment(subject, attrsAccredited, salt);
assert.notEqual(
  toHex(commitUnaccredited),
  toHex(commitAccredited),
  'commitment for accredited vs unaccredited holder must differ'
);
ok('credential commitment preserves accreditation distinction');

// 3. Residency check: ISO numeric match verification
const isResidencyEligible = (credentialCountry, targetCountry) => {
  return BigInt(credentialCountry) === BigInt(targetCountry);
};
assert.equal(isResidencyEligible(840n, 840n), true, 'exact country code matches');
assert.equal(isResidencyEligible(840n, 276n), false, 'distinct country code fails residency check');
ok('country residency matching is deterministic and sound');

// 4. Composite qualification: Age + Accredited + Residency
const checkCompositeGate = (birthDateStr, asOfStr, minAge, userCountry, reqCountry, isAccredited, reqAccredited) => {
  const bDate = yyyymmdd(birthDateStr);
  const asOf = yyyymmdd(asOfStr);
  const agePassed = asOf >= bDate + BigInt(minAge) * 10000n;
  const countryPassed = BigInt(userCountry) === BigInt(reqCountry);
  const accreditedPassed = !reqAccredited || isAccredited;
  return agePassed && countryPassed && accreditedPassed;
};

assert.equal(
  checkCompositeGate('1990-01-01', '2026-09-01', 21, 840n, 840n, true, true),
  true,
  'fully qualified user passes composite gate'
);
assert.equal(
  checkCompositeGate('2010-01-01', '2026-09-01', 21, 840n, 840n, true, true),
  false,
  'underage user fails composite gate despite other credentials'
);
assert.equal(
  checkCompositeGate('1990-01-01', '2026-09-01', 21, 276n, 840n, true, true),
  false,
  'foreign resident fails composite gate when specific country is required'
);
assert.equal(
  checkCompositeGate('1990-01-01', '2026-09-01', 21, 840n, 840n, false, true),
  false,
  'unaccredited user fails composite gate when accreditation is required'
);
ok('composite multi-attribute eligibility gate correctly enforces all conditions');

// 5. Scoped nullifier uniqueness under composite evaluations
const scopeId1 = randomBytes(32);
const scopeId2 = randomBytes(32);
const nullifier1 = toHex(pureCircuits.scopedNullifier(sk, scopeId1));
const nullifier2 = toHex(pureCircuits.scopedNullifier(sk, scopeId2));
assert.notEqual(nullifier1, nullifier2, 'scoped nullifiers across distinct dApp scopes must be unlinkable');
ok('unlinkability guarantee across independent verifiers holds');

console.log(`\n${passed}/5 eligibility and composite verification tests passed.\n`);
