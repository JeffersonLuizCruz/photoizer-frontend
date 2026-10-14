# Plano — Agenda estilo Google Calendar (mobile)

> Referência visual: `docs/WhatsApp Image 2026-10-14 at 08.54.55 (1).jpeg`
> (Google Calendar mobile, visão de mês).

## 1. Objetivo
Reproduzir no **mobile (<768px)** a visão de mês do print do Google Calendar,
**sem alterar o desktop**. Consolidar todas as opções da agenda no menu de três
barrinhas (drawer lateral) e adicionar FAB "+" para criar nova proposta.
Cuidar de responsividade e PWA.

## 2. Escopo
- **Dentro:** rota `/agenda` no mobile.
- **Fora:** desktop (permanece como está), backend, redesenho das visões
  semana/dia, retrabalho de `/minha-agenda`.

## 3. Estado atual
- `AgendaPage.tsx`: `PageTitle` + `ListToolbar` + toggles/filtros inline +
  `FilterSheet` + `AgendaCalendar` (mês/semana/dia) ou `AgendamentoList`.
- `AgendaCalendar.tsx`: `MonthView` com scroll horizontal (`sm:min-w-[560px]`).
- `AgendaCalendarEvent.tsx`: cor do pacote (`pacoteColorStyle`) + ícone de
  status; mostra hora no modo não-compacto.
- `Header` global: hambúrguer → `MobileMenu` (módulos). `MobileNav` inferior.
  Filtro de `CANCELADO` já implementado. **Não há FAB.**

## 4. Design alvo (mobile)
- **Top bar sticky** (abaixo do header global): `[☰]  outubro ▾  [🔍][⑭][avatar]`.
  - `☰` → abre o **drawer de opções da agenda**.
  - Título do mês tocável → seletor de mês/ano.
  - Busca (expande input), botão "Hoje" (ícone com o dia), avatar.
- **Grid de mês** 7 colunas (`D S T Q Q S S`), sem scroll horizontal, dias de
  meses vizinhos esmaecidos, **hoje** com círculo preenchido.
- **Pills** de largura total, altura reduzida, texto truncado, cor do pacote,
  sem hora.
- **N eventos + "+N"** quando exceder o limite da célula.
- **FAB "+"** fixo no canto inferior direito → `/propostas/nova`.

## 5. Implementação
### 5.1 Novos arquivos (`src/features/agenda/`)
| Arquivo | Papel |
|---|---|
| `components/AgendaMobileHeader.tsx` | Top bar com hambúrguer, mês, busca, hoje, avatar |
| `components/AgendaOptionsDrawer.tsx` | Drawer lateral com todas as opções |
| `components/AgendaFab.tsx` | Botão flutuante "+" |

### 5.2 Drawer de opções
- **Exibir:** Calendário / Lista.
- **Visualização:** Mês / Semana / Dia.
- **Filtros:** status, editor, pacote, período.
- **Ações:** "Ir para hoje", "Limpar filtros".

### 5.3 Visão de mês mobile
- `AgendaCalendar` recebe `variant`/`showToolbar`; no mobile remove
  `overflow-x-auto`/`min-w-[560px]` e usa células/pills compactos.
- `AgendaCalendarEvent` ganha modo `pill`.
- Estado `currentDate`/`selectedDate` elevado para `AgendaPage` (controlado).

### 5.4 Integração
- Ramifica por `useIsMobile()`: mobile usa header/drawer/FAB; desktop intacto.

### 5.5 Header global
- Esconde o hambúrguer do `Header` global em `/agenda` no mobile (navegação
  fica no "Menu" inferior), evitando dois ☰.

## 6. Responsividade
- Sem overflow horizontal; safe-area; `h-dvh`; `truncate`; testar 320–768px.

## 7. PWA
- `standalone` já configurado; FAB/drawer respeitam safe-area e não colidem com
  o bottom nav; botões ≥44px.

## 8. Acessibilidade
- Drawer com `aria-label`/foco preso/ESC; pills com `aria-label`; contraste via
  `getReadableTextColor` (WCAG).

## 9. Verificação
- `e2e/responsive.spec.ts`: sem overflow na agenda; FAB navega para
  `/propostas/nova`; hambúrguer abre drawer e alterna visão; sem regressão do
  `data-testid="agenda-calendar-event"`.
- `npm run lint` → `npm run build`.
