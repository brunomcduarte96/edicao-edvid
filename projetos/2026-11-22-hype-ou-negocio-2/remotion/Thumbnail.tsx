/**
 * Thumbnail (capa 1080×1920 do Reels/TikTok) — [PROPOSTA] padrão da skill de edição.
 * Fundo #0B0B0B com grade, Bruno recortado na base, headline mista em Inter
 * (linha 1 leve e branca, linha 2 pesada e âmbar), rótulo da série e símbolo da marca.
 * Texto dentro do miolo 1080×1350 (y 285–1635) para não cortar na grade do perfil.
 */
import React from 'react';
import {AbsoluteFill, Img, staticFile, continueRender, delayRender} from 'remotion';

const FONTE = 'InterTB';
let carregou = false;
const useInter = () => {
  if (carregou || typeof document === 'undefined') return;
  carregou = true;
  const h = delayRender('Inter thumb');
  const faces = [
    new FontFace(FONTE, `url(${staticFile('fonts/Inter_18pt-Light.ttf')})`, {weight: '300'}),
    new FontFace(FONTE, `url(${staticFile('fonts/Inter_18pt-SemiBold.ttf')})`, {weight: '600'}),
  ];
  Promise.all(faces.map((f) => f.load()))
    .then((fs) => {
      fs.forEach((f) => document.fonts.add(f));
      continueRender(h);
    })
    .catch(() => continueRender(h));
};

const AMBAR = '#E8A33D';

export const Thumbnail: React.FC = () => {
  useInter();
  const linhas = [];
  for (let x = 0; x <= 1080; x += 60) linhas.push(<line key={`v${x}`} x1={x} y1={0} x2={x} y2={1920} stroke="#161616" strokeWidth={2} />);
  for (let y = 0; y <= 1920; y += 60) linhas.push(<line key={`h${y}`} x1={0} y1={y} x2={1080} y2={y} stroke="#161616" strokeWidth={2} />);
  return (
    <AbsoluteFill style={{background: '#0B0B0B', overflow: 'hidden'}}>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        {linhas}
      </svg>
      {/* número gigante atrás do Bruno */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 860, textAlign: 'center', fontFamily: FONTE, fontWeight: 300, fontSize: 330, color: AMBAR, lineHeight: 1, letterSpacing: '-0.04em', opacity: 0.95}}>R$ 1 bi</div>
      {/* Bruno recortado, apoiado na base */}
      <Img src={staticFile('thumb_pessoa.png')} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: 'translateY(170px) scale(0.78)', transformOrigin: '540px 1750px'}} />
      {/* rótulo da série */}
      <div style={{position: 'absolute', left: 90, top: 330, background: AMBAR, color: '#0A0A0A', fontFamily: FONTE, fontWeight: 600, fontSize: 36, letterSpacing: '0.08em', padding: '8px 18px', borderRadius: 2}}>HYPE OU NEGÓCIO? #2</div>
      {/* headline mista */}
      <div style={{position: 'absolute', left: 90, right: 70, top: 420}}>
        <div style={{fontFamily: FONTE, fontWeight: 300, fontSize: 92, color: '#FFFFFF', lineHeight: 1.05, letterSpacing: '-0.02em'}}>R$ 1 bi conferindo</div>
        <div style={{fontFamily: FONTE, fontWeight: 600, fontSize: 104, color: AMBAR, lineHeight: 1.05, letterSpacing: '-0.02em', marginTop: 6}}>conta de hospital</div>
      </div>
      {/* símbolo da marca */}
      <Img src={staticFile('brand/simbolo-mono-branco.svg')} style={{position: 'absolute', left: 924, top: 252, width: 56, height: 56}} />
    </AbsoluteFill>
  );
};
