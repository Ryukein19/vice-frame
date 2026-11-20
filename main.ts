// Vice Frame, handed in. The app lives in app/ beside this file as plain
// static files (index.html and its ES modules, no build step, no network),
// and this program is the handoff: it copies app/ and screenshots/ into the
// output directory and writes dossier.json, the summary the judge reads,
// using the vendored make.fun library. Node 22, standard library only, and
// deterministic: two runs write identical bytes. Outside the grader's
// container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Round 4 adds twelve layouts, ten grades, a focal-point smart crop and a
// pop-out hero to the app this copies; the handoff itself is unchanged.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const destDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function handIn() {
  mkdirSync(destDir, { recursive: true });
  cpSync(join(repoDir, 'app'), join(destDir, 'app'), { recursive: true });
  const shotsDir = join(repoDir, 'screenshots');
  if (existsSync(shotsDir)) {
    cpSync(shotsDir, join(destDir, 'screenshots'), { recursive: true });
  }
  // The scorer's own caps (reference/gate.json): text_max_bytes shapes the
  // dossier's text; the rest refuse an entry the scorer would refuse — more
  // than 4 screenshots or one over 256 KiB, more than 993 files in app/ or
  // 48 MiB of app files in all, or a path under app/ over 1000 bytes.
  const dossier = buildDossier(destDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  });
  writeFileSync(join(destDir, 'dossier.json'), dossier);
}

handIn();
