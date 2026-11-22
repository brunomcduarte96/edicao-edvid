# Plugin - Produção de Conteúdos - FalaiBruno

Um plugin com as 5 skills do fluxo de conteúdo da FalaiBruno. Cada parte faz uma coisa e entrega para a próxima, e o **Notion é o elo**: o Status do card diz em que parte o post está.

| # | Skill | O que faz | Começa com | Termina com |
| --- | --- | --- | --- | --- |
| 1 | `pesquisa-conteudos` | Lê os Referenciais e o Contexto Fixo e pesquisa na internet, no Instagram, no X, no YouTube e no TikTok (Apify opcional) | pedido do Bruno | lista de ideias → chama a 2 |
| 2 | `cards-ideias` | Cria os cards na base Ideias, com o modelo, o Contexto Fixo e os exemplos que deram certo | lista de ideias | cards com Status **Nova**. Para aqui |
| 3 | `post-em-producao` | Move o card para a Producao e cria a pasta no Drive (Gravação Raw, Gravação Final, Thumbnail, Legendas) | ideia que o Bruno escolheu (**Produzir**) | card com Status **Roteiro** |
| 4 | `edicao-criativos` | Edita no Edvid com a página Edição - regras e aprendizados, salva o final e cria a thumbnail | **Gravado** → **Editando** | final + thumbnail aprovados (**Aprovado**) |
| 5 | `agendamento-buffer` | Agenda no Buffer: Instagram Reel, TikTok e YouTube Shorts no mesmo horário | **Aprovado** | **Agendado** |

Status na Ideias: Nova → Produzir (ou Descartada). Status na Producao: Roteiro → Gravado → Editando → Aprovado → Agendado → Publicado. Só o Bruno marca Produzir e Aprovado.

## Instalar no Claude Code

Num terminal com Claude Code (Mac ou Windows):

```
/plugin marketplace add brunomcduarte96/edicao-edvid
/plugin install falaibruno-producao-conteudos@falaibruno
```

Dentro do repo `edicao-edvid`, o `.claude/settings.json` já sugere esse marketplace e liga o plugin. O Claude Code pergunta uma vez se você confia nele. O marketplace lê o branch principal do GitHub, então o plugin aparece depois que o PR for mergeado.

As skills aparecem como `falaibruno-producao-conteudos:<skill>`. Basta pedir em palavras ("pesquisa ideias da semana", "manda essa ideia para produção", "agenda esse post").

## O que cada skill precisa

- **Conectores:**
  - Notion, em todas;
  - Google Drive na conta pessoal, nas skills 3, 4 e 5;
  - Buffer, na 5;
  - Apify, opcional na 1.
- **Edição (4):** o repo `edicao-edvid` clonado e a skill **edvid** instalada no computador. A página "Fluxo de criação de conteúdo" no Notion tem o passo a passo.
