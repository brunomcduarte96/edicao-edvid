# Button

Botões de ação em quatro níveis: primário (preto), destaque (petróleo), secundário (contorno) e terciário (texto sublinhado).

- **Primário:** `inverse` com texto `inverse-fg`. A ação principal de uma tela.
- **Destaque:** `accent` com `accent-fg`. Para a ação que mais importa, no máximo um por tela.
- **Secundário:** borda 1px em `fg`, fundo transparente.
- **Terciário:** só texto sublinhado, para ações de baixa ênfase.
- Raio `r-sm` (4px), altura 44px (36 pequeno, 52 grande), padding horizontal 20px, texto 15px SemiBold.
- Desabilitado: `surface` com `fg-muted`. Foco: anel 2px em `link` com 2px de afastamento.
- Use `<button>` ou `<a href>` de verdade, nunca uma div clicável.
