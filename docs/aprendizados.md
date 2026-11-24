# Aprendizados de edição

> **Fonte da verdade:** a página [Edição - regras e aprendizados](https://app.notion.com/p/4207642f4299818ea2a8f1ed6f112279) no Notion (dentro de Produção de Conteúdo) compila as regras, a receita e os aprendizados. Se este arquivo divergir dela, o Notion vale. Ao fim de cada rodada, atualize a página no Notion e depois este arquivo.

Registro das melhorias de cada rodada, para reutilizar nas próximas. O Claude lê este arquivo antes de editar e o atualiza ao final de cada rodada.

## Como registrar

- Uma entrada por rodada, **a mais recente no topo**.
- Escreva o aprendizado como uma regra aplicável ("Fazer X", "Evitar Y"), com o motivo.
- Quando um aprendizado se confirmar em 2 ou mais rodadas, mova-o para **Regras consolidadas** e, se for de estilo, para o [documento de contexto e design](falaibruno-contexto-e-design.md).

## Regras consolidadas

- **Vídeo curto no fundo verde = receita das camadas 3D.** Siga [`docs/receitas/video-camadas-3d.md`](receitas/video-camadas-3d.md): uma animação por frase, elementos atrás dele, separação 3D das camadas em 3 ou 4 momentos e efeitos sonoros a −8 dB. Pedida em 21/11, aprovada em 22/11 nas vagas ("tá perfeito") e de novo no Do Zero #1 ("está perfeito").
- **O Bruno não fica na tela o tempo todo nem flutuando** (Do Zero #1, 22/11). Ele fica a ~74% do tamanho, apoiado na base do quadro, sem degradê no tronco, e sai do quadro em ~40–45% do vídeo para a animação ocupar a tela toda. Zoom nos cortes de 6% e 12%. O que precisa ser lido (timeline, tabela, tela de ferramenta) vai numa cena sem ele, nunca atrás da cabeça.
- **Toda prévia passa pela interface do Edvid**, aberta no começo da rodada, mesmo quando o Bruno fala pelo celular. Ele aprova e marca os ajustes com M lá. Uma cópia da prévia vai para o Drive (`FalaiBruno · Central de Conteúdo/Criativos/<vídeo>/`) para ele ver no celular.
- **Nada fica parado na tela.** Se uma frase dura mais de ~2 s sobre a mesma cena, algo precisa se mexer (barras pintando, pontos correndo, contador). Foi pedido nas marcações de v2 e v3.
- **Thumbnail: estilo aprovado e área segura y 300–1620** (Do Zero #1, 24/11). Fundo #0B0B0B com grade, símbolo branco pequeno, nome da série em cinza espaçado, headline mista em Inter (Light branca + SemiBold âmbar), selo âmbar com o número do vídeo, parede de posts no fundo, logos das ferramentas nas laterais e o Bruno recortado direto sobre o fundo (sem quadro), apoiado na base. Rosto e texto entre y 300 e 1620 do 1080×1920, para servir no Reels e no grid do perfil (recorte 3:4 = y 240–1680, 4:5 = y 285–1635); para isso o Bruno sobe e a camiseta é prolongada até a base (`bruno_thumb_ext.png`). Conferir os três recortes. Quando ele pede para ajustar o tamanho, só reposicionar, sem mudar o visual. Código: `projetos/2026-11-22-do-zero-1/remotion/Thumbnail.tsx`.

## Rodadas

<!-- Modelo de entrada (copie e preencha):

### AAAA-MM-DD · nome do vídeo · formato
- **Projeto**: projetos/AAAA-MM-DD-nome-curto/
- **O que funcionou**:
  - …
- **O que mudar na próxima**:
  - …
- **Preferências novas do Bruno**:
  - …
- **Métricas** (se houver: retenção, views, comentários):
  - …
-->

### 2026-11-24 · Thumbnail do Do Zero #1 · Capa
- **Projeto**: projetos/2026-11-22-do-zero-1/remotion/Thumbnail.tsx · imagem no Drive (pasta do post) como `do-zero-1_thumb_v3.png`.
- **Como foi a rodada**: não havia thumb do Do Zero #1 salva; fiz a v1 no padrão das outras. No grid do perfil o rosto e o texto cortavam. A v2 pôs o Bruno num quadro com borda e foi recusada ("eu queria que você replicasse exatamente a anterior, só ajustando o tamanho"). A v3 é a v1 com o Bruno subido 240 px e a camiseta prolongada até a base.
- **O que não funcionou**: mudar o visual para resolver o corte (v2). Prolongar a camiseta repetindo a última linha do recorte deixa listras de pele: preencher só a área da camiseta com a cor dela e fechar o pescoço com uma gola em U. Buffer não aceita imagem como capa de vídeo pela API (só um frame, no Instagram e no TikTok); a capa é subida pelo Bruno no app.
- **Como fazer**: recorte do Bruno com ffmpeg num quadro do bruto (`crop=1200:1080:300:0,chromakey=0x6CC042:0.10:0.03,despill=type=green`) em `public/bruno_thumb.png`, camiseta prolongada em `public/bruno_thumb_ext.png`, composição `Thumbnail` 1080×1920 no Remotion e `npx remotion still`.

### 2026-11-22 · Você pode ter a sua própria IA · Curto
- **Projeto**: projetos/2026-11-22-sua-propria-ia/
- **O que funcionou**:
  - Receita das camadas 3D com 30 cenas, uma por frase, e o Bruno fora do quadro em 45%. Aprovada de primeira ("ficou ótimo. pode subir para o drive").
  - O chroma key `0x6CC042:0.10:0.03` saiu limpo de primeira nesta gravação, sem halo.
  - Analogias viram cenas fáceis: bolo (fechado = fatia, open weight = bolo inteiro, open source = bolo + receita + ingredientes) e motor × carro (modelo × harness).
  - Logos de Ollama, LM Studio, Codex, Hugging Face e OpenAI pelo pacote `@lobehub/icons-static-svg` (jsdelivr, versão fixa 1.100.0 / 1.73.0), convertidos para PNG branco com `rsvg-convert`. A busca do Wikimedia só trouxe imagens erradas.
- **O que mudar na próxima**:
  - **Recorte em WebM VP9 com alfa, não ProRes 4444.** O `pessoa_v.mov` de 2,7 GB é copiado para cada bundle do Remotion (mais o cache de quadros) e o render parou com o disco cheio. `ffmpeg -i pessoa_v.mov -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 30 -deadline good -cpu-used 4 -row-mt 1 -auto-alt-ref 0 -an pessoa_v.webm` deu 35 MB com a transparência certa (4 min). Apague as pastas `remotion-*` do temporário (`$TMPDIR`) depois de cada render.
  - Para stills de conferência, um script Node com `bundle` uma vez + `renderStill` por quadro (`stills.mjs` na pasta remotion do edit), com `timeoutInMilliseconds` alto e `rmSync` do bundle no fim.
  - A transcrição errou "Epoch AI" ("Epo KI"), "Hugging Face" ("Hug and Face"), "Ollama" ("Olhama"), "cérebro" ("sério") e "com o" ("como o"). "Sol" era mesmo o nome do modelo da OpenAI: perguntar antes de trocar nome que parece erro.
- **Preferências novas do Bruno**:
  - De novo manteve a duração da fala (2:02) em vez de cortar frases.
  - A tela segue a fala (nomes e números como ele disse), sem rodapé de fonte quando ele dispensa, e o fecho só com o que ele falou (sem "Falai, o que você acha?" escrito).
- **Métricas**: (preencher depois de publicar)

### 2026-11-22 · Maior IPO da história · Curto
- **Projeto**: projetos/2026-11-22-maior-ipo/ (código das cenas, edit-data, SFX e thumbnail em `remotion/`)
- **O que funcionou**:
  - Aprovado de primeira, vídeo e thumbnail juntos ("gostei de tudo"). 22 cenas, Bruno fora do quadro em 44%, 4 separações 3D, 58 efeitos.
  - Bordas do corte pelo `speech_regions.py --noise=-44dB`: a −33 dB os finais de palavra baixos ficavam de fora. Cortadas todas as pausas de 0,3 s ou mais.
  - Transcrever o trecho isolado resolveu duas dúvidas: o "Mas mor." era só "Mas mostra" (não havia gaguejo) e o "sistema system" era um "sistema" só.
  - Logos oficiais da Anthropic (asterisco e wordmark, este invertido para branco com `filter: invert(1)`) do Drive `falaibruno/anthropic-logos`.
- **O que mudar na próxima**:
  - Com a legenda em `paddingBottom: 740`, ela fica em y ~1120–1240 mesmo com o Bruno fora do quadro. Nas cenas sem ele, o conteúdo central vai em 700–1100 e 1250–1470 (na v0 o cofre, as caixas e o gráfico ficaram atrás da legenda).
  - Nada abaixo de y 1472 (zona insegura da base): o selo e o crédito subiram.
  - O template precisa de `public/sfx/` (cut-click.mp3 etc.) para as transições, senão o render para no meio. Copiar da rodada anterior junto com `brand/`, `fonts/` e `logos/`.
  - A transcrição traz os espaços como palavras próprias: para juntar "Pen" + "AI" em "OpenAI" na legenda, pular os espaços.
  - Gravação lida com pausas longas (bruto 6:51) deu um corte de 2:00 contra 75 s do roteiro. Avisar na Fase 1 e deixar o Bruno decidir.
  - Sessão aberta pelo celular: o `preview_start` por nome é recusado. Subir o `preview_server.py` no shell (aqui na porta 4822) e abrir pelo endereço.
- **Preferências novas do Bruno**:
  - Nesta rodada: headline em **contorno** (branco com contorno preto, sem destaque), escolhida na aba Estilo. Não virou regra fixa.
  - A tela segue a fala ("+US$ 90 bi"); o que está no card mas não foi gravado não vira texto na tela. O selo "Não é recomendação de investimento" fica.
  - Thumbnail [PROPOSTA] aprovada junto: fundo #0B0B0B com grade, logo do assunto grande atrás do Bruno, Bruno num quadro com expressão, headline mista em Inter.
- **Métricas**: (preencher depois de publicar)

### 2026-11-22 · Do Zero #1 (montei meu canal com IA) · Curto
- **Projeto**: projetos/2026-11-22-do-zero-1/ · aprovado na v4 ("está perfeito"), 72,3 s.
- **Como foi a rodada**: corte (v1 → 5 vazios tirados) → v1 final → v2 (Bruno menor e fora do quadro) → v3 (banco de ideias, rotinas, player) → v4 (vazio do gancho, barras pintando, logos oficiais). Todos os pedidos vieram por marcações na interface do Edvid.
- **O que funcionou**:
  - A receita das camadas 3D se repetiu sem ajuste de geometria: 18 cenas, uma por frase, montadas em cima do `FalaiBruno.tsx` das vagas (trocando só o bloco de cenas). Copiar o projeto Remotion anterior inteiro (com `node_modules`) e trocar o `public/` poupa a instalação.
  - Telas de ferramenta sem gravação de tela: janela estilizada na marca (barra de título, selo com o nome da ferramenta, texto em barras cinzas). Mostra a ferramenta sem expor nada de terceiros.
  - Cenas "meta" funcionam: o terminal do Claude Code rodando os passos da edição, a timeline com as faixas Vídeo/Cenas/Legenda/Som e um player tocando o bruto no fundo verde, e a separação 3D no "vocês estão vendo a versão final da edição".
  - Barras/gráficos que vão sendo pintados enquanto ele fala (varredura âmbar) seguram melhor do que um gráfico parado esperando a palavra-chave.
  - Conferir as pontas transcrevendo o trecho isolado: o "post post que... que" da transcrição era um "Tem post que" limpo no áudio.
- **O que mudar na próxima**:
  - **Abrir a interface do Edvid no início da rodada, sempre**, mesmo quando o Bruno fala pelo projeto/celular, e ligar o vigia de marcações (`watch_edits.py`). Mandar só o arquivo foi erro. Para o celular, copiar a prévia também para o Drive (`FalaiBruno · Central de Conteúdo/Criativos/<vídeo>/`).
  - **Apagar o `preview_edits.json` depois de aplicar**: se ficar, o vigia entrega a mesma marcação de novo.
  - **Cortar já na Fase 1 toda pausa de 0,3 s ou mais dentro da frase** que caia num silêncio do `speech_regions` (o Bruno marcou 6 vazios de 0,3–0,4 s que o `verify_cut` não acusa, porque ele só olha ≥ 0,5 s). Um vazio cortado depois da Fase 2 obriga a refazer recorte, legenda, segmentos, tempos das cenas e SFX.
  - Quando a fala diverge do card (2000 × 278 posts, 140 × 146x), perguntar antes da Fase 2.
  - `montar_pessoa.py` quebrava em vídeo acima de ~45 s (o ffmpeg não aceita `if()` tão aninhado). Corrigido: o passo entre chaves cresce para ficar em até 90 chaves.
  - Loudnorm com alvo −1 dBTP saiu −0,8 depois do AAC. Usar alvo −1,5 dBTP para garantir ≤ −1.
- **Preferências novas do Bruno**:
  - **Não quer estar na tela o tempo todo, nem "flutuando".** Bruno a ~74% do tamanho, apoiado na base do quadro (sem degradê no tronco) e fora do quadro em ~45% do vídeo, com a animação em tela cheia (números, gráficos, fluxos, telas de ferramenta). Ele aparece no gancho, nas frases pessoais (análise "junto comigo", virada, CTA) e nas cenas leves.
  - O que precisa ser lido (timeline, tabela, terminal) vai numa cena sem ele: atrás da cabeça some.
  - **Logos oficiais das ferramentas**, não só o nome: Claude Code (mascote, `falaibruno/anthropic-logos/` no Drive) e Grok (logo da xAI). O nome segue a fala dele: "Grok Bot".
  - Fluxos com setas: fontes → destino (Claude Code e Grok Bot → banco de ideias), depois troca de cena quando ele muda de assunto (rotinas → relógio + dias da semana).
  - Número na tela = número falado, quando ele decidir assim; rodapé genérico "Fonte: base própria com dados públicos do Instagram, nov/2026".
  - **v3 e v4 (marcações na interface):** ilustrar o fluxo de dados de verdade (setas e pontos correndo do Claude Code e do Grok até um "banco de ideias" em forma de cilindro); um player tocando o bruto em cima da timeline quando ele fala da edição; tirar até vazios curtos dentro do gancho (0,4 s entre "2000 posts" e "e mais de 50"); barras sendo pintadas uma a uma em vez de aparecerem prontas.
  - **Logos oficiais das ferramentas** quando ele cita uma: o mascote do Claude Code está no Drive dele (`falaibruno/anthropic-logos/claude-code.png`); a do Grok veio do Wikimedia Commons (xAI, 2025). O nome que ele usa é **"Grok Bot"**, também na legenda e nos textos.
  - Aprovou a v4 com "está perfeito" e pediu para agendar no dia seguinte.
- **Fluxo Notion → edição → Buffer (primeira rodada completa no fluxo novo)**:
  - O card saiu da Ideias para a Producao inteiro e foi lapidado lá. O roteiro de leitura fica na coluna Conteúdo da tabela, em blocos de uma ou duas frases com uma linha vazia entre eles (o Bruno lê um bloco e fala para a câmera). Não criar uma seção separada de "texto para gravar".
  - A fala mudou bastante em relação ao card (números, frases novas, CTA). Depois da Fase 1, atualizar o card, a legenda e o título para bater com a fala antes de agendar.
  - A pasta Drive criada no card antigo não aparecia no Mac nem no conector. A pasta que funciona é a que o Edvid cria em `FalaiBruno · Central de Conteúdo/Criativos/<vídeo>/`; gravar ela na coluna Pasta Drive.
  - Buffer: o vídeo precisa estar no Drive como "qualquer pessoa com o link" (o Bruno muda o compartilhamento; o Claude não consegue). Use `https://drive.google.com/uc?export=download&id=<id>` e deixe o link aberto até depois da publicação. Agendado nos 3 canais (Instagram Reel, TikTok, YouTube Shorts com título próprio, categoria 28) no mesmo horário, dentro da janela 19h–21h.
- **Métricas**: (preencher depois de publicar, 23/11 às 19h)

### 2026-11-22 · Vagas que pedem IA (regravação) · Curto
- **Projeto**: projetos/2026-11-22-vagas-ia-regravacao/
- **O que funcionou**:
  - Comparar os dois recortes no mesmo quadro antes de escolher. Nesta gravação, o chroma key do ffmpeg (`chromakey=0x6CC042:0.10:0.03`, depois `despill=type=green:mix=0.5:expand=0`) ficou mais limpo que o Apple Vision, que deixou halo no cabelo. Na gravação de 21/11 tinha sido o contrário. A escolha depende da luz da gravação, então teste sempre os dois.
  - Esconder o corte do tronco do Bruno com um degradê de transparência na base (`mask-image` de 80,5% a 91% da altura). Assim não fica uma borda reta embaixo.
  - Layout em faixas: ilustração em y 390–690, legenda na emenda (~740) e o topo da cabeça em ~790. Os elementos de trás ficam nas laterais (x < 250 e x > 830). As cenas que mais funcionam atrás dele são as grandes, como o gráfico subindo, a parede de vagas e o relógio.
  - Zoom do Bruno por corte, alternando 1,00, 1,08 e 1,18, com um empurrão de 3% dentro de cada trecho e origem no rosto (540, 1000).
- **O que mudar na próxima**:
  - O hook do template ignora `hook.accent` e pinta laranja (#ff5200). Para a headline mista com a cor da marca, faça a headline na camada própria (`FalaiBruno.tsx`) com a Inter.
  - Com zoom de 18%, a cabeça encosta na legenda. Se incomodar, use 1,12 como zoom maior.
- **Preferências novas do Bruno**:
  - A v2 foi aprovada de primeira ("tá perfeito"): mantenha esse nível de animação (uma cena por frase, elementos atrás e camadas 3D) como padrão.
  - Estilo escolhido no editor: tela dividida, headline mista, legenda karaokê, âmbar #E8A33D, tracking, zoom automático, zoom nos cortes e flash nas transições, sem trilha de IA.
- **Métricas**: (preencher depois de publicar)

### 2026-11-21 · Vagas que pedem IA (RH) · Curto
- **Projeto**: projetos/2026-11-24-vagas-ia-fora-de-ti/
- **O que funcionou**:
  - Buscar a pauta no Notion pelo tema antes de perguntar: voz, formato, pilar, números e fonte estavam todos lá. Não foi preciso perguntar nada ao Bruno.
  - Gravação horizontal com fundo verde: usar o recorte de pessoa do Edvid (`recorte_pessoa.py`, Apple Vision) em vez de chroma key. O chroma key do ffmpeg deixou o rosto e o cabelo transparentes. Depois do recorte, aplicar `despill=type=green:mix=0.5:expand=0`: com `expand` maior, a camiseta cinza fica roxa.
  - Layout 9:16 para webcam horizontal: o Bruno sobre preto #0A0A0A na metade de baixo, com o crop seguindo o rosto (suavizado em ±1,5 s); os cards de dado no terço de cima e a legenda logo acima da cabeça. Assim, nenhum texto passa por cima do rosto.
  - Cards e legendas da marca feitos num componente próprio (`src/cenas/FalaiBruno.tsx`), com a Inter local do design system, porque as legendas e os ganchos do template do Edvid usam Poppins e cores fora da marca.
- **O que mudar na próxima**:
  - Gravar mais longe da câmera, ou já na vertical. A cabeça ocupa quase toda a altura do quadro horizontal, então no 9:16 a boca cai perto da zona de interface do Instagram.
  - Conferir as palavras de começo de frase depois do corte: o `speech_regions` cortou o "Depois", que foi dito baixinho. Transcrever o corte e comparar com o roteiro.
  - A frase de contexto da fonte (Gupy, 1,6 milhão de vagas) ficou de fora da gravação. A fonte entrou só na tela.
- **Preferências novas do Bruno**:
  - **v3 (pedido do Bruno):** animações que ilustram cada frase, elementos atrás dele e as camadas separadas em 3D. Como fazer: exportar o recorte já posicionado no 9:16 como ProRes 4444 com alfa (`pessoa_v.mov`), trocar a base do template por preto e montar as camadas em `src/cenas/FalaiBruno.tsx` com CSS 3D (`perspective` + `translateZ` por camada). Para os elementos atrás aparecerem, o Bruno precisa ficar menor (escala 0,9) e mais baixo, deixando livre a faixa de ~470–820 px acima da cabeça.
  - Depois de aprovar o corte, ele quer que eu faça a edição inteira até o final e entregue a versão final, sem parar para aprovações no meio.
- **Métricas**: (preencher depois de publicar)

