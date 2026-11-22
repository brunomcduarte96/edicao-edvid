# Aprendizados de edição

Registro das melhorias de cada rodada, para reutilizar nas próximas. O Claude lê este arquivo antes de editar e o atualiza ao final de cada rodada.

## Como registrar

- Uma entrada por rodada, **a mais recente no topo**.
- Escreva o aprendizado como uma regra aplicável ("Fazer X", "Evitar Y"), com o motivo.
- Quando um aprendizado se confirmar em 2 ou mais rodadas, mova-o para **Regras consolidadas** e, se for de estilo, para o [documento de contexto e design](falaibruno-contexto-e-design.md).

## Regras consolidadas

_Ainda nenhuma._

## Rodadas

<!-- Modelo de entrada (copie e preencha):

### AAAA-MM-DD · nome do vídeo · formato
- **Projeto**: projetos/AAAA-MM-DD-nome-curto/
- **O que funcionou**:
  - …
- **O que mudar na próxima**:
  - …
- **Preferências novas do Bruno**:
  - …
- **Métricas** (se houver: retenção, views, comentários):
  - …
-->

### 2026-11-21 · Vagas que pedem IA (RH) · Curto
- **Projeto**: projetos/2026-11-24-vagas-ia-fora-de-ti/
- **O que funcionou**:
  - Buscar a pauta no Notion pelo tema antes de perguntar: voz, formato, pilar, números e fonte estavam todos lá. Não foi preciso perguntar nada ao Bruno.
  - Gravação horizontal com fundo verde: usar o recorte de pessoa do Edvid (`recorte_pessoa.py`, Apple Vision) em vez de chroma key. O chroma key do ffmpeg deixou o rosto e o cabelo transparentes. Depois do recorte, aplicar `despill=type=green:mix=0.5:expand=0`: com `expand` maior, a camiseta cinza fica roxa.
  - Layout 9:16 para webcam horizontal: o Bruno sobre preto #0A0A0A na metade de baixo, com o crop seguindo o rosto (suavizado em ±1,5 s); os cards de dado no terço de cima e a legenda logo acima da cabeça. Assim, nenhum texto passa por cima do rosto.
  - Cards e legendas da marca feitos num componente próprio (`src/cenas/FalaiBruno.tsx`), com a Inter local do design system, porque as legendas e os ganchos do template do Edvid usam Poppins e cores fora da marca.
- **O que mudar na próxima**:
  - Gravar mais longe da câmera, ou já na vertical. A cabeça ocupa quase toda a altura do quadro horizontal, então no 9:16 a boca cai perto da zona de interface do Instagram.
  - Conferir as palavras de começo de frase depois do corte: o `speech_regions` cortou o "Depois", que foi dito baixinho. Transcrever o corte e comparar com o roteiro.
  - A frase de contexto da fonte (Gupy, 1,6 milhão de vagas) ficou de fora da gravação. A fonte entrou só na tela.
- **Preferências novas do Bruno**:
  - Depois de aprovar o corte, ele quer que eu faça a edição inteira até o final e entregue a versão final, sem parar para aprovações no meio.
- **Métricas**: (preencher depois de publicar)

