---
name: falaibruno-post-em-producao
description: Leva uma ideia da base "Ideias Posts - FalaiBruno" para a "Producao - FalaiBruno" no Notion e cria a pasta do post no Google Drive (Posts › <título> › Gravação Raw, Gravação Final, Thumbnail, Legendas). Use quando o Bruno disser "manda essa ideia para produção", "cria o post em produção", "vamos produzir <ideia>" ou marcar uma ideia como Produzir. Não usar para criar ideias novas (skill de criação do card de ideia), editar vídeo (skill de edição) ou agendar (skill de agendamento).
---

# Criar post em produção (FalaiBruno)

É a 3ª skill do fluxo de conteúdo: **pesquisa de ideias → card da ideia → post em produção → edição → agendamento**.

Entrada: uma ideia da base **Ideias**, dada pelo link, pelo nome ou como "a ideia marcada como Produzir".
Saída: o card na **Producao**, com o mesmo conteúdo e Status Roteiro, e a pasta do post no Drive, com o link no card.

Responda sempre em português (Brasil). Siga o `CLAUDE.md` do repo.

## Endereços fixos

| O quê | Onde |
|---|---|
| Base Ideias (data source) | `collection://4207642f-4299-8054-809b-000b95042210` · página https://app.notion.com/p/4207642f429980c29f89dadee7442285 |
| Base Producao (data source) | `collection://4207642f-4299-80dd-82d7-000b5682fe7d` · página https://app.notion.com/p/4207642f429980f49a8ec41af34e323c |
| Pasta Posts no Drive (conta bruno.mcduarte96@gmail.com) | id `1wi-mpruDeiRGTESKUTJvz1zeSLN-GDb6` · https://drive.google.com/drive/folders/1wi-mpruDeiRGTESKUTJvz1zeSLN-GDb6 |
| Contexto Fixo (série: "Próximo #") | página `4207642f42998054add1f1f7bb030b82` · https://app.notion.com/p/4207642f42998054add1f1f7bb030b82 |
| Subpastas, nesta ordem | `Gravação Raw`, `Gravação Final`, `Thumbnail`, `Legendas` |

Ferramentas: o conector do **Notion** (fetch, query-data-sources/search, create-pages, update-page) e o conector do **Google Drive** (get_file_metadata, search_files, create_file). Os nomes das ferramentas mudam de máquina para máquina (prefixo do conector); procure pela função. Se um dos dois conectores não estiver ligado, pare e diga qual falta. O conector do Drive precisa estar na conta **bruno.mcduarte96@gmail.com**: confira com `get_file_metadata` na pasta Posts antes de criar qualquer coisa.

## Passos

1. **Achar a ideia.** Com link, faça `fetch` nele. Com nome, busque na base Ideias pelo título (`Nome do post`). Sem nada, liste as ideias com Status `Produzir` e, se houver mais de uma, pergunte qual. Confirme que a página pertence à base Ideias (o `parent-data-source` do fetch tem de ser o data source acima).
2. **Ler tudo da ideia e checar a fronteira.**
   - Propriedades: `Nome do post`, `Formato`, `Pilar`, `Série`, `Fonte`.
   - Corpo inteiro, em Notion Markdown: os toggles Briefing, Roteiro do conteúdo, Legenda e hashtags e Roteiro de edição.
   - Se o fetch avisar `truncated` ou blocos desconhecidos, busque as partes que faltam antes de seguir. A cópia tem de sair inteira.
   - Se o card tiver algo do trabalho do Bruno, de clientes ou o nome da empresa (seção 7 do Contexto Fixo), **pare e avise**. Não leve para a produção.
3. **Checar duplicata.** Busque na Producao um card com o mesmo `Nome do post`. Se existir, não crie outro: mostre o link e pergunte se é para usar esse (e seguir só com o que faltar, como a pasta) ou criar um novo.
4. **Criar o card na Producao.** O padrão, como o Bruno pediu, é **copiar**: `create-pages` com `parent: {data_source_id: 4207642f-4299-80dd-82d7-000b5682fe7d}`, e a ideia fica na base Ideias. Se o Bruno pedir para **mover**, use `move-pages` para o data source da Producao. Mover leva o corpo exato e tira a ideia da base Ideias.
   - `content` (na cópia): o corpo da ideia, **sem mudar nada**: mesma ordem, mesmos toggles, tabelas e marcações ([HIPÓTESE], [PROPOSTA], [X]).
   - Propriedades:
     - `Nome do post`, `Formato`, `Pilar`, `Série` e `Fonte`: iguais às da ideia.
     - `Status`: `Roteiro`.
     - `Plataformas`: `["Instagram", "TikTok", "YouTube Shorts"]`.
     - `Nº na série`: se a `Série` não for `Nenhuma`, use o número do título ("Do Zero #3" → 3). Se o título não trouxer número, use o "Próximo #" daquela série no Contexto Fixo.
     - `Data de publicação`: só se o Bruno disser a data.
     - `Deu certo`: desmarcado (`__NO__`).
     - Deixe `Link publicado` vazio.
   - Use `allow_async: false`, porque o próximo passo precisa do link do card.
5. **Criar as pastas no Drive** (`create_file` com `contentMimeType: application/vnd.google-apps.folder`).
   - Pasta do post dentro de Posts (`parentId` da tabela acima), com o título **igual ao `Nome do post`**.
   - Antes, busque (`search_files` com `parentId = '<id de Posts>' and title = '<título>'`). Se a pasta já existir, reaproveite.
   - Dentro dela, as 4 subpastas na ordem da tabela, também sem duplicar.
   - Guarde o link da pasta do post (`https://drive.google.com/drive/folders/<id>`).
6. **Ligar tudo.**
   - `update-page` no card da Producao com `Pasta Drive` = link da pasta do post.
   - No fim do corpo do card da Producao, acrescente a linha `Em produção desde DD/MM/AAAA · Pasta: <link da pasta>`.
   - Na cópia, mude o Status da ideia para `Produzir`, se ainda não estiver, e acrescente no topo do corpo dela a linha `Em produção: <link do card da Producao>`. **Não apague nem arquive a ideia.**
7. **Conferir e relatar.** Faça `fetch` no card novo e confira:
   - os 4 toggles do corpo;
   - as propriedades;
   - a `Pasta Drive`.

   Depois, liste as subpastas da pasta do post. Responda com:
   - o link do card;
   - o link da pasta, com as 4 subpastas;
   - o que foi copiado;
   - qualquer coisa que não deu para copiar.

## Regras

- Nada é publicado, agendado nem compartilhado aqui. Não mude o compartilhamento de nada: as pastas ficam com o padrão do Drive. Não apague nada.
- Não mude o texto do roteiro, da legenda ou do briefing. Se encontrar um erro (número sem fonte, nome trocado), copie igual e avise no relatório.
- Status além de `Roteiro` (Gravado, Editando, Aprovado, Agendado) não são desta skill. O `Aprovado` é sempre o Bruno quem marca.
- Fronteira da marca: nada do trabalho do Bruno, de clientes ou de nomes e @ de terceiros nos títulos de pasta.
- Se o título tiver `/` ou `\`, troque por `-` só no nome da pasta (o Drive aceita, mas confunde caminhos locais). O card mantém o título original.

## Depois desta skill

O Bruno grava e põe o bruto em `Gravação Raw` (ou o arquivo chega em `~/Movies/`). A skill de edição (receita em `docs/receitas/video-camadas-3d.md`) usa o card da Producao como pauta. O final vai para `Gravação Final`, e a legenda `.srt` vai para `Legendas`.
