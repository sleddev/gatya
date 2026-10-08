#!/usr/bin/env node
// `pnpm start` / `pnpm web` / …: build the content, keep rebuilding it on change,
// and run the Expo dev server next to it. Extra arguments go to `expo start`.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bin = (name) => path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? `${name}.cmd` : name);

const watcher = spawn(process.execPath, [path.join(root, 'scripts/build-content.mjs'), '--watch'], { stdio: 'inherit' });
// Give the first content build a head start so Metro finds the generated files.
setTimeout(() => {
  const expo = spawn(bin('expo'), ['start', ...process.argv.slice(2)], { stdio: 'inherit', cwd: root });
  expo.on('exit', (code) => {
    watcher.kill();
    process.exit(code ?? 0);
  });
}, 1500);
process.on('SIGINT', () => watcher.kill());
