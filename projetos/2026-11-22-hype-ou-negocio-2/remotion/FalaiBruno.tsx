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
// ======================= CENAS (camada ELEMENTOS) — Hype ou Negócio? #2 (Rivio) =======================
// Zona A (acima da cabeça): y 390–700. Centro (Bruno fora): y 700–1100 e 1250–1470 (a faixa 1120–1240 é da legenda).
// Laterais atrás do Bruno: x 20–250 / 830–1060, y 800–1500.
// Fronteira: nada do trabalho do Bruno. Sem nome de hospital, sem paciente, sem números de marketing do site.
// Rivio só com o nome em texto (sem logo). Modelo de cobrança sempre com "segundo a empresa".

const dec = (n: number, casas = 1) => n.toFixed(casas).replace('.', ',');

/** papel claro (conta, prontuário, contrato, recurso) */
const Papel: React.FC<{x: number; y: number; w: number; h: number; o?: number; s?: number; r?: number; dx?: number; dy?: number; titulo: string; cor?: string; children?: React.ReactNode}> = ({x, y, w, h, o = 1, s = 1, r = 0, dx = 0, dy = 0, titulo, cor = COR.ambarEsc, children}) => (
  <Abs x={x} y={y} w={w} h={h} o={o} s={s} r={r} dx={dx} dy={dy} style={{background: COR.claro, borderRadius: 4, padding: 20, boxSizing: 'border-box', overflow: 'hidden'}}>
    <div style={txt(Math.min(30, w / 9), 600, cor, {letterSpacing: '0.08em', textTransform: 'uppercase'})}>{titulo}</div>
    <div style={{height: 4, width: 70, background: cor, marginTop: 8, marginBottom: 10}} />
    {children}
  </Abs>
);

/** linha de item de conta: nome + valor em barra */
const Item: React.FC<{l: string; o?: number; ruim?: number; ok?: number; size?: number}> = ({l, o = 1, ruim = 0, ok = 0, size = 26}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, opacity: o, position: 'relative'}}>
    <span style={txt(size, 600, ruim > 0.5 ? COR.erro : '#2B2B2B', {flex: 1, whiteSpace: 'nowrap'})}>{l}</span>
    <div style={{width: 70, height: 10, borderRadius: 5, background: ruim > 0.5 ? COR.erro : '#BDBDBD'}} />
    {ok > 0.5 ? <Check size={size + 4} /> : null}
    {ruim > 0.5 ? <Xis size={size + 4} /> : null}
    {ruim > 0 ? <div style={{position: 'absolute', left: -6, top: '50%', width: `${104 * cl(ruim)}%`, height: 4, background: COR.erro}} /> : null}
  </div>
);

/** carimbo inclinado */
const Carimbo: React.FC<{x: number; y: number; w: number; t: string; p: number; cor?: string; size?: number; r?: number}> = ({x, y, w, t, p, cor = COR.erro, size = 64, r = -8}) => (
  <Abs x={x} y={y} w={w} o={cl(p * 3)} s={1.6 - 0.6 * cl(p)} r={r} style={{border: `8px solid ${cor}`, borderRadius: 8, padding: '8px 18px', boxSizing: 'border-box', textAlign: 'center', background: 'rgba(11,11,11,0.0)'}}>
    <span style={txt(size, 600, cor, {letterSpacing: '0.06em'})}>{t}</span>
  </Abs>
);

/** caixa do fluxo (Atendimento → Conta → Plano) */
const Caixa: React.FC<{x: number; y: number; w: number; h: number; l: string; o: number; on?: boolean; cor?: string; icone?: React.ReactNode; size?: number}> = ({x, y, w, h, l, o, on = true, cor = COR.cobalto, icone, size = 38}) => (
  <Abs x={x} y={y} w={w} h={h} o={cl(o)} s={0.8 + 0.2 * cl(o)} style={{background: COR.preto, border: `4px solid ${on ? cor : COR.borda}`, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, boxSizing: 'border-box'}}>
    {icone}
    <span style={txt(size, 600, on ? COR.branco : COR.sec, {textAlign: 'center'})}>{l}</span>
  </Abs>
);

const IcHospital: React.FC<{c?: string}> = ({c = COR.cobalto}) => (
  <svg width={64} height={64} viewBox="0 0 64 64"><rect x={8} y={14} width={48} height={44} fill="none" stroke={c} strokeWidth={5} /><path d="M32 22 V44 M21 33 H43" stroke={c} strokeWidth={7} /></svg>
);
const IcConta: React.FC<{c?: string}> = ({c = COR.ambar}) => (
  <svg width={64} height={64} viewBox="0 0 64 64"><path d="M14 6 H50 V58 L44 53 L38 58 L32 53 L26 58 L20 53 L14 58 Z" fill="none" stroke={c} strokeWidth={5} /><path d="M22 20 H42 M22 30 H42 M22 40 H34" stroke={c} strokeWidth={4} /></svg>
);
const IcEscudo: React.FC<{c?: string}> = ({c = COR.petroleoClaro}) => (
  <svg width={64} height={64} viewBox="0 0 64 64"><path d="M32 6 L54 14 V32 C54 46 44 54 32 58 C20 54 10 46 10 32 V14 Z" fill="none" stroke={c} strokeWidth={5} /><path d="M22 32 L29 39 L43 24" stroke={c} strokeWidth={5} fill="none" /></svg>
);
const IcBot: React.FC<{c?: string; s?: number}> = ({c = COR.ambar, s = 64}) => (
  <svg width={s} height={s} viewBox="0 0 64 64"><rect x={10} y={18} width={44} height={34} rx={6} fill="none" stroke={c} strokeWidth={5} /><circle cx={25} cy={35} r={5} fill={c} /><circle cx={39} cy={35} r={5} fill={c} /><path d="M32 18 V8" stroke={c} strokeWidth={5} /><circle cx={32} cy={7} r={4} fill={c} /></svg>
);
const IcPessoa: React.FC<{c?: string; s?: number}> = ({c = COR.petroleoClaro, s = 64}) => (
  <svg width={s} height={s} viewBox="0 0 64 64"><circle cx={32} cy={20} r={12} fill={c} /><path d="M10 60 C10 42 54 42 54 60 Z" fill={c} /></svg>
);

/** número com rolagem de R$ (mi / bi) */
const reais = (v: number) => (v >= 1000 ? `R$ ${dec(v / 1000, 1).replace(',0', '')} bi` : `R$ ${Math.round(v)} mi`);

// 1 · "Uma startup brasileira com um ano de vida já vale um bilhão de reais." (gancho)
const CenaGancho: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const roll = inOutCubic(cl((t - m.bilhao + 0.5) / 0.7));
  const big = ent(t, 0, 0.5);
  const ano = pop(t, m.ano - 0.1, 0.35);
  return (
    <>
      {/* R$ 1 bi gigante desde o quadro 0, atrás do Bruno */}
      <Abs x={0} y={690} w={1080} o={big} s={0.92 + 0.08 * big + 0.03 * cl((t - m.bilhao) / 1)} style={{textAlign: 'center'}}>
        <div style={txt(300, 300, COR.ambar, {lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em'})}>{t < m.bilhao - 0.5 ? 'R$ 1 bi' : `R$ ${dec(roll, 1).replace(',0', '')} bi`}</div>
      </Abs>
      {/* 1 ano de vida: calendário à esquerda, atrás dele */}
      <Abs x={34} y={1060} w={220} h={220} o={cl(ano)} s={0.7 + 0.3 * cl(ano)} style={card({padding: 0, overflow: 'hidden', textAlign: 'center'})}>
        <div style={{background: COR.ambar, height: 54, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <span style={txt(26, 600, COR.preto, {letterSpacing: '0.08em'})}>IDADE</span>
        </div>
        <div style={txt(84, 300, COR.branco, {lineHeight: 1, marginTop: 22})}>1</div>
        <div style={txt(28, 600, COR.sec, {marginTop: 6})}>ano de vida</div>
      </Abs>
      {/* startup brasileira: selo à direita */}
      <Abs x={826} y={1100} w={230} h={150} o={ent(t, 0.6, 0.35)} style={card({padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10})}>
        <div style={{display: 'flex', height: 34, borderRadius: 3, overflow: 'hidden', width: 60}}>
          <div style={{flex: 1, background: '#1F8F4E'}} />
          <div style={{flex: 1, background: '#F2C230'}} />
        </div>
        <span style={txt(28, 600, COR.branco)}>startup brasileira</span>
      </Abs>
    </>
  );
};

// 2 · "E ela não faz chatbot." — balão de chat riscado
const CenaChatbot: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = pop(t, c.start, 0.35);
  const risca = ent(t, m.chatbot + 0.15, 0.3);
  const dots = [0, 1, 2].map((i) => 0.4 + 0.6 * Math.abs(Math.sin(t * 6 + i)));
  return (
    <>
      <Abs x={210} y={410} w={660} h={250} o={cl(k)} s={0.8 + 0.2 * cl(k)} style={{background: COR.sup, border: `3px solid ${risca > 0.5 ? COR.erro : COR.borda}`, borderRadius: 28, padding: 30, boxSizing: 'border-box'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <IcBot c={COR.sec} s={56} />
          <span style={txt(44, 600, COR.claro)}>chatbot</span>
        </div>
        <div style={{display: 'flex', gap: 14, marginTop: 30, marginLeft: 8}}>
          {dots.map((d, i) => (
            <div key={i} style={{width: 26, height: 26, borderRadius: 13, background: COR.sec, opacity: d}} />
          ))}
        </div>
        <div style={{position: 'absolute', left: 120, bottom: -34, width: 0, height: 0, borderLeft: '36px solid transparent', borderTop: `36px solid ${risca > 0.5 ? COR.erro : COR.borda}`}} />
      </Abs>
      <Svg o={risca}>
        <line x1={190} y1={680} x2={190 + 700 * risca} y2={390 + 0 * risca} stroke={COR.erro} strokeWidth={18} strokeLinecap="round" />
      </Svg>
      <Abs x={640} y={600} w={330} o={ent(t, m.chatbot + 0.3, 0.25)} r={-4} style={{background: COR.erro, borderRadius: 4, padding: '8px 16px', boxSizing: 'border-box', textAlign: 'center'}}>
        <span style={txt(40, 600, COR.branco)}>não é chatbot</span>
      </Abs>
    </>
  );
};

// 3 · "A empresa é a Rivio. Foi fundada em 2025."
const CenaRivio: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const nome = pop(t, m.rivio - 0.1, 0.4);
  const ano = pop(t, m.ano - 0.1, 0.35);
  const fund = ent(t, m.fundada - 0.1, 0.3);
  return (
    <>
      <Abs x={90} y={400} w={900} o={cl(nome)} s={0.85 + 0.15 * cl(nome)} origin="left center">
        <div style={txt(30, 600, COR.sec, {letterSpacing: '0.08em'})}>A EMPRESA</div>
        <div style={txt(150, 600, COR.branco, {lineHeight: 1, marginTop: 6, letterSpacing: '-0.03em'})}>Rivio</div>
      </Abs>
      <Abs x={560} y={430} w={430} h={230} o={fund} dx={(1 - fund) * 30} style={card({padding: 22, borderTop: `6px solid ${COR.ambar}`})}>
        <div style={txt(26, 600, COR.sec, {letterSpacing: '0.08em'})}>FUNDADA EM</div>
        <div style={{...txt(110, 300, COR.ambar, {lineHeight: 1, marginTop: 10, fontVariantNumeric: 'tabular-nums'}), opacity: cl(ano), transform: `scale(${0.7 + 0.3 * cl(ano)})`, transformOrigin: 'left center'}}>2025</div>
      </Abs>
      {/* folhas de calendário caindo atrás dele */}
      {Array.from({length: 8}).map((_, i) => {
        const lado = i % 2;
        const nasc = c.start + 0.2 + i * 0.25;
        const y = 820 + ((t - nasc) * 220) % 640;
        const o = ent(t, nasc, 0.2) * cl((1480 - y) / 100);
        const mes = ['jan', 'mar', 'mai', 'jul', 'set', 'nov', 'fev', 'abr'][i];
        return (
          <Abs key={i} x={lado ? 860 : 50} y={y} w={170} h={140} o={o * 0.9} r={lado ? 5 : -5} style={card({padding: 0, overflow: 'hidden', textAlign: 'center'})}>
            <div style={{height: 36, background: i % 3 === 0 ? COR.ambar : COR.sup2}} />
            <div style={txt(40, 600, COR.claro, {marginTop: 18})}>{mes}</div>
          </Abs>
        );
      })}
    </>
  );
};

// 4 · "Em dezembro do ano passado, ela valia 500 milhões... finalizaram a rodada série A, captando 180 milhões... a um bilhão de valor de mercado." (Bruno fora)
const CenaLinha: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.35);
  // marcos na linha do tempo
  const marcos = [
    {d: '2025', l: 'fundação', at: c.start + 0.1, v: ''},
    {d: 'dez/2025', l: 'valia', at: m.dez, v: 'R$ 500 mi'},
    {d: 'nov/2026', l: 'Série A', at: m.rodada, v: 'R$ 180 mi'},
    {d: 'hoje', l: 'valor de mercado', at: m.bi - 0.2, v: 'R$ 1 bi+'},
  ];
  const xs = [120, 380, 640, 900];
  const ly = 760;
  const prog = cl((t - c.start) / (m.bi - c.start + 0.3));
  // barra de valor: 0 → 500 → 1000
  const v500 = inOutCubic(cl((t - m.n500 + 0.4) / 0.7)) * 500;
  const v1000 = inOutCubic(cl((t - m.bi + 0.4) / 0.8)) * 500;
  const valor = v500 + v1000;
  const hMax = 520;
  const hb = (valor / 1000) * hMax;
  const n180 = ent(t, m.n180 - 0.3, 0.4);
  const capta = inOutCubic(cl((t - m.n180 + 0.3) / 0.8)) * 180;
  return (
    <>
      <Abs x={90} y={400} w={900} o={k} dy={(1 - k) * 20}>
        <div style={txt(30, 600, COR.sec, {letterSpacing: '0.08em'})}>VALOR DA RIVIO</div>
        <div style={{...txt(150, 300, COR.ambar, {lineHeight: 1, marginTop: 6, fontVariantNumeric: 'tabular-nums'}), opacity: ent(t, m.n500 - 0.5, 0.3)}}>{reais(Math.max(1, valor))}</div>
      </Abs>
      {/* linha do tempo */}
      <Svg o={k}>
        <line x1={xs[0]} y1={ly} x2={xs[0] + (xs[3] - xs[0]) * prog} y2={ly} stroke={COR.ambar} strokeWidth={6} />
        <line x1={xs[0] + (xs[3] - xs[0]) * prog} y1={ly} x2={xs[3]} y2={ly} stroke={COR.borda} strokeWidth={6} />
        {marcos.map((mk, i) => (
          <circle key={i} cx={xs[i]} cy={ly} r={t >= mk.at ? 18 : 12} fill={t >= mk.at ? COR.ambar : COR.sup2} stroke={COR.borda} strokeWidth={3} />
        ))}
      </Svg>
      {marcos.map((mk, i) => {
        const o = ent(t, mk.at - 0.1, 0.3);
        return (
          <Abs key={i} x={xs[i] - 120} y={ly + 34} w={240} o={o} dy={(1 - o) * 14} style={{textAlign: 'center'}}>
            <div style={txt(30, 600, COR.branco)}>{mk.d}</div>
            <div style={txt(24, 400, COR.sec, {marginTop: 4})}>{mk.l}</div>
          </Abs>
        );
      })}
      {/* barras dez/2025 × hoje, abaixo da legenda (y 1290–1460) */}
      {[
        {l: 'dez/2025', v: Math.min(valor, 500), bg: COR.sup2, fg: COR.claro, x: 120, at: m.n500},
        {l: 'hoje', v: v1000 > 0 ? 500 + v1000 : 0, bg: COR.ambar, fg: COR.preto, x: 780, at: m.bi},
      ].map((b) => {
        const hh = (b.v / 1000) * 170;
        return (
          <div key={b.l} style={{position: 'absolute', left: b.x, top: 1460 - hh, width: 180, height: hh, background: b.bg, border: `2px solid ${COR.borda}`, boxSizing: 'border-box', opacity: ent(t, b.at - 0.4, 0.3), display: 'flex', justifyContent: 'center', paddingTop: 8, overflow: 'hidden'}}>
            <span style={txt(26, 600, b.fg)}>{b.l}</span>
          </div>
        );
      })}
      {/* rodada série A: notas entrando na caixa central */}
      <Abs x={240} y={880} w={600} h={200} o={n180} s={0.85 + 0.15 * n180} style={{background: COR.preto, border: `4px solid ${COR.petroleoClaro}`, borderRadius: 8, padding: '18px 24px', boxSizing: 'border-box', textAlign: 'center'}}>
        <div style={txt(28, 600, COR.petroleoClaro, {letterSpacing: '0.08em'})}>RODADA SÉRIE A</div>
        <div style={txt(96, 300, COR.branco, {lineHeight: 1, marginTop: 12, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap'})}>R$ {Math.round(capta)} mi</div>
      </Abs>
      {Array.from({length: 10}).map((_, i) => {
        const nasc = m.n180 - 0.2 + i * 0.12;
        const p = cl((t - nasc) / 0.6);
        if (p <= 0 || p >= 1) return null;
        const x0 = i % 2 ? 1120 : -160;
        const y0 = 1300 + rnd(i) * 150;
        const x = x0 + (540 - 75 - x0) * outCubic(p);
        const y = y0 + (990 - y0) * outCubic(p);
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, width: 150, height: 70, background: COR.petroleo, border: `3px solid ${COR.petroleoClaro}`, borderRadius: 4, opacity: 1 - p * 0.5, transform: `rotate(${(rnd(i + 3) - 0.5) * 40 * (1 - p)}deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <span style={txt(30, 600, COR.branco)}>R$</span>
          </div>
        );
      })}
      {/* selo final: valor de mercado (como ele fala) */}
      <Abs x={400} y={1330} w={280} o={cl(pop(t, m.mercado - 0.2, 0.35))} s={1.3 - 0.3 * cl(pop(t, m.mercado - 0.2, 0.35))} r={-5} style={{background: COR.ambar, borderRadius: 4, padding: '10px 14px', boxSizing: 'border-box', textAlign: 'center'}}>
        <span style={txt(36, 600, COR.preto)}>valor de mercado</span>
      </Abs>
    </>
  );
};

// 5 · "A empresa funciona assim." (Bruno na tela) — engrenagens
const Engrenagem: React.FC<{cx: number; cy: number; r: number; rot: number; cor: string}> = ({cx, cy, r, rot, cor}) => {
  const dentes = 10;
  const pts: string[] = [];
  for (let i = 0; i < dentes * 2; i++) {
    const a = (i / (dentes * 2)) * Math.PI * 2 + (rot * Math.PI) / 180;
    const rr = i % 2 ? r : r * 1.18;
    pts.push(`${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`);
  }
  return (
    <g>
      <polygon points={pts.join(' ')} fill={COR.sup2} stroke={cor} strokeWidth={6} />
      <circle cx={cx} cy={cy} r={r * 0.35} fill={COR.fundo} stroke={cor} strokeWidth={6} />
    </g>
  );
};
const CenaFunciona: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.3);
  const ass = pop(t, m.assim - 0.1, 0.3);
  return (
    <>
      <Abs x={90} y={410} w={900} o={k} dy={(1 - k) * 20}>
        <div style={txt(44, 400, COR.sec)}>Como funciona</div>
      </Abs>
      <Abs x={90} y={480} w={600} o={cl(ass)} s={0.8 + 0.2 * cl(ass)} origin="left center">
        <Tag t="passo a passo" size={44} />
      </Abs>
      <Svg o={k}>
        <Engrenagem cx={150} cy={1050} r={110} rot={t * 90} cor={COR.ambar} />
        <Engrenagem cx={150} cy={1300} r={80} rot={-t * 120} cor={COR.cinza1} />
        <Engrenagem cx={930} cy={1000} r={90} rot={-t * 100} cor={COR.petroleoClaro} />
        <Engrenagem cx={940} cy={1260} r={120} rot={t * 80} cor={COR.cinza1} />
      </Svg>
    </>
  );
};

// 6 · "O hospital te atende, monta uma conta com tudo que usou e manda para o seu plano de saúde." (Bruno fora)
const ITENS_CONTA = ['Diária', 'Exames', 'Material', 'Medicamentos', 'Honorários'];
const CenaConta: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const y = 400;
  const xs = [40, 380, 720];
  const W = 320;
  const H = 230;
  const conta = ent(t, m.conta - 0.2, 0.35);
  const manda = inOutCubic(cl((t - m.manda) / 0.7));
  // a conta voa da caixa do meio para o plano
  const pX = 360 + 320 * manda;
  const pY = 760 - 300 * Math.sin(manda * Math.PI) * 0.3;
  return (
    <>
      <Caixa x={xs[0]} y={y} w={W} h={H} l="Atendimento" o={pop(t, m.hospital - 0.15, 0.35)} cor={COR.cobalto} icone={<IcHospital />} />
      <Caixa x={xs[1]} y={y} w={W} h={H} l="Conta" o={pop(t, m.conta - 0.25, 0.35)} cor={COR.ambar} icone={<IcConta />} />
      <Caixa x={xs[2]} y={y} w={W} h={H} l="Plano de saúde" o={pop(t, m.plano - 0.35, 0.35)} on={t >= m.plano - 0.1} cor={COR.petroleoClaro} icone={<IcEscudo />} size={34} />
      <Seta x1={xs[0] + W + 2} y1={y + H / 2} x2={xs[1] - 6} y2={y + H / 2} p={ent(t, m.conta - 0.35, 0.3)} cor={COR.ambar} />
      <Seta x1={xs[1] + W + 2} y1={y + H / 2} x2={xs[2] - 6} y2={y + H / 2} p={ent(t, m.manda - 0.2, 0.3)} cor={COR.ambar} />
      {/* a conta em papel, com os itens entrando um a um */}
      <Papel x={pX} y={pY} w={360} h={330} o={conta * (1 - 0.0 * manda)} s={1 - 0.25 * manda} r={-3 + 6 * manda} titulo="Conta">
        {ITENS_CONTA.map((l, i) => (
          <Item key={l} l={l} o={ent(t, m.conta + 0.1 + i * 0.22, 0.2)} size={26} />
        ))}
      </Papel>
      <Abs x={90} y={1290} w={900} o={ent(t, m.hospital, 0.3)} style={{textAlign: 'center'}}>
        <span style={txt(40, 600, COR.claro)}>uma conta com tudo que usou</span>
      </Abs>
    </>
  );
};

// 7 · "O plano confere e recusa o que ele achou errado. Isso tem nome: glosa." (Bruno na tela)
const CenaGlosa: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.3);
  const lupaX = 160 + ((t - m.confere) * 380) % 300;
  const rec = ent(t, m.recusa, 0.3);
  const stamp = cl((t - m.glosa + 0.05) / 0.25);
  const def = ent(t, m.glosa + 0.15, 0.3);
  return (
    <>
      <Papel x={90} y={395} w={470} h={305} o={k} titulo="Conta · plano confere">
        {ITENS_CONTA.slice(0, 4).map((l, i) => (
          <Item key={l} l={l} size={28} ruim={i === 2 ? rec : 0} ok={i !== 2 && t > m.confere + 0.2 + i * 0.25 ? 1 : 0} />
        ))}
      </Papel>
      <Svg o={ent(t, m.confere - 0.2, 0.3) * (1 - rec)}>
        <circle cx={lupaX} cy={560} r={60} stroke={COR.cobalto} strokeWidth={10} fill="rgba(47,91,234,0.08)" />
        <line x1={lupaX + 42} y1={602} x2={lupaX + 90} y2={650} stroke={COR.cobalto} strokeWidth={16} strokeLinecap="round" />
      </Svg>
      {stamp > 0 ? <Carimbo x={600} y={420} w={390} t="GLOSA" p={stamp} size={92} /> : null}
      <Abs x={600} y={590} w={400} o={def} dy={(1 - def) * 14}>
        <div style={txt(30, 600, COR.branco, {lineHeight: 1.2})}>item que o plano</div>
        <div style={txt(30, 600, COR.ambar, {lineHeight: 1.2})}>se recusa a pagar</div>
      </Abs>
      {/* itens recusados caindo atrás dele */}
      {Array.from({length: 6}).map((_, i) => {
        const lado = i % 2;
        const nasc = m.recusa + i * 0.3;
        const y = 820 + (t - nasc) * 300;
        const o = ent(t, nasc, 0.2) * cl((1500 - y) / 120);
        return (
          <Abs key={i} x={lado ? 846 : 34} y={y} w={200} h={70} o={o} r={lado ? 6 : -6} style={{background: COR.claro, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', boxSizing: 'border-box'}}>
            <Xis size={34} />
            <div style={{flex: 1, height: 10, background: '#BDBDBD', borderRadius: 5}} />
          </Abs>
        );
      })}
    </>
  );
};

// 8 · "E a Rivio entra no meio." (Bruno fora) — a caixa Rivio desce entre Conta e Plano
const CenaMeio: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const y = 880;
  const entra = inOutCubic(cl((t - m.rivio + 0.2) / 0.45));
  const abre = 170 * entra;
  return (
    <>
      <Caixa x={40 - abre * 0.2} y={y} w={300} h={210} l="Conta" o={1} cor={COR.ambar} icone={<IcConta />} />
      <Caixa x={740 + abre * 0.2} y={y} w={300} h={210} l="Plano de saúde" o={1} cor={COR.petroleoClaro} icone={<IcEscudo />} size={32} />
      <Abs x={390} y={y - 420 + 420 * entra} w={300} h={210} o={entra} style={{background: COR.ambar, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, boxSizing: 'border-box'}}>
        <span style={txt(60, 600, COR.preto, {letterSpacing: '-0.02em'})}>Rivio</span>
        <span style={txt(24, 600, COR.preto)}>entra no meio</span>
      </Abs>
      <Seta x1={345} y1={y + 105} x2={380} y2={y + 105} p={entra} cor={COR.ambar} />
      <Seta x1={700} y1={y + 105} x2={735} y2={y + 105} p={entra} cor={COR.ambar} />
      <Abs x={90} y={400} w={900} o={ent(t, c.start, 0.3)}>
        <div style={txt(44, 400, COR.sec)}>E aí entra</div>
        <div style={txt(120, 600, COR.branco, {lineHeight: 1, marginTop: 8})}>a Rivio</div>
      </Abs>
      <Abs x={90} y={1290} w={900} o={ent(t, m.rivio + 0.3, 0.3)} style={{textAlign: 'center'}}>
        <span style={txt(36, 400, COR.sec)}>entre a conta e o plano</span>
      </Abs>
    </>
  );
};

// 9 · "Agentes de IA cruzam o prontuário com a conta e com o contrato com o plano antes de enviar." (Bruno fora)
const CenaAgentes: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const chip = pop(t, m.agentes - 0.1, 0.35);
  const docs = [
    {l: 'Prontuário', at: m.prontuario, x: 40, cor: COR.cobalto},
    {l: 'Conta', at: m.conta, x: 380, cor: COR.ambarEsc},
    {l: 'Contrato', at: m.contrato, x: 720, cor: COR.petroleo},
  ];
  const yd = 740;
  const hd = 330;
  const cruz = ent(t, m.cruzam, 0.4);
  const erro = t >= m.contrato + 0.5;
  const envia = inOutCubic(cl((t - m.enviar) / 0.6));
  const scan = (t * 1.6) % 1;
  return (
    <>
      <Abs x={90} y={400} w={900} o={cl(chip)} s={0.85 + 0.15 * cl(chip)} origin="left center" style={{display: 'flex', alignItems: 'center', gap: 22}}>
        <IcBot c={COR.ambar} s={110} />
        <div>
          <div style={txt(76, 600, COR.branco, {lineHeight: 1})}>Agentes de IA</div>
          <div style={txt(34, 400, COR.sec, {marginTop: 10})}>cruzando os papéis</div>
        </div>
      </Abs>
      {docs.map((d, i) => {
        const o = ent(t, d.at - 0.35, 0.3);
        return (
          <Papel key={d.l} x={d.x} y={yd} w={320} h={hd} o={o} dy={(1 - o) * 40} r={(i - 1) * 2} titulo={d.l} cor={d.cor}>
            {[0.85, 0.6, 0.75, 0.5, 0.7].map((w, j) => (
              <div key={j} style={{width: `${w * 100}%`, height: 12, borderRadius: 6, marginTop: 14, background: erro && i === 1 && j === 2 ? COR.ambar : '#BDBDBD'}} />
            ))}
            {/* varredura da IA */}
            {o > 0.9 ? <div style={{position: 'absolute', left: 0, right: 0, top: 70 + scan * (hd - 90), height: 6, background: COR.ambar, opacity: 0.7}} /> : null}
          </Papel>
        );
      })}
      {/* linhas cruzando prontuário × conta × contrato */}
      <Svg o={cruz}>
        <path d={`M 200 ${yd + hd + 10} C 300 ${yd + hd + 60} 440 ${yd + hd + 60} 540 ${yd + hd + 10}`} stroke={COR.ambar} strokeWidth={6} fill="none" strokeDasharray="16 10" strokeDashoffset={-t * 80} />
        {t > m.contrato ? <path d={`M 540 ${yd + hd + 10} C 640 ${yd + hd + 60} 780 ${yd + hd + 60} 880 ${yd + hd + 10}`} stroke={COR.ambar} strokeWidth={6} fill="none" strokeDasharray="16 10" strokeDashoffset={-t * 80} /> : null}
      </Svg>
      {erro ? (
        <Abs x={330} y={1260} w={420} h={80} o={cl(pop(t, m.contrato + 0.5, 0.3))} r={-3} style={{background: COR.ambar, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12}}>
          <span style={txt(36, 600, COR.preto)}>erro achado antes</span>
        </Abs>
      ) : null}
      {/* antes de enviar: envelope pronto, com check */}
      <Abs x={400} y={1360} w={280} h={100} o={ent(t, m.enviar - 0.2, 0.3)} dx={envia * 120} style={{background: COR.preto, border: `3px solid ${COR.petroleoClaro}`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, boxSizing: 'border-box'}}>
        <Check size={44} />
        <span style={txt(34, 600, COR.branco)}>enviar</span>
      </Abs>
    </>
  );
};

// 10 · "E se o plano recusa, a IA já escreve o recurso." (Bruno na tela)
const RECURSO = 'Solicitamos a revisão do item, conforme a cláusula do contrato...';
const CenaRecurso: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.3);
  const volta = ent(t, m.recusa - 0.1, 0.3);
  const doc = ent(t, m.ia - 0.2, 0.3);
  const n = Math.floor(cl((t - m.escreve + 0.1) / 1.0) * RECURSO.length);
  return (
    <>
      <Abs x={90} y={420} w={300} h={110} o={k} dx={-(1 - volta) * 0 + volta * 0} style={{background: COR.claro, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 12, padding: '0 18px', boxSizing: 'border-box', border: `4px solid ${COR.erro}`}}>
        <Xis size={44} />
        <div>
          <div style={txt(28, 600, COR.erro)}>Material</div>
          <div style={txt(22, 600, '#525252', {marginTop: 4})}>recusado</div>
        </div>
      </Abs>
      <Seta x1={400} y1={475} x2={470} y2={475} p={doc} cor={COR.ambar} w={7} />
      <Papel x={490} y={395} w={500} h={300} o={doc} dy={(1 - doc) * 30} titulo="Recurso" cor={COR.cobalto}>
        <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10}}>
          <IcBot c={COR.ambar} s={40} />
          <span style={txt(22, 600, '#525252')}>escrito pela IA</span>
        </div>
        <div style={txt(26, 400, '#2B2B2B', {lineHeight: 1.35})}>
          {RECURSO.slice(0, n)}
          {n < RECURSO.length && Math.floor(t * 5) % 2 === 0 ? <span style={{color: COR.ambar}}>|</span> : null}
        </div>
      </Papel>
      {/* teclas caindo atrás dele */}
      {Array.from({length: 8}).map((_, i) => {
        const lado = i % 2;
        const nasc = m.escreve - 0.4 + i * 0.18;
        const y = 820 + ((t - nasc) * 260) % 600;
        const o = ent(t, nasc, 0.2) * cl((1480 - y) / 100);
        return (
          <Abs key={i} x={lado ? 880 + rnd(i) * 60 : 50 + rnd(i) * 60} y={y} w={110} h={100} o={o * 0.9} style={card({display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `8px solid ${COR.borda}`})}>
            <span style={txt(44, 600, i % 3 === 0 ? COR.ambar : COR.claro)}>{'RECURSO'[i % 7]}</span>
          </Abs>
        );
      })}
    </>
  );
};

// 11 · "Enfermeiros e auditores revisam." (Bruno na tela)
const CenaAuditores: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.3);
  const rev = cl((t - m.revisam + 0.1) / 0.25);
  return (
    <>
      <Papel x={90} y={395} w={460} h={300} o={k} titulo="Recurso" cor={COR.cobalto}>
        {[0.9, 0.75, 0.85, 0.6].map((w, j) => (
          <div key={j} style={{width: `${w * 100}%`, height: 12, borderRadius: 6, marginTop: 16, background: '#BDBDBD'}} />
        ))}
      </Papel>
      {rev > 0 ? <Carimbo x={150} y={560} w={360} t="REVISADO" p={rev} cor={COR.petroleo} size={58} r={-6} /> : null}
      <Abs x={590} y={410} w={400} o={k} dx={(1 - k) * 30}>
        <div style={txt(28, 600, COR.sec, {letterSpacing: '0.08em'})}>QUEM REVISA</div>
        {['Enfermeiros', 'Auditores'].map((l, i) => {
          const o = ent(t, m.enfermeiros + i * 0.35, 0.3);
          return (
            <div key={l} style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: 18, opacity: o}}>
              <div style={{width: 70, height: 70, borderRadius: 35, background: COR.sup2, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <IcPessoa c={i ? COR.cobalto : COR.petroleoClaro} s={50} />
              </div>
              <span style={txt(46, 600, COR.branco)}>{l}</span>
            </div>
          );
        })}
      </Abs>
      {/* checks subindo atrás dele */}
      {Array.from({length: 6}).map((_, i) => {
        const lado = i % 2;
        const nasc = c.start + i * 0.25;
        const y = 1480 - (t - nasc) * 320;
        const o = ent(t, nasc, 0.2) * cl((y - 800) / 120);
        return (
          <Abs key={i} x={lado ? 900 : 90} y={y} w={90} h={90} o={o}>
            <Check size={84} />
          </Abs>
        );
      })}
    </>
  );
};

// 12 · "Mas o que me chamou a atenção é como ela cobra." (regancho + 3D)
const CenaCobra: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.3);
  const q = pop(t, m.cobra - 0.15, 0.35);
  return (
    <>
      <Abs x={90} y={410} w={900} o={k} dy={(1 - k) * 20}>
        <div style={txt(48, 400, COR.sec)}>O que me chamou atenção</div>
      </Abs>
      <Abs x={90} y={490} w={900} o={cl(q)} s={0.8 + 0.2 * cl(q)} origin="left center">
        <span style={{...txt(96, 600, COR.preto), background: COR.ambar, padding: '4px 24px', borderRadius: 4}}>como ela cobra</span>
      </Abs>
      {/* cifrões girando atrás dele */}
      {Array.from({length: 6}).map((_, i) => {
        const lado = i % 2;
        const y = 860 + Math.floor(i / 2) * 210 + Math.sin(t * 3 + i) * 16;
        const o = ent(t, c.start + 0.1 * i, 0.3);
        return (
          <Abs key={i} x={lado ? 860 : 60} y={y} w={160} h={160} o={o * 0.9} r={Math.sin(t * 2 + i) * 12} style={{borderRadius: 80, border: `6px solid ${i % 3 === 0 ? COR.ambar : COR.borda}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: COR.sup}}>
            <span style={txt(80, 600, i % 3 === 0 ? COR.ambar : COR.sec)}>$</span>
          </Abs>
        );
      })}
    </>
  );
};

// 13 · "Ela ganha pelo resultado que ela gera." (Bruno fora)
const CenaResultado: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.3);
  const res = ent(t, m.resultado - 0.15, 0.35);
  const barra = inOutCubic(cl((t - m.resultado + 0.1) / 0.9));
  return (
    <>
      <Abs x={90} y={400} w={900} o={k} dy={(1 - k) * 20}>
        <div style={txt(44, 400, COR.sec)}>Ela ganha</div>
        <div style={txt(110, 600, COR.ambar, {lineHeight: 1, marginTop: 8})}>pelo resultado</div>
      </Abs>
      {/* comparação: sem resultado = R$ 0 · com resultado = ganha */}
      <Abs x={60} y={760} w={450} h={320} o={ent(t, c.start + 0.2, 0.3)} style={card({padding: 26, textAlign: 'center'})}>
        <div style={txt(30, 600, COR.sec, {letterSpacing: '0.08em'})}>SEM RESULTADO</div>
        <div style={txt(130, 300, COR.cinza1, {lineHeight: 1, marginTop: 30})}>R$ 0</div>
      </Abs>
      <Abs x={570} y={760} w={450} h={320} o={res} s={1 + 0.04 * Math.max(0, 1 - (t - m.resultado) * 3)} style={card({padding: 26, textAlign: 'center', border: `4px solid ${COR.ambar}`})}>
        <div style={txt(30, 600, COR.ambar, {letterSpacing: '0.08em'})}>COM RESULTADO</div>
        <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 14, height: 170, marginTop: 30}}>
          {[0.35, 0.55, 0.8, 1].map((h, i) => (
            <div key={i} style={{width: 60, height: 170 * h * barra, background: i === 3 ? COR.ambar : COR.petroleo, borderRadius: '3px 3px 0 0'}} />
          ))}
        </div>
      </Abs>
      <Abs x={90} y={1280} w={900} o={ent(t, m.resultado + 0.3, 0.3)} style={{textAlign: 'center'}}>
        <span style={txt(36, 400, COR.sec)}>segundo a empresa</span>
      </Abs>
    </>
  );
};

// 14 · "E, segundo a empresa, se o recurso não passa, ela cobre a glosa do próprio bolso." (Bruno fora)
const CenaBolso: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.3);
  const seg = pop(t, m.segundo - 0.1, 0.3);
  const perdido = ent(t, m.recurso, 0.3);
  const cobre = ent(t, m.cobre - 0.1, 0.35);
  const moedas = [];
  for (let i = 0; i < 12; i++) {
    const nasc = m.cobre + i * 0.14;
    const p = cl((t - nasc) / 0.7);
    if (p <= 0 || p >= 1) continue;
    const x = 300 + (680 - 300) * p;
    const y = 1000 - 220 * Math.sin(p * Math.PI) + 0 * p;
    moedas.push(<div key={i} style={{position: 'absolute', left: x, top: y, width: 64, height: 64, borderRadius: 32, background: COR.ambar, border: `4px solid ${COR.ambarEsc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', ...txt(32, 600, COR.preto)}}>$</div>);
  }
  return (
    <>
      <Abs x={90} y={400} w={900} o={cl(seg)} s={0.85 + 0.15 * cl(seg)} origin="left center">
        <Tag t="segundo a empresa" size={34} bg={COR.sup2} fg={COR.claro} />
      </Abs>
      <Abs x={90} y={480} w={900} o={k} dy={(1 - k) * 20}>
        <div style={{position: 'relative', display: 'inline-block'}}>
          <span style={txt(64, 600, COR.branco)}>Recurso perdido?</span>
        </div>
        <div style={{...txt(84, 600, COR.ambar, {marginTop: 10}), opacity: cobre}}>Ela cobre</div>
      </Abs>
      {/* carteira da Rivio pagando a glosa ao hospital */}
      <Abs x={110} y={820} w={260} h={230} o={ent(t, c.start + 0.2, 0.3)} style={{background: COR.ambarEsc, border: `4px solid ${COR.ambar}`, borderRadius: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8}}>
        <span style={txt(48, 600, COR.branco)}>Rivio</span>
        <span style={txt(24, 600, COR.claro)}>do próprio bolso</span>
      </Abs>
      <Abs x={700} y={820} w={280} h={230} o={ent(t, m.recurso - 0.2, 0.3)} style={{background: COR.claro, borderRadius: 4, padding: 20, boxSizing: 'border-box', border: `4px solid ${perdido > 0.5 ? COR.erro : '#D4D4D4'}`}}>
        <div style={txt(26, 600, COR.erro, {letterSpacing: '0.08em'})}>GLOSA</div>
        <div style={txt(24, 600, '#525252', {marginTop: 10})}>recurso negado</div>
        <div style={{marginTop: 30, display: 'flex', alignItems: 'center', gap: 10}}>
          {t > m.bolso - 0.2 ? <Check size={44} /> : <Xis size={44} />}
          <span style={txt(28, 600, t > m.bolso - 0.2 ? COR.petroleo : COR.erro)}>{t > m.bolso - 0.2 ? 'coberta' : 'em aberto'}</span>
        </div>
      </Abs>
      {moedas}
      <Abs x={90} y={1280} w={900} o={ent(t, m.cobre, 0.3)} style={{textAlign: 'center'}}>
        <span style={txt(36, 600, COR.claro)}>do próprio bolso</span>
      </Abs>
    </>
  );
};

// 15 · selo da série: NEGÓCIO (aprovado pelo Bruno sem a fala) + "E aqui eu trago uma provocação pra você."
const CenaVeredito: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.25);
  const opcoes = ['HYPE', 'NEGÓCIO', 'CEDO PRA DIZER'];
  const marca = c.start + 0.15;
  const sel = cl((t - marca) / 0.25);
  const prov = ent(t, m.provocacao + 0.45, 0.3);
  return (
    <>
      <Abs x={90} y={395} w={900} o={k * (1 - prov)}>
        <div style={txt(30, 600, COR.sec, {letterSpacing: '0.1em'})}>VEREDITO</div>
        <div style={{display: 'flex', gap: 14, marginTop: 16}}>
          {opcoes.map((o, i) => {
            const on = i === 1 && sel > 0.5;
            return (
              <div key={o} style={{padding: '14px 22px', borderRadius: 4, border: `3px solid ${on ? COR.ambar : COR.borda}`, background: on ? COR.ambar : COR.sup, opacity: i === 1 ? 1 : 1 - 0.6 * sel, transform: `scale(${i === 1 ? 1 + 0.12 * sel : 1 - 0.05 * sel})`}}>
                <span style={txt(i === 2 ? 28 : 40, 600, on ? COR.preto : COR.sec, {whiteSpace: 'nowrap'})}>{o}</span>
              </div>
            );
          })}
        </div>
      </Abs>
      {sel > 0 && prov < 1 ? (
        <div style={{position: 'absolute', inset: 0, opacity: 1 - prov}}>
          <Carimbo x={230} y={520} w={620} t="NEGÓCIO" p={sel} cor={COR.ambar} size={110} r={-6} />
        </div>
      ) : null}
      <Abs x={90} y={410} w={900} o={prov} dy={(1 - prov) * 20}>
        <div style={txt(44, 400, COR.sec)}>E agora</div>
        <div style={txt(96, 600, COR.branco, {lineHeight: 1.05, marginTop: 8})}>uma provocação</div>
        <div style={txt(56, 600, COR.ambar, {marginTop: 10})}>pra você</div>
      </Abs>
    </>
  );
};

// 16 · "Qual parte chata do seu trabalho, do seu dia a dia, você acredita que a IA pode virar uma oportunidade de negócio?"
const TAREFAS = ['Conferir planilha', 'Responder e-mail', 'Relatório do mês', 'Conferir nota', 'Preencher cadastro', 'Cobrar cliente', 'Organizar arquivos', 'Revisar contrato'];
const CenaChata: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.3);
  const ia = ent(t, m.ia - 0.1, 0.3);
  const op = pop(t, m.oportunidade - 0.1, 0.35);
  return (
    <>
      <Abs x={90} y={400} w={900} o={k * (1 - ent(t, m.ia - 0.2, 0.3))} dy={(1 - k) * 20}>
        <div style={txt(44, 400, COR.sec)}>Qual parte</div>
        <div style={txt(110, 600, COR.branco, {lineHeight: 1, marginTop: 6})}>chata</div>
        <div style={txt(44, 400, COR.sec, {marginTop: 8})}>do seu dia a dia?</div>
      </Abs>
      <Abs x={90} y={400} w={900} o={ia}>
        <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
          <IcBot c={COR.ambar} s={96} />
          <span style={txt(64, 600, COR.branco)}>+ IA</span>
          <Seta x1={0} y1={0} x2={0} y2={0} p={0} />
        </div>
      </Abs>
      <Abs x={90} y={530} w={900} o={cl(op)} s={0.8 + 0.2 * cl(op)} origin="left center">
        <span style={{...txt(64, 600, COR.preto), background: COR.ambar, padding: '6px 22px', borderRadius: 4}}>oportunidade de negócio</span>
      </Abs>
      {/* tarefas chatas subindo atrás dele; depois da IA uma vira âmbar */}
      {TAREFAS.map((l, i) => {
        const lado = i % 2;
        const nasc = c.start + 0.1 + i * 0.45;
        const y = 1480 - ((t - nasc) * 120) % 700;
        const o = ent(t, nasc, 0.25) * cl((y - 800) / 120);
        const vira = i === 3 || i === 0 ? ent(t, m.ia + i * 0.1, 0.3) : 0;
        return (
          <Abs key={l} x={lado ? 836 : 24} y={y} w={220} o={o} style={card({padding: '14px 14px', borderLeft: `6px solid ${vira > 0.5 ? COR.ambar : COR.cinza1}`, background: vira > 0.5 ? COR.ambarEsc : COR.sup})}>
            <span style={txt(26, 600, COR.claro)}>{vira > 0.5 ? '$ ' : ''}{l}</span>
          </Abs>
        );
      })}
    </>
  );
};

// 17 · "Então me segue aqui se você quiser pensar em como a IA pode te ajudar a abrir o seu primeiro negócio."
const CenaSegue: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const btn = pop(t, m.segue - 0.2, 0.35);
  const click = m.segue + 0.45;
  const pressed = t >= click && t < click + 0.12;
  const seguindo = t >= click + 0.12;
  const sai = ent(t, m.abrir - 0.4, 0.3);
  const loja = ent(t, m.abrir - 0.2, 0.4);
  const placa = pop(t, m.negocio - 0.15, 0.35);
  const cur = ent(t, c.start + 0.05, 0.4);
  return (
    <>
      <Abs x={290} y={440} w={500} h={130} o={cl(btn) * (1 - sai)} s={(pressed ? 0.92 : 1) * (0.7 + 0.3 * cl(btn))} style={{background: seguindo ? COR.sup2 : COR.petroleo, border: seguindo ? `2px solid ${COR.borda}` : 'none', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, boxSizing: 'border-box'}}>
        {seguindo ? <Check size={44} bg={COR.petroleo} /> : null}
        <span style={txt(54, 600, COR.branco)}>{seguindo ? 'Seguindo' : 'Seguir'}</span>
      </Abs>
      {btn > 0 && sai < 1 ? (
        <Svg o={1 - sai}>
          <path transform={`translate(${900 - 300 * cur} ${700 - 160 * cur})`} d="M0 0 L0 46 L12 35 L21 55 L29 51 L20 32 L36 32 Z" fill={COR.branco} stroke={COR.preto} strokeWidth={3} />
        </Svg>
      ) : null}
      {/* o primeiro negócio: uma lojinha montando, no alto */}
      <Abs x={90} y={398} w={900} o={sai}>
        <div style={txt(30, 600, COR.sec, {letterSpacing: '0.08em'})}>COM IA, O SEU PRIMEIRO</div>
      </Abs>
      <Svg o={loja}>
        <g transform="translate(110 450)">
          <rect x={0} y={90} width={430} height={170} fill={COR.sup} stroke={COR.borda} strokeWidth={4} />
          {Array.from({length: 6}).map((_, i) => (
            <path key={i} d={`M ${i * 72} 90 L ${i * 72 + 36} 20 L ${i * 72 + 72} 90 Z`} fill={i % 2 ? COR.ambar : COR.claro} opacity={ent(t, m.abrir + i * 0.06, 0.2)} />
          ))}
          <rect x={60} y={150} width={110} height={110} fill={COR.sup2} />
          <rect x={220} y={140} width={170} height={70} fill={COR.sup2} stroke={COR.ambar} strokeWidth={3} />
        </g>
      </Svg>
      <Abs x={600} y={520} w={380} o={cl(placa)} s={1.3 - 0.3 * cl(placa)} r={-4} style={{background: COR.ambar, borderRadius: 4, padding: '12px 18px', boxSizing: 'border-box', textAlign: 'center'}}>
        <span style={txt(56, 600, COR.preto)}>negócio</span>
      </Abs>
      {/* +1 subindo atrás dele depois do clique */}
      {Array.from({length: 14}).map((_, i) => {
        const nasc = click + 0.1 + i * 0.12;
        if (t < nasc) return null;
        const lado = i % 2 === 0;
        const x = lado ? 40 + rnd(i) * 180 : 860 + rnd(i) * 160;
        const y = 1450 - (t - nasc) * 420;
        const o = cl((t - nasc) / 0.1) * cl((y - 780) / 150);
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, opacity: o, ...txt(30, 600, i % 3 ? COR.ambar : COR.petroleoClaro), background: COR.sup, border: `1px solid ${COR.borda}`, borderRadius: 999, padding: '6px 16px'}}>
            +1
          </div>
        );
      })}
    </>
  );
};

// 18 · "Falai, você pagaria uma IA se ela só te cobrasse no resultado?" + assinatura
const CenaFecho: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.3);
  const logo = ent(t, m.logo, 0.3);
  const bubbles = [
    {x: 24, y: 900, at: m.pagaria, txt: 'pagaria'},
    {x: 826, y: 980, at: m.pagaria + 0.3, txt: 'depende'},
    {x: 24, y: 1140, at: m.pagaria + 0.6, txt: 'só com resultado'},
    {x: 826, y: 1220, at: m.pagaria + 0.9, txt: 'não pagaria'},
  ];
  return (
    <>
      {bubbles.map((b, i) => {
        const o = pop(t, b.at, 0.35);
        return (
          <Abs key={i} x={b.x} y={b.y} w={230} o={cl(o)} s={0.7 + 0.3 * cl(o)} dy={(1 - cl(o)) * 30} origin={i % 2 ? 'right bottom' : 'left bottom'} style={{display: 'flex', gap: 10, alignItems: 'flex-start'}}>
            <div style={{width: 44, height: 44, borderRadius: 22, background: [COR.petroleo, COR.cobalto, COR.cinza1, COR.ambarEsc][i], flexShrink: 0}} />
            <div style={card({flex: 1, padding: '10px 14px'})}>
              <span style={txt(24, 600, COR.claro)}>{b.txt}</span>
            </div>
          </Abs>
        );
      })}
      <Abs x={90} y={398} w={900} o={k * (1 - logo)} dy={(1 - k) * 30}>
        <div style={txt(56, 600, COR.branco)}>Você pagaria uma IA</div>
        <div style={txt(56, 600, COR.ambar)}>que só cobra no resultado?</div>
      </Abs>
      <Abs x={60} y={380} w={300} h={300} o={logo}>
        <Sequence from={Math.round(m.logo * 30)} layout="none">
          <Video src={staticFile('brand/logo-anim.webm')} style={{width: 300, height: 300}} muted />
        </Sequence>
      </Abs>
      <Abs x={390} y={450} w={620} o={ent(t, m.logo + 0.25, 0.35)}>
        <Img src={staticFile('brand/falaibruno-branco.svg')} style={{width: 580}} />
      </Abs>
    </>
  );
};

const CENAS: Record<string, React.FC<{t: number; c: Cena}>> = {
  gancho: CenaGancho,
  chatbot: CenaChatbot,
  rivio: CenaRivio,
  linha: CenaLinha,
  funciona: CenaFunciona,
  conta: CenaConta,
  glosa: CenaGlosa,
  meio: CenaMeio,
  agentes: CenaAgentes,
  recurso: CenaRecurso,
  auditores: CenaAuditores,
  cobra: CenaCobra,
  resultado: CenaResultado,
  bolso: CenaBolso,
  veredito: CenaVeredito,
  chata: CenaChata,
  segue: CenaSegue,
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
         {md && (md.ate === undefined || t < md.ate) ? (
            <Img src={staticFile(md.src)} style={{position: 'absolute', left: md.x, top: md.y, width: md.size, height: md.size}} />
          ) : null}
        </Plano>
      </div>
    </AbsoluteFill>
  );
};
