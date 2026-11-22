// Midnight Gallery — hand-in program (Node 22, standard library only).
//
// The game lives in game/ as plain static files a desktop browser loads
// offline, and its screenshots live in screenshots/. This program hands both
// in: it copies them into the output directory the grader provides and writes
// dossier.json there with the vendored make.fun library, so the judge can read
// the game and its screenshots.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's caps, from the kit's gate: the game must stay inside them,
// and the dossier text is capped so the judge's view fits its budget.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function copyTree(source, target) {
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

function countFiles(dir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    total += entry.isDirectory() ? countFiles(path) : 1;
  }
  return total;
}

function handIn() {
  mkdirSync(outputDir, { recursive: true });
  copyTree(join(repoRoot, 'game'), join(outputDir, 'game'));
  if (existsSync(join(repoRoot, 'screenshots'))) {
    copyTree(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));
  }
  const dossier = buildDossier(outputDir, DOSSIER_CAPS);
  writeFileSync(join(outputDir, 'dossier.json'), dossier);
  const gameFiles = countFiles(join(outputDir, 'game'));
  const shotFiles = existsSync(join(outputDir, 'screenshots'))
    ? countFiles(join(outputDir, 'screenshots'))
    : 0;
  console.log(`handed in ${gameFiles} game files and ${shotFiles} screenshots; dossier is ${dossier.length} bytes`);
}

handIn();
