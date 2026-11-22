# Receita: vídeo curto com camadas 3D e animações atrás do Bruno

Aprovada pelo Bruno em 22/11/2026 ("tá perfeito") no vídeo *As vagas que pedem IA dobraram* (`projetos/2026-11-22-vagas-ia-regravacao/`). **É o padrão para os próximos vídeos curtos gravados no fundo verde.** O código da cena está em [`projetos/2026-11-22-vagas-ia-regravacao/remotion/FalaiBruno.tsx`](../../projetos/2026-11-22-vagas-ia-regravacao/remotion/FalaiBruno.tsx), e os tempos em `edit-data.json`, na mesma pasta.

## O resultado

- 9:16, 1080×1920, 30 fps, −14 LUFS, cerca de 45 s.
- O Bruno fica recortado na metade de baixo, sobre um fundo quase preto (#0B0B0B) com uma grade sutil que se move. O enquadramento segue o rosto, e a base tem um degradê para não aparecer o corte do tronco.
- Há uma animação para **cada frase**, desenhada na marca (Inter, preto, âmbar #E8A33D, petróleo, cobalto), e várias passam **atrás** dele.
- São 4 camadas (Fundo → Elementos → Bruno → Texto) que **se separam em perspectiva 3D**, com o nome de cada camada à mostra, em três momentos: na abertura, no regancho ("Agora, um detalhe") e no fim.
- Headline mista nos primeiros 4 s (linha 1 leve e branca, linha 2 pesada e âmbar) e legenda karaokê na emenda entre as animações e a cabeça.
- Zoom seco de 8% ou 18% em cada corte, com um empurrão de 3% dentro de cada trecho. Flash de luz em 5 trocas de cena. 40 a 45 efeitos sonoros curtos a −8 dB da voz. Sem trilha.

## Passo a passo

1. **Bruto e briefing.** O bruto chega em `~/Movies/` com nome de data. Copie para `videos/brutos/<tema> DDMMAAAA/`, crie `projetos/AAAA-MM-DD-nome/briefing.md` e busque a pauta no Notion.
2. **Fase 1 do Edvid** (corte limpo): transcrever, revisar (nomes como Gupy e agente), `voice_levels`, EDL com bordas do `speech_regions`, `render.py`, `verify_cut.py`. Conferir o início e o fim de frase em voz baixa ("Depois", "dobraram"). Mostrar a prévia e **esperar a aprovação**.
3. **Estilo** (aba Estilo do editor): o Bruno escolheu tela dividida, headline mista, karaokê, âmbar #E8A33D, tracking, zoom automático, zoom nos cortes e flash, sem trilha de IA.
4. **Recorte.** Compare no **mesmo quadro** o chroma key e o Apple Vision (`recorte_pessoa.py`). Em 22/11 ganhou o chroma key: `chromakey=0x6CC042:0.10:0.03` + `despill=type=green:mix=0.5:expand=0`. Tolerância alta come o cabelo. Em 21/11 o Vision foi melhor, então a escolha depende da luz e tem que ser testada.
5. **Bruno no 9:16:** `face_track.py cut.mp4 -o verify/track_src.json --smooth 1.5` e depois `python3 scripts/montar_pessoa.py cut.mp4 verify/track_src.json remotion/public/pessoa_v.mov` (ProRes 4444 com alfa, topo da cabeça em ~790 px).
6. **Remotion:** `preparar_remotion.py shortform edit/remotion`, copiar `cut.mp4`, `fonts/` e `brand/`, `transcribe.py cut.mp4` + `revisar.py --herdar cut` + `captions_for_remotion.py`, gerar `segments.json` pela contagem de frames e um `track.json` neutro (o template exige o arquivo). Copiar `FalaiBruno.tsx` para `src/cenas/` e montá-lo **antes** dos flashes em `CustomGraphics.tsx`.
7. **edit-data.json:** `camera.enabled: false` (a base do template fica coberta), `hook.enabled: false` (a headline é a da camada própria), `captions` karaokê com `paddingBottom: 1130`, `transitions` nas trocas de cena principais e o bloco `falai` com `headline`, `explosoes`, `cortes` (zoom por corte, ciclo 1 / 1,08 / 1 / 1,18…), `pushIn: 0.03` e `cenas` (janela de cada frase + marcas `m` com o segundo exato de cada palavra-chave, tiradas de `transcripts/cut.json`). As janelas começam no corte + 1 frame.
8. **Escrever as cenas** (uma por frase) no `FalaiBruno.tsx`. Use as do vídeo de 22/11 como ponto de partida e troque o conteúdo.
9. **Conferir com stills** (`npx remotion still Reels --frame=N`), juntando várias numa imagem só: cada cena no pico, a explosão 3D, o flash e o rosto livre.
10. **Som:** copiar o kit `crisp` (`sfx/kit.json` + `kit/`), escrever `sfx/cues.json` (whoosh.long nas explosões, pop nas entradas, hit nos números grandes, snap nos destaques, click nos flashes e nos botões, tick no contador) e rodar `sfx.py mix … --voice cut.mp4 --rel-db -8`.
11. **Render e entrega:** `npx remotion render Reels out/render.mp4`, juntar a voz do `cut.mp4` com o `sfx.wav` (amix), fazer o loudnorm em duas passadas (−14 LUFS, −1 dBTP) e salvar em `videos/brutos/<pasta>/<pasta>_final.mp4`. Gerar uma prévia leve em 720p (< 20 MB) para o celular.
12. **Registro:** briefing, `docs/aprendizados.md`, uma cópia do `FalaiBruno.tsx`/`edit-data.json` em `projetos/<projeto>/remotion/`, a linha no banco **Posts** do Notion, e depois commit e push.

## Geometria (1080×1920)

| Zona | Onde | Uso |
|---|---|---|
| Rótulo e fonte | y 300–380, x 90 | tag âmbar com o assunto e a fonte do dado em cinza |
| Zona A | y 390–690 | a ilustração principal da frase |
| Legenda | ~740 (emenda) | karaokê do template |
| Bruno | topo da cabeça em ~790, queixo em ~1590, degradê de 80,5% a 91% da altura | — |
| Laterais | x 20–250 e 830–1060, y 800–1500 | elementos **atrás** dele (cards, barras, prateleiras, comentários) |
| Atrás da cabeça | o quadro todo | elementos grandes que ele cobre em parte: gráfico subindo, parede de vagas, relógio, lupa, ciclo em arco |
| Marca d'água | símbolo branco em (924, 252), 56 px | até o fecho |

Zoom do Bruno com origem em (540, 1000). A 18%, a cabeça encosta na legenda, e isso foi aceito.

## Cenas que funcionaram (uma por frase)

Gráfico subindo atrás da cabeça + cards de vaga com "Requisito: IA" · grade de 100 + departamentos acendendo nas laterais · marca da fonte + contador rolando até o número + parede de itens sendo "lida" por uma linha âmbar atrás dele · barras laterais crescendo + pódio · descrição de vaga com palavras marcadas + selo carimbado + palavras se multiplicando e subindo atrás dele · "o detalhe" com lupa · grade com 1,2% + prateleiras de cursos (só uma lombada de IA) · painéis "na entrada" × "dentro de casa" + porta e casa vazia · curso que nunca carrega + relógio gigante atrás · ciclo testa → erra → estuda → testa de novo em arco em volta da cabeça · log de testes rolando + certificado riscado + "0 cursos" · botão Seguir clicado + "+1" subindo + IAs com o 1º lugar · enquete Sim/Não + comentários · logo animado e o wordmark.

## Armadilhas

- O hook do template **ignora `hook.accent`** e pinta laranja (#ff5200). Faça a headline na camada própria.
- O template precisa de `track.json` mesmo sem tracking. Escreva um neutro.
- No zsh, `"$M:linear"` vira o modificador `:l`. Use `"${M}:linear"`.
- O primeiro quadro de um `recorte_pessoa.py` sai vazio (aquecimento). Não julgue o recorte por ele.
- Número dito × número da fonte (300% × 325%): a tela mostra o da fonte.
