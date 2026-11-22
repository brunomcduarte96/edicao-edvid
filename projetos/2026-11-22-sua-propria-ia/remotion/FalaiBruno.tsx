/**
 * FalaiBruno (Você pode ter a sua própria IA, 22/11/2026) — palco em camadas para o 9:16 com o Bruno recortado (chroma key).
 *
 * Camadas (de trás para frente): FUNDO (preto + grade) → ELEMENTOS (ilustrações,
 * muitas delas atrás do Bruno) → BRUNO (pessoa_v.webm com alfa) → TEXTO (rótulo,
 * fonte, marca d'água). Em `explosoes` as camadas se separam em perspectiva 3D.
 *
 * Geometria: o Bruno ocupa a metade de baixo (topo da cabeça em ~790 px). A zona
 * de cima (y 390–690) é das ilustrações; a legenda karaokê do template fica na
 * emenda (~740); as laterais do Bruno (x < 250 e x > 830, y 800–1500) recebem os
 * elementos que ficam ATRÁS dele.
 *
 * Tempo: tudo vem de edit-data.json `falai` (janelas e marcas por palavra).
 * Marca: Inter; preto/branco/cinzas; âmbar #E8A33D destaque; petróleo #1F6F6B
 * sucesso; cobalto #2F5BEA informação; vermelho só para o "erra".
 */
import React from 'react';
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  Video,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  continueRender,
  delayRender,
} from 'remotion';
import editData from '../../public/edit-data.json';

export const COR = {
  preto: '#0A0A0A',
  fundo: '#0B0B0B',
  sup: '#1A1A1A',
  sup2: '#242424',
  grade: '#161616',
  branco: '#FFFFFF',
  claro: '#F2F2F2',
  sec: '#A3A3A3',
  cinza1: '#525252',
  borda: '#3A3A3A',
  ambar: '#E8A33D',
  ambarEsc: '#8A5F1F',
  petroleo: '#1F6F6B',
  petroleoClaro: '#4FB3AC',
  cobalto: '#2F5BEA',
  erro: '#D9534F',
};
const FONTE = 'InterFB';

// ---------- fontes locais ----------
let fontsLoaded = false;
const useInter = () => {
  if (fontsLoaded || typeof document === 'undefined') return;
  fontsLoaded = true;
  const h = delayRender('Inter');
  const faces = [
    new FontFace(FONTE, `url(${staticFile('fonts/Inter_18pt-Light.ttf')})`, {weight: '300'}),
    new FontFace(FONTE, `url(${staticFile('fonts/Inter_18pt-Regular.ttf')})`, {weight: '400'}),
    new FontFace(FONTE, `url(${staticFile('fonts/Inter_18pt-SemiBold.ttf')})`, {weight: '600'}),
  ];
  Promise.all(faces.map((f) => f.load()))
    .then((fs) => {
      fs.forEach((f) => document.fonts.add(f));
      continueRender(h);
    })
    .catch(() => continueRender(h));
};

// ---------- dados ----------
type Cena = {nome: string; start: number; end: number; rotulo?: string; fonte?: string; m?: Record<string, number>};
type Explosao = {a: number; pico: number; b: number};
type Corte = {start: number; end: number; zoom: number};
type Falai = {
  pessoaY: number;
  marcaDagua?: {src: string; x: number; y: number; size: number; ate?: number};
  explosoes: Explosao[];
  cortes: Corte[];
  pushIn: number;
  cenas: Cena[];
  headline?: {fim: number; l1: string; l2: string};
  /** janelas em que o Bruno sai do quadro e a animação ocupa a tela toda */
  semPessoa?: [number, number][];
  /** escala do Bruno, apoiado na base do quadro (1 = receita das vagas) */
  pessoaEscala?: number;
};
const D = editData as unknown as {falai: Falai; hook?: {enabled: boolean; endSec: number}};
const F = D.falai;
const HOOK_FIM = F.headline?.fim ?? 0;
const PESSOA_ESCALA = F.pessoaEscala ?? 0.74;

// ---------- tempo ----------
const cl = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const outCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const outBack = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
const inOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
/** 0→1 entre a e a+d, com easing de saída */
const ent = (t: number, a: number, d = 0.35) => outCubic(cl((t - a) / d));
/** 0→1 com leve passada (pop) */
const pop = (t: number, a: number, d = 0.35) => (t < a ? 0 : outBack(cl((t - a) / d)));
/** opacidade de janela: entra em start, sai em end */
const jan = (t: number, s: number, e: number, fi = 0.25, fo = 0.25) => Math.min(cl((t - s) / fi), cl((e - t) / fo));
/** ruído determinístico 0..1 */
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------- peças comuns ----------
const txt = (size: number, weight = 600, color = COR.branco, extra: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: FONTE,
  fontSize: size,
  fontWeight: weight,
  color,
  lineHeight: 1.1,
  letterSpacing: size >= 80 ? '-0.02em' : '-0.01em',
  ...extra,
});

const Tag: React.FC<{t: string; bg?: string; fg?: string; size?: number; style?: React.CSSProperties}> = ({t, bg = COR.ambar, fg = COR.preto, size = 26, style}) => (
  <div
    style={{
      display: 'inline-block',
      background: bg,
      color: fg,
      fontFamily: FONTE,
      fontWeight: 600,
      fontSize: size,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      padding: `${size * 0.22}px ${size * 0.5}px`,
      borderRadius: 2,
      lineHeight: 1.1,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {t}
  </div>
);

const Abs: React.FC<{x: number; y: number; w?: number; h?: number; o?: number; s?: number; dx?: number; dy?: number; r?: number; origin?: string; style?: React.CSSProperties; children?: React.ReactNode}> = ({
  x,
  y,
  w,
  h,
  o = 1,
  s = 1,
  dx = 0,
  dy = 0,
  r = 0,
  origin = 'center',
  style,
  children,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      height: h,
      opacity: cl(o),
      transform: `translate(${dx}px, ${dy}px) scale(${Math.max(0.001, s)}) rotate(${r}deg)`,
      transformOrigin: origin,
      ...style,
    }}
  >
    {children}
  </div>
);

const Svg: React.FC<{o?: number; children: React.ReactNode}> = ({o = 1, children}) => (
  <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: o}} width={1080} height={1920}>
    {children}
  </svg>
);

const Seta: React.FC<{x1: number; y1: number; x2: number; y2: number; cor?: string; p?: number; w?: number}> = ({x1, y1, x2, y2, cor = COR.petroleoClaro, p = 1, w = 5}) => {
  if (p <= 0) return null;
  const xe = x1 + (x2 - x1) * p;
  const ye = y1 + (y2 - y1) * p;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const L = 16;
  return (
    <Svg>
      <line x1={x1} y1={y1} x2={xe} y2={ye} stroke={cor} strokeWidth={w} />
      {p > 0.9 ? (
        <polygon
          points={`${xe},${ye} ${xe - L * Math.cos(ang - 0.5)},${ye - L * Math.sin(ang - 0.5)} ${xe - L * Math.cos(ang + 0.5)},${ye - L * Math.sin(ang + 0.5)}`}
          fill={cor}
        />
      ) : null}
    </Svg>
  );
};

const Check: React.FC<{size?: number; bg?: string}> = ({size = 40, bg = COR.petroleo}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{flexShrink: 0}}>
    <rect width="40" height="40" rx="4" fill={bg} />
    <path d="M10 21 L17 28 L30 13" stroke="#fff" strokeWidth="4.5" fill="none" strokeLinecap="square" />
  </svg>
);

const Xis: React.FC<{size?: number; bg?: string}> = ({size = 40, bg = COR.erro}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{flexShrink: 0}}>
    <rect width="40" height="40" rx="4" fill={bg} />
    <path d="M12 12 L28 28 M28 12 L12 28" stroke="#fff" strokeWidth="4.5" strokeLinecap="square" />
  </svg>
);

/** número que rola até o valor, com separador de milhar pt-BR */
const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** cartão escuro padrão */
const card = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: COR.sup,
  border: `1px solid ${COR.borda}`,
  borderRadius: 6,
  boxSizing: 'border-box',
  ...extra,
});
// ======================= CENAS (camada ELEMENTOS) — Maior IPO da história =======================
// Zona A (acima da cabeça): y 390–700. Centro (Bruno fora): y 760–1480. Laterais atrás do Bruno: x 20–250 / 830–1060.
// Fronteira: nada do trabalho do Bruno. Painel de cotações genérico (sem marca). Print do Vitor Olivier a pedido do Bruno, com crédito.
// ======================= CENAS (camada ELEMENTOS) — Você pode ter a sua própria IA =======================
// Zona A (acima da cabeça): y 390–700. Centro (Bruno fora): y 700–1100 e 1250–1470 (a legenda fica em ~1120–1240).
// Laterais atrás do Bruno: x 20–250 / 830–1060, y 800–1500. Fronteira: nada do trabalho do Bruno.
// Decisões do Bruno (22/11): tela segue a fala ("Sol", "Opus", "16 GB de RAM"), sem rodapé de fonte, sem "Falai, o que você acha?" escrito.

const LG = (n: string) => staticFile(`logos/${n}.png`);
const Logo: React.FC<{n: string; size: number; style?: React.CSSProperties}> = ({n, size, style}) => (
  <Img src={LG(n)} style={{width: size, height: size, objectFit: 'contain', display: 'block', ...style}} />
);

/** chip de texto (pílula) */
const Chip: React.FC<{t: string; bg?: string; fg?: string; size?: number; borda?: string}> = ({t, bg = COR.sup, fg = COR.branco, size = 34, borda}) => (
  <span style={{...txt(size, 600, fg), background: bg, padding: `${size * 0.28}px ${size * 0.6}px`, borderRadius: 4, border: borda ? `2px solid ${borda}` : undefined, whiteSpace: 'nowrap', display: 'inline-block'}}>{t}</span>
);

/** notebook genérico (tela escura + base) */
const Notebook: React.FC<{w: number; children?: React.ReactNode; brilho?: number}> = ({w, children, brilho = 0}) => {
  const h = w * 0.62;
  return (
    <div style={{width: w, position: 'relative'}}>
      <div style={{width: w, height: h, background: COR.sup, border: `${Math.max(4, w * 0.02)}px solid ${brilho > 0 ? COR.ambar : COR.borda}`, borderRadius: 10, boxSizing: 'border-box', overflow: 'hidden', position: 'relative'}}>
        {children}
      </div>
      <div style={{width: w * 1.16, marginLeft: -w * 0.08, height: Math.max(10, w * 0.05), background: COR.cinza1, borderRadius: '0 0 10px 10px'}} />
    </div>
  );
};

/** bolo em SVG (camadas brancas, cobertura âmbar) — fatia = só a fatia */
const Bolo: React.FC<{w: number; fatia?: boolean; corte?: number}> = ({w, fatia, corte = 0}) => {
  const h = w * 0.8;
  if (fatia)
    return (
      <svg width={w} height={h} viewBox="0 0 200 160" style={{display: 'block', overflow: 'visible'}}>
        <polygon points="20,130 180,130 180,60 20,90" fill={COR.claro} />
        <polygon points="20,90 180,60 180,72 20,102" fill={COR.ambar} />
        <polygon points="20,112 180,98 180,106 20,120" fill={COR.ambarEsc} />
        <polygon points="20,80 180,48 180,60 20,90" fill={COR.ambar} />
        <circle cx="160" cy="44" r="9" fill={COR.erro} />
        <rect x="0" y="130" width="200" height="10" rx="5" fill={COR.cinza1} />
      </svg>
    );
  return (
    <svg width={w} height={h} viewBox="0 0 200 160" style={{display: 'block', overflow: 'visible'}}>
      <rect x="0" y="140" width="200" height="12" rx="6" fill={COR.cinza1} />
      <rect x="20" y="88" width="160" height="52" rx="6" fill={COR.claro} />
      <rect x="20" y="108" width="160" height="8" fill={COR.ambarEsc} />
      <rect x="40" y="46" width="120" height="44" rx="6" fill={COR.claro} />
      <rect x="40" y="46" width="120" height="12" rx="6" fill={COR.ambar} />
      <rect x="20" y="88" width="160" height="10" fill={COR.ambar} />
      <circle cx="100" cy="36" r="10" fill={COR.erro} />
      {corte > 0 ? <line x1={100} y1={46} x2={100} y2={46 + 94 * corte} stroke={COR.fundo} strokeWidth={4} /> : null}
    </svg>
  );
};

/** engrenagem girando (o motor) */
const Engrenagem: React.FC<{size: number; r: number; cor?: string}> = ({size, r, cor = COR.claro}) => {
  const dentes = 10;
  const pts: string[] = [];
  for (let i = 0; i < dentes * 2; i++) {
    const a = (i / (dentes * 2)) * Math.PI * 2;
    const R = i % 2 ? 40 : 48;
    pts.push(`${50 + R * Math.cos(a)},${50 + R * Math.sin(a)}`);
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{display: 'block', transform: `rotate(${r}deg)`}}>
      <polygon points={pts.join(' ')} fill={cor} />
      <circle cx="50" cy="50" r="16" fill={COR.fundo} />
    </svg>
  );
};

/** motor: duas engrenagens encaixadas */
const Motor: React.FC<{w: number; t: number; cor?: string}> = ({w, t, cor}) => (
  <div style={{width: w, height: w * 0.7, position: 'relative'}}>
    <div style={{position: 'absolute', left: 0, top: 0}}>
      <Engrenagem size={w * 0.62} r={t * 90} cor={cor} />
    </div>
    <div style={{position: 'absolute', left: w * 0.5, top: w * 0.28}}>
      <Engrenagem size={w * 0.42} r={-t * 135 + 9} cor={COR.ambar} />
    </div>
  </div>
);

/** contorno de carro desenhado (p = quanto já foi desenhado) */
const Carro: React.FC<{w: number; p?: number; cor?: string; fill?: string}> = ({w, p = 1, cor = COR.branco, fill = 'none'}) => {
  const L = 1100;
  return (
    <svg width={w} height={w * 0.5} viewBox="0 0 400 200" style={{display: 'block', overflow: 'visible'}}>
      <path
        d="M20 140 L20 110 Q22 92 48 88 L110 80 L160 40 Q170 32 186 32 L276 32 Q292 32 302 42 L340 82 L370 88 Q384 92 384 108 L384 140 Z"
        fill={fill}
        stroke={cor}
        strokeWidth={8}
        strokeLinejoin="round"
        strokeDasharray={L}
        strokeDashoffset={L * (1 - cl(p))}
      />
      <circle cx="100" cy="146" r="28" fill={COR.fundo} stroke={cor} strokeWidth={8} opacity={cl(p * 1.5 - 0.5)} />
      <circle cx="304" cy="146" r="28" fill={COR.fundo} stroke={cor} strokeWidth={8} opacity={cl(p * 1.5 - 0.5)} />
    </svg>
  );
};

const Cadeado: React.FC<{size: number; fechado?: number; cor?: string}> = ({size, fechado = 1, cor = COR.petroleoClaro}) => (
  <svg width={size} height={size} viewBox="0 0 40 44" style={{display: 'block', overflow: 'visible'}}>
    <path d={`M10 ${20 - 4 * (1 - fechado)} L10 12 Q10 2 20 2 Q30 2 30 12 L30 ${20 - 8 * (1 - fechado)}`} stroke={cor} strokeWidth={4.5} fill="none" />
    <rect x="4" y="20" width="32" height="22" rx="3" fill={cor} />
    <circle cx="20" cy="31" r="4" fill={COR.fundo} />
  </svg>
);

const Nuvem: React.FC<{w: number; cor?: string}> = ({w, cor = COR.cinza1}) => (
  <svg width={w} height={w * 0.6} viewBox="0 0 100 60" style={{display: 'block'}}>
    <path d="M22 56 Q4 56 4 40 Q4 26 20 25 Q22 8 42 8 Q58 8 63 22 Q68 16 78 18 Q92 22 92 36 Q98 40 96 48 Q94 56 84 56 Z" fill={cor} />
  </svg>
);

/** pontos correndo numa linha (dados indo de A para B) */
const Pontos: React.FC<{x1: number; y1: number; x2: number; y2: number; t: number; a: number; n?: number; cor?: string}> = ({x1, y1, x2, y2, t, a, n = 5, cor = COR.ambar}) => {
  if (t < a) return null;
  return (
    <Svg>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={COR.borda} strokeWidth={4} strokeDasharray="10 10" />
      {Array.from({length: n}).map((_, i) => {
        const p = ((t - a) * 0.8 + i / n) % 1;
        return <circle key={i} cx={x1 + (x2 - x1) * p} cy={y1 + (y2 - y1) * p} r={9} fill={cor} />;
      })}
    </Svg>
  );
};

// 1 · "Tem IA boa que você baixa, roda no seu computador e ninguém te cobra nada por mês."
const CenaGancho: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const nb = ent(t, 0.15, 0.4);
  const desce = ent(t, m.baixa - 0.2, 0.7);
  const barra = cl((t - m.baixa) / 2.2);
  const zero = pop(t, m.nada - 0.15, 0.35);
  return (
    <>
      {/* notebook na lateral esquerda (atrás do Bruno), arquivo do modelo descendo para dentro */}
      <Abs x={34} y={900} o={nb} dy={(1 - nb) * 30}>
        <Notebook w={300} brilho={barra >= 1 ? 1 : 0}>
          <div style={{position: 'absolute', left: 24, right: 24, bottom: 30}}>
            <div style={txt(22, 600, COR.sec)}>baixando modelo</div>
            <div style={{height: 16, background: COR.sup2, borderRadius: 8, marginTop: 8, overflow: 'hidden'}}>
              <div style={{width: `${barra * 100}%`, height: '100%', background: COR.ambar}} />
            </div>
            <div style={txt(24, 600, COR.ambar, {marginTop: 6, fontVariantNumeric: 'tabular-nums'})}>{Math.round(barra * 100)}%</div>
          </div>
        </Notebook>
      </Abs>
      <Abs x={110} y={520 + 360 * desce} o={desce > 0 ? 1 - cl((barra - 0.85) / 0.15) : 0} s={1 - 0.45 * desce}>
        <div style={card({width: 150, height: 180, padding: 14, borderColor: COR.ambar})}>
          <div style={{width: 60, height: 10, background: COR.ambar, borderRadius: 5}} />
          <div style={txt(30, 600, COR.branco, {marginTop: 70})}>modelo</div>
        </div>
      </Abs>
      {/* "nada por mês" */}
      <Abs x={790} y={930} w={270} o={cl(zero)} s={0.7 + 0.3 * cl(zero)} origin="center">
        <div style={card({padding: '18px 20px', textAlign: 'center'})}>
          <div style={txt(76, 600, COR.ambar, {fontVariantNumeric: 'tabular-nums'})}>R$ 0</div>
          <div style={txt(30, 400, COR.claro, {marginTop: 4})}>por mês</div>
        </div>
      </Abs>
    </>
  );
};

// 2 · "E ela está só uns 4 meses atrás das melhores do mundo." (Bruno fora)
const Pista: React.FC<{y: number; nome: string; cor: string; x: number; logo?: string}> = ({y, nome, cor, x}) => (
  <>
    <Abs x={90} y={y} w={900} h={110} style={{borderTop: `3px solid ${COR.borda}`, borderBottom: `3px solid ${COR.borda}`}} />
    <Abs x={90} y={y + 42} w={900} h={4} style={{background: `repeating-linear-gradient(90deg, ${COR.cinza1} 0 30px, transparent 30px 60px)`}} />
    <Abs x={100} y={y - 52} style={txt(34, 600, cor)}>{nome}</Abs>
    <Abs x={x} y={y + 14} w={120} h={82} style={{background: cor, borderRadius: 8}} />
  </>
);
const CenaCorrida: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const run = ent(t, c.start, 1.2);
  const xf = 140 + 700 * run;
  const xa = 140 + 470 * run;
  const gap = pop(t, m.quatro - 0.1, 0.35);
  const top = ent(t, m.melhores - 0.2, 0.4);
  return (
    <>
      <Pista y={760} nome="Fechados" cor={COR.cobalto} x={xf} />
      <Pista y={960} nome="Abertos" cor={COR.ambar} x={xa} />
      <Svg o={cl(gap)}>
        <line x1={xa + 120} y1={1110} x2={xf} y2={1110} stroke={COR.ambar} strokeWidth={5} />
        <line x1={xa + 120} y1={1095} x2={xa + 120} y2={1125} stroke={COR.ambar} strokeWidth={5} />
        <line x1={xf} y1={1095} x2={xf} y2={1125} stroke={COR.ambar} strokeWidth={5} />
      </Svg>
      <Abs x={0} y={1270} w={1080} o={cl(gap)} s={0.8 + 0.2 * cl(gap)} style={{textAlign: 'center'}}>
        <div style={txt(150, 600, COR.ambar, {letterSpacing: '-0.03em'})}>~4 meses</div>
      </Abs>
      <Abs x={880} y={712} o={top} style={txt(28, 600, COR.sec)}>
        o topo
      </Abs>
      <Abs x={960} y={760} w={10} h={310} o={top} style={{background: `repeating-linear-gradient(0deg, ${COR.branco} 0 20px, ${COR.fundo} 20px 40px)`}} />
    </>
  );
};

// 3 · "Quem mediu isso foi a Epoch AI, um instituto que acompanha a evolução da IA." (Bruno na tela)
const CenaEpoch: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = pop(t, m.epoch - 0.15, 0.4);
  const inst = ent(t, m.inst - 0.1, 0.35);
  const evol = cl((t - m.evol + 0.3) / 1.2);
  const bars = [0.3, 0.42, 0.5, 0.62, 0.7, 0.84];
  return (
    <>
      <Abs x={90} y={420} w={900} o={cl(k)} s={0.85 + 0.15 * cl(k)} origin="left center">
        <div style={card({padding: '28px 34px'})}>
          <div style={txt(78, 600, COR.branco)}>Epoch AI</div>
          <div style={{...txt(36, 400, COR.claro, {marginTop: 10}), opacity: inst}}>instituto que acompanha a evolução da IA</div>
        </div>
      </Abs>
      {/* gráficos de evolução atrás do Bruno */}
      {[0, 1].map((lado) => (
        <Abs key={lado} x={lado ? 836 : 30} y={880} w={220} h={360} o={ent(t, c.start + 0.2 + lado * 0.15, 0.4)} style={{display: 'flex', alignItems: 'flex-end', gap: 10}}>
          {bars.map((b, i) => (
            <div key={i} style={{flex: 1, height: `${100 * b * cl(evol * 1.4 - i * 0.12)}%`, background: i === bars.length - 1 ? COR.ambar : COR.cinza1, borderRadius: 3}} />
          ))}
        </Abs>
      ))}
    </>
  );
};

// 4 · "Desde janeiro, os melhores modelos abertos estão, em média, 4 meses atrás dos fechados." (Bruno fora)
const CenaLinha: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const x0 = 130;
  const x1 = 950;
  const y0 = 1060;
  const y1 = 740;
  const p = cl((t - m.jan) / 2.2);
  const curva = (off: number) => {
    const pts: string[] = [];
    const N = 40;
    for (let i = 0; i <= N * p; i++) {
      const u = i / N;
      const x = x0 + (x1 - x0) * u;
      const v = Math.pow(cl(u - off), 0.85) / Math.pow(1 - off, 0.85);
      pts.push(`${x},${y0 - (y0 - y1) * v * 0.95}`);
    }
    return pts.join(' ');
  };
  const off = 0.22;
  const gap = pop(t, m.quatro - 0.1, 0.35);
  const ab = ent(t, m.abertos - 0.2, 0.3);
  const fe = ent(t, m.fechados - 0.3, 0.3);
  const yg = y0 - (y0 - y1) * 0.6;
  const xa = x0 + (x1 - x0) * (off + (1 - off) * Math.pow(0.6 / 0.95, 1 / 0.85));
  const xf = x0 + (x1 - x0) * Math.pow(0.6 / 0.95, 1 / 0.85);
  return (
    <>
      <Svg>
        <line x1={x0} y1={y0} x2={x1} y2={y0} stroke={COR.borda} strokeWidth={4} />
        <line x1={x0} y1={y0} x2={x0} y2={y1 - 20} stroke={COR.borda} strokeWidth={4} />
        <polyline points={curva(0)} fill="none" stroke={COR.cobalto} strokeWidth={8} />
        <polyline points={curva(off)} fill="none" stroke={COR.ambar} strokeWidth={8} opacity={0.3 + 0.7 * ab} />
        {gap > 0 ? (
          <>
            <line x1={xf} y1={yg} x2={xa} y2={yg} stroke={COR.branco} strokeWidth={5} opacity={cl(gap)} />
            <circle cx={xf} cy={yg} r={10} fill={COR.cobalto} opacity={cl(gap)} />
            <circle cx={xa} cy={yg} r={10} fill={COR.ambar} opacity={cl(gap)} />
          </>
        ) : null}
      </Svg>
      <Abs x={x0 - 20} y={y0 + 14} style={txt(30, 600, COR.sec)}>jan/2026</Abs>
      <Abs x={x1 - 80} y={y0 + 14} style={txt(30, 600, COR.sec)}>hoje</Abs>
      <Abs x={(xf + xa) / 2 - 140} y={yg - 90} w={280} o={cl(gap)} s={0.8 + 0.2 * cl(gap)} style={{textAlign: 'center'}}>
        <Chip t="4 meses" bg={COR.ambar} fg={COR.preto} size={40} />
      </Abs>
      <Abs x={90} y={1280} w={900} o={ent(t, c.start + 0.3, 0.4)} style={{display: 'flex', gap: 26, justifyContent: 'center'}}>
        <div style={{opacity: 0.4 + 0.6 * fe}}>
          <Chip t="Fechados" bg={COR.cobalto} size={40} />
        </div>
        <div style={{opacity: 0.4 + 0.6 * ab}}>
          <Chip t="Abertos" bg={COR.ambar} fg={COR.preto} size={40} />
        </div>
      </Abs>
      <Abs x={0} y={1390} w={1080} o={ent(t, m.quatro + 0.4, 0.4)} style={{textAlign: 'center', ...txt(38, 400, COR.claro)}}>
        em média, desde janeiro
      </Abs>
    </>
  );
};

// 5 · "Só que aberto quer dizer duas coisas diferentes." (Bruno na tela)
const CenaDuas: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const a = pop(t, m.aberto - 0.15, 0.35);
  const s = ent(t, m.duas - 0.1, 0.45);
  return (
    <>
      <Abs x={0} y={420} w={1080} o={cl(a)} s={0.8 + 0.2 * cl(a)} style={{textAlign: 'center'}}>
        <span style={{...txt(110, 600, COR.branco), opacity: 1 - 0.7 * s}}>“aberto”</span>
      </Abs>
      <Abs x={90 - 40 * s} y={590} o={s} dx={-(1 - s) * 60}>
        <Chip t="sentido 1" bg={COR.sup} borda={COR.ambar} size={40} />
      </Abs>
      <Abs x={690 + 40 * s} y={590} o={s} dx={(1 - s) * 60}>
        <Chip t="sentido 2" bg={COR.sup} borda={COR.petroleoClaro} size={40} />
      </Abs>
      <Seta x1={470} y1={560} x2={260} y2={600} cor={COR.ambar} p={s} />
      <Seta x1={610} y1={560} x2={800} y2={600} cor={COR.petroleoClaro} p={s} />
    </>
  );
};

// 6 · "Pensa num bolo." (Bruno na tela, bolo grande atrás)
const CenaBolo: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const k = pop(t, c.start, 0.4);
  return (
    <Abs x={240} y={420} w={600} o={cl(k)} s={0.6 + 0.4 * cl(k)} r={(1 - cl(k)) * -8}>
      <Bolo w={600} />
    </Abs>
  );
};

// 7 · "Modelo fechado, tipo o Sol da OpenAI e o Opus da Anthropic, é a fatia na padaria." (Bruno fora)
const CenaFatia: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const vit = ent(t, c.start, 0.4);
  const sol = pop(t, m.sol - 0.1, 0.35);
  const opus = pop(t, m.opus - 0.1, 0.35);
  const fat = pop(t, m.fatia - 0.15, 0.4);
  return (
    <>
      {/* vitrine da padaria */}
      <Abs x={120} y={720} w={840} h={380} o={vit} style={{border: `4px solid ${COR.borda}`, borderRadius: 10, background: 'rgba(255,255,255,0.03)'}} />
      <Abs x={120} y={720} w={840} h={50} o={vit} style={{background: COR.sup2, borderRadius: '8px 8px 0 0', textAlign: 'center', ...txt(30, 600, COR.sec, {lineHeight: '50px', letterSpacing: '0.2em'})}}>
        PADARIA
      </Abs>
      <Abs x={140} y={712} w={800} h={420} o={vit * 0.25} style={{background: 'linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.4) 48%, transparent 56%)', transform: `translateX(${((t * 160) % 1400) - 700}px)`}} />
      <Abs x={400} y={840} w={280} s={0.8 + 0.2 * cl(fat)} o={vit}>
        <Bolo w={280} fatia />
      </Abs>
      {/* etiquetas */}
      <Abs x={140} y={820} o={cl(sol)} s={0.7 + 0.3 * cl(sol)} origin="left center" style={{display: 'flex', alignItems: 'center', gap: 14, ...card({padding: '12px 18px'})}}>
        <Logo n="openai" size={56} />
        <div>
          <div style={txt(44, 600, COR.branco)}>Sol</div>
          <div style={txt(22, 400, COR.sec)}>OpenAI</div>
        </div>
      </Abs>
      <Abs x={700} y={820} o={cl(opus)} s={0.7 + 0.3 * cl(opus)} origin="right center" style={{display: 'flex', alignItems: 'center', gap: 14, ...card({padding: '12px 18px'})}}>
        <Logo n="claude-chat-icon" size={56} />
        <div>
          <div style={txt(44, 600, COR.branco)}>Opus</div>
          <div style={txt(22, 400, COR.sec)}>Anthropic</div>
        </div>
      </Abs>
      <Abs x={0} y={1290} w={1080} o={cl(fat)} s={0.8 + 0.2 * cl(fat)} style={{textAlign: 'center'}}>
        <Chip t="Fechado: você só usa" bg={COR.ambar} fg={COR.preto} size={52} />
      </Abs>
    </>
  );
};

// 8 · "Você paga e come, mas não leva nada pra casa." (Bruno fora)
const Casa: React.FC<{w: number; cor?: string}> = ({w, cor = COR.claro}) => (
  <svg width={w} height={w} viewBox="0 0 100 100" style={{display: 'block'}}>
    <path d="M10 48 L50 12 L90 48 L80 48 L80 90 L20 90 L20 48 Z" fill="none" stroke={cor} strokeWidth={6} strokeLinejoin="round" />
    <rect x="42" y="62" width="16" height="28" fill={cor} />
  </svg>
);
const CenaPaga: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const moeda = ent(t, m.paga - 0.3, 0.45);
  const come = cl((t - m.come) / 0.9);
  const casa = pop(t, m.nada - 0.2, 0.35);
  return (
    <>
      {/* moeda caindo no caixa */}
      <Abs x={150} y={720 + 220 * moeda} o={1 - cl((moeda - 0.9) / 0.1) * 0.6} style={{width: 120, height: 120, borderRadius: 60, background: COR.ambar, textAlign: 'center', ...txt(56, 600, COR.preto, {lineHeight: '120px'})}}>
        R$
      </Abs>
      <Abs x={110} y={950} w={200} h={110} style={{...card(), borderColor: COR.ambar}}>
        <div style={txt(28, 600, COR.sec, {textAlign: 'center', marginTop: 34})}>paga</div>
      </Abs>
      {/* a fatia sendo comida */}
      <Abs x={400} y={800} w={280} style={{clipPath: `inset(0 ${come * 70}% 0 0)`}}>
        <Bolo w={280} fatia />
      </Abs>
      <Abs x={420} y={1030} w={240} o={ent(t, m.come, 0.3)} style={{textAlign: 'center', ...txt(32, 600, COR.sec)}}>
        come
      </Abs>
      {/* casa vazia */}
      <Abs x={760} y={800} o={cl(casa)} s={0.7 + 0.3 * cl(casa)}>
        <Casa w={220} />
        <div style={{position: 'absolute', right: -10, top: -10}}>
          <Xis size={64} />
        </div>
      </Abs>
      <Abs x={0} y={1290} w={1080} o={cl(casa)} style={{textAlign: 'center'}}>
        <span style={txt(54, 600, COR.branco)}>
          não leva <span style={{color: COR.ambar}}>nada</span> pra casa
        </span>
      </Abs>
    </>
  );
};

// 9 · "Open weight, que é o peso aberto, é o bolo inteiro pronto." (Bruno na tela)
const CenaInteiro: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.35);
  const peso = ent(t, m.peso - 0.1, 0.35);
  const bolo = pop(t, m.inteiro - 0.2, 0.4);
  const vai = ent(t, m.inteiro + 0.4, 0.6);
  return (
    <>
      <Abs x={90} y={410} w={900} o={k} dy={(1 - k) * 20}>
        <div style={txt(92, 600, COR.branco)}>Open weight</div>
        <div style={{...txt(46, 400, COR.claro, {marginTop: 8}), opacity: peso}}>
          = <span style={{color: COR.ambar, fontWeight: 600}}>peso aberto</span>
        </div>
      </Abs>
      {/* bolo inteiro numa caixa, indo para casa (atrás do Bruno) */}
      <Abs x={40 + 560 * vai} y={880} o={cl(bolo)} s={0.7 + 0.3 * cl(bolo)}>
        <div style={{width: 240, height: 200, border: `4px solid ${COR.ambar}`, borderRadius: 8, padding: '20px 20px 0', boxSizing: 'border-box'}}>
          <Bolo w={196} />
        </div>
      </Abs>
      <Abs x={830} y={860} o={ent(t, m.inteiro + 0.2, 0.3)}>
        <Casa w={220} cor={COR.ambar} />
      </Abs>
    </>
  );
};

// 10 · "Você leva, corta e decora, mas não sabe a receita." (Bruno na tela)
const CenaReceita: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const it = [
    {t: 'leva', a: m.leva},
    {t: 'corta', a: m.corta},
    {t: 'decora', a: m.decora},
  ];
  const rec = pop(t, m.receita - 0.15, 0.35);
  return (
    <>
      <Abs x={90} y={410} w={900} style={{display: 'flex', gap: 22}}>
        {it.map((x, i) => {
          const o = pop(t, x.a - 0.1, 0.3);
          return (
            <div key={i} style={{opacity: cl(o), transform: `scale(${0.6 + 0.4 * cl(o)})`, display: 'flex', alignItems: 'center', gap: 10}}>
              <Check size={44} />
              <span style={txt(48, 600, COR.branco)}>{x.t}</span>
            </div>
          );
        })}
      </Abs>
      <Abs x={90} y={520} w={900} o={cl(rec)} s={0.8 + 0.2 * cl(rec)} origin="left center" style={{display: 'flex', alignItems: 'center', gap: 20}}>
        <div style={card({width: 110, height: 130, padding: 14, position: 'relative'})}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{height: 8, background: COR.cinza1, borderRadius: 4, marginBottom: 14, width: `${90 - i * 12}%`, filter: 'blur(2px)'}} />
          ))}
          <div style={{position: 'absolute', right: -18, bottom: -18}}>
            <Cadeado size={52} cor={COR.ambar} />
          </div>
        </div>
        <div>
          <div style={txt(44, 600, COR.branco)}>a receita, não</div>
          <div style={txt(30, 400, COR.sec, {marginTop: 6})}>o modelo é seu, a receita não</div>
        </div>
      </Abs>
      {/* bolo cortado atrás do Bruno */}
      <Abs x={30} y={900} o={ent(t, c.start, 0.3)}>
        <Bolo w={230} corte={cl((t - m.corta) / 0.4)} />
      </Abs>
      <Abs x={830} y={900} o={ent(t, m.decora - 0.1, 0.3)} r={Math.sin(t * 3) * 6}>
        <svg width={220} height={200} viewBox="0 0 100 90">
          <path d="M20 10 L80 10 L56 50 L56 82 L44 82 L44 50 Z" fill={COR.claro} />
          <circle cx="50" cy="86" r="4" fill={COR.ambar} />
        </svg>
      </Abs>
    </>
  );
};

// 11 · "E open source de verdade é o bolo, a receita e a lista de ingredientes. Os pesos, o código e as informações dos dados de treino." (Bruno fora)
const CenaOpenSource: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const selo = pop(t, c.start + 0.1, 0.4);
  const itens = [
    {a: m.bolo, b: m.pesos, nome: 'Pesos', el: <Bolo w={220} />},
    {
      a: m.receita,
      b: m.codigo,
      nome: 'Código',
      el: (
        <div style={card({width: 200, height: 176, padding: 18, margin: '0 10px'})}>
          <div style={txt(24, 600, COR.ambar)}>receita</div>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{height: 8, background: COR.cinza1, borderRadius: 4, marginTop: 16, width: `${92 - i * 14}%`}} />
          ))}
        </div>
      ),
    },
    {
      a: m.lista,
      b: m.dados,
      nome: 'Dados de treino',
      el: (
        <div style={card({width: 200, height: 176, padding: 18, margin: '0 10px'})}>
          <div style={txt(24, 600, COR.ambar)}>ingredientes</div>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 10, marginTop: 14}}>
              <div style={{width: 16, height: 16, borderRadius: 8, background: COR.petroleoClaro}} />
              <div style={{height: 8, flex: 1, background: COR.cinza1, borderRadius: 4}} />
            </div>
          ))}
        </div>
      ),
    },
  ];
  return (
    <>
      <Abs x={0} y={440} w={1080} o={cl(selo)} s={0.7 + 0.3 * cl(selo)} style={{textAlign: 'center'}}>
        <Chip t="Open source" bg={COR.petroleo} size={64} />
      </Abs>
      <Abs x={60} y={800} w={960} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
        {itens.map((x, i) => {
          const o = pop(t, x.a - 0.15, 0.4);
          return (
            <div key={i} style={{width: 300, display: 'flex', justifyContent: 'center', opacity: cl(o), transform: `translateY(${(1 - cl(o)) * 40}px) scale(${0.7 + 0.3 * cl(o)})`}}>
              {x.el}
            </div>
          );
        })}
      </Abs>
      <Abs x={60} y={1280} w={960} style={{display: 'flex', justifyContent: 'space-between'}}>
        {itens.map((x, i) => {
          const o = pop(t, x.b - 0.15, 0.35);
          return (
            <div key={i} style={{width: 300, textAlign: 'center', opacity: cl(o), transform: `scale(${0.7 + 0.3 * cl(o)})`}}>
              <Chip t={x.nome} bg={COR.sup} borda={COR.petroleoClaro} size={i === 2 ? 30 : 36} />
            </div>
          );
        })}
      </Abs>
      <Svg o={ent(t, m.pesos, 0.3)}>
        {[210, 540, 870].map((x, i) => (
          <line key={i} x1={x} y1={1010} x2={x} y2={1060} stroke={COR.petroleoClaro} strokeWidth={4} opacity={ent(t, [m.pesos, m.codigo, m.dados][i], 0.3)} />
        ))}
      </Svg>
    </>
  );
};

// 12 · "E aqui fica interessante. Até a OpenAI liberou o modelo com pesos abertos." (Bruno na tela)
const CenaOpenAI: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const lg = pop(t, m.openai - 0.2, 0.45);
  const lib = pop(t, m.liberou - 0.1, 0.35);
  const pes = ent(t, m.pesos - 0.1, 0.35);
  return (
    <>
      {/* brilho do regancho atrás do Bruno */}
      <Svg o={ent(t, c.start, 0.3) * (1 - cl((t - m.openai + 0.4) / 0.4))}>
        {Array.from({length: 12}).map((_, i) => {
          const a = (i / 12) * Math.PI * 2 + t * 0.6;
          return <line key={i} x1={540 + 120 * Math.cos(a)} y1={900 + 120 * Math.sin(a)} x2={540 + 420 * Math.cos(a)} y2={900 + 420 * Math.sin(a)} stroke={COR.ambar} strokeWidth={6} opacity={0.5} />;
        })}
      </Svg>
      <Abs x={340} y={720} o={cl(lg)} s={0.6 + 0.4 * cl(lg)} r={(t - m.openai) * 10}>
        <Logo n="openai" size={400} style={{opacity: 0.9}} />
      </Abs>
      <Abs x={90} y={430} w={900} o={cl(lib)} s={0.85 + 0.15 * cl(lib)} origin="left center" style={{display: 'flex', alignItems: 'center', gap: 22}}>
        <Logo n="openai" size={84} />
        <div>
          <div style={txt(56, 600, COR.branco)}>OpenAI liberou</div>
          <div style={{...txt(40, 400, COR.claro, {marginTop: 6}), opacity: pes}}>
            um modelo de <span style={{color: COR.ambar, fontWeight: 600}}>peso aberto</span>
          </div>
        </div>
      </Abs>
    </>
  );
};

// 13 · "Que pode rodar até no seu computador com 16 GB de RAM." (Bruno na tela)
const CenaRam: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const nb = ent(t, m.comp - 0.3, 0.4);
  const gb = pop(t, m.gb - 0.15, 0.4);
  return (
    <>
      <Abs x={90} y={420} o={nb} dy={(1 - nb) * 30}>
        <Notebook w={360}>
          <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Logo n="openai" size={110} />
          </div>
        </Notebook>
      </Abs>
      <Abs x={520} y={470} o={cl(gb)} s={0.6 + 0.4 * cl(gb)} origin="left center">
        <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
          <svg width={110} height={110} viewBox="0 0 50 50">
            <rect x="8" y="8" width="34" height="34" rx="3" fill="none" stroke={COR.ambar} strokeWidth={3} />
            {[14, 22, 30, 38].map((v) => (
              <g key={v}>
                <line x1={v - 2} y1={2} x2={v - 2} y2={8} stroke={COR.ambar} strokeWidth={2.5} />
                <line x1={v - 2} y1={42} x2={v - 2} y2={48} stroke={COR.ambar} strokeWidth={2.5} />
              </g>
            ))}
          </svg>
          <div>
            <div style={txt(96, 600, COR.ambar, {letterSpacing: '-0.03em'})}>16 GB</div>
            <div style={txt(38, 600, COR.branco)}>de RAM</div>
          </div>
        </div>
      </Abs>
    </>
  );
};

// 14 · "Você baixa o modelo num site, tipo o Hugging Face, abre num programa como o Ollama, ou LM Studio, e a IA roda no seu computador, até sem internet." (Bruno fora)
const CenaFluxo: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const hf = pop(t, m.hf - 0.2, 0.4);
  const ol = pop(t, m.ollama - 0.15, 0.4);
  const lm = pop(t, m.lm - 0.15, 0.4);
  const rd = pop(t, m.roda - 0.3, 0.4);
  const wifi = pop(t, m.internet - 0.15, 0.35);
  const passo = (n: string, a: number) => <div style={{...txt(34, 600, COR.ambar), opacity: ent(t, a, 0.3), marginTop: 14, textAlign: 'center'}}>{n}</div>;
  const digit = cl((t - m.roda) / 1.6);
  const frase = 'Olá! Rodando aqui.';
  return (
    <>
      {/* 1 · baixa */}
      <Abs x={50} y={760} w={280} o={cl(hf)} s={0.7 + 0.3 * cl(hf)}>
        <div style={card({padding: 20, textAlign: 'center'})}>
          <Logo n="huggingface" size={140} style={{margin: '0 auto'}} />
          <div style={txt(30, 600, COR.branco, {marginTop: 10})}>Hugging Face</div>
        </div>
        {passo('1 · baixa', m.hf)}
      </Abs>
      <Pontos x1={330} y1={880} x2={400} y2={880} t={t} a={m.abre} n={3} />
      {/* 2 · abre */}
      <Abs x={400} y={740} w={280}>
        <div style={card({padding: 16})}>
          <div style={{display: 'flex', alignItems: 'center', gap: 14, opacity: cl(ol), transform: `scale(${0.7 + 0.3 * cl(ol)})`}}>
            <Logo n="ollama" size={76} />
            <span style={txt(32, 600, COR.branco)}>Ollama</span>
          </div>
          <div style={{height: 2, background: COR.borda, margin: '12px 0'}} />
          <div style={{display: 'flex', alignItems: 'center', gap: 14, opacity: cl(lm), transform: `scale(${0.7 + 0.3 * cl(lm)})`}}>
            <Logo n="lmstudio" size={76} />
            <span style={txt(32, 600, COR.branco)}>LM Studio</span>
          </div>
        </div>
        {passo('2 · abre', m.ollama)}
      </Abs>
      <Pontos x1={680} y1={880} x2={750} y2={880} t={t} a={m.roda - 0.3} n={3} />
      {/* 3 · roda no computador */}
      <Abs x={750} y={790} w={290} o={cl(rd)} s={0.7 + 0.3 * cl(rd)}>
        <Notebook w={290}>
          <div style={{padding: 16}}>
            <div style={{...txt(22, 600, COR.claro), background: COR.sup2, borderRadius: 6, padding: '8px 10px', display: 'inline-block'}}>{frase.slice(0, Math.round(frase.length * digit))}</div>
          </div>
        </Notebook>
        {passo('3 · roda', m.roda)}
      </Abs>
      {/* sem internet */}
      <Abs x={0} y={1270} w={1080} o={cl(wifi)} s={0.8 + 0.2 * cl(wifi)} style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24}}>
        <svg width={110} height={100} viewBox="0 0 60 54">
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M${10 + i * 7} ${30 - i * 6 + 6} Q30 ${12 - i * 7 + 6} ${50 - i * 7} ${30 - i * 6 + 6}`} stroke={COR.claro} strokeWidth={4.5} fill="none" transform={`translate(0 ${i * 4})`} />
          ))}
          <circle cx="30" cy="44" r="4" fill={COR.claro} />
          <line x1="6" y1="6" x2="54" y2="50" stroke={COR.erro} strokeWidth={6} />
        </svg>
        <span style={txt(60, 600, COR.branco)}>
          até <span style={{color: COR.ambar}}>sem internet</span>
        </span>
      </Abs>
    </>
  );
};

// 15 · "E dá pra você ajustar ele com os seus exemplos. E aí ele de fato vira o seu modelo." (Bruno na tela)
const CenaAjuste: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const box = ent(t, c.start, 0.35);
  const pasta = pop(t, m.exemplos - 0.3, 0.4);
  const voa = cl((t - m.exemplos - 0.3) / 1.2);
  const seu = cl((t - m.seu + 0.15) / 0.3);
  return (
    <>
      <Abs x={90} y={430} o={cl(pasta)} s={0.7 + 0.3 * cl(pasta)}>
        <div style={{width: 240, height: 170, background: COR.ambarEsc, borderRadius: '6px 6px 8px 8px', position: 'relative'}}>
          <div style={{position: 'absolute', left: 0, top: -24, width: 110, height: 30, background: COR.ambarEsc, borderRadius: '6px 6px 0 0'}} />
          <div style={{...txt(30, 600, COR.branco), position: 'absolute', left: 18, bottom: 16}}>seus exemplos</div>
        </div>
      </Abs>
      {[0, 1, 2, 3].map((i) => {
        const p = cl(voa * 1.6 - i * 0.2);
        return p > 0 && p < 1 ? (
          <Abs key={i} x={200 + 480 * p} y={470 - Math.sin(p * Math.PI) * 80 + i * 12} w={80} h={56} style={card({borderColor: COR.ambar})} />
        ) : null;
      })}
      <Abs x={640} y={420} w={350} o={box} dy={(1 - box) * 20}>
        <div style={card({padding: '24px 26px', borderColor: seu > 0.5 ? COR.ambar : COR.borda, borderWidth: 3, textAlign: 'center'})}>
          <div style={{...txt(30, 400, COR.sec), opacity: 1 - seu}}>modelo</div>
          <div style={{...txt(seu > 0.5 ? 52 : 40, 600, seu > 0.5 ? COR.ambar : COR.branco), marginTop: 6}}>{seu > 0.5 ? 'o seu modelo' : 'modelo aberto'}</div>
        </div>
      </Abs>
      <Svg o={ent(t, m.ajustar, 0.3)}>
        {[0, 1].map((lado) => (
          <g key={lado} transform={`translate(${lado ? 940 : 140} 1000) rotate(${t * (lado ? -70 : 70)})`}>
            <circle r={70} fill="none" stroke={COR.cinza1} strokeWidth={14} strokeDasharray="22 14" />
          </g>
        ))}
      </Svg>
    </>
  );
};

// 16 · "Mas o modelo é só o motor, só o cérebro." (Bruno na tela, motor girando atrás)
const CenaMotor: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const mo = pop(t, m.motor - 0.3, 0.4);
  const ce = pop(t, m.cerebro - 0.15, 0.35);
  return (
    <>
      <Abs x={330} y={420} o={cl(mo)} s={0.6 + 0.4 * cl(mo)}>
        <Motor w={420} t={t} />
      </Abs>
      <Abs x={90} y={420} o={cl(mo)} style={txt(56, 600, COR.branco)}>
        modelo
        <div style={txt(56, 600, COR.ambar)}>= motor</div>
      </Abs>
      <Abs x={800} y={430} o={cl(ce)} s={0.6 + 0.4 * cl(ce)} style={{textAlign: 'center'}}>
        <svg width={170} height={150} viewBox="0 0 60 52">
          <path d="M30 6 Q18 2 12 10 Q4 12 6 22 Q0 30 8 36 Q8 46 20 46 Q26 50 30 46 Q34 50 40 46 Q52 46 52 36 Q60 30 54 22 Q56 12 48 10 Q42 2 30 6 Z" fill="none" stroke={COR.claro} strokeWidth={3} />
          <line x1="30" y1="6" x2="30" y2="46" stroke={COR.claro} strokeWidth={3} />
        </svg>
        <div style={txt(34, 600, COR.claro)}>cérebro</div>
      </Abs>
    </>
  );
};

// 17 · "O que você usa todo dia é o carro em volta." (Bruno na tela)
const CenaCarro: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const p = cl((t - c.start - 0.1) / 1.6);
  const lbl = pop(t, m.carro - 0.15, 0.35);
  return (
    <>
      <Abs x={140} y={390}>
        <Carro w={800} p={p} />
      </Abs>
      <Abs x={430} y={500} s={0.5}>
        <Motor w={420} t={t} />
      </Abs>
      <Abs x={0} y={1300} w={1080} />
      <Abs x={90} y={720} o={cl(lbl)} s={0.8 + 0.2 * cl(lbl)} origin="left center">
        <Chip t="o carro em volta" bg={COR.ambar} fg={COR.preto} size={40} />
      </Abs>
    </>
  );
};

// 18 · "E isso tem nome, o harness." (Bruno na tela, regancho com separação 3D)
const CenaHarness: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const h = pop(t, m.harness - 0.25, 0.45);
  const tr = ent(t, m.harness + 0.25, 0.35);
  return (
    <>
      <Abs x={90} y={410} w={900} o={cl(h)} s={0.7 + 0.3 * cl(h)} origin="left center">
        <div style={txt(140, 600, COR.ambar, {letterSpacing: '-0.03em'})}>harness</div>
        <div style={{...txt(40, 400, COR.claro, {marginTop: 8}), opacity: tr}}>= o programa em volta do modelo</div>
      </Abs>
      <Abs x={20} y={880} o={0.5 * ent(t, c.start, 0.3)}>
        <Carro w={260} p={1} cor={COR.cinza1} />
      </Abs>
      <Abs x={800} y={880} o={0.5 * ent(t, c.start, 0.3)}>
        <Carro w={260} p={1} cor={COR.cinza1} />
      </Abs>
    </>
  );
};

// 19 · "Harness é o programa que dá memória, instruções e ferramentas para o modelo." (Bruno fora)
const CenaPecas: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const pecas = [
    {n: 'Memória', a: m.memoria, x: 70, y: 720},
    {n: 'Instruções', a: m.instr, x: 650, y: 720},
    {n: 'Ferramentas', a: m.ferr, x: 360, y: 1290},
  ];
  const p = cl((t - c.start) / 1.2);
  return (
    <>
      <Abs x={240} y={780}>
        <Carro w={600} p={p} cor={COR.claro} />
      </Abs>
      <Abs x={330} y={770} s={0.5}>
        <Motor w={420} t={t} />
      </Abs>
      <Abs x={360} y={1068} w={360} o={ent(t, c.start + 0.3, 0.3)} style={{textAlign: 'center', ...txt(28, 600, COR.sec)}}>
        modelo (motor)
      </Abs>
      {pecas.map((x, i) => {
        const o = pop(t, x.a - 0.15, 0.35);
        return (
          <Abs key={i} x={x.x} y={x.y} o={cl(o)} s={0.6 + 0.4 * cl(o)} dy={(1 - cl(o)) * (i === 2 ? 40 : -40)}>
            <Chip t={x.n} bg={COR.sup} borda={COR.ambar} size={44} />
          </Abs>
        );
      })}
      <Svg>
        <line x1={240} y1={800} x2={330} y2={880} stroke={COR.ambar} strokeWidth={4} opacity={ent(t, m.memoria, 0.3)} />
        <line x1={820} y1={800} x2={740} y2={880} stroke={COR.ambar} strokeWidth={4} opacity={ent(t, m.instr, 0.3)} />
        <line x1={540} y1={1285} x2={540} y2={1250} stroke={COR.ambar} strokeWidth={4} opacity={ent(t, m.ferr, 0.3)} />
      </Svg>
    </>
  );
};

// 20 · "O app do ChatGPT, o Claude Code, o Codex são harness." (Bruno fora)
const CenaApps: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const apps = [
    {n: 'ChatGPT', logo: 'openai', a: m.chatgpt},
    {n: 'Claude Code', logo: 'claude-code', a: m.cc},
    {n: 'Codex', logo: 'codex', a: m.codex},
  ];
  const sao = pop(t, m.sao - 0.15, 0.35);
  return (
    <>
      {apps.map((x, i) => {
        const o = pop(t, x.a - 0.15, 0.4);
        const y = 720 + i * 128;
        return (
          <Abs key={i} x={110} y={y} w={860} h={112} o={cl(o)} dx={(1 - cl(o)) * -80} style={{...card({padding: '0 26px'}), display: 'flex', alignItems: 'center', gap: 24}}>
            <Carro w={150} p={1} cor={COR.cinza1} />
            {x.logo === 'claude-code' ? <Img src={staticFile('logos/claude-code.png')} style={{height: 64, borderRadius: 6}} /> : <Logo n={x.logo} size={64} />}
            <span style={txt(46, 600, COR.branco)}>{x.n}</span>
          </Abs>
        );
      })}
      <Abs x={0} y={1290} w={1080} o={cl(sao)} s={0.8 + 0.2 * cl(sao)} style={{textAlign: 'center'}}>
        <span style={txt(60, 600, COR.branco)}>
          todos são <span style={{color: COR.ambar}}>harness</span>
        </span>
      </Abs>
    </>
  );
};

// 21 · "Quando você usa OpenAI ou Anthropic, você aluga o melhor motor com um carro pronto." (Bruno na tela)
const CenaAluga: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const o1 = pop(t, m.openai - 0.2, 0.35);
  const o2 = pop(t, m.anth - 0.2, 0.35);
  const al = pop(t, m.aluga - 0.15, 0.35);
  const cp = ent(t, m.carro - 0.3, 0.4);
  return (
    <>
      <Abs x={90} y={410} style={{display: 'flex', gap: 24, alignItems: 'center'}}>
        <div style={{opacity: cl(o1), transform: `scale(${0.6 + 0.4 * cl(o1)})`, display: 'flex', alignItems: 'center', gap: 12}}>
          <Logo n="openai" size={64} />
          <span style={txt(44, 600, COR.branco)}>OpenAI</span>
        </div>
        <span style={{...txt(36, 400, COR.sec), opacity: cl(o2)}}>ou</span>
        <div style={{opacity: cl(o2), transform: `scale(${0.6 + 0.4 * cl(o2)})`}}>
          <Img src={staticFile('logos/anthropic.png')} style={{height: 42, filter: 'invert(1)'}} />
        </div>
      </Abs>
      <Abs x={90} y={520} o={cl(al)} s={0.7 + 0.3 * cl(al)} origin="left center" style={{display: 'flex', alignItems: 'center', gap: 18}}>
        <svg width={90} height={60} viewBox="0 0 60 40">
          <circle cx="14" cy="20" r="11" fill="none" stroke={COR.ambar} strokeWidth={4} />
          <path d="M25 20 L56 20 L56 30 M46 20 L46 28" stroke={COR.ambar} strokeWidth={4} fill="none" />
        </svg>
        <Chip t="aluga" bg={COR.ambar} fg={COR.preto} size={44} />
        <span style={{...txt(36, 400, COR.claro), opacity: cp}}>motor + carro pronto</span>
      </Abs>
      <Abs x={20 - 200 * (1 - cp)} y={900} o={cp}>
        <Carro w={250} p={1} cor={COR.claro} fill={COR.sup} />
      </Abs>
      <Abs x={810 + 200 * (1 - cp)} y={900} o={cp}>
        <Carro w={250} p={1} cor={COR.claro} fill={COR.sup} />
      </Abs>
    </>
  );
};

// 22 · "Paga pelo uso e os seus dados vão para o servidor deles." (Bruno na tela)
const CenaServidor: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const pg = ent(t, c.start, 0.35);
  const n = Math.floor(cl((t - c.start) / 2.4) * 42);
  const sv = pop(t, m.servidor - 0.3, 0.4);
  return (
    <>
      <Abs x={90} y={420} o={pg} style={{display: 'flex', alignItems: 'center', gap: 20}}>
        <Chip t="paga pelo uso" bg={COR.sup} borda={COR.ambar} size={40} />
        <span style={txt(56, 600, COR.ambar, {fontVariantNumeric: 'tabular-nums'})}>{n.toString().padStart(2, '0')} usos</span>
      </Abs>
      <Abs x={40} y={900} o={ent(t, m.dados - 0.3, 0.3)}>
        <Notebook w={220} />
      </Abs>
      <Abs x={800} y={540} o={cl(sv)} s={0.6 + 0.4 * cl(sv)} style={{textAlign: 'center'}}>
        <Nuvem w={220} />
        <div style={txt(30, 600, COR.claro, {marginTop: 6})}>servidor deles</div>
      </Abs>
      <Pontos x1={260} y1={920} x2={880} y2={680} t={t} a={m.dados - 0.1} n={6} />
    </>
  );
};

// 23 · "Quando você monta o seu harness, você escolhe um motor aberto ou fechado e decide o que ele acessa. E onde os seus dados ficam." (Bruno fora)
const CenaSeu: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const monta = cl((t - c.start) / 1.4);
  const toggle = t < m.fechado ? 0 : 1;
  const tg = pop(t, m.aberto - 0.2, 0.35);
  const ac = ent(t, m.acessa - 0.2, 0.35);
  const lk = pop(t, m.dados - 0.2, 0.4);
  const acessos = [
    {n: 'seus arquivos', ok: true},
    {n: 'sua agenda', ok: true},
    {n: 'internet', ok: false},
  ];
  return (
    <>
      <Abs x={0} y={410} w={1080} o={ent(t, c.start, 0.3)} style={{textAlign: 'center'}}>
        <Chip t="O seu harness" bg={COR.ambar} fg={COR.preto} size={56} />
      </Abs>
      <Abs x={70} y={720}>
        <Carro w={460} p={monta} cor={COR.ambar} />
      </Abs>
      <Abs x={210} y={740} s={0.42}>
        <Motor w={420} t={t} cor={toggle ? COR.cobalto : COR.claro} />
      </Abs>
      {/* chave inglesa */}
      <Abs x={470} y={700} o={1 - cl((t - c.start - 1.6) / 0.3)} r={Math.sin(t * 9) * 20} origin="20px 20px">
        <svg width={120} height={120} viewBox="0 0 60 60">
          <path d="M8 52 L34 26 M34 26 Q30 14 40 8 Q46 6 50 8 L42 16 L46 20 L54 12 Q56 18 52 24 Q46 32 34 26" stroke={COR.claro} strokeWidth={6} fill="none" strokeLinecap="round" />
        </svg>
      </Abs>
      {/* troca de motor */}
      <Abs x={90} y={1000} o={cl(tg)} s={0.7 + 0.3 * cl(tg)} origin="left center" style={{display: 'flex', alignItems: 'center', gap: 14}}>
        <Chip t="aberto" bg={toggle ? COR.sup : COR.petroleo} size={36} />
        <div style={{width: 90, height: 46, borderRadius: 23, background: COR.sup2, position: 'relative'}}>
          <div style={{position: 'absolute', top: 5, left: toggle ? 49 : 5, width: 36, height: 36, borderRadius: 18, background: COR.ambar}} />
        </div>
        <Chip t="fechado" bg={toggle ? COR.cobalto : COR.sup} size={36} />
      </Abs>
      {/* o que ele acessa */}
      <Abs x={600} y={730} w={420} o={ac} dx={(1 - ac) * 40}>
        <div style={card({padding: '18px 22px'})}>
          <div style={txt(30, 600, COR.sec)}>ele acessa</div>
          {acessos.map((x, i) => (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 14, marginTop: 14, opacity: ent(t, m.acessa + i * 0.2, 0.25)}}>
              {x.ok ? <Check size={38} /> : <Xis size={38} bg={COR.cinza1} />}
              <span style={txt(34, 600, COR.branco)}>{x.n}</span>
            </div>
          ))}
        </div>
      </Abs>
      {/* dados ficam com você */}
      <Abs x={0} y={1270} w={1080} o={cl(lk)} s={0.8 + 0.2 * cl(lk)} style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22}}>
        <Cadeado size={86} fechado={cl((t - m.dados) / 0.4)} cor={COR.ambar} />
        <span style={txt(54, 600, COR.branco)}>
          os dados ficam <span style={{color: COR.ambar}}>com você</span>
        </span>
      </Abs>
    </>
  );
};

// 24 · "Eu trabalho construindo IA para empresas." (Bruno na tela, autoridade) — prédios genéricos, sem nome
const CenaEmpresas: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.35);
  const pr = [
    {x: 30, w: 100, h: 380},
    {x: 140, w: 110, h: 280},
    {x: 830, w: 110, h: 340},
    {x: 950, w: 100, h: 430},
  ];
  return (
    <>
      <Abs x={90} y={420} o={k} dy={(1 - k) * 20}>
        <Chip t="construo IA para empresas" bg={COR.sup} borda={COR.ambar} size={46} />
      </Abs>
      {pr.map((p, i) => {
        const o = ent(t, c.start + 0.1 + i * 0.1, 0.4);
        return (
          <Abs key={i} x={p.x} y={1500 - p.h * o} w={p.w} h={p.h} style={{background: COR.sup, border: `2px solid ${COR.borda}`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: 12, boxSizing: 'border-box', alignContent: 'start'}}>
            {Array.from({length: 10}).map((_, j) => (
              <div key={j} style={{height: 18, background: (j + i + Math.floor(t * 2)) % 5 === 0 || t > m.empresas ? (j % 3 === 0 ? COR.ambar : COR.cinza1) : COR.sup2}} />
            ))}
          </Abs>
        );
      })}
    </>
  );
};

// 25 · "E o que eu vejo é que o carro muda tanto o resultado quanto o motor." (Bruno na tela)
const CenaResultado: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const ca = pop(t, m.carro - 0.2, 0.35);
  const eq = pop(t, m.quanto - 0.1, 0.35);
  const mo = pop(t, m.motor - 0.2, 0.35);
  return (
    <Abs x={90} y={420} w={900} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
      <div style={{opacity: cl(ca), transform: `scale(${0.6 + 0.4 * cl(ca)})`, textAlign: 'center'}}>
        <Carro w={300} p={1} cor={COR.ambar} />
        <div style={txt(38, 600, COR.branco, {marginTop: 8})}>carro</div>
      </div>
      <div style={{...txt(120, 600, COR.ambar), opacity: cl(eq), transform: `scale(${0.5 + 0.5 * cl(eq)})`}}>=</div>
      <div style={{opacity: cl(mo), transform: `scale(${0.6 + 0.4 * cl(mo)})`, textAlign: 'center'}}>
        <Motor w={220} t={t} />
        <div style={txt(38, 600, COR.branco, {marginTop: 8})}>motor</div>
      </div>
    </Abs>
  );
};

// 26 · "Instrução, ferramenta, dado certo." (Bruno na tela)
const CenaTrio: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const it = [
    {n: 'instrução', a: m.instr},
    {n: 'ferramenta', a: m.ferr},
    {n: 'dado certo', a: m.dado},
  ];
  return (
    <Abs x={90} y={440} w={900} style={{display: 'flex', gap: 18, justifyContent: 'space-between'}}>
      {it.map((x, i) => {
        const o = pop(t, x.a - 0.12, 0.3);
        const on = t > x.a;
        return (
          <div key={i} style={{opacity: 0.3 + 0.7 * cl(o), transform: `scale(${0.8 + 0.2 * cl(o)})`}}>
            <Chip t={x.n} bg={on ? COR.ambar : COR.sup} fg={on ? COR.preto : COR.sec} size={44} />
          </div>
        );
      })}
    </Abs>
  );
};

// 27 · "Para a maioria das pessoas, o carro pronto ainda é o melhor começo." (Bruno na tela)
const CenaComeco: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.35);
  const cp = pop(t, m.carro - 0.2, 0.35);
  const ok = pop(t, m.comeco - 0.15, 0.35);
  const pessoas = 14;
  return (
    <>
      <Abs x={90} y={410} w={900} o={k} style={{display: 'flex', gap: 10, flexWrap: 'wrap', width: 700}}>
        {Array.from({length: pessoas}).map((_, i) => (
          <svg key={i} width={40} height={52} viewBox="0 0 20 26" style={{opacity: ent(t, c.start + i * 0.04, 0.2)}}>
            <circle cx="10" cy="6" r="5" fill={i < 11 ? COR.claro : COR.cinza1} />
            <path d="M1 26 Q1 13 10 13 Q19 13 19 26 Z" fill={i < 11 ? COR.claro : COR.cinza1} />
          </svg>
        ))}
      </Abs>
      <Abs x={90} y={540} o={cl(cp)} s={0.7 + 0.3 * cl(cp)} origin="left center" style={{display: 'flex', alignItems: 'center', gap: 18}}>
        <Chip t="carro pronto" bg={COR.sup} borda={COR.claro} size={44} />
        <div style={{opacity: cl(ok), transform: `scale(${0.6 + 0.4 * cl(ok)})`, display: 'flex', alignItems: 'center', gap: 12}}>
          <Check size={52} />
          <span style={txt(44, 600, COR.petroleoClaro)}>melhor começo</span>
        </div>
      </Abs>
    </>
  );
};

// 28 · "Mas se você tem dado sensível ou usa IA o dia inteiro, ter o seu já é um bom negócio." (Bruno fora)
const CenaBalanca: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const s1 = pop(t, m.sensivel - 0.2, 0.35);
  const s2 = pop(t, m.dia - 0.3, 0.35);
  const ng = pop(t, m.negocio - 0.2, 0.4);
  const inc = -4 + 10 * ent(t, m.sensivel, 0.6) + 6 * ent(t, m.dia, 0.6);
  const cx = 540;
  const cy = 760;
  const L = 330;
  const ang = (inc * Math.PI) / 180;
  const lx = cx - L * Math.cos(ang);
  const ly = cy - L * Math.sin(ang);
  const rx = cx + L * Math.cos(ang);
  const ry = cy + L * Math.sin(ang);
  return (
    <>
      <Svg>
        <line x1={cx} y1={cy} x2={cx} y2={1080} stroke={COR.claro} strokeWidth={8} />
        <rect x={cx - 90} y={1074} width={180} height={14} fill={COR.claro} />
        <line x1={lx} y1={ly} x2={rx} y2={ry} stroke={COR.claro} strokeWidth={8} />
        <circle cx={cx} cy={cy} r={14} fill={COR.ambar} />
        <line x1={lx} y1={ly} x2={lx} y2={ly + 90} stroke={COR.cinza1} strokeWidth={3} />
        <line x1={rx} y1={ry} x2={rx} y2={ry + 90} stroke={COR.cinza1} strokeWidth={3} />
      </Svg>
      <Abs x={lx - 140} y={ly + 90} w={280} style={{textAlign: 'center'}}>
        <Chip t="carro pronto" bg={COR.sup} borda={COR.claro} size={34} />
      </Abs>
      <Abs x={rx - 160} y={ry + 90} w={320} style={{textAlign: 'center'}}>
        <Chip t="ter o seu" bg={COR.ambar} fg={COR.preto} size={40} />
        <div style={{display: 'flex', justifyContent: 'center', gap: 16, marginTop: 14}}>
          <div style={{opacity: cl(s1), transform: `scale(${0.5 + 0.5 * cl(s1)})`}}>
            <Cadeado size={56} cor={COR.ambar} />
          </div>
          <div style={{opacity: cl(s2), transform: `scale(${0.5 + 0.5 * cl(s2)})`}}>
            <svg width={56} height={56} viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="17" fill="none" stroke={COR.ambar} strokeWidth={4} />
              <line x1="20" y1="20" x2={20 + 11 * Math.cos(t * 4)} y2={20 + 11 * Math.sin(t * 4)} stroke={COR.ambar} strokeWidth={4} />
            </svg>
          </div>
        </div>
      </Abs>
      <Abs x={90} y={1270} w={900} style={{display: 'flex', justifyContent: 'center', gap: 20}}>
        <div style={{opacity: cl(s1), transform: `scale(${0.7 + 0.3 * cl(s1)})`}}>
          <Chip t="dado sensível" bg={COR.sup} borda={COR.ambar} size={38} />
        </div>
        <div style={{opacity: cl(s2), transform: `scale(${0.7 + 0.3 * cl(s2)})`}}>
          <Chip t="IA o dia inteiro" bg={COR.sup} borda={COR.ambar} size={38} />
        </div>
      </Abs>
      <Abs x={0} y={1390} w={1080} o={cl(ng)} s={0.7 + 0.3 * cl(ng)} style={{textAlign: 'center'}}>
        <span style={txt(60, 600, COR.ambar)}>bom negócio</span>
      </Abs>
    </>
  );
};

// 29 · "Então já me segue para aprender a como usar IA de verdade no seu dia a dia." (Bruno na tela)
const CenaSegue: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const b = pop(t, m.segue - 0.25, 0.4);
  const clique = t > m.segue + 0.35;
  const mais = cl((t - m.segue - 0.35) / 0.9);
  const v = ent(t, m.verdade - 0.3, 0.35);
  return (
    <>
      <Abs x={90} y={420} o={cl(b)} s={0.7 + 0.3 * cl(b)} origin="left center">
        <div style={{...txt(56, 600, clique ? COR.branco : COR.preto), background: clique ? COR.sup2 : COR.ambar, padding: '18px 56px', borderRadius: 8, display: 'inline-block', border: clique ? `2px solid ${COR.borda}` : undefined}}>{clique ? 'Seguindo' : 'Seguir'}</div>
      </Abs>
      {clique && mais < 1 ? (
        <Abs x={430} y={410 - 80 * mais} o={1 - mais} style={txt(64, 600, COR.ambar)}>
          +1
        </Abs>
      ) : null}
      <Abs x={90} y={560} w={900} o={v} dy={(1 - v) * 20}>
        <span style={txt(44, 400, COR.claro)}>
          IA <span style={{color: COR.ambar, fontWeight: 600}}>de verdade</span> no seu dia a dia
        </span>
      </Abs>
    </>
  );
};

// 30 · "E fala aí, você teria a sua própria IA ou fica com o carro pronto alugado?" + assinatura
const CenaFecho: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const q = ent(t, c.start, 0.35);
  const a = pop(t, m.propria - 0.2, 0.35);
  const b = pop(t, m.carro - 0.2, 0.35);
  const logo = ent(t, m.logo + 0.4, 0.3);
  return (
    <>
      <Abs x={90} y={400} w={900} o={q * (1 - logo)} dy={(1 - q) * 20}>
        <div style={txt(52, 600, COR.branco)}>Você teria a sua própria IA</div>
        <div style={txt(52, 600, COR.branco)}>ou fica com o carro pronto?</div>
      </Abs>
      <Abs x={90} y={560} w={900} o={1 - logo} style={{display: 'flex', gap: 20}}>
        <div style={{opacity: cl(a), transform: `scale(${0.6 + 0.4 * cl(a)})`}}>
          <Chip t="a sua própria IA" bg={COR.ambar} fg={COR.preto} size={38} />
        </div>
        <div style={{opacity: cl(b), transform: `scale(${0.6 + 0.4 * cl(b)})`}}>
          <Chip t="carro pronto alugado" bg={COR.sup} borda={COR.claro} size={38} />
        </div>
      </Abs>
      <Abs x={60} y={380} w={300} h={300} o={logo}>
        <Sequence from={Math.round((m.logo + 0.4) * 30)} layout="none">
          <Video src={staticFile('brand/logo-anim.webm')} style={{width: 300, height: 300}} muted />
        </Sequence>
      </Abs>
      <Abs x={390} y={480} w={620} o={ent(t, m.logo + 0.65, 0.35)}>
        <Img src={staticFile('brand/falaibruno-branco.svg')} style={{width: 580}} />
      </Abs>
    </>
  );
};

const CENAS: Record<string, React.FC<{t: number; c: Cena}>> = {
  gancho: CenaGancho,
  corrida: CenaCorrida,
  epoch: CenaEpoch,
  linha: CenaLinha,
  duas: CenaDuas,
  bolo: CenaBolo,
  fatia: CenaFatia,
  paga: CenaPaga,
  inteiro: CenaInteiro,
  receita: CenaReceita,
  opensource: CenaOpenSource,
  openai: CenaOpenAI,
  ram: CenaRam,
  fluxo: CenaFluxo,
  ajuste: CenaAjuste,
  motor: CenaMotor,
  carro: CenaCarro,
  harness: CenaHarness,
  pecas: CenaPecas,
  apps: CenaApps,
  aluga: CenaAluga,
  servidor: CenaServidor,
  seu: CenaSeu,
  empresas: CenaEmpresas,
  resultado: CenaResultado,
  trio: CenaTrio,
  comeco: CenaComeco,
  balanca: CenaBalanca,
  segue: CenaSegue,
  fecho: CenaFecho,
};

// ======================= HEADLINE (mista: linha 1 leve e branca, linha 2 pesada e âmbar) =======================
const Headline: React.FC<{t: number}> = ({t}) => {
  const h = F.headline;
  if (!h || t >= h.fim + 0.3) return null;
  const a = ent(t, 0.05, 0.4);
  const b = ent(t, 0.3, 0.4);
  const out = cl((h.fim - t) / 0.3);
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 330, textAlign: 'center', opacity: out}}>
      <div style={{...txt(84, 300, COR.branco, {lineHeight: 1.06}), opacity: a, transform: `translateY(${(1 - a) * 24}px)`}}>{h.l1}</div>
      <div style={{...txt(112, 600, COR.ambar, {lineHeight: 1.04}), opacity: b, transform: `translateY(${(1 - b) * 24}px)`}}>{h.l2}</div>
    </div>
  );
};

// ======================= CAMADAS =======================

const Grade: React.FC<{t: number}> = ({t}) => {
  const step = 60;
  const off = (t * 6) % step;
  const lines = [];
  for (let x = -step; x <= 1080 + step; x += step) lines.push(<line key={`v${x}`} x1={x} y1={0} x2={x} y2={1920} stroke={COR.grade} strokeWidth={2} />);
  for (let y = -step; y <= 1920 + step; y += step) lines.push(<line key={`h${y}`} x1={0} y1={y + off} x2={1080} y2={y + off} stroke={COR.grade} strokeWidth={2} />);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      {lines}
    </svg>
  );
};

const explosao = (t: number) => {
  let e = 0;
  for (const x of F.explosoes) {
    if (t < x.a || t > x.b) continue;
    if (t <= x.pico) e = Math.max(e, x.pico === x.a ? 1 : inOutCubic(cl((t - x.a) / (x.pico - x.a))));
    else e = Math.max(e, 1 - inOutCubic(cl((t - x.pico) / (x.b - x.pico))));
  }
  return e;
};

/** 0 = Bruno na tela, 1 = fora (desliza para baixo em 0,25 s nas bordas da janela) */
const fora = (t: number) => {
  let h = 0;
  for (const [a, b] of F.semPessoa ?? []) h = Math.max(h, inOutCubic(Math.min(cl((t - a) / 0.25), cl((b - t) / 0.25))));
  return h;
};

/** zoom do Bruno: troca seca em cada corte (8% / 18%) + empurrão lento dentro do trecho */
const zoomPessoa = (t: number) => {
  const c = F.cortes.find((x) => t >= x.start && t < x.end) ?? F.cortes[F.cortes.length - 1];
  const p = cl((t - c.start) / Math.max(0.1, c.end - c.start));
  return c.zoom * (1 + F.pushIn * p);
};

const Plano: React.FC<{z: number; e: number; rotulo: string; fundo?: boolean; children: React.ReactNode}> = ({z, e, rotulo, fundo, children}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: 1080,
      height: 1920,
      transform: `translateZ(${z * e}px)`,
      transformStyle: 'preserve-3d',
      background: fundo ? COR.fundo : undefined,
      outline: e > 0.02 ? `3px solid rgba(163,163,163,${0.85 * e})` : undefined,
    }}
  >
    {children}
    {e > 0.05 ? (
      <div style={{position: 'absolute', left: 40, top: 40, opacity: cl((e - 0.2) / 0.5)}}>
        <Tag t={rotulo} size={44} bg={fundo ? COR.ambar : COR.branco} fg={COR.preto} />
      </div>
    ) : null}
  </div>
);

export const FalaiBruno: React.FC = () => {
  useInter();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const e = explosao(t);
  const zs = zoomPessoa(t);
  const h = fora(t);
  const md = F.marcaDagua;
  const cena = F.cenas.find((c) => t >= c.start && t < c.end);
  const ativas = F.cenas.filter((c) => t >= c.start - 0.01 && t < c.end + 0.01);
  const textoOn = t >= HOOK_FIM;
  return (
    <AbsoluteFill style={{background: COR.fundo, perspective: 2600, perspectiveOrigin: '50% 48%', overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1080,
          height: 1920,
          transformStyle: 'preserve-3d',
          transform: `scale(${1 - 0.42 * e}) rotateX(${12 * e}deg) rotateY(${-38 * e}deg)`,
        }}
      >
        <Plano z={-900} e={e} rotulo="Fundo" fundo>
          <Grade t={t} />
        </Plano>
        <Plano z={-420} e={e} rotulo="Elementos">
          {ativas.map((c) => {
            const C = CENAS[c.nome];
            if (!C) return null;
            const o = jan(t, c.start, c.end, 0.12, 0.18);
            return (
              <div key={c.nome + c.start} style={{position: 'absolute', inset: 0, opacity: o}}>
                <C t={t} c={c} />
              </div>
            );
          })}
        </Plano>
        <Plano z={0} e={e} rotulo="Bruno">
          {/* v2 (pedido do Bruno): menor, apoiado na base (sem degradê) e fora do quadro nas cenas de tela cheia */}
          <div style={{position: 'absolute', inset: 0, transform: `scale(${zs})`, transformOrigin: '540px 1450px'}}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: 1 - 0.6 * h,
                transform: `translateY(${170 + 1000 * h}px) scale(${PESSOA_ESCALA})`,
                transformOrigin: '540px 1750px',
              }}
            >
              {h < 0.999 ? <OffthreadVideo src={staticFile('pessoa_v.webm')} transparent muted style={{width: 1080, height: 1920}} /> : null}
            </div>
          </div>
        </Plano>
        <Plano z={380} e={e} rotulo="Texto">
          {textoOn && cena?.rotulo ? (
            <div style={{position: 'absolute', left: 90, top: 300}}>
              <Tag t={cena.rotulo} size={28} />
            </div>
          ) : null}
          {textoOn && cena?.fonte ? (
            <div style={{position: 'absolute', left: 90, top: 352, ...txt(22, 400, COR.sec)}}>{cena.fonte}</div>
          ) : null}
          <Headline t={t} />
          {md && (md.ate === undefined || t < md.ate) ? (
            <Img src={staticFile(md.src)} style={{position: 'absolute', left: md.x, top: md.y, width: md.size, height: md.size}} />
          ) : null}
        </Plano>
      </div>
    </AbsoluteFill>
  );
};
