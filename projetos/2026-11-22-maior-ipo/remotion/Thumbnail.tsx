/**
 * Thumbnail [PROPOSTA] — Maior IPO da história (capa do Reels e do TikTok, 1080×1920).
 * Fundo #0B0B0B com grade sutil, Bruno recortado na base (quadro de 1,0 s do corte),
 * headline mista em Inter dentro do miolo 1080×1350 (y 285–1635), símbolo pequeno da marca.
 */
import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, staticFile, continueRender, delayRender} from 'remotion';

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
    .then((fs) => {
      fs.forEach((f) => document.fonts.add(f));
      continueRender(h);
    })
    .catch(() => continueRender(h));
};

export const Thumbnail: React.FC = () => {
  useInter();
  const lines = [];
  for (let x = 0; x <= 1080; x += 60) lines.push(<line key={`v${x}`} x1={x} y1={0} x2={x} y2={1920} stroke="#161616" strokeWidth={2} />);
  for (let y = 0; y <= 1920; y += 60) lines.push(<line key={`h${y}`} x1={0} y1={y} x2={1080} y2={y} stroke="#161616" strokeWidth={2} />);
  return (
    <AbsoluteFill style={{background: '#0B0B0B', overflow: 'hidden'}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>{lines}</svg>
      {/* asterisco oficial da Anthropic, grande e atrás do Bruno */}
      <Img src={staticFile('logos/claude-chat-icon.png')} style={{position: 'absolute', left: 190, top: 820, width: 700, height: 700, opacity: 0.9}} />
      {/* Bruno na base */}
      <div style={{position: 'absolute', inset: 0, transform: 'translateY(130px) scale(0.82)', transformOrigin: '540px 1920px'}}>
        <OffthreadVideo src={staticFile('pessoa_v.mov')} transparent muted startFrom={30} style={{width: 1080, height: 1920}} />
      </div>
      {/* headline no miolo seguro */}
      <div style={{position: 'absolute', left: 70, right: 70, top: 380, textAlign: 'center', fontFamily: FONTE}}>
        <div style={{fontSize: 92, fontWeight: 300, color: '#FFFFFF', lineHeight: 1.05, letterSpacing: '-0.02em'}}>Maior IPO da história.</div>
        <div style={{fontSize: 132, fontWeight: 600, color: '#E8A33D', lineHeight: 1.02, letterSpacing: '-0.03em', marginTop: 12}}>Qual o futuro?</div>
      </div>
      <Img src={staticFile('brand/simbolo-mono-branco.svg')} style={{position: 'absolute', left: 512, top: 300, width: 56, height: 56}} />
    </AbsoluteFill>
  );
};
