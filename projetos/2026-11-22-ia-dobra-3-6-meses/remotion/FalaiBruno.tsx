/**
 * FalaiBruno (A IA dobra a cada 3,6 meses, 22/11/2026) — palco em camadas para o 9:16 com o Bruno recortado (chroma key).
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
// ======================= CENAS (camada ELEMENTOS) — A IA dobra a cada 3,6 meses =======================
// Zona A (acima da cabeça): y 390–700. Centro (Bruno fora): y 760–1100 e 1250–1470 (a legenda fica em ~1120–1240).
// Laterais atrás do Bruno: x 20–250 / 830–1060, y 800–1500.
// Fronteira: nada do trabalho do Bruno. Nada de nome de pessoa real. A tela segue a fala (pedido do Bruno nesta rodada).

/** curva exponencial genérica (horizonte de tempo dobrando) */
const Curva: React.FC<{x: number; y: number; w: number; h: number; p: number; cor?: string; pontos?: boolean}> = ({x, y, w, h, p, cor = COR.ambar, pontos = true}) => {
  const N = 40;
  const pts: string[] = [];
  const lim = Math.max(1, Math.round(N * cl(p)));
  for (let k = 0; k <= lim; k++) {
    const u = k / N;
    const v = (Math.pow(2, u * 7) - 1) / (Math.pow(2, 7) - 1);
    pts.push(`${x + u * w},${y + h - v * h}`);
  }
  return (
    <Svg>
      <line x1={x} y1={y + h} x2={x + w} y2={y + h} stroke={COR.borda} strokeWidth={3} />
      <line x1={x} y1={y} x2={x} y2={y + h} stroke={COR.borda} strokeWidth={3} />
      <polyline points={pts.join(' ')} fill="none" stroke={cor} strokeWidth={8} strokeLinejoin="round" />
      {pontos
        ? [0.3, 0.45, 0.6, 0.72, 0.84, 0.94].map((u, i) => {
            if (u > p) return null;
            const v = (Math.pow(2, u * 7) - 1) / (Math.pow(2, 7) - 1);
            return <circle key={i} cx={x + u * w} cy={y + h - v * h} r={11} fill={COR.fundo} stroke={cor} strokeWidth={5} />;
          })
        : null}
    </Svg>
  );
};

/** ícone de pessoa genérico */
const Pessoa: React.FC<{size: number; cor?: string}> = ({size, cor = COR.sec}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{display: 'block'}}>
    <circle cx="20" cy="13" r="8" fill={cor} />
    <path d="M5 38 C5 27 12 22 20 22 C28 22 35 27 35 38 Z" fill={cor} />
  </svg>
);

/** chip da IA (quadrado com "IA") */
const ChipIA: React.FC<{size: number; cor?: string}> = ({size, cor = COR.ambar}) => (
  <div style={{width: size, height: size, borderRadius: size * 0.16, border: `${Math.max(3, size * 0.06)}px solid ${cor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', background: COR.sup}}>
    <span style={txt(size * 0.4, 600, cor)}>IA</span>
  </div>
);

/** relógio com ponteiro girando */
const Relogio: React.FC<{size: number; t: number; vel?: number; cor?: string}> = ({size, t, vel = 1, cor = COR.branco}) => {
  const a = t * 360 * vel;
  const r = size / 2;
  return (
    <svg width={size} height={size} style={{display: 'block'}}>
      <circle cx={r} cy={r} r={r - 5} fill={COR.sup} stroke={cor} strokeWidth={6} />
      {Array.from({length: 12}).map((_, i) => {
        const g = (i / 12) * Math.PI * 2;
        return <line key={i} x1={r + Math.sin(g) * (r - 14)} y1={r - Math.cos(g) * (r - 14)} x2={r + Math.sin(g) * (r - 24)} y2={r - Math.cos(g) * (r - 24)} stroke={COR.cinza1} strokeWidth={4} />;
      })}
      <line x1={r} y1={r} x2={r + Math.sin((a * Math.PI) / 180) * (r - 30)} y2={r - Math.cos((a * Math.PI) / 180) * (r - 30)} stroke={COR.ambar} strokeWidth={7} strokeLinecap="round" />
      <line x1={r} y1={r} x2={r + Math.sin((a * Math.PI) / 2160) * (r - 50)} y2={r - Math.cos((a * Math.PI) / 2160) * (r - 50)} stroke={cor} strokeWidth={8} strokeLinecap="round" />
      <circle cx={r} cy={r} r={8} fill={cor} />
    </svg>
  );
};

/** janela de código genérica */
const JanelaCodigo: React.FC<{w: number; t: number; a: number; linhas?: number}> = ({w, t, a, linhas = 6}) => (
  <div style={card({width: w, padding: 0, overflow: 'hidden'})}>
    <div style={{height: 40, background: COR.sup2, display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 16}}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{width: 14, height: 14, borderRadius: 7, background: COR.cinza1}} />
      ))}
    </div>
    <div style={{padding: 18}}>
      {Array.from({length: linhas}).map((_, i) => {
        const p = cl((t - a - i * 0.12) / 0.3);
        const ww = (0.35 + 0.55 * rnd(i + 3)) * (w - 60);
        return (
          <div key={i} style={{display: 'flex', gap: 10, marginBottom: 12, paddingLeft: (i % 3) * 26}}>
            <div style={{width: ww * 0.3 * p, height: 14, background: i % 2 ? COR.cobalto : COR.ambar, borderRadius: 7}} />
            <div style={{width: ww * 0.6 * p, height: 14, background: COR.cinza1, borderRadius: 7}} />
          </div>
        );
      })}
    </div>
  </div>
);

// 1 · "A cada três meses e meio, o tamanho do trabalho que a IA consegue fazer sozinha dobra."
const CenaGancho: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const pc = inOutCubic(cl((t - 0.1) / 4.6));
  const k = ent(t, HOOK_FIM + 0.05, 0.35);
  const x2 = pop(t, m.dobra - 0.15, 0.35);
  return (
    <>
      {/* curva subindo atrás do Bruno, ocupando o quadro */}
      <Curva x={70} y={760} w={940} h={700} p={pc} />
      {/* barras dobrando nas laterais */}
      {[0, 1, 2, 3].map((i) => {
        const hh = 40 * Math.pow(2, i) * ent(t, 0.4 + i * 0.9, 0.4);
        return <div key={i} style={{position: 'absolute', left: i < 2 ? 40 + i * 90 : 850 + (i - 2) * 100, top: 1500 - hh, width: 70, height: hh, background: i === 3 ? COR.ambar : COR.sup2, border: `1px solid ${i === 3 ? COR.ambar : COR.borda}`, borderRadius: '3px 3px 0 0'}} />;
      })}
      <Abs x={90} y={400} w={900} o={k} dy={(1 - k) * 20}>
        <div style={txt(40, 400, COR.sec)}>a cada</div>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 28}}>
          <span style={txt(112, 600, COR.ambar, {lineHeight: 1, whiteSpace: 'nowrap'})}>3 meses e meio</span>
        </div>
      </Abs>
      <Abs x={90} y={600} w={900} o={cl(x2)} s={0.6 + 0.4 * cl(x2)} origin="left center" style={{display: 'flex', alignItems: 'center', gap: 18}}>
        <span style={txt(40, 400, COR.claro)}>o trabalho que a IA faz sozinha</span>
        <span style={{...txt(52, 600, COR.preto), background: COR.ambar, padding: '2px 16px', borderRadius: 3}}>×2</span>
      </Abs>
    </>
  );
};

// 2 · "Mas um teste novo mostrou aonde ela ainda perde pra você."
const CenaPerde: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.3);
  const v = pop(t, m.voce - 0.1, 0.35);
  const pulse = 1 + 0.04 * Math.sin(t * 8);
  return (
    <>
      <Abs x={90} y={420} w={900} o={k} dy={(1 - k) * 20}>
        <div style={card({padding: '26px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'})}>
          <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
            <ChipIA size={96} />
            <span style={txt(56, 600, COR.branco)}>IA</span>
          </div>
          <span style={txt(64, 300, COR.sec)}>×</span>
          <div style={{display: 'flex', alignItems: 'center', gap: 20, opacity: cl(v), transform: `scale(${(0.6 + 0.4 * cl(v)) * (t > m.voce + 0.3 ? pulse : 1)})`}}>
            <span style={txt(56, 600, COR.ambar)}>você</span>
            <div style={{width: 96, height: 96, borderRadius: 48, background: COR.sup2, border: `4px solid ${COR.ambar}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <Pessoa size={64} cor={COR.ambar} />
            </div>
          </div>
        </div>
      </Abs>
      {/* teste novo: prancheta atrás do Bruno */}
      <Abs x={30} y={880} w={220} o={ent(t, m.teste - 0.1, 0.3)} r={-5} style={card({padding: 18})}>
        <div style={txt(22, 600, COR.ambar, {letterSpacing: '0.08em'})}>TESTE NOVO</div>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, opacity: ent(t, m.teste + 0.2 + i * 0.25, 0.25)}}>
            {i < 3 ? <Check size={28} /> : <Xis size={28} />}
            <div style={{height: 12, width: 120, background: COR.cinza1, borderRadius: 6}} />
          </div>
        ))}
      </Abs>
      <Abs x={830} y={900} w={220} h={220} o={ent(t, m.perde - 0.1, 0.3)} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <span style={txt(200, 300, COR.ambar, {transform: `rotate(${Math.sin(t * 3) * 6}deg)`})}>?</span>
      </Abs>
    </>
  );
};

// 3 · "Quem mede isso é o METR. Eu não sei como se pronuncia, mas é um laboratório independente que testa os modelos de IA."
const CenaMetr: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const nome = pop(t, m.metr - 0.15, 0.35);
  const bal = pop(t, m.pron, 0.3);
  const balOut = cl((m.lab - 0.1 - t) / 0.2);
  const lab = ent(t, m.lab - 0.05, 0.35);
  return (
    <>
      <Abs x={90} y={400} w={900} o={cl(nome)} s={0.7 + 0.3 * cl(nome)} origin="left center">
        <div style={txt(150, 600, COR.branco, {lineHeight: 1, letterSpacing: '0.02em'})}>METR</div>
      </Abs>
      <Abs x={560} y={410} w={420} o={cl(bal) * balOut} s={0.6 + 0.4 * cl(bal)} origin="left bottom">
        <div style={card({padding: '14px 22px', borderColor: COR.ambar, borderWidth: 3})}>
          <span style={txt(44, 600, COR.ambar)}>“mé-ter”?</span>
        </div>
      </Abs>
      <Abs x={90} y={580} w={900} o={lab} dy={(1 - lab) * 16}>
        <Tag t="laboratório independente" size={34} bg={COR.petroleo} fg={COR.branco} />
      </Abs>
      {/* modelos sendo testados atrás do Bruno */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const lado = i % 2;
        const row = Math.floor(i / 2);
        const a = m.modelos - 1.4 + i * 0.22;
        const o = ent(t, a, 0.3);
        const ok = t > m.modelos + 0.2 + i * 0.12;
        return (
          <Abs key={i} x={lado ? 846 : 34} y={860 + row * 200} w={200} h={170} o={o} style={card({padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12})}>
            <ChipIA size={70} cor={COR.claro} />
            <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
              <span style={txt(22, 600, COR.sec)}>modelo {String.fromCharCode(65 + i)}</span>
              {ok ? <Check size={24} bg={COR.cobalto} /> : null}
            </div>
          </Abs>
        );
      })}
    </>
  );
};

// 4 · "E a atualização saiu agora, dia 20 de novembro."
const CenaData: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.3);
  const n = pop(t, m.vinte - 0.1, 0.4);
  return (
    <>
      <Abs x={90} y={420} w={900} o={k} dy={(1 - k) * 20} style={{display: 'flex', alignItems: 'center', gap: 40}}>
        <div style={{width: 240, borderRadius: 8, overflow: 'hidden', border: `2px solid ${COR.borda}`, background: COR.sup, transform: `scale(${0.7 + 0.3 * cl(n)})`}}>
          <div style={{background: COR.ambar, padding: '8px 0', textAlign: 'center', ...txt(34, 600, COR.preto, {letterSpacing: '0.1em'})}}>NOV</div>
          <div style={{textAlign: 'center', padding: '10px 0 18px', ...txt(120, 600, COR.branco, {lineHeight: 1})}}>{t < m.vinte - 0.1 ? Math.min(19, 1 + Math.floor((t - c.start) * 9)) : 20}</div>
        </div>
        <div>
          <div style={txt(40, 400, COR.sec)}>atualização</div>
          <div style={txt(72, 600, COR.branco, {marginTop: 8})}>saiu agora</div>
          <div style={txt(34, 400, COR.sec, {marginTop: 8})}>20/11/2026</div>
        </div>
      </Abs>
      {/* gráfico novo sendo publicado, atrás do Bruno */}
      <Abs x={830} y={900} w={220} o={ent(t, c.start + 0.3, 0.3)} style={card({padding: 14})}>
        <div style={txt(20, 600, COR.ambar, {letterSpacing: '0.08em'})}>NOVO</div>
        <div style={{position: 'relative', width: 192, height: 150}}>
          <Curva x={0} y={0} w={190} h={140} p={inOutCubic(cl((t - c.start - 0.4) / 1.6))} pontos={false} />
        </div>
      </Abs>
      <Abs x={30} y={940} w={220} o={ent(t, c.start + 0.5, 0.3)} style={card({padding: 14})}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{height: 12, width: 60 + 110 * rnd(i + 9), background: i === 0 ? COR.branco : COR.cinza1, borderRadius: 6, marginBottom: 12}} />
        ))}
      </Abs>
    </>
  );
};

// 5 · "Funciona assim. Eles pegam tarefas de programação e pesquisa e medem quanto tempo um especialista humano leva pra fazer cada uma." (sem o Bruno)
const TAREFAS = [
  {t: 'corrigir um bug', h: '15 min', ic: 'cod'},
  {t: 'treinar um modelo', h: '4 h', ic: 'cod'},
  {t: 'revisar um artigo', h: '2 h', ic: 'pesq'},
  {t: 'montar um experimento', h: '8 h', ic: 'pesq'},
];
const CenaMetodo1: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.3);
  return (
    <>
      <Abs x={90} y={400} w={900} o={k} dy={(1 - k) * 20}>
        <div style={txt(40, 400, COR.sec)}>funciona assim</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 22, marginTop: 10}}>
          <span style={{...txt(40, 600, COR.preto), background: COR.ambar, padding: '4px 16px', borderRadius: 3}}>1</span>
          <span style={txt(60, 600, COR.branco)}>tempo de um especialista</span>
        </div>
      </Abs>
      {/* tarefas entrando */}
      {TAREFAS.map((x, i) => {
        const a = (i < 2 ? m.prog : m.pesq) - 0.3 + (i % 2) * 0.25;
        const o = ent(t, a, 0.3);
        const tm = ent(t, m.tempo + i * 0.35, 0.3);
        const y = i < 2 ? 760 + i * 170 : 1260 + (i - 2) * 110;
        return (
          <Abs key={i} x={90} y={i < 2 ? y : 1250 + (i - 2) * 98} w={900} h={i < 2 ? 150 : 86} o={o} dx={(1 - o) * -60} style={card({padding: '0 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'})}>
            <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
              <div style={{width: 64, height: 64, borderRadius: 6, background: x.ic === 'cod' ? COR.cobalto : COR.petroleo, display: 'flex', alignItems: 'center', justifyContent: 'center', ...txt(28, 600, COR.branco)}}>{x.ic === 'cod' ? '</>' : '⌕'}</div>
              <div>
                <div style={txt(i < 2 ? 40 : 34, 600, COR.branco)}>{x.t}</div>
                {i < 2 ? <div style={txt(24, 400, COR.sec, {marginTop: 6})}>{x.ic === 'cod' ? 'programação' : 'pesquisa'}</div> : null}
              </div>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 16, opacity: tm}}>
              <Pessoa size={44} cor={COR.claro} />
              <span style={txt(44, 600, COR.ambar, {fontVariantNumeric: 'tabular-nums'})}>{x.h}</span>
            </div>
          </Abs>
        );
      })}
      {/* cronômetro do especialista */}
      <Abs x={800} y={396} w={190} h={190} o={ent(t, m.esp - 0.2, 0.3)}>
        <Relogio size={190} t={t - c.start} vel={0.6} />
      </Abs>
    </>
  );
};

// 6 · "Depois veem qual é a maior tarefa que a IA consegue fazer sozinha. Acertando pelo menos metade das vezes." (sem o Bruno)
const DEGRAUS = ['1 min', '15 min', '1 h', '4 h', '1 dia', '3 dias'];
const CenaMetodo2: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.3);
  // a IA sobe os degraus até falhar no último
  const sobe = cl((t - m.ia) / 1.8) * 4;
  const meta = ent(t, m.metade - 0.2, 0.35);
  return (
    <>
      <Abs x={90} y={400} w={900} o={k} dy={(1 - k) * 20}>
        <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
          <span style={{...txt(40, 600, COR.preto), background: COR.ambar, padding: '4px 16px', borderRadius: 3}}>2</span>
          <span style={txt(60, 600, COR.branco)}>a maior tarefa</span>
        </div>
        <div style={txt(44, 400, COR.claro, {marginTop: 14})}>que a IA faz sozinha</div>
      </Abs>
      {/* escada de tarefas por tamanho */}
      {DEGRAUS.map((d, i) => {
        const hh = 90 + i * 56;
        const o = ent(t, c.start + 0.2 + i * 0.1, 0.3);
        const ok = sobe >= i + 0.5;
        const falha = i === 5 && t > m.ia + 2.0;
        return (
          <Abs key={i} x={90 + i * 152} y={1100 - hh} w={136} h={hh} o={o} style={{background: ok ? COR.petroleo : falha ? '#3a1f1f' : COR.sup2, border: `2px solid ${ok ? COR.petroleoClaro : falha ? COR.erro : COR.borda}`, borderRadius: '4px 4px 0 0', boxSizing: 'border-box', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 12}}>
            <span style={txt(26, 600, COR.branco)}>{d}</span>
          </Abs>
        );
      })}
      {/* chip da IA subindo */}
      {(() => {
        const s = Math.min(sobe, 4);
        const i0 = Math.floor(s);
        const f = s - i0;
        const hA = 90 + i0 * 56;
        const hB = 90 + Math.min(5, i0 + 1) * 56;
        const x = 90 + (i0 + f) * 152 + 28;
        const y = 1100 - (hA + (hB - hA) * outCubic(f)) - 90 - Math.sin(f * Math.PI) * 30;
        return (
          <Abs x={x} y={y} w={80} h={80} o={ent(t, m.ia - 0.3, 0.3)}>
            <ChipIA size={80} />
          </Abs>
        );
      })()}
      {/* acerto em metade das vezes */}
      <Abs x={90} y={1270} w={900} o={meta} dy={(1 - meta) * 20} style={card({padding: '18px 24px'})}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <span style={txt(38, 600, COR.branco)}>acerta pelo menos</span>
          <span style={txt(54, 600, COR.ambar)}>50%</span>
        </div>
        <div style={{display: 'flex', gap: 10, marginTop: 16}}>
          {Array.from({length: 10}).map((_, i) => {
            const on = t > m.metade + i * 0.07;
            return <div key={i} style={{flex: 1, height: 30, borderRadius: 4, background: !on ? COR.sup2 : i % 2 === 0 ? COR.petroleo : COR.erro}} />;
          })}
        </div>
      </Abs>
    </>
  );
};

// 7 · "Em março do ano passado, era uma tarefa de uma hora. Hoje, a estimativa são de tarefas de até 27 horas." (sem o Bruno)
const CenaEvolucao: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.3);
  const a1 = ent(t, m.hora - 0.4, 0.5);
  const cresce = inOutCubic(cl((t - m.hoje) / (m.h27 - m.hoje + 0.3)));
  const horas = 1 + 26 * cresce;
  const L = 860; // régua
  const x0 = 110;
  const pxH = L / 27;
  return (
    <>
      <Abs x={90} y={400} w={900} o={k} dy={(1 - k) * 20}>
        <div style={txt(40, 400, COR.sec)}>maior tarefa que a IA termina sozinha</div>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 20, marginTop: 10}}>
          <span style={txt(40, 400, COR.claro)}>{t < m.hoje ? 'mar/2025' : 'hoje'}</span>
          <span style={txt(150, 600, t < m.hoje ? COR.branco : COR.ambar, {lineHeight: 1, fontVariantNumeric: 'tabular-nums'})}>{t < m.hoje ? '1 h' : `${t < m.h27 + 0.3 ? Math.round(horas) : 27} h`}</span>
        </div>
      </Abs>
      {/* régua de tempo */}
      <Svg>
        <line x1={x0} y1={1000} x2={x0 + L} y2={1000} stroke={COR.borda} strokeWidth={4} />
        {Array.from({length: 28}).map((_, i) => (
          <line key={i} x1={x0 + i * pxH} y1={i % 8 === 0 ? 975 : 988} x2={x0 + i * pxH} y2={1000} stroke={i % 8 === 0 ? COR.sec : COR.cinza1} strokeWidth={3} />
        ))}
      </Svg>
      {[0, 8, 16, 24].map((h) => (
        <Abs key={h} x={x0 + h * pxH - 40} y={1016} w={80} style={{textAlign: 'center', ...txt(24, 400, COR.sec)}}>
          {h} h
        </Abs>
      ))}
      {/* barra 2025 */}
      <Abs x={x0} y={860} w={pxH * a1} h={70} style={{background: COR.branco, borderRadius: 3}} />
      <Abs x={x0} y={810} w={400} o={a1} style={txt(28, 600, COR.claro)}>
        mar/2025 · 1 h
      </Abs>
      {/* barra de hoje */}
      <Abs x={x0} y={1270} w={pxH * horas * ent(t, m.hoje - 0.1, 0.2)} h={90} style={{background: COR.ambar, borderRadius: 3}} />
      <Abs x={x0} y={1380} w={900} o={ent(t, m.hoje, 0.3)} style={{display: 'flex', alignItems: 'baseline', gap: 16}}>
        <span style={txt(34, 600, COR.ambar)}>hoje · até 27 h</span>
        <span style={txt(28, 400, COR.sec, {opacity: ent(t, m.estimativa, 0.3)})}>estimativa</span>
      </Abs>
    </>
  );
};

// 8 · "Mais de 3 dias de expediente." (Bruno volta com punch-in)
const CenaDias: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  return (
    <>
      <Abs x={90} y={400} w={900}>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 18, opacity: ent(t, c.start, 0.25)}}>
          <span style={txt(40, 400, COR.sec)}>mais de</span>
          <span style={txt(120, 600, COR.ambar, {lineHeight: 1})}>3 dias</span>
        </div>
        <div style={txt(48, 600, COR.branco, {marginTop: 10, opacity: ent(t, m.exp - 0.15, 0.3)})}>de expediente</div>
      </Abs>
      {/* três dias de trabalho de 8 h enchendo, atrás do Bruno */}
      {[0, 1, 2].map((i) => {
        const p = cl((t - c.start - 0.1 - i * 0.4) / 0.45);
        const lado = i === 1 ? 1 : 0;
        const x = i === 0 ? 40 : i === 1 ? 850 : 40;
        const y = i === 2 ? 1180 : 880;
        return (
          <Abs key={i} x={x} y={y} w={190} h={260} o={ent(t, c.start + i * 0.15, 0.2)} style={card({padding: 12, display: 'flex', flexDirection: 'column', gap: 8})}>
            <div style={txt(22, 600, COR.sec, {letterSpacing: '0.06em'})}>DIA {i + 1}</div>
            <div style={{flex: 1, position: 'relative', background: COR.sup2, borderRadius: 4, overflow: 'hidden'}}>
              <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: `${p * 100}%`, background: COR.ambar}} />
            </div>
            <div style={txt(22, 600, COR.claro)}>8 h</div>
          </Abs>
        );
      })}
    </>
  );
};

// 9 · "Pra comparar com gente de verdade, eles contratam especialistas pagando até 350 dólares por hora."
const CenaEspecialistas: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.3);
  const roll = inOutCubic(cl((t - m.n350 + 0.4) / 0.8));
  return (
    <>
      <Abs x={90} y={400} w={900} o={k} dy={(1 - k) * 20}>
        <div style={txt(40, 400, COR.sec)}>especialistas contratados</div>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 10, opacity: ent(t, m.n350 - 0.5, 0.3)}}>
          <span style={txt(40, 400, COR.claro)}>até</span>
          <span style={txt(140, 600, COR.ambar, {lineHeight: 1, fontVariantNumeric: 'tabular-nums'})}>US$ {Math.round(350 * roll)}</span>
          <span style={txt(48, 600, COR.branco)}>/hora</span>
        </div>
      </Abs>
      {/* especialistas atrás do Bruno, com crachá "especialista" genérico */}
      {Array.from({length: 6}).map((_, i) => {
        const lado = i % 2;
        const row = Math.floor(i / 2);
        const o = pop(t, m.esp - 0.4 + i * 0.12, 0.35);
        return (
          <Abs key={i} x={lado ? 850 : 40} y={860 + row * 210} w={190} h={180} o={cl(o)} s={0.7 + 0.3 * cl(o)} style={card({padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10})}>
            <div style={{width: 90, height: 90, borderRadius: 45, background: COR.sup2, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <Pessoa size={64} cor={[COR.claro, COR.sec, COR.petroleoClaro][i % 3]} />
            </div>
            <div style={{height: 12, width: 120, background: COR.cinza1, borderRadius: 6}} />
            <div style={txt(20, 600, COR.ambar, {opacity: t > m.n350 ? 1 : 0})}>$ $ $</div>
          </Abs>
        );
      })}
      {/* notas subindo */}
      {Array.from({length: 8}).map((_, i) => {
        const tt = t - m.n350 - i * 0.18;
        if (tt < 0) return null;
        const y = 1500 - tt * 260;
        return <div key={i} style={{position: 'absolute', left: i % 2 ? 870 + 60 * rnd(i) : 60 + 60 * rnd(i + 4), top: y, width: 80, height: 40, background: COR.petroleo, border: `2px solid ${COR.petroleoClaro}`, borderRadius: 3, opacity: cl(1 - tt / 3), ...txt(24, 600, COR.branco), textAlign: 'center', lineHeight: '36px'}}>$</div>;
      })}
    </>
  );
};

// 10 · "Na maioria das vezes eles não acham ninguém melhor do que a IA." (sem o Bruno)
const CenaNinguem: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.3);
  // lupa varre a grade de pessoas
  const p = cl((t - c.start - 0.2) / 2.0);
  const lx = 140 + 800 * (0.5 + 0.5 * Math.sin(p * Math.PI * 2.5 - Math.PI / 2));
  const ly = 800 + 260 * p;
  const placar = pop(t, m.ia - 0.2, 0.35);
  return (
    <>
      <Abs x={90} y={400} w={900} o={k} dy={(1 - k) * 20}>
        <div style={txt(40, 400, COR.sec)}>na maioria das vezes</div>
        <div style={txt(70, 600, COR.branco, {marginTop: 8})}>ninguém melhor que a IA</div>
      </Abs>
      {/* grade de especialistas */}
      {Array.from({length: 24}).map((_, i) => {
        const col = i % 8;
        const row = Math.floor(i / 8);
        const x = 110 + col * 112;
        const y = 760 + row * 120;
        const visto = Math.hypot(lx - x - 40, ly - y - 40) < 120;
        return (
          <Abs key={i} x={x} y={y} w={80} h={80} o={ent(t, c.start + i * 0.02, 0.2)}>
            <Pessoa size={80} cor={visto ? COR.claro : COR.cinza1} />
          </Abs>
        );
      })}
      <Abs x={lx - 70} y={ly - 70} w={140} h={140} o={cl(1 - ent(t, m.ia - 0.3, 0.3))}>
        <svg width={140} height={140}>
          <circle cx={60} cy={60} r={46} fill="none" stroke={COR.ambar} strokeWidth={8} />
          <line x1={94} y1={94} x2={130} y2={130} stroke={COR.ambar} strokeWidth={12} strokeLinecap="round" />
        </svg>
      </Abs>
      {/* placar */}
      <Abs x={90} y={1270} w={900} o={cl(placar)} s={0.8 + 0.2 * cl(placar)} style={card({padding: '20px 26px', borderColor: COR.petroleoClaro, borderWidth: 3})}>
        <div style={txt(24, 600, COR.sec, {letterSpacing: '0.08em'})}>PLACAR · PROGRAMAÇÃO</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: 10}}>
          <Check size={44} />
          <span style={txt(50, 600, COR.petroleoClaro)}>IA empata ou ganha</span>
        </div>
      </Abs>
    </>
  );
};

// 11 · "Eles também colocam a IA em competições de otimização que duram meses contra centenas de pessoas." (sem o Bruno)
const CenaCompeticoes: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.3);
  const n = Math.round(300 * inOutCubic(cl((t - m.centenas + 0.4) / 1.0)));
  return (
    <>
      <Abs x={90} y={400} w={900} o={k} dy={(1 - k) * 20}>
        <div style={txt(40, 400, COR.sec)}>competições de otimização</div>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 10}}>
          <span style={txt(70, 600, COR.branco)}>duram</span>
          <span style={txt(90, 600, COR.ambar, {opacity: ent(t, m.meses - 0.2, 0.3), lineHeight: 1})}>meses</span>
        </div>
      </Abs>
      {/* centenas de pessoas (pontos) + a IA */}
      {Array.from({length: 240}).map((_, i) => {
        const col = i % 20;
        const row = Math.floor(i / 20);
        const a = m.centenas - 0.6 + rnd(i) * 1.0;
        const o = ent(t, a, 0.25);
        const ja = (Math.sin(t * 3 + i) * 2) | 0;
        return <div key={i} style={{position: 'absolute', left: 104 + col * 44 + ja, top: 760 + row * 28 + (row >= 12 ? 0 : 0), width: 22, height: 22, borderRadius: 11, background: COR.cinza1, opacity: o}} />;
      })}
      <Abs x={490} y={1270} w={100} h={100} o={pop(t, m.comp - 0.1, 0.35)}>
        <ChipIA size={100} />
      </Abs>
      <Abs x={90} y={1390} w={900} o={ent(t, m.centenas, 0.3)} style={{textAlign: 'center', ...txt(34, 600, COR.claro)}}>
        IA contra <span style={{color: COR.ambar, fontVariantNumeric: 'tabular-nums'}}>{n > 0 ? 'centenas' : ''}</span> de pessoas
      </Abs>
    </>
  );
};

// 12 · "A IA teve 48 horas. As pessoas, uns 3 meses." (sem o Bruno)
const CenaHoras: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const a = ent(t, m.h48 - 0.3, 0.35);
  const b = ent(t, m.pessoas - 0.2, 0.35);
  const barA = inOutCubic(cl((t - m.h48 + 0.1) / 0.6));
  const barB = inOutCubic(cl((t - m.meses3 + 0.1) / 1.1));
  const W = 840;
  // 48 h contra ~90 dias: barra da IA = 2/90 da largura (mínimo visível)
  return (
    <>
      <Abs x={90} y={400} w={900} o={ent(t, c.start, 0.3)}>
        <div style={txt(40, 400, COR.sec)}>tempo de cada um</div>
      </Abs>
      <Abs x={90} y={470} w={900} o={a} dy={(1 - a) * 20} style={{display: 'flex', alignItems: 'center', gap: 22}}>
        <ChipIA size={110} />
        <div>
          <div style={txt(40, 600, COR.claro)}>IA</div>
          <div style={txt(110, 600, COR.ambar, {lineHeight: 1})}>48 h</div>
        </div>
      </Abs>
      <Abs x={110} y={760} w={Math.max(16, (W * 2) / 90) * barA} h={80} style={{background: COR.ambar, borderRadius: 3}} />
      <Abs x={110} y={860} w={900} o={b} style={{display: 'flex', alignItems: 'center', gap: 22}}>
        <div style={{width: 110, height: 110, borderRadius: 55, background: COR.sup2, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Pessoa size={76} cor={COR.claro} />
        </div>
        <div>
          <div style={txt(40, 600, COR.claro)}>pessoas</div>
          <div style={txt(90, 600, COR.branco, {lineHeight: 1, opacity: ent(t, m.meses3 - 0.2, 0.3)})}>~3 meses</div>
        </div>
      </Abs>
      <Abs x={110} y={1260} w={W * barB} h={80} style={{background: COR.branco, borderRadius: 3}} />
      {/* folhas de calendário caindo ao longo da barra das pessoas */}
      {Array.from({length: 12}).map((_, i) => {
        const at = m.meses3 + i * 0.09;
        const o = ent(t, at, 0.15);
        return (
          <Abs key={i} x={110 + i * 70} y={1360} w={60} h={70} o={o * barB} style={card({padding: 0, overflow: 'hidden', textAlign: 'center'})}>
            <div style={{height: 16, background: COR.cinza1}} />
            <div style={txt(26, 600, COR.claro, {marginTop: 8})}>{(i % 30) + 1}</div>
          </Abs>
        );
      })}
    </>
  );
};

// 13 · "E mesmo assim ela ficou entre os 4% melhores." (Bruno volta)
const CenaTop4: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const big = pop(t, m.top - 0.15, 0.4);
  return (
    <>
      <Abs x={90} y={400} w={900} o={ent(t, c.start, 0.3)}>
        <div style={txt(40, 400, COR.sec)}>mesmo assim, ficou entre os</div>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 6}}>
          <span style={{...txt(150, 600, COR.ambar, {lineHeight: 1}), display: 'inline-block', opacity: cl(big), transform: `scale(${0.6 + 0.4 * cl(big)})`, transformOrigin: 'left center'}}>4%</span>
          <span style={txt(60, 600, COR.branco, {opacity: ent(t, m.melhores - 0.1, 0.3)})}>melhores</span>
        </div>
      </Abs>
      {/* ranking de 100 nas laterais: 4 de cima acesos */}
      {[0, 1].map((lado) => (
        <Abs key={lado} x={lado ? 850 : 40} y={820} w={190} h={620} style={card({padding: 12})}>
          {Array.from({length: 50}).map((_, i) => {
            const rank = lado * 50 + i;
            const on = rank < 4 && t > m.top + rank * 0.08;
            const ia = rank === 2;
            return <div key={i} style={{display: 'inline-block', width: 26, height: 26, margin: 4, borderRadius: 4, background: on ? (ia ? COR.ambar : COR.claro) : COR.sup2, opacity: ent(t, c.start + i * 0.01, 0.2)}} />;
          })}
        </Abs>
      ))}
    </>
  );
};

// 14 · "Mas aqui vem a parte que ninguém tá falando." (regancho, explosão 3D, punch-in)
const CenaRegancho: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = pop(t, m.ninguem - 0.2, 0.35);
  return (
    <>
      <Abs x={90} y={420} w={900} o={cl(k)} s={0.8 + 0.2 * cl(k)} origin="left center">
        <span style={{...txt(64, 600, COR.preto), background: COR.ambar, padding: '8px 22px', borderRadius: 3, lineHeight: 1.3}}>a parte que ninguém</span>
        <div style={{marginTop: 16}}>
          <span style={{...txt(64, 600, COR.preto), background: COR.ambar, padding: '8px 22px', borderRadius: 3, lineHeight: 1.3}}>tá falando</span>
        </div>
      </Abs>
      {/* alto-falantes mudos nas laterais */}
      {[0, 1].map((l) => (
        <Abs key={l} x={l ? 860 : 50} y={950} w={170} h={170} o={ent(t, c.start + 0.2, 0.3)}>
          <svg width={170} height={170} viewBox="0 0 170 170">
            <path d="M30 65 H60 L100 30 V140 L60 105 H30 Z" fill={COR.sup2} stroke={COR.sec} strokeWidth={5} />
            <path d="M118 60 L150 110 M150 60 L118 110" stroke={COR.erro} strokeWidth={8} strokeLinecap="round" />
          </svg>
        </Abs>
      ))}
    </>
  );
};

// 15 · "Quando a tarefa pede julgamento, decidir sem uma resposta certa para conferir, a IA foi pior do que os especialistas." (sem o Bruno)
const CenaJulgamento: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.3);
  const gab = ent(t, m.conferir - 0.6, 0.35);
  const virada = cl((t - m.pior + 0.1) / 0.45);
  const ang = Math.sin(t * 2.2) * 8 * (1 - virada) + 14 * virada;
  return (
    <>
      <Abs x={90} y={400} w={900} o={k} dy={(1 - k) * 20}>
        <div style={txt(40, 400, COR.sec)}>quando a tarefa pede</div>
        <div style={txt(110, 600, COR.ambar, {lineHeight: 1, marginTop: 6})}>julgamento</div>
      </Abs>
      {/* balança: IA × especialista */}
      <Svg o={ent(t, m.decidir - 0.3, 0.35)}>
        <g transform={`rotate(${ang} 540 820)`}>
          <line x1={300} y1={820} x2={780} y2={820} stroke={COR.claro} strokeWidth={8} />
          <line x1={300} y1={820} x2={300} y2={900} stroke={COR.sec} strokeWidth={4} />
          <line x1={780} y1={820} x2={780} y2={900} stroke={COR.sec} strokeWidth={4} />
          <rect x={220} y={900} width={160} height={14} fill={COR.sec} />
          <rect x={700} y={900} width={160} height={14} fill={COR.sec} />
        </g>
        <polygon points="540,820 500,1080 580,1080" fill={COR.sup2} stroke={COR.borda} strokeWidth={3} />
        <circle cx={540} cy={820} r={14} fill={COR.ambar} />
      </Svg>
      {(() => {
        const r = (ang * Math.PI) / 180;
        const yA = 820 - Math.sin(r) * 240;
        const yB = 820 + Math.sin(r) * 240;
        const o = ent(t, m.decidir - 0.3, 0.35);
        return (
          <>
            <Abs x={300 - 50 - Math.cos(r) * 0} y={yA - 30 + 0} w={100} h={100} o={o} dx={(Math.cos(r) - 1) * 240}>
              <ChipIA size={100} />
            </Abs>
            <Abs x={780 - 50} y={yB - 30} w={100} h={100} o={o} dx={-(Math.cos(r) - 1) * 240} style={{display: 'flex', justifyContent: 'center'}}>
              <Pessoa size={100} cor={virada > 0.5 ? COR.ambar : COR.claro} />
            </Abs>
          </>
        );
      })()}
      {/* gabarito vazio */}
      <Abs x={90} y={1270} w={420} o={gab * (1 - virada)} style={card({padding: '16px 20px'})}>
        <div style={txt(24, 600, COR.sec, {letterSpacing: '0.08em'})}>GABARITO</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, marginTop: 10}}>
          <span style={txt(64, 300, COR.ambar)}>?</span>
          <span style={txt(30, 400, COR.claro)}>sem resposta certa</span>
        </div>
      </Abs>
      {/* placar vira */}
      <Abs x={90} y={1270} w={900} o={virada} s={0.85 + 0.15 * virada} style={card({padding: '20px 26px', borderColor: COR.ambar, borderWidth: 3})}>
        <div style={txt(24, 600, COR.sec, {letterSpacing: '0.08em'})}>PLACAR · JULGAMENTO</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: 10}}>
          <Pessoa size={48} cor={COR.ambar} />
          <span style={txt(50, 600, COR.ambar)}>especialistas ganham</span>
        </div>
      </Abs>
    </>
  );
};

// 16 · "Eles pediram pra IA criar um teste novo para o próprio METR usar, mas nenhum foi bom o suficiente." (sem o Bruno)
const CenaCriar: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.3);
  const cont = pop(t, m.nenhum - 0.1, 0.4);
  return (
    <>
      <Abs x={90} y={400} w={900} o={k} dy={(1 - k) * 20}>
        <div style={txt(40, 400, COR.sec)}>pediram pra IA criar</div>
        <div style={txt(66, 600, COR.branco, {marginTop: 8})}>um teste novo pro METR</div>
      </Abs>
      {/* a IA cospe testes, cada um carimbado */}
      <Abs x={90} y={770} w={130} h={130} o={ent(t, m.criar - 0.3, 0.3)}>
        <ChipIA size={130} />
      </Abs>
      {Array.from({length: 6}).map((_, i) => {
        const a = m.criar + i * 0.42;
        const o = ent(t, a, 0.3);
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = 270 + col * 250;
        const y = 760 + row * 200;
        const carimbo = pop(t, m.nenhum + i * 0.1, 0.25);
        return (
          <Abs key={i} x={x} y={y} w={220} h={170} o={o} dx={(1 - o) * -120} style={card({padding: 14})}>
            <div style={txt(20, 600, COR.sec, {letterSpacing: '0.06em'})}>TESTE {i + 1}</div>
            {[0, 1, 2].map((j) => (
              <div key={j} style={{height: 10, width: 80 + 90 * rnd(i * 3 + j), background: COR.cinza1, borderRadius: 5, marginTop: 12}} />
            ))}
            <div style={{position: 'absolute', right: 10, bottom: 10, opacity: cl(carimbo), transform: `scale(${2 - cl(carimbo)}) rotate(-12deg)`}}>
              <Xis size={56} />
            </div>
          </Abs>
        );
      })}
      <Abs x={90} y={1270} w={900} o={cl(cont)} s={0.8 + 0.2 * cl(cont)} style={card({padding: '20px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'})}>
        <span style={txt(40, 600, COR.branco)}>testes úteis criados pela IA</span>
        <span style={txt(90, 600, COR.ambar, {lineHeight: 1})}>0</span>
      </Abs>
    </>
  );
};

// 17 · "A IA nem foi pesquisar na internet o que era importante pro novo desafio, pro novo teste." (Bruno volta)
const CenaInternet: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.3);
  const blink = Math.floor(t * 2.5) % 2 === 0;
  return (
    <>
      <Abs x={90} y={410} w={900} o={k} dy={(1 - k) * 20} style={card({padding: 0, overflow: 'hidden'})}>
        <div style={{height: 44, background: COR.sup2, display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 16}}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{width: 14, height: 14, borderRadius: 7, background: COR.cinza1}} />
          ))}
        </div>
        <div style={{padding: '26px 28px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 14, border: `2px solid ${COR.borda}`, borderRadius: 40, padding: '14px 22px'}}>
            <svg width={40} height={40}>
              <circle cx={17} cy={17} r={12} fill="none" stroke={COR.sec} strokeWidth={4} />
              <line x1={26} y1={26} x2={36} y2={36} stroke={COR.sec} strokeWidth={5} />
            </svg>
            <span style={txt(36, 400, COR.cinza1)}>o que o METR precisa?</span>
            <div style={{width: 4, height: 40, background: blink ? COR.ambar : 'transparent'}} />
          </div>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, opacity: ent(t, m.internet, 0.3)}}>
            <span style={txt(30, 400, COR.sec)}>buscas feitas pela IA</span>
            <span style={txt(54, 600, COR.ambar)}>0</span>
          </div>
        </div>
      </Abs>
      {/* globo parado e a IA de costas, atrás do Bruno */}
      <Abs x={840} y={900} w={200} h={200} o={ent(t, m.internet - 0.2, 0.3)}>
        <svg width={200} height={200} viewBox="0 0 200 200">
          <circle cx={100} cy={100} r={86} fill="none" stroke={COR.cobalto} strokeWidth={6} />
          <ellipse cx={100} cy={100} rx={40 + 10 * Math.sin(t)} ry={86} fill="none" stroke={COR.cobalto} strokeWidth={4} />
          <line x1={14} y1={100} x2={186} y2={100} stroke={COR.cobalto} strokeWidth={4} />
          <line x1={30} y1={56} x2={170} y2={56} stroke={COR.cobalto} strokeWidth={3} />
          <line x1={30} y1={144} x2={170} y2={144} stroke={COR.cobalto} strokeWidth={3} />
        </svg>
      </Abs>
      <Abs x={50} y={940} w={170} h={170} o={ent(t, m.pesquisar - 0.2, 0.3)} r={Math.sin(t * 2) * 4}>
        <ChipIA size={140} cor={COR.sec} />
        <div style={{position: 'absolute', right: -10, top: -20, ...txt(48, 300, COR.sec)}}>z z</div>
      </Abs>
    </>
  );
};

// 18 · "O gargalo, hoje em dia, quase nunca é IA fazer. É alguém saber o que pedir e dizer se o resultado presta."
const CenaGargalo: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.3);
  const fz = ent(t, m.fazer - 0.4, 0.3);
  const risca = cl((t - m.fazer) / 0.3);
  const p1 = pop(t, m.pedir - 0.4, 0.35);
  const p2 = pop(t, m.presta - 0.4, 0.35);
  return (
    <>
      <Abs x={90} y={400} w={900} o={k} dy={(1 - k) * 20}>
        <div style={txt(40, 400, COR.sec)}>o gargalo</div>
      </Abs>
      <Abs x={90} y={460} w={900} o={fz} style={{display: 'flex', alignItems: 'center', gap: 18}}>
        <div style={{position: 'relative'}}>
          <span style={txt(56, 600, risca > 0.5 ? COR.cinza1 : COR.claro)}>a IA fazer</span>
          <div style={{position: 'absolute', left: -6, top: '52%', height: 6, width: `${risca * 104}%`, background: COR.erro}} />
        </div>
        <span style={txt(34, 400, COR.sec, {opacity: risca})}>quase nunca</span>
      </Abs>
      <Abs x={90} y={550} w={900} o={cl(p1)} dx={(1 - cl(p1)) * -40} style={{display: 'flex', alignItems: 'center', gap: 16}}>
        <Check size={46} bg={COR.ambarEsc} />
        <span style={txt(54, 600, COR.branco)}>saber o que pedir</span>
      </Abs>
      <Abs x={90} y={630} w={900} o={cl(p2)} dx={(1 - cl(p2)) * -40} style={{display: 'flex', alignItems: 'center', gap: 16}}>
        <Check size={46} bg={COR.ambarEsc} />
        <span style={txt(54, 600, COR.ambar)}>dizer se presta</span>
      </Abs>
      {/* funil (gargalo) atrás do Bruno: pontos rápidos em cima, filtro embaixo */}
      {[0, 1].map((l) => (
        <React.Fragment key={l}>
          <Abs x={l ? 840 : 40} y={860} w={200} h={500} o={ent(t, c.start + 0.2, 0.3)}>
            <svg width={200} height={500}>
              <path d="M10 10 H190 L120 250 V490 H80 V250 Z" fill={COR.sup} stroke={COR.borda} strokeWidth={4} />
              {Array.from({length: 10}).map((_, i) => {
                const ph = (t * 0.9 + i / 10) % 1;
                const x = 100 + (rnd(i + l * 20) - 0.5) * 140 * (1 - Math.min(1, ph * 2.2));
                const y = 20 + ph * 220;
                return <circle key={i} cx={x} cy={y} r={9} fill={COR.cinza1} />;
              })}
              {Array.from({length: 2}).map((_, i) => {
                const ph = (t * 0.25 + i / 2) % 1;
                return <circle key={i} cx={100} cy={260 + ph * 220} r={10} fill={COR.ambar} />;
              })}
            </svg>
          </Abs>
        </React.Fragment>
      ))}
    </>
  );
};

// 19 · "Esses testes são de programação e não de todas as profissões." (sem o Bruno)
const PROFISSOES = ['vendas', 'marketing', 'jurídico', 'saúde', 'RH', 'finanças', 'design', 'educação'];
const CenaRessalva: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.3);
  const cinza = ent(t, m.todas - 0.2, 0.35);
  return (
    <>
      <Abs x={90} y={400} w={900} o={k} dy={(1 - k) * 20}>
        <div style={txt(40, 400, COR.sec)}>o recorte</div>
        <div style={txt(66, 600, COR.branco, {marginTop: 8})}>só programação e pesquisa</div>
      </Abs>
      <Abs x={90} y={760} w={900} o={ent(t, m.prog - 0.3, 0.3)} style={{display: 'flex', alignItems: 'center', gap: 22}}>
        <JanelaCodigo w={560} t={t} a={m.prog - 0.3} linhas={5} />
        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          <Check size={48} />
          <span style={txt(36, 600, COR.petroleoClaro)}>medido</span>
        </div>
      </Abs>
      <Abs x={90} y={1270} w={900} style={{display: 'flex', flexWrap: 'wrap', gap: 14}}>
        {PROFISSOES.map((p, i) => {
          const o = ent(t, m.todas - 0.6 + i * 0.07, 0.25);
          return (
            <div key={i} style={{opacity: o, padding: '10px 20px', borderRadius: 30, border: `2px solid ${cinza > 0.5 ? COR.cinza1 : COR.claro}`, ...txt(30, 600, cinza > 0.5 ? COR.cinza1 : COR.claro)}}>
              {p}
            </div>
          );
        })}
      </Abs>
      <Abs x={90} y={1400} w={900} o={cinza} style={txt(30, 400, COR.sec)}>
        outras profissões: não medido
      </Abs>
    </>
  );
};

// 20 · "Mas a direção é clara. Fazer ficou barato. Decidir ficou caro." (Bruno na tela, punch-in em "caro")
const CenaTese: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const a = ent(t, m.fazer - 0.15, 0.3);
  const b = pop(t, m.decidir - 0.15, 0.35);
  const caro = cl((t - m.caro) / 0.4);
  return (
    <>
      <Abs x={90} y={400} w={900} o={ent(t, c.start, 0.3) * (1 - a)}>
        <div style={txt(56, 600, COR.branco)}>a direção é clara</div>
      </Abs>
      <Abs x={90} y={420} w={900} o={a} dy={(1 - a) * 20}>
        <div style={txt(70, 300, COR.branco)}>Fazer ficou barato.</div>
      </Abs>
      <Abs x={90} y={520} w={900} o={cl(b)} s={0.85 + 0.15 * cl(b)} origin="left center">
        <div style={txt(84, 600, COR.branco)}>
          <span style={{color: COR.ambar}}>Decidir</span> ficou caro.
        </div>
      </Abs>
      {/* etiquetas de preço: fazer caindo, decidir subindo */}
      <Abs x={40} y={900} w={200} o={a} style={card({padding: 14, textAlign: 'center'})}>
        <div style={txt(24, 600, COR.sec, {letterSpacing: '0.06em'})}>FAZER</div>
        <div style={txt(52, 600, COR.claro, {marginTop: 6})}>$</div>
        <div style={{height: 8, background: COR.sup2, marginTop: 8, borderRadius: 4}}>
          <div style={{height: 8, width: `${100 - 80 * cl((t - m.barato + 0.3) / 0.6)}%`, background: COR.sec, borderRadius: 4}} />
        </div>
      </Abs>
      <Abs x={840} y={880} w={200} o={cl(b)} s={1 + 0.12 * caro} style={card({padding: 14, textAlign: 'center', borderColor: COR.ambar, borderWidth: 3})}>
        <div style={txt(24, 600, COR.sec, {letterSpacing: '0.06em'})}>DECIDIR</div>
        <div style={txt(52, 600, COR.ambar, {marginTop: 6})}>$$$</div>
        <div style={{height: 8, background: COR.sup2, marginTop: 8, borderRadius: 4}}>
          <div style={{height: 8, width: `${20 + 80 * caro}%`, background: COR.ambar, borderRadius: 4}} />
        </div>
      </Abs>
    </>
  );
};

// 21 · "Então não só aceita a primeira resposta. Revisa, critica, ajusta, refina."
const VERBOS: [string, string][] = [
  ['Revisa', 'revisa'],
  ['Critica', 'critica'],
  ['Ajusta', 'ajusta'],
  ['Refina', 'refina'],
];
const CenaRevisa: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.3);
  const risca = cl((t - m.resposta) / 0.3);
  return (
    <>
      <Abs x={90} y={400} w={900} o={k} dy={(1 - k) * 20} style={card({padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'})}>
        <div>
          <div style={txt(24, 600, COR.sec, {letterSpacing: '0.08em'})}>1ª RESPOSTA DA IA</div>
          {[0, 1].map((j) => (
            <div key={j} style={{height: 12, width: 380 - j * 120, background: COR.cinza1, borderRadius: 6, marginTop: 12}} />
          ))}
        </div>
        <div style={{position: 'relative', padding: '10px 22px', borderRadius: 4, background: COR.sup2, ...txt(34, 600, COR.claro)}}>
          aceitar
          <div style={{position: 'absolute', left: 8, right: 8, top: '50%', height: 5, background: COR.erro, transform: `scaleX(${risca})`, transformOrigin: 'left'}} />
        </div>
      </Abs>
      <Abs x={90} y={580} w={900} style={{display: 'flex', gap: 14}}>
        {VERBOS.map(([txtV, key], i) => {
          const o = pop(t, m[key] - 0.1, 0.3);
          const atual = t >= m[key] - 0.1 && (i === 3 || t < m[VERBOS[i + 1][1]] - 0.1);
          return (
            <div key={i} style={{flex: 1, opacity: cl(o), transform: `scale(${0.6 + 0.4 * cl(o)})`, padding: '14px 0', textAlign: 'center', borderRadius: 4, background: atual ? COR.ambar : COR.sup, border: `2px solid ${atual ? COR.ambar : COR.borda}`, ...txt(34, 600, atual ? COR.preto : COR.branco)}}>
              {txtV}
            </div>
          );
        })}
      </Abs>
      {/* ciclo girando atrás do Bruno */}
      {[0, 1].map((l) => (
        <Abs key={l} x={l ? 850 : 40} y={930} w={190} h={190} o={ent(t, m.revisa - 0.2, 0.3)} r={(t * 90 * (l ? -1 : 1)) % 360}>
          <svg width={190} height={190} viewBox="0 0 190 190">
            <path d="M95 20 A75 75 0 1 1 22 110" fill="none" stroke={COR.ambar} strokeWidth={10} />
            <polygon points="95,4 120,20 95,36" fill={COR.ambar} />
          </svg>
        </Abs>
      ))}
    </>
  );
};

// 22 · "E me segue pra entender no que a IA impacta no seu trabalho."
const CenaCta: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.3);
  const click = t > m.segue + 0.35;
  const b = pop(t, m.segue - 0.15, 0.35);
  return (
    <>
      <Abs x={90} y={400} w={900} o={cl(b)} s={0.8 + 0.2 * cl(b)} origin="left center" style={{display: 'flex', alignItems: 'center', gap: 24}}>
        <div style={{padding: '18px 46px', borderRadius: 8, background: click ? COR.sup2 : COR.cobalto, border: `2px solid ${click ? COR.borda : COR.cobalto}`, ...txt(52, 600, COR.branco), transform: `scale(${t > m.segue + 0.3 && t < m.segue + 0.45 ? 0.94 : 1})`}}>{click ? 'Seguindo' : 'Seguir'}</div>
        <span style={txt(54, 600, COR.ambar, {opacity: ent(t, m.segue + 0.4, 0.3)})}>+1</span>
      </Abs>
      <Abs x={90} y={540} w={900} o={k * ent(t, m.segue + 0.2, 0.3)}>
        <div style={txt(44, 400, COR.claro)}>o que a IA impacta</div>
        <div style={txt(54, 600, COR.branco, {marginTop: 6})}>
          no <span style={{color: COR.ambar}}>seu trabalho</span>
        </div>
      </Abs>
      {[0, 1].map((l) => (
        <Abs key={l} x={l ? 860 : 50} y={960} w={170} h={170} o={ent(t, c.start + 0.3, 0.3)} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={card({width: 150, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center'})}>
            {l ? <ChipIA size={90} /> : <Pessoa size={100} cor={COR.claro} />}
          </div>
        </Abs>
      ))}
    </>
  );
};

// 23 · "Falai, o que no seu trabalho a IA ainda não consegue decidir por você?" + assinatura
const CenaFecho: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const logo = ent(t, m.logo, 0.3);
  const bubbles = [
    {x: 24, y: 900, at: c.start + 0.3, w: 150},
    {x: 826, y: 980, at: c.start + 0.6, w: 120},
    {x: 24, y: 1140, at: c.start + 0.9, w: 170},
    {x: 826, y: 1220, at: c.start + 1.2, w: 110},
  ];
  return (
    <>
      {bubbles.map((b, i) => {
        const o = pop(t, b.at, 0.35);
        return (
          <Abs key={i} x={b.x} y={b.y} w={230} o={cl(o)} s={0.7 + 0.3 * cl(o)} dy={(1 - cl(o)) * 30} origin={i % 2 ? 'right bottom' : 'left bottom'} style={{display: 'flex', gap: 10, alignItems: 'flex-start'}}>
            <div style={{width: 44, height: 44, borderRadius: 22, background: [COR.petroleo, COR.cobalto, COR.cinza1, COR.ambarEsc][i], flexShrink: 0}} />
            <div style={card({flex: 1, padding: '14px 14px'})}>
              <div style={{height: 12, width: b.w, maxWidth: '100%', background: COR.cinza1, borderRadius: 6}} />
              <div style={{height: 12, width: b.w * 0.6, background: COR.cinza1, borderRadius: 6, marginTop: 10}} />
            </div>
          </Abs>
        );
      })}
      <Abs x={90} y={398} w={900} o={(1 - logo) * ent(t, c.start, 0.3)}>
        <div style={txt(30, 600, COR.ambar, {letterSpacing: '0.08em'})}>FALAI</div>
        <div style={txt(50, 600, COR.branco, {marginTop: 10})}>o que no seu trabalho a IA</div>
        <div style={txt(50, 600, COR.branco, {marginTop: 4})}>
          ainda não consegue <span style={{color: COR.ambar}}>decidir</span> por você?
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
  gancho: CenaGancho,
  perde: CenaPerde,
  metr: CenaMetr,
  data: CenaData,
  metodo1: CenaMetodo1,
  metodo2: CenaMetodo2,
  evolucao: CenaEvolucao,
  dias: CenaDias,
  especialistas: CenaEspecialistas,
  ninguem: CenaNinguem,
  competicoes: CenaCompeticoes,
  horas: CenaHoras,
  top4: CenaTop4,
  regancho: CenaRegancho,
  julgamento: CenaJulgamento,
  criar: CenaCriar,
  internet: CenaInternet,
  gargalo: CenaGargalo,
  ressalva: CenaRessalva,
  tese: CenaTese,
  revisa: CenaRevisa,
  cta: CenaCta,
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
    <div style={{position: 'absolute', left: 70, right: 70, top: 380, opacity: out}}>
      <div style={{...txt(84, 300, COR.branco, {lineHeight: 1.06}), opacity: a, transform: `translateY(${(1 - a) * 24}px)`}}>{h.l1}</div>
      <div style={{...txt(112, 600, COR.ambar, {lineHeight: 1.04}), opacity: b, transform: `translateY(${(1 - b) * 24}px)`}}>{h.l2}</div>
    </div>
  );
};

/** nota pequena "Tarefas de programação e pesquisa em IA" (camada de texto, janelas em falai.nota) */
const Nota: React.FC<{t: number}> = ({t}) => {
  const w = (F as unknown as {nota?: [number, number][]}).nota ?? [];
  let o = 0;
  for (const [a, b] of w) o = Math.max(o, jan(t, a, b, 0.3, 0.3));
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 90, top: 1446, opacity: o, border: `2px solid ${COR.cinza1}`, borderRadius: 3, padding: '6px 14px', ...txt(24, 600, COR.sec, {letterSpacing: '0.04em'})}}>Tarefas de programação e pesquisa em IA</div>
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
          <Nota t={t} />
          {md && (md.ate === undefined || t < md.ate) ? (
            <Img src={staticFile(md.src)} style={{position: 'absolute', left: md.x, top: md.y, width: md.size, height: md.size}} />
          ) : null}
        </Plano>
      </div>
    </AbsoluteFill>
  );
};
