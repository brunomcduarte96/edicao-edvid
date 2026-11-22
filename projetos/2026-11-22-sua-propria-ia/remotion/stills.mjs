import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'path';
const times = process.argv.slice(3).map(Number);
const out = process.argv[2];
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const comp = await selectComposition({serveUrl, id: 'Reels'});
for (const t of times) {
  const f = Math.round(t * 30);
  await renderStill({composition: comp, serveUrl, output: `${out}/s_${String(f).padStart(5, '0')}.png`, frame: f, scale: 0.3, timeoutInMilliseconds: 240000});
}
console.log('ok', times.length);
import fs from 'fs';
fs.rmSync(serveUrl, {recursive: true, force: true});
