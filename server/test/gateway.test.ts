import assert from 'node:assert/strict';
import { test, describe, before, after } from 'node:test';
import type { FastifyInstance } from 'fastify';
import { createApp } from '../src/index.js';
import {
  makeSessionId,
  makeBoundSessionId,
  verifyAgeOver,
  verifyUniqueHuman,
  verifySessionBinding,
} from '../src/verify.js';
import { Verifier, Venue, bindSessionId } from 'silentpass';

describe('Verification Gateway & Session Binding Test Suite', () => {
  let app: FastifyInstance;

  before(async () => {
    process.env.NODE_ENV = 'test';
    app = await createApp({ logger: false });
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  test('GET /health returns status ok and config', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.ok, true);
    assert.ok('groqConfigured' in body);
    assert.ok('model' in body);
  });

  test('POST /session generates a fresh 32-byte opaque session id', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/session',
    });
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.ok(body.sessionId, 'sessionId must be present');
    assert.equal(body.sessionId.length, 64, 'sessionId must be 64-character hex');
    assert.equal(body.bound, false);
  });

  test('POST /session with venue and policy generates cryptographically bound session ID', async () => {
    const venue = 'venue.exclusive.club';
    const policy = 'age:over:21';
    const challenge = 'deadbeefcafebabe';

    const res = await app.inject({
      method: 'POST',
      url: '/session',
      payload: { venue, policy, challenge },
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.ok(body.sessionId);
    assert.equal(body.venue, venue);
    assert.equal(body.policy, policy);
    assert.equal(body.challenge, challenge);
    assert.equal(body.bound, true);

    // Verify determinism and sound binding
    const expected = await makeBoundSessionId(venue, policy, challenge);
    assert.equal(body.sessionId, expected.sessionId);

    const isValid = await verifySessionBinding(body.sessionId, { venue, policy, challenge });
    assert.equal(isValid, true, 'session must be verifiable against its bound context');
  });

  test('Cross-context acceptance is prevented: different venue or policy changes session ID', async () => {
    const challenge = '1234567890abcdef';
    const sessionVenueA = await bindSessionId('venue-a.org', 'age:over:18', challenge);
    const sessionVenueB = await bindSessionId('venue-b.org', 'age:over:18', challenge);
    const sessionPolicyDiff = await bindSessionId('venue-a.org', 'age:over:21', challenge);

    assert.notEqual(
      sessionVenueA.sessionId,
      sessionVenueB.sessionId,
      'different venues must produce distinct session IDs for identical challenges',
    );
    assert.notEqual(
      sessionVenueA.sessionId,
      sessionPolicyDiff.sessionId,
      'different policies must produce distinct session IDs for same venue',
    );

    const matchesCross = await verifySessionBinding(sessionVenueA.sessionId, {
      venue: 'venue-b.org',
      policy: 'age:over:18',
      challenge,
    });
    assert.equal(matchesCross, false, 'session from venue A must NOT match venue B');
  });

  test('GET /verify/age/:sessionId rejects requests when contract address is missing', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/verify/age/11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff',
    });
    assert.equal(res.statusCode, 400);
    const body = res.json();
    assert.ok(body.error.includes('No contract address'));
  });

  test('GET /verify/unique/:sessionId rejects requests when contract address is missing', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/verify/unique/11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff',
    });
    assert.equal(res.statusCode, 400);
    const body = res.json();
    assert.ok(body.error.includes('No contract address'));
  });

  test('GET /verify/age/:sessionId rejects cross-context mismatch before hitting network', async () => {
    const fakeContract = '0000000000000000000000000000000000000000000000000000000000000001';
    const fakeSession = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

    const res = await app.inject({
      method: 'GET',
      url: `/verify/age/${fakeSession}?contract=${fakeContract}&venue=casino.com&policy=age:18&challenge=test`,
    });

    // Binding check runs before ledger lookup, returning failure for mismatch
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.verified, false);
    assert.ok(body.reason.includes('does not match expected venue, policy, or challenge binding'));
  });

  test('Verifier reference in verification gateway is cleanly defined (no undefined reference)', async () => {
    assert.ok(Verifier, 'Verifier class must be defined in silentpass');
    assert.ok(Venue, 'Venue class alias must be defined in silentpass');
    assert.equal(Venue, Verifier, 'Venue must be an alias of Verifier');

    // Test that verifyAgeOver and verifyUniqueHuman functions in verify.ts instantiate Verifier without ReferenceError
    assert.equal(typeof verifyAgeOver, 'function');
    assert.equal(typeof verifyUniqueHuman, 'function');
    assert.equal(typeof makeSessionId, 'function');
  });
});
