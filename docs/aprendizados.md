# Aprendizados de edição

Registro das melhorias de cada rodada, para reutilizar nas próximas. O Claude lê este arquivo antes de editar e o atualiza ao final de cada rodada.

## Como registrar

- Uma entrada por rodada, **a mais recente no topo**.
- Escreva o aprendizado como uma regra aplicável ("Fazer X", "Evitar Y"), com o motivo.
- Quando um aprendizado se confirmar em 2 ou mais rodadas, mova-o para **Regras consolidadas** e, se for de estilo, para o [documento de contexto e design](falaibruno-contexto-e-design.md).

## Regras consolidadas

_Ainda nenhuma._

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

