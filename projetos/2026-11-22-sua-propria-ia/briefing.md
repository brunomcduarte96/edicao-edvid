# Briefing: Você pode ter a sua própria IA: aberto, fechado e harness

- **Data**: 2026-11-22
- **Linha na Producao do Notion**: https://app.notion.com/p/4207642f429981c4a34ee31f9eb221f1
- **Voz**: C (mão na massa)
- **Formato**: Curto, gravado no fundo verde (receita das camadas 3D)
- **Série**: nenhuma
- **Pilar**: IA na prática
- **Duração alvo**: ~75 s no roteiro; o corte limpo v1 ficou com 2:02 (122 s)
- **Objetivo do vídeo**: mostrar que dá para ter IA própria (modelo aberto rodando no computador), explicar fechado × open weight × open source (analogia do bolo) e modelo × harness (motor × carro)
- **Mensagem principal em uma frase**: o modelo é o motor, o harness é o carro; dá para alugar o carro pronto ou montar o seu
- **Gancho**: "Tem IA boa que você baixa, roda no seu computador e ninguém te cobra nada por mês."
- **Fechamento**: "E fala aí, você teria a sua própria IA ou fica com o carro pronto alugado?"
- **Comenta PALAVRA?** não
- **Brutos**: Drive, pasta do post / Gravação Raw: https://drive.google.com/file/d/15HODfECBv9VzVo4TOgMoZWT3Bb-GrxfK/view (= `~/Movies/2026-11-22 18-40-26.mov`, 1920×1080, 60 fps, 8:16, Rec.709). Cópia local em `videos/brutos/sua propria ia 22112026/`.
- **Pasta do post no Drive**: https://drive.google.com/drive/folders/1xgUtnWC35OIGWJpDN1c2AfbJs7QfWXzQ
- **Prévia do corte**: Drive, Gravação Final / `sua-propria-ia_previa_v1.mp4` (720p, 2:02)
- **Exportado**: Drive, pasta do post / Gravação Final / `sua-propria-ia_final.mp4` (1080×1920, 30 fps, 2:02, −14,1 LUFS): https://drive.google.com/file/d/1wivhDSCI8NowA63nhHoxKEoovymQ43eq/view. Thumbnail em Thumbnail/`sua-propria-ia_thumb.png`, legenda em Legendas/`sua-propria-ia.srt`.

## Roteiro

O roteiro completo fica no card. Pontos da fala que importam para a edição:

1. Gancho: IA boa que você baixa, sem mensalidade; "uns 4 meses atrás das melhores do mundo".
2. Contexto: "Quem mediu isso foi a Epoch AI", 4 meses em média desde janeiro.
3. Bolo: fechado ("tipo o Sol da OpenAI e o Opus da Anthropic") = fatia; open weight = bolo inteiro sem receita; open source = bolo + receita + ingredientes (pesos, código, dados de treino).
4. Regancho: "Até a OpenAI liberou o modelo com pesos abertos", "16 GB de RAM". Hugging Face → Ollama ou LM Studio → roda até sem internet. Ajustar com os seus exemplos.
5. Motor ("só o cérebro") × carro = harness: memória, instruções, ferramentas. ChatGPT, Claude Code, Codex.
6. OpenAI ou Anthropic = aluga motor + carro pronto, paga pelo uso, dados no servidor deles. O seu harness = escolhe o motor e onde os dados ficam.
7. Autoridade: "Eu trabalho construindo IA para empresas." Carro muda o resultado tanto quanto o motor.
8. Opinião: carro pronto é o melhor começo; dado sensível ou uso o dia inteiro → ter o seu.
9. CTA: "me segue pra aprender a como usar IA de verdade no seu dia a dia" + pergunta.

## Fase 1 (corte)

- Uma tomada com refações no meio, 8:16. Corte limpo v1: 66 trechos, 2:02, todas as pausas de 0,3 s ou mais tiradas (bordas pelo silêncio a −44 dB, 60 ms antes e 80 ms depois).
- Tiradas: a primeira tentativa do fechado ("modelo fechado. Tipo os da OpenAI", refeita), "Open weight, que é o bolo aberto" (refeita como "peso aberto"), o falso começo "O app app do chat" e um "hum" solto em 7:28.
- Revisão de nomes: IA, Epoch AI, OpenAI, Anthropic, Opus, ChatGPT, Claude Code, Ollama, harness. "Sol da OpenAI" ficou como ouvido (confirmado transcrevendo o trecho isolado): perguntar.
- Pontas e trechos rápidos conferidos transcrevendo o trecho isolado e o corte inteiro. O tropeço "o bolo, bolo inteiro" não tem pausa para cortar e no corte soa limpo.
- Sem grade (Rec.709). J-cut padrão. −14 LUFS. Sem ganho por trecho (os níveis dos trechos ficaram equilibrados; as quedas são só finais de frase).

## Decisões do Bruno na aprovação do corte (22/11)

- Duração: mantém os 2:02, sem cortar frases.
- "Sol" é o modelo da OpenAI e "Opus" o da Anthropic: a tela segue a fala (Sol + logo da OpenAI, Opus + asterisco da Anthropic).
- 16 GB: a tela segue a fala ("16 GB de RAM"). Sem chip "gpt-oss" (o nome não foi dito).
- Fecho: só o que ele falou, sem "Falai, o que você acha?" escrito.
- Sem rodapé de fonte nas cenas.

## Fase 2

- Receita das camadas 3D: Bruno a 74% na base, fora do quadro em 45% (5,1–8,3 · 12,5–18,6 · 22,4–31,4 · 37,6–45,7 · 53,6–62,2 · 73,9–82,8 · 90,9–97,7 · 109,5–114,5 s), 30 cenas (uma por frase), 4 separações 3D (abertura, "aqui fica interessante", "harness", fim), flash em 5 trocas (bolo → fechado, → open weight, → open source, → motor, → carro), zoom 1/1,06/1/1,12 com punch-in 1,12 nos dois reganchos.
- Headline mista (receita): "Você pode ter" leve e branca + "a sua própria IA" pesada e âmbar, até 3,2 s. A aba Estilo não foi aberta: segui a receita aprovada.
- Recorte: chroma key 0x6CC042 · 0,10 · 0,03 limpo de primeira (sem halo).
- Logos oficiais: OpenAI, Codex, Ollama, LM Studio e Hugging Face (pacote de ícones @lobehub/icons-static-svg 1.100.0 / 1.73.0, convertidos para PNG branco; Hugging Face colorido), Anthropic, Claude e Claude Code (Drive falaibruno/anthropic-logos).
- Legenda karaokê revisada (Epoch AI, Anthropic, OpenAI, Open weight, treino, Hugging Face, Ollama, cérebro, harness, "com o carro"). Sem trilha. 55 efeitos a −8 dB. −14 LUFS / −1,5 dBTP.
- Thumbnail [PROPOSTA]: fundo #0B0B0B com grade, notebook com barra de download âmbar atrás do Bruno, "Você pode ter" leve e branca + "a sua própria IA" âmbar.

## Pedidos de ajuste (revisões)

- Corte v1 → aprovado com as respostas acima (22/11).
- Fase 2 v1 (prévia v2) → aprovada de primeira, com a thumbnail ("ficou ótimo. pode subir para o drive", 22/11). Card marcado Aprovado por essas palavras.

## Aprendizados desta rodada

Copiados para `docs/aprendizados.md` e para a página Edição - regras e aprendizados no Notion (histórico, cenas e armadilhas). Principal: recorte em WebM VP9 com alfa no lugar do ProRes 4444 (disco cheio no render).
