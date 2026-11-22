# FalaiBruno

Design system da FalaiBruno: uma base em preto, branco e cinza, com três acentos de função clara (petróleo, âmbar e cobalto), uma única família tipográfica (Inter) e formas retas, com cantos de no máximo 8px. Vale para sites, produtos digitais e materiais da marca.

## Fundamentos de conteúdo

- **Idioma:** português do Brasil. Inglês só para termos consagrados.
- **Voz:** direta, calorosa e concreta. Diga o que acontece, quem faz e quando. Trate o leitor por "você".
- **Títulos:** em caixa de frase, curtos (até oito palavras), uma ideia por título: "Sua mensagem, com clareza."
- **Texto:** frases curtas. Listas de dois a quatro itens funcionam melhor que parágrafos longos.
- **Números:** padrão brasileiro (91,2%, 1,2M). Meia-risca para intervalos (24–48h, Semanas 1–2).
- **Dados desconhecidos:** entre colchetes, `[X]%`, `[Nome do cliente]`. Nunca invente números ou depoimentos.
- **Nunca:** emoji ou ponto de exclamação.

## Cor

A base (preto, branco, cinzas) carrega quase toda a interface. Os acentos aparecem pouco e sempre com função.

| Papel | Token | Claro | Escuro |
|---|---|---|---|
| Fundo | `bg` | `white` #FFFFFF | `black` #0A0A0A |
| Superfície (cards) | `surface` | `gray-4` #F2F2F2 | `gray-6` #1A1A1A |
| Texto principal | `fg` | `black` | `white` |
| Texto secundário | `fg-muted` | `gray-1` #525252 | `gray-7` #A3A3A3 |
| Borda | `border` | `gray-3` #D4D4D4 | `gray-5` #3A3A3A |
| Ação, sucesso | `accent` / `accent-fg` | `teal` #1F6F6B / branco | `teal-light` #4FB3AC / preto |
| Destaque, atenção | `highlight` / `highlight-fg` | `amber` #E8A33D / preto | o mesmo |
| Link, info, foco | `link`, `info` | `cobalt` #2F5BEA | `cobalt-light` #7C9BFF |
| Erro | `danger` | `red` #D92D20 | `red-light` #F97066 |
| Bloco inverso | `inverse` / `inverse-fg` | preto / branco | branco / preto |

Regras:

- **Petróleo** é a cor de ação: o botão de destaque (no máximo um por tela), o progresso concluído, a confirmação. O texto sobre ele é branco (5,9:1).
- **Âmbar** é destaque: selos, marca-texto, rótulos sobre preto (9,2:1). O texto sobre ele é sempre preto. **Âmbar nunca é texto no branco** (2,2:1).
- **Cobalto** é link, informação e o anel de foco. Funciona como texto no branco (5,5:1) e aceita texto branco.
- **Cinza 2** (`gray-2`) não é cor de texto no branco (3,5:1). Para texto secundário use `fg-muted`.
- **Vermelho** é só para erro, sempre acompanhado de palavra. Não é cor de marca.
- **Progressão** (etapas, fases, barras): `gray-3` → `amber` → `cobalt` → `teal` → `black`, sempre com rótulos.
- Nada de branco ou preto puros em grandes áreas: o preto da marca é #0A0A0A.

## Tipografia

**Inter**, e só ela, nos pesos 300, 400, 500, 600 e 700 (arquivos em `fonts/`).

- **Light 300** para títulos de impacto grandes (`display-xl`, 72px).
- **SemiBold 600** para hierarquia: `display` 56, `h1` 40, `h2` 28, `h3` 20.
- **Regular 400** para leitura: `lead` 20 (em `fg-muted`), `body` 16, `small` 14.
- **Eyebrow**: 12px, SemiBold, +0,08em, CAIXA ALTA, para rótulos e tags.
- Ênfase é peso ou cor, nunca um tamanho novo fora da escala.

## Forma e layout

- **Raios pequenos:** `r-0` (faixas, imagens, tabelas), `r-xs` 2px (tags, checkbox), `r-sm` 4px (botões, campos), `r-md` 6px (cards, o padrão), `r-lg` 8px (modais, o máximo). Sem pílulas, sem cantos grandes.
- **Sem sombras** (`shadow-0`). Superfícies se separam por cor (`surface`) ou por borda de 1px (`border`). Borda de 2px só para foco e para campo com erro.
- **Sem** gradientes e sem bordas laterais coloridas em cards.
- **Espaçamento** em base 4: `sp-1` 4 a `sp-9` 96. Cards com `sp-5`–`sp-6` de padding; `sp-7` entre título e conteúdo; `sp-8` entre seções.
- **Grid:** 12 colunas, gutter `sp-5` (24px), margem lateral `sp-9` (96px) no desktop e `sp-5` no celular.
- **Toque:** alvos de no mínimo 44px de altura.

## Componentes

Botão, Tag, Card, Campo, Aviso e Progresso, cada um com prévia e diretrizes. São receitas em HTML e CSS com os tokens: monte-os com as variáveis (`var(--accent)`, `var(--r-sm)`), não com valores soltos.

## Logo

A logo tem duas peças: o **símbolo** (três blocos: petróleo largo em cima, âmbar e cobalto embaixo, cantos `r-md`, nascidos da capa deste sistema) e o **wordmark** `falaibruno`, em minúsculas, desenhado a partir da Inter SemiBold, com o pingo do "i" quadrado em petróleo, a mesma cor do bloco de cima do símbolo: um sinal discreto de IA. Os arquivos estão no grupo de assets **Logos**.

- **Assinatura** (símbolo + wordmark): a versão principal. `assinatura-preto.svg` no claro, `assinatura-branco.svg` no escuro.
- **Wordmark sozinho:** quando o símbolo já aparece por perto ou o espaço é estreito. `falaibruno-preto.svg` / `falaibruno-branco.svg`.
- **Símbolo sozinho:** favicon, avatar, carimbo pequeno. `simbolo-cor.svg`; avatares quadrados prontos em `avatar-preto.svg` e `avatar-branco.svg`.
- **Monocromático:** para uma cor só (impressão, gravação, carimbo, fundos coloridos ou fotos). A assinatura completa tem versão **all black** (`assinatura-mono-preto.svg`) e **all white** (`assinatura-mono-branco.svg`); o wordmark e o símbolo também têm `-mono-preto` e `-mono-branco`. Sobre petróleo, âmbar ou cobalto, use sempre a versão mono.
- O pingo do "i" é sempre `teal` (#1F6F6B), no claro e no escuro, igual ao bloco do símbolo.
- Respiro mínimo em volta: a altura do bloco âmbar. Tamanho mínimo: símbolo 16px, assinatura 80px de largura.
- Use os arquivos como estão: nunca redesenhe, recolora, estique, contorne ou aplique sombra. Em texto corrido, o nome se escreve **FalaiBruno**; o wordmark em minúsculas é só da logo.
- **PNG:** todas as versões também existem em PNG com fundo transparente, no grupo **Logos PNG** (assinatura 2400px de largura, wordmark 2000px, símbolo 1000px de altura, avatar 1024px). Use o SVG sempre que o programa aceitar; o PNG é para quem não aceita vetor, como redes sociais e alguns editores.

## Animação do símbolo

O símbolo guarda as iniciais da marca: o bloco de cima com o bloco de baixo à esquerda forma um **F**; com o bloco de baixo à direita, vira um **B**. A animação conta isso em cerca de 5 segundos, em loop. Os arquivos estão no grupo de assets **Animações**.

- **animacao:** o bloco de cima desce, o de baixo à esquerda sobe e forma o F; uma pausa; o bloco da direita entra pela lateral e fecha o B.
- **animacao-v2:** o bloco da direita entra com metade da altura, encostado em cima, e faz o braço do meio do F; depois cresce até a altura total e forma o B. É a leitura mais clara do F.
- Movimento: entradas com leve quique (ease-out-back), sem rotação, sem cor nova. Ao final, a logo encolhe até o centro e recomeça.
- **Formatos:** GIF e MP4 com fundo branco; WebM com fundo transparente. Versões `-cor` (petróleo, âmbar, cobalto), `-preto` para fundos claros e `-branco` (só transparente) para fundos escuros. 480×480px, 25 quadros por segundo.
- **WhatsApp:** mande o MP4 pela galeria e toque em "GIF" antes de enviar; o arquivo .gif chega parado.
- **Edição de vídeo:** a versão transparente em ProRes 4444 (.mov) fica no pacote de logos, para Premiere, After Effects, Final Cut, DaVinci e CapCut.
- A animação é só do símbolo. Não anime o wordmark, não troque a ordem dos blocos e não use a animação em tamanho menor que 64px.

## Ícones

O sistema não tem um set de ícones. Quando precisar de um, use ícones de traço simples de 1,5px na cor do texto, e prefira palavras e números.

## O que você precisa trazer

O conteúdo. Este sistema entrega os tokens, a fonte Inter e as receitas dos componentes base.
