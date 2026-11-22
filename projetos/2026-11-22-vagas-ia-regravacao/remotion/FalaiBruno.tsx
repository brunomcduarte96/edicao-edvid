/**
 * FalaiBruno v4 — palco em camadas para o 9:16 com o Bruno recortado (chroma key).
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
};
const D = editData as unknown as {falai: Falai; hook?: {enabled: boolean; endSec: number}};
const F = D.falai;
const HOOK_FIM = F.headline?.fim ?? 0;

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

// ======================= CENAS (camada ELEMENTOS) =======================
// Zona A (acima da cabeça): y 390–690. Laterais atrás do Bruno: x 20–250 / 830–1060, y 800–1500.

const VAGAS = ['Analista de RH', 'Marketing', 'Comunicação', 'Recrutamento', 'Design', 'Atendimento'];

const CenaVagas: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const dob = ent(t, m.dobra - 0.1, 0.7);
  // gráfico subindo atrás da cabeça
  const pts = [
    [60, 1430],
    [200, 1400],
    [330, 1330],
    [450, 1290],
    [560, 1160],
    [680, 1050],
    [800, 900],
    [930, 760],
    [1030, 650],
  ];
  const lenTot = pts.slice(1).reduce((acc, p, i) => acc + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');
  const area = `${path} L1030 1600 L60 1600 Z`;
  const br = ent(t, m.brasil, 0.3);
  const ano = ent(t, m.ano, 0.3);
  return (
    <>
      {/* grade de leitura do gráfico */}
      <Svg o={0.55 * dob}>
        {[700, 900, 1100, 1300].map((y) => (
          <line key={y} x1={40} y1={y} x2={1040} y2={y} stroke={COR.borda} strokeWidth={2} strokeDasharray="6 10" />
        ))}
      </Svg>
      <Svg>
        <path d={area} fill={COR.ambar} opacity={0.12 * dob} />
        <path d={path} stroke={COR.ambar} strokeWidth={10} fill="none" strokeDasharray={lenTot} strokeDashoffset={lenTot * (1 - dob)} strokeLinejoin="round" />
        {dob > 0.98 ? <circle cx={1030} cy={650} r={16 + 4 * Math.sin(t * 9)} fill={COR.ambar} /> : null}
      </Svg>
      {/* cards de vaga à esquerda, atrás do Bruno */}
      {VAGAS.slice(0, 3).map((v, i) => {
        const a = c.start + 0.15 + i * 0.12;
        const k = ent(t, a, 0.45);
        const tag = pop(t, m.ia + i * 0.07, 0.3);
        return (
          <Abs key={i} x={28} y={820 + i * 150} w={240} h={128} o={k} dx={(1 - k) * -120} style={card({padding: 16})}>
            <div style={txt(18, 600, COR.sec, {letterSpacing: '0.08em'})}>VAGA</div>
            <div style={txt(24, 600, COR.branco, {marginTop: 4, whiteSpace: 'nowrap'})}>{v}</div>
            <div style={{marginTop: 10, opacity: cl(tag), transform: `scale(${Math.max(0.01, tag)})`, transformOrigin: 'left center'}}>
              <Tag t="Requisito: IA" size={17} />
            </div>
          </Abs>
        );
      })}
      {/* número à direita */}
      <Abs x={800} y={790} w={270} o={dob} s={0.8 + 0.2 * dob} origin="left top">
        <div style={txt(76, 300, COR.ambar, {lineHeight: 1})}>+110,7%</div>
        <div style={{...txt(28, 600, COR.branco, {marginTop: 10}), opacity: ano}}>em 1 ano</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, opacity: br}}>
          <svg width={26} height={34} viewBox="0 0 26 34">
            <path d="M13 33 C13 33 2 19 2 12 A11 11 0 0 1 24 12 C24 19 13 33 13 33 Z" fill={COR.petroleo} />
            <circle cx="13" cy="12" r="4.5" fill="#fff" />
          </svg>
          <span style={txt(26, 400, COR.sec)}>no Brasil</span>
        </div>
      </Abs>
    </>
  );
};

const DEPTOS_FORA = ['RH', 'Marketing', 'Comunicação', 'Design'];
const DEPTOS_TI = ['TI', 'Dados'];

const CenaMetade: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const cell = 26;
  const gap = 3;
  const x0 = (1080 - (cell * 10 + gap * 9)) / 2;
  const y0 = 398;
  const cells = [];
  for (let i = 0; i < 100; i++) {
    const col = Math.floor(i / 10);
    const row = i % 10;
    const ap = ent(t, c.start + 0.018 * col + 0.01 * row, 0.25);
    const fora = i < 54;
    const pinta = fora ? ent(t, m.metade + 0.01 * i, 0.15) : 0;
    const ti = !fora ? ent(t, m.tec + 0.008 * (i - 54), 0.15) : 0;
    cells.push(
      <div
        key={i}
        style={{
          position: 'absolute',
          left: x0 + col * (cell + gap),
          top: y0 + row * (cell + gap),
          width: cell,
          height: cell,
          borderRadius: 2,
          background: pinta > 0.5 ? COR.ambar : ti > 0.5 ? COR.claro : COR.sup2,
          opacity: ap,
          transform: `scale(${0.6 + 0.4 * ap})`,
        }}
      />,
    );
  }
  const lf = ent(t, m.metade + 0.3, 0.3);
  const lt = ent(t, m.tec, 0.3);
  return (
    <>
      {cells}
      <Abs x={30} y={430} w={x0 - 60} o={lf} dx={(1 - lf) * -30}>
        <div style={txt(44, 600, COR.ambar, {textAlign: 'right'})}>Fora de TI</div>
        <div style={txt(26, 400, COR.sec, {textAlign: 'right', marginTop: 8})}>mais da metade</div>
      </Abs>
      <Abs x={1080 - x0 + 30} y={430} w={x0 - 60} o={lt} dx={(1 - lt) * 30}>
        <div style={txt(44, 600, COR.branco)}>TI</div>
        <div style={txt(26, 400, COR.sec, {marginTop: 8})}>o resto</div>
      </Abs>
      {/* departamentos nas laterais, atrás do Bruno */}
      {DEPTOS_FORA.map((d, i) => {
        const k = ent(t, c.start + 0.1 + i * 0.08, 0.35);
        const on = ent(t, m.metade + 0.12 * i, 0.2);
        return (
          <Abs key={d} x={30} y={850 + i * 120} w={220} h={92} o={k} dx={(1 - k) * -80} style={card({display: 'flex', alignItems: 'center', padding: '0 18px', background: on > 0.5 ? COR.ambar : COR.sup, borderColor: on > 0.5 ? COR.ambar : COR.borda})}>
            <span style={txt(d.length > 9 ? 26 : 32, 600, on > 0.5 ? COR.preto : COR.branco)}>{d}</span>
          </Abs>
        );
      })}
      {DEPTOS_TI.map((d, i) => {
        const k = ent(t, c.start + 0.2 + i * 0.08, 0.35);
        const on = ent(t, m.tec + 0.12 * i, 0.2);
        return (
          <Abs key={d} x={830} y={910 + i * 120} w={220} h={92} o={k} dx={(1 - k) * 80} style={card({display: 'flex', alignItems: 'center', padding: '0 18px', borderColor: on > 0.5 ? COR.claro : COR.borda, borderWidth: on > 0.5 ? 3 : 1})}>
            <span style={txt(32, 600, COR.branco)}>{d}</span>
          </Abs>
        );
      })}
    </>
  );
};

const CenaGupy: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.4);
  const g = pop(t, m.gupy - 0.1, 0.4);
  const roll = inOutCubic(cl((t - m.milhao + 0.15) / (m.mil + 0.1 - m.milhao)));
  const n = 1600000 * roll;
  const vg = ent(t, m.vagas - 0.05, 0.3);
  // parede de vagas atrás do Bruno, varrida por uma linha de leitura
  const cols = 14;
  const rows = 24;
  const cw = 64;
  const ch = 30;
  const gx = 12;
  const gy = 10;
  const wx0 = (1080 - (cols * cw + (cols - 1) * gx)) / 2;
  const wy0 = 790;
  const scanY = wy0 + ((t - m.analisou) / 1.6) * rows * (ch + gy);
  const parede = [];
  for (let i = 0; i < cols * rows; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const ap = ent(t, m.analisou - 0.3 + row * 0.04 + rnd(i) * 0.25, 0.2);
    const y = wy0 + row * (ch + gy);
    const lida = scanY > y + ch;
    parede.push(
      <div
        key={i}
        style={{
          position: 'absolute',
          left: wx0 + col * (cw + gx),
          top: y,
          width: cw,
          height: ch,
          borderRadius: 3,
          background: lida ? (rnd(i + 9) < 0.55 ? COR.ambarEsc : COR.sup2) : COR.sup,
          border: `1px solid ${COR.borda}`,
          opacity: ap * 0.9,
        }}
      >
        <div style={{position: 'absolute', left: 6, top: 8, width: cw * (0.4 + 0.4 * rnd(i + 3)), height: 4, background: COR.cinza1, borderRadius: 2}} />
        <div style={{position: 'absolute', left: 6, top: 17, width: cw * (0.25 + 0.3 * rnd(i + 5)), height: 4, background: COR.borda, borderRadius: 2}} />
      </div>,
    );
  }
  return (
    <>
      {parede}
      {t > m.analisou && scanY < wy0 + rows * (ch + gy) ? (
        <div style={{position: 'absolute', left: 0, top: scanY, width: 1080, height: 4, background: COR.ambar, boxShadow: `0 0 24px ${COR.ambar}`, opacity: 0.9}} />
      ) : null}
      <Abs x={90} y={400} w={900} o={k}>
        <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
          <div style={{opacity: cl(g), transform: `scale(${Math.max(0.01, g)})`, transformOrigin: 'left center'}}>
            <div style={{background: COR.claro, borderRadius: 4, padding: '10px 26px'}}>
              <span style={txt(48, 600, COR.preto)}>Gupy</span>
            </div>
          </div>
          <span style={{...txt(40, 400, COR.sec), opacity: ent(t, m.analisou, 0.3)}}>analisou</span>
        </div>
      </Abs>
      <Abs x={90} y={490} w={900} o={ent(t, m.milhao - 0.2, 0.3)}>
        <div style={txt(140, 300, COR.ambar, {lineHeight: 1, fontVariantNumeric: 'tabular-nums'})}>{fmt(n)}</div>
      </Abs>
      <Abs x={90} y={638} w={900} o={vg} dy={(1 - vg) * 14}>
        <div style={txt(40, 600, COR.branco)}>vagas</div>
      </Abs>
    </>
  );
};

const CenaAreas: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const base = 1500;
  const H = 700;
  const intro = ent(t, c.start, 0.4);
  const bars = [
    {x: 30, w: 210, v: 139, at: m.rh, cor: COR.ambar, fg: COR.preto, nome: 'RH', val: '+139%'},
    {x: 840, w: 210, v: 134, at: m.mkt, cor: COR.petroleo, fg: COR.branco, nome: 'Marketing e comunicação', val: '+134%'},
  ];
  const com = ent(t, m.com, 0.3);
  return (
    <>
      <Abs x={90} y={410} w={900} o={intro} dy={(1 - intro) * 20}>
        <div style={txt(64, 600, COR.branco)}>A área que</div>
        <div style={txt(64, 600, COR.ambar)}>mais cresceu</div>
      </Abs>
      {/* pódio pequeno na zona de cima */}
      <Abs x={640} y={430} w={350} h={240} o={ent(t, m.rh + 0.2, 0.4)}>
        {[
          {l: '1º', h: 150, x: 120, at: m.rh, cor: COR.ambar, n: 'RH'},
          {l: '2º', h: 110, x: 0, at: m.mkt, cor: COR.petroleo, n: 'Mkt'},
          {l: '3º', h: 80, x: 240, at: m.com, cor: COR.cinza1, n: 'Com'},
        ].map((p, i) => {
          const g = ent(t, p.at, 0.35);
          return (
            <div key={i} style={{position: 'absolute', left: p.x, bottom: 0, width: 100, height: p.h * g, background: p.cor, borderRadius: '3px 3px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 10, boxSizing: 'border-box', overflow: 'hidden'}}>
              <span style={txt(30, 600, i === 0 ? COR.preto : COR.branco)}>{p.l}</span>
              <span style={txt(20, 600, i === 0 ? COR.preto : COR.branco, {marginTop: 4})}>{p.n}</span>
            </div>
          );
        })}
      </Abs>
      <Abs x={20} y={base} w={1040} h={3} o={intro} style={{background: COR.borda}} />
      {bars.map((b, i) => {
        const g = inOutCubic(cl((t - b.at + 0.15) / 0.7));
        const h = ((H * b.v) / 139) * g;
        const hl = i === 1 ? com : 0;
        return (
          <div key={i}>
            <div
              style={{
                position: 'absolute',
                left: b.x,
                top: base - h,
                width: b.w,
                height: h,
                background: b.cor,
                borderRadius: '4px 4px 0 0',
                outline: hl > 0 ? `${4 * hl}px solid ${COR.branco}` : undefined,
              }}
            />
            <Abs x={b.x + 16} y={base - h + 18} w={b.w - 32} o={cl((g - 0.6) / 0.4)}>
              <div style={txt(b.nome.length > 5 ? 26 : 48, 600, b.fg)}>{b.nome}</div>
              <div style={txt(58, 300, b.fg, {marginTop: 8})}>{b.val}</div>
            </Abs>
          </div>
        );
      })}
    </>
  );
};

const CenaRequisitos: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.45);
  const linhas: {pre: string; hl?: string; at?: number}[] = [
    {pre: 'Saber escrever ', hl: 'prompt', at: m.prompt},
    {pre: 'Usar ', hl: 'agente de IA', at: m.agente},
    {pre: 'Excel e Pacote Office'},
  ];
  const st = pop(t, m.pct - 0.05, 0.3);
  const req = ent(t, m.req, 0.3);
  // as palavras se multiplicando atrás do Bruno
  const fator = cl((t - m.cresceram) / 1.6);
  const nTok = Math.floor(4 + 36 * fator);
  const toks: React.ReactNode[] = [];
  for (let i = 0; i < 40; i++) {
    if (i >= nTok) break;
    const lado = i % 2 === 0;
    const x = lado ? 20 + rnd(i) * 110 : 840 + rnd(i) * 80;
    const nasc = m.cresceram + (i / 40) * 1.6;
    const sobe = (t - nasc) * 90;
    const y = 1480 - rnd(i + 11) * 600 - sobe;
    const o = ent(t, nasc, 0.2) * cl((y - 760) / 120);
    const pal = i % 3 === 0 ? 'agente' : 'prompt';
    tokPush(toks, i, x, y, o, pal);
  }
  return (
    <>
      {toks}
      <Abs x={90} y={398} w={900} h={290} o={k} dy={(1 - k) * 50} style={{background: COR.claro, borderRadius: 6}}>
        <div style={{padding: '22px 34px'}}>
          <div style={{display: 'flex', alignItems: 'baseline', gap: 16}}>
            <div style={txt(22, 600, COR.cinza1, {letterSpacing: '0.08em'})}>DESCRIÇÃO DA VAGA</div>
            <div style={{...txt(22, 600, COR.petroleo, {letterSpacing: '0.08em'}), opacity: req}}>· REQUISITOS</div>
          </div>
          {linhas.map((l, i) => {
            const li = ent(t, c.start + 0.25 + i * 0.12, 0.3);
            const hl = l.at !== undefined ? ent(t, l.at, 0.3) : 0;
            return (
              <div key={i} style={{display: 'flex', alignItems: 'center', marginTop: 22, opacity: li}}>
                <div style={{width: 14, height: 14, background: COR.petroleo, marginRight: 18, flexShrink: 0}} />
                <span style={txt(38, 400, COR.preto)}>{l.pre}</span>
                {l.hl ? (
                  <span style={{position: 'relative', marginLeft: 6}}>
                    <span style={{position: 'absolute', left: -6, top: 2, bottom: 0, width: `calc(${hl * 100}% + 12px)`, background: COR.ambar, borderRadius: 2}} />
                    <span style={{...txt(38, 600, COR.preto), position: 'relative'}}>{l.hl}</span>
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </Abs>
      <Abs x={690} y={560} w={300} o={cl(st)} s={1.5 - 0.5 * cl(st)} r={-6 * cl(st)} style={{background: COR.preto, border: `3px solid ${COR.ambar}`, borderRadius: 4, padding: '10px 18px', boxSizing: 'border-box'}}>
        <div style={txt(76, 300, COR.ambar, {lineHeight: 1})}>+325%</div>
        <div style={txt(20, 600, COR.branco, {marginTop: 6})}>menções a prompt e agente</div>
      </Abs>
    </>
  );
};
function tokPush(arr: React.ReactNode[], i: number, x: number, y: number, o: number, pal: string) {
  arr.push(
    <div key={`tok${i}`} style={{position: 'absolute', left: x, top: y, opacity: cl(o), ...txt(26 + (i % 4) * 4, 600, i % 3 === 0 ? COR.petroleoClaro : COR.ambar), border: `1px solid ${COR.borda}`, background: COR.sup, padding: '4px 12px', borderRadius: 3}}>
      {pal}
    </div>,
  );
}

const CenaDetalhe: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const k = ent(t, c.start, 0.3);
  const lx = 540 + 260 * Math.cos(t * 3.2);
  const ly = 1050 + 140 * Math.sin(t * 3.2);
  return (
    <>
      <Abs x={0} y={430} w={1080} o={k} s={0.9 + 0.1 * k} style={{textAlign: 'center'}}>
        <div style={txt(150, 300, COR.ambar, {lineHeight: 1})}>o detalhe</div>
      </Abs>
      {/* lupa passeando atrás da cabeça */}
      <Svg o={k}>
        <circle cx={lx} cy={ly} r={150} stroke={COR.claro} strokeWidth={14} fill="rgba(232,163,61,0.08)" />
        <line x1={lx + 106} y1={ly + 106} x2={lx + 230} y2={ly + 230} stroke={COR.claro} strokeWidth={26} strokeLinecap="round" />
      </Svg>
    </>
  );
};

const LIVROS = ['Excel', 'Compliance', 'Liderança', 'Vendas', 'Segurança', 'Onboarding', 'Atendimento', 'Ética', 'Processos', 'Oratória'];

const CenaTreinamento: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const cell = 26;
  const gap = 3;
  const x0 = 90;
  const y0 = 398;
  const cells = [];
  for (let i = 0; i < 100; i++) {
    const row = Math.floor(i / 10);
    const col = i % 10;
    const ap = ent(t, c.start + 0.004 * i, 0.2);
    cells.push(
      <div key={i} style={{position: 'absolute', left: x0 + col * (cell + gap), top: y0 + row * (cell + gap), width: cell, height: cell, borderRadius: 2, background: COR.sup2, opacity: ap, overflow: 'hidden'}}>
        {i === 0 ? <div style={{width: '100%', height: '100%', background: COR.ambar, opacity: ent(t, m.pct, 0.2), transform: `scale(${1 + 0.3 * Math.max(0, 1 - Math.abs(t - m.pct - 0.25) * 4)})`}} /> : null}
        {i === 1 ? <div style={{width: `${20 * ent(t, m.pct + 0.25, 0.3)}%`, height: '100%', background: COR.ambar}} /> : null}
      </div>,
    );
  }
  const n = ent(t, m.pct, 0.3);
  return (
    <>
      {cells}
      <Abs x={440} y={390} w={560} o={n} s={0.9 + 0.1 * n} origin="left top">
        <div style={txt(150, 300, COR.ambar, {lineHeight: 1})}>1,2%</div>
      </Abs>
      <Abs x={446} y={548} w={560} o={ent(t, m.trein, 0.3)}>
        <div style={txt(34, 600, COR.branco)}>dos treinamentos internos</div>
      </Abs>
      <Abs x={446} y={592} w={560} o={ent(t, m.emp, 0.3)}>
        <div style={txt(34, 600, COR.branco)}>das empresas</div>
      </Abs>
      <Abs x={446} y={636} w={560} o={ent(t, m.ia, 0.3)}>
        <div style={txt(34, 600, COR.ambar)}>são sobre IA</div>
      </Abs>
      {/* prateleiras de cursos atrás do Bruno: só uma lombada fina é IA */}
      {[0, 1].map((lado) => (
        <div key={lado}>
          {LIVROS.slice(lado * 5, lado * 5 + 5).map((l, i) => {
            const k = ent(t, m.trein + i * 0.07 + lado * 0.04, 0.3);
            const y = 860 + i * 118;
            const x = lado === 0 ? 24 : 836;
            return (
              <Abs key={l} x={x} y={y} w={220} h={96} o={k} dx={(1 - k) * (lado === 0 ? -60 : 60)} style={card({display: 'flex', alignItems: 'center', padding: '0 16px', borderLeft: `10px solid ${[COR.cobalto, COR.petroleo, COR.cinza1, COR.borda, COR.sec][i]}`})}>
                <span style={txt(26, 600, COR.claro)}>{l}</span>
              </Abs>
            );
          })}
        </div>
      ))}
      <Abs x={836} y={860 + 5 * 118} w={220} h={34} o={pop(t, m.ia, 0.35)} style={{background: COR.ambar, borderRadius: 3, display: 'flex', alignItems: 'center', paddingLeft: 12, boxSizing: 'border-box'}}>
        <span style={txt(22, 600, COR.preto)}>IA (1,2%)</span>
      </Abs>
    </>
  );
};

const CenaEmpresa: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const kl = ent(t, c.start, 0.4);
  const kr = ent(t, m.ensina - 0.4, 0.4);
  const nao = pop(t, m.ensina, 0.3);
  const casa = ent(t, m.casa - 0.2, 0.5);
  const porta = ent(t, m.entrada - 0.2, 0.4);
  return (
    <>
      <Abs x={50} y={398} w={470} h={290} o={kl} dy={(1 - kl) * 40} style={{border: `3px solid ${COR.ambar}`, borderRadius: 6, padding: 24, boxSizing: 'border-box', background: COR.preto}}>
        <Tag t="Na entrada" size={24} />
        <div style={txt(38, 600, COR.branco, {marginTop: 18})}>A empresa cobra</div>
        {[
          {l: 'Saber usar IA', at: m.cobra},
          {l: 'Prompt e agente', at: m.entrada},
        ].map((r, i) => {
          const o = ent(t, r.at, 0.25);
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', marginTop: 14, opacity: o, transform: `translateX(${(1 - o) * -20}px)`}}>
              <Check size={36} />
              <span style={txt(32, 400, COR.branco, {marginLeft: 14})}>{r.l}</span>
            </div>
          );
        })}
      </Abs>
      <Abs x={560} y={398} w={470} h={290} o={kr} dy={(1 - kr) * 40} style={{border: `3px solid ${COR.borda}`, borderRadius: 6, padding: 24, boxSizing: 'border-box', background: COR.preto}}>
        <Tag t="Dentro de casa" size={24} bg={COR.sup2} fg={COR.branco} />
        <div style={txt(38, 600, COR.branco, {marginTop: 18})}>A empresa ensina</div>
        <div style={{display: 'flex', alignItems: 'center', marginTop: 14, opacity: cl(nao), transform: `scale(${0.7 + 0.3 * cl(nao)})`, transformOrigin: 'left center'}}>
          <Xis size={36} />
          <span style={txt(32, 400, COR.branco, {marginLeft: 14})}>Treinamento de IA</span>
        </div>
        <div style={{marginTop: 16, width: '100%', height: 18, background: COR.sup2, borderRadius: 4, overflow: 'hidden'}}>
          <div style={{width: `${1.2 * ent(t, m.dentro, 0.6) + 0.6}%`, height: '100%', background: COR.ambar}} />
        </div>
      </Abs>
      {/* atrás do Bruno: a porta de entrada (esquerda) e a casa vazia (direita) */}
      <Svg o={porta}>
        <rect x={40} y={860} width={200} height={420} fill="none" stroke={COR.ambar} strokeWidth={6} />
        <rect x={60} y={880} width={160} height={400} fill={COR.sup} />
        <circle cx={196} cy={1080} r={9} fill={COR.ambar} />
      </Svg>
      <Abs x={40} y={1300} w={220} o={porta}>
        <div style={txt(28, 600, COR.ambar)}>Entrada</div>
        <div style={txt(22, 400, COR.sec, {marginTop: 4})}>pede IA</div>
      </Abs>
      <Seta x1={-20} y1={1100} x2={150} y2={1100} cor={COR.ambar} p={ent(t, m.entrada, 0.35)} w={7} />
      <Svg o={casa}>
        <path d="M840 1010 L945 900 L1050 1010 L1050 1290 L840 1290 Z" fill={COR.sup} stroke={COR.borda} strokeWidth={5} />
        <rect x={870} y={1040} width={150} height={90} fill={COR.preto} stroke={COR.cinza1} strokeWidth={3} />
        <text x={945} y={1096} textAnchor="middle" style={{fontFamily: FONTE, fontSize: 22, fontWeight: 600}} fill={COR.cinza1}>
          sala vazia
        </text>
      </Svg>
      <Abs x={840} y={1300} w={220} o={casa}>
        <div style={txt(28, 600, COR.branco)}>Dentro de casa</div>
        <div style={txt(22, 400, COR.sec, {marginTop: 4})}>não ensina</div>
      </Abs>
    </>
  );
};

const CenaEsperar: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.4);
  const prog = 0.1 + cl((t - c.start) / (c.end - c.start)) * 0.3;
  const dots = 12;
  const rot = (t * 360) % 360;
  const stamp = pop(t, m.ninguem, 0.3);
  // relógio enorme atrás do Bruno, ponteiros girando rápido
  const R = 400;
  const cx = 540;
  const cy = 1180;
  const ang1 = t * 900;
  const ang2 = t * 75;
  const relogio = ent(t, c.start, 0.5);
  return (
    <>
      <Svg o={relogio * 0.9}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={COR.borda} strokeWidth={6} />
        {Array.from({length: 12}).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <line key={i} x1={cx + Math.cos(a) * (R - 34)} y1={cy + Math.sin(a) * (R - 34)} x2={cx + Math.cos(a) * (R - 6)} y2={cy + Math.sin(a) * (R - 6)} stroke={COR.cinza1} strokeWidth={8} />;
        })}
        <line x1={cx} y1={cy} x2={cx + Math.cos(((ang1 - 90) * Math.PI) / 180) * (R - 60)} y2={cy + Math.sin(((ang1 - 90) * Math.PI) / 180) * (R - 60)} stroke={COR.ambar} strokeWidth={10} strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={cx + Math.cos(((ang2 - 90) * Math.PI) / 180) * (R - 140)} y2={cy + Math.sin(((ang2 - 90) * Math.PI) / 180) * (R - 140)} stroke={COR.claro} strokeWidth={14} strokeLinecap="round" />
      </Svg>
      <Abs x={90} y={398} w={900} h={210} o={k} dy={(1 - k) * 40} style={card({padding: 26})}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <div>
            <div style={txt(22, 600, COR.sec, {letterSpacing: '0.08em'})}>CURSO DE IA DA EMPRESA</div>
            <div style={txt(38, 600, COR.branco, {marginTop: 8})}>Esperando liberar…</div>
          </div>
          <svg width={64} height={64} viewBox="-35 -35 70 70" style={{transform: `rotate(${rot}deg)`}}>
            {Array.from({length: dots}).map((_, i) => {
              const a = (i / dots) * Math.PI * 2;
              return <circle key={i} cx={Math.cos(a) * 26} cy={Math.sin(a) * 26} r={4} fill={COR.branco} opacity={0.15 + 0.85 * (i / dots)} />;
            })}
          </svg>
        </div>
        <div style={{marginTop: 22, width: '100%', height: 22, background: COR.sup2, borderRadius: 4, overflow: 'hidden'}}>
          <div style={{width: `${prog}%`, minWidth: 6, height: '100%', background: COR.cinza1}} />
        </div>
        <div style={txt(24, 400, COR.sec, {marginTop: 10})}>{prog.toFixed(1).replace('.', ',')}% carregado</div>
      </Abs>
      <Abs x={560} y={590} w={440} o={cl(stamp)} s={1.4 - 0.4 * cl(stamp)} r={-4} style={{background: COR.ambar, borderRadius: 3, padding: '10px 18px', boxSizing: 'border-box', textAlign: 'center'}}>
        <span style={txt(40, 600, COR.preto)}>Não espera ninguém</span>
      </Abs>
    </>
  );
};

const CenaCiclo: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  // quatro nós num arco por cima/ao redor da cabeça
  const nodes = [
    {l: 'Testa', at: m.testa, x: 30, y: 960, icon: 'play'},
    {l: 'Erra', at: m.erra, x: 120, y: 420, icon: 'x'},
    {l: 'Estuda', at: m.estuda, x: 740, y: 420, icon: 'livro'},
    {l: 'Testa de novo', at: m.denovo, x: 830, y: 960, icon: 'loop'},
  ];
  const W = 220;
  const H = 120;
  const atual = nodes.reduce((acc, n, i) => (t >= n.at - 0.05 ? i : acc), -1);
  const centro = (n: (typeof nodes)[number]) => [n.x + W / 2, n.y + H / 2];
  const arco = 'M 140 960 C 120 700 180 560 230 540 M 340 480 C 500 440 580 440 740 480 M 850 540 C 900 560 960 700 940 960';
  const loop = ent(t, m.denovo + 0.25, 0.5);
  const per = 1.1;
  const ph = t > m.denovo + 0.4 ? ((t - m.denovo - 0.4) % per) / per : -1;
  // ponto viajando pelo laço de baixo (passa atrás do Bruno)
  const lx = 940 - ph * 800;
  const ly = 1150 + Math.sin(ph * Math.PI) * 260;
  const Icone: React.FC<{k: string; cor: string}> = ({k, cor}) => (
    <svg width={34} height={34} viewBox="0 0 34 34" style={{flexShrink: 0}}>
      {k === 'play' ? <path d="M8 5 L28 17 L8 29 Z" fill={cor} /> : null}
      {k === 'x' ? <path d="M7 7 L27 27 M27 7 L7 27" stroke={COR.erro} strokeWidth={5} /> : null}
      {k === 'livro' ? <path d="M4 7 L16 10 L16 29 L4 26 Z M30 7 L18 10 L18 29 L30 26 Z" fill={cor} /> : null}
      {k === 'loop' ? <path d="M27 17 A10 10 0 1 1 22 8 M22 3 L22 9 L28 9" stroke={cor} strokeWidth={4} fill="none" /> : null}
    </svg>
  );
  return (
    <>
      <Svg o={ent(t, c.start, 0.4)}>
        <path d={arco} stroke={COR.petroleoClaro} strokeWidth={6} fill="none" strokeDasharray="14 10" strokeDashoffset={-t * 60} />
      </Svg>
      <Svg o={loop}>
        <path d="M 940 1090 Q 540 1560 140 1090" stroke={COR.ambar} strokeWidth={6} fill="none" strokeDasharray="14 10" strokeDashoffset={t * 60} />
        {ph >= 0 ? <rect x={lx - 12} y={ly - 12} width={24} height={24} fill={COR.ambar} /> : null}
      </Svg>
      {nodes.map((n, i) => {
        const o = pop(t, n.at - 0.12, 0.3);
        const on = i === atual;
        const feito = t >= n.at - 0.05;
        const [cx, cy] = centro(n);
        return (
          <Abs key={i} x={n.x} y={n.y} w={W} h={H} o={cl(o)} s={(on ? 1.08 : 1) * (0.7 + 0.3 * cl(o))} origin={`${cx - n.x}px ${cy - n.y}px`} style={{
            background: on ? COR.ambar : feito ? COR.sup : COR.preto,
            border: `3px solid ${on ? COR.ambar : i === 1 && feito ? COR.erro : COR.petroleoClaro}`,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            boxSizing: 'border-box',
          }}>
            <Icone k={n.icon} cor={on ? COR.preto : COR.branco} />
            <span style={txt(n.l.length > 8 ? 28 : 38, 600, on ? COR.preto : COR.branco)}>{n.l}</span>
          </Abs>
        );
      })}
    </>
  );
};

const CenaCurso: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.4);
  const cert = ent(t, m.ninguem - 0.2, 0.4);
  const risca = ent(t, m.nenhum, 0.3);
  const zero = pop(t, m.curso, 0.35);
  // log de testes rolando atrás do Bruno (esquerda) e tentativas (direita)
  const linhas = 14;
  const scroll = Math.max(0, (t - c.start) * 3.2);
  const log = [];
  for (let i = 0; i < linhas; i++) {
    const n = Math.floor(scroll) + i + 1;
    const y = 830 + (i - (scroll % 1)) * 46;
    const ok = rnd(n) > 0.7;
    log.push(
      <div key={n} style={{position: 'absolute', left: 30, top: y, width: 220, display: 'flex', alignItems: 'center', gap: 10, opacity: k * cl((y - 820) / 40) * cl((1480 - y) / 60)}}>
        <span style={txt(22, 400, COR.sec, {fontVariantNumeric: 'tabular-nums'})}>teste {n}</span>
        <span style={txt(22, 600, ok ? COR.petroleoClaro : COR.erro)}>{ok ? 'deu certo' : 'errou'}</span>
      </div>,
    );
  }
  return (
    <>
      {log}
      <Abs x={830} y={830} w={230} h={380} o={ent(t, m.aprendi, 0.4)} style={card({padding: 18})}>
        <div style={txt(20, 600, COR.sec, {letterSpacing: '0.08em'})}>COMO EU APRENDI</div>
        {['Testando', 'Errando', 'Estudando', 'Testando de novo'].map((l, i) => (
          <div key={l} style={{display: 'flex', alignItems: 'center', gap: 10, marginTop: 18, opacity: ent(t, m.aprendi + 0.12 * i, 0.25)}}>
            <Check size={26} bg={i === 1 ? COR.erro : COR.petroleo} />
            <span style={txt(24, 600, COR.branco)}>{l}</span>
          </div>
        ))}
      </Abs>
      <Abs x={90} y={398} w={900} o={k}>
        <div style={txt(46, 600, COR.branco)}>Foi assim que eu aprendi</div>
      </Abs>
      <Abs x={90} y={470} w={620} h={210} o={cert} dy={(1 - cert) * 30} r={-1.5} style={{background: COR.claro, borderRadius: 4, border: `6px double ${COR.ambarEsc}`, padding: 22, boxSizing: 'border-box'}}>
        <div style={txt(20, 600, COR.ambarEsc, {letterSpacing: '0.12em'})}>CERTIFICADO DE CONCLUSÃO</div>
        <div style={txt(42, 600, COR.preto, {marginTop: 10})}>Curso de IA</div>
        <div style={{height: 3, width: 260, background: COR.cinza1, marginTop: 26}} />
        <div style={txt(18, 400, COR.cinza1, {marginTop: 6})}>assinatura da empresa</div>
        <div style={{position: 'absolute', left: -10, top: 98, width: `${640 * risca}px`, height: 12, background: COR.erro, transform: 'rotate(-8deg)', transformOrigin: 'left center'}} />
      </Abs>
      <Abs x={740} y={480} w={260} h={190} o={cl(zero)} s={1.5 - 0.5 * cl(zero)} r={6} style={{border: `5px solid ${COR.ambar}`, borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: COR.preto}}>
        <div style={txt(96, 300, COR.ambar, {lineHeight: 1})}>0</div>
        <div style={txt(28, 600, COR.branco)}>cursos</div>
      </Abs>
    </>
  );
};

const TILES = ['Texto', 'Imagem', 'Planilha', 'Código', 'Áudio', 'Pesquisa'];
const IconeIA: React.FC<{i: number}> = ({i}) => {
  const s = {stroke: COR.branco, strokeWidth: 4, fill: 'none'} as const;
  switch (i) {
    case 0:
      return (
        <svg width={48} height={48} viewBox="0 0 56 56"><rect x="4" y="8" width="48" height="32" rx="4" {...s} /><path d="M14 40 L14 50 L26 40" {...s} /><line x1="14" y1="20" x2="42" y2="20" {...s} /><line x1="14" y1="29" x2="34" y2="29" {...s} /></svg>
      );
    case 1:
      return (
        <svg width={48} height={48} viewBox="0 0 56 56"><rect x="4" y="8" width="48" height="40" rx="4" {...s} /><circle cx="19" cy="22" r="5" {...s} /><path d="M6 44 L22 30 L32 38 L40 30 L50 40" {...s} /></svg>
      );
    case 2:
      return (
        <svg width={48} height={48} viewBox="0 0 56 56"><rect x="4" y="6" width="48" height="44" rx="4" {...s} /><line x1="4" y1="20" x2="52" y2="20" {...s} /><line x1="4" y1="34" x2="52" y2="34" {...s} /><line x1="22" y1="6" x2="22" y2="50" {...s} /></svg>
      );
    case 3:
      return (
        <svg width={48} height={48} viewBox="0 0 56 56"><path d="M20 14 L6 28 L20 42" {...s} /><path d="M36 14 L50 28 L36 42" {...s} /><line x1="31" y1="10" x2="25" y2="46" {...s} /></svg>
      );
    case 4:
      return (
        <svg width={48} height={48} viewBox="0 0 56 56">{[8, 16, 24, 32, 40, 48].map((x, k) => <line key={k} x1={x} y1={28 - [6, 14, 20, 12, 18, 8][k]} x2={x} y2={28 + [6, 14, 20, 12, 18, 8][k]} {...s} />)}</svg>
      );
    default:
      return (
        <svg width={48} height={48} viewBox="0 0 56 56"><circle cx="24" cy="24" r="16" {...s} /><line x1="36" y1="36" x2="50" y2="50" {...s} /></svg>
      );
  }
};

const CenaIAs: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const btn = pop(t, c.start, 0.35);
  const click = m.segue + 0.3;
  const pressed = t >= click && t < click + 0.12;
  const seguindo = t >= click + 0.12;
  const cur = ent(t, c.start + 0.05, 0.4);
  const sai = ent(t, m.qual - 0.2, 0.25);
  const primeiro = pop(t, m.primeiro, 0.35);
  // corações / +1 subindo atrás do Bruno depois do clique
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
      <Abs x={290} y={440} w={500} h={130} o={cl(btn) * (1 - sai)} s={(pressed ? 0.92 : 1) * (0.7 + 0.3 * cl(btn))} style={{
        background: seguindo ? COR.sup2 : COR.petroleo,
        border: seguindo ? `2px solid ${COR.borda}` : 'none',
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        boxSizing: 'border-box',
      }}>
        {seguindo ? <Check size={44} bg={COR.petroleo} /> : null}
        <span style={txt(54, 600, COR.branco)}>{seguindo ? 'Seguindo' : 'Seguir'}</span>
      </Abs>
      {btn > 0 && sai < 1 ? (
        <Svg o={1 - sai}>
          <path transform={`translate(${900 - 300 * cur} ${700 - 160 * cur})`} d="M0 0 L0 46 L12 35 L21 55 L29 51 L20 32 L36 32 Z" fill={COR.branco} stroke={COR.preto} strokeWidth={3} />
        </Svg>
      ) : null}
      {TILES.map((l, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const o = pop(t, m.ia - 0.15 + i * 0.07, 0.3);
        const top = i === 2;
        const hl = top ? cl(primeiro) : 0;
        const dim = primeiro > 0 && !top ? 0.45 : 1;
        return (
          <Abs key={i} x={60 + col * 330} y={398 + row * 150} w={300} h={130} o={cl(o) * dim} s={(0.8 + 0.2 * cl(o)) * (1 + 0.08 * hl)} style={card({
            border: `${hl > 0.5 ? 4 : 1}px solid ${hl > 0.5 ? COR.ambar : COR.borda}`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 22px',
            gap: 16,
          })}>
            <IconeIA i={i} />
            <span style={txt(32, 600, COR.branco)}>{l}</span>
            {top ? (
              <div style={{position: 'absolute', right: -14, top: -16, background: COR.ambar, borderRadius: 2, padding: '4px 10px', opacity: hl, transform: `scale(${Math.max(0.01, hl)})`}}>
                <span style={txt(24, 600, COR.preto)}>1º</span>
              </div>
            ) : null}
          </Abs>
        );
      })}
      <Abs x={60} y={660} w={960} o={ent(t, m.aprender, 0.3) * (1 - primeiro * 0)} style={{textAlign: 'center'}}>
        <div style={txt(26, 400, COR.sec)}>qual aprender primeiro?</div>
      </Abs>
    </>
  );
};

const CenaComenta: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.35);
  const sim = 18 * ent(t, m.ensinou, 0.8);
  const nao = 82 * ent(t, m.ensinou + 0.1, 0.9);
  const bubbles = [
    {x: 24, y: 880, at: m.conta, w: 230, txt: 'nunca 😅'},
    {x: 826, y: 940, at: m.empresa, w: 230, txt: 'só Excel'},
    {x: 24, y: 1100, at: m.ensinou, w: 230, txt: 'aprendi sozinho'},
    {x: 826, y: 1160, at: m.ia, w: 230, txt: 'zero curso'},
    {x: 24, y: 1320, at: m.fala, w: 230, txt: 'me ensina!'},
  ];
  return (
    <>
      <Abs x={90} y={398} w={900} o={k} dy={(1 - k) * 30}>
        <div style={txt(56, 600, COR.branco)}>Sua empresa já te</div>
        <div style={txt(56, 600, COR.ambar)}>ensinou alguma IA?</div>
      </Abs>
      <Abs x={90} y={540} w={900} o={ent(t, m.ensinou - 0.3, 0.3)}>
        {[
          {l: 'Sim', v: sim, cor: COR.petroleo},
          {l: 'Não', v: nao, cor: COR.ambar},
        ].map((b, i) => (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: i ? 14 : 0}}>
            <span style={txt(30, 600, COR.branco, {width: 70})}>{b.l}</span>
            <div style={{flex: 1, height: 44, background: COR.sup2, borderRadius: 4, overflow: 'hidden'}}>
              <div style={{width: `${b.v}%`, height: '100%', background: b.cor}} />
            </div>
            <span style={txt(30, 600, COR.branco, {width: 90, textAlign: 'right', fontVariantNumeric: 'tabular-nums'})}>{Math.round(b.v)}%</span>
          </div>
        ))}
      </Abs>
      {bubbles.map((b, i) => {
        const o = pop(t, b.at, 0.35);
        return (
          <Abs key={i} x={b.x} y={b.y} w={b.w} o={cl(o)} s={0.7 + 0.3 * cl(o)} dy={(1 - cl(o)) * 30} origin={i % 2 ? 'right bottom' : 'left bottom'} style={{display: 'flex', gap: 10, alignItems: 'flex-start'}}>
            <div style={{width: 44, height: 44, borderRadius: 22, background: [COR.petroleo, COR.cobalto, COR.cinza1, COR.ambarEsc, COR.petroleoClaro][i], flexShrink: 0}} />
            <div style={card({flex: 1, padding: '12px 14px'})}>
              <span style={txt(22, 600, COR.claro)}>{b.txt}</span>
            </div>
          </Abs>
        );
      })}
    </>
  );
};

const CenaFinal: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const k = ent(t, c.start, 0.3);
  const w = ent(t, c.start + 0.25, 0.35);
  return (
    <>
      <Abs x={60} y={380} w={300} h={300} o={k}>
        <Sequence from={Math.round(c.start * 30)} layout="none">
          <Video src={staticFile('brand/logo-anim.webm')} style={{width: 300, height: 300}} muted />
        </Sequence>
      </Abs>
      <Abs x={390} y={470} w={620} o={w} dy={(1 - w) * 20}>
        <Img src={staticFile('brand/falaibruno-branco.svg')} style={{width: 580}} />
      </Abs>
    </>
  );
};

const CENAS: Record<string, React.FC<{t: number; c: Cena}>> = {
  vagas: CenaVagas,
  metade: CenaMetade,
  gupy: CenaGupy,
  areas: CenaAreas,
  requisitos: CenaRequisitos,
  detalhe: CenaDetalhe,
  treinamento: CenaTreinamento,
  empresa: CenaEmpresa,
  esperar: CenaEsperar,
  ciclo: CenaCiclo,
  curso: CenaCurso,
  ias: CenaIAs,
  comenta: CenaComenta,
  final: CenaFinal,
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
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: `scale(${zs})`,
              transformOrigin: '540px 1000px',
              WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000 80.5%, transparent 91%)',
              maskImage: 'linear-gradient(180deg, #000 0%, #000 80.5%, transparent 91%)',
            }}
          >
            <OffthreadVideo src={staticFile('pessoa_v.mov')} transparent muted style={{width: 1080, height: 1920}} />
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
