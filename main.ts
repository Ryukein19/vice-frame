// Vice Frame: the program that hands this entry in. It copies the app and the
// screenshots beside this file into the output directory and writes the dossier
// the judge reads, using the vendored make.fun library. Node 22, standard
// library only, nothing installed, no network: the grader runs it twice in a
// fresh container and both runs must write the same bytes.
//
// Try it locally first:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's caps, from the competition's gate: at most 4 screenshots of at
// most 256 KiB each, at most 993 files and 48 MiB under app/, every app path at
// most 1000 bytes, and the dossier text at most 160 KiB. The dossier is built
// from the copied files, so what main.ts writes is exactly what the gate sees.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
