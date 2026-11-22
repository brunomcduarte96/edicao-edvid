/**
 * FalaiBruno (Maior IPO da história, 22/11/2026) — palco em camadas para o 9:16 com o Bruno recortado (chroma key).
 *
 * Camadas (de trás para frente): FUNDO (preto + grade) → ELEMENTOS (ilustrações,
 * muitas delas atrás do Bruno) → BRUNO (pessoa_v.mov com alfa) → TEXTO (rótulo,
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

const ANT = 'logos/claude-chat-icon.png'; // asterisco oficial (Claude / Anthropic)
const WORDMARK = 'logos/anthropic.png'; // wordmark oficial (preto → invertido para branco)

const Asterisco: React.FC<{size: number; r?: number; o?: number}> = ({size, r = 0, o = 1}) => (
  <Img src={staticFile(ANT)} style={{width: size, height: size, transform: `rotate(${r}deg)`, opacity: o, display: 'block'}} />
);

/** contador com casas decimais pt-BR */
const dec = (n: number, casas = 1) => n.toFixed(casas).replace('.', ',');

/** mini gráfico de cotação genérico (sem nome de ativo) */
const MiniChart: React.FC<{i: number; w: number; h: number; t: number; cor?: string}> = ({i, w, h, t, cor}) => {
  const pts: string[] = [];
  const N = 14;
  for (let k = 0; k <= N; k++) {
    const v = 0.5 + 0.35 * Math.sin(k * 0.9 + i * 1.7 + t * 1.5) * (0.6 + 0.4 * rnd(i + k));
    pts.push(`${(k / N) * w},${h - v * h}`);
  }
  const up = Math.sin(i * 1.7 + t * 1.5) > 0;
  return (
    <svg width={w} height={h} style={{display: 'block'}}>
      <polyline points={pts.join(' ')} fill="none" stroke={cor ?? (up ? COR.petroleoClaro : COR.erro)} strokeWidth={4} />
    </svg>
  );
};

/** painel de cotações genérico atrás do Bruno (laterais) */
const PainelLateral: React.FC<{t: number; a: number; n?: number}> = ({t, a, n = 8}) => (
  <>
    {Array.from({length: n}).map((_, i) => {
      const lado = i % 2;
      const row = Math.floor(i / 2);
      const o = ent(t, a + i * 0.06, 0.3);
      const up = Math.sin(i * 1.7 + t * 1.5) > 0;
      return (
        <Abs key={i} x={lado ? 836 : 24} y={800 + row * 170} w={220} h={150} o={o * 0.9} style={card({padding: 12})}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div style={{width: 70, height: 10, background: COR.cinza1, borderRadius: 5}} />
            <span style={txt(22, 600, up ? COR.petroleoClaro : COR.erro, {fontVariantNumeric: 'tabular-nums'})}>
              {up ? '+' : '−'}
              {dec(0.4 + 2.6 * rnd(i + Math.floor(t * 2)), 1)}%
            </span>
          </div>
          <div style={{marginTop: 10}}>
            <MiniChart i={i} w={196} h={86} t={t} />
          </div>
        </Abs>
      );
    })}
  </>
);

// 1 · "A Anthropic, dona do Claude, acabou de fazer o maior IPO da história."
const CenaIpo: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const wm = ent(t, 0.1, 0.4);
  const ic = pop(t, m.claude - 0.1, 0.35);
  const selo = pop(t, m.maior - 0.05, 0.35);
  return (
    <>
      {/* asterisco grande girando atrás do Bruno */}
      <Abs x={140} y={700} w={800} h={800} o={0.9 * ent(t, 0, 0.5)} s={0.9 + 0.1 * ent(t, 0, 0.8)}>
        <Asterisco size={800} r={t * 18} o={0.85} />
      </Abs>
      <Abs x={90} y={590} w={900} h={110} o={wm} dy={(1 - wm) * 20} style={{display: 'flex', alignItems: 'center', gap: 22}}>
        <Img src={staticFile(WORDMARK)} style={{height: 54, filter: 'invert(1)'}} />
        <div style={{opacity: cl(ic), transform: `scale(${Math.max(0.01, cl(ic))})`, display: 'flex', alignItems: 'center', gap: 12}}>
          <span style={txt(34, 400, COR.sec)}>dona do</span>
          <Img src={staticFile('logos/claude-chat-icon.png')} style={{width: 46, height: 46}} />
          <span style={txt(40, 600, COR.branco)}>Claude</span>
        </div>
      </Abs>
      {/* selo de recorde atrás do Bruno, à direita */}
      <Abs x={760} y={930} w={300} h={170} o={cl(selo)} s={1.5 - 0.5 * cl(selo)} r={-6} style={{background: COR.preto, border: `4px solid ${COR.ambar}`, borderRadius: 6, padding: '16px 18px', boxSizing: 'border-box'}}>
        <div style={txt(22, 600, COR.sec, {letterSpacing: '0.08em'})}>RECORDE</div>
        <div style={txt(40, 600, COR.ambar, {marginTop: 8, lineHeight: 1.05})}>maior IPO da história</div>
      </Abs>
    </>
  );
};

// 2 · "Valendo cerca de 1,5 trilhão de dólares"
const CenaValor: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const roll = inOutCubic(cl((t - m.tri + 0.6) / 0.8));
  const k = ent(t, c.start, 0.3);
  return (
    <>
      <Abs x={90} y={400} w={900} o={k} dy={(1 - k) * 20}>
        <div style={txt(34, 400, COR.sec)}>valendo cerca de</div>
        <div style={txt(170, 300, COR.ambar, {lineHeight: 1, marginTop: 6, fontVariantNumeric: 'tabular-nums'})}>US$ {dec(1.5 * roll)} tri</div>
      </Abs>
      {/* pilhas subindo atrás do Bruno */}
      {Array.from({length: 10}).map((_, i) => {
        const lado = i % 2;
        const col = Math.floor(i / 2);
        const hh = (180 + col * 120) * inOutCubic(cl((t - c.start - 0.1 * col) / 1.2));
        return <div key={i} style={{position: 'absolute', left: lado ? 846 + (col % 2) * 100 : 34 + (col % 2) * 100, top: 1500 - hh - (col >> 1) * 0, width: 86, height: hh, background: col === 4 ? COR.ambar : COR.sup2, border: `1px solid ${col === 4 ? COR.ambar : COR.borda}`, borderRadius: '3px 3px 0 0', opacity: 0.9}} />;
      })}
    </>
  );
};

// 3 · "a empresa levantou mais de 90 bilhões de dólares para o caixa" (Bruno fora)
const CenaCaixa: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const roll = inOutCubic(cl((t - m.n90 + 0.3) / 0.7));
  const k = ent(t, c.start, 0.3);
  const fecha = ent(t, m.caixa - 0.1, 0.35);
  const cx = 540;
  const cy = 880;
  const notas = [];
  for (let i = 0; i < 14; i++) {
    const nasc = c.start + 0.25 + i * 0.16;
    const p = cl((t - nasc) / 0.7);
    if (p <= 0 || p >= 1) continue;
    const x0 = i % 2 ? 1120 : -160;
    const y0 = 720 + rnd(i) * 300;
    const x = x0 + (cx - 70 - x0) * outCubic(p);
    const y = y0 + (cy - 30 - y0) * outCubic(p);
    notas.push(
      <div key={i} style={{position: 'absolute', left: x, top: y, width: 150, height: 72, background: COR.petroleo, border: `3px solid ${COR.petroleoClaro}`, borderRadius: 4, opacity: 1 - p * 0.3, transform: `rotate(${(rnd(i + 3) - 0.5) * 40 * (1 - p)}deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <span style={txt(30, 600, COR.branco)}>US$</span>
      </div>,
    );
  }
  return (
    <>
      <Abs x={90} y={400} w={900} o={k} dy={(1 - k) * 20}>
        <div style={txt(34, 400, COR.sec)}>levantou para o caixa</div>
        <div style={txt(170, 300, COR.ambar, {lineHeight: 1, marginTop: 6, fontVariantNumeric: 'tabular-nums'})}>+US$ {Math.round(90 * roll)} bi</div>
      </Abs>
      {/* cofre */}
      <Abs x={cx - 300} y={cy - 300} w={600} h={600} s={0.62} o={ent(t, c.start + 0.05, 0.3)} style={{background: COR.sup, border: `6px solid ${COR.borda}`, borderRadius: 18, boxSizing: 'border-box'}}>
        <div style={{position: 'absolute', left: 40, top: 40, right: 40, bottom: 40, border: `4px solid ${fecha > 0.5 ? COR.ambar : COR.cinza1}`, borderRadius: 10}} />
        <svg width={600} height={600} style={{position: 'absolute', left: 0, top: 0}}>
          <circle cx={300} cy={300} r={110} fill={COR.preto} stroke={fecha > 0.5 ? COR.ambar : COR.cinza1} strokeWidth={10} />
          {[0, 1, 2, 3].map((i) => {
            const a = (i * 90 + fecha * 180) * (Math.PI / 180);
            return <line key={i} x1={300} y1={300} x2={300 + Math.cos(a) * 150} y2={300 + Math.sin(a) * 150} stroke={fecha > 0.5 ? COR.ambar : COR.cinza1} strokeWidth={14} strokeLinecap="round" />;
          })}
          <circle cx={300} cy={300} r={26} fill={fecha > 0.5 ? COR.ambar : COR.cinza1} />
        </svg>
      </Abs>
      {notas}
      <Abs x={cx - 300} y={1270} w={600} o={fecha} style={{textAlign: 'center'}}>
        <span style={txt(44, 600, COR.branco)}>dinheiro no caixa</span>
      </Abs>
    </>
  );
};

// 4 · "IPO é quando a empresa começa a negociar suas ações na bolsa de valores"
const CenaIpoDef: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.3);
  const bolsa = pop(t, m.bolsa - 0.1, 0.35);
  // ações saindo do prédio (esquerda) para o painel (direita), passando atrás do Bruno
  const acoes = [];
  for (let i = 0; i < 10; i++) {
    const nasc = m.acoes - 1.2 + i * 0.22;
    const p = cl((t - nasc) / 1.1);
    if (p <= 0 || p >= 1) continue;
    acoes.push(
      <div key={i} style={{position: 'absolute', left: 190 + 640 * p, top: 1180 - Math.sin(p * Math.PI) * 260 + (i % 3) * 40, width: 64, height: 84, background: COR.claro, borderRadius: 3, opacity: 0.95, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{width: 34, height: 6, background: COR.ambar}} />
      </div>,
    );
  }
  return (
    <>
      <Abs x={90} y={400} w={900} o={k} dy={(1 - k) * 20}>
        <div style={txt(110, 600, COR.branco, {lineHeight: 1})}>IPO</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 14, opacity: cl(bolsa), transform: `scale(${0.85 + 0.15 * cl(bolsa)})`, transformOrigin: 'left center'}}>
          <span style={txt(56, 300, COR.sec)}>=</span>
          <span style={{...txt(56, 600, COR.preto), background: COR.ambar, padding: '4px 18px', borderRadius: 3}}>estreia na bolsa</span>
        </div>
      </Abs>
      {/* prédio da empresa (esquerda) */}
      <Abs x={30} y={880} w={210} h={620} o={ent(t, c.start + 0.1, 0.3)} style={{background: COR.sup, border: `2px solid ${COR.borda}`, borderRadius: '6px 6px 0 0', boxSizing: 'border-box', padding: 18}}>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14}}>
          {Array.from({length: 18}).map((_, i) => (
            <div key={i} style={{height: 46, background: rnd(i + Math.floor(t * 3)) > 0.6 ? COR.ambarEsc : COR.sup2}} />
          ))}
        </div>
      </Abs>
      {/* painel da bolsa (direita), genérico */}
      <Abs x={830} y={880} w={230} h={620} o={ent(t, c.start + 0.2, 0.3)} style={card({padding: 14})}>
        {Array.from({length: 9}).map((_, i) => {
          const up = Math.sin(i * 2.1 + t * 2) > 0;
          return (
            <div key={i} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 62, borderBottom: `1px solid ${COR.borda}`}}>
              <div style={{width: 60, height: 10, background: COR.cinza1, borderRadius: 5}} />
              <span style={txt(24, 600, up ? COR.petroleoClaro : COR.erro, {fontVariantNumeric: 'tabular-nums'})}>{up ? '▲' : '▼'} {dec(rnd(i + Math.floor(t * 2)) * 3, 1)}</span>
            </div>
          );
        })}
      </Abs>
      {acoes}
    </>
  );
};

// 5 · "começou a negociar no dia 19 de novembro de 2026 a 83 dólares por ação"
const CenaEstreia: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const cal = pop(t, m.dia - 0.15, 0.35);
  const preco = pop(t, m.n83 - 0.15, 0.35);
  const roll = inOutCubic(cl((t - m.n83 + 0.2) / 0.6));
  return (
    <>
      <Abs x={90} y={400} w={360} h={300} o={cl(cal)} s={0.7 + 0.3 * cl(cal)} origin="left top" style={{background: COR.claro, borderRadius: 8, overflow: 'hidden', boxSizing: 'border-box'}}>
        <div style={{background: COR.ambar, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <span style={txt(34, 600, COR.preto, {letterSpacing: '0.1em'})}>NOV 2026</span>
        </div>
        <div style={{textAlign: 'center', marginTop: 10}}>
          <span style={txt(170, 600, COR.preto, {lineHeight: 1})}>19</span>
        </div>
      </Abs>
      <Abs x={490} y={420} w={500} o={cl(preco)} dx={(1 - cl(preco)) * 40}>
        <div style={txt(30, 400, COR.sec)}>primeiro preço</div>
        <div style={txt(130, 300, COR.ambar, {lineHeight: 1, marginTop: 6, fontVariantNumeric: 'tabular-nums'})}>US$ {Math.round(83 * roll)}</div>
        <div style={txt(34, 600, COR.branco, {marginTop: 8})}>por ação</div>
      </Abs>
      {/* fita de cotações correndo atrás do Bruno */}
      {[0, 1, 2].map((r) => (
        <Abs key={r} x={0} y={860 + r * 220} w={1080} h={70} o={0.8 * ent(t, c.start + 0.1 * r, 0.3)} style={{overflow: 'hidden', background: COR.sup, borderTop: `1px solid ${COR.borda}`, borderBottom: `1px solid ${COR.borda}`}}>
          <div style={{position: 'absolute', top: 14, left: -(((t - c.start) * (120 + r * 40)) % 300), display: 'flex', gap: 60, whiteSpace: 'nowrap'}}>
            {Array.from({length: 12}).map((_, i) => {
              const up = rnd(i + r * 7) > 0.4;
              return (
                <span key={i} style={txt(32, 600, up ? COR.petroleoClaro : COR.erro, {fontVariantNumeric: 'tabular-nums'})}>
                  {up ? '▲' : '▼'} {dec(rnd(i + r) * 4, 1)}%
                </span>
              );
            })}
          </div>
        </Abs>
      ))}
    </>
  );
};

// 6 · "fundada em 2021 por um grupo que deixou a OpenAI para fundar a Anthropic" (Bruno fora)
const CenaFundada: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const ano = pop(t, m.n2021 - 0.1, 0.35);
  const boxA = ent(t, m.openai - 0.5, 0.3);
  const sai = inOutCubic(cl((t - m.openai) / 1.1));
  const boxB = pop(t, m.anthropic - 0.35, 0.35);
  const tl = ent(t, c.start + 0.1, 0.6);
  return (
    <>
      <Abs x={90} y={400} w={900} o={cl(ano)} s={0.8 + 0.2 * cl(ano)} origin="left top">
        <div style={txt(30, 400, COR.sec)}>fundada em</div>
        <div style={txt(200, 300, COR.ambar, {lineHeight: 1})}>2021</div>
      </Abs>
      {/* linha do tempo */}
      <Svg o={tl}>
        <line x1={80} y1={1440} x2={80 + 920 * tl} y2={1440} stroke={COR.borda} strokeWidth={6} />
        {['2021', '2022', '2023', '2024', '2025', '2026'].map((y, i) => (
          <g key={y}>
            <circle cx={120 + i * 168} cy={1440} r={i === 0 ? 16 : 9} fill={i === 0 && ano > 0.5 ? COR.ambar : COR.cinza1} />
            <text x={120 + i * 168} y={1490} fill={i === 0 ? COR.ambar : COR.sec} fontFamily={FONTE} fontSize={28} fontWeight={600} textAnchor="middle">
              {y}
            </text>
          </g>
        ))}
      </Svg>
      {/* caixa OpenAI (só o nome) */}
      <Abs x={60} y={720} w={380} h={340} o={boxA} style={{border: `4px solid ${COR.cinza1}`, borderRadius: 12, boxSizing: 'border-box'}}>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 24, textAlign: 'center'}}>
          <span style={txt(48, 600, COR.claro)}>OpenAI</span>
        </div>
      </Abs>
      {/* caixa Anthropic */}
      <Abs x={640} y={720} w={380} h={340} o={cl(boxB)} s={0.7 + 0.3 * cl(boxB)} style={{border: `4px solid ${COR.ambar}`, borderRadius: 12, boxSizing: 'border-box', background: COR.sup}}>
        <div style={{position: 'absolute', left: 130, top: 50}}>
          <Asterisco size={120} r={t * 30} />
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 30, textAlign: 'center'}}>
          <Img src={staticFile(WORDMARK)} style={{width: 300, filter: 'invert(1)'}} />
        </div>
      </Abs>
      {/* o grupo saindo */}
      {Array.from({length: 7}).map((_, i) => {
        const x0 = 120 + (i % 4) * 70;
        const y0 = 770 + Math.floor(i / 4) * 80;
        const x1 = 700 + (i % 4) * 70;
        const p = cl(sai * 1.15 - i * 0.02);
        const x = x0 + (x1 - x0) * p;
        const y = y0 - Math.sin(p * Math.PI) * 120;
        return (
          <Abs key={i} x={x} y={y} w={50} h={70} o={boxA * (1 - ent(p, 0.97, 0.03))}>
            <svg width={50} height={70}>
              <circle cx={25} cy={16} r={14} fill={p > 0.95 ? COR.ambar : COR.claro} />
              <rect x={6} y={34} width={38} height={34} rx={10} fill={p > 0.95 ? COR.ambar : COR.claro} />
            </svg>
          </Abs>
        );
      })}
      <Seta x1={450} y1={890} x2={630} y2={890} p={ent(t, m.openai + 0.2, 0.4)} cor={COR.ambar} w={7} />
    </>
  );
};

// 7 · "No primeiro dia, chegou a subir mais de 34%. E no final do dia fechou com 17% de alta." (Bruno fora)
const CenaDia1: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.3);
  // eixo: preço → y. 83 → 1400; 111,5 → 860
  const py = (p: number) => 1060 - ((p - 83) / (111.5 - 83)) * 380;
  const x0 = 100;
  const x1 = 980;
  const pts: [number, number][] = [
    [0, 83],
    [0.08, 92],
    [0.16, 101],
    [0.26, 111.5],
    [0.36, 106],
    [0.46, 108],
    [0.58, 101],
    [0.7, 103],
    [0.82, 98],
    [1, 97.17],
  ];
  // desenho: até o pico no "34%", depois até o fechamento no "17%"
  const pA = cl((t - c.start - 0.2) / Math.max(0.3, m.n34 - c.start - 0.2));
  const pB = cl((t - m.n34 - 0.2) / Math.max(0.3, m.n17 - m.n34 - 0.2));
  const prog = pA < 1 ? 0.26 * inOutCubic(pA) : 0.26 + 0.74 * inOutCubic(pB);
  const vis: string[] = [];
  let last: [number, number] = [x0, py(83)];
  for (let i = 0; i < pts.length; i++) {
    const [u, p] = pts[i];
    if (u <= prog) {
      last = [x0 + (x1 - x0) * u, py(p)];
      vis.push(`${last[0]},${last[1]}`);
    } else {
      const [u0, p0] = pts[i - 1];
      const f = (prog - u0) / (u - u0);
      last = [x0 + (x1 - x0) * prog, py(p0 + (p - p0) * f)];
      vis.push(`${last[0]},${last[1]}`);
      break;
    }
  }
  const pico = pop(t, m.n34 - 0.1, 0.35);
  const fech = pop(t, m.n17 - 0.1, 0.35);
  const pct = prog <= 0.26 ? 34 * inOutCubic(pA) : 34 - 17 * inOutCubic(pB);
  return (
    <>
      <Abs x={90} y={400} w={900} o={k} dy={(1 - k) * 20}>
        <div style={txt(34, 400, COR.sec)}>1º dia de negociação</div>
        <div style={txt(100, 300, COR.ambar, {lineHeight: 1, marginTop: 6, fontVariantNumeric: 'tabular-nums'})}>+{Math.round(pct)}%</div>
      </Abs>
      <Svg o={ent(t, c.start + 0.05, 0.3)}>
        <line x1={x0} y1={py(83)} x2={x1} y2={py(83)} stroke={COR.sec} strokeWidth={3} strokeDasharray="14 10" />
        <text x={x0} y={py(83) + 44} fill={COR.sec} fontFamily={FONTE} fontSize={28} fontWeight={600}>
          preço do IPO · US$ 83
        </text>
        <polyline points={vis.join(' ')} fill="none" stroke={COR.ambar} strokeWidth={8} strokeLinejoin="round" />
        <circle cx={last[0]} cy={last[1]} r={14} fill={COR.ambar} />
        <text x={x0} y={1290} fill={COR.sec} fontFamily={FONTE} fontSize={26} fontWeight={400}>
          abertura
        </text>
        <text x={x1} y={1290} fill={COR.sec} fontFamily={FONTE} fontSize={26} fontWeight={400} textAnchor="end">
          fechamento
        </text>
      </Svg>
      <Abs x={x0 + (x1 - x0) * 0.26 - 110} y={py(111.5) - 90} w={220} o={cl(pico)} s={0.7 + 0.3 * cl(pico)} style={{textAlign: 'center', background: COR.ambar, borderRadius: 4, padding: '8px 0'}}>
        <span style={txt(48, 600, COR.preto)}>+34%</span>
      </Abs>
      <Abs x={x1 - 220} y={py(97.17) - 120} w={220} o={cl(fech)} s={0.7 + 0.3 * cl(fech)} style={{textAlign: 'center', background: COR.preto, border: `4px solid ${COR.ambar}`, borderRadius: 4, padding: '6px 0', boxSizing: 'border-box'}}>
        <span style={txt(48, 600, COR.ambar)}>+17%</span>
      </Abs>
    </>
  );
};

// 8 · "Eu passei 5 anos em uma mesa de operações comprando e vendendo ações." (autoridade + 3D)
const CenaMesa: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const n5 = pop(t, m.n5 - 0.1, 0.35);
  const mesa = ent(t, m.mesa - 0.1, 0.3);
  const compra = pop(t, m.compra - 0.05, 0.3);
  const vende = pop(t, m.vende - 0.05, 0.3);
  return (
    <>
      <PainelLateral t={t} a={c.start} />
      <Abs x={90} y={400} w={900} o={cl(n5)} s={0.8 + 0.2 * cl(n5)} origin="left top">
        <div style={{display: 'flex', alignItems: 'baseline', gap: 20}}>
          <span style={txt(170, 300, COR.ambar, {lineHeight: 1})}>5</span>
          <span style={txt(64, 600, COR.branco)}>anos</span>
        </div>
        <div style={{...txt(44, 400, COR.claro, {marginTop: 8}), opacity: mesa}}>em mesa de operação</div>
      </Abs>
      <Abs x={640} y={420} w={340} h={84} o={cl(compra)} s={0.7 + 0.3 * cl(compra)} style={{background: COR.petroleo, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <span style={txt(40, 600, COR.branco)}>comprando</span>
      </Abs>
      <Abs x={640} y={524} w={340} h={84} o={cl(vende)} s={0.7 + 0.3 * cl(vende)} style={{background: COR.preto, border: `3px solid ${COR.erro}`, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box'}}>
        <span style={txt(40, 600, COR.branco)}>vendendo</span>
      </Abs>
    </>
  );
};

// 9 · "E esse sobe e desce do preço das ações não diz tudo sobre a empresa."
const CenaSobeDesce: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const sobe = pop(t, m.sobe - 0.1, 0.3);
  const desce = pop(t, m.desce - 0.1, 0.3);
  const nao = pop(t, m.naodiz - 0.05, 0.35);
  const p = cl((t - c.start) / 2.4);
  const pts: string[] = [];
  const N = 40;
  for (let i = 0; i <= N * p; i++) {
    const u = i / N;
    pts.push(`${-20 + u * 1120},${1150 + Math.sin(u * 14) * 180 * (0.6 + 0.4 * rnd(i))}`);
  }
  return (
    <>
      <Svg o={0.9}>
        <polyline points={pts.join(' ')} fill="none" stroke={nao > 0.5 ? COR.cinza1 : COR.ambar} strokeWidth={10} strokeLinejoin="round" />
      </Svg>
      <Abs x={90} y={410} w={600} h={110} o={cl(sobe)} dx={(1 - cl(sobe)) * -30} style={{display: 'flex', alignItems: 'center', gap: 16}}>
        <svg width={70} height={70} viewBox="0 0 40 40"><path d="M20 4 L36 24 L26 24 L26 36 L14 36 L14 24 L4 24 Z" fill={COR.petroleoClaro} /></svg>
        <span style={txt(72, 600, COR.branco)}>sobe</span>
      </Abs>
      <Abs x={90} y={530} w={600} h={110} o={cl(desce)} dx={(1 - cl(desce)) * -30} style={{display: 'flex', alignItems: 'center', gap: 16}}>
        <svg width={70} height={70} viewBox="0 0 40 40"><path d="M20 36 L36 16 L26 16 L26 4 L14 4 L14 16 L4 16 Z" fill={COR.erro} /></svg>
        <span style={txt(72, 600, COR.branco)}>desce</span>
      </Abs>
      <Abs x={560} y={440} w={430} h={170} o={cl(nao)} s={1.4 - 0.4 * cl(nao)} r={-5} style={{background: COR.preto, border: `4px solid ${COR.ambar}`, borderRadius: 6, padding: '18px 20px', boxSizing: 'border-box'}}>
        <div style={txt(48, 600, COR.ambar, {lineHeight: 1.05})}>não diz tudo sobre a empresa</div>
      </Abs>
    </>
  );
};

// 10 · "O que os investidores procuram entender são os fundamentos da empresa e principalmente"
const CenaFundamentos: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.3);
  const f = pop(t, m.fund - 0.15, 0.35);
  const itens = ['Receita', 'Clientes', 'Margem', 'Quem paga'];
  const lx = 540 + 260 * Math.cos(t * 2.2);
  const ly = 560 + 40 * Math.sin(t * 2.2);
  return (
    <>
      <Abs x={90} y={400} w={900} o={k} dy={(1 - k) * 20}>
        <div style={txt(34, 400, COR.sec)}>o que o investidor olha</div>
        <div style={{...txt(84, 600, COR.branco, {marginTop: 8}), opacity: cl(f), transform: `scale(${0.85 + 0.15 * cl(f)})`, transformOrigin: 'left center'}}>os fundamentos</div>
      </Abs>
      <Svg o={ent(t, c.start + 0.3, 0.3) * 0.9}>
        <circle cx={lx} cy={ly} r={90} stroke={COR.claro} strokeWidth={10} fill="rgba(232,163,61,0.06)" />
        <line x1={lx + 64} y1={ly + 64} x2={lx + 140} y2={ly + 140} stroke={COR.claro} strokeWidth={18} strokeLinecap="round" />
      </Svg>
      {itens.map((l, i) => {
        const hl = i === 3 && t >= m.princ - 0.1;
        const o = ent(t, m.fund - 0.2 + i * 0.25, 0.3);
        const lado = i % 2;
        return (
          <Abs key={i} x={lado ? 836 : 24} y={860 + Math.floor(i / 2) * 260} w={220} h={200} o={o} dy={(1 - o) * 30} s={hl ? 1.08 : 1} style={card({padding: 18, background: hl ? COR.ambar : COR.sup, border: `1px solid ${hl ? COR.ambar : COR.borda}`})}>
            <div style={{width: 46, height: 46, borderRadius: 4, background: hl ? COR.preto : [COR.cobalto, COR.petroleo, COR.cinza1][i % 3]}} />
            <div style={txt(34, 600, hl ? COR.preto : COR.branco, {marginTop: 18})}>{l}</div>
            <div style={{width: '70%', height: 8, background: hl ? COR.ambarEsc : COR.cinza1, borderRadius: 4, marginTop: 14}} />
          </Abs>
        );
      })}
    </>
  );
};

// 11 · "quem paga a conta daquele lucro da empresa"
const CenaConta: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const q = pop(t, c.start, 0.35);
  const lucro = pop(t, m.lucro - 0.1, 0.3);
  const rol = inOutCubic(cl((t - c.start) / 1.6));
  return (
    <>
      <Abs x={90} y={400} w={900} o={cl(q)} s={0.85 + 0.15 * cl(q)} origin="left top">
        <div style={txt(96, 600, COR.ambar, {lineHeight: 1.02})}>Quem paga</div>
        <div style={txt(96, 600, COR.ambar, {lineHeight: 1.02})}>a conta?</div>
      </Abs>
      <Abs x={700} y={440} w={280} h={160} o={cl(lucro)} s={0.7 + 0.3 * cl(lucro)} style={card({padding: 18, borderTop: `6px solid ${COR.petroleoClaro}`})}>
        <div style={txt(24, 600, COR.sec, {letterSpacing: '0.08em'})}>LUCRO</div>
        <div style={txt(56, 300, COR.petroleoClaro, {marginTop: 8})}>US$ ?</div>
      </Abs>
      {/* nota fiscal desenrolando atrás do Bruno */}
      {[0, 1].map((lado) => (
        <Abs key={lado} x={lado ? 846 : 34} y={800} w={200} h={700 * rol} o={0.95} style={{background: COR.claro, borderRadius: 3, overflow: 'hidden', padding: 16, boxSizing: 'border-box'}}>
          <div style={txt(18, 600, COR.ambarEsc, {letterSpacing: '0.1em'})}>CONTA</div>
          {Array.from({length: 12}).map((_, j) => (
            <div key={j} style={{display: 'flex', justifyContent: 'space-between', marginTop: 16}}>
              <div style={{width: `${40 + 40 * rnd(j + lado * 9)}%`, height: 8, background: '#BDBDBD', borderRadius: 4}} />
              <div style={{width: 40, height: 8, background: '#9E9E9E', borderRadius: 4}} />
            </div>
          ))}
          <div style={{marginTop: 20, height: 4, background: COR.preto}} />
          <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 12}}>
            <span style={txt(22, 600, COR.preto)}>TOTAL</span>
            <span style={txt(22, 600, COR.preto)}>?</span>
          </div>
        </Abs>
      ))}
    </>
  );
};

// contorno simplificado do Brasil (desenho genérico, 0..300)
const BRASIL = 'M120 20 L170 12 L215 40 L262 58 L292 96 L286 132 L262 168 L240 214 L214 236 L190 284 L160 300 L140 268 L150 236 L118 214 L96 176 L60 160 L28 132 L14 96 L40 70 L80 60 Z';

// 12 · "E um dado muito legal: os cartões corporativos dos clientes da Clara"
const CenaClara: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const mapa = ent(t, m.dado - 0.2, 0.5);
  const cartao = pop(t, m.cartoes - 0.15, 0.35);
  const clara = pop(t, m.clara - 0.15, 0.35);
  return (
    <>
      <Abs x={70} y={390} w={320} h={320} o={mapa}>
        <svg width={320} height={320} viewBox="0 0 310 310">
          <path d={BRASIL} fill={COR.sup2} stroke={COR.petroleoClaro} strokeWidth={4} strokeDasharray={1400} strokeDashoffset={1400 * (1 - mapa)} />
          {mapa > 0.9 ? <circle cx={220} cy={200} r={10 + 4 * Math.sin(t * 6)} fill={COR.ambar} /> : null}
        </svg>
      </Abs>
      {/* cartão corporativo genérico */}
      <Abs x={430} y={410} w={540} h={300} o={cl(cartao)} s={0.7 + 0.3 * cl(cartao)} r={-4 * (1 - cl(cartao))} style={{background: COR.sup2, border: `2px solid ${COR.borda}`, borderRadius: 18, padding: 28, boxSizing: 'border-box'}}>
        <div style={{width: 74, height: 54, borderRadius: 8, background: COR.ambar}} />
        <div style={txt(30, 600, COR.claro, {marginTop: 30, letterSpacing: '0.12em', fontVariantNumeric: 'tabular-nums'})}>•••• •••• •••• 2026</div>
        <div style={txt(24, 600, COR.sec, {marginTop: 22, letterSpacing: '0.1em'})}>CARTÃO CORPORATIVO</div>
      </Abs>
      <Abs x={430} y={640} w={560} o={cl(clara)} dy={(1 - cl(clara)) * 20}>
        <Tag t="Monitor de IA · Clara" size={30} />
      </Abs>
      {/* cartões passando atrás do Bruno */}
      {Array.from({length: 8}).map((_, i) => {
        const lado = i % 2;
        const nasc = c.start + i * 0.35;
        const y = 820 + ((t - nasc) * 160) % 680;
        const o = ent(t, nasc, 0.25) * cl((1500 - y) / 120);
        return <Abs key={i} x={lado ? 846 : 34} y={y} w={200} h={124} o={o * 0.9} style={{background: i % 3 === 0 ? COR.ambarEsc : COR.sup2, border: `1px solid ${COR.borda}`, borderRadius: 12}} />;
      })}
    </>
  );
};

// 13 · "56% dos gastos com IA das empresas foram destinados à Anthropic. Um ano antes isso era 8%." (Bruno fora)
const CenaN56: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.3);
  const r56 = inOutCubic(cl((t - m.n56 + 0.1) / 0.9));
  const ant = pop(t, m.anthropic - 0.2, 0.35);
  const ano = ent(t, m.ano - 0.1, 0.4);
  const r8 = inOutCubic(cl((t - m.n8 + 0.4) / 0.6));
  const Barra: React.FC<{y: number; pct: number; p: number; rot: string; on: boolean; o: number}> = ({y, pct, p, rot, on, o}) => (
    <div style={{position: 'absolute', left: 90, top: y, width: 900, opacity: o}}>
      <div style={txt(30, 600, COR.sec)}>{rot}</div>
      <div style={{position: 'relative', marginTop: 10, height: 110, background: COR.sup, border: `2px solid ${COR.borda}`, boxSizing: 'border-box'}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct * p}%`, background: on ? COR.ambar : COR.ambarEsc}} />
        <div style={{position: 'absolute', left: `calc(${pct * p}% + 18px)`, top: 18, ...txt(64, 600, on ? COR.ambar : COR.claro, {fontVariantNumeric: 'tabular-nums'})}}>{Math.round(pct * p)}%</div>
      </div>
    </div>
  );
  return (
    <>
      <Abs x={90} y={400} w={900} o={k} dy={(1 - k) * 20}>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 24}}>
          <span style={txt(130, 300, COR.ambar, {lineHeight: 1, fontVariantNumeric: 'tabular-nums'})}>{Math.round(56 * r56)}%</span>
        </div>
        <div style={txt(36, 600, COR.branco, {marginTop: 4})}>do gasto com IA das empresas</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, marginTop: 8, opacity: cl(ant), transform: `scale(${0.8 + 0.2 * cl(ant)})`, transformOrigin: 'left center'}}>
          <span style={txt(34, 400, COR.sec)}>foi para a</span>
          <Img src={staticFile(WORDMARK)} style={{height: 30, filter: 'invert(1)'}} />
        </div>
      </Abs>
      <Barra y={760} pct={56} p={r56} rot="outubro de 2026" on o={1} />
      <Barra y={930} pct={8} p={r8} rot="outubro de 2025" on={false} o={ano} />
      <Abs x={90 + 9 * 56 * r56 - 120} y={790} w={100} h={100} o={cl(ant)}>
        <Asterisco size={100} r={t * 25} />
      </Abs>
      <Abs x={90} y={1270} w={900} o={ent(t, m.n8 + 0.3, 0.4)}>
        <div style={txt(40, 600, COR.branco)}>
          de <span style={{color: COR.claro}}>8%</span> para <span style={{color: COR.ambar}}>56%</span> em um ano
        </div>
      </Abs>
    </>
  );
};

// 14 · "Eu sei, é um recorte, não é o mercado como um todo, mas mostra um grande cliente da Anthropic: as empresas."
const CenaRecorte: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const pie = ent(t, m.recorte - 0.3, 0.5);
  const fatia = pop(t, m.recorte, 0.4);
  const tudo = ent(t, m.mercado - 0.1, 0.3);
  const cli = ent(t, m.cliente - 0.2, 0.35);
  const emp = m.empresas;
  const A = 1 - cli;
  const ang = 38;
  const r = 140;
  const cx = 200;
  const cy = 560;
  const a0 = (-90 * Math.PI) / 180;
  const a1 = ((-90 + ang) * Math.PI) / 180;
  const off = 30 * cl(fatia);
  const ox = Math.cos((a0 + a1) / 2) * off;
  const oy = Math.sin((a0 + a1) / 2) * off;
  return (
    <>
      <div style={{position: 'absolute', inset: 0, opacity: A}}>
        <Svg o={pie}>
          <circle cx={cx} cy={cy} r={r} fill={COR.sup2} stroke={COR.borda} strokeWidth={3} />
          <path d={`M ${cx + ox} ${cy + oy} L ${cx + ox + Math.cos(a0) * r} ${cy + oy + Math.sin(a0) * r} A ${r} ${r} 0 0 1 ${cx + ox + Math.cos(a1) * r} ${cy + oy + Math.sin(a1) * r} Z`} fill={COR.ambar} opacity={cl(fatia)} />
        </Svg>
        <Abs x={400} y={430} w={600} o={cl(fatia)}>
          <div style={txt(70, 600, COR.ambar)}>é um recorte</div>
          <div style={{...txt(36, 400, COR.claro, {marginTop: 12}), opacity: tudo}}>não é o mercado todo</div>
          <div style={{...txt(26, 400, COR.sec, {marginTop: 12}), opacity: tudo}}>só o cartão corporativo dos clientes da Clara</div>
        </Abs>
      </div>
      <Abs x={90} y={410} w={900} o={cli} dy={(1 - cli) * 20}>
        <div style={txt(34, 400, COR.sec)}>um grande cliente</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 10}}>
          <span style={{...txt(84, 600, COR.preto), background: COR.ambar, padding: '2px 22px', borderRadius: 3, opacity: ent(t, emp - 0.15, 0.3)}}>as empresas</span>
        </div>
      </Abs>
      {/* prédios subindo atrás do Bruno */}
      {Array.from({length: 8}).map((_, i) => {
        const lado = i % 2;
        const col = Math.floor(i / 2);
        const hh = (260 + rnd(i) * 360) * inOutCubic(cl((t - (m.cliente - 0.2) - col * 0.12) / 0.6));
        return (
          <div key={i} style={{position: 'absolute', left: lado ? 836 + (col % 2) * 112 : 24 + (col % 2) * 112, top: 1500 - hh - (col > 1 ? 0 : 0), width: 100, height: hh, background: COR.sup, border: `2px solid ${t > emp ? COR.ambar : COR.borda}`, borderBottom: 'none', boxSizing: 'border-box', overflow: 'hidden'}}>
            {Array.from({length: 10}).map((__, j) => (
              <div key={j} style={{width: 60, height: 14, margin: '16px auto 0', background: rnd(i * 10 + j + Math.floor(t * 2)) > 0.5 ? COR.ambarEsc : COR.sup2}} />
            ))}
          </div>
        );
      })}
    </>
  );
};

// 15 · "Usando como ferramenta de trabalho."
const CenaFerramenta: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = pop(t, c.start, 0.35);
  const f = ent(t, m.ferr - 0.1, 0.3);
  return (
    <>
      <Abs x={90} y={400} w={520} h={300} o={cl(k)} s={0.8 + 0.2 * cl(k)} origin="left top">
        {/* notebook genérico com o Claude na tela */}
        <div style={{width: 460, height: 250, background: COR.sup2, border: `6px solid ${COR.borda}`, borderRadius: 10, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16}}>
          <Img src={staticFile('logos/claude-chat-icon.png')} style={{width: 90, height: 90, transform: `rotate(${t * 40}deg)`}} />
          <span style={txt(54, 600, COR.branco)}>Claude</span>
        </div>
        <div style={{width: 520, height: 20, background: COR.borda, borderRadius: '0 0 10px 10px', marginLeft: -30}} />
      </Abs>
      <Abs x={640} y={440} w={380} o={f} dx={(1 - f) * 30}>
        <div style={txt(34, 400, COR.sec)}>como</div>
        <div style={txt(58, 600, COR.ambar, {lineHeight: 1.05})}>ferramenta de trabalho</div>
      </Abs>
      {Array.from({length: 6}).map((_, i) => {
        const lado = i % 2;
        const o = ent(t, c.start + 0.1 + i * 0.1, 0.3);
        return (
          <Abs key={i} x={lado ? 846 : 34} y={860 + Math.floor(i / 2) * 210} w={200} h={150} o={o} dy={(1 - o) * 30} style={card({padding: 14})}>
            <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
              <div style={{width: 26, height: 26, borderRadius: 4, background: i % 2 ? COR.petroleo : COR.cobalto}} />
              <div style={{width: 90, height: 8, background: COR.cinza1, borderRadius: 4}} />
            </div>
            <div style={{width: '90%', height: 8, background: COR.cinza1, borderRadius: 4, marginTop: 18}} />
            <div style={{width: `${40 + 50 * cl((t - c.start - i * 0.1) / 1.5)}%`, height: 8, background: COR.ambar, borderRadius: 4, marginTop: 12}} />
          </Abs>
        );
      })}
    </>
  );
};

// 16 · "Agora, o que vale um trilhão e meio daqui a 10 anos?" (regancho + 3D)
const CenaFuturo: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const tri = pop(t, m.tri - 0.2, 0.35);
  const anos = pop(t, m.anos - 0.15, 0.35);
  const ano = 2026 + Math.round(10 * inOutCubic(cl((t - m.anos + 0.3) / 0.7)));
  return (
    <>
      <Abs x={90} y={400} w={480} o={cl(tri)} s={0.8 + 0.2 * cl(tri)} origin="left top">
        <div style={txt(34, 400, COR.sec)}>o que vale</div>
        <div style={txt(110, 300, COR.ambar, {lineHeight: 1, marginTop: 6})}>US$ 1,5 tri</div>
      </Abs>
      <Abs x={600} y={400} w={400} h={290} o={cl(anos)} s={0.7 + 0.3 * cl(anos)} style={{background: COR.claro, borderRadius: 8, overflow: 'hidden'}}>
        <div style={{background: COR.ambar, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <span style={txt(28, 600, COR.preto, {letterSpacing: '0.1em'})}>DAQUI A 10 ANOS</span>
        </div>
        <div style={{textAlign: 'center', marginTop: 30}}>
          <span style={txt(130, 600, COR.preto, {lineHeight: 1, fontVariantNumeric: 'tabular-nums'})}>{ano}</span>
        </div>
      </Abs>
      {/* interrogações flutuando atrás do Bruno */}
      {Array.from({length: 6}).map((_, i) => {
        const lado = i % 2;
        const y = 880 + (i >> 1) * 200 + Math.sin(t * 2 + i) * 18;
        const o = ent(t, c.start + 0.15 * i, 0.3);
        return (
          <Abs key={i} x={lado ? 880 : 60} y={y} w={160} o={o * 0.85}>
            <div style={txt(130, 300, i % 3 === 0 ? COR.ambar : COR.cinza1, {lineHeight: 1})}>?</div>
          </Abs>
        );
      })}
    </>
  );
};

// 17 · "O Vitor Olivier, fundador da Decade, resumiu em quatro possíveis cenários." (Bruno fora, print com crédito)
const CenaVitor: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.35);
  // print 567×676 → largura 900 (escala 1,587). Zoom lento do título até a lista.
  const S0 = 900 / 567;
  const p = inOutCubic(cl((t - c.start) / Math.max(1, m.cenarios - c.start)));
  const z = 1 + 0.18 * p;
  const foco = 70 + 90 * p; // y no print (px originais): do título (~90) até a lista (~160)
  const lista = ent(t, m.cenarios - 0.3, 0.35);
  const W = 567 * S0;
  const H = 676 * S0;
  return (
    <>
      <Abs x={90} y={640} w={900} h={440} o={k} dy={(1 - k) * 30} style={{overflow: 'hidden', borderRadius: 8, border: `2px solid ${COR.borda}`, background: '#FFFFFF'}}>
        <div style={{position: 'absolute', left: 0, top: 120 - foco * S0 * z, width: W * z, height: H * z}}>
          <Img src={staticFile('vitor_post.png')} style={{width: W * z, height: H * z, display: 'block'}} />
          {/* destaque âmbar na lista dos 4 */}
          <div style={{position: 'absolute', left: 14 * S0 * z, top: 118 * S0 * z, width: 230 * S0 * z, height: 80 * S0 * z, border: `${4}px solid ${COR.ambar}`, borderRadius: 4, opacity: lista}} />
        </div>
      </Abs>
      <Abs x={90} y={400} w={900} o={k}>
        <div style={txt(34, 400, COR.sec)}>Vitor Olivier, fundador da Decade</div>
        <div style={txt(64, 600, COR.branco, {marginTop: 6})}>
          resumiu em <span style={{color: COR.ambar}}>4 futuros</span>
        </div>
      </Abs>
      <Abs x={90} y={1270} w={900} o={k}>
        <div style={txt(28, 400, COR.sec)}>Post de Vitor Olivier, fundador da Decade, no LinkedIn (nov/2026)</div>
      </Abs>
    </>
  );
};

// 18 + 19 · os 4 futuros (um card por frase) e as probabilidades do Vitor (Bruno fora)
const FUTUROS = [
  {n: 1, t: 'Microsoft 2.0', s: 'o sistema que toda empresa usa', p: 44},
  {n: 2, t: 'American Airlines', s: 'útil, mas brigando por preço', p: 30},
  {n: 3, t: 'Superinteligência', s: 'algo nunca visto', p: 1},
  {n: 4, t: 'Falir', s: 'IA vira commodity, igual eletricidade', p: 25},
];
const IconeFuturo: React.FC<{i: number; t: number; on: boolean}> = ({i, t, on}) => {
  const c = on ? COR.ambar : COR.claro;
  if (i === 0)
    return (
      <svg width={90} height={90} viewBox="0 0 90 90">
        {[0, 1, 2, 3].map((k) => (
          <rect key={k} x={6 + (k % 2) * 42} y={6 + Math.floor(k / 2) * 42} width={36} height={36} fill={c} opacity={0.5 + 0.5 * ((Math.floor(t * 3) + k) % 4 === 0 ? 1 : 0.6)} />
        ))}
      </svg>
    );
  if (i === 1)
    return (
      <svg width={90} height={90} viewBox="0 0 90 90">
        <path d="M8 50 L40 42 L58 12 L66 14 L56 42 L80 38 L86 44 L56 52 L64 78 L56 80 L40 56 L8 58 Z" fill={c} />
        <rect x={52} y={60} width={34} height={22} rx={3} fill={COR.erro} />
        <text x={69} y={77} fill="#fff" fontFamily={FONTE} fontSize={16} fontWeight={600} textAnchor="middle">
          $
        </text>
      </svg>
    );
  if (i === 2)
    return (
      <svg width={90} height={90} viewBox="0 0 90 90">
        <circle cx={45} cy={45} r={24 + 4 * Math.sin(t * 5)} fill={c} />
        <circle cx={45} cy={45} r={38 + 4 * Math.sin(t * 5 + 1)} fill="none" stroke={c} strokeWidth={4} opacity={0.6} />
      </svg>
    );
  return (
    <svg width={90} height={90} viewBox="0 0 90 90">
      <path d="M50 6 L20 50 L42 50 L36 84 L70 36 L48 36 Z" fill={c} />
    </svg>
  );
};
const CenaFuturos: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const ats = [m.f1, m.f2, m.f3, m.f4];
  const ps = [m.p1, m.p2, m.p3, m.p4];
  const cur = ats.filter((a) => t >= a - 0.15).length - 1;
  const fase2 = t >= m.probs - 0.2;
  const strip = ent(t, m.probs - 0.3, 0.35);
  const k = ent(t, c.start, 0.3);
  const W = 470;
  const Hc = 240;
  return (
    <>
      <Abs x={90} y={400} w={900} o={k * (1 - strip)}>
        <div style={txt(30, 600, COR.sec, {letterSpacing: '0.08em'})}>OS 4 FUTUROS DA ANTHROPIC</div>
        <div style={txt(74, 600, COR.branco, {marginTop: 10})}>{cur >= 0 ? `${FUTUROS[cur].n}. ${FUTUROS[cur].t}` : ''}</div>
      </Abs>
      {/* faixa do post com as chances */}
      <Abs x={90} y={400} w={900} o={strip}>
        <div style={txt(30, 600, COR.sec, {letterSpacing: '0.08em'})}>A CHANCE DE CADA UM, PARA O VITOR</div>
        <div style={{display: 'flex', gap: 18, marginTop: 18}}>
          {FUTUROS.map((f, i) => {
            const on = t >= ps[i] - 0.1;
            return (
              <div key={i} style={{flex: 1, height: 130, borderRadius: 6, background: on ? (i === 0 ? COR.ambar : COR.sup2) : COR.sup, border: `2px solid ${on ? COR.ambar : COR.borda}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <span style={txt(64, 600, on ? (i === 0 ? COR.preto : COR.ambar) : COR.cinza1, {fontVariantNumeric: 'tabular-nums'})}>{f.p}%</span>
              </div>
            );
          })}
        </div>
      </Abs>
      {FUTUROS.map((f, i) => {
        const o = pop(t, ats[i] - 0.15, 0.35);
        const ativo = !fase2 && i === cur;
        const x = 60 + (i % 2) * (W + 20);
        const y = 712 + Math.floor(i / 2) * 520;
        const pp = inOutCubic(cl((t - ps[i] + 0.1) / 0.6));
        const destaque = fase2 ? t >= ps[i] - 0.1 : ativo;
        return (
          <Abs key={i} x={x} y={y} w={W} h={Hc} o={cl(o) * (fase2 || ativo || i < cur ? 1 : 0.5) + (i < cur && !fase2 ? -0.35 : 0)} s={(0.7 + 0.3 * cl(o)) * (ativo ? 1.03 : 1)} style={card({padding: 24, border: `3px solid ${destaque ? COR.ambar : COR.borda}`})}>
            <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
              <div style={{width: 56, height: 56, borderRadius: 28, background: destaque ? COR.ambar : COR.sup2, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <span style={txt(34, 600, destaque ? COR.preto : COR.branco)}>{f.n}</span>
              </div>
              <div style={{transform: 'scale(0.7)', transformOrigin: 'left center', width: 63, height: 63}}>
                <IconeFuturo i={i} t={t} on={destaque} />
              </div>
            </div>
            <div style={txt(40, 600, COR.branco, {marginTop: 12, whiteSpace: 'nowrap'})}>{f.t}</div>
            <div style={txt(24, 400, COR.sec, {marginTop: 6})}>{f.s}</div>
            {fase2 ? (
              <div style={{position: 'absolute', left: 24, right: 24, bottom: 16, height: 20, background: COR.sup2, borderRadius: 4}}>
                <div style={{width: `${Math.max(f.p, 1.5) * pp}%`, height: '100%', background: i === 0 ? COR.ambar : COR.claro, borderRadius: 4}} />
              </div>
            ) : null}
            {fase2 ? (
              <div style={{position: 'absolute', right: 24, top: 24, opacity: pp, ...txt(56, 600, i === 0 ? COR.ambar : COR.claro, {fontVariantNumeric: 'tabular-nums'})}}>{Math.round(f.p * pp)}%</div>
            ) : null}
          </Abs>
        );
      })}
    </>
  );
};

// 20 · "O dado da Clara puxa para o primeiro. Empresa pagando ferramenta de trabalho é a cara da Microsoft."
const CenaOpiniao: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.35);
  const voa = inOutCubic(cl((t - m.clara) / Math.max(0.4, m.primeiro - m.clara + 0.3)));
  const chega = t >= m.primeiro;
  const cara = pop(t, m.cara - 0.1, 0.35);
  return (
    <>
      <Abs x={420} y={400} w={570} h={290} o={k} s={chega ? 1 + 0.04 * Math.max(0, 1 - (t - m.primeiro) * 4) : 1} style={card({padding: 26, border: `4px solid ${COR.ambar}`})}>
        <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
          <div style={{width: 64, height: 64, borderRadius: 32, background: COR.ambar, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <span style={txt(38, 600, COR.preto)}>1</span>
          </div>
          <IconeFuturo i={0} t={t} on />
        </div>
        <div style={txt(52, 600, COR.branco, {marginTop: 18})}>Microsoft 2.0</div>
        <div style={txt(28, 400, COR.sec, {marginTop: 8})}>empresa pagando ferramenta de trabalho</div>
      </Abs>
      {/* o 56% da Clara voando para o card 1 */}
      <Abs x={90 + 380 * voa} y={460 - 20 * Math.sin(voa * Math.PI)} w={280} o={ent(t, c.start, 0.3) * (chega ? 1 - ent(t, m.primeiro + 0.2, 0.3) : 1)}>
        <div style={{display: 'inline-block', background: COR.preto, border: `3px solid ${COR.ambar}`, borderRadius: 4, padding: '10px 18px'}}>
          <div style={txt(22, 600, COR.sec, {letterSpacing: '0.08em'})}>DADO DA CLARA</div>
          <div style={txt(64, 300, COR.ambar, {lineHeight: 1, marginTop: 4})}>56%</div>
        </div>
      </Abs>
      <Abs x={90} y={560} w={300} o={cl(cara)} s={1.4 - 0.4 * cl(cara)} r={-5} style={{background: COR.ambar, borderRadius: 4, padding: '10px 16px', boxSizing: 'border-box'}}>
        <span style={txt(40, 600, COR.preto)}>cara de Microsoft</span>
      </Abs>
      {/* empresas pagando: cartões entrando atrás do Bruno */}
      {Array.from({length: 8}).map((_, i) => {
        const lado = i % 2;
        const nasc = c.start + i * 0.3;
        const y = 1500 - ((t - nasc) * 200) % 700;
        const o = ent(t, nasc, 0.25) * cl((y - 800) / 120);
        return (
          <Abs key={i} x={lado ? 846 : 34} y={y} w={200} h={120} o={o * 0.9} style={{background: i % 3 === 0 ? COR.ambarEsc : COR.sup2, border: `1px solid ${COR.borda}`, borderRadius: 12, padding: 14, boxSizing: 'border-box'}}>
            <div style={{width: 40, height: 30, borderRadius: 4, background: COR.ambar}} />
            <div style={{width: '70%', height: 8, background: COR.cinza1, borderRadius: 4, marginTop: 30}} />
          </Abs>
        );
      })}
    </>
  );
};

// 21 · "Mas o risco do segundo é real. Se modelos abertos ficarem bons e baratos, vira briga por preço."
const CenaRisco: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.35);
  const pisca = t >= m.risco && t < m.abertos ? (Math.floor(t * 5) % 2 === 0 ? 1 : 0) : t >= m.abertos ? 1 : 0;
  const ab = ent(t, m.abertos - 0.2, 0.35);
  const briga = pop(t, m.briga - 0.1, 0.35);
  return (
    <>
      <Abs x={90} y={400} w={500} h={290} o={k} style={card({padding: 26, border: `4px solid ${pisca ? COR.erro : COR.borda}`})}>
        <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
          <div style={{width: 64, height: 64, borderRadius: 32, background: COR.sup2, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <span style={txt(38, 600, COR.branco)}>2</span>
          </div>
          <IconeFuturo i={1} t={t} on={false} />
        </div>
        <div style={txt(48, 600, COR.branco, {marginTop: 18, whiteSpace: 'nowrap'})}>American Airlines</div>
        <div style={{...txt(30, 600, COR.erro, {marginTop: 8}), opacity: ent(t, m.risco, 0.3)}}>o risco é real</div>
      </Abs>
      <Abs x={620} y={400} w={370} o={ab} dx={(1 - ab) * 30}>
        <div style={txt(26, 600, COR.sec, {letterSpacing: '0.08em'})}>MODELOS ABERTOS</div>
        {['bons', 'baratos'].map((l, i) => (
          <div key={l} style={{display: 'flex', alignItems: 'center', gap: 14, marginTop: 14, opacity: ent(t, m.abertos + 0.5 + i * 0.5, 0.3)}}>
            <Check size={40} />
            <span style={txt(44, 600, COR.branco)}>{l}</span>
          </div>
        ))}
      </Abs>
      <Abs x={620} y={600} w={370} h={90} o={cl(briga)} s={1.3 - 0.3 * cl(briga)} r={-4} style={{background: COR.erro, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <span style={txt(40, 600, COR.branco)}>briga por preço</span>
      </Abs>
      {/* etiquetas de preço caindo atrás do Bruno */}
      {Array.from({length: 10}).map((_, i) => {
        const lado = i % 2;
        const nasc = m.abertos - 0.3 + i * 0.25;
        const y = 800 + ((t - nasc) * 260) % 720;
        const o = ent(t, nasc, 0.2) * cl((1500 - y) / 100);
        const preco = Math.max(1, Math.round(90 - (t - nasc) * 30 - i * 3));
        return (
          <Abs key={i} x={lado ? 856 : 44} y={y} w={180} h={84} o={o} r={(lado ? 6 : -6)} style={{background: COR.claro, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8}}>
            <svg width={26} height={26} viewBox="0 0 20 20"><path d="M10 18 L18 8 L13 8 L13 2 L7 2 L7 8 L2 8 Z" fill={COR.erro} /></svg>
            <span style={txt(36, 600, COR.preto, {fontVariantNumeric: 'tabular-nums'})}>US$ {preco}</span>
          </Abs>
        );
      })}
    </>
  );
};

// 22 · "Qual desses futuros você acredita que vem?"
const CenaCta: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.3);
  const com = pop(t, m.comenta - 0.1, 0.35);
  return (
    <>
      <Abs x={90} y={400} w={900} o={k} dy={(1 - k) * 20}>
        <div style={txt(56, 600, COR.branco)}>Qual desses futuros vem?</div>
      </Abs>
      <Abs x={90} y={490} w={900} h={130}>
        <div style={{display: 'flex', gap: 16}}>
          {FUTUROS.map((f, i) => {
            const o = pop(t, c.start + 0.15 + i * 0.12, 0.3);
            return (
              <div key={i} style={{flex: 1, height: 120, borderRadius: 6, background: COR.sup, border: `2px solid ${COR.borda}`, opacity: cl(o), transform: `scale(${0.7 + 0.3 * cl(o)})`, padding: '12px 10px', boxSizing: 'border-box', textAlign: 'center'}}>
                <div style={txt(44, 600, COR.ambar)}>{f.n}</div>
                <div style={txt(18, 600, COR.claro, {marginTop: 6})}>{f.t}</div>
              </div>
            );
          })}
        </div>
      </Abs>
      <Abs x={90} y={630} w={600} o={cl(com)} s={0.8 + 0.2 * cl(com)} origin="left center">
        <span style={{...txt(40, 600, COR.preto), background: COR.ambar, padding: '6px 18px', borderRadius: 3}}>comenta o número</span>
      </Abs>
    </>
  );
};

// 23 · "Comenta aqui abaixo o que você acha do futuro da Anthropic." + assinatura
const CenaFecho: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const logo = ent(t, m.logo, 0.3);
  const bubbles = [
    {x: 24, y: 900, at: c.start + 0.2, txt: '1'},
    {x: 826, y: 980, at: c.start + 0.45, txt: '2'},
    {x: 24, y: 1140, at: c.start + 0.7, txt: '1'},
    {x: 826, y: 1220, at: c.start + 0.95, txt: '4'},
  ];
  return (
    <>
      {bubbles.map((b, i) => {
        const o = pop(t, b.at, 0.35);
        return (
          <Abs key={i} x={b.x} y={b.y} w={230} o={cl(o)} s={0.7 + 0.3 * cl(o)} dy={(1 - cl(o)) * 30} origin={i % 2 ? 'right bottom' : 'left bottom'} style={{display: 'flex', gap: 10, alignItems: 'flex-start'}}>
            <div style={{width: 44, height: 44, borderRadius: 22, background: [COR.petroleo, COR.cobalto, COR.cinza1, COR.ambarEsc][i], flexShrink: 0}} />
            <div style={card({flex: 1, padding: '10px 14px'})}>
              <span style={txt(40, 600, COR.ambar)}>{b.txt}</span>
            </div>
          </Abs>
        );
      })}
      <Abs x={90} y={398} w={900} o={(1 - logo) * ent(t, c.start, 0.3)}>
        <div style={txt(52, 600, COR.branco)}>O que você acha do futuro</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: 10}}>
          <span style={txt(52, 600, COR.branco)}>da</span>
          <Img src={staticFile(WORDMARK)} style={{height: 44, filter: 'invert(1)'}} />
          <span style={txt(52, 600, COR.branco)}>?</span>
        </div>
      </Abs>
      <Abs x={60} y={380} w={300} h={300} o={logo}>
        <Sequence from={Math.round(m.logo * 30)} layout="none">
          <Video src={staticFile('brand/logo-anim.webm')} style={{width: 300, height: 300}} muted />
        </Sequence>
      </Abs>
      <Abs x={390} y={450} w={620} o={ent(t, m.logo + 0.25, 0.35)}>
        <Img src={staticFile('brand/falaibruno-branco.svg')} style={{width: 580}} />
        <div style={txt(38, 600, COR.ambar, {marginTop: 18})}>Falai, o que você acha?</div>
      </Abs>
    </>
  );
};

const CENAS: Record<string, React.FC<{t: number; c: Cena}>> = {
  ipo: CenaIpo,
  valor: CenaValor,
  caixa: CenaCaixa,
  ipodef: CenaIpoDef,
  estreia: CenaEstreia,
  fundada: CenaFundada,
  dia1: CenaDia1,
  mesa: CenaMesa,
  sobedesce: CenaSobeDesce,
  fundamentos: CenaFundamentos,
  conta: CenaConta,
  clara: CenaClara,
  n56: CenaN56,
  recorte: CenaRecorte,
  ferramenta: CenaFerramenta,
  futuro: CenaFuturo,
  vitor: CenaVitor,
  futuros: CenaFuturos,
  opiniao: CenaOpiniao,
  risco: CenaRisco,
  cta: CenaCta,
  fecho: CenaFecho,
};

// ======================= HEADLINE (estilo "contorno", escolhido pelo Bruno nesta rodada) =======================
// Branco com contorno preto grosso, caixa de frase, duas linhas, sem cor de destaque.
const Headline: React.FC<{t: number}> = ({t}) => {
  const h = F.headline;
  if (!h || t >= h.fim + 0.3) return null;
  const a = ent(t, 0.05, 0.4);
  const b = ent(t, 0.3, 0.4);
  const out = cl((h.fim - t) / 0.3);
  const st: React.CSSProperties = {...txt(96, 600, COR.branco, {lineHeight: 1.06}), WebkitTextStroke: '16px #000', paintOrder: 'stroke fill'};
  return (
    <div style={{position: 'absolute', left: 50, right: 50, top: 330, textAlign: 'center', opacity: out}}>
      <div style={{...st, opacity: a, transform: `translateY(${(1 - a) * 24}px)`}}>{h.l1}</div>
      <div style={{...st, opacity: b, transform: `translateY(${(1 - b) * 24}px)`}}>{h.l2}</div>
    </div>
  );
};

/** selo "Não é recomendação de investimento" (camada de texto) */
const Selo: React.FC<{t: number}> = ({t}) => {
  const w = (F as unknown as {selo?: [number, number][]}).selo ?? [];
  let o = 0;
  for (const [a, b] of w) o = Math.max(o, jan(t, a, b, 0.3, 0.3));
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 90, top: 712, opacity: o, border: `2px solid ${COR.cinza1}`, borderRadius: 3, padding: '6px 14px', ...txt(24, 600, COR.sec, {letterSpacing: '0.06em'})}}>NÃO É RECOMENDAÇÃO DE INVESTIMENTO</div>
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
              {h < 0.999 ? <OffthreadVideo src={staticFile('pessoa_v.mov')} transparent muted style={{width: 1080, height: 1920}} /> : null}
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
          <Selo t={t} />
          {md && (md.ate === undefined || t < md.ate) ? (
            <Img src={staticFile(md.src)} style={{position: 'absolute', left: md.x, top: md.y, width: md.size, height: md.size}} />
          ) : null}
        </Plano>
      </div>
    </AbsoluteFill>
  );
};
