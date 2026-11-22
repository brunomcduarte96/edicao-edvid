# Arquivos da marca FalaiBruno

O pacote do design system v1.0 está em [`design-system/`](design-system/), exatamente como veio no `FalaiBruno.zip` (os caminhos batem com o `manifest.json`). Comece pelo [`design-system/README.md`](design-system/README.md).

| O que | Onde | Uso na edição |
| --- | --- | --- |
| Logos SVG (13 versões) | `design-system/assets/Logos/` | Preferir sempre que o editor aceitar vetor |
| Logos PNG transparentes | `design-system/assets/Logos PNG/` | Editores e redes que não aceitam SVG |
| Animação do símbolo (F → B, ~5 s, 480×480, 25 fps) | `design-system/assets/Animações/` | `-transparente.webm` sobre o vídeo; `.mp4`/`.gif` com fundo branco |
| Fonte Inter (300, 400, 500, 600, 700, itálico) | `design-system/fonts/` | Instalar no Mac e no Windows antes de editar |
| Tokens de cor, tipo e espaço | `design-system/tokens.css`, `tokens.json`, `api/tokens.md` | Remotion, gráficos e cards |
| Componentes (Botão, Tag, Card, Campo, Aviso, Progresso, Capa) | `design-system/components/` | Receitas HTML/CSS com prévia |

## Arquivo por situação no vídeo

| Situação | Arquivo |
| --- | --- |
| Marca d'água sobre o vídeo [PROPOSTA] | `assets/Logos PNG/simbolo-mono-branco.png` (48–64 px) |
| Card final sobre preto | `assets/Logos/assinatura-branco.svg` |
| Card ou capa sobre branco | `assets/Logos/assinatura-preto.svg` |
| Capa (só o símbolo) | `assets/Logos/simbolo-cor.svg` |
| Sobre petróleo, âmbar, cobalto ou foto | versões `-mono-branco` |
| Abertura ou fechamento animado | `assets/Animações/animacao-v2-branco-transparente.webm` (fundo escuro) ou `-cor-transparente.webm` |
| Foto de perfil | `assets/Logos PNG/avatar-preto.png` ou `avatar-branco.png` |

## Ainda faltam

- `falaibruno-design-system-v1.0.pdf`: não veio no zip. O conteúdo está no `design-system/README.md`, então o PDF é opcional.
- **Animação transparente em ProRes 4444 (.mov)**, para Premiere, After Effects, Final Cut, DaVinci e CapCut: o README do pacote diz que fica "no pacote de logos", mas não veio. Os `.webm` transparentes servem enquanto isso em editores que os aceitam.
