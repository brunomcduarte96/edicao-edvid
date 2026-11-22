# Edvid: central de edição de vídeo da FalaiBruno

Este repositório é a base do **Edvid**, a central onde o Bruno e o Claude planejam, editam e melhoram os vídeos da **FalaiBruno**. Ele é usado no Mac, no PC Windows e pelo celular. O GitHub é a fonte única da verdade: tudo que importa fica aqui.

## Regras gerais

- **Sempre responda em português (Brasil).**
- Antes de qualquer trabalho de edição, leia nesta ordem:
  1. O **Contexto Fixo** no Notion (link abaixo): marca, público, tom, visual e fronteira. Depois a ficha rápida em [`docs/falaibruno-contexto-e-design.md`](docs/falaibruno-contexto-e-design.md).
  2. A página **Edição - regras e aprendizados** no Notion (https://app.notion.com/p/4207642f4299818ea2a8f1ed6f112279): a versão compilada e **fonte da verdade** das regras de edição, da receita e dos aprendizados. Aplique por padrão. O [`docs/aprendizados.md`](docs/aprendizados.md) é a cópia detalhada no repo; se divergir, o Notion vale.
  3. Para vídeo curto gravado no fundo verde: [`docs/receitas/video-camadas-3d.md`](docs/receitas/video-camadas-3d.md), a receita aprovada (camadas 3D, animações atrás do Bruno). Mostre as prévias sempre na interface do Edvid.
- **O Notion é a fonte única** de tudo que não é edição. Tudo fica na página **Produção de Conteúdo - FalaiBruno** (https://app.notion.com/p/4207642f429980caa594c1ed3f4de785):
  - **Contexto Fixo** (marca, voz, design, estratégia, estrutura do roteiro): https://app.notion.com/p/4207642f42998054add1f1f7bb030b82. Leia antes de editar.
  - **Ideias Posts**: https://app.notion.com/p/4207642f429980c29f89dadee7442285 (Status Nova → Produzir, ou Descartada). Cada card segue o Modelo do card de ideia: Briefing, Roteiro do conteúdo (tabela), Legenda e hashtags, Roteiro de edição. Em Produzir, o card inteiro é movido para a Producao.
  - **Producao**: https://app.notion.com/p/4207642f429980f49a8ec41af34e323c. É a interface com este repo: o card chega da Ideias com briefing, roteiro e roteiro de edição no corpo, e recebe os ajustes aqui. Status Roteiro → Gravado → Editando → Aprovado → Agendado → Publicado. Só o Bruno marca Aprovado, e só o que está Aprovado vai para o Buffer.
  - **Edição - regras e aprendizados** (fonte da verdade da edição): https://app.notion.com/p/4207642f4299818ea2a8f1ed6f112279
  - **Exemplos de Posts**: https://app.notion.com/p/4207642f42998067a39af9a414951ef1 (referências + nossos posts com "Deu certo").
  - O `docs/falaibruno-contexto-e-design.md` daqui guarda só a ficha rápida de edição: se divergir do Contexto Fixo, o Notion vale e este arquivo deve ser atualizado.
- Respeite as marcações: **[HIPÓTESE]** é inferência a validar e **[PROPOSTA]** é decisão que o Bruno ainda precisa aprovar. Pode seguir uma [PROPOSTA] na edição, mas diga que seguiu.
- Respeite sempre a **fronteira com o trabalho do Bruno** (seção 7 do Contexto Fixo): nada do trabalho no vídeo, em nenhum frame.
- Campos marcados com `[A PREENCHER]` ainda não foram definidos. Não invente: pergunte ao Bruno, ou siga a opção mais neutra e diga qual escolheu.
- Se algo neste arquivo ou no documento de contexto conflitar com um pedido explícito do Bruno, o pedido do Bruno vale. Se a mudança for permanente, atualize o documento.

## Fluxo de cada rodada de edição

1. **Briefing**: pegue a linha do post na Producao do Notion, copie `projetos/_modelo/` para `projetos/AAAA-MM-DD-nome-curto/` e preencha o `briefing.md` com o link dessa linha. Mude o Status para Editando.
2. **Edição**: siga o estilo do documento de contexto e os aprendizados acumulados.
3. **Revisão**: registre no `briefing.md` do projeto o que o Bruno pediu para mudar.
4. **Aprendizados**: ao fim da rodada, atualize primeiro a página **Edição - regras e aprendizados** no Notion (regras, cenas, armadilhas, histórico) e depois adicione ao [`docs/aprendizados.md`](docs/aprendizados.md) tudo que deve valer para os próximos vídeos (o que funcionou, o que não funcionou, preferências novas). Se um aprendizado virar regra fixa de estilo, mova-o também para o documento de contexto.
5. **Notion**: atualize a linha na Producao (Pasta Drive, legenda, dados na tela) e deixe para o Bruno marcar Aprovado antes de agendar no Buffer.
6. **Sincronizar**: faça commit e push para que o outro computador e o celular vejam a mudança.

## Sincronização entre Mac, Windows e celular

- Comece sempre com `git pull` e termine com `git add -A && git commit -m "..." && git push`.
- **Não coloque arquivos de vídeo brutos ou exportados no Git** (eles são pesados e estão no `.gitignore`). Guarde-os numa nuvem (Google Drive, iCloud, etc.) e registre o link no `briefing.md` do projeto.
- No Git ficam: textos, roteiros, legendas (`.srt`), briefings, presets, templates leves e documentação.

## Estrutura

```
CLAUDE.md                              ← este arquivo (instruções para o Claude)
README.md                              ← visão geral e como clonar
docs/
  falaibruno-contexto-e-design.md      ← marca, público, tom, visual e estilo de edição
  aprendizados.md                      ← registro de melhorias por rodada
marca/                                 ← design system (PDF) e logos (SVG/PNG)
projetos/
  _modelo/briefing.md                  ← modelo para cada vídeo novo
  AAAA-MM-DD-nome-curto/               ← um diretório por vídeo
```

## Plugin do fluxo de conteúdo

As skills ficam no plugin **Plugin - Produção de Conteúdos - FalaiBruno**, em [`plugins/falaibruno-producao-conteudos/`](plugins/falaibruno-producao-conteudos/README.md). Ele é instalado pelo marketplace deste repo (`.claude-plugin/marketplace.json`), e o `.claude/settings.json` já liga o plugin. O Notion é o elo entre as partes, pelo Status do card.

1. `pesquisa-conteudos`: Referenciais + Contexto Fixo, pesquisa na internet, Instagram, X, YouTube e TikTok (Apify opcional). Chama a 2.
2. `cards-ideias`: cria os cards na Ideias (Status Nova) e para. O Bruno valida.
3. `post-em-producao`: move o card para a Producao e cria a pasta no Drive (Gravação Raw, Gravação Final, Thumbnail, Legendas).
4. `edicao-criativos`: edição no Edvid, final em Gravação Final, thumbnail em Thumbnail, aprendizados na página do Notion.
5. `agendamento-buffer`: agenda no Buffer o post Aprovado (Instagram Reel, TikTok e YouTube Shorts) e marca Agendado.
