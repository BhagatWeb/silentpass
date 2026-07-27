/*
 * Headless deploy of the SilentPass contract to Midnight preprod.
 * Supports two modes:
 *
 *   Deploy mode (default):
 *     MNEMONIC="word1 ... word24" npm run deploy -w silentpass-cli
 *
 *   Join mode (skip deploy — use existing contract address):
 *     CONTRACT_ADDRESS="<hex>" npm run deploy -w silentpass-cli
 *
 * Use deploy.ps1 / deploy.bat on Windows as convenience wrappers.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pino from 'pino';
import {
  PassportAPI,
  Issuer,
  Holder,
  Verifier,
  newSessionId,
  randomBytes,
  toHex,
} from 'silentpass';
import { initDeployerSession, zkConfigPath } from './providers.js';

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } },
});

const HERE = dirname(fileURLToPath(import.meta.url));
// issuer-cli/src/deploy.ts → issuer-cli/src → issuer-cli → repo root
const REPO_ROOT = resolve(HERE, '..', '..');

// ── Helpers ────────────────────────────────────────────────────────────────

function writeDeploymentFiles(data: {
  contractAddress: string;
  networkId: string;
  issuerSecretKey: string;
  issuerPublicKey: string;
  deployedAt: string;
  explorer: string;
}) {
  const uiPublicDir = resolve(REPO_ROOT, 'verifier-ui', 'public');
  mkdirSync(uiPublicDir, { recursive: true });

  const deploymentPath = resolve(REPO_ROOT, 'deployment.json');
  const uiPath = resolve(uiPublicDir, 'deployment.json');

  writeFileSync(deploymentPath, JSON.stringify(data, null, 2));
  writeFileSync(uiPath, JSON.stringify({ contractAddress: data.contractAddress, networkId: data.networkId }, null, 2));
  logger.info(`Wrote ${deploymentPath}`);
  logger.info(`Wrote ${uiPath}`);
}

// ── Main ───────────────────────────────────────────────────────────────────

const main = async (): Promise<void> => {
  const existingAddress = process.env.CONTRACT_ADDRESS?.trim();
  const mnemonic = process.env.MNEMONIC?.trim();
  const runSmoke = process.env.SKIP_SMOKE !== '1';

  // ── Join mode: contract already deployed, just record the address ─────────
  if (existingAddress) {
    logger.info(`JOIN mode — recording existing contract: ${existingAddress}`);
    const issuerSecretKey = randomBytes(32); // placeholder; not used for join
    const deployment = {
      contractAddress: existingAddress,
      networkId: 'preprod',
      issuerSecretKey: toHex(issuerSecretKey),
      issuerPublicKey: 'n/a (join mode)',
      deployedAt: new Date().toISOString(),
      explorer: `https://preprod.midnight.network/explorer/contract/${existingAddress}`,
    };
    writeDeploymentFiles(deployment);
    logger.info('Done. deployment.json written — no re-deploy performed.');
    return;
  }

  // ── Deploy mode: wallet required ──────────────────────────────────────────
  if (!mnemonic || mnemonic.split(/\s+/).length < 12) {
    throw new Error(
      'Provide either:\n' +
      '  CONTRACT_ADDRESS=<hex>  to record an existing deployment, or\n' +
      '  MNEMONIC="word1 ... word24"  to deploy a new contract.\n\n' +
      'On Windows use: .\\deploy.ps1 (or deploy.bat)',
    );
  }

  const { providers, coinPublicKey } = await initDeployerSession(logger, mnemonic);
  logger.info(`Wallet ready. coin public key: ${coinPublicKey}`);

  const issuerSecretKey = randomBytes(32);

  logger.info('Deploying SilentPass contract to Midnight preprod…');
  const api = await PassportAPI.deploy(providers, { issuerSecretKey, logger });
  const contractAddress = api.contractAddress;
  logger.info(`✅ Deployed at: ${contractAddress}`);

  const deployment = {
    contractAddress,
    networkId: 'preprod',
    issuerSecretKey: toHex(issuerSecretKey),
    issuerPublicKey: toHex((await import('silentpass-contract')).pureCircuits.publicKey(issuerSecretKey)),
    deployedAt: new Date().toISOString(),
    explorer: `https://preprod.midnight.network/explorer/contract/${contractAddress}`,
  };
  writeDeploymentFiles(deployment);

  if (!runSmoke) {
    logger.info('SKIP_SMOKE=1 — skipping on-chain smoke cycle.');
    logger.info('Done.');
    return;
  }

  // ── Smoke cycle: issue → proveIdentity → verify ───────────────────────────
  logger.info('--- On-chain smoke cycle: issue → proveIdentity → verify ---');

  const issuer = new Issuer(api);
  const holder = new Holder(api);
  const verifier = new Verifier(api.providers.publicDataProvider, contractAddress);

  const enrollment = await holder.enroll();
  logger.info(`Holder enrolled. subject pk: ${enrollment.publicKey.slice(0, 16)}…`);

  const credential = await issuer.issueCredential(
    { name: 'Erika Mustermann', birthDate: '2000-05-14', country: 276 },
    { publicKey: enrollment.publicKey, enrollmentNullifier: enrollment.enrollmentNullifier },
  );
  logger.info(`Credential issued. commitment: ${credential.commitment.slice(0, 16)}…`);

  await holder.store(credential);
  logger.info('Credential stored in local private state.');

  const sessionId = newSessionId();
  logger.info(`Proving identity for session ${sessionId.slice(0, 16)}… (ZK proof — ~30s)`);
  const receipt = await holder.proveIdentity('Erika Mustermann', 18, { sessionId });
  logger.info(`Proof submitted. tx: ${receipt.txHash ?? 'n/a'}`);

  const result = await verifier.verifyIdentity(sessionId, 18);
  if (!result.verified) {
    throw new Error(`On-chain verification FAILED: ${result.reason}`);
  }
  logger.info(`✅ verified ✓ — threshold ${result.threshold}, asOf ${result.asOfDate}. Chain never saw the birthdate or name.`);
  logger.info(`Explorer: ${deployment.explorer}`);
  logger.info('Done.');
};

main()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error(err instanceof Error ? err.stack ?? err.message : String(err));
    process.exit(1);
  });
