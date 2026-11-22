---
name: agendamento-buffer
description: Agenda no Buffer um post Aprovado da Producao da FalaiBruno (Instagram Reel, TikTok e YouTube Shorts) e marca o card como Agendado. Use quando o Bruno pedir para agendar, programar ou publicar um post aprovado.
---

# 5. Agendamento no Buffer (FalaiBruno)

Última parte do fluxo: **pesquisa → cards de ideias → post em produção → edição e criativos → agendamento**. Entrada: card da Producao com Status `Aprovado`, final em `Gravação Final` e thumbnail em `Thumbnail`.

Use quando o Bruno disser "agenda esse post", "programa para amanhã", "pode publicar" ou parecido, para um card da Producao. Não use para editar vídeo nem para criar card.

Responda sempre em português (Brasil). Precisa dos conectores **Notion**, **Google Drive** (conta bruno.mcduarte96) e **Buffer** (conta da FalaiBruno).

## IDs fixos

| O quê | ID |
| --- | --- |
| Producao (data source) | `collection://4207642f-4299-80dd-82d7-000b5682fe7d` |
| Buffer: organização "My Organization" | `69db1aa014a6f8c682962bc6` (fuso America/Sao_Paulo) |
| Buffer: Instagram (falaibruno) | `6afe5b69ece6dfde5f16de3b` |
| Buffer: TikTok (falaibruno) | `6afe5bb6ece6dfde5f16e20f` |
| Buffer: YouTube (Falaibruno) | `6afe5ccfece6dfde5f16ee17` |

Se algum id de canal falhar, rode `list_channels` com a organização acima e use o id que voltar. Nunca invente id.

## Antes de agendar: 4 conferências

1. **Aprovado.** O card precisa estar com Status Aprovado, ou o Bruno precisa ter aprovado o vídeo final com palavras claras nesta conversa ("está perfeito", "aprovado", "pode agendar"). Nesse caso, marque Aprovado e diga que marcou pelo que ele escreveu. Sem aprovação, não agende.
2. **Vídeo final certo.** Ache o arquivo final na Pasta Drive do card (subpasta `Gravação Final`, ou o `*_final.mp4` da pasta do vídeo). Confira com o Bruno se é a última versão quando houver mais de uma.
3. **Link aberto.** Rode `get_file_permissions` no arquivo. Precisa ter `anyoneWithLink` como leitor. Se não tiver, peça ao Bruno para mudar no Drive ("Compartilhar → Acesso geral → Qualquer pessoa com o link → Leitor"). O Claude não consegue mudar o compartilhamento. O link usado no Buffer é `https://drive.google.com/uc?export=download&id=<id do arquivo>`.
4. **Legenda bate com o vídeo.** Leia o toggle "Legenda e hashtags" do card e compare com o que foi falado e mostrado no vídeo final (números, nomes, CTA). Se divergir, ajuste a legenda e mostre a versão nova ao Bruno.

## Horário

- Se o Bruno disser o dia e a hora, use exatamente isso.
- Se disser só o dia, use **19h** (início da janela 19h–21h do Contexto Fixo) e diga que escolheu.
- Se não disser nada, proponha o próximo dia livre às 19h, olhando os posts já agendados (`list_posts` com status scheduled) para não pôr dois no mesmo horário.
- `dueAt` sempre com fuso de Brasília, por exemplo `2026-11-23T19:00:00-03:00`, e sempre no futuro (confira o `currentTime` do `get_account`).
- O plano do Buffer aceita no máximo 10 posts agendados. Cada vídeo usa 3. Se não couber, avise.

## Mostrar e pedir o OK

Numa mensagem só, mostre: dia e hora, os 3 canais, a legenda final completa e o título do YouTube. Agende só depois do OK do Bruno. Depois de publicado, não dá para desfazer.

## Agendar (3 posts, mesmo horário)

Para cada canal, `create_post` com `mode: customScheduled`, o mesmo `dueAt`, `schedulingType: automatic`, o mesmo `text` (legenda + linha vazia + hashtags) e `assets: [{ video: { url: <link de download> } }]`.

| Canal | metadata |
| --- | --- |
| Instagram | `{ instagram: { type: "reel", shouldShareToFeed: true } }` |
| TikTok | nenhum |
| YouTube | `{ youtube: { title: "<título curto> \| <Série #N>", categoryId: "28" } }` (Ciência e tecnologia; título até 100 caracteres) |

Confira em cada resposta: `status: scheduled`, `dueAt` certo e `durationMs` do vídeo igual à duração do final. Se algum falhar, não repita os que deram certo; corrija só o que falhou.

## Depois de agendar

1. No card da Producao: Status **Agendado**, `Data de publicação` com data e hora (`is_datetime` 1), toggle da legenda com o texto final, e no registro do vídeo uma linha: "Agendado no Buffer em DD/MM para DD/MM às HHh no Instagram (Reel), TikTok e YouTube Shorts (título: ...)" e o item "Depois de publicar: mudar para Publicado, colar o Link publicado e anotar as métricas".
2. Se o título do card não bate mais com o vídeo, atualize.
3. No briefing do projeto no repo (`projetos/<projeto>/briefing.md`), seção "Aprovação e agendamento". Commit e push.
4. Responda ao Bruno em poucas linhas: dia e hora, canais, título do YouTube, e o lembrete: **deixar o link do vídeo aberto até depois do horário**, porque o Buffer baixa o arquivo na hora de publicar.

## Regras

- Só agenda o que está Aprovado. Só o Bruno aprova.
- Não usa `shareNow` nem `shareNext` sem o Bruno pedir.
- Não apaga nem edita posts já agendados de outros vídeos.
- Não muda compartilhamento no Drive.
- LinkedIn é outra marca (Bruno Duarte) e tem texto próprio: só agende lá se o Bruno pedir.
