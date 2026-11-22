# Aprendizados de edição

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

### 2026-11-22 · Do Zero #1 (montei meu canal com IA) · Curto
- **Projeto**: projetos/2026-11-22-do-zero-1/
- **O que funcionou**:
  - A receita das camadas 3D se repetiu sem ajuste de geometria: 18 cenas, uma por frase, montadas em cima do `FalaiBruno.tsx` das vagas (trocando só o bloco de cenas). Copiar o projeto Remotion anterior inteiro (com `node_modules`) e trocar o `public/` poupa a instalação.
  - Telas de ferramenta sem gravação de tela: janela estilizada na marca com o nome da ferramenta num selo (Claude, Notion, Claude Code) e texto em barras cinzas. Mostra a ferramenta sem expor nada de terceiros.
  - Uma 4ª separação 3D no momento meta ("vocês estão vendo a versão final da edição") casa com a fala.
  - Conferir as pontas transcrevendo o trecho isolado: o "post post que... que" da transcrição era um "Tem post que" limpo no áudio.
- **O que mudar na próxima**:
  - **Sempre abrir a interface do Edvid (preview) no início da rodada, mesmo quando o Bruno fala pelo projeto/celular.** Ele aprova e marca ajustes por lá (aqui marcou 5 vazios com M). Mandar só o arquivo foi erro. Para o celular, copiar a prévia também para o Drive (`FalaiBruno · Central de Conteúdo/Criativos/`).
  - O Bruno marcou como vazio pausas de ~0,4 s dentro da frase que o `verify_cut` não acusa (ele só olha ≥ 0,5 s). Cortar já na Fase 1 as pausas internas de 0,35 s ou mais que caem num silêncio do `speech_regions`.
  - `montar_pessoa.py` quebrava em vídeo acima de ~45 s (o ffmpeg não aceita `if()` tão aninhado). Corrigido: o passo entre chaves cresce para ficar em até 90 chaves.
  - Quando a fala diverge do card (2000 × 278 posts, 140 × 146x), perguntar antes da Fase 2. Aqui o Bruno decidiu que a tela segue a fala, e o rodapé de fonte não cita o número do card.
- **Preferências novas do Bruno**:
  - **Ele não quer estar na tela o tempo todo, nem flutuando.** Na v2: Bruno a ~74% do tamanho, apoiado na base do quadro (sem degradê no tronco) e fora do quadro em ~45% do vídeo, com a animação em tela cheia (números, gráficos, fluxos, telas de ferramenta). Isso muda a receita das camadas 3D: `semPessoa` e `pessoaEscala` no bloco `falai` do edit-data, e cada cena que sai sem ele precisa ter conteúdo no centro.
  - Não pôr nada importante atrás dele que precise ser lido (a timeline da edição sumiu atrás da cabeça). O que precisa ser lido vai em cena sem o Bruno.
  - Prévias sempre pela interface do Edvid.
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

