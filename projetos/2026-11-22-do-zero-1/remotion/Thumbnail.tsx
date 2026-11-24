/**
 * Thumbnail [PROPOSTA] — Do Zero #1 (capa do Reels, TikTok e Shorts, 1080×1920).
 * Mesmo padrão das capas aprovadas: fundo #0B0B0B com grade, Bruno recortado na base
 * (quadro de 15 s do bruto 13-37-25), headline mista em Inter no miolo seguro,
 * v3: igual à v1, com o Bruno subido 240 px para o rosto caber no recorte 3:4/4:5 do grid.
 * parede de posts atrás (os 2.000 posts) e os logos Claude Code e Grok.
 */
import React from 'react';
import {AbsoluteFill, Img, staticFile, continueRender, delayRender} from 'remotion';

const FONTE = 'InterFB';
let ok = false;
const useInter = () => {
  if (ok || typeof document === 'undefined') return;
  ok = true;
  const h = delayRender('Inter');
  const faces = [
    new FontFace(FONTE, `url(${staticFile('fonts/Inter_18pt-Light.ttf')})`, {weight: '300'}),
    new FontFace(FONTE, `url(${staticFile('fonts/Inter_18pt-SemiBold.ttf')})`, {weight: '600'}),
  ];
  Promise.all(faces.map((f) => f.load()))
    .then((fs) => { fs.forEach((f) => document.fonts.add(f)); continueRender(h); })
    .catch(() => continueRender(h));
};

const AMBAR = '#E8A33D';

export const Thumbnail: React.FC = () => {
  useInter();
  const lines = [];
  for (let x = 0; x <= 1080; x += 60) lines.push(<line key={`v${x}`} x1={x} y1={0} x2={x} y2={1920} stroke="#161616" strokeWidth={2} />);
  for (let y = 0; y <= 1920; y += 60) lines.push(<line key={`h${y}`} x1={0} y1={y} x2={1080} y2={y} stroke="#161616" strokeWidth={2} />);
  // parede de posts (genéricos) atrás do Bruno
  const tiles = [];
  const cols = 9, w = 104, gap = 14;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < cols; c++) {
      const x = 22 + c * (w + gap);
      const y = 820 + r * (w * 1.25 + gap);
      const hot = (r * 7 + c * 3) % 11 === 0 && !(c >= 3 && c <= 5 && r >= 1);
      tiles.push(
        <rect key={`${r}-${c}`} x={x} y={y} width={w} height={w * 1.25} rx={10}
          fill={hot ? AMBAR : '#1C1C1C'} opacity={hot ? 0.85 : 1} />
      );
    }
  }
  return (
    <AbsoluteFill style={{background: '#0B0B0B', overflow: 'hidden'}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>{lines}</svg>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <defs>
          <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0B0B0B" stopOpacity="1" />
            <stop offset="0.35" stopColor="#0B0B0B" stopOpacity="0" />
          </linearGradient>
        </defs>
        {tiles}
        <rect x={0} y={800} width={1080} height={1120} fill="url(#fade)" />
      </svg>
      {/* selo +2.000 posts */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 760, textAlign: 'center', fontFamily: FONTE}}>
        <span style={{display: 'inline-block', padding: '14px 34px', borderRadius: 999, background: '#0B0B0B', border: `3px solid ${AMBAR}`, color: AMBAR, fontSize: 52, fontWeight: 600, letterSpacing: '-0.01em'}}>+2.000 posts analisados</span>
      </div>
      {/* Bruno na base, subido 240 px para o rosto caber no recorte 3:4/4:5 do grid (camiseta prolongada até a base) */}
      <Img src={staticFile('bruno_thumb_ext.png')} style={{position: 'absolute', left: 100, top: 888, width: 880, height: 1032}} />
      {/* logos das ferramentas */}
      <Img src={staticFile('logos/claude-code.png')} style={{position: 'absolute', left: 56, top: 1010, width: 150, height: 150, objectFit: 'contain', borderRadius: 28}} />
      <Img src={staticFile('logos/grok.png')} style={{position: 'absolute', right: 56, top: 1010, width: 150, height: 150, objectFit: 'contain', borderRadius: 28}} />
      {/* headline no miolo seguro */}
      <div style={{position: 'absolute', left: 60, right: 60, top: 400, textAlign: 'center', fontFamily: FONTE}}>
        <div style={{fontSize: 40, fontWeight: 600, color: '#9A9A9A', letterSpacing: '0.18em', marginBottom: 26}}>DO ZERO #1</div>
        <div style={{fontSize: 104, fontWeight: 300, color: '#FFFFFF', lineHeight: 1.05, letterSpacing: '-0.02em'}}>Montei meu canal</div>
        <div style={{fontSize: 130, fontWeight: 600, color: AMBAR, lineHeight: 1.02, letterSpacing: '-0.03em', marginTop: 10}}>inteiro com IA</div>
      </div>
      <Img src={staticFile('brand/simbolo-mono-branco.svg')} style={{position: 'absolute', left: 512, top: 310, width: 56, height: 56}} />
    </AbsoluteFill>
  );
};
