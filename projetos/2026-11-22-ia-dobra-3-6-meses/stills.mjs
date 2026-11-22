// uso: node stills.mjs out/dir t1 t2 ...  -> PNGs em escala 0.35 (um bundle só, em out/bundle)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
const [dir, ...ts] = process.argv.slice(2);
const outDir = path.resolve('out/bundle');
fs.rmSync(outDir, {recursive: true, force: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), outDir});
const comp = await selectComposition({serveUrl, id: 'Reels'});
for (const t of ts) {
  const frame = Math.min(comp.durationInFrames - 1, Math.round(parseFloat(t) * 30));
  await renderStill({composition: comp, serveUrl, frame, output: `${dir}/s_${String(t).padStart(6, '0')}.png`, scale: 0.35});
}
console.log('STILLS_OK');
