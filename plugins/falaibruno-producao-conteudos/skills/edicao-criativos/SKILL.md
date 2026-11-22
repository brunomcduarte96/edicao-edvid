---
name: edicao-criativos
description: Edita o vídeo de um post da Producao da FalaiBruno com o Edvid (receita das camadas 3D), aplica os ajustes do Bruno, salva o final em Gravação Final, cria a thumbnail na pasta Thumbnail e registra os aprendizados. Use quando o Bruno disser "gravei", "vamos editar", "edita o vídeo do <post>" ou mandar o bruto.
---

# 4. Edição dos vídeos e criativos (FalaiBruno)

Quarta parte do fluxo: **pesquisa → cards de ideias → post em produção → edição e criativos → agendamento**.

- **Entrada:** um card da **Producao** com Status `Roteiro` ou `Gravado`, mais o bruto.
- **Saída:** o vídeo final na subpasta `Gravação Final` e a thumbnail na subpasta `Thumbnail` da pasta do post. O card fica pronto para o Bruno marcar `Aprovado`.

Responda sempre em português (Brasil). A edição roda no computador do Bruno (Mac ou Windows), com o repo `edicao-edvid` e a skill **edvid** instalada. Na nuvem, sem o Edvid, faça só os passos 1, 2 e 8 e diga que o resto precisa do computador.

## Endereços fixos

| O quê | Onde |
| --- | --- |
| **Edição - regras e aprendizados** (fonte da verdade) | https://app.notion.com/p/4207642f4299818ea2a8f1ed6f112279 |
| Contexto Fixo | https://app.notion.com/p/4207642f42998054add1f1f7bb030b82 |
| Producao (data source) | `collection://4207642f-4299-80dd-82d7-000b5682fe7d` |
| Receita técnica (comandos, geometria, código) | repo `docs/receitas/video-camadas-3d.md` · código de base em `projetos/2026-11-22-do-zero-1/remotion/` |
| Marca (logos, Inter, tokens, componente Capa) | repo `marca/design-system/` |

## Passos

1. **Ler antes de tudo, nesta ordem:**
   1. a página **Edição - regras e aprendizados**, inteira: regras fixas, receita, como o Bruno revisa e armadilhas;
   2. o Contexto Fixo, com o visual e a fronteira;
   3. o card da Producao: roteiro, roteiro de edição e legenda;
   4. no repo, o `CLAUDE.md` e a receita técnica.

   Comece com `git pull`.
2. **Abrir a rodada.**
   - Copie `projetos/_modelo/` para `projetos/AAAA-MM-DD-nome-curto/` e preencha o `briefing.md` com o link do card.
   - Mude o Status do card para `Editando`.
   - O bruto vem da subpasta `Gravação Raw`, ou chega em `~/Movies/` com nome de data. Se houver várias tomadas, use a última completa ou a que o Bruno indicar.
3. **Abrir a interface do Edvid desde o início** (`preview_server.py`, porta 4820, ou outra se estiver ocupada) e ligar o vigia de marcações. Toda prévia passa por ela, mesmo quando o Bruno está no celular. Mande também uma cópia da prévia para a subpasta `Gravação Final`, com o nome `<nome-curto>_previa_vN.mp4`.
4. **Fase 1, corte limpo.**
   - Transcreva o bruto e revise os nomes de ferramenta. A transcrição erra esses nomes: o certo é Claude, Claude Code, Grok Bot e Notion.
   - Corte toda pausa de 0,3 s ou mais dentro da frase.
   - Confira as pontas e os trechos rápidos transcrevendo o trecho isolado.
   - Liste o que diverge do card (números, nomes, frases que ficaram de fora) e pergunte o que vai na tela.
   - **Espere o Bruno aprovar o corte.**
5. **Fase 2, edição completa, sem parar no meio.** Siga a receita das camadas 3D e as regras fixas da página:
   - Bruno menor e apoiado na base, fora do quadro em ~40 a 45% do vídeo;
   - uma animação por frase, e nada parado na tela;
   - logos oficiais das ferramentas;
   - legenda karaokê;
   - sem trilha, com 40 a 60 efeitos;
   - −14 LUFS, com alvo −1,5 dBTP no loudnorm.

   Antes de mostrar, confira com stills de cada cena.
6. **Ajustes.**
   - O Bruno marca na interface (M no começo, M no fim, texto, Salvar) ou manda pelo celular "0:12, ...".
   - Aplique, apague o arquivo de marcações já aplicadas, renderize a nova versão e avise.
   - Marcação sem texto: pergunte. Se ele não responder, deixe como está.
7. **Thumbnail** [PROPOSTA: padrão ainda não aprovado pelo Bruno; diga que seguiu este padrão].
   - 1080 × 1920 PNG, a capa do Reels e do TikTok.
   - Fundo #0B0B0B com a grade sutil e o Bruno recortado na base, num quadro do bruto com expressão.
   - A headline do gancho, mista e em Inter: linha 1 leve e branca, linha 2 pesada e âmbar #E8A33D, até 8 palavras.
   - O símbolo pequeno da marca.
   - Mantenha o texto no centro, dentro de 1080 × 1350, para não ser cortado na grade do perfil. Respeite a zona segura.
   - Sem emoji, sem exclamação, sem gradiente, sem sombra, e nada do trabalho do Bruno.
   - Faça como uma composição `Thumbnail` no projeto Remotion e gere com `npx remotion still`.
   - Mostre na interface do Edvid junto com o vídeo, para o Bruno aprovar **os dois juntos**.
8. **Salvar o final** (quando o Bruno aprovar: "está perfeito", "aprovado").
   - O vídeo vai para `Gravação Final/<nome-curto>_final.mp4`, com 1080×1920 e 30 fps. A thumbnail vai para `Thumbnail/<nome-curto>_thumb.png`.
   - Use a pasta do Google Drive para Desktop no computador, ou o conector do Drive (`create_file` com `parentId` da subpasta). O link da pasta do post está em `Pasta Drive` no card.
   - A legenda `.srt` vai para `Legendas/`.
   - Não mude o compartilhamento. Quem abre o link para o Buffer é o Bruno, na hora de agendar.
9. **Fechar a rodada.**
   - **Card da Producao:** marque `Aprovado` só pelas palavras claras do Bruno, e diga que marcou por isso. Inclua um toggle "Vídeo editado" com a duração, os links do final e da thumbnail, as versões e o que mudou. Se a fala mudou números ou o CTA, ajuste a legenda.
   - **Aprendizados:** atualize primeiro a página **Edição - regras e aprendizados**, com uma linha no Histórico e as cenas, armadilhas e regras novas. Depois atualize o `docs/aprendizados.md` e o `briefing.md` do projeto.
   - Faça commit e push, sem vídeo no Git.
   - Diga ao Bruno que o próximo passo é a skill `agendamento-buffer`.

## Regras

- Só o Bruno aprova. Sem aprovação, o vídeo não vai para `Gravação Final` como final, só como prévia.
- Fronteira: nada do trabalho do Bruno em nenhum frame, nem na thumbnail.
- Vídeo bruto ou exportado nunca vai para o Git.
- Pedido explícito do Bruno vale mais que a receita. Se ele disser que é para sempre, vira regra fixa na página de edição.
