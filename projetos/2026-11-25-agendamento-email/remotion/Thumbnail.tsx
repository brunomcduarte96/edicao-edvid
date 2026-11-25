/**
 * Thumbnail [PROPOSTA] v3 — Agendamento Email (pedido do Bruno: quadro de 0:02.71 e "Yakisoba e IA"). Padrão aprovado no Do Zero #1 (24/11):
 * fundo #0B0B0B com grade, símbolo branco, rótulo cinza espaçado, headline mista em Inter
 * (Light branca + SemiBold âmbar), selo âmbar, Bruno recortado direto sobre o fundo (v2: sem quadro),
 * logos das ferramentas e elementos do tema. Tudo entre y 300 e 1620.
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
  Promise.all(faces.map((f) => f.load())).then((fs) => { fs.forEach((f) => document.fonts.add(f)); continueRender(h); }).catch(() => continueRender(h));
};
const AMBAR = '#E8A33D';
const Env: React.FC<{x: number; y: number; w: number; r: number; o: number}> = ({x, y, w, r, o}) => (
  <svg width={w} height={w * 0.7} viewBox="0 0 100 70" style={{position: 'absolute', left: x, top: y, transform: `rotate(${r}deg)`, opacity: o}}>
    <rect x="2" y="2" width="96" height="66" rx="8" fill="#1A1A1A" stroke="#3A3A3A" strokeWidth="3" />
    <path d="M4 6 L50 40 L96 6" fill="none" stroke="#3A3A3A" strokeWidth="3" />
  </svg>
);

export const Thumbnail: React.FC = () => {
  useInter();
  const L = [];
  for (let x = 0; x <= 1080; x += 60) L.push(<line key={`v${x}`} x1={x} y1={0} x2={x} y2={1920} stroke="#161616" strokeWidth={2} />);
  for (let y = 0; y <= 1920; y += 60) L.push(<line key={`h${y}`} x1={0} y1={y} x2={1080} y2={y} stroke="#161616" strokeWidth={2} />);
  const f = (s: number, w: number, c = '#fff'): React.CSSProperties => ({fontFamily: FONTE, fontSize: s, fontWeight: w, color: c, lineHeight: 1.05, letterSpacing: s > 60 ? -2 : 0});
  return (
    <AbsoluteFill style={{background: '#0B0B0B', overflow: 'hidden'}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>{L}</svg>
      {/* e-mails ao fundo */}
      <Env x={40} y={820} w={190} r={-10} o={0.9} />
      <Env x={60} y={1080} w={150} r={6} o={0.7} />
      <Env x={860} y={1120} w={170} r={9} o={0.85} />
      <Env x={60} y={1350} w={130} r={-4} o={0.6} />
      <Img src={staticFile('brand/simbolo-mono-branco.svg')} style={{position: 'absolute', left: 90, top: 330, width: 56, height: 56}} />
      <div style={{position: 'absolute', left: 170, top: 344, ...f(28, 600, '#A3A3A3'), letterSpacing: 6}}>IA NA PRÁTICA</div>
      <div style={{position: 'absolute', left: 90, top: 420, width: 900}}>
        <div style={f(120, 300)}>Yakisoba</div>
        <div style={{...f(168, 600, AMBAR), marginTop: 4}}>e IA</div>
      </div>
      {/* v2: Bruno recortado direto sobre o fundo (sem quadro), a camiseta indo até a base */}
      <Img src={staticFile('bruno_thumb_v3.png')} style={{position: 'absolute', left: -40, top: 900, width: 1150, height: 1022}} />
      {/* selo */}
      <div style={{position: 'absolute', left: 90, top: 830, background: AMBAR, color: '#0A0A0A', ...f(52, 600, '#0A0A0A'), padding: '18px 34px', borderRadius: 20, transform: 'rotate(-4deg)'}}>5 passos</div>
      {/* logos */}
      <div style={{position: 'absolute', left: 870, top: 820, width: 150, height: 150, borderRadius: 34, background: '#1A1A1A', border: '3px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Img src={staticFile('logos/claude-chat-icon.png')} style={{width: 104, height: 104}} />
      </div>
      <div style={{position: 'absolute', left: 870, top: 1000, width: 150, height: 150, borderRadius: 34, background: '#1A1A1A', border: '3px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Img src={staticFile('logos/gmail.svg')} style={{width: 104, height: 78}} />
      </div>
    </AbsoluteFill>
  );
};
