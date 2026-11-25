/**
 * Agendamento Email — primeiro vídeo em TELA DIVIDIDA (25/11/2026).
 * Gancho em tela cheia (receita das camadas 3D) → tela dividida (gravação de tela em cima,
 * Bruno embaixo, linha âmbar na junção, legenda karaokê na junção) → pedido do agendamento
 * em tela cheia → fecho em tela cheia com a pergunta falada.
 * Estilo escolhido no Edvid: headline Contorno, legenda karaokê, tracking, zoom automático,
 * zoom nos cortes, flash na transição, sem trilha.
 * Tempos = segundos do cut.mp4 (jcut_timeline do edl.json).
 */
import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, staticFile, useCurrentFrame, continueRender, delayRender} from 'remotion';
import captions from '../../public/captions.json';

const COR = {
  fundo: '#0B0B0B', sup: '#161616', sup2: '#1F1F1F', grade: '#161616', branco: '#FFFFFF', sec: '#A3A3A3',
  borda: '#333333', ambar: '#E8A33D', petroleo: '#1F6F6B', petroleoClaro: '#4FB3AC', cobalto: '#2F5BEA', preto: '#0A0A0A',
};
const FONTE = 'InterFB';
let fontsOk = false;
const useInter = () => {
  if (fontsOk || typeof document === 'undefined') return;
  fontsOk = true;
  const h = delayRender('Inter');
  const faces = [
    new FontFace(FONTE, `url(${staticFile('fonts/Inter_18pt-Light.ttf')})`, {weight: '300'}),
    new FontFace(FONTE, `url(${staticFile('fonts/Inter_18pt-Regular.ttf')})`, {weight: '400'}),
    new FontFace(FONTE, `url(${staticFile('fonts/Inter_18pt-SemiBold.ttf')})`, {weight: '600'}),
  ];
  Promise.all(faces.map((f) => f.load()))
    .then((fs) => { fs.forEach((f) => document.fonts.add(f)); continueRender(h); })
    .catch(() => continueRender(h));
};

// ---------- tempo ----------
const cl = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const outCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const inOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const outBack = (x: number) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const ent = (t: number, a: number, d = 0.3) => outCubic(cl((t - a) / d));
const pop = (t: number, a: number, d = 0.35) => (t < a ? 0 : outBack(cl((t - a) / d)));
const jan = (t: number, s: number, e: number, fi = 0.2, fo = 0.2) => Math.min(cl((t - s) / fi), cl((e - t) / fo));

// ---------- linha do tempo (cut.mp4) ----------
const SPLIT0 = 3.467;       // entra a tela dividida
const FULL0 = 30.8;         // pedido do agendamento em tela cheia
const FECHO = 34.2;         // fecho em tela cheia
const FIM = 38.764;
const CTA0 = 34.2;     // "E já me segue pra não perder nenhuma outra dica." (cta.mov, antes da pergunta)
const PERG0 = 36.567;  // "E fala aí, você acha que isso te ajuda no dia a dia?"
const CENA0 = 16.133, CENA1 = 26.6; // animação no lugar da tela (contexto → Claude)
/** cortes de imagem (início de cada trecho) */
const CORTES = [0, 3.467, 5.233, 6.033, 6.733, 7.833, 9.967, 10.533, 11.667, 14.333, 15.267, 16.133, 18.067, 19.233, 22.2, 26.6, 27.133, 29.367, 30.8, 34.2, 36.567];
const ZCICLO = [1, 1.06, 1, 1.12];
const FLASHES = [3.467, 16.133, 22.2, 26.6, 30.8, 34.2, 36.567];
const EXPLOSOES = [{a: 0.35, p: 0.85, b: 1.6}, {a: 3.6, p: 4.05, b: 4.75}, {a: 37.75, p: 38.2, b: 38.764}];

const PASSOS = [
  {n: 1, t0: 3.467, t1: 6.033, txt: 'Crie um projeto'},
  {n: 2, t0: 6.033, t1: 9.967, txt: 'Conecte o e-mail'},
  {n: 3, t0: 9.967, t1: 14.333, txt: 'Peça o resumo do dia'},
  {n: 4, t0: 14.333, t1: 26.6, txt: 'Dê contexto'},
  {n: 5, t0: 26.6, t1: 34.2, txt: 'Agende a tarefa'},
];

/** câmera da tela: zoom (z) e foco (fx, fy) em pixels da gravação 1080×960 */
type K = {t: number; z: number; fx: number; fy: number};
const CAM: K[] = [
  {t: 3.467, z: 1.15, fx: 600, fy: 400},
  {t: 4.3, z: 1.15, fx: 600, fy: 400},
  {t: 4.9, z: 1.3, fx: 540, fy: 420},
  {t: 6.0, z: 1.3, fx: 540, fy: 420},
  {t: 6.1, z: 1.2, fx: 560, fy: 420},
  {t: 7.0, z: 1.35, fx: 600, fy: 330},
  {t: 8.0, z: 1.35, fx: 600, fy: 330},
  {t: 8.5, z: 1.5, fx: 680, fy: 600},
  {t: 9.95, z: 1.5, fx: 680, fy: 600},
  {t: 10.0, z: 1.45, fx: 420, fy: 700},
  {t: 11.4, z: 1.45, fx: 420, fy: 700},
  {t: 12.1, z: 1.15, fx: 520, fy: 470},
  {t: 14.3, z: 1.15, fx: 520, fy: 470},
  {t: 14.36, z: 1.2, fx: 600, fy: 420},
  {t: 14.9, z: 1.75, fx: 870, fy: 330},
  {t: 16.2, z: 1.8, fx: 870, fy: 330},
  {t: 26.6, z: 1.2, fx: 640, fy: 400},
  {t: 27.1, z: 1.25, fx: 700, fy: 360},
  {t: 27.6, z: 1.6, fx: 800, fy: 300},
  {t: 28.4, z: 1.6, fx: 800, fy: 300},
  {t: 28.9, z: 1.2, fx: 600, fy: 420},
  {t: 29.36, z: 1.2, fx: 600, fy: 420},
  {t: 29.4, z: 1.2, fx: 680, fy: 700},
  {t: 30.6, z: 1.45, fx: 680, fy: 700},
  // tela cheia: o pedido do agendamento
  {t: 30.8, z: 1.7, fx: 737, fy: 330},
  {t: 32.4, z: 1.75, fx: 737, fy: 330},
  {t: 34.2, z: 1.75, fx: 737, fy: 360},
];
const cam = (t: number) => {
  let i = 0;
  while (i < CAM.length - 1 && CAM[i + 1].t <= t) i++;
  const a = CAM[i], b = CAM[Math.min(i + 1, CAM.length - 1)];
  if (b === a || t <= a.t) return a;
  const p = inOut(cl((t - a.t) / (b.t - a.t)));
  return {t, z: a.z + (b.z - a.z) * p, fx: a.fx + (b.fx - a.fx) * p, fy: a.fy + (b.fy - a.fy) * p};
};

// ---------- helpers visuais ----------
const txt = (size: number, weight = 600, color = COR.branco, extra: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: FONTE, fontSize: size, fontWeight: weight, color, lineHeight: 1.12, letterSpacing: size > 50 ? -1 : 0, ...extra,
});
const Abs: React.FC<{x: number; y: number; w?: number; h?: number; o?: number; s?: number; dy?: number; dx?: number; style?: React.CSSProperties; children?: React.ReactNode}> = ({x, y, w, h, o = 1, s = 1, dx = 0, dy = 0, style, children}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h, opacity: o, transform: `translate(${dx}px, ${dy}px) scale(${s})`, ...style}}>{children}</div>
);
const Tag: React.FC<{t: string; bg?: string; fg?: string; size?: number}> = ({t, bg = COR.ambar, fg = COR.preto, size = 28}) => (
  <div style={{display: 'inline-block', background: bg, color: fg, fontFamily: FONTE, fontWeight: 600, fontSize: size, padding: `${size * 0.28}px ${size * 0.55}px`, borderRadius: size * 0.3, letterSpacing: 0.5}}>{t}</div>
);
const Grade: React.FC<{t: number}> = ({t}) => {
  const step = 60, off = (t * 6) % step, L = [];
  for (let x = 0; x <= 1080; x += step) L.push(<line key={`v${x}`} x1={x} y1={0} x2={x} y2={1920} stroke={COR.grade} strokeWidth={2} />);
  for (let y = -step; y <= 1920 + step; y += step) L.push(<line key={`h${y}`} x1={0} y1={y + off} x2={1080} y2={y + off} stroke={COR.grade} strokeWidth={2} />);
  return <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>{L}</svg>;
};
const Doc: React.FC<{w: number; cor?: string}> = ({w, cor = COR.sec}) => (
  <svg width={w} height={w * 1.25} viewBox="0 0 40 50">
    <path d="M4 2 H27 L36 11 V48 H4 Z" fill={COR.sup2} stroke={cor} strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M27 2 V11 H36" fill="none" stroke={cor} strokeWidth={2.5} />
    <line x1="10" y1="22" x2="30" y2="22" stroke={cor} strokeWidth={2.5} /><line x1="10" y1="30" x2="30" y2="30" stroke={cor} strokeWidth={2.5} /><line x1="10" y1="38" x2="22" y2="38" stroke={cor} strokeWidth={2.5} />
  </svg>
);
const Check: React.FC<{size?: number}> = ({size = 44}) => (
  <svg width={size} height={size} viewBox="0 0 40 40"><circle cx="20" cy="20" r="19" fill={COR.petroleo} /><path d="M11 20.5 L17.5 27 L29 14" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" /></svg>
);

// ---------- legenda karaokê (2 a 4 palavras, branca, uma palavra-chave âmbar) ----------
type W = {text: string; startMs: number; endMs: number};
const WORDS = captions as W[];
const CHAVE = new Set(['IA', 'yakisoba', 'projeto.', 'e-mail,', 'MCP,', 'plugins.', 'resumir', 'contexto', 'arquivos', 'design,', 'rotinas,', 'produtos,', 'informações.', 'Claude', 'recorrente.', 'guardar.', 'esquecer', 'dia?', 'Primeiro', 'Segundo', 'Terceiro,', 'Quarto,', 'último,', 'segue']);
const grupos: W[][] = (() => {
  const G: W[][] = [];
  let cur: W[] = [];
  WORDS.forEach((w, i) => {
    cur.push(w);
    const prox = WORDS[i + 1];
    const fimFrase = /[.,?]$/.test(w.text);
    const corteVisual = prox && CORTES.some((c) => c > w.startMs / 1000 && c <= prox.startMs / 1000 && [3.467, 16.133, 26.6, 30.8, 34.2, 36.567].includes(c));
    const len = cur.map((x) => x.text).join(' ').length;
    if (!prox || cur.length >= 4 || (fimFrase && cur.length >= 2) || corteVisual || len > 18) { G.push(cur); cur = []; }
  });
  return G;
})();
const Legenda: React.FC<{t: number; y: number}> = ({t, y}) => {
  const ms = t * 1000;
  const g = grupos.find((x, i) => ms >= x[0].startMs - 60 && (i === grupos.length - 1 || ms < grupos[i + 1][0].startMs - 60));
  if (!g || ms > g[g.length - 1].endMs + 500) return null;
  let usouChave = false;
  const s = 0.9 + 0.1 * ent(t, g[0].startMs / 1000 - 0.06, 0.12);
  return (
    <div style={{position: 'absolute', left: 64, width: 864, top: y, display: 'flex', justifyContent: 'center', transform: `scale(${s})`}}>
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 18px'}}>
        {g.map((w, i) => {
          const dito = ms >= w.startMs - 40;
          const chave = !usouChave && CHAVE.has(w.text);
          if (chave) usouChave = true;
          return (
            <span key={i} style={{...txt(66, 600, chave ? COR.ambar : COR.branco), opacity: dito ? 1 : 0.38, WebkitTextStroke: '10px #000', paintOrder: 'stroke fill'}}>{w.text}</span>
          );
        })}
      </div>
    </div>
  );
};

// ---------- headline do gancho (Contorno) ----------
const Headline: React.FC<{t: number}> = ({t}) => {
  if (t > SPLIT0 + 0.1) return null;
  const o = Math.min(ent(t, 0.05, 0.25), cl((SPLIT0 + 0.05 - t) / 0.2));
  const st: React.CSSProperties = {WebkitTextStroke: '14px #000', paintOrder: 'stroke fill'};
  return (
    <Abs x={64} y={330} w={952} o={o} style={{textAlign: 'center'}}>
      <div style={{...txt(78, 300), ...st, transform: `translateY(${(1 - ent(t, 0.05)) * 30}px)`}}>Usar IA de verdade</div>
      <div style={{...txt(124, 600), ...st, marginTop: 6, transform: `scale(${0.6 + 0.4 * pop(t, 0.35)})`}}>em 5 passos</div>
    </Abs>
  );
};

// ---------- rótulo do passo + progresso ----------
const Passo: React.FC<{t: number; top: number}> = ({t, top}) => {
  const p = PASSOS.find((x) => t >= x.t0 && t < x.t1);
  if (!p) return null;
  const e = ent(t, p.t0, 0.25);
  return (
    <>
      <Abs x={40} y={top} o={e} dx={(1 - e) * -40}>
        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          <Tag t={`Passo ${p.n}`} size={30} />
          <Tag t={p.txt} size={30} bg="rgba(10,10,10,0.88)" fg={COR.branco} />
        </div>
      </Abs>
      <Abs x={860} y={top + 14} o={e}>
        <div style={{display: 'flex', gap: 10}}>
          {PASSOS.map((q) => (
            <div key={q.n} style={{width: q.n === p.n ? 34 : 14, height: 14, borderRadius: 7, background: q.n <= p.n ? COR.ambar : 'rgba(255,255,255,0.25)'}} />
          ))}
        </div>
      </Abs>
    </>
  );
};


// ---------- resumo do dia GENÉRICO (v3: o resumo real não aparece, nem borrado) ----------
const RESUMO = [
  {h: 'Hoje chegaram 12 e-mails. 3 pedem sua atenção:', b: false},
  {h: 'Atenção', b: true},
  {h: '• Banco: a fatura do cartão vence na sexta.', b: false},
  {h: '• Equipe: reunião de amanhã mudou para 15h.', b: false},
  {h: '• Curso: novo módulo liberado.', b: false},
  {h: 'Tarefas', b: true},
  {h: '• Revisar a proposta do cliente.', b: false},
  {h: '• Responder o fornecedor até 17h.', b: false},
  {h: 'Resto', b: true},
  {h: '• 6 newsletters e 3 promoções.', b: false},
];
const RES_JANELAS: [number, number, number][] = [[12.72, 16.14, 13.0], [26.6, 26.76, 26.6]];
const Resumo: React.FC<{t: number}> = ({t}) => {
  const j = RES_JANELAS.find(([a, b]) => t >= a && t < b);
  if (!j) return null;
  const t0 = j[2];
  return (
    <div style={{position: 'absolute', left: 336, top: 186, width: 380}}>
      {RESUMO.map((l, i) => {
        const o = j[0] === 26.6 ? 1 : ent(t, t0 + i * 0.09, 0.2);
        return (
          <div key={i} style={{fontFamily: FONTE, fontSize: l.b ? 16 : 15, fontWeight: l.b ? 600 : 400, color: '#ECECEC', lineHeight: 1.35, marginTop: l.b ? 14 : 4, opacity: o, transform: `translateY(${(1 - o) * 8}px)`}}>{l.h}</div>
        );
      })}
    </div>
  );
};

// ---------- a tela (gravação), recortada sem a barra do navegador ----------
const Tela: React.FC<{t: number; w: number; h: number}> = ({t, w, h}) => {
  const c = cam(t);
  // a janela mostra w×h; com z, vê w/z × h/z da gravação, presa à área útil (y 120–960)
  const vw = 1080 / c.z, vh = (h * (1080 / w)) / c.z;
  const fx = cl(c.fx, vw / 2, 1080 - vw / 2);
  const fy = cl(c.fy, 120 + vh / 2, 960 - vh / 2);
  const k = (w / 1080) * c.z;
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: '#000'}}>
      <div style={{position: 'absolute', left: w / 2 - fx * k, top: h / 2 - fy * k, width: 1080 * k, height: 960 * k}}>
        <OffthreadVideo src={staticFile('tela_track.mp4')} muted style={{width: '100%', height: '100%'}} />
        <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 960, transform: `scale(${k})`, transformOrigin: '0 0'}}>
          <Resumo t={t} />
        </div>
      </div>
    </div>
  );
};

// ---------- cena animada no lugar da tela: contexto → Claude ----------
const ITENS = [
  {t: 18.07, txt: 'Cores de design', cor: COR.ambar},
  {t: 19.23, txt: 'Rotinas', cor: COR.petroleoClaro},
  {t: 20.32, txt: 'Produtos', cor: '#7C9BFF'},
  {t: 21.28, txt: 'Informações', cor: COR.branco},
];
const CenaContexto: React.FC<{t: number}> = ({t}) => {
  // 16.13–22.2: painel "Contexto" recebendo os arquivos do trabalho
  if (t < CENA0 || t >= CENA1) return null;
  const o1 = jan(t, CENA0, 22.25, 0.2, 0.25);
  const o2 = jan(t, 22.2, CENA1 + 0.05, 0.25, 0.2);
  const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
  return (
    <div style={{position: 'absolute', inset: 0, background: COR.fundo, overflow: 'hidden'}}>
      <Grade t={t} />
      {o1 > 0 ? (
        <div style={{position: 'absolute', inset: 0, opacity: o1}}>
          {/* pasta "seu trabalho" à direita, de onde saem os arquivos */}
          <Abs x={700} y={150} w={300} s={pop(t, 16.4)} style={{transformOrigin: '150px 150px', textAlign: 'center'}}>
            <svg width={300} height={220} viewBox="0 0 120 88">
              <path d="M4 14 H44 L52 24 H116 V84 H4 Z" fill={COR.sup2} stroke={COR.sec} strokeWidth={3} strokeLinejoin="round" />
            </svg>
            <div style={{...txt(30, 400, COR.sec), marginTop: 10}}>seu trabalho</div>
          </Abs>
          {[0, 1, 2].map((i) => (
            <Abs key={i} x={760 + i * 60} y={210 + Math.sin(t * 3 + i) * 6} o={ent(t, 16.5 + i * 0.12)}><Doc w={54} /></Abs>
          ))}
          {/* painel Contexto */}
          <Abs x={60} y={70} w={560} h={580} o={ent(t, CENA0, 0.25)} style={{background: COR.sup, border: `2px solid ${COR.borda}`, borderRadius: 28, padding: 34, boxSizing: 'border-box'}}>
            <div style={txt(44, 600)}>Contexto</div>
            <div style={{...txt(26, 400, COR.sec), marginTop: 8}}>Instruções · Memória · Arquivos</div>
            <div style={{height: 2, background: COR.borda, margin: '26px 0'}} />
            <div style={txt(30, 600, COR.sec)}>Arquivos</div>
            {ITENS.map((it, i) => {
              const a = it.t;
              const p = outCubic(cl((t - a) / 0.45));
              if (t < a) return null;
              return (
                <div key={i} style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 20, transform: `translate(${(1 - p) * 640}px, ${(1 - p) * -160}px) scale(${0.7 + 0.3 * p})`, transformOrigin: 'left center'}}>
                  <Doc w={40} cor={it.cor} />
                  <div style={txt(38, 600, it.cor)}>{it.txt}</div>
                  {p > 0.95 ? <div style={{marginLeft: 'auto', opacity: ent(t, a + 0.45, 0.2)}}><Check size={38} /></div> : null}
                </div>
              );
            })}
          </Abs>
        </div>
      ) : null}
      {o2 > 0 ? (
        <div style={{position: 'absolute', inset: 0, opacity: o2}}>
          {/* Claude no centro recebendo o contexto */}
          {ITENS.map((it, i) => {
            const ang = (i / ITENS.length) * Math.PI * 2 + t * 0.9;
            const ent2 = ent(t, 22.3 + i * 0.1, 0.4);
            const absorve = outCubic(cl((t - 23.8) / 0.7));
            const r = (1 - absorve) * 270 + 20;
            return (
              <Abs key={i} x={540 + Math.cos(ang) * r - 120} y={330 + Math.sin(ang) * r * 0.62 - 26} o={ent2 * (1 - absorve * 0.95)} w={240} style={{textAlign: 'center'}}>
                <Tag t={it.txt} size={28} bg={COR.sup2} fg={it.cor} />
              </Abs>
            );
          })}
          <Abs x={540 - 110} y={330 - 110} w={220} h={220} s={pop(t, 22.5) * (1 + 0.08 * Math.max(0, Math.sin((t - 23.8) * 6)) * cl((t - 23.8) * 2) * cl((25 - t) * 2))} style={{transformOrigin: '110px 110px'}}>
            <Img src={staticFile('logos/claude-chat-icon.png')} style={{width: 220, height: 220, transform: `rotate(${t * 20}deg)`}} />
          </Abs>
          <Abs x={0} y={520} w={1080} o={ent(t, 22.6)} style={{textAlign: 'center'}}>
            <div style={txt(40, 600)}>Claude</div>
          </Abs>
          {/* dia a dia */}
          <Abs x={170} y={600} w={740} o={ent(t, 25.6, 0.25)}>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              {dias.map((d, i) => {
                const on = t >= 25.85 + i * 0.12;
                return <div key={d} style={{...txt(28, 600, on ? COR.preto : COR.sec), background: on ? COR.ambar : COR.sup2, borderRadius: 14, padding: '10px 22px'}}>{d}</div>;
              })}
            </div>
          </Abs>
        </div>
      ) : null}
    </div>
  );
};

// ---------- extras sobre a tela ----------
const Extras: React.FC<{t: number}> = ({t}) => (
  <>
    {/* MCP traduzido na primeira vez */}
    {t >= 8.1 && t < 9.97 ? (
      <Abs x={60} y={560} o={jan(t, 8.1, 9.97, 0.2, 0.15)} s={0.85 + 0.15 * pop(t, 8.1)} style={{transformOrigin: 'left center'}}>
        <div style={{background: 'rgba(10,10,10,0.92)', border: `2px solid ${COR.ambar}`, borderRadius: 22, padding: '18px 26px'}}>
          <div style={txt(36, 600, COR.ambar)}>MCP</div>
          <div style={{...txt(30, 400), marginTop: 4}}>o conector que liga o Claude aos seus apps</div>
        </div>
      </Abs>
    ) : null}
    {/* e-mail */}
    {t >= 6.75 && t < 8.05 ? (
      <Abs x={780} y={470} o={jan(t, 6.75, 8.05, 0.15, 0.15)} s={pop(t, 6.75)} style={{transformOrigin: 'center'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(10,10,10,0.92)', borderRadius: 22, padding: '14px 20px'}}>
          <Img src={staticFile('logos/gmail.svg')} style={{width: 76, height: 57}} />
          <div style={txt(34, 600)}>Gmail</div>
        </div>
      </Abs>
    ) : null}
  </>
);


// ---------- o pedido do agendamento, legível (tela cheia) ----------
const PEDIDO = 'Ajude-me a configurar uma tarefa agendada. Quero que você me mande diariamente, ao final do dia, às 18 horas, o resumo do meu e-mail e as tarefas que ficaram marcadas comigo.';
const Pedido: React.FC<{t: number}> = ({t}) => {
  if (t < FULL0 + 0.15 || t >= FECHO) return null;
  const e = ent(t, FULL0 + 0.15, 0.3);
  const n = Math.round(PEDIDO.length * cl((t - FULL0 - 0.3) / 1.6));
  return (
    <>
      <Abs x={70} y={640} w={940} o={e} dy={(1 - e) * 40} style={{background: 'rgba(22,22,22,0.96)', border: `2px solid ${COR.borda}`, borderRadius: 30, padding: '30px 36px', boxSizing: 'border-box'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16}}>
          <Img src={staticFile('logos/claude-chat-icon.png')} style={{width: 40, height: 40}} />
          <div style={txt(28, 600, COR.sec)}>O pedido</div>
        </div>
        <div style={txt(40, 400, COR.branco, {lineHeight: 1.3})}>{PEDIDO.slice(0, n)}<span style={{opacity: n < PEDIDO.length ? 1 : 0, color: COR.ambar}}>|</span></div>
      </Abs>
      <Abs x={70} y={1120} o={ent(t, 32.3, 0.25)} s={0.8 + 0.2 * pop(t, 32.3)} style={{transformOrigin: 'left center'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <Tag t="Todo dia, 18h" size={36} />
          <Tag t="Resumo + tarefas" size={36} bg={COR.sup2} fg={COR.branco} />
          <div style={{opacity: ent(t, 32.8, 0.2)}}><Check size={56} /></div>
        </div>
      </Abs>
    </>
  );
};


const Cta: React.FC<{t: number}> = ({t}) => {
  const e = ent(t, CTA0 + 0.03, 0.25);
  const segue = t >= 34.83;
  const ps = segue ? 1 - 0.08 * Math.sin(cl((t - 34.83) / 0.25) * Math.PI) : 1;
  return (
    <>
      <Abs x={0} y={340} w={1080} o={e} s={0.8 + 0.2 * pop(t, CTA0)} style={{textAlign: 'center', transformOrigin: '540px 60px'}}>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: 18, background: segue ? COR.sup2 : COR.ambar, border: `3px solid ${segue ? COR.borda : COR.ambar}`, borderRadius: 60, padding: '24px 54px', transform: `scale(${ps})`}}>
          {segue ? <Check size={52} /> : null}
          <div style={txt(56, 600, segue ? COR.branco : COR.preto)}>{segue ? 'Seguindo' : 'Seguir'}</div>
        </div>
        <div style={{...txt(30, 400, COR.sec), marginTop: 18}}>@falaibruno</div>
      </Abs>
    </>
  );
};

// ---------- fecho ----------
const Fecho: React.FC<{t: number}> = ({t}) => {
  if (t < FECHO) return null;
  if (t < PERG0) return <Cta t={t} />;
  const e = ent(t, PERG0 + 0.05, 0.3);
  return (
    <>
      <Abs x={64} y={330} w={952} o={e} dy={(1 - e) * 30} style={{textAlign: 'center'}}>
        <div style={{display: 'inline-block', background: COR.sup, border: `2px solid ${COR.borda}`, borderRadius: 30, padding: '30px 40px'}}>
          <div style={txt(34, 600, COR.ambar)}>Falai</div>
          <div style={{...txt(54, 600), marginTop: 8}}>Isso te ajuda no dia a dia?</div>
        </div>
      </Abs>
      <Abs x={340} y={580} w={400} o={ent(t, 37.9, 0.3)} style={{textAlign: 'center'}}>
        <Img src={staticFile('brand/assinatura-branco.svg')} style={{width: 300}} />
      </Abs>
    </>
  );
};

// ---------- camada ----------
const explosao = (t: number) => {
  let e = 0;
  for (const x of EXPLOSOES) {
    if (t < x.a || t > x.b) continue;
    e = Math.max(e, t <= x.p ? inOut(cl((t - x.a) / (x.p - x.a))) : 1 - inOut(cl((t - x.p) / (x.b - x.p))));
  }
  return e;
};
const Plano: React.FC<{z: number; e: number; rotulo: string; fundo?: boolean; children: React.ReactNode}> = ({z, e, rotulo, fundo, children}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `translateZ(${z * e}px)`, transformStyle: 'preserve-3d', background: fundo ? COR.fundo : undefined, outline: e > 0.02 ? `3px solid rgba(163,163,163,${0.85 * e})` : undefined}}>
    {children}
    {e > 0.05 ? <div style={{position: 'absolute', left: 40, top: 40, opacity: cl((e - 0.2) / 0.5)}}><Tag t={rotulo} size={44} bg={fundo ? COR.ambar : COR.branco} /></div> : null}
  </div>
);

const zoomCorte = (t: number) => {
  let i = 0;
  while (i < CORTES.length - 1 && CORTES[i + 1] <= t) i++;
  const a = CORTES[i], b = CORTES[i + 1] ?? FIM;
  return ZCICLO[i % ZCICLO.length] * (1 + 0.03 * cl((t - a) / (b - a)));
};

// geometria da tela dividida
const TELA_Y = 224, TELA_H = 720, LINHA_Y = 942, ROSTO_Y = 960;
const TELA_CHEIA_Y = 300, TELA_CHEIA_H = 1100;

export const Agenda: React.FC = () => {
  useInter();
  const t = useCurrentFrame() / 30;
  const e = explosao(t);
  const split = t >= SPLIT0 && t < FECHO;
  const cheia = cl((t - FULL0) / 0.3) * (t < FECHO ? 1 : 0); // 0 = dividida, 1 = tela cheia
  const ci = inOut(cheia);
  const telaY = TELA_Y + (TELA_CHEIA_Y - TELA_Y) * ci;
  const telaH = TELA_H + (TELA_CHEIA_H - TELA_H) * ci;
  const z = zoomCorte(t);
  // Bruno: tela cheia no gancho e no fecho; metade de baixo na dividida; sai no pedido em tela cheia
  const brunoFull = !split;
  const sai = ci;
  const flash = FLASHES.reduce((m, f) => Math.max(m, t >= f && t < f + 0.2 ? 1 - (t - f) / 0.2 : 0), 0);
  const legY = brunoFull ? 740 : cheia > 0.5 ? 1290 : 958;
  return (
    <AbsoluteFill style={{background: COR.fundo, perspective: 2600, perspectiveOrigin: '50% 48%', overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transformStyle: 'preserve-3d', transform: `scale(${1 - 0.42 * e}) rotateX(${12 * e}deg) rotateY(${-38 * e}deg)`}}>
        <Plano z={-900} e={e} rotulo="Fundo" fundo>
          <Grade t={t} />
        </Plano>
        <Plano z={-420} e={e} rotulo={split ? 'Tela' : 'Elementos'}>
          {split ? (
            <div style={{position: 'absolute', left: 0, top: telaY, width: 1080, height: telaH, overflow: 'hidden', borderRadius: 4 * ci}}>
              {t < CENA0 || t >= CENA1 ? <Tela t={t} w={1080} h={telaH} /> : null}
              <CenaContexto t={t} />
              {cheia < 0.01 ? <Extras t={t} /> : null}
            </div>
          ) : null}
          {split && cheia < 0.99 ? <div style={{position: 'absolute', left: 0, top: LINHA_Y, width: 1080, height: 3, background: COR.ambar, opacity: 1 - ci}} /> : null}
        </Plano>
        <Plano z={0} e={e} rotulo="Bruno">
          {brunoFull ? (
            <div style={{position: 'absolute', inset: 0, transform: `scale(${z})`, transformOrigin: '540px 1350px'}}>
              <div style={{position: 'absolute', left: -81, top: 816, width: 1242, height: 1104}}>
                <OffthreadVideo src={staticFile('pessoa.webm')} transparent muted style={{width: '100%', height: '100%'}} />
              </div>
            </div>
          ) : sai < 0.999 ? (
            <div style={{position: 'absolute', left: 0, top: ROSTO_Y + 960 * sai, width: 1080, height: 960, overflow: 'hidden'}}>
              <div style={{position: 'absolute', inset: 0, transform: `scale(${z})`, transformOrigin: '540px 430px'}}>
                <OffthreadVideo src={staticFile('pessoa.webm')} transparent muted style={{width: 1080, height: 960}} />
              </div>
            </div>
          ) : null}
        </Plano>
        <Plano z={380} e={e} rotulo="Texto">
          <Headline t={t} />
          {split ? <Passo t={t} top={telaY + 22} /> : null}
          <Fecho t={t} />
          <Pedido t={t} />
          {t >= 0.3 ? <Legenda t={t} y={legY} /> : null}
          {split && cheia < 0.5 ? (
            <Img src={staticFile('brand/simbolo-mono-branco.svg')} style={{position: 'absolute', left: 996, top: 870, width: 46, height: 46, opacity: 0.85}} />
          ) : t < FECHO && !split ? (
            <Img src={staticFile('brand/simbolo-mono-branco.svg')} style={{position: 'absolute', left: 924, top: 252, width: 56, height: 56}} />
          ) : null}
        </Plano>
      </div>
      {flash > 0 ? <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: 0.55 * flash}} /> : null}
    </AbsoluteFill>
  );
};
