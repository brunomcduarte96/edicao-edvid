/**
 * FalaiBruno v2 — palco em camadas para o vídeo 9:16 com o Bruno recortado.
 *
 * Camadas (de trás para frente): FUNDO (preto + grade) → ELEMENTOS (ilustrações
 * atrás do Bruno) → BRUNO (pessoa_v.mov com alfa) → TEXTO (rótulo, fonte,
 * legenda, marca d'água). Em `explosoes` as camadas se separam em perspectiva 3D.
 *
 * Tudo que é tempo vem de edit-data.json `falai` (janelas e marcas por palavra).
 * Marca: só Inter; preto/branco/cinzas; âmbar #E8A33D destaque; petróleo #1F6F6B
 * sucesso; cobalto #2F5BEA informação; formas retas; sem sombra nem gradiente.
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
import capData from '../../public/falai-captions.json';

export const COR = {
  preto: '#0A0A0A',
  sup: '#1A1A1A',
  sup2: '#242424',
  grade: '#171717',
  branco: '#FFFFFF',
  claro: '#F2F2F2',
  sec: '#A3A3A3',
  cinza1: '#525252',
  borda: '#3A3A3A',
  ambar: '#E8A33D',
  petroleo: '#1F6F6B',
  petroleoClaro: '#4FB3AC',
  cobalto: '#2F5BEA',
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
type Zoom = {start: number; end: number; scale: number};
type Falai = {
  legendaY: number;
  marcaDagua?: {src: string; x: number; y: number; size: number; ate?: number};
  explosoes: Explosao[];
  zooms: Zoom[];
  cenas: Cena[];
};
const F = (editData as unknown as {falai: Falai}).falai;

// ---------- tempo ----------
const cl = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const outCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const inOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
/** 0→1 entre a e a+d, com easing de saída */
const ent = (t: number, a: number, d = 0.35) => outCubic(cl((t - a) / d));
/** opacidade de janela: entra em start, sai em end */
const jan = (t: number, s: number, e: number, fi = 0.25, fo = 0.25) => Math.min(cl((t - s) / fi), cl((e - t) / fo));

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
      ...style,
    }}
  >
    {t}
  </div>
);

const Abs: React.FC<{x: number; y: number; w?: number; h?: number; o?: number; s?: number; dy?: number; origin?: string; style?: React.CSSProperties; children?: React.ReactNode}> = ({
  x,
  y,
  w,
  h,
  o = 1,
  s = 1,
  dy = 0,
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
      opacity: o,
      transform: `translateY(${dy}px) scale(${s})`,
      transformOrigin: origin,
      ...style,
    }}
  >
    {children}
  </div>
);

const Seta: React.FC<{x1: number; y1: number; x2: number; y2: number; cor?: string; p?: number}> = ({x1, y1, x2, y2, cor = COR.petroleoClaro, p = 1}) => {
  const xe = x1 + (x2 - x1) * p;
  const ye = y1 + (y2 - y1) * p;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const L = 16;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1080} height={1920}>
      <line x1={x1} y1={y1} x2={xe} y2={ye} stroke={cor} strokeWidth={5} />
      {p > 0.9 ? (
        <polygon
          points={`${xe},${ye} ${xe - L * Math.cos(ang - 0.5)},${ye - L * Math.sin(ang - 0.5)} ${xe - L * Math.cos(ang + 0.5)},${ye - L * Math.sin(ang + 0.5)}`}
          fill={cor}
        />
      ) : null}
    </svg>
  );
};

const Check: React.FC<{size?: number; bg?: string}> = ({size = 40, bg = COR.petroleo}) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <rect width="40" height="40" rx="4" fill={bg} />
    <path d="M10 21 L17 28 L30 13" stroke="#fff" strokeWidth="4.5" fill="none" strokeLinecap="square" />
  </svg>
);

// ======================= CENAS (camada ELEMENTOS) =======================

const VAGAS = [
  'Analista de RH',
  'Marketing',
  'Comunicação',
  'Recrutamento',
  'Design',
  'Atendimento',
];

const CenaVagas: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const dob = ent(t, m.dobra, 0.4);
  return (
    <>
      {VAGAS.map((v, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const a = c.start + 0.1 + i * 0.11;
        const k = ent(t, a, 0.4);
        const tag = ent(t, m.ia + i * 0.04, 0.2);
        return (
          <Abs key={i} x={60 + col * 330} y={470 + row * 165} w={300} h={150} o={k * (1 - 0.72 * dob)} s={0.86 + 0.14 * k} dy={(1 - k) * 40}>
            <div style={{width: '100%', height: '100%', background: COR.sup, border: `1px solid ${COR.borda}`, borderRadius: 6, padding: 18, boxSizing: 'border-box'}}>
              <div style={txt(20, 600, COR.sec, {letterSpacing: '0.08em'})}>VAGA</div>
              <div style={txt(30, 600, COR.branco, {marginTop: 6})}>{v}</div>
              <div style={{marginTop: 14, opacity: tag, transform: `scale(${0.8 + 0.2 * tag})`, transformOrigin: 'left center'}}>
                <Tag t="Requisito: IA" size={20} />
              </div>
            </div>
          </Abs>
        );
      })}
      <Abs x={0} y={455} w={1080} o={dob} s={0.9 + 0.1 * dob} style={{textAlign: 'center'}}>
        <div style={txt(210, 300, COR.ambar, {lineHeight: 1})}>+110,7%</div>
        <div style={{...txt(46, 600, COR.branco, {marginTop: 8}), opacity: ent(t, m.ano, 0.3)}}>
          vagas que pedem IA em 1 ano
        </div>
      </Abs>
    </>
  );
};

const CenaMetade: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const cell = 31;
  const gap = 4;
  const x0 = (1080 - (cell * 10 + gap * 9)) / 2;
  const y0 = 470;
  const cells = [];
  for (let i = 0; i < 100; i++) {
    const col = Math.floor(i / 10);
    const row = i % 10;
    const ap = ent(t, c.start + 0.02 * col + 0.01 * row, 0.25);
    const fora = i < 54;
    const pinta = fora ? ent(t, m.metade + 0.012 * i, 0.2) : 0;
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
          background: pinta > 0.5 ? COR.ambar : COR.sup2,
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
      <Abs x={18} y={470} w={x0 - 30} o={lf}>
        <div style={txt(40, 600, COR.ambar, {textAlign: 'right'})}>Fora de TI</div>
        <div style={txt(26, 400, COR.sec, {textAlign: 'right', marginTop: 6})}>mais da metade</div>
      </Abs>
      <Abs x={1080 - x0 + 14} y={470} w={x0 - 30} o={lt}>
        <div style={txt(40, 600, COR.branco)}>TI</div>
        <div style={txt(26, 400, COR.sec, {marginTop: 6})}>o resto</div>
      </Abs>
    </>
  );
};

const CenaAreas: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const base = 1450;
  const H = base - 470;
  const bars = [
    {x: 60, w: 400, v: 139, at: m.rh, cor: COR.ambar, fg: COR.preto, nome: 'RH', val: '+139%'},
    {x: 620, w: 400, v: 134, at: m.mkt, cor: COR.petroleo, fg: COR.branco, nome: 'Comunicação, design e marketing', val: '+134%'},
  ];
  const intro = ent(t, c.start, 0.4);
  return (
    <>
      <Abs x={60} y={base} w={960} h={3} o={intro} style={{background: COR.borda}} />
      {bars.map((b, i) => {
        const g = inOutCubic(cl((t - b.at + 0.15) / 0.7));
        const h = (H * b.v) / 139 * g;
        const glowHl = i === 1 ? ent(t, m.com, 0.25) : 0;
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
                outline: glowHl > 0 ? `${4 * glowHl}px solid ${COR.branco}` : undefined,
              }}
            />
            <Abs x={b.x + 22} y={base - h + 20} w={b.w - 44} o={cl((g - 0.6) / 0.4)}>
              <div style={txt(b.nome.length > 5 ? 30 : 48, 600, b.fg)}>{b.nome}</div>
              <div style={txt(70, 300, b.fg, {marginTop: 6})}>{b.val}</div>
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
  const linhas: {pre: string; hl?: string; pos?: string; at?: number}[] = [
    {pre: 'Excel e Pacote Office'},
    {pre: 'Saber escrever ', hl: 'prompt', at: m.prompt},
    {pre: 'Usar ', hl: 'agente de IA', at: m.agente},
    {pre: 'Comunicação clara'},
    {pre: 'Inglês intermediário'},
  ];
  const st = ent(t, m.pct, 0.22);
  return (
    <>
      <Abs x={90} y={460} w={900} h={900} o={k} dy={(1 - k) * 60} style={{background: COR.claro, borderRadius: 6}}>
        <div style={{padding: '30px 40px'}}>
          <div style={txt(24, 600, COR.cinza1, {letterSpacing: '0.08em'})}>DESCRIÇÃO DA VAGA</div>
          <div style={txt(40, 600, COR.preto, {marginTop: 6})}>Requisitos</div>
          {linhas.map((l, i) => {
            const li = ent(t, c.start + 0.25 + i * 0.1, 0.3);
            const hl = l.at !== undefined ? ent(t, l.at, 0.3) : 0;
            return (
              <div key={i} style={{display: 'flex', alignItems: 'center', marginTop: 22, opacity: li}}>
                <div style={{width: 14, height: 14, background: COR.petroleo, marginRight: 18, flexShrink: 0}} />
                <span style={txt(36, 400, COR.preto)}>{l.pre}</span>
                {l.hl ? (
                  <span style={{position: 'relative', marginLeft: 4}}>
                    <span style={{position: 'absolute', left: -6, top: 2, bottom: 0, width: `calc(${hl * 100}% + 12px)`, background: COR.ambar, borderRadius: 2}} />
                    <span style={{...txt(36, 600, COR.preto), position: 'relative'}}>{l.hl}</span>
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </Abs>
      <Abs x={640} y={485} w={320} o={st} s={1.4 - 0.4 * st} style={{background: COR.preto, borderRadius: 2, padding: '14px 22px', boxSizing: 'border-box'}}>
        <div style={txt(84, 300, COR.ambar, {lineHeight: 1})}>+325%</div>
        <div style={txt(24, 600, COR.branco, {marginTop: 6})}>menções a prompt e agente</div>
      </Abs>
    </>
  );
};

const CenaDetalhe: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const k = ent(t, c.start, 0.3);
  return (
    <Abs x={0} y={520} w={1080} o={k} style={{textAlign: 'center'}}>
      <div style={txt(150, 300, COR.ambar, {lineHeight: 1})}>o detalhe</div>
    </Abs>
  );
};

const CenaTreinamento: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const cell = 40;
  const gap = 5;
  const x0 = 70;
  const y0 = 470;
  const cells = [];
  for (let i = 0; i < 100; i++) {
    const row = Math.floor(i / 10);
    const col = i % 10;
    const ap = ent(t, c.start + 0.004 * i, 0.2);
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
          background: COR.sup2,
          opacity: ap,
          overflow: 'hidden',
        }}
      >
        {i === 0 ? <div style={{width: '100%', height: '100%', background: COR.ambar, opacity: ent(t, m.pct, 0.2), transform: `scale(${1 + 0.25 * Math.max(0, 1 - Math.abs(t - m.pct - 0.25) * 4)})`}} /> : null}
        {i === 1 ? <div style={{width: `${20 * ent(t, m.pct + 0.25, 0.3)}%`, height: '100%', background: COR.ambar}} /> : null}
      </div>,
    );
  }
  const n = ent(t, m.pct, 0.3);
  return (
    <>
      {cells}
      <Abs x={560} y={455} w={480} o={n} s={0.9 + 0.1 * n} origin="left top">
        <div style={txt(180, 300, COR.ambar, {lineHeight: 1})}>1,2%</div>
      </Abs>
      <Abs x={566} y={650} w={470} o={ent(t, m.trein, 0.3)}>
        <div style={txt(40, 600, COR.branco)}>dos treinamentos</div>
      </Abs>
      <Abs x={566} y={700} w={470} o={ent(t, m.emp, 0.3)}>
        <div style={txt(40, 600, COR.branco)}>nas empresas</div>
      </Abs>
      <Abs x={566} y={750} w={470} o={ent(t, m.ia, 0.3)}>
        <div style={txt(40, 600, COR.ambar)}>são de IA</div>
      </Abs>
      <Abs x={x0} y={y0 + 10 * (cell + gap) + 6} w={460} o={ent(t, m.trein, 0.3)}>
        <div style={txt(24, 400, COR.sec)}>1 quadrado = 1% dos treinamentos</div>
      </Abs>
    </>
  );
};

const CenaEmpresa: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const kl = ent(t, c.start, 0.4);
  const kr = ent(t, m.ensina - 0.4, 0.4);
  const bar = ent(t, m.ensina + 0.2, 0.8);
  return (
    <>
      <Abs x={50} y={470} w={470} h={620} o={kl} dy={(1 - kl) * 40} style={{border: `3px solid ${COR.ambar}`, borderRadius: 6, padding: 28, boxSizing: 'border-box', background: COR.preto}}>
        <Tag t="Na entrada" size={26} />
        <div style={txt(40, 600, COR.branco, {marginTop: 22})}>A empresa cobra</div>
        {[
          {l: 'Saber usar IA', at: m.cobra},
          {l: 'Prompt e agente', at: m.entrada},
        ].map((r, i) => {
          const o = ent(t, r.at, 0.25);
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', marginTop: 20, opacity: o, transform: `translateX(${(1 - o) * -20}px)`}}>
              <Check size={40} />
              <span style={txt(34, 400, COR.branco, {marginLeft: 16})}>{r.l}</span>
            </div>
          );
        })}
      </Abs>
      <Abs x={560} y={470} w={470} h={620} o={kr} dy={(1 - kr) * 40} style={{border: `3px solid ${COR.borda}`, borderRadius: 6, padding: 28, boxSizing: 'border-box', background: COR.preto}}>
        <Tag t="Dentro de casa" size={26} bg={COR.sup2} fg={COR.branco} />
        <div style={txt(40, 600, COR.branco, {marginTop: 22})}>A empresa ensina</div>
        <div style={txt(30, 400, COR.sec, {marginTop: 22})}>Treinamento em IA</div>
        <div style={{marginTop: 12, width: '100%', height: 30, background: COR.sup2, borderRadius: 4, overflow: 'hidden'}}>
          <div style={{width: `${Math.max(1.2 * bar, 0.0) * 1.0 + (bar > 0 ? 1.5 : 0)}%`, height: '100%', background: COR.ambar}} />
        </div>
        <div style={txt(56, 300, COR.ambar, {marginTop: 12, opacity: bar})}>1,2%</div>
      </Abs>
      <Seta x1={430} y1={900} x2={600} y2={900} cor={COR.borda} p={ent(t, m.casa, 0.35)} />
    </>
  );
};

const CenaEsperar: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.4);
  const fade = 1 - 0.7 * ent(t, m.ninguem, 0.5);
  const prog = cl((t - c.start) / (c.end - c.start)) * 1.2;
  const dots = 12;
  const rot = (t * 360) % 360;
  return (
    <>
      <Abs x={110} y={470} w={860} o={1}>
        <div style={{display: 'flex', gap: 22}}>
          {[
            {l: 'Testar', at: m.testar},
            {l: 'Treinar', at: m.treinar},
          ].map((ch, i) => {
            const o = ent(t, ch.at, 0.25);
            return (
              <div key={i} style={{opacity: o, transform: `scale(${0.8 + 0.2 * o})`, background: COR.petroleo, borderRadius: 4, padding: '14px 30px'}}>
                <span style={txt(46, 600, COR.branco)}>{ch.l}</span>
              </div>
            );
          })}
        </div>
      </Abs>
      <Abs x={110} y={590} w={860} h={330} o={k * fade} dy={(1 - k) * 40} style={{background: COR.sup, border: `1px solid ${COR.borda}`, borderRadius: 6, padding: 30, boxSizing: 'border-box'}}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <div>
            <div style={txt(24, 600, COR.sec, {letterSpacing: '0.08em'})}>CURSO DE IA DA EMPRESA</div>
            <div style={txt(40, 600, COR.branco, {marginTop: 8})}>Esperando liberar…</div>
          </div>
          <svg width={70} height={70} viewBox="-35 -35 70 70" style={{transform: `rotate(${rot}deg)`}}>
            {Array.from({length: dots}).map((_, i) => {
              const a = (i / dots) * Math.PI * 2;
              return <circle key={i} cx={Math.cos(a) * 26} cy={Math.sin(a) * 26} r={4} fill={COR.branco} opacity={0.15 + 0.85 * (i / dots)} />;
            })}
          </svg>
        </div>
        <div style={{marginTop: 26, width: '100%', height: 26, background: COR.sup2, borderRadius: 4, overflow: 'hidden'}}>
          <div style={{width: `${prog}%`, minWidth: 6, height: '100%', background: COR.cinza1}} />
        </div>
        <div style={txt(28, 400, COR.sec, {marginTop: 12})}>{prog.toFixed(1).replace('.', ',')}% carregado</div>
      </Abs>
    </>
  );
};

const CenaCiclo: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const nodes = [
    {l: 'Testa', at: m.testa},
    {l: 'Erra', at: m.erra},
    {l: 'Estuda', at: m.estuda},
    {l: 'Testa de novo', at: m.denovo},
  ];
  const W = 215;
  const G = 40;
  const x0 = (1080 - (4 * W + 3 * G)) / 2;
  const y = 520;
  const H = 100;
  const atual = nodes.reduce((acc, n, i) => (t >= n.at - 0.05 ? i : acc), -1);
  const loop = ent(t, m.denovo + 0.3, 0.6);
  // ponto viajando no laço depois do "testa de novo"
  const per = 1.6;
  const ph = t > m.denovo + 0.9 ? ((t - m.denovo - 0.9) % per) / per : -1;
  const xa = x0 + 3 * (W + G) + W / 2;
  const xb = x0 + W / 2;
  const yt = y - 40;
  let px = 0;
  let py = 0;
  if (ph >= 0) {
    // caminho: sobe do último, vai para a esquerda, desce no primeiro
    const seg = [40, xa - xb, 40];
    const tot = seg[0] + seg[1] + seg[2];
    const d = ph * tot;
    if (d < seg[0]) {
      px = xa;
      py = y - d;
    } else if (d < seg[0] + seg[1]) {
      px = xa - (d - seg[0]);
      py = yt;
    } else {
      px = xb;
      py = yt + (d - seg[0] - seg[1]);
    }
  }
  return (
    <>
      {nodes.map((n, i) => {
        const o = ent(t, n.at - 0.1, 0.25);
        const on = i === atual && t < m.denovo + 0.6;
        const feito = t >= n.at - 0.05;
        return (
          <Abs key={i} x={x0 + i * (W + G)} y={y} w={W} h={H} o={o} s={on ? 1.06 : 1} style={{
            background: on ? COR.ambar : feito ? COR.sup : COR.preto,
            border: `2px solid ${on ? COR.ambar : COR.petroleoClaro}`,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            boxSizing: 'border-box',
          }}>
            <span style={txt(n.l.length > 8 ? 30 : 38, 600, on ? COR.preto : COR.branco)}>{n.l}</span>
          </Abs>
        );
      })}
      {[0, 1, 2].map((i) => (
        <Seta key={i} x1={x0 + i * (W + G) + W + 4} y1={y + H / 2} x2={x0 + (i + 1) * (W + G) - 4} y2={y + H / 2} p={ent(t, nodes[i + 1].at - 0.2, 0.2)} />
      ))}
      <svg style={{position: 'absolute', left: 0, top: 0, opacity: loop}} width={1080} height={1920}>
        <path d={`M ${xa} ${y - 4} L ${xa} ${yt} L ${xb} ${yt} L ${xb} ${y - 8}`} stroke={COR.petroleoClaro} strokeWidth={5} fill="none" strokeDasharray="14 10" />
        <polygon points={`${xb},${y - 2} ${xb - 12},${y - 22} ${xb + 12},${y - 22}`} fill={COR.petroleoClaro} />
        {ph >= 0 ? <rect x={px - 9} y={py - 9} width={18} height={18} fill={COR.ambar} /> : null}
      </svg>
      <Abs x={0} y={650} w={1080} o={ent(t, m.curso, 0.3)} style={{textAlign: 'center'}}>
        <div style={txt(52, 600, COR.ambar)}>Ninguém me deu curso</div>
      </Abs>
    </>
  );
};

const TILES = ['Texto', 'Imagem', 'Planilha', 'Código', 'Áudio', 'Pesquisa'];
const Icone: React.FC<{i: number}> = ({i}) => {
  const s = {stroke: COR.branco, strokeWidth: 4, fill: 'none'} as const;
  switch (i) {
    case 0:
      return (
        <svg width={56} height={56} viewBox="0 0 56 56"><rect x="4" y="8" width="48" height="32" rx="4" {...s} /><path d="M14 40 L14 50 L26 40" {...s} /><line x1="14" y1="20" x2="42" y2="20" {...s} /><line x1="14" y1="29" x2="34" y2="29" {...s} /></svg>
      );
    case 1:
      return (
        <svg width={56} height={56} viewBox="0 0 56 56"><rect x="4" y="8" width="48" height="40" rx="4" {...s} /><circle cx="19" cy="22" r="5" {...s} /><path d="M6 44 L22 30 L32 38 L40 30 L50 40" {...s} /></svg>
      );
    case 2:
      return (
        <svg width={56} height={56} viewBox="0 0 56 56"><rect x="4" y="6" width="48" height="44" rx="4" {...s} /><line x1="4" y1="20" x2="52" y2="20" {...s} /><line x1="4" y1="34" x2="52" y2="34" {...s} /><line x1="22" y1="6" x2="22" y2="50" {...s} /></svg>
      );
    case 3:
      return (
        <svg width={56} height={56} viewBox="0 0 56 56"><path d="M20 14 L6 28 L20 42" {...s} /><path d="M36 14 L50 28 L36 42" {...s} /><line x1="31" y1="10" x2="25" y2="46" {...s} /></svg>
      );
    case 4:
      return (
        <svg width={56} height={56} viewBox="0 0 56 56">{[8, 16, 24, 32, 40, 48].map((x, k) => <line key={k} x1={x} y1={28 - [6, 14, 20, 12, 18, 8][k]} x2={x} y2={28 + [6, 14, 20, 12, 18, 8][k]} {...s} />)}</svg>
      );
    default:
      return (
        <svg width={56} height={56} viewBox="0 0 56 56"><circle cx="24" cy="24" r="16" {...s} /><line x1="36" y1="36" x2="50" y2="50" {...s} /></svg>
      );
  }
};

const CenaIAs: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const sai = ent(t, m.segue - 0.25, 0.25);
  const top3 = [0, 2, 1];
  const btn = ent(t, m.segue - 0.15, 0.25);
  const click = m.segue + 0.45;
  const pressed = t >= click && t < click + 0.12;
  const seguindo = t >= click + 0.12;
  const cur = ent(t, m.segue, 0.45);
  return (
    <>
      {TILES.map((l, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const o = ent(t, m.quais + i * 0.08, 0.3);
        const rank = top3.indexOf(i);
        const hl = rank >= 0 ? ent(t, m.melhores + rank * 0.18, 0.25) : 0;
        return (
          <Abs key={i} x={60 + col * 330} y={470 + row * 160} w={300} h={140} o={o * (1 - sai)} s={0.85 + 0.15 * o} style={{
            background: COR.sup,
            border: `${hl > 0.5 ? 3 : 1}px solid ${hl > 0.5 ? COR.ambar : COR.borda}`,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            boxSizing: 'border-box',
            gap: 18,
          }}>
            <Icone i={i} />
            <span style={txt(34, 600, COR.branco)}>{l}</span>
            {rank >= 0 ? (
              <div style={{position: 'absolute', right: -12, top: -12, width: 44, height: 44, background: COR.ambar, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: hl, transform: `scale(${0.5 + 0.5 * hl})`}}>
                <span style={txt(28, 600, COR.preto)}>{rank + 1}</span>
              </div>
            ) : null}
          </Abs>
        );
      })}
      <Abs x={290} y={500} w={500} h={130} o={btn} s={(pressed ? 0.94 : 1) * (0.85 + 0.15 * btn)} style={{
        background: seguindo ? COR.sup2 : COR.petroleo,
        border: seguindo ? `2px solid ${COR.borda}` : 'none',
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
      }}>
        <span style={txt(54, 600, COR.branco)}>{seguindo ? 'Seguindo' : 'Seguir'}</span>
      </Abs>
      {btn > 0 ? (
        <svg style={{position: 'absolute', left: 0, top: 0}} width={1080} height={1920}>
          <path
            transform={`translate(${900 - 280 * cur} ${760 - 170 * cur})`}
            d="M0 0 L0 46 L12 35 L21 55 L29 51 L20 32 L36 32 Z"
            fill={COR.branco}
            stroke={COR.preto}
            strokeWidth={3}
          />
        </svg>
      ) : null}
    </>
  );
};

const CenaComenta: React.FC<{t: number; c: Cena}> = ({t, c}) => {
  const m = c.m!;
  const k = ent(t, c.start, 0.35);
  const bubbles = [
    {x: 50, at: m.conta, w: 400},
    {x: 630, at: m.empresa, w: 400},
    {x: 630, at: m.ensinou, w: 360},
  ];
  return (
    <>
      <Abs x={70} y={470} w={940} o={k} dy={(1 - k) * 30}>
        <div style={txt(70, 600, COR.branco)}>Sua empresa já</div>
        <div style={txt(70, 600, COR.ambar)}>te ensinou IA?</div>
      </Abs>
      {bubbles.map((b, i) => {
        const o = ent(t, b.at, 0.3);
        return (
          <Abs key={i} x={b.x} y={680 + (i === 2 ? 1 : 0) * 140} w={b.w} h={120} o={o} dy={(1 - o) * 30} style={{display: 'flex', gap: 16, alignItems: 'flex-start'}}>
            <div style={{width: 56, height: 56, borderRadius: 28, background: [COR.petroleo, COR.cobalto, COR.cinza1][i], flexShrink: 0}} />
            <div style={{flex: 1, background: COR.sup, border: `1px solid ${COR.borda}`, borderRadius: 6, padding: '18px 20px'}}>
              <div style={{height: 14, width: '80%', background: COR.cinza1, borderRadius: 2}} />
              <div style={{height: 14, width: '55%', background: COR.borda, borderRadius: 2, marginTop: 12}} />
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
      <Abs x={60} y={400} w={320} h={320} o={k}>
        <Sequence from={Math.round(c.start * 30)} layout="none">
          <Video src={staticFile('brand/logo-anim.webm')} style={{width: 320, height: 320}} muted />
        </Sequence>
      </Abs>
      <Abs x={400} y={505} w={600} o={w} dy={(1 - w) * 20}>
        <Img src={staticFile('brand/falaibruno-branco.svg')} style={{width: 580}} />
      </Abs>
    </>
  );
};

const CENAS: Record<string, React.FC<{t: number; c: Cena}>> = {
  vagas: CenaVagas,
  metade: CenaMetade,
  areas: CenaAreas,
  requisitos: CenaRequisitos,
  detalhe: CenaDetalhe,
  treinamento: CenaTreinamento,
  empresa: CenaEmpresa,
  esperar: CenaEsperar,
  ciclo: CenaCiclo,
  ias: CenaIAs,
  comenta: CenaComenta,
  final: CenaFinal,
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

type Cue = {start: number; end: number; words: {t: string; s: number; e: number}[]; key: number | null};

const Legenda: React.FC<{t: number}> = ({t}) => {
  const cue = (capData as {cues: Cue[]}).cues.find((c) => t >= c.start - 0.03 && t < c.end);
  if (!cue) return null;
  const k = ent(t, cue.start - 0.03, 0.12);
  return (
    <div style={{position: 'absolute', left: 64, right: 64, top: F.legendaY - 50, height: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: k, transform: `translateY(${(1 - k) * 10}px)`}}>
      <div style={{background: COR.preto, borderRadius: 2, padding: '8px 22px', display: 'flex', gap: 18}}>
        {cue.words.map((w, i) => (
          <span key={i} style={{...txt(66, 600, i === cue.key ? COR.ambar : COR.branco), whiteSpace: 'nowrap'}}>
            {w.t.replace(/[.,]+$/, '')}
          </span>
        ))}
      </div>
    </div>
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

const zoomPessoa = (t: number) => {
  for (const z of F.zooms) if (t >= z.start && t < z.end) return z.scale;
  return 1;
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
      background: fundo ? COR.preto : undefined,
      outline: e > 0.02 ? `${3}px solid rgba(163,163,163,${0.85 * e})` : undefined,
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
  return (
    <AbsoluteFill style={{background: COR.preto, perspective: 2600, perspectiveOrigin: '50% 48%', overflow: 'hidden'}}>
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
            const o = jan(t, c.start, c.end, 0.15, 0.2);
            return (
              <div key={c.nome + c.start} style={{position: 'absolute', inset: 0, opacity: o}}>
                <C t={t} c={c} />
              </div>
            );
          })}
        </Plano>
        <Plano z={0} e={e} rotulo="Bruno">
          <div style={{position: 'absolute', inset: 0, transform: `scale(${0.9 * zs})`, transformOrigin: '540px 1180px'}}>
            <OffthreadVideo src={staticFile('pessoa_v.mov')} transparent muted style={{width: 1080, height: 1920}} />
          </div>
        </Plano>
        <Plano z={380} e={e} rotulo="Texto">
          {cena?.rotulo ? (
            <div style={{position: 'absolute', left: 96, top: 252}}>
              <Tag t={cena.rotulo} size={30} />
            </div>
          ) : null}
          {cena?.fonte ? (
            <div style={{position: 'absolute', left: 96, top: 300, ...txt(30, 400, COR.sec)}}>{cena.fonte}</div>
          ) : null}
          {md && (md.ate === undefined || t < md.ate) ? (
            <Img src={staticFile(md.src)} style={{position: 'absolute', left: md.x, top: md.y, width: md.size, height: md.size}} />
          ) : null}
          <Legenda t={t} />
        </Plano>
      </div>
    </AbsoluteFill>
  );
};
