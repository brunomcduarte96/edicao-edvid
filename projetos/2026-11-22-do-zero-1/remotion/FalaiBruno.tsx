/**
 * FalaiBruno v4 (Do Zero #1) — palco em camadas para o 9:16 com o Bruno recortado (chroma key).
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
// ======================= CENAS (camada ELEMENTOS) — Do Zero #1 =======================
// Zona A (acima da cabeça): y 390–690. Laterais atrás do Bruno: x 20–250 / 830–1060, y 800–1500.
// Fronteira: nenhum nome, @ ou conteúdo real dos criadores analisados; nada do trabalho.

/** janela de app estilizada (sem logo de terceiros: só o nome da ferramenta num selo) */
const Janela: React.FC<{x: number; y: number; w: number; h: number; o?: number; dy?: number; s?: number; nome: string; cor?: string; claro?: boolean; children?: React.ReactNode}> = ({x, y, w, h, o = 1, dy = 0, s = 1, nome, cor = COR.ambar, claro, children}) => (
  <Abs x={x} y={y} w={w} h={h} o={o} dy={dy} s={s} style={{background: claro ? COR.claro : COR.sup, border: `1px solid ${claro ? '#D4D4D4' : COR.borda}`, borderRadius: 8, overflow: 'hidden', boxSizing: 'border-box'}}>
    <div style={{height: 46, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', background: claro ? '#E5E5E5' : COR.sup2, borderBottom: `1px solid ${claro ? '#D4D4D4' : COR.borda}`}}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{width: 12, height: 12, borderRadius: 6, background: claro ? '#BDBDBD' : COR.cinza1}} />
      ))}
      <div style={{marginLeft: 12, background: cor, borderRadius: 3, padding: '3px 12px'}}>
        <span style={txt(20, 600, COR.preto, {letterSpacing: '0.04em'})}>{nome}</span>
      </div>
    </div>
    <div style={{position: 'relative', padding: 20}}>{children}</div>
  </Abs>
);

/** barra cinza que faz as vezes de texto (nada legível de terceiros) */
const Linha: React.FC<{w: number | string; cor?: string; h?: number; mt?: number}> = ({w, cor = COR.cinza1, h = 10, mt = 12}) => (
  <div style={{width: w, height: h, background: cor, borderRadius: h / 2, marginTop: mt}} />
);

/** miniatura de post anônima */
const Post: React.FC<{i: number; w: number; h: number; hl?: number}> = ({i, w, h, hl = 0}) => (
  <div style={{width: w, height: h, borderRadius: 4, background: hl > 0.5 ? COR.ambarEsc : COR.sup2, border: `1px solid ${hl > 0.5 ? COR.ambar : COR.borda}`, position: 'relative', overflow: 'hidden', boxSizing: 'border-box'}}>
    <div style={{position: 'absolute', left: '50%', top: '42%', width: 0, height: 0, transform: 'translate(-30%,-50%)', borderLeft: `${w * 0.16}px solid ${hl > 0.5 ? COR.ambar : COR.cinza1}`, borderTop: `${w * 0.1}px solid transparent`, borderBottom: `${w * 0.1}px solid transparent`}} />
    <div style={{position: 'absolute', left: 6, bottom: 8, width: w * (0.35 + 0.4 * rnd(i)), height: 4, background: COR.cinza1, borderRadius: 2}} />
  </div>
);

// 1 · gancho: "estudei mais de 2000 posts e mais de 50 criadores"
const CenaEstudo: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const roll = inOutCubic(cl((t - m.n2000 + 0.25) / 0.9));
  const kp = ent(t, m.n2000 - 0.1, 0.3);
  const kc = ent(t, m.n50 - 0.25, 0.3);
  const n50 = 50 * inOutCubic(cl((t - m.n50 + 0.15) / 0.6));
  // parede de posts atrás do Bruno, que vai acendendo
  const cols = 9;
  const rows = 9;
  const pw = 100;
  const ph = 130;
  const g = 14;
  const x0 = (1080 - (cols * pw + (cols - 1) * g)) / 2;
  const y0 = 760;
  const wall = [];
  for (let i = 0; i < cols * rows; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const ap = ent(t, 0.1 + row * 0.08 + rnd(i) * 0.4, 0.3);
    const lido = t > m.n2000 - 0.3 + (row * cols + col) * 0.012;
    wall.push(
      <div key={i} style={{position: 'absolute', left: x0 + col * (pw + g), top: y0 + row * (ph + g), opacity: ap * 0.95}}>
        <Post i={i} w={pw} h={ph} hl={lido && rnd(i + 4) < 0.35 ? 1 : 0} />
      </div>,
    );
  }
  // criadores anônimos: círculos sem nome
  const avatares = [];
  for (let i = 0; i < 10; i++) {
    const o = pop(t, m.n50 - 0.1 + i * 0.05, 0.3);
    avatares.push(<div key={i} style={{width: 46, height: 46, borderRadius: 23, background: [COR.petroleo, COR.cobalto, COR.cinza1, COR.ambarEsc, COR.petroleoClaro][i % 5], opacity: cl(o), transform: `scale(${Math.max(0.01, cl(o))})`, border: `3px solid ${COR.fundo}`, marginLeft: i ? -12 : 0}} />);
  }
  return (
    <>
      {wall}
      <Abs x={90} y={400} w={560} o={kp} dy={(1 - kp) * 20}>
        <div style={txt(140, 300, COR.ambar, {lineHeight: 1, fontVariantNumeric: 'tabular-nums'})}>+{fmt(2000 * roll)}</div>
        <div style={txt(40, 600, COR.branco, {marginTop: 6})}>posts estudados</div>
      </Abs>
      <Abs x={660} y={410} w={360} o={kc} dy={(1 - kc) * 20}>
        <div style={txt(96, 300, COR.branco, {lineHeight: 1, fontVariantNumeric: 'tabular-nums'})}>+{Math.round(n50)}</div>
        <div style={txt(32, 600, COR.branco, {marginTop: 6})}>criadores</div>
        <div style={{display: 'flex', marginTop: 14}}>{avatares}</div>
      </Abs>
    </>
  );
};

// 2 · "quem fez a análise foi a IA, junto comigo"
const CenaAnalise: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.35);
  const pedido = 'Compare cada post com a média do perfil';
  const nCh = Math.floor(cl((t - c.start - 0.15) / 0.9) * pedido.length);
  const resp = ent(t, m.ia - 0.1, 0.4);
  const eu = pop(t, m.comigo, 0.3);
  // linhas de dados correndo atrás do Bruno
  const rows = [];
  for (let i = 0; i < 16; i++) {
    const lado = i % 2;
    const y = 820 + Math.floor(i / 2) * 82 - ((t - c.start) * 40) % 82;
    const o = ent(t, c.start + 0.05 * i, 0.3) * cl((y - 800) / 40);
    rows.push(
      <Abs key={i} x={lado ? 836 : 24} y={y} w={220} h={64} o={o * 0.9} style={card({display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px'})}>
        <div style={{width: 34, height: 34, borderRadius: 17, background: COR.sup2}} />
        <div style={{flex: 1}}>
          <Linha w="80%" mt={0} />
          <div style={{display: 'flex', alignItems: 'center', gap: 8, marginTop: 8}}>
            <div style={{width: `${30 + 60 * rnd(i)}%`, height: 8, background: rnd(i + 2) > 0.6 ? COR.ambar : COR.petroleo, borderRadius: 4}} />
          </div>
        </div>
      </Abs>,
    );
  }
  return (
    <>
      {rows}
      <Janela x={90} y={398} w={900} h={290} o={k} dy={(1 - k) * 40} nome="Claude">
        <div style={{display: 'flex', justifyContent: 'flex-end'}}>
          <div style={{background: COR.sup2, borderRadius: 6, padding: '12px 18px', maxWidth: 680}}>
            <span style={txt(28, 400, COR.claro)}>
              {pedido.slice(0, nCh)}
              {nCh < pedido.length && Math.floor(t * 4) % 2 === 0 ? '|' : ''}
            </span>
          </div>
        </div>
        <div style={{display: 'flex', gap: 14, marginTop: 18, opacity: resp}}>
          <div style={{width: 40, height: 40, borderRadius: 6, background: COR.ambar, flexShrink: 0}} />
          <div style={{flex: 1}}>
            <Linha w={`${90 * resp}%`} cor={COR.sec} mt={6} />
            <Linha w={`${70 * resp}%`} cor={COR.cinza1} />
            <Linha w={`${80 * resp}%`} cor={COR.cinza1} />
          </div>
        </div>
      </Janela>
      <Abs x={720} y={600} w={280} o={cl(eu)} s={0.7 + 0.3 * cl(eu)} style={{background: COR.preto, border: `3px solid ${COR.ambar}`, borderRadius: 4, padding: '8px 16px', boxSizing: 'border-box', textAlign: 'center'}}>
        <span style={txt(34, 600, COR.ambar)}>IA + eu</span>
      </Abs>
    </>
  );
};

// 3 · "puxei todos os posts que foram bem / acima da média daquele perfil"
const CenaMedia: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const base = 1480;
  const linhaY = 1160;
  const linha = ent(t, m.media - 0.2, 0.5);
  const acima = t >= m.acima - 0.1;
  const N = 16;
  const bw = 52;
  const gap = 14;
  const x0 = (1080 - (N * bw + (N - 1) * gap)) / 2;
  const bars = [];
  for (let i = 0; i < N; i++) {
    const alto = [2, 5, 9, 13].includes(i);
    const hgt = alto ? 520 + rnd(i) * 220 : 140 + rnd(i) * 200;
    const g = inOutCubic(cl((t - c.start - 0.05 * i) / 0.6));
    const on = acima && alto ? ent(t, m.acima + 0.08 * [2, 5, 9, 13].indexOf(i), 0.25) : 0;
    bars.push(<div key={i} style={{position: 'absolute', left: x0 + i * (bw + gap), top: base - hgt * g, width: bw, height: hgt * g, background: on > 0.5 ? COR.ambar : COR.sup2, border: `1px solid ${on > 0.5 ? COR.ambar : COR.borda}`, borderRadius: '3px 3px 0 0', boxSizing: 'border-box'}} />);
  }
  const k = ent(t, c.start, 0.35);
  const k2 = ent(t, m.acima, 0.35);
  return (
    <>
      {bars}
      <Svg o={linha}>
        <line x1={20} y1={linhaY} x2={20 + 1040 * linha} y2={linhaY} stroke={COR.branco} strokeWidth={4} strokeDasharray="14 10" />
      </Svg>
      <Abs x={830} y={linhaY + 14} w={230} o={linha}>
        <div style={txt(24, 600, COR.claro, {textAlign: 'right'})}>média do perfil</div>
      </Abs>
      <Abs x={90} y={410} w={900} o={k} dy={(1 - k) * 20}>
        <div style={txt(64, 600, COR.branco)}>Os posts que foram bem</div>
      </Abs>
      <Abs x={90} y={500} w={900} o={k2} dy={(1 - k2) * 20}>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: 18, background: COR.ambar, borderRadius: 4, padding: '10px 24px'}}>
          <svg width={40} height={40} viewBox="0 0 40 40"><path d="M20 4 L36 24 L26 24 L26 36 L14 36 L14 24 L4 24 Z" fill={COR.preto} /></svg>
          <span style={txt(52, 600, COR.preto)}>acima da média</span>
        </div>
        <div style={txt(30, 400, COR.sec, {marginTop: 14})}>de cada perfil, não do Instagram todo</div>
      </Abs>
    </>
  );
};

// 4 · "analisei cada detalhe: gancho, headline, CTA"
const CenaDetalhes: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.4);
  const partes = [
    {l: 'Gancho', at: m.gancho, y: 0},
    {l: 'Headline', at: m.headline, y: 1},
    {l: 'CTA', at: m.cta, y: 2},
  ];
  const lx = 540 + 300 * Math.cos(t * 2.6);
  const ly = 1120 + 160 * Math.sin(t * 2.6);
  return (
    <>
      {/* post grande no centro (o Bruno sai do quadro nesta cena) */}
      <Abs x={290} y={800} w={500} h={660} o={ent(t, c.start + 0.1, 0.4)} style={card({padding: 26})}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
          <div style={{width: 56, height: 56, borderRadius: 28, background: COR.sup2}} />
          <Linha w={200} mt={0} h={14} />
        </div>
        <div style={{marginTop: 22, height: 330, background: COR.sup2, borderRadius: 6, position: 'relative'}}>
          <div style={{position: 'absolute', left: 24, top: 28, right: 24, height: 40, background: ent(t, m.gancho, 0.2) > 0.5 ? COR.ambar : COR.cinza1, borderRadius: 4}} />
          <div style={{position: 'absolute', left: 24, top: 90, width: '62%', height: 24, background: ent(t, m.headline, 0.2) > 0.5 ? COR.ambar : COR.borda, borderRadius: 4}} />
          <div style={{position: 'absolute', left: '50%', top: '62%', transform: 'translate(-30%,-50%)', borderLeft: `56px solid ${COR.cinza1}`, borderTop: '34px solid transparent', borderBottom: '34px solid transparent'}} />
        </div>
        <Linha w="85%" h={14} mt={24} />
        <Linha w="60%" h={14} cor={COR.borda} />
        <div style={{marginTop: 26, height: 64, width: 260, borderRadius: 4, background: ent(t, m.cta, 0.2) > 0.5 ? COR.ambar : COR.sup2, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <span style={txt(28, 600, ent(t, m.cta, 0.2) > 0.5 ? COR.preto : COR.sec)}>Me segue</span>
        </div>
      </Abs>
      {/* lupa passeando por cima do post */}
      <Svg o={ent(t, m.detalhe - 0.3, 0.4)}>
        <circle cx={lx} cy={ly} r={140} stroke={COR.claro} strokeWidth={14} fill="rgba(232,163,61,0.08)" />
        <line x1={lx + 99} y1={ly + 99} x2={lx + 215} y2={ly + 215} stroke={COR.claro} strokeWidth={26} strokeLinecap="round" />
      </Svg>
      {/* post anônimo dissecado */}
      <Abs x={90} y={398} w={330} h={290} o={k} dy={(1 - k) * 40} style={card({padding: 18})}>
        <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <div style={{width: 34, height: 34, borderRadius: 17, background: COR.sup2}} />
          <Linha w={140} mt={0} />
        </div>
        <div style={{marginTop: 14, height: 140, background: COR.sup2, borderRadius: 4, position: 'relative'}}>
          <div style={{position: 'absolute', left: 14, top: 14, right: 14, height: 18, background: ent(t, m.gancho, 0.2) > 0.5 ? COR.ambar : COR.cinza1, borderRadius: 3}} />
          <div style={{position: 'absolute', left: 14, top: 44, width: '60%', height: 12, background: ent(t, m.headline, 0.2) > 0.5 ? COR.ambar : COR.borda, borderRadius: 3}} />
        </div>
        <div style={{marginTop: 14, height: 30, width: 150, borderRadius: 3, background: ent(t, m.cta, 0.2) > 0.5 ? COR.ambar : COR.sup2}} />
      </Abs>
      {partes.map((p, i) => {
        const o = pop(t, p.at - 0.05, 0.3);
        return (
          <Abs key={i} x={470} y={404 + p.y * 96} w={520} h={80} o={cl(o)} dx={(1 - cl(o)) * 40} style={{display: 'flex', alignItems: 'center', gap: 16}}>
            <Seta x1={0} y1={0} x2={0} y2={0} p={0} />
            <div style={{width: 60, height: 4, background: COR.ambar}} />
            <div style={{background: COR.ambar, borderRadius: 3, padding: '8px 22px'}}>
              <span style={txt(46, 600, COR.preto)}>{p.l}</span>
            </div>
          </Abs>
        );
      })}
    </>
  );
};

// 5 · "e dali eu tirei vários insights"
const CenaInsights: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = pop(t, c.start, 0.35);
  const cards = ['Número na 1ª frase', 'Gancho curto', 'Sem efeito', 'Uma ideia só', 'CTA simples', 'Fala direto'];
  return (
    <>
      {cards.map((l, i) => {
        const nasc = m.insights - 0.7 + i * 0.22;
        const lado = i % 2 === 0;
        const y = 1450 - (t - nasc) * 330;
        const o = ent(t, nasc, 0.2) * cl((y - 760) / 120);
        return (
          <Abs key={i} x={lado ? 24 : 836} y={y} w={220} o={o} style={card({padding: '12px 14px', borderLeft: `6px solid ${i % 3 === 0 ? COR.ambar : COR.petroleoClaro}`})}>
            <span style={txt(24, 600, COR.claro)}>{l}</span>
          </Abs>
        );
      })}
      <Abs x={0} y={410} w={1080} o={cl(k)} s={0.85 + 0.15 * cl(k)} style={{textAlign: 'center'}}>
        {/* lâmpada */}
        <svg width={150} height={190} viewBox="0 0 150 190" style={{display: 'block', margin: '0 auto'}}>
          <path d="M75 10 A58 58 0 0 1 108 116 L104 140 L46 140 L42 116 A58 58 0 0 1 75 10 Z" fill={COR.ambar} />
          <rect x={48} y={148} width={54} height={12} fill={COR.claro} />
          <rect x={54} y={166} width={42} height={12} fill={COR.claro} />
          {[0, 1, 2, 3, 4].map((i) => {
            const a = (-150 + i * 30) * (Math.PI / 180);
            const p = 0.6 + 0.4 * Math.sin(t * 8 + i);
            return <line key={i} x1={75 + Math.cos(a) * 72} y1={68 + Math.sin(a) * 72} x2={75 + Math.cos(a) * (72 + 16 * p)} y2={68 + Math.sin(a) * (72 + 16 * p)} stroke={COR.ambar} strokeWidth={6} strokeLinecap="round" />;
          })}
        </svg>
        <div style={txt(48, 600, COR.branco, {marginTop: 10})}>vários insights</div>
      </Abs>
    </>
  );
};

// 6 · "tem post que fez mais de 140 vezes a média ... sem efeito nenhum" (regancho)
const Cena140: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const roll = inOutCubic(cl((t - m.n140 + 0.3) / 0.8));
  const big = ent(t, m.n140 - 0.3, 0.4);
  const media = ent(t, m.media - 0.1, 0.4);
  const sem = pop(t, m.sem - 0.05, 0.3);
  const risca = ent(t, m.nenhum, 0.3);
  // barra da média (minúscula) × barra do post (sobe atrás da cabeça)
  const base = 1500;
  const hPost = 760 * roll;
  return (
    <>
      <Abs x={20} y={base} w={1040} h={3} o={big} style={{background: COR.borda}} />
      <div style={{position: 'absolute', left: 60, top: base - 6 * media, width: 150, height: 6 * media, background: COR.cinza1}} />
      <Abs x={30} y={base + 14} w={220} o={media}>
        <div style={txt(24, 600, COR.sec)}>média do perfil</div>
      </Abs>
      <div style={{position: 'absolute', left: 400, top: base - hPost, width: 280, height: hPost, background: COR.ambar, borderRadius: '4px 4px 0 0', opacity: 0.9}} />
      <Abs x={90} y={390} w={900} o={big} s={0.85 + 0.15 * big} origin="left top">
        <div style={txt(220, 300, COR.ambar, {lineHeight: 1, fontVariantNumeric: 'tabular-nums'})}>{Math.round(140 * roll)}x</div>
      </Abs>
      <Abs x={96} y={620} w={600} o={media}>
        <div style={txt(34, 600, COR.branco)}>a média daquele perfil</div>
      </Abs>
      {/* selo: sem efeito nenhum */}
      <Abs x={650} y={430} w={350} h={190} o={cl(sem)} s={1.4 - 0.4 * cl(sem)} r={-5} style={{background: COR.preto, border: `4px solid ${COR.ambar}`, borderRadius: 6, padding: '18px 20px', boxSizing: 'border-box'}}>
        <div style={{position: 'relative', display: 'inline-block'}}>
          <span style={txt(34, 600, COR.sec)}>efeitos, transições</span>
          <div style={{position: 'absolute', left: -4, top: '50%', width: `${(100 + 4) * risca}%`, height: 6, background: COR.erro}} />
        </div>
        <div style={txt(46, 600, COR.ambar, {marginTop: 14})}>sem efeito nenhum</div>
      </Abs>
    </>
  );
};

// 7 · "um dos melhores ganchos: número grande na primeira frase"
const CenaGanchoNum: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.4);
  const num = pop(t, m.numero - 0.05, 0.35);
  const pri = ent(t, m.primeira, 0.35);
  const rank = [
    {l: 'Número na 1ª frase', hl: true},
    {l: 'Pergunta direta', hl: false},
    {l: 'Lista', hl: false},
  ];
  return (
    <>
      {/* celular com o post: a 1ª frase destacada */}
      <Abs x={90} y={398} w={300} h={300} o={k} dy={(1 - k) * 40} style={{background: COR.preto, border: `6px solid ${COR.borda}`, borderRadius: 28, padding: 18, boxSizing: 'border-box'}}>
        <div style={{height: 150, background: COR.sup2, borderRadius: 10, position: 'relative', overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 14, top: 18, display: 'flex', alignItems: 'baseline', gap: 8}}>
            <span style={{...txt(64, 600, COR.ambar, {lineHeight: 1}), opacity: cl(num), display: 'inline-block', transform: `scale(${0.6 + 0.4 * cl(num)})`, transformOrigin: 'left bottom'}}>2.000</span>
          </div>
          <div style={{position: 'absolute', left: 14, top: 96, width: 200 * pri, height: 12, background: COR.cinza1, borderRadius: 6}} />
          <div style={{position: 'absolute', left: 14, top: 118, width: 140 * pri, height: 12, background: COR.borda, borderRadius: 6}} />
        </div>
        <Linha w="80%" />
        <Linha w="50%" cor={COR.borda} />
      </Abs>
      <Abs x={430} y={398} w={570} o={k}>
        <div style={txt(30, 600, COR.sec, {letterSpacing: '0.08em'})}>GANCHOS QUE MAIS RENDERAM</div>
      </Abs>
      {rank.map((r, i) => {
        const o = ent(t, (i === 0 ? m.numero : c.start + 0.3) + i * 0.15, 0.3);
        return (
          <Abs key={i} x={430} y={450 + i * 82} w={570} h={68} o={o} dx={(1 - o) * 30} style={{display: 'flex', alignItems: 'center', gap: 14, background: r.hl ? COR.ambar : COR.sup, border: `1px solid ${r.hl ? COR.ambar : COR.borda}`, borderRadius: 4, padding: '0 18px', boxSizing: 'border-box'}}>
            <span style={txt(32, 600, r.hl ? COR.preto : COR.sec)}>{i + 1}º</span>
            <span style={txt(32, 600, r.hl ? COR.preto : COR.claro)}>{r.l}</span>
          </Abs>
        );
      })}
      {/* números flutuando atrás do Bruno */}
      {['2.000', '140x', '50', '7,6x', '1º', '100%'].map((n, i) => {
        const lado = i % 2 === 0;
        const y = 860 + (i >> 1) * 200 + Math.sin(t * 2 + i) * 14;
        const o = ent(t, m.numero + 0.1 * i, 0.3);
        return (
          <Abs key={n} x={lado ? 40 : 860} y={y} w={200} o={o * 0.85}>
            <div style={txt(64, 300, i % 3 === 0 ? COR.ambar : COR.cinza1, {lineHeight: 1})}>{n}</div>
          </Abs>
        );
      })}
    </>
  );
};

// 8 · "montei uma estrutura no Notion bem simples"
const COLS_NOTION = ['Ideias', 'Roteiro', 'Produção'];
const CenaNotion: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, m.notion - 0.5, 0.4);
  const simples = pop(t, m.simples, 0.3);
  return (
    <>
      <Janela x={90} y={398} w={900} h={300} o={k} dy={(1 - k) * 40} nome="Notion" cor={COR.claro} claro>
        <div style={txt(34, 600, COR.preto)}>Conteúdo FalaiBruno</div>
        <div style={{display: 'flex', gap: 16, marginTop: 16}}>
          {COLS_NOTION.map((col, i) => (
            <div key={col} style={{flex: 1, opacity: ent(t, m.notion + 0.15 * i, 0.3)}}>
              <div style={{display: 'inline-block', background: [COR.cobalto, COR.ambar, COR.petroleo][i], borderRadius: 3, padding: '3px 10px'}}>
                <span style={txt(20, 600, i === 1 ? COR.preto : COR.branco)}>{col}</span>
              </div>
              {[0, 1].map((j) => (
                <div key={j} style={{marginTop: 10, height: 44, background: '#FFFFFF', border: '1px solid #D4D4D4', borderRadius: 4, padding: '0 10px', display: 'flex', alignItems: 'center', opacity: ent(t, m.notion + 0.3 + 0.15 * i + 0.1 * j, 0.3)}}>
                  <div style={{width: `${50 + 40 * rnd(i * 3 + j)}%`, height: 8, background: '#BDBDBD', borderRadius: 4}} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </Janela>
      <Abs x={700} y={640} w={300} o={cl(simples)} s={1.3 - 0.3 * cl(simples)} r={-4} style={{background: COR.ambar, borderRadius: 3, padding: '8px 16px', boxSizing: 'border-box', textAlign: 'center'}}>
        <span style={txt(36, 600, COR.preto)}>bem simples</span>
      </Abs>
      {/* blocos da estrutura se montando atrás do Bruno */}
      {Array.from({length: 12}).map((_, i) => {
        const lado = i % 2;
        const row = Math.floor(i / 2);
        const a = m.estrutura + row * 0.12 + lado * 0.05;
        const o = ent(t, a, 0.3);
        return <Abs key={i} x={lado ? 836 : 24} y={1430 - row * 104 - (1 - o) * 60} w={220} h={88} o={o} style={card({borderLeft: `8px solid ${[COR.cobalto, COR.ambar, COR.petroleo][row % 3]}`})} />;
      })}
    </>
  );
};

// 9 · "a ideia entra, vira roteiro e vai para a produção"
const CenaFluxo: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const nodes = [
    {l: 'Ideia', at: m.ideia, cor: COR.cobalto},
    {l: 'Roteiro', at: m.roteiro, cor: COR.ambar},
    {l: 'Produção', at: m.producao, cor: COR.petroleo},
  ];
  const W = 270;
  const xs = [60, 405, 750];
  const y = 470;
  // card viajando entre as etapas
  let px = xs[0];
  if (t >= m.roteiro - 0.3) px = xs[0] + (xs[1] - xs[0]) * inOutCubic(cl((t - m.roteiro + 0.3) / 0.35));
  if (t >= m.producao - 0.3) px = xs[1] + (xs[2] - xs[1]) * inOutCubic(cl((t - m.producao + 0.3) / 0.35));
  const cardIn = ent(t, m.ideia - 0.1, 0.3);
  return (
    <>
      {nodes.map((n, i) => {
        const o = pop(t, i === 0 ? c.start : n.at - 0.35, 0.3);
        const on = t >= n.at - 0.05;
        return (
          <Abs key={i} x={xs[i]} y={y} w={W} h={150} o={cl(o)} s={0.8 + 0.2 * cl(o)} style={{border: `4px solid ${on ? n.cor : COR.borda}`, borderRadius: 8, background: COR.preto, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 14, boxSizing: 'border-box'}}>
            <span style={txt(40, 600, on ? COR.branco : COR.sec)}>{n.l}</span>
          </Abs>
        );
      })}
      <Seta x1={xs[0] + W + 6} y1={y + 75} x2={xs[1] - 10} y2={y + 75} p={ent(t, m.roteiro - 0.4, 0.3)} cor={COR.ambar} />
      <Seta x1={xs[1] + W + 6} y1={y + 75} x2={xs[2] - 10} y2={y + 75} p={ent(t, m.producao - 0.4, 0.3)} cor={COR.ambar} />
      <Abs x={px + 55} y={y + 18} w={160} h={66} o={cardIn} style={{background: COR.claro, borderRadius: 4, padding: '10px 12px', boxSizing: 'border-box'}}>
        <div style={{width: '80%', height: 10, background: COR.cinza1, borderRadius: 5}} />
        <div style={{width: '55%', height: 10, background: '#BDBDBD', borderRadius: 5, marginTop: 10}} />
      </Abs>
      <Abs x={90} y={398} w={900} o={ent(t, c.start, 0.3)}>
        <div style={txt(30, 600, COR.sec, {letterSpacing: '0.08em'})}>O FLUXO</div>
      </Abs>
      {/* etapas grandes na esteira (o Bruno sai do quadro nesta cena) */}
      {nodes.map((n, i) => {
        const on = ent(t, n.at - 0.05, 0.25);
        return (
          <Abs key={`g${i}`} x={[30, 390, 750][i]} y={1300} w={300} h={200} o={ent(t, c.start + 0.15 * i, 0.3)} s={1 + 0.06 * on} style={{background: on > 0.5 ? n.cor : COR.sup, border: `3px solid ${on > 0.5 ? n.cor : COR.borda}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box'}}>
            <span style={txt(48, 600, on > 0.5 && i === 1 ? COR.preto : COR.branco)}>{n.l}</span>
          </Abs>
        );
      })}
      {/* esteira atrás do Bruno */}
      <Svg o={ent(t, c.start, 0.4) * 0.8}>
        <path d="M -20 1250 C 300 1180 780 1180 1100 1250" stroke={COR.borda} strokeWidth={60} fill="none" />
        <path d="M -20 1250 C 300 1180 780 1180 1100 1250" stroke={COR.ambar} strokeWidth={6} fill="none" strokeDasharray="30 30" strokeDashoffset={-t * 120} />
      </Svg>
    </>
  );
};

// 10 · "a ideia me vem pelo Claude Code e pelo Grok, em rotinas diárias"
const CenaFontes: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const cc = pop(t, m.claudecode - 0.1, 0.35);
  const gk = pop(t, m.grok - 0.1, 0.35);
  // v3 (pedido do Bruno): Claude Code e Grok com setas para um banco de ideias; depois a tela vira as rotinas
  const troca = ent(t, m.rotinas - 0.35, 0.35);
  const A = 1 - troca;
  const db = pop(t, c.start + 0.15, 0.4);
  const s1 = ent(t, m.claudecode + 0.2, 0.45);
  const s2 = ent(t, m.grok + 0.1, 0.45);
  const fluxo = (t * 1.4) % 1;
  const dbx = 540;
  const dby = 840;
  const ponto = (x1: number, y1: number, x2: number, y2: number, k: number, ph: number) => {
    if (k < 1) return null;
    const p = (fluxo + ph) % 1;
    return <rect x={x1 + (x2 - x1) * p - 9} y={y1 + (y2 - y1) * p - 9} width={18} height={18} fill={COR.ambar} />;
  };
  // relógio das rotinas
  const R = 360;
  const cx = 540;
  const cy = 1140;
  const ang1 = (t - c.start) * 600;
  return (
    <>
      {/* fase A: fontes → banco de ideias */}
      <div style={{position: 'absolute', inset: 0, opacity: A}}>
        <Abs x={60} y={420} w={440} h={170} o={cl(cc)} s={0.7 + 0.3 * cl(cc)} style={card({padding: 22, borderTop: `6px solid ${COR.ambar}`})}>
          <div style={txt(22, 600, COR.sec, {letterSpacing: '0.08em'})}>IDEIAS VÊM DO</div>
          <div style={txt(56, 600, COR.branco, {marginTop: 8})}>Claude Code</div>
        </Abs>
        <Abs x={580} y={420} w={440} h={170} o={cl(gk)} s={0.7 + 0.3 * cl(gk)} style={card({padding: 22, borderTop: `6px solid ${COR.cobalto}`})}>
          <div style={txt(22, 600, COR.sec, {letterSpacing: '0.08em'})}>E DO</div>
          <div style={txt(56, 600, COR.branco, {marginTop: 8})}>Grok</div>
        </Abs>
        <Seta x1={280} y1={600} x2={470} y2={760} p={s1} cor={COR.ambar} w={7} />
        <Seta x1={800} y1={600} x2={610} y2={760} p={s2} cor={COR.cobalto} w={7} />
        <Svg>
          {ponto(280, 600, 470, 760, s1, 0)}
          {ponto(800, 600, 610, 760, s2, 0.5)}
        </Svg>
        {/* banco de ideias (cilindro) */}
        <Svg o={cl(db)}>
          <g transform={`translate(${dbx} ${dby}) scale(${0.7 + 0.3 * cl(db)}) translate(${-dbx} ${-dby})`}>
            <path d={`M ${dbx - 220} ${dby - 80} L ${dbx - 220} ${dby + 190} A 220 60 0 0 0 ${dbx + 220} ${dby + 190} L ${dbx + 220} ${dby - 80}`} fill={COR.sup} stroke={COR.borda} strokeWidth={5} />
            {[30, 110].map((dy) => (
              <path key={dy} d={`M ${dbx - 220} ${dby + dy} A 220 60 0 0 0 ${dbx + 220} ${dby + dy}`} fill="none" stroke={COR.borda} strokeWidth={4} />
            ))}
            <ellipse cx={dbx} cy={dby - 80} rx={220} ry={60} fill={COR.sup2} stroke={COR.ambar} strokeWidth={6} />
          </g>
        </Svg>
        <Abs x={dbx - 220} y={dby - 10} w={440} o={cl(db)} style={{textAlign: 'center'}}>
          <div style={txt(48, 600, COR.branco)}>Banco de ideias</div>
          <div style={txt(28, 400, COR.sec, {marginTop: 10})}>no Notion</div>
        </Abs>
      </div>
      {/* fase B: rotinas diárias */}
      <div style={{position: 'absolute', inset: 0, opacity: troca}}>
        <Svg o={0.9}>
          <circle cx={cx} cy={cy} r={R} fill="none" stroke={COR.borda} strokeWidth={6} />
          {Array.from({length: 12}).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <line key={i} x1={cx + Math.cos(a) * (R - 34)} y1={cy + Math.sin(a) * (R - 34)} x2={cx + Math.cos(a) * (R - 6)} y2={cy + Math.sin(a) * (R - 6)} stroke={COR.cinza1} strokeWidth={8} />;
          })}
          <line x1={cx} y1={cy} x2={cx + Math.cos(((ang1 - 90) * Math.PI) / 180) * (R - 60)} y2={cy + Math.sin(((ang1 - 90) * Math.PI) / 180) * (R - 60)} stroke={COR.ambar} strokeWidth={10} strokeLinecap="round" />
          <circle cx={cx} cy={cy} r={14} fill={COR.ambar} />
        </Svg>
        <Abs x={90} y={400} w={900} dy={(1 - troca) * 20}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 18, background: COR.preto, border: `3px solid ${COR.petroleoClaro}`, borderRadius: 4, padding: '14px 26px'}}>
            <svg width={52} height={52} viewBox="0 0 36 36">
              <circle cx={18} cy={18} r={15} fill="none" stroke={COR.petroleoClaro} strokeWidth={4} />
              <path d="M18 9 L18 18 L25 22" stroke={COR.petroleoClaro} strokeWidth={4} fill="none" />
            </svg>
            <span style={txt(60, 600, COR.branco)}>rotinas diárias</span>
          </div>
        </Abs>
        <Abs x={90} y={540} w={900}>
          <div style={{display: 'flex', gap: 12}}>
            {['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'].map((d, i) => {
              const on = ent(t, m.rotinas + 0.08 * i, 0.2);
              return (
                <div key={d} style={{width: 110, height: 90, borderRadius: 6, background: on > 0.5 ? COR.ambar : COR.sup, border: `1px solid ${on > 0.5 ? COR.ambar : COR.borda}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                  <span style={txt(24, 600, on > 0.5 ? COR.preto : COR.sec)}>{d}</span>
                  <span style={txt(20, 400, on > 0.5 ? COR.preto : COR.cinza1, {marginTop: 4})}>7h</span>
                </div>
              );
            })}
          </div>
        </Abs>
      </div>
    </>
  );
};

// 11 · "preenchem uma tabela com ideias de post nos assuntos que eu gosto"
const CenaTabela: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.35);
  const temas = ['IA na prática', 'Carreira', 'Negócios', 'Notícias de IA'];
  const linhas = 5;
  return (
    <>
      <Abs x={90} y={398} w={900} h={300} o={k} dy={(1 - k) * 40} style={card({padding: 0, overflow: 'hidden'})}>
        <div style={{display: 'flex', background: COR.sup2, padding: '12px 20px', gap: 20}}>
          <span style={txt(22, 600, COR.sec, {width: 420, letterSpacing: '0.08em'})}>IDEIA DE POST</span>
          <span style={txt(22, 600, COR.sec, {letterSpacing: '0.08em'})}>ASSUNTO</span>
        </div>
        {Array.from({length: linhas}).map((_, i) => {
          const a = m.tabela - 0.2 + i * 0.32;
          const o = ent(t, a, 0.25);
          const tag = pop(t, Math.max(a + 0.2, i < 2 ? a + 0.2 : m.assuntos - 0.3 + (i - 2) * 0.15), 0.25);
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 20, padding: '0 20px', height: 48, borderTop: `1px solid ${COR.borda}`, opacity: o}}>
              <div style={{width: 420}}>
                <div style={{width: `${(50 + 45 * rnd(i + 20)) * o}%`, height: 10, background: COR.cinza1, borderRadius: 5}} />
              </div>
              <div style={{opacity: cl(tag), transform: `scale(${Math.max(0.01, cl(tag))})`, transformOrigin: 'left center'}}>
                <Tag t={temas[i % temas.length]} size={18} bg={[COR.ambar, COR.petroleo, COR.cobalto, COR.sup2][i % 4]} fg={i % 4 === 0 ? COR.preto : COR.branco} />
              </div>
            </div>
          );
        })}
      </Abs>
      {/* linhas da tabela caindo atrás do Bruno */}
      {Array.from({length: 10}).map((_, i) => {
        const lado = i % 2;
        const nasc = c.start + i * 0.3;
        const y = 820 + ((t - nasc) * 180) % 700;
        const o = ent(t, nasc, 0.2) * cl((1500 - y) / 100);
        return (
          <Abs key={i} x={lado ? 836 : 24} y={y} w={220} h={52} o={o * 0.85} style={card({display: 'flex', alignItems: 'center', padding: '0 12px', gap: 10})}>
            <div style={{width: 14, height: 14, background: [COR.ambar, COR.petroleo, COR.cobalto][i % 3], borderRadius: 2}} />
            <div style={{flex: 1, height: 8, background: COR.cinza1, borderRadius: 4}} />
          </Abs>
        );
      })}
    </>
  );
};

// 12 · "depois o Claude vai e gera o roteiro para mim"
const ROTEIRO = ['GANCHO  número na 1ª frase', 'CONTEXTO  o método', 'DESENVOLVIMENTO  o fluxo', 'CTA  me segue'];
const CenaRoteiro: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.35);
  const cps = 30;
  const t0 = m.gera - 0.2;
  let rest = Math.max(0, (t - t0) * cps);
  return (
    <>
      <Janela x={90} y={398} w={900} h={296} o={k} dy={(1 - k) * 40} nome="Claude">
        <div style={txt(22, 600, COR.ambar, {letterSpacing: '0.1em'})}>ROTEIRO</div>
        {ROTEIRO.map((l, i) => {
          const n = Math.min(l.length, Math.floor(rest));
          rest -= l.length + 6;
          const [a, ...b] = l.split('  ');
          const sa = a.slice(0, n);
          const sb = n > a.length + 2 ? b.join(' ').slice(0, n - a.length - 2) : '';
          return (
            <div key={i} style={{marginTop: 12, minHeight: 40}}>
              <span style={txt(28, 600, COR.ambar)}>{sa}</span>
              <span style={txt(28, 400, COR.claro, {marginLeft: 12})}>{sb}</span>
              {n > 0 && n < l.length && Math.floor(t * 6) % 2 === 0 ? <span style={txt(28, 400, COR.ambar)}>|</span> : null}
            </div>
          );
        })}
      </Janela>
      {/* folhas de roteiro empilhando atrás do Bruno */}
      {Array.from({length: 6}).map((_, i) => {
        const lado = i % 2;
        const o = ent(t, m.roteiro - 0.4 + i * 0.12, 0.3);
        return (
          <Abs key={i} x={lado ? 846 : 34} y={880 + Math.floor(i / 2) * 150} w={200} h={200} o={o} r={(lado ? 4 : -4) + (i % 3)} dy={(1 - o) * 60} style={{background: COR.claro, borderRadius: 3, padding: 16, boxSizing: 'border-box'}}>
            <div style={txt(16, 600, COR.ambarEsc, {letterSpacing: '0.1em'})}>ROTEIRO</div>
            {[0.8, 0.6, 0.9, 0.5].map((w, j) => (
              <div key={j} style={{width: `${w * 100}%`, height: 8, background: '#BDBDBD', borderRadius: 4, marginTop: 12}} />
            ))}
          </Abs>
        );
      })}
    </>
  );
};

// 13 · "com o roteiro validado, passo para o Claude Code, que edita de ponta a ponta"
const CMDS = ['transcrever o bruto', 'cortar os silêncios', 'recortar o fundo verde', 'animar cada frase', 'legendar e mixar', 'render final'];
const CenaClaudeCode: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const val = pop(t, m.validado - 0.05, 0.3);
  const k = ent(t, m.claudecode - 0.4, 0.35);
  const tl = ent(t, m.edita - 0.4, 0.4);
  const play = cl((t - m.edita) / (c.end - m.edita));
  return (
    <>
      {/* v3 (pedido do Bruno): player em cima da timeline, tocando junto com a agulha */}
      <Abs x={190} y={730} w={700} h={410} o={tl} dy={(1 - tl) * 30} style={{background: COR.preto, border: `2px solid ${COR.borda}`, borderRadius: 8, overflow: 'hidden', boxSizing: 'border-box'}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: 700, height: 340, overflow: 'hidden', background: COR.sup}}>
          <Sequence from={Math.round((m.edita - 0.4) * 30)} layout="none">
            <OffthreadVideo src={staticFile('cut.mp4')} muted style={{width: 700, height: 394, marginTop: -27}} />
          </Sequence>
          <div style={{position: 'absolute', left: 14, top: 12}}>
            <Tag t="bruto" size={18} bg={COR.sup2} fg={COR.branco} />
          </div>
        </div>
        <div style={{position: 'absolute', left: 0, bottom: 0, width: 700, height: 70, background: COR.sup2, display: 'flex', alignItems: 'center', gap: 16, padding: '0 20px', boxSizing: 'border-box'}}>
          <svg width={30} height={30} viewBox="0 0 30 30">
            {t < m.edita ? <path d="M7 4 L25 15 L7 26 Z" fill={COR.branco} /> : <path d="M7 5 L12 5 L12 25 L7 25 Z M18 5 L23 5 L23 25 L18 25 Z" fill={COR.branco} />}
          </svg>
          <div style={{flex: 1, height: 8, background: COR.borda, borderRadius: 4, overflow: 'hidden'}}>
            <div style={{width: `${play * 100}%`, height: '100%', background: COR.ambar}} />
          </div>
          <span style={txt(22, 600, COR.sec, {fontVariantNumeric: 'tabular-nums'})}>0:{String(Math.floor(play * 72)).padStart(2, '0')}</span>
        </div>
      </Abs>
      {/* timeline de edição atrás do Bruno */}
      <Abs x={20} y={1150} w={1040} h={330} o={tl * 0.95} style={card({padding: 16})}>
        {[
          {n: 'VÍDEO', cor: COR.cobalto, segs: 9},
          {n: 'CENAS', cor: COR.ambar, segs: 14},
          {n: 'LEGENDA', cor: COR.petroleoClaro, segs: 20},
          {n: 'SOM', cor: COR.cinza1, segs: 6},
        ].map((tr, i) => (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 12, marginTop: i ? 14 : 0}}>
            <span style={txt(16, 600, COR.sec, {width: 90, letterSpacing: '0.08em'})}>{tr.n}</span>
            <div style={{flex: 1, height: 52, position: 'relative'}}>
              {Array.from({length: tr.segs}).map((_, j) => {
                const w = 100 / tr.segs;
                const o = ent(t, m.edita - 0.3 + i * 0.12 + j * 0.03, 0.2);
                return <div key={j} style={{position: 'absolute', left: `${j * w}%`, width: `calc(${w}% - 4px)`, top: 0, bottom: 0, background: tr.cor, opacity: o * (0.55 + 0.45 * rnd(i * 31 + j)), borderRadius: 3}} />;
              })}
            </div>
          </div>
        ))}
        <div style={{position: 'absolute', left: 118 + (1040 - 150) * play, top: 6, width: 4, height: 318, background: COR.branco}} />
      </Abs>
      <Janela x={90} y={398} w={900} h={296} o={k} dy={(1 - k) * 40} nome="Claude Code">
        <div style={{fontFamily: 'Menlo, monospace'}}>
          {CMDS.map((cmd, i) => {
            const a = m.claudecode + 0.1 + i * 0.42;
            const o = ent(t, a, 0.15);
            const done = t > a + 0.35;
            return (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 12, marginTop: i ? 6 : 0, opacity: o}}>
                <span style={{fontFamily: 'Menlo, monospace', fontSize: 26, color: COR.ambar}}>&gt;</span>
                <span style={{fontFamily: 'Menlo, monospace', fontSize: 26, color: COR.claro}}>{cmd}</span>
                <span style={{fontFamily: 'Menlo, monospace', fontSize: 24, color: done ? COR.petroleoClaro : COR.cinza1}}>{done ? 'ok' : '…'}</span>
              </div>
            );
          })}
        </div>
      </Janela>
      <Abs x={700} y={330} w={300} o={cl(val) * (1 - ent(t, m.claudecode - 0.4, 0.3))} s={1.4 - 0.4 * cl(val)} r={-6} style={{background: COR.petroleo, borderRadius: 4, padding: '10px 16px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 12}}>
        <Check size={40} bg={COR.preto} />
        <span style={txt(40, 600, COR.branco)}>validado</span>
      </Abs>
    </>
  );
};

// 14 · "inclusive, vocês estão vendo a versão final da edição" (camadas 3D)
const CenaEsteVideo: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.35);
  const fin = pop(t, m.final - 0.05, 0.35);
  return (
    <>
      <Abs x={90} y={410} w={900} o={k} dy={(1 - k) * 20}>
        <div style={txt(64, 600, COR.branco)}>Este vídeo</div>
        <div style={txt(40, 400, COR.sec, {marginTop: 10})}>foi editado pelo Claude Code</div>
      </Abs>
      <Abs x={90} y={590} w={600} o={cl(fin)} s={0.7 + 0.3 * cl(fin)} origin="left center">
        <Tag t="versão final" size={40} />
      </Abs>
    </>
  );
};

// 15 · "eu trabalho construindo IA para empresas" (sem nome, cliente ou tela do trabalho)
const CenaEmpresas: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.35);
  const pr = ent(t, m.predios - 0.3, 0.5);
  const alturas = [420, 560, 340, 620, 460];
  return (
    <>
      <Svg o={pr}>
        {alturas.map((h, i) => {
          const lado = i < 2 ? 0 : i > 2 ? 1 : -1;
          if (lado < 0) return null;
          const x = lado === 0 ? 30 + i * 120 : 830 + (i - 3) * 120;
          const g = inOutCubic(cl((t - m.predios + 0.3 - i * 0.08) / 0.6));
          const y = 1500 - h * g;
          return (
            <g key={i}>
              <rect x={x} y={y} width={100} height={h * g} fill={COR.sup} stroke={COR.borda} strokeWidth={3} />
              {Array.from({length: Math.floor((h * g) / 60)}).map((_, j) => (
                <rect key={j} x={x + 18} y={y + 20 + j * 60} width={64} height={22} fill={rnd(i * 10 + j) > 0.55 ? COR.ambar : COR.sup2} opacity={0.9} />
              ))}
            </g>
          );
        })}
      </Svg>
      <Abs x={90} y={410} w={900} o={k} dy={(1 - k) * 20}>
        <div style={txt(44, 400, COR.sec)}>No dia a dia</div>
        <div style={txt(72, 600, COR.branco, {marginTop: 8})}>IA para empresas</div>
      </Abs>
      {/* rede de nós (genérica) */}
      <Svg o={ent(t, m.ia - 0.2, 0.4)}>
        {[[640, 600, 760, 560], [760, 560, 880, 620], [880, 620, 980, 560], [760, 560, 860, 470]].map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={COR.petroleoClaro} strokeWidth={4} />
        ))}
        {[[640, 600], [760, 560], [880, 620], [980, 560], [860, 470]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={16 + 3 * Math.sin(t * 6 + i)} fill={i === 1 ? COR.ambar : COR.petroleo} />
        ))}
      </Svg>
    </>
  );
};

// 16 · "agora eu tô usando IA para construir o meu canal do zero"
const CenaCanal: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.35);
  const z = pop(t, m.zero - 0.1, 0.35);
  // tijolos se empilhando atrás do Bruno (construir)
  const tijolos = [];
  for (let i = 0; i < 18; i++) {
    const lado = i % 2;
    const row = Math.floor(i / 2);
    const a = m.construir - 0.3 + i * 0.08;
    const o = ent(t, a, 0.25);
    const off = row % 2 ? 50 : 0;
    tijolos.push(<Abs key={i} x={(lado ? 830 : 20) + off * (lado ? 1 : 0.6)} y={1440 - row * 74 - (1 - o) * 120} w={180} h={64} o={o} style={{background: row === 8 ? COR.ambar : COR.sup2, border: `2px solid ${COR.borda}`, borderRadius: 3}} />);
  }
  return (
    <>
      {tijolos}
      <Abs x={90} y={400} w={900} o={k} dy={(1 - k) * 20}>
        <div style={txt(44, 400, COR.sec)}>Agora, o meu canal</div>
      </Abs>
      <Abs x={90} y={470} w={900} o={cl(z)} s={0.8 + 0.2 * cl(z)} origin="left top">
        <div style={{display: 'flex', alignItems: 'baseline', gap: 24}}>
          <span style={txt(150, 600, COR.ambar, {lineHeight: 1})}>do zero</span>
        </div>
      </Abs>
    </>
  );
};

// 17 · CTA: "me segue para acompanhar essa construção e descobrir como montar isso pra você"
const CenaSegue: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const btn = pop(t, c.start, 0.35);
  const click = m.segue + 0.3;
  const pressed = t >= click && t < click + 0.12;
  const seguindo = t >= click + 0.12;
  const cur = ent(t, c.start + 0.05, 0.4);
  const sai = ent(t, m.descobrir - 0.25, 0.25);
  const passos = ['Pesquisa com IA', 'Estrutura no Notion', 'Roteiro com IA', 'Edição com Claude Code'];
  const parts = [];
  for (let i = 0; i < 18; i++) {
    const nasc = click + 0.1 + i * 0.09;
    if (t < nasc) continue;
    const lado = i % 2 === 0;
    const x = lado ? 40 + rnd(i) * 180 : 860 + rnd(i) * 180;
    const y = 1450 - (t - nasc) * 420;
    const o = cl((t - nasc) / 0.1) * cl((y - 780) / 150);
    parts.push(
      <div key={i} style={{position: 'absolute', left: x, top: y, opacity: o, ...txt(30, 600, i % 3 ? COR.ambar : COR.petroleoClaro), background: COR.sup, border: `1px solid ${COR.borda}`, borderRadius: 999, padding: '6px 16px'}}>
        +1
      </div>,
    );
  }
  return (
    <>
      {parts}
      <Abs x={290} y={440} w={500} h={130} o={cl(btn) * (1 - sai)} s={(pressed ? 0.92 : 1) * (0.7 + 0.3 * cl(btn))} style={{background: seguindo ? COR.sup2 : COR.petroleo, border: seguindo ? `2px solid ${COR.borda}` : 'none', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, boxSizing: 'border-box'}}>
        {seguindo ? <Check size={44} bg={COR.petroleo} /> : null}
        <span style={txt(54, 600, COR.branco)}>{seguindo ? 'Seguindo' : 'Seguir'}</span>
      </Abs>
      {btn > 0 && sai < 1 ? (
        <Svg o={1 - sai}>
          <path transform={`translate(${900 - 300 * cur} ${700 - 160 * cur})`} d="M0 0 L0 46 L12 35 L21 55 L29 51 L20 32 L36 32 Z" fill={COR.branco} stroke={COR.preto} strokeWidth={3} />
        </Svg>
      ) : null}
      <Abs x={90} y={398} w={900} o={sai}>
        <div style={txt(30, 600, COR.sec, {letterSpacing: '0.08em'})}>COMO MONTAR PRA VOCÊ</div>
      </Abs>
      {passos.map((p, i) => {
        const o = ent(t, m.descobrir + 0.15 * i, 0.3);
        return (
          <Abs key={i} x={90 + (i % 2) * 460} y={450 + Math.floor(i / 2) * 100} w={440} h={84} o={o} dy={(1 - o) * 20} style={card({display: 'flex', alignItems: 'center', gap: 14, padding: '0 18px'})}>
            <Check size={36} />
            <span style={txt(30, 600, COR.branco)}>{p}</span>
          </Abs>
        );
      })}
    </>
  );
};

// 18 · "fala aí, o que trava a sua produção hoje?" + assinatura
const CenaPergunta: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.3);
  const logo = ent(t, m.logo, 0.3);
  const bubbles = [
    {x: 24, y: 900, at: m.trava, txt: 'o roteiro'},
    {x: 826, y: 980, at: m.trava + 0.2, txt: 'a edição'},
    {x: 24, y: 1140, at: m.trava + 0.4, txt: 'tempo'},
    {x: 826, y: 1220, at: m.trava + 0.6, txt: 'a ideia'},
  ];
  return (
    <>
      {bubbles.map((b, i) => {
        const o = pop(t, b.at, 0.35);
        return (
          <Abs key={i} x={b.x} y={b.y} w={230} o={cl(o)} s={0.7 + 0.3 * cl(o)} dy={(1 - cl(o)) * 30} origin={i % 2 ? 'right bottom' : 'left bottom'} style={{display: 'flex', gap: 10, alignItems: 'flex-start'}}>
            <div style={{width: 44, height: 44, borderRadius: 22, background: [COR.petroleo, COR.cobalto, COR.cinza1, COR.ambarEsc][i], flexShrink: 0}} />
            <div style={card({flex: 1, padding: '12px 14px'})}>
              <span style={txt(24, 600, COR.claro)}>{b.txt}</span>
            </div>
          </Abs>
        );
      })}
      <Abs x={90} y={398} w={900} o={k * (1 - logo)} dy={(1 - k) * 30}>
        <div style={txt(56, 600, COR.branco)}>O que trava a sua</div>
        <div style={txt(56, 600, COR.ambar)}>produção hoje?</div>
      </Abs>
      <Abs x={60} y={380} w={300} h={300} o={logo}>
        <Sequence from={Math.round(m.logo * 30)} layout="none">
          <Video src={staticFile('brand/logo-anim.webm')} style={{width: 300, height: 300}} muted />
        </Sequence>
      </Abs>
      <Abs x={390} y={470} w={620} o={ent(t, m.logo + 0.25, 0.35)}>
        <Img src={staticFile('brand/falaibruno-branco.svg')} style={{width: 580}} />
      </Abs>
    </>
  );
};

const CENAS: Record<string, React.FC<{t: number; c: Cena}>> = {
  estudo: CenaEstudo,
  analise: CenaAnalise,
  media: CenaMedia,
  detalhes: CenaDetalhes,
  insights: CenaInsights,
  n140: Cena140,
  ganchonum: CenaGanchoNum,
  notion: CenaNotion,
  fluxo: CenaFluxo,
  fontes: CenaFontes,
  tabela: CenaTabela,
  roteiro: CenaRoteiro,
  claudecode: CenaClaudeCode,
  estevideo: CenaEsteVideo,
  empresas: CenaEmpresas,
  canal: CenaCanal,
  segue: CenaSegue,
  pergunta: CenaPergunta,
};

// ======================= HEADLINE (estilo "misto") =======================
// Linha 1 leve e branca, linha 2 pesada no âmbar escolhido. Sempre duas linhas.
const Headline: React.FC<{t: number}> = ({t}) => {
  const h = F.headline;
  if (!h || t >= h.fim + 0.3) return null;
  const a = ent(t, 0.05, 0.4);
  const b = ent(t, 0.3, 0.4);
  const out = cl((h.fim - t) / 0.3);
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: 330, textAlign: 'center', opacity: out}}>
      <div style={{...txt(60, 300, COR.branco, {lineHeight: 1.08}), opacity: a, transform: `translateY(${(1 - a) * 24}px)`}}>{h.l1}</div>
      <div style={{...txt(78, 600, COR.ambar, {lineHeight: 1.08, marginTop: 6}), opacity: b, transform: `translateY(${(1 - b) * 24}px)`}}>{h.l2}</div>
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
