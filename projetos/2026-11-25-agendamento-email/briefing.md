# Briefing: Agendamento Email (tela dividida)

- **Data**: 2026-11-25
- **Linha na Producao do Notion** (link): https://app.notion.com/p/4237642f429981d689b1e374c31c7dbd (criado na edição, Status Editando)
- **Voz**: C (mão na massa)
- **Formato**: Curto, formato novo de **tela dividida** (gravação de tela em cima, Bruno embaixo)
- **Série**: nenhuma
- **Pilar**: IA na prática
- **Duração alvo**: 30 a 60 s · corte v1: 36,4 s · Fase 2 v2: 38,8 s (com o cta.mov)
- **Gancho**: "Vou te ensinar a usar IA de verdade enquanto eu como yakisoba aqui."
- **Fechamento**: "E fala aí, você acha que isso te ajuda no dia a dia?" + CTA "E já me segue pra não perder nenhuma outra dica." (cta.mov, subido depois)
- **Comenta PALAVRA?** não
- **Brutos** (link da nuvem): pasta "Agendamento Email" em FalaiBruno · Central de Conteúdo/Posts · local: `videos/brutos/agendamento email 25112026/`
- **Exportado** (link da nuvem):

## Peças e sincronia

- intro.mov (5,8 s, 1080x960): gancho em tela cheia.
- rosto.mov (4:07, 1080x960, fundo verde) e tela.mp4 (3:57, 1080x960, 60 fps, **sem áudio**). Gravados juntos: a narração bate com a tela com deslocamento ~0.
- A fala é curta (≈40 s) e as ações na tela duram ~4 min: a tela entra **acelerada por passo** (2x a 5x) sob a fala de cada passo (`split_preview.py`).

## Geometria proposta [PROPOSTA]

- Tela: y 224–944 (janela 1080x720 da gravação, sem a barra do navegador).
- Linha âmbar de 3 px em y 942.
- Rosto: chroma key sobre #0B0B0B com grade, 1:1 em y 960–1920; cabeça em ~1080, rosto em ~1390.
- Legenda karaokê na faixa y 950–1070 (entre a linha e a cabeça).
- Intro e fecho em tela cheia (receita 3D).

## Roteiro do corte v1

1. Vou te ensinar a usar IA de verdade enquanto eu como yakisoba aqui.
2. Primeiro passo, crie sua conta. Crie um projeto.
3. Segundo passo, conecte o seu e-mail. Usa o MCP, são os plugins.
4. Terceiro, volta no seu projeto e pede para ele resumir todos os seus e-mails do dia.
5. Quarto, coloque em contexto todos os arquivos relevantes do seu trabalho. Cores de design, rotinas, produtos, informações.
6. Assim, o Claude vai ter todo o contexto do seu trabalho para poder te ajudar no dia a dia.
7. Por último, agenda uma nova tarefa recorrente. Seleciona onde você quer guardar. (frase movida para antes do "Pronto")
8. Pronto, você já não vai mais esquecer nenhuma tarefa que você tem que fazer.
9. E fala aí, você acha que isso te ajuda no dia a dia?

## Dados sensíveis na tela

- O resumo dos e-mails (tela 80–148 s) mostra remetentes e dados pessoais e comerciais. v1/v2: borrado. **v3: não aparece nem borrado** (o Bruno aprovou "na dúvida, não posta"): a área vira fundo liso e o Remotion desenha um resumo genérico com remetentes fictícios (Banco, Equipe, Curso).
- v3: borrados o nome do projeto ("trabalho", no diálogo, no cabeçalho e na saudação) e a linha "2 tarefas ocultas ... Slack" em Tarefas agendadas. A barra do navegador (URLs, favoritos) segue cortada.

## Fase 2

- Estilo escolhido na interface: tela dividida, headline Contorno, legenda karaokê, tracking, zoom automático, zoom nos cortes, flash, sem trilha.
- Gancho em tela cheia com headline "Usar IA de verdade / em 5 passos" e separação 3D; tela dividida com rótulo "Passo N" e progresso de 5 pontos; zoom da tela em cada passo; chip "MCP: o conector que liga o Claude aos seus apps" (termo traduzido); passo 4 vira animação (painel Contexto recebendo Cores de design, Rotinas, Produtos, Informações; depois o Claude absorvendo o contexto e os dias da semana); pedido do agendamento em tela cheia com o texto legível digitando + "Todo dia, 18h"; fecho com a pergunta; CTA com botão Seguir → Seguindo e assinatura.
- Separação 3D em 3 momentos (gancho, entrada da tela dividida, CTA). 59 SFX a -8 dB. -14,1 LUFS, -1,4 dBTP.
- Thumbnail [PROPOSTA] `thumbnail_v2.png`: "O Claude resume / seus e-mails / todo dia às 18h", Bruno com o yakisoba recortado direto sobre o fundo (sem quadro), logos Claude e Gmail, selo "5 passos". Tudo entre y 300 e 1620; conferida em 9:16, 3:4 e 4:5.
- Arquivos: `remotion/Agenda.tsx` (cenas), `remotion/Thumbnail.tsx`, `remotion/sfx-cues.json`, `montar_tela.py` (trilha da tela + recorte), `finalizar.sh`.

## Pedidos de ajuste (revisões)

- Fase 1: aprovado como proposto ("pode seguir aí com tudo que você falou"): ordem "Seleciona..." antes do "Pronto", duração curta, resumo borrado, fecho como falado.
- v2: entrou o cta.mov que apareceu na pasta depois da aprovação, no fim.
- v3 (pedidos do Bruno no thread): CTA (cta.mov) ANTES do "E fala aí...", a pergunta fecha o vídeo e a assinatura entra no fim; resumo real trocado por resumo genérico; borrões acima; thumbnail v2 sem quadro (regra: Bruno recortado direto sobre o fundo), logo oficial do Gmail (SVG do Wikimedia Commons, "Gmail icon (2020)").
- v3 →
