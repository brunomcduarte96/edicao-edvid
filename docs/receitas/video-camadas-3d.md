# Receita: vídeo curto com camadas 3D e animações em tela cheia

> **Fonte da verdade:** a página [Edição - regras e aprendizados](https://app.notion.com/p/4207642f4299818ea2a8f1ed6f112279) no Notion (dentro de Produção de Conteúdo) compila as regras, a receita e os aprendizados. Se este arquivo divergir dela, o Notion vale. Ao fim de cada rodada, atualize a página no Notion e depois este arquivo.

**É o padrão para os vídeos curtos gravados no fundo verde.** Duas versões aprovadas pelo Bruno:

- **Atual (v2):** *Do Zero #1: montei meu canal com IA*, aprovado em 22/11/2026 ("está perfeito"). Código em [`projetos/2026-11-22-do-zero-1/remotion/FalaiBruno.tsx`](../../projetos/2026-11-22-do-zero-1/remotion/FalaiBruno.tsx), com os tempos em `edit-data.json` e os sons em `sfx-cues.json`, na mesma pasta. **Comece por ela.**
- Primeira (v1): *As vagas que pedem IA dobraram*, aprovada em 22/11 ("tá perfeito"), em `projetos/2026-11-22-vagas-ia-regravacao/remotion/`. Nela o Bruno fica grande e na tela o tempo todo. O Bruno trocou isso na rodada seguinte ("pareço um fantasminha flutuando; não preciso estar na tela 100% do tempo, nem perto disso").

## O resultado

- 9:16, 1080×1920, 30 fps, −14 LUFS (pico ≤ −1 dBTP), de 45 a 75 s.
- Fundo quase preto (#0B0B0B) com uma grade sutil que se move.
- **O Bruno fica menor (~74%) e apoiado na base do quadro**, sem degradê no tronco (o degradê fazia ele "flutuar"). O enquadramento segue o rosto.
- **Ele sai do quadro em ~45% do vídeo:** desliza para baixo em 0,25 s e a animação ocupa a tela toda. Fica na tela no gancho, nas frases pessoais ("junto comigo", virada, CTA) e nas cenas leves. Sai nas cenas de número, gráfico, fluxo e tela de ferramenta.
- Uma animação para **cada frase**, desenhada na marca (Inter, preto, âmbar #E8A33D, petróleo, cobalto). Quando ele está na tela, os elementos laterais passam atrás dele.
- 4 camadas (Fundo → Elementos → Bruno → Texto) que **se separam em perspectiva 3D**, com o nome de cada camada à mostra, em 3 ou 4 momentos: na abertura, no regancho, num momento "meta" se houver ("vocês estão vendo a versão final") e no fim.
- Headline mista nos primeiros ~3 s (linha 1 leve e branca, linha 2 pesada e âmbar) e legenda karaokê logo acima da cabeça.
- Zoom seco de 6% ou 12% em cada corte (ciclo 1 / 1,06 / 1 / 1,12), com um empurrão de 3% dentro de cada trecho. Flash de luz em 5 trocas de cena. 40 a 60 efeitos sonoros curtos a −8 dB da voz. Sem trilha.

## Passo a passo

1. **Bruto e briefing.** O bruto chega em `~/Movies/` com nome de data (várias tomadas: use a última completa). Copie para `videos/brutos/<tema> DDMMAAAA/`, crie `projetos/AAAA-MM-DD-nome/briefing.md` e leia o card na **Producao** do Notion.
2. **Interface do Edvid desde o início.** Escreva `edit/state.json`, suba o `preview_server.py` (se a 4820 estiver ocupada por outra rodada, use outra porta) e ligue o vigia `watch_edits.py` no mesmo passo. Toda prévia passa por ela, mesmo quando o Bruno está no celular. Copie também a prévia para o Drive (`FalaiBruno · Central de Conteúdo/Criativos/<vídeo>/`).
3. **Fase 1 do Edvid** (corte limpo): transcrever, revisar os nomes (Claude, Claude Code, Grok Bot, Notion, Gupy), `voice_levels`, EDL com bordas do `speech_regions`, `render.py`, `verify_cut.py`.
   - **Corte toda pausa de 0,3 s ou mais dentro da frase** que caia num silêncio do `speech_regions`. O `verify_cut` só acusa as de 0,5 s ou mais, e o Bruno marca as menores.
   - Confira as pontas e os trechos suspeitos transcrevendo o trecho isolado.
   - **Se a fala diverge do card** (número, nome), pergunte antes da Fase 2 o que vai na tela.
   - Mostre na interface e **espere a aprovação**.
4. **Estilo:** tela dividida, headline mista, karaokê, âmbar #E8A33D, zoom nos cortes e flash, sem trilha de IA.
5. **Recorte.** Compare no **mesmo quadro** o chroma key e o Apple Vision (`recorte_pessoa.py`). Nas duas gravações de 22/11 ganhou o chroma key: `chromakey=0x6CC042:0.10:0.03` + `despill=type=green:mix=0.5:expand=0`, mesmo com o verde variando de 5A9E3D a 94F181 entre os cantos. Tolerância 0,16 come o rosto. Em 21/11 o Vision foi melhor, então teste.
6. **Bruno no 9:16:** `face_track.py cut.mp4 -o verify/track_src.json --smooth 1.5` e depois `python3 scripts/montar_pessoa.py cut.mp4 verify/track_src.json remotion/public/pessoa_v.mov` (ProRes 4444 com alfa).
7. **Remotion:** copie o projeto Remotion da rodada anterior inteiro (com `node_modules`, sem `public/` e `out/`) e monte o `public/`: `cut.mp4`, `pessoa_v.mov`, `fonts/`, `brand/`, `sfx/`, `logos/`, `caption-cues.json` (`[]`), `captions.json` (`transcribe.py cut.mp4` + `revisar.py --herdar cut` + `captions_for_remotion.py`), `segments.json` pela contagem de frames e um `track.json` neutro.
8. **edit-data.json:**
   - `camera.enabled: false`, `hook.enabled: false`, `captions` karaokê com `paddingBottom: 740` e `transitions` nas trocas principais.
   - O bloco `falai` leva `headline`, `explosoes`, `cortes`, `pushIn: 0.03` e `cenas`.
   - As cenas têm a janela de cada frase e as marcas `m`, com o segundo exato de cada palavra-chave tirado de `transcripts/cut.json`. As janelas começam no corte + 1 frame.
   - **`pessoaEscala: 0.74`** e **`semPessoa`**: lista de janelas `[início, fim]` em que o Bruno sai do quadro.
9. **Escrever as cenas** (uma por frase) no `FalaiBruno.tsx`, partindo das do Do Zero #1.
   - Cena sem o Bruno precisa de conteúdo no centro do quadro (y 800–1500).
   - O que precisa ser lido (tabela, terminal, timeline) vai numa cena sem ele.
   - Ferramentas aparecem com a **logo oficial** e o nome como ele fala.
10. **Conferir com stills** (`npx remotion still Reels --frame=N --scale=0.35`), juntando várias numa imagem só (`ffmpeg … tile=6x3`): cada cena no pico, a explosão 3D, as entradas e saídas do Bruno.
11. **Som:** copie o kit `crisp` (`sfx/kit.json` + `kit/`), escreva `sfx/cues.json` e rode `sfx.py mix … --voice cut.mp4 --rel-db -8`. Onde cada som entra:
    - whoosh.long nas explosões
    - pop nas entradas
    - hit nos números grandes
    - snap nos destaques
    - click nos flashes e nos botões
    - key no texto digitando
    - bell no fecho
12. **Render e entrega:** `npx remotion render Reels out/render.mp4`. Junte a voz do `cut.mp4` com o `sfx.wav` (amix) e faça o loudnorm em duas passadas, com alvo **−14 LUFS e −1,5 dBTP** (com −1, o AAC sai −0,8). Salve em `videos/brutos/<pasta>/<pasta>_final.mp4`, com uma prévia em 720p (< 20 MB). O `edit/finalizar.sh` do Do Zero #1 faz tudo isso de uma vez.
13. **Ajustes:** aplique as marcações da interface, **apague o `preview_edits.json`** (se ficar, o vigia entrega a mesma marcação de novo), atualize o `state.json`, troque o arquivo no Drive e avise.
    - Mexer no corte depois da Fase 2 obriga a refazer recorte, legenda, `segments.json`, tempos das cenas (todos os tempos depois do corte andam a mesma diferença) e SFX.
14. **Registro:** briefing, `docs/aprendizados.md` e uma cópia do `FalaiBruno.tsx`, do `edit-data.json` e do `sfx-cues.json` em `projetos/<projeto>/remotion/`; depois, commit e push. Quem marca Aprovado no Notion é o Bruno, e o agendamento no Buffer só sai depois disso.

## Geometria (1080×1920)

| Zona | Onde | Uso |
|---|---|---|
| Rótulo e fonte | y 300–380, x 90 | tag âmbar com o assunto e a fonte do dado em cinza |
| Zona A | y 390–700 | o título ou a janela principal da frase |
| Centro | y 750–1500 | com o Bruno fora: o elemento grande (gráfico, banco de dados, relógio, timeline, parede) |
| Legenda | base em ~1180 (`paddingBottom` 740) | karaokê do template, logo acima da cabeça |
| Bruno | escala 0,74, base no fim do quadro, topo da cabeça em ~1200 | sem degradê |
| Laterais | x 20–250 e 830–1060, y 800–1500 | elementos de apoio, atrás dele quando está na tela |
| Marca d'água | símbolo branco em (924, 252), 56 px | até o fecho |

Zoom do Bruno com origem em (540, 1450). O Bruno é transformado em duas camadas: zoom por fora; translação de 170 px + escala 0,74 com origem em (540, 1750) por dentro.

## Cenas que funcionaram (uma por frase)

**Do Zero #1:**
- parede de posts acendendo + contador "+2.000"
- janela "Claude" com o pedido sendo digitado
- barras pintadas uma a uma com varredura âmbar, e as acima da média viram âmbar
- post grande dissecado com lupa (gancho, headline, CTA)
- lâmpada + cards de insight subindo
- "140x" gigante + barra subindo + selo "sem efeito nenhum"
- ranking de ganchos
- janela "Notion" com Ideias/Roteiro/Produção
- fluxo Ideia → Roteiro → Produção na esteira
- logos do Claude Code e do Grok Bot com setas para o "Banco de ideias", trocando para relógio + dias da semana
- tabela de ideias com assuntos
- roteiro sendo digitado
- terminal do Claude Code + player tocando o bruto + timeline com agulha
- separação 3D em "este vídeo"
- prédios genéricos "IA para empresas"
- "do zero" com tijolos
- botão Seguir + passos
- pergunta + assinatura

**Vagas:**
- gráfico subindo atrás da cabeça
- grade de 100 + departamentos
- contador da fonte + parede de vagas lida por uma linha âmbar
- barras + pódio
- descrição de vaga com palavras marcadas + selo
- lupa
- prateleiras de cursos
- "na entrada" × "dentro de casa"
- curso que nunca carrega + relógio
- ciclo testa → erra → estuda → testa de novo
- certificado riscado
- botão Seguir + "+1"
- enquete + comentários
- logo animado

## Armadilhas

- O hook do template **ignora `hook.accent`** e pinta laranja (#ff5200). Faça a headline na camada própria.
- O template precisa de `track.json` e `caption-cues.json` mesmo sem uso. Escreva arquivos neutros.
- No zsh, `"$M:linear"` vira o modificador `:l`. Use `"${M}:linear"`.
- O primeiro quadro de um `recorte_pessoa.py` sai vazio (aquecimento). Não julgue o recorte por ele.
- `montar_pessoa.py` em vídeo longo: o ffmpeg recusa `if()` aninhado demais. O script já limita a 90 chaves.
- Número dito × número da fonte: pergunte ao Bruno. Em 22/11 (vagas) a tela mostrou o da fonte; no Do Zero #1 ele pediu que a tela seguisse a fala.
- Logos de terceiros: use a oficial. Claude e Claude Code estão em `falaibruno/anthropic-logos/` no Drive do Bruno; a do Grok/xAI veio do Wikimedia Commons ("Logo Grok AI (xAI) 2025").
- Nada de criadores analisados (nome, @, post real) nem do trabalho do Bruno em nenhum frame.
