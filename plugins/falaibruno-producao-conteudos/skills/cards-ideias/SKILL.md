---
name: cards-ideias
description: Cria os cards de ideia na base "Ideias Posts - FalaiBruno" do Notion (Briefing, Roteiro do conteúdo em tabela, Legenda e hashtags, Roteiro de edição), seguindo o Contexto Fixo e os exemplos que deram certo. Use depois da pesquisa-conteudos ou quando o Bruno pedir "cria o card dessa ideia" ou "monta essas ideias no Notion". Para depois de criar: quem decide o que vai para produção é o Bruno.
---

# 2. Geração dos cards de ideias (FalaiBruno)

Segunda parte do fluxo: **pesquisa → cards de ideias → post em produção → edição e criativos → agendamento**.

- **Entrada:** a lista de ideias que veio da `pesquisa-conteudos`, ou uma ideia dita pelo Bruno.
- **Saída:** um card por ideia na base **Ideias**, com Status **Nova**.
- **Fim:** a skill **para aqui**. O próximo passo é o Bruno validar a ideia e marcar **Produzir**, ou mandar para produção, o que aciona a skill `post-em-producao`.

Responda sempre em português (Brasil).

## Endereços fixos

| O quê | Onde |
| --- | --- |
| Ideias Posts (data source) | `collection://4207642f-4299-8054-809b-000b95042210` · https://app.notion.com/p/4207642f429980c29f89dadee7442285 |
| Modelo do card de ideia ("Ideias de Post") | template `4207642f4299801c88dee4b64ddcc17f` |
| Contexto Fixo | https://app.notion.com/p/4207642f42998054add1f1f7bb030b82 |
| Exemplos de Posts | https://app.notion.com/p/4207642f42998067a39af9a414951ef1 (arquivo anexo `camada3_exemplos.md`) |
| Producao (posts com "Deu certo") | `collection://4207642f-4299-80dd-82d7-000b5682fe7d` |

## Passos

1. **Ler o Contexto Fixo inteiro:** público, pilares, séries com o "Próximo #", tom de voz, estrutura do roteiro, visual e fronteira (seção 7).
2. **Ler os exemplos que deram certo:**
   - o anexo da página Exemplos de Posts. Baixe com `get-file-download-urls` se precisar;
   - os cards da Producao com `Deu certo` marcado. Veja gancho, ritmo, CTA e o que performou.

   Use esses exemplos como régua de gancho e de estrutura.
3. **Checar duplicata.** Para cada ideia, busque na Ideias e na Producao pelo título e pelo assunto. Se já existir, não crie de novo: cite o card que já existe no relatório.
4. **Criar o card.** Use `create-pages` no data source da Ideias com o template acima, para o corpo nascer com os 4 toggles. Depois, preencha cada toggle com `update-page` (`update_content`), sem mudar a estrutura.

   Propriedades:
   - `Nome do post`: o título. Na série, use "Hype ou Negócio? #N: ..." ou "Do Zero #N: ..." com o "Próximo #" do Contexto Fixo.
   - `Status`: `Nova`.
   - `Pilar`, `Série` (ou `Nenhuma`) e `Formato` (`Curto` ou `Carrossel`).
   - `Fonte`: link da fonte principal.
5. **Preencher o corpo.**
   - **Briefing:**
     - tema, pilar, série e formato;
     - fonte com data;
     - "Por que importa", isto é, o que muda para quem assiste.
   - **Roteiro do conteúdo:**
     - headline na tela (até 8 palavras), visual do gancho e um CTA só;
     - a tabela (Gancho, Contexto, Desenvolvimento, Virada ou opinião, Fechamento) com a coluna **Conteúdo** escrita como fala pronta para ler na gravação: uma ou duas frases por bloco, com uma linha vazia entre os blocos (`<br /><br />` na célula);
     - pausas e ênfases entre parênteses;
     - feche com "Falai, o que você acha?" ou com a pergunta do vídeo + Falai;
     - no carrossel, cada linha é um card e a coluna Tempo fica vazia.
   - **Legenda e hashtags:**
     - a legenda no tom da marca, com o número e a fonte;
     - de 4 a 6 hashtags, sempre com #falaibruno.
   - **Roteiro de edição:**
     - as cenas de cada trecho, uma animação por frase, seguindo a página **Edição - regras e aprendizados** (https://app.notion.com/p/4207642f4299818ea2a8f1ed6f112279);
     - os textos na tela e os destaques;
     - som e efeitos (sem trilha).
6. **Conferir e relatar.** Faça `fetch` em cada card. Responda com uma lista curta, um item por card: título com link, pilar e série, e o gancho em uma frase. Diga quais ideias ficaram de fora e por quê (duplicata, sem fonte, fronteira).

## Regras

- **Pare depois de criar os cards.** Não mude para `Produzir`, não mova para a Producao e não crie pasta no Drive. Isso é decisão do Bruno e trabalho da `post-em-producao`.
- Fronteira: nada do trabalho do Bruno, do empregador ou de clientes. Nome, @ e post de criador de referência não vão para o roteiro.
- Todo número tem fonte com data. Se for inferência, marque **[HIPÓTESE]**.
- Sem emoji e sem exclamação no roteiro e na legenda, seguindo o tom do Contexto Fixo.
