/**
 * Thumbnail [PROPOSTA] — Do Zero #1 (capa do Reels, TikTok e Shorts, 1080×1920).
 * Mesmo padrão das capas aprovadas: fundo #0B0B0B com grade, Bruno recortado na base
 * (quadro de 15 s do bruto 13-37-25) num quadro, headline mista em Inter no miolo seguro,
 * v2: tudo entre y 300 e 1620, para o recorte 3:4/4:5 do grid do perfil não cortar.
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
          fill={hot ? AMBAR : '#1C1C1C'} opacity={(hot ? 0.85 : 1) * (r === 0 ? 0.35 : r === 1 ? 0.7 : 1)} />
      );
    }
  }
  return (
    <AbsoluteFill style={{background: '#0B0B0B', overflow: 'hidden'}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>{lines}</svg>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        {tiles}
      </svg>
      {/* tudo que importa fica entre y 300 e 1620 (recorte 3:4 e 4:5 do grid) */}
      <Img src={staticFile('brand/simbolo-mono-branco.svg')} style={{position: 'absolute', left: 516, top: 318, width: 48, height: 48}} />
      <div style={{position: 'absolute', left: 50, right: 50, top: 385, textAlign: 'center', fontFamily: FONTE}}>
        <div style={{fontSize: 36, fontWeight: 600, color: '#9A9A9A', letterSpacing: '0.18em', marginBottom: 18}}>DO ZERO #1</div>
        <div style={{fontSize: 100, fontWeight: 300, color: '#FFFFFF', lineHeight: 1.04, letterSpacing: '-0.02em'}}>Montei meu canal</div>
        <div style={{fontSize: 126, fontWeight: 600, color: AMBAR, lineHeight: 1.02, letterSpacing: '-0.03em', marginTop: 6}}>inteiro com IA</div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 735, textAlign: 'center', fontFamily: FONTE}}>
        <span style={{display: 'inline-block', padding: '12px 30px', borderRadius: 999, background: '#0B0B0B', border: `3px solid ${AMBAR}`, color: AMBAR, fontSize: 46, fontWeight: 600, letterSpacing: '-0.01em'}}>+2.000 posts analisados</span>
      </div>
      {/* Bruno num quadro, inteiro dentro da área segura */}
      <div style={{position: 'absolute', left: 200, top: 870, width: 680, height: 720, borderRadius: 44, overflow: 'hidden', background: '#161616', border: `4px solid ${AMBAR}`}}>
        <Img src={staticFile('bruno_thumb.png')} style={{position: 'absolute', left: -60, top: 20, width: 800, height: 720}} />
      </div>
      {/* logos das ferramentas, ao lado do quadro */}
      <Img src={staticFile('logos/claude-code.png')} style={{position: 'absolute', left: 40, top: 1000, width: 132, height: 132, objectFit: 'contain', borderRadius: 24}} />
      <Img src={staticFile('logos/grok.png')} style={{position: 'absolute', right: 40, top: 1000, width: 132, height: 132, objectFit: 'contain', borderRadius: 24}} />
    </AbsoluteFill>
  );
};
