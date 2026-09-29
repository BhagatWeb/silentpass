/*
 * zkPassport backend / Verification Gateway.
 *
 *   POST /kyc/extract  { image, name }        -> Groq document extraction + name check
 *   POST /session      { venue, policy }      -> { sessionId, venue?, policy?, challenge?, bound }
 *   GET  /verify/age/:sessionId?threshold=18   -> { verified, threshold, asOfDate }
 *   GET  /verify/unique/:sessionId             -> { verified, nullifier }
 *   GET  /health
 *
 * Prevents cross-context acceptance by cryptographically binding session IDs to
 * a venue, policy, and fresh challenge.
 */
import 'dotenv/config';
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { extractIdentity } from './groq.js';
import {
  makeSessionId,
  makeBoundSessionId,
  verifyAgeOver,
  verifyUniqueHuman,
  type SessionBinding,
} from './verify.js';

export const PORT = Number(process.env.PORT ?? 8787);
export const GROQ_API_KEY = process.env.GROQ_API_KEY ?? '';
export const GROQ_MODEL = process.env.GROQ_MODEL ?? 'meta-llama/llama-4-scout-17b-16e-instruct';
export const DEFAULT_CONTRACT = process.env.PASSPORT_CONTRACT_ADDRESS ?? '';

export async function createApp(opts?: { logger?: boolean }): Promise<FastifyInstance> {
  const app = Fastify({
    bodyLimit: 15 * 1024 * 1024,
    logger: opts?.logger ?? (process.env.NODE_ENV !== 'test'),
  });

  await app.register(cors, { origin: true });

  app.get('/health', async () => ({
    ok: true,
    groqConfigured: Boolean(GROQ_API_KEY),
    model: GROQ_MODEL,
    contract: DEFAULT_CONTRACT || null,
  }));

  app.post<{ Body: { image?: string; name?: string } }>('/kyc/extract', async (req, reply) => {
    const { image, name } = req.body ?? {};
    if (!image || !name) {
      return reply.code(400).send({ error: 'Provide { image: dataURI, name: string }.' });
    }
    if (!GROQ_API_KEY) {
      return reply.code(503).send({ error: 'Server has no GROQ_API_KEY configured.' });
    }
    try {
      const result = await extractIdentity(image, name, { apiKey: GROQ_API_KEY, model: GROQ_MODEL });
      return result;
    } catch (e) {
      req.log.error(e);
      return reply.code(502).send({ error: e instanceof Error ? e.message : 'extraction failed' });
    }
  });

  // Session generation: supports optional binding to venue, policy, and fresh challenge
  app.post<{
    Body?: { venue?: string; policy?: string; challenge?: string };
  }>('/session', async (req) => {
    const { venue, policy, challenge } = req.body ?? {};
    if (venue && policy) {
      const bound = await makeBoundSessionId(venue, policy, challenge);
      return {
        sessionId: bound.sessionId,
        venue: bound.venue,
        policy: bound.policy,
        challenge: bound.challenge,
        bound: true,
      };
    }
    return {
      sessionId: makeSessionId(),
      bound: false,
    };
  });

  const resolveContract = (q: unknown): string => {
    const c = (q as { contract?: string })?.contract;
    return c || DEFAULT_CONTRACT;
  };

  const resolveBinding = (q: Record<string, unknown>): SessionBinding | undefined => {
    if (typeof q.venue === 'string' && typeof q.policy === 'string') {
      return {
        venue: q.venue,
        policy: q.policy,
        challenge: typeof q.challenge === 'string' ? q.challenge : '',
      };
    }
    return undefined;
  };

  app.get<{
    Params: { sessionId: string };
    Querystring: {
      threshold?: string;
      contract?: string;
      venue?: string;
      policy?: string;
      challenge?: string;
    };
  }>('/verify/age/:sessionId', async (req, reply) => {
    const contract = resolveContract(req.query);
    if (!contract) {
      return reply.code(400).send({ error: 'No contract address (set PASSPORT_CONTRACT_ADDRESS or ?contract=).' });
    }
    const threshold = Number(req.query.threshold ?? 18);
    const expectedBinding = resolveBinding(req.query as Record<string, unknown>);

    try {
      return await verifyAgeOver(contract, req.params.sessionId, threshold, 3650, expectedBinding);
    } catch (e) {
      req.log.error(e);
      return reply.code(502).send({ verified: false, reason: e instanceof Error ? e.message : 'verify failed' });
    }
  });

  app.get<{
    Params: { sessionId: string };
    Querystring: {
      contract?: string;
      venue?: string;
      policy?: string;
      challenge?: string;
    };
  }>('/verify/unique/:sessionId', async (req, reply) => {
    const contract = resolveContract(req.query);
    if (!contract) {
      return reply.code(400).send({ error: 'No contract address.' });
    }
    const expectedBinding = resolveBinding(req.query as Record<string, unknown>);

    try {
      return await verifyUniqueHuman(contract, req.params.sessionId, expectedBinding);
    } catch (e) {
      req.log.error(e);
      return reply.code(502).send({ verified: false, reason: e instanceof Error ? e.message : 'verify failed' });
    }
  });

  return app;
}

import { fileURLToPath } from 'node:url';

// Standalone execution
const isDirectRun = process.argv[1] && (
  fileURLToPath(import.meta.url) === process.argv[1] ||
  process.argv[1].endsWith('src\\index.ts') ||
  process.argv[1].endsWith('src/index.ts')
);

if (isDirectRun && process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  createApp({ logger: true })
    .then((app) =>
      app
        .listen({ port: PORT, host: '0.0.0.0' })
        .then(() => app.log.info(`zkPassport verification gateway running on :${PORT}`))
        .catch((err) => {
          app.log.error(err);
          process.exit(1);
        }),
    )
    .catch((err) => {
      console.error('Failed to initialize server:', err);
      process.exit(1);
    });
}
