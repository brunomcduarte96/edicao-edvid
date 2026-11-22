# Briefing: Do Zero #1: estudei os posts de criadores com IA e montei meu canal

- **Data**: 2026-11-22
- **Linha na Producao do Notion**: https://app.notion.com/p/4207642f42998163b96bdc37562606b2
- **Voz**: C (mão na massa)
- **Formato**: Curto, gravado no fundo verde (receita das camadas 3D)
- **Série**: Do Zero #1
- **Pilar**: IA na prática
- **Duração alvo**: ~55 s no roteiro; o final ficou com 72,8 s (aprovado assim pelo Bruno, sem cortar as rotinas)
- **Objetivo do vídeo**: mostrar o fluxo de IA de ponta a ponta (pesquisa → estrutura no Notion → roteiro → edição) e fazer a pessoa seguir a série
- **Mensagem principal em uma frase**: montei meu canal do zero com IA, da análise à edição
- **Gancho**: "Antes de gravar o meu primeiro vídeo, eu estudei mais de 2000 posts e mais de 50 criadores."
- **Fechamento**: "E fala aí, o que trava a sua produção hoje?"
- **Comenta PALAVRA?** não
- **Brutos** (local no Mac): `videos/brutos/do zero 1 22112026/` (5 arquivos de `~/Movies/`, 22/11 13:28–13:37, 1920×1080, 60 fps, Rec.709). Usada a última tomada completa, `2026-11-22 13-37-25.mov`. Pasta Drive da pauta: https://drive.google.com/drive/folders/1l2vs7qb7C9dxRwJysuf-Jl_06MwbrMjo (não está sincronizada neste Mac nem visível pelo conector do Drive)
- **Exportado** (local no Mac): `videos/brutos/do zero 1 22112026/do zero 1 22112026_final.mp4` (1080×1920, 30 fps, 72,3 s, −14 LUFS) e a prévia 720p ao lado. Cópia no Drive pessoal: `FalaiBruno · Central de Conteúdo/Criativos/Do Zero 1/`.

## Roteiro

Fala da gravação (diferente do roteiro do Notion em alguns pontos):

1. Gancho: "mais de 2000 posts e mais de 50 criadores" (o card diz 278 posts de 11 criadores). "Quem fez a análise foi a IA, junto comigo."
2. Contexto: puxei os posts acima da média do perfil, analisei gancho, headline e CTA, tirei vários insights.
3. "Tem post que fez mais de 140 vezes a média daquele perfil, sem efeito nenhum" (fonte: 146,78x). Número grande na primeira frase.
4. Estrutura no Notion: a ideia entra, vira roteiro, vai pra produção. Ideias vêm de rotinas diárias no Claude Code e no Grok que preenchem uma tabela; o Claude gera o roteiro; o Claude Code edita o vídeo de ponta a ponta ("vocês estão vendo a versão final da edição").
5. Virada: "Eu trabalho construindo IA para empresas. Agora eu tô usando IA pra construir o meu canal do zero." O número de seguidores **não** foi falado.
6. CTA: "Me segue pra acompanhar essa construção e descobrir como você pode montar isso pra você também." + "E fala aí, o que trava a sua produção hoje?"

## Fase 1 (corte)

- Revisão: Claude, Claude Code, Grok, IA corrigidos; cortados "A ideia é simples" (repetição), a primeira tentativa do CTA e o "fala aí, o que tá" abandonado; duas pausas longas dentro da frase das rotinas.
- Sem grade (Rec.709). J-cut padrão. −14 LUFS.

## Fase 2

- Receita das camadas 3D (`docs/receitas/video-camadas-3d.md`), com o estilo das vagas: headline mista ("Montei meu canal" / "inteiro com IA") até 3,2 s, karaokê, zoom 1/1,08/1/1,18 nos cortes, flash em 5 trocas, 56 SFX a −8 dB, sem trilha, −14 LUFS.
- Recorte: chroma key da receita (`0x6CC042:0.10:0.03`), testado no mesmo quadro contra tolerância 0,16 (que comeu o rosto). O verde desta gravação varia de 5A9E3D a 94F181 entre os cantos e mesmo assim 0,10 ficou limpo.
- 18 cenas, uma por frase: parede de posts + contador 2.000/50 · janela "Claude" com o pedido · barras acima da média do perfil · post dissecado (gancho, headline, CTA) · lâmpada + insights · 140x gigante + selo "sem efeito nenhum" · ranking de ganchos · janela "Notion" com Ideias/Roteiro/Produção · fluxo Ideia → Roteiro → Produção · Claude Code e Grok + rotinas diárias (relógio) · tabela de ideias com assuntos · roteiro sendo escrito · terminal "Claude Code" + timeline · "Este vídeo" (separação 3D das camadas) · IA para empresas (genérico) · "do zero" com tijolos · botão Seguir + passos · pergunta + assinatura.
- 4 separações 3D: abertura, regancho do 140x, "vocês estão vendo a versão final da edição" (meta) e fim.
- Telas das ferramentas: não havia gravação de tela no Drive, então são janelas estilizadas na marca com o nome da ferramenta num selo. Nenhum nome, @ ou post real dos criadores; nada do trabalho.
- Números na tela batem com a fala (pedido do Bruno): "+2.000 posts", "+50 criadores", "140x". Rodapé: "Fonte: base própria com dados públicos do Instagram, nov/2026". Seguidores: sem número.

## Pedidos de ajuste (revisões)

- v1 (corte) → tirar 5 vazios marcados na interface do Edvid (0:08, 0:23, 0:25, 0:54, 0:56). Feito; corte aprovado.
- v1 (final) → 3 marcações na interface: "minha cara voando no meio da tela; diminuir e pôr na parte inferior", "pareço um fantasminha flutuando; não preciso estar na tela 100% do tempo, nem perto disso", "a timeline de edição não deu pra ver porque estou na frente".
- v2 → Bruno em 74% do tamanho, apoiado na base do quadro, sem o degradê (era o que fazia flutuar); zoom nos cortes reduzido para 1 / 1,06 / 1 / 1,12; legenda logo acima da cabeça (`paddingBottom` 740). Fora do quadro em 5 janelas (~45% do vídeo), com a animação em tela cheia: 3,3–6,6 s (2.000 posts), 9,2–18,8 s (média e detalhes), 21,7–27,1 s (140x), 36,4–44,8 s (fluxo e ferramentas), 51,8–57,2 s (Claude Code e a timeline). Ganharam versão de tela cheia: post grande com lupa, etapas grandes na esteira, relógio desde o início.
- v2 → 3 marcações: (1) 0:40–0:43 "seta do Grok e do Claude indo para uma database, depois muda para uma imagem das rotinas"; (2) 0:51,9–0:53,0 sem texto (perguntei); (3) 0:54–0:57 "animação de um player em cima da timeline".
- v3 → banco de ideias (cilindro) com setas e pontos correndo a partir do Claude Code e do Grok, trocando em "rotinas" para relógio + dias da semana às 7h; player tocando o bruto no fundo verde em cima da timeline, com a barra de progresso andando junto com a agulha.
- v3 → 3 marcações: (1) 0:03,8 tirar o vazio sem som; (2) 0:09–0:12 ir pintando as barras para não ficar parado; (3) 0:39–0:43 banco de ideias mais para baixo, logos oficiais do Claude Code e do Grok, e o nome "Grok Bot".
- v4 → corte refeito (vazio entre "2000 posts" e "e mais de 50"; −0,43 s, todo o resto reajustado: cenas, legenda, SFX, recorte); barras pintadas uma a uma com varredura âmbar até o "acima da média"; logo do Claude Code (mascote, `anthropic-logos/claude-code.png` do Drive do Bruno) e da xAI/Grok (Wikimedia Commons, "Logo Grok AI (xAI) 2025"), nome "Grok Bot" no card e na legenda; banco de ideias na parte de baixo. Duração 72,3 s, −14 LUFS, pico −1,3 dBTP.

## Aprovação e agendamento

- v4 aprovada pelo Bruno em 22/11/2026 ("está perfeito"). Card na Producao marcado como Aprovado e depois Agendado.
- Agendado no Buffer em 22/11 para **23/11/2026 às 19h** (Brasília) no Instagram (Reel), TikTok e YouTube Shorts ("Montei meu canal inteiro com IA | Do Zero #1"). Vídeo: `https://drive.google.com/uc?export=download&id=1hB01e4OraxGUcu8D5WG0M9dg2wDYkbpn` (link aberto até publicar).
- Legenda final: igual à do card (2.000 posts, 50 criadores, 140x, "O que trava a sua produção hoje? Falai, o que você acha?").

## Aprendizados desta rodada

Ver a entrada de 22/11 (Do Zero #1) em `docs/aprendizados.md`.
