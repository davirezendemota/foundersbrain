# Fluxos de UX

## Fluxo 0 — Vault Setup (primeira abertura)

```
[App aberto — vault sem perfil]
        |
        v
[Tela de Onboarding]
"Vou personalizar a sua IA. Vamos começar?"
        |
        v
[IA: P1 — "Como você quer que eu te chame?"]
        |   [Usuário responde]
        v
[IA: P2 — "Me conta sobre você — o que você faz e o que está construindo?"]
        |   [Usuário responde]
        v
[IA: P3 — "Quais são suas maiores ambições para os próximos 12 meses?"]
        |   [Usuário responde]
        v
[IA: P4 — "Quais são suas crenças mais fortes sobre empreendedorismo?"]
        |   [Usuário responde]
        v
[IA: P5 — "Quando toma uma decisão difícil, o que você mais valoriza?"]
        |   [Usuário responde]
        v
[IA: P6 — "Como você prefere que eu me comunique com você?"]
        |   [Usuário responde]
        v
[IA: apresenta "Perfil do Brain" consolidado]
        |
   ┌────┴──────┐
[Aprova]    [Ajusta]
   |              |
   v              v
[brain-profile.md  [IA edita → apresenta novamente]
 salvo no vault]
   |
   v
[Chat principal desbloqueado]
```

---

## Fluxo 1 — Chat Principal + Slash Commands

```
[Chat Principal]
        |
   [Usuário digita mensagem]
        |
   ┌────┴──────────────────┐
[Texto livre]           [Digita "/"]
   |                        |
   v                        v
[IA responde com     [Picker de slash commands]
 personalidade           |
 do vault]          [Seleciona /nova-ideia]
                         |
                         v
                   [Fluxo de captura de ideia]
                   (Fluxo 2 abaixo)
                         |
                         v
                   [Retorna ao chat]
```

---

## Fluxo 2 — Captura + Modo Plano (via chat ou diretamente)

```
[Usuário abre o app]
        |
        v
[Lista de ideias]
        |
   [+ Nova Ideia]
        |
        v
[Campo livre: "Qual é a ideia?"]
        |
   [Usuário digita e confirma]
        |
        v
[Ideia salva — versão 1 (bruta)]
        |
        v
[Modo Plano iniciado automaticamente]
        |
        v
[IA: resumo do que entendeu]
        |
        v
[IA: perguntas de esclarecimento]
   (problema / público / solução / diferencial)
        |
   [Usuário responde]
        |
        v
[IA: proposta de versão estruturada]
        |
   ┌────┴────┐
[Aprova]  [Edita]  [Rejeita]
   |          |         |
   v          v         v
[Salva     [Ajusta  [IA recomeça
versão 2]  e salva]  com correções]
```

---

## Fluxo 3 — Revisitar ideia existente

```
[Lista de ideias]
        |
   [Usuário busca / seleciona]
        |
        v
[Ideia aberta — versão mais recente]
        |
   ┌────┴──────────────┐
[Continuar modo plano] [Ver histórico]
        |                    |
        v                    v
[Modo Plano (UC-002)]  [Linha do tempo de versões]
                             |
                        [Selecionar versão]
                             |
                        [Ver diff / conteúdo completo]
```

---

## Estados de uma Ideia

| Estado | Significado | Indicador visual |
|--------|-------------|-----------------|
| Bruta | Recém-capturada, sem modo plano | [A DEFINIR] |
| Em plano | Modo plano iniciado mas não concluído | [A DEFINIR] |
| Estruturada | Modo plano concluído e aprovado | [A DEFINIR] |
| Madura | [Fase 2] Pronta para modo MVP | [A DEFINIR — Fase 2] |

---

## Fluxo 4 — Content Library

```
[Content Library aberta]
        |
[Input no modo BUSCA]  [Botão "+" no canto direito]
        |                        |
   [Usuário digita]         [Usuário clica "+"]
        |                        |
        v                        v
[Grid filtra em       [Input muda para modo CADASTRO]
 tempo real]          "Cole a URL do vídeo"
                             |
                        [Usuário cola URL e confirma]
                             |
                             v
                    [Card placeholder aparece na grid]
                             |
                    [Backend extrai thumbnail (bg)]
                             |
                        ┌────┴──────────────┐
                   [Sucesso]            [Falha]
                        |                   |
                        v                   v
                [Card atualizado     [Placeholder com
                 com thumbnail]       ícone da plataforma]
```

**Filtro por plataforma:**

```
[Badges horizontais acima da grid]
[Todos] [Instagram] [TikTok] [YouTube] [...]
   |
[Usuário clica em badge]
   |
[Grid filtra para aquela plataforma]
```

**Abrir vídeo:**
```
[Usuário clica no card]
   |
[Link original abre no browser padrão]
```

---

## Estados de uma Ideia

| Estado | Significado | Indicador visual |
|--------|-------------|-----------------|
| Bruta | Recém-capturada, sem modo plano | [A DEFINIR] |
| Em plano | Modo plano iniciado mas não concluído | [A DEFINIR] |
| Estruturada | Modo plano concluído e aprovado | [A DEFINIR] |
| Madura | [Fase 2] Pronta para modo MVP | [A DEFINIR — Fase 2] |

---

## Notas de UX

- A interface tem três áreas principais: **Chat Principal**, **Ideas** (lista de ideias), **Content Library**
- O Chat Principal é o hub — slash commands fazem a ponte para as outras áreas
- O modo plano é um painel de chat/conversa ao lado da ideia, não uma tela separada
- O histórico de uma ideia é acessível por uma aba ou ícone — sem navegação para outra tela
- A Content Library usa input híbrido (busca ↔ cadastro) para manter a interface limpa
- [Wireframes a definir — ver design/wireframes/]
