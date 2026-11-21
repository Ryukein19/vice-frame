// Vice Frame — the entrypoint (Node 22, standard library only).
// Hands the app in: copies this repository's app/ and screenshots/ into the
// output directory and writes dossier.json, the summary the judge reads,
// using the vendored make.fun library. Deterministic: two runs write the
// same bytes. Run it outside the grader with MAKEFUN_OUTPUT_DIR:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the app locally with `node serve.ts` (http://localhost:8080).

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The repository root is the directory this file sits in.
const root = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy a directory tree, skipping nothing: the app is plain files.
function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  for (const name of readdirSync(from)) {
    const src = join(from, name);
    const dst = join(to, name);
    if (statSync(src).isDirectory()) copyTree(src, dst);
    else cpSync(src, dst);
  }
}

mkdirSync(outDir, { recursive: true });
copyTree(join(root, 'app'), join(outDir, 'app'));
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(root, 'screenshots'))) {
  copyTree(join(root, 'screenshots'), join(outDir, 'screenshots'));
}

// The gate's caps for this bounty: the dossier text, the screenshots, and
// the app are each held to them, so an entry that breaks one is refused
// before the judge ever sees it. Only text_max_bytes changes the bytes
// written; the rest are enforced by the scorer on the output.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
