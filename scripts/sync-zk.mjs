// Copies the compiled ZK artifacts (keys + zkir) into verifier-ui/public so the
// browser's FetchZkConfigProvider can fetch them from the app origin, both in
// `vite dev` and in the built site.
import { cpSync, existsSync, rmSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const managed = join(root, 'contract', 'src', 'managed', 'passport');
const publicDir = join(root, 'verifier-ui', 'public');

for (const sub of ['keys', 'zkir']) {
  const src = join(managed, sub);
  const dest = join(publicDir, sub);
  
  if (sub === 'keys') {
    const keysDir = src;
    const uiPublicKeysDir = dest;
    if (!existsSync(keysDir)) {
      console.warn(`missing ${keysDir} — skipping ZK sync since keys are not present (compiled with --skip-zk?)`);
    } else {
      // clear and re-create destination
      rmSync(uiPublicKeysDir, { recursive: true, force: true });
      mkdirSync(uiPublicKeysDir, { recursive: true });

      // copy all files from keysDir to uiPublicKeysDir
      const keys = readdirSync(keysDir);
      for (const key of keys) {
        copyFileSync(join(keysDir, key), join(uiPublicKeysDir, key));
      }
      console.log(`synced ${keys.length} ZK keys to UI public dir`);
    }
  } else {
    if (!existsSync(src)) {
      console.error(`missing ${src} — run \`npm run compact\` (full compile, no --skip-zk) first`);
      process.exit(1);
    }
    rmSync(dest, { recursive: true, force: true });
    cpSync(src, dest, { recursive: true });
    console.log(`synced ${sub} -> verifier-ui/public/${sub}`);
  }
}

// Also sync full managed tree to /managed so providers fetching from /managed find everything
const fullManagedSrc = join(root, 'contract', 'src', 'managed');
const fullManagedDest = join(publicDir, 'managed');
if (existsSync(fullManagedSrc)) {
  rmSync(fullManagedDest, { recursive: true, force: true });
  cpSync(fullManagedSrc, fullManagedDest, { recursive: true });
  console.log('synced managed -> verifier-ui/public/managed');
  
  // Also ensure /managed/zkir is available directly if fetched without /passport
  const zkirSrc = join(managed, 'zkir');
  const managedZkirDest = join(fullManagedDest, 'zkir');
  if (existsSync(zkirSrc) && !existsSync(managedZkirDest)) {
    cpSync(zkirSrc, managedZkirDest, { recursive: true });
  }

  const keysSrc = join(managed, 'keys');
  const managedKeysDest = join(fullManagedDest, 'keys');
  if (existsSync(keysSrc) && !existsSync(managedKeysDest)) {
    cpSync(keysSrc, managedKeysDest, { recursive: true });
  }
}


