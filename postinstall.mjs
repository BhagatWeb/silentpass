/**
 * postinstall.mjs
 *
 * npm installs the old silentpass@0.1.0 (originally named "credport") into
 * issuer-cli/node_modules and server/node_modules because of version resolution.
 * This script overwrites the stale dist files with the workspace-local builds
 * so no "credport-contract" reference survives in the dependency tree.
 *
 * Runs automatically after every `npm install` via the root postinstall hook.
 */
import { cpSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)));

const sdkDist = resolve(ROOT, 'passport-sdk', 'dist');
const contractDist = resolve(ROOT, 'contract', 'dist');

const targets = [
  { workspace: 'issuer-cli', pkg: 'silentpass', src: sdkDist },
  { workspace: 'issuer-cli', pkg: 'silentpass-contract', src: contractDist },
  { workspace: 'server', pkg: 'silentpass', src: sdkDist },
  { workspace: 'server', pkg: 'silentpass-contract', src: contractDist },
];

let patched = 0;
for (const { workspace, pkg, src } of targets) {
  const dest = resolve(ROOT, workspace, 'node_modules', pkg, 'dist');
  if (!existsSync(dest)) continue;
  if (!existsSync(src)) {
    console.warn(`[postinstall] SKIP: source dist not built yet — ${src}`);
    console.warn(`[postinstall]   Run: npm run build --workspace ${pkg === 'silentpass' ? 'silentpass' : 'silentpass-contract'}`);
    continue;
  }
  cpSync(src, dest, { recursive: true, force: true });
  console.log(`[postinstall] Patched ${workspace}/node_modules/${pkg}/dist`);
  patched++;
}

if (patched > 0) {
  console.log(`[postinstall] ${patched} stale dist(s) replaced with workspace builds. No credport references remain.`);
}
