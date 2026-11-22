---
name: pesquisa-conteudos
description: Pesquisa assuntos para posts da FalaiBruno (internet, Instagram, X, YouTube e TikTok, com Apify se precisar), a partir dos perfis Referenciais e do Contexto Fixo, e passa as ideias para a skill cards-ideias. Use quando o Bruno pedir "pesquisa ideias", "o que dá pra postar", "procura assuntos" ou "busca pauta da semana".
---

# 1. Pesquisa de conteúdos (FalaiBruno)

Primeira parte do fluxo: **pesquisa → cards de ideias → post em produção → edição e criativos → agendamento**. O Notion é o elo: esta skill não grava nada fora do Notion, e quem cria os cards é a skill `cards-ideias`.

Responda sempre em português (Brasil).

## Endereços fixos

| O quê | Onde |
| --- | --- |
| Referenciais (página) | https://app.notion.com/p/3fe7642f4299817a9608f39a72192e85 |
| Perfis (data source dos referenciais) | `collection://41a7642f-4299-81b8-898d-000ba5dce1c0` |
| Content Sources (sites, newsletters, feeds) | https://app.notion.com/p/06ae2d2e11f44c5292c65668a6e4659c |
| Contexto Fixo | https://app.notion.com/p/4207642f42998054add1f1f7bb030b82 |
| Ideias Posts (para checar duplicata) | `collection://4207642f-4299-8054-809b-000b95042210` |
| Producao (para checar duplicata) | `collection://4207642f-4299-80dd-82d7-000b5682fe7d` |

Precisa do conector do **Notion** e de busca na web. O **Apify** é opcional (no Mac ele aparece como conector Apify). Se o Apify não estiver ligado, siga só com a busca na web e diga isso no relatório.

## Passos

1. **Ler os perfis Referenciais.** Consulte o data source Perfis. Para cada perfil, use estes campos:
   - `Nome`, `Plataforma`, `Link` e `Tema`
   - `Tipo` (Inspiração, Concorrente ou Referência)
   - `Por que acompanhar` e `Notas`
   - `Mediana de views`

   Dê prioridade aos perfis com `Tema` nos pilares da marca. Abra também o Content Sources, que traz sites e newsletters.
2. **Ler o Contexto Fixo inteiro.** Leia público, pilares, séries (com o "Próximo #"), tom, estrutura do roteiro e a **fronteira (seção 7)**. Tudo que você trouxer tem de caber num pilar.
3. **Recorte da pesquisa.** Se o Bruno não disser o período, use os últimos 7 dias, e diga que escolheu esse período. Se ele não disser quantas ideias quer, traga entre 5 e 10 candidatas boas.
4. **Pesquisar, nesta ordem.**
   1. **Internet:**
      - notícias de IA, tecnologia, carreira e negócios, primeiro em português e depois em inglês;
      - as fontes do Content Sources;
      - anúncios oficiais (blogs da OpenAI, Anthropic, Google, xAI, Meta).
   2. **Instagram, X, YouTube e TikTok:** veja o que os perfis Referenciais postaram no período e o que mais performou contra a mediana do próprio perfil. Se a busca na web não chegar no post, use o Apify:
      - `search-actors` para achar o actor da rede (por exemplo os de Instagram, TikTok, YouTube e X/Twitter);
      - `fetch-actor-details` para ver a entrada que ele pede;
      - `call-actor` com poucos itens por perfil (até 20) e só no período;
      - `get-dataset-items` para ler o que voltou.

      Não invente o nome de um actor. Se uma rodada for ficar grande, avise o custo antes.
   3. Para cada post forte, anote:
      - o assunto;
      - o formato (curto ou carrossel);
      - o gancho;
      - o índice de desempenho (views ÷ mediana do perfil);
      - o link.
5. **Filtrar.** Corte o que:
   - não cabe em nenhum pilar;
   - fere a fronteira (trabalho do Bruno, empregador, clientes);
   - não tem fonte verificável;
   - já existe na **Ideias** ou na **Producao**. Busque pelo título e pelo assunto nas duas bases antes de seguir.
6. **Montar a lista de candidatas.** Para cada uma, anote:
   - o assunto em uma linha;
   - o pilar e a série, se couber (Hype ou Negócio?, Do Zero, ou Nenhuma);
   - o formato;
   - o ângulo da FalaiBruno, isto é, a leitura do Bruno ou o "o que isso muda pra você";
   - a fonte com link e data;
   - a referência que inspirou, se houver: só o link, para uso interno;
   - o porquê de achar que funciona, com o índice ou o sinal que você viu.
7. **Chamar a skill `cards-ideias`** com a lista. Ela cria os cards e para ali.

## Regras

- **Nada de copiar:** a referência inspira o formato e o assunto. Nome, @ e post de outro criador nunca vão para o roteiro nem para a tela.
- Todo número precisa de fonte com data. Se não achar a fonte, o número sai.
- Não publique, não comente e não siga ninguém. A pesquisa só lê.
- Não crie card aqui. Quem cria é a `cards-ideias`.
