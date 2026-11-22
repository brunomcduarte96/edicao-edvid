# Edvid: central de edição de vídeo da FalaiBruno

Este repositório é a base do **Edvid**, a central onde o Bruno e o Claude planejam, editam e melhoram os vídeos da **FalaiBruno**. Ele é usado no Mac, no PC Windows e pelo celular. O GitHub é a fonte única da verdade: tudo que importa fica aqui.

## Regras gerais

- **Sempre responda em português (Brasil).**
- Antes de qualquer trabalho de edição, leia nesta ordem:
  1. [`docs/falaibruno-contexto-e-design.md`](docs/falaibruno-contexto-e-design.md): quem é a marca, público, tom, identidade visual e estilo de edição.
  2. [`docs/aprendizados.md`](docs/aprendizados.md): o que já aprendemos em rodadas anteriores. Aplique esses aprendizados por padrão.
- **O Notion é a fonte única** do documento do canal e das pautas (banco "FalaiBruno Pautas", com o roteiro no corpo de cada linha). O arquivo de contexto aqui é a cópia de trabalho para edição: se divergir do Notion, o Notion vale e este arquivo deve ser atualizado.
- Respeite as marcações: **[HIPÓTESE]** é inferência a validar e **[PROPOSTA]** é decisão que o Bruno ainda precisa aprovar. Pode seguir uma [PROPOSTA] na edição, mas diga que seguiu.
- Respeite sempre a **fronteira com o trabalho do Bruno** (seção 12 do documento de contexto): nada do trabalho no vídeo, em nenhum frame.
- Campos marcados com `[A PREENCHER]` ainda não foram definidos. Não invente: pergunte ao Bruno, ou siga a opção mais neutra e diga qual escolheu.
- Se algo neste arquivo ou no documento de contexto conflitar com um pedido explícito do Bruno, o pedido do Bruno vale. Se a mudança for permanente, atualize o documento.

## Fluxo de cada rodada de edição

1. **Briefing**: copie `projetos/_modelo/` para `projetos/AAAA-MM-DD-nome-curto/` e preencha o `briefing.md`, com o link da pauta no Notion.
2. **Edição**: siga o estilo do documento de contexto e os aprendizados acumulados.
3. **Revisão**: registre no `briefing.md` do projeto o que o Bruno pediu para mudar.
4. **Aprendizados**: ao fim da rodada, adicione ao [`docs/aprendizados.md`](docs/aprendizados.md) tudo que deve valer para os próximos vídeos (o que funcionou, o que não funcionou, preferências novas). Se um aprendizado virar regra fixa de estilo, mova-o também para o documento de contexto.
5. **Sincronizar**: faça commit e push para que o outro computador e o celular vejam a mudança.

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
