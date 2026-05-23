---
title: "Design System · Guidelines"
aliases: ["Design System", "DS Guidelines"]
tags: [the-solo-founder, design, ui, tokens, a11y]
up: "[[../README|Docs Hub]]"
related:
  - "[[../prd/PRD-The-Solo-Founder|PRD]]"
  - "[[../motion/motion-system|Motion System]]"
  - "[[../frontend/structure|Frontend · Estrutura]]"
  - "[[../personas/personas|Personas]]"
---

# Design System — Guidelines (MVP)

**Objetivo:** garantir **coerência premium**, **hierarquia clara** entre IA Viva e painel de artefatos, e **acessibilidade** sob uma **identidade estritamente minimalista em tema escuro (dark-only)**.  
**Relaciona com:** [`/docs/motion/motion-system.md`](/docs/motion/motion-system.md), [`/docs/frontend/structure.md`](/docs/frontend/structure.md).

---

## 0. Diretriz mestre — Minimalismo dark-only (não-negociável)

A identidade visual do produto é **estritamente minimalista** e **exclusivamente dark**. Não há modo claro, não há "temas alternativos", não há decoração supérflua. Toda decisão de UI deve passar pelas regras abaixo; o que **não** se justificar por elas **não entra**.

**Princípios:**

1. **Dark-only.** Não existe modo claro no MVP nem em release subsequente próxima. O sistema **não** respeita `prefers-color-scheme: light` (mantém dark independentemente). Acessibilidade é resolvida via contraste alto, **não** via tema claro.
2. **Subtração antes de adição.** Cada elemento precisa **justificar sua existência**. Em dúvida, **remova**. "Quase nada" é a estética-alvo.
3. **Espaço negativo é o componente principal.** O vazio entre elementos é tão importante quanto os elementos. Densidade visual baixa em todo lugar exceto onde a função obriga (código, tabelas).
4. **Paleta extremamente restrita.** Tons de cinza/preto + **um** accent funcional. Sem gradientes coloridos decorativos.
5. **Tipografia faz o trabalho pesado.** Hierarquia por **peso e tamanho**, não por cor ou caixa.
6. **Sem cromos decorativos.** Sem sombras pesadas, sem bordas grossas, sem ícones ornamentais, sem ilustrações.
7. **Movimento discreto.** Animação serve à legibilidade do estado da IA (ver motion system) — nunca à decoração.
8. **Honestidade visual.** Se um elemento não está fazendo nada, ele não brilha, não pulsa, não chama atenção.

---

## 1. Pilares visuais

A diferenciação **Personal / Business** acontece dentro do **mesmo tema dark minimalista** — sem mudança de luminosidade global, apenas micro-ajustes no **accent funcional** e na entropia de motion.

| Pilar | Personal | Business |
|-------|----------|----------|
| Accent funcional | levemente mais quente (Δ matiz ≤ 8°) | neutro frio |
| Motion entropy | levemente maior (orgânico contido) | mais geométrico |
| Tipografia | mesma família; tracking levemente maior | densidade levemente maior |
| Grain / textura | **0%** (não usar) | **0%** (não usar) |

> Mudanças entre modos são **micro**. Um observador casual não deve perceber "duas UIs" — apenas uma UI que **respira diferente**.

---

## 2. Tokens (baseline — ajustar em Figma)

### 2.1 Cor (paleta restrita, dark-only)

| Token | Valor-alvo (calibrar em Figma) | Uso |
|-------|-------------------------------|-----|
| `--bg-void` | `#07080A` (quase-preto, levemente azulado) | fundo profundo atrás do núcleo; canvas da IA Viva |
| `--bg-base` | `#0B0D10` | fundo base da app (shell, painel direito) |
| `--bg-elevated` | `#111418` | superfícies elevadas sutis (cards de artefato, picker, drawer) — diferença ≤ 5% de luminância sobre `--bg-base` |
| `--bg-overlay` | `rgba(0,0,0,0.4)` | sobreposições modais; sempre com leve backdrop blur |
| `--border-subtle` | `rgba(255,255,255,0.06)` | divisores; **única** forma de separação entre superfícies (sem sombras) |
| `--border-strong` | `rgba(255,255,255,0.12)` | hover, foco indireto |
| `--fg-primary` | `rgba(255,255,255,0.92)` | texto principal (legenda, mensagens do usuário, conteúdo) |
| `--fg-secondary` | `rgba(255,255,255,0.66)` | títulos de artefato, rótulos |
| `--fg-muted` | `rgba(255,255,255,0.44)` | metadados, timestamps, placeholders |
| `--fg-disabled` | `rgba(255,255,255,0.24)` | estado desabilitado/`unavailable` |
| `--accent-personal` | calibrar (matiz quente, **baixa saturação**, alta luminância ≈ 78–86%) | foco, toggle ativo, micro destaques |
| `--accent-business` | calibrar (matiz frio, **baixa saturação**, alta luminância ≈ 78–86%) | foco, toggle ativo, micro destaques |
| `--danger` | calibrar (vermelho dessaturado) | erro, estado destrutivo |
| `--success` | calibrar (verde dessaturado, baixa luminância) | confirmação **discreta**, sem celebração |
| `--focus-ring` | `--accent-*` com α ≈ 0.7 | ring de foco 2px, offset 2px |

**Regras de cor:**

- **Sem gradientes coloridos** em UI. Gradiente é permitido **apenas** no canvas da IA Viva (núcleo/glow/partículas), nunca em chrome.
- **Sem cores saturadas** fora dos canais funcionais (`danger`/`success`). Saturação máxima recomendada: **30%** para accents.
- **Contraste mínimo:** 4.5:1 para texto corrido; 3:1 para UI grande e elementos não-textuais informativos.
- **Hierarquia por opacidade** sobre `--bg-base`, não por adição de cor.

### 2.2 Espaço

- Grid base **8px**; microajustes **4px** apenas internos a componentes densos.
- **Densidade alvo:** baixa. Margens internas generosas em painéis; padding mínimo de **16px** em qualquer card; **24px** em containers de coluna.
- **Radius:** núcleo perfeito (círculo); superfícies retangulares com **`8px`** (sutil, não "soft UI"); nada acima de `12px` exceto botões pílula (toggles).
- **Sombras:** **proibidas**. Separação visual exclusivamente por `--border-subtle` ou diferença de luminância de fundo.

### 2.3 Tipografia

- **UI:** sans geométrica humanista (TBD licença) — peso 400 default, 500 para títulos, 600 para ênfase rara. **Evitar 700+**.
- **Código:** monoespaçada com ligaduras **off** por default.
- **Tracking:** levemente aberto (0 a +0.5%) em UI; **normal** em conteúdo longo.
- **Line-height:** 1.5 para corpo; 1.2 para títulos curtos.

Escala modular: 12 / 14 / 16 / 20 / 28 / 40.

**Hierarquia:** prefira variação de **tamanho + peso + opacidade do `--fg-*`** em vez de cor.

---

## 3. Componentes mínimos

| Componente | Estados | Notas |
|------------|---------|-------|
| `ModeSwitch` | personal, business, transitioning | acessível via teclado |
| `ChatHeader` | online, thinking, searching, error | texto curto |
| `MessageBubble` | user, system | **apenas** mensagens do usuário e do sistema; a fala da IA **nunca** vira `MessageBubble` (vive na legenda à esquerda) |
| `ArtifactCard` | code, chart, table, file, link, embed, ui | item gerado pela IA no painel direito; com título curto, ação "ouvir explicação" e ações específicas do tipo (copiar, baixar, abrir) |
| `ArtifactStream` | empty, streaming, idle | container vertical do painel direito; intercala `MessageBubble` (user) e `ArtifactCard` em ordem cronológica |
| `Composer` | idle, typing, uploading, mentioning | progress inline; abre picker ao digitar `@` |
| `AttachmentChip` | uploading, ready, error | ícone + nome truncado |
| `ArtifactMentionChip` | ready, unavailable | chip não-editável no composer; ícone do tipo + título curto + `×`; estado `unavailable` se artefato sumiu |
| `ArtifactMentionPicker` | open, empty, filtering | listbox flutuante acima do composer; **somente artefatos da IA** (`ai.artifact.*`); ordem por recência; busca + filtro por tipo; navegação por teclado; estado `empty` orienta para upload/drag-drop |
| `SoundToggle` | sound_on, sound_off, unavailable | par com `MicMuteToggle`, entre núcleo e legenda; halo opcional sincronizado com TTS |
| `MicMuteToggle` | mic_on, mic_off, unavailable | ao lado do `SoundToggle`; default `mic_off`; halo acoplado à energia do áudio captado quando `mic_on`; mute em < 100ms |
| `CaptionBox` | idle, listening, thinking, generating, error | tamanho fixo; render progressivo; `aria-live="polite"` |
| `CaptionPager` (◀ / ▶) | enabled, disabled, hover, focus, pulse-new | acessível por teclado (← / → / PageUp / PageDown) |

---

## 4. Iconografia

- **Monoline** estrito, traço **1.5px** em ícones de 24px (escalar proporcionalmente).
- Cantos **levemente** arredondados; sem detalhes ornamentais; sem preenchimentos sólidos exceto quando indica estado ativo.
- Cor do ícone segue `--fg-secondary` em estado normal; `--fg-primary` em hover/ativo; `--fg-disabled` em desabilitado. **Sem** ícones coloridos.
- **Nunca** usar ícones para decorar — apenas para representar ação ou estado.

---

## 5. Acessibilidade

- Foco visível **sempre** (ring 2px com `--focus-ring`, offset 2px). Foco **nunca** removido.
- Não depender só de cor para estado (usar forma/ícone/peso também).
- Headings markdown preservam hierarquia para leitores de tela.
- Contraste validado contra `--bg-base` e `--bg-elevated` (4.5:1 texto, 3:1 UI grande).
- Tamanho mínimo de alvo tocável: **44×44px** (mesmo em desktop).
- `prefers-reduced-motion: reduce` desliga animações decorativas e reduz partículas (ver motion system).

---

## 6. Conteúdo proibido visualmente (lista exaustiva)

A lista abaixo é **bloqueante**. Se algo se parece com qualquer item, **não entra**.

- **Modo claro / temas alternativos** — produto é dark-only.
- **Gradientes coloridos** em UI/chrome (permitido apenas no canvas da IA Viva).
- **Sombras** de qualquer tipo (`box-shadow`, drop-shadow, "soft 3D"). Separação só por borda sutil ou luminância.
- **Cores saturadas** fora de `danger`/`success`. Sem neons, sem cyberpunk.
- **Bordas grossas** (> 1px); bordas com cor saturada; bordas duplas.
- **Emojis no chrome**; permitidos apenas em conteúdo gerado pelo usuário (opt-in).
- **Ilustrações decorativas**, mascotes, "spot illustrations", stickers.
- **Skeumorfismo**: superfícies "vidro" exageradas, glassmorphism saturado, "neumorfismo".
- **Gráficos com cores fortes/saturadas** — usar paleta dessaturada coerente com o tema.
- **Animações decorativas** que não sirvam a um estado real (ver M1 — Honest motion).
- **Pesos tipográficos extremos** (≥ 700) exceto em casos pontuais aprovados.
- **Múltiplos accents simultâneos** na mesma tela.
- **Hover states "barulhentos"** (mudança grande de cor/escala). Use opacidade e borda sutil.
- **Animações de "loading" genéricas** (spinners genéricos). Estado de espera é comunicado pelo núcleo da IA Viva.

---

## Related (Obsidian)

- [[../prd/PRD-The-Solo-Founder|PRD]]
- [[../motion/motion-system|Motion System]]
- [[../frontend/structure|Frontend · Estrutura]]
- [[../personas/personas|Personas]]
- [[../README|Docs Hub]]

---

*Migrar tokens para `tokens.json` no repositório de código quando o projeto for inicializado.*
