# Briefing: Agendamento Email (tela dividida)

- **Data**: 2026-11-25
- **Linha na Producao do Notion** (link): [A PREENCHER: card não informado nesta rodada]
- **Voz**: C (mão na massa)
- **Formato**: Curto, formato novo de **tela dividida** (gravação de tela em cima, Bruno embaixo)
- **Série**: nenhuma
- **Pilar**: IA na prática
- **Duração alvo**: 30 a 60 s · corte v1: 36,4 s
- **Gancho**: "Vou te ensinar a usar IA de verdade enquanto eu como yakisoba aqui."
- **Fechamento**: "E fala aí, você acha que isso te ajuda no dia a dia?"
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

- O resumo dos e-mails (tela 80–148 s) mostra remetentes e dados pessoais e comerciais: **borrado** na prévia. A barra do navegador (URLs, favoritos) foi cortada.

## Pedidos de ajuste (revisões)

- v1 →
