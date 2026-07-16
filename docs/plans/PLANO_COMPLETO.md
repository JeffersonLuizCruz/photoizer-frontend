# Plano de Desenvolvimento — CRM Pós-Venda

> Sistema de Gestão Operacional Pós-Venda para Ensaios Fotográficos
> Atualizado em: 14/07/2026

---

## Sumário

1. [Visão Geral das Fases](#1-visão-geral-das-fases)
2. [Fase 1 — Fundação do Domínio](#fase-1--fundação-do-domínio)
3. [Fase 2 — Pacotes & Configuração Financeira](#fase-2--pacotes--configuração-financeira)
4. [Fase 3 — Novo Agendamento (Refit Completo)](#fase-3--novo-agendamento-refit-completo)
5. [Fase 4 — Detalhes do Agendamento](#fase-4--detalhes-do-agendamento)
6. [Fase 5 — Agenda (Calendário)](#fase-5--agenda-calendário)
7. [Fase 6 — Lista de Agendamentos](#fase-6--lista-de-agendamentos)
8. [Fase 7 — Gestão de Tarefas & Editor](#fase-7--gestão-de-tarefas--editor)
9. [Fase 8 — Dashboard Operacional](#fase-8--dashboard-operacional)
10. [Fase 9 — Gestão Financeira](#fase-9--gestão-financeira)
11. [Fase 10 — Documentos & Encerramento](#fase-10--documentos--encerramento)
12. [Mapa de Rotas Final](#12-mapa-de-rotas-final)
13. [Shared Components a Criar](#13-shared-components-a-criar)
14. [Ordem Recomendada](#14-ordem-recomendada)

---

## 1. Visão Geral das Fases

```
Fase 1: Fundação do Domínio     →  Tipos, schemas, constantes, máquina de estados
Fase 2: Pacotes & Financeiro     →  Gestão de pacotes, cálculo automático de valores
Fase 3: Novo Agendamento (Refit) →  Wizard alinhado ao novo domínio (4 passos)
Fase 4: Detalhes do Agendamento  →  Tela de detalhes com abas + timeline + ações
Fase 5: Agenda (Calendário)      →  Visão mensal/semanal/dia com filtros
Fase 6: Lista de Agendamentos    →  Tabela com filtros e busca textual
Fase 7: Gestão de Tarefas        →  Tasks automáticas, prazos, notificações
Fase 8: Dashboard Operacional    →  Agenda do dia, pagtos pendentes, entregas, alertas
Fase 9: Gestão Financeira        →  Fotos extras, pagamento final, relatórios
Fase 10: Documentos & Encerramento →  Resumo WhatsApp, contrato, finalização
```

---

## Fase 1 — Fundação do Domínio

**Objetivo:** Alinhar tipos, schemas e constantes com o novo domínio antes de qualquer UI.

### Arquivos a Modificar

| Arquivo | Ação |
|---|---|
| `src/shared/constants/index.ts` | Substituir `SESSION_STATUS` por `AGENDAMENTO_STATUS` com: `CONFIRMADO`, `REALIZADO`, `AGUARDANDO_PAGAMENTO_FINAL`, `EM_EDICAO`, `FOTOS_ENVIADAS_PARA_SELECAO`, `FOTOS_ENTREGUES`, `FINALIZADO`, `CANCELADO`, `NO_SHOW` |
| `src/shared/constants/index.ts` | Adicionar `TAREFA_STATUS`: `PENDENTE`, `EM_ANDAMENTO`, `CONCLUIDA`, `ATRASADA` |
| `src/shared/constants/index.ts` | Adicionar `TAREFA_TIPO`: `EDITAR_FOTOS`, `ENVIAR_PARA_SELECAO`, `ENTREGA_FINAL` |
| `src/shared/constants/index.ts` | Adicionar `ORIGEM`: `INDICACAO`, `ANUNCIO`, `OUTROS` (mover de clientes) |
| `src/features/agenda/types/index.ts` | Expandir `Pacote`: adicionar `quantidadeFotos`, `quantidadeVideos`, `valorBase`, `bloqueiaDiaInteiro` |
| `src/features/agenda/types/index.ts` | Expandir `Agendamento`: todos os campos do novo domínio (ver seção abaixo) |
| `src/features/agenda/types/index.ts` | Nova interface `FotoExtra`: `id`, `agendamentoId`, `quantidade`, `valorUnitario`, `valorTotal`, `dataRegistro` |
| `src/features/agenda/types/index.ts` | Nova interface `Tarefa`: `id`, `agendamentoId`, `tipo`, `responsavelId`, `dataLimite`, `dataConclusao`, `status` |
| `src/features/agenda/types/index.ts` | Nova interface `Usuario`: `id`, `nome`, `email`, `papel` (para editor) |
| `src/features/agenda/schemas/agendamento.schema.ts` | Schema completo com 4 steps (ver Fase 3 para detalhes dos campos) |
| `src/features/agenda/services/agendamento.service.ts` | Adicionar: `getById`, `list`, `updateStatus`, `addFotoExtra`, `registrarPagamentoFinal` |
| `src/features/agenda/api/queries.ts` | Adicionar hooks: `useAgendamento`, `useAgendamentosList`, `useUpdateAgendamentoStatus`, `useAddFotoExtra`, `useRegistrarPagamentoFinal` |

### Campos do Agendamento (novo domínio)

```
id: string
clienteId: string
pacoteId: string
editorId: string | null

// Ensaio
dataHoraEnsaio: string
duracaoMinutos: number
localEnsaio: string
enderecoCompleto: string | null

// Financeiro
valorTotal: number
valorEntradaExigido: number
valorEntradaPago: number
valorRestante: number
valorExtras: number
taxaDeslocamento: number
valorTotalFinal: number

// Controle
status: AgendamentoStatus
dataConfirmacao: string | null
dataRealizacao: string | null
dataEnvioSelecao: string | null
dataEntregaFinal: string | null
dataFinalizacao: string | null

// Comprovantes
urlComprovanteEntrada: string | null
urlComprovanteFinal: string | null

// Contrato
autorizaUsoImagem: boolean
clausulasPersonalizadas: string | null
contratoGerado: boolean

// Flags
ensaioDestaque: boolean

// Observações
observacoes: string | null

createdAt: string
updatedAt: string
```

### Utility de Cálculo Financeiro

Criar `src/features/agenda/utils/financeiro.ts`:

```ts
export function calcularValores(pacote: { valorBase: number }, taxaDeslocamento = 0, extras: { valorTotal: number }[] = []) {
  const valorTotal = pacote.valorBase + taxaDeslocamento
  const valorEntradaExigido = valorTotal * 0.30
  const valorRestante = valorTotal - valorEntradaExigido
  const somaExtras = extras.reduce((acc, e) => acc + e.valorTotal, 0)
  const valorTotalFinal = valorTotal + somaExtras

  return { valorTotal, valorEntradaExigido, valorRestante, valorTotalFinal }
}
```

---

## Fase 2 — Pacotes & Configuração Financeira

**Objetivo:** Gerenciar pacotes e ter as bases de cálculo funcionando.

### Novas Rotas

| Rota | Página |
|---|---|
| `/pacotes` | `PacotesListPage` |
| `/pacotes/novo` | `PacoteFormPage` (create) |
| `/pacotes/:id/editar` | `PacoteFormPage` (edit) |

### Novos Arquivos

```
src/features/pacotes/
├── api/
│   └── queries.ts              # usePacotesList, usePacote, useCreatePacote, etc.
├── components/
│   ├── PacoteForm.tsx           # Formulário de pacote
│   └── PacoteList.tsx           # Tabela de pacotes
├── pages/
│   ├── PacotesListPage.tsx
│   └── PacoteFormPage.tsx
├── schemas/
│   └── pacote.schema.ts         # Zod schema
├── services/
│   └── pacote.service.ts        # API service
├── types/
│   └── index.ts
└── index.ts
```

### Pacote — Campos

| Campo | Tipo | Descrição |
|---|---|---|
| `nome` | string | Lembranças, Memórias, Herança, Exclusivo |
| `descricao` | string | Descrição do pacote |
| `quantidadeFotos` | number | Fotos incluídas |
| `quantidadeVideos` | number | Vídeos incluídos |
| `valorBase` | number | Valor base do pacote |
| `bloqueiaDiaInteiro` | boolean | Se true, bloqueia o dia todo na agenda |
| `duracaoEstimada` | string | Ex: "2h", "4h" |
| `ativo` | boolean | Se está disponível para novos agendamentos |

---

## Fase 3 — Novo Agendamento (Refit Completo)

**Objetivo:** Refatorar o Wizard atual (Prompt 4) para o novo domínio com 4 passos.

### Estrutura do Wizard

```
Passo 1: Cliente
  ├── Busca por telefone (se já existe, auto-preenche formulário)
  ├── Ou cria novo: nome, telefone, email, CPF, cidade/estado, origem
  └── Valida duplicidade por telefone

Passo 2: Ensaio
  ├── Pacote (select com valor, duração, bloqueiaDiaInteiro)
  ├── Data + Hora (calendário com validação de conflito)
  ├── Local do ensaio + endereço completo
  ├── Editor responsável (select de usuários)
  ├── Taxa de deslocamento (CurrencyInput)
  └── Autorização de uso de imagem (checkbox)

Passo 3: Financeiro (automático / review)
  ├── Resumo dos valores calculados:
  │   └── pacote.valorBase + taxaDeslocamento = valorTotal
  │   └── Entrada (30%): R$ X,00 ✓ (pago — comprovante anexado)
  │   └── Restante (70%): R$ X,00
  ├── Upload OBRIGATÓRIO do comprovante de entrada
  └── Observações (textarea)

Passo 4: Confirmação
  ├── Review completo de todos os dados (cards)
  ├── Checkbox "Declaro que as informações estão corretas"
  └── Botão "Confirmar Agendamento"
```

### Pós-Confirmação

- Toast de sucesso
- Botão "Copiar Resumo para WhatsApp" (texto formatado na clipboard)
- Botão "Ver Detalhes do Agendamento"
- Redirecionamento automático para `/agenda/:id` após 3 segundos

### Arquivos a Modificar

| Arquivo | Ação |
|---|---|
| `StepCliente.tsx` | Adicionar busca por telefone, CPF, cidade/estado, origem |
| `StepEnsaio.tsx` | Adicionar local, endereço, editor, taxa deslocamento, autorização imagem |
| `StepConfirmacao.tsx` | Renomear/refatorar para passo financeiro com resumo automático |
| `NovoAgendamentoWizard.tsx` | 4 steps, comprovante obrigatório, pós-confirmação |
| `agendamento.service.ts` | Payload completo com clienteId, editorId, local, etc. |
| `agendamento.schema.ts` | Schema com 4 steps |

---

## Fase 4 — Detalhes do Agendamento

**Objetivo:** Tela central de operação com abas contextuais.

**Rota:** `/agenda/:id`

### Abas

| Aba | Conteúdo |
|---|---|
| **Resumo** | 3 cards lado a lado: Dados do Cliente, Dados do Ensaio, Resumo Financeiro |
| **Linha do Tempo** | Timeline vertical com eventos: criação, mudanças de status, tarefas concluídas |
| **Financeiro** | Tabela detalhada: pacote, deslocamento, extras, entrada (30%), restante (70%). Botões: "Registrar Pagamento Final", "Adicionar Fotos Extras" |
| **Tarefas** | Lista de tarefas do editor com prazos, status (PENDENTE/CONCLUIDA/ATRASADA) |
| **Contrato** | Preview inline, botão "Copiar Resumo WhatsApp", cláusulas personalizadas (textarea) |

### Ações Contextuais (header, variam por status)

| Status Atual | Botões |
|---|---|
| `CONFIRMADO` | Realizar Ensaio, Reagendar, Cancelar |
| `REALIZADO` | Aguardar Pagamento, Registrar Pagamento Final (se pago na hora) |
| `AGUARDANDO_PAGAMENTO_FINAL` | Registrar Pagamento Final |
| `EM_EDICAO` | Enviar para Seleção |
| `FOTOS_ENVIADAS_PARA_SELECAO` | Confirmar Entrega |
| `FOTOS_ENTREGUES` | Finalizar |
| Qualquer | Adicionar Observação, Marcar/Desmarcar Destaque |

### Novos Arquivos

```
src/features/agenda/pages/AgendamentoDetalhesPage.tsx
src/features/agenda/components/
├── AgendamentoResumo.tsx
├── AgendamentoTimeline.tsx
├── AgendamentoFinanceiro.tsx
├── AgendamentoTarefas.tsx
├── AgendamentoContrato.tsx
├── AgendamentoActions.tsx
├── RegistrarPagamentoDialog.tsx
├── AdicionarExtrasDialog.tsx
└── ReagendarDialog.tsx
```

---

## Fase 5 — Agenda (Calendário)

**Objetivo:** Visão visual dos ensaios no calendário.

**Rota:** `/agenda` (página principal da agenda)

### Componentes

| Componente | Descrição |
|---|---|
| `AgendaPage.tsx` | Página principal com toggle calendário/lista |
| `AgendaCalendar.tsx` | Calendário full (mês/semana/dia) usando react-day-picker |
| `AgendaCalendarEvent.tsx` | Card do evento dentro do calendário |

### Funcionalidades

- Toggle visualização: **Mês** | **Semana** | **Dia**
- Cores por status:
  - CONFIRMADO → verde
  - REALIZADO → azul
  - AGUARDANDO_PAGAMENTO_FINAL → amarelo
  - EM_EDICAO → laranja
  - FOTOS_ENVIADAS_PARA_SELECAO → roxo
  - FOTOS_ENTREGUES → verde claro
  - FINALIZADO → cinza
  - CANCELADO → vermelho
- Filtros: por status, por editor, por pacote
- Clique no evento → navega para `/agenda/:id`
- Badge "Destaque" para ensaios com `ensaioDestaque = true`
- Loading state com skeleton

### Calendário com Eventos

O `react-day-picker` v9 permite customizar o conteúdo de cada dia via `components` prop. Usaremos `DayButton` customizado para renderizar indicadores de evento.

---

## Fase 6 — Lista de Agendamentos

**Objetivo:** Tabela completa com filtros e busca.

**Integração:** Parte da mesma página `/agenda` com toggle ou sub-rota `/agenda/lista`.

### Componentes

| Componente | Descrição |
|---|---|
| `AgendamentoList.tsx` | Tabela usando `DataTable` compartilhado |

### Colunas

| Coluna | Fonte |
|---|---|
| Data/Hora | `dataHoraEnsaio` |
| Cliente | `cliente.nome` (relação) |
| Pacote | `pacote.nome` |
| Local | `localEnsaio` |
| Status | `StatusBadge` com cores |
| Valor Total | `valorTotalFinal` formatado |
| Pago | `valorEntradaPago + valorRestante pago` |
| Editor | `editor.nome` |
| Ações | Ver detalhes, Editar |

### Filtros

- Período (DateRangePicker)
- Status (multi-select)
- Editor (select)
- Cliente (busca textual por nome/telefone)

---

## Fase 7 — Gestão de Tarefas & Editor

**Objetivo:** Workflow de pós-produção com prazos automáticos.

### Regras de Negócio

| Gatilho | Ação |
|---|---|
| Status → `REALIZADO` | Criar tarefa `EDITAR_FOTOS` com `dataLimite = dataRealizacao + 2 dias` |
| Status → `FOTOS_ENVIADAS_PARA_SELECAO` | Criar tarefa `ENTREGA_FINAL` com `dataLimite = dataEnvioSelecao + 2 dias` |
| Tarefa com `dataLimite < now && status != CONCLUIDA` | Marcar como `ATRASADA`, exibir alerta no dashboard |

### Componentes

| Componente | Local |
|---|---|
| `TarefasList.tsx` | `agenda/components/` (reutilizado nos detalhes) |
| `MinhasTarefasPage.tsx` | Futuro: visão do editor |

---

## Fase 8 — Dashboard Operacional

**Objetivo:** Visão do dia a dia do operador.

**Rota:** `/` (página inicial)

### Seções

1. **Agenda do Dia**
   - Cards dos ensaios de hoje (até 5 itens)
   - Link "Ver agenda completa" → `/agenda`

2. **Pagamentos Pendentes**
   - Lista de agendamentos em `AGUARDANDO_PAGAMENTO_FINAL`
   - Botão "Registrar Pagamento" em cada item

3. **Entregas Pendentes**
   - Agendamentos em `EM_EDICAO` ou `FOTOS_ENVIADAS_PARA_SELECAO`
   - Mostrar dias restantes até o prazo

4. **Alertas**
   - Tarefas atrasadas
   - Ensaios de amanhã (se houver)

### Novos Arquivos

```
src/features/dashboard/
├── pages/
│   └── DashboardPage.tsx
├── components/
│   ├── AgendaDoDia.tsx
│   ├── PagamentosPendentes.tsx
│   ├── EntregasPendentes.tsx
│   └── Alertas.tsx
└── index.ts
```

---

## Fase 9 — Gestão Financeira

**Objetivo:** Controle financeiro e relatórios.

**Rotas:**
- `/financeiro` — Dashboard financeiro
- `/financeiro/relatorios` — Relatórios por período

### Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| Resumo Financeiro | Cards: Total de entradas (30%), total de pagamentos finais (70%), total de extras, faturamento total |
| Tabela de Agendamentos | Filtrada por período, com valores |
| Relatórios | Por período exportável |

### Diálogos/Modais

| Modal | Uso |
|---|---|
| `RegistrarPagamentoFinalDialog` | Registrar pagamento dos 70%, anexar comprovante |
| `AdicionarFotoExtraDialog` | Qtd fotos extras, valor calculado automático (R$ 15,00 cada) |

### Novos Arquivos

```
src/features/financeiro/
├── pages/
│   ├── FinanceiroDashboardPage.tsx
│   └── RelatoriosPage.tsx
├── components/
│   ├── FinanceiroResumo.tsx
│   ├── FinanceiroTabela.tsx
│   └── FiltroPeriodo.tsx
└── index.ts
```

---

## Fase 10 — Documentos & Encerramento

**Objetivo:** Geração de documentos e finalização do ciclo.

### Funcionalidades

1. **Resumo para WhatsApp**
   ```
   📸 *RESUMO DO AGENDAMENTO*
   Cliente: Maria Silva
   Data: 15/07/2026 às 14:00
   Local: Parque Ibirapuera
   Pacote: Memórias - R$ 500,00
   
   💰 *Financeiro*
   Entrada (30%): R$ 150,00 ✓ Pago
   Restante (70%): R$ 350,00
   Total: R$ 500,00
   
   📋 *Status:* CONFIRMADO
   ```
   - Botão "Copiar" em cada tela relevante (confirmação, detalhes)
   - Usa `navigator.clipboard.writeText()`

2. **Contrato**
   - Preview inline na aba Contrato dos detalhes
   - Botão "Abrir PDF" (URL do backend)
   - Campo para cláusulas personalizadas

3. **Recibo de Pagamento**
   - Botão "Gerar Recibo" após pagamento final
   - Texto formatado para WhatsApp

---

## 12. Mapa de Rotas Final

```
/                                      → Dashboard (Fase 8)
/clientes                              → Lista de Clientes (pronto)
/clientes/novo                          → Novo Cliente (pronto)
/clientes/:id/editar                    → Editar Cliente (pronto)
/agenda                                → Calendário + Lista (Fase 5-6)
/agenda/novo                           → Wizard Novo Agendamento (Fase 3)
/agenda/:id                            → Detalhes do Agendamento (Fase 4)
/pacotes                               → Lista de Pacotes (Fase 2)
/pacotes/novo                          → Novo Pacote (Fase 2)
/pacotes/:id/editar                    → Editar Pacote (Fase 2)
/financeiro                            → Dashboard Financeiro (Fase 9)
/financeiro/relatorios                 → Relatórios (Fase 9)
```

---

## 13. Shared Components a Criar

| Componente | Arquivo | Motivo |
|---|---|---|
| `Tabs` | `src/shared/components/ui/tabs.tsx` | Abas na tela de detalhes (Radix Tabs) |
| `Checkbox` | `src/shared/components/ui/checkbox.tsx` | Checkbox para autorização de imagem, termos (Radix Checkbox) |
| `Textarea` | `src/shared/components/ui/textarea.tsx` | Textarea padronizado (atualmente inline) |
| `Avatar` | `src/shared/components/ui/avatar.tsx` | Avatar do editor/cliente (Radix Avatar) |
| `Tooltip` | `src/shared/components/ui/tooltip.tsx` | Tooltips para ações e status (Radix Tooltip) |
| `DropdownMenu` | `src/shared/components/ui/dropdown-menu.tsx` | Menu de ações nos cards do dashboard |
| `Timeline` | `src/shared/components/layout/Timeline.tsx` | Timeline vertical |

---

## 14. Ordem Recomendada

```
Fase 1 → Fase 2 → Fase 3 → Fase 4 → Fase 5+6 → Fase 7 → Fase 8 → Fase 9 → Fase 10
```

**Justificativa:**

| Fase | Depende de | Valor de Negócio |
|---|---|---|
| Fase 1 | Nada (base) | Nenhum (infraestrutura) |
| Fase 2 | Fase 1 | Baixo (configuração) |
| Fase 3 | Fase 1, Fase 2 | **Alto** (operador precisa criar agendamentos) |
| Fase 4 | Fase 3 | **Alto** (operações do dia-a-dia) |
| Fase 5+6 | Fase 3, Fase 4 | **Médio** (navegação e consulta) |
| Fase 7 | Fase 3, Fase 4 | Médio (pós-produção) |
| Fase 8 | Fase 3, Fase 4, Fase 7 | **Alto** (visão consolidada) |
| Fase 9 | Fase 3, Fase 4 | Baixo-Médio (controle financeiro) |
| Fase 10 | Fase 3, Fase 4 | Médio (documentação) |

---

> **Status**: ⬜ Não iniciado | 🔄 Em andamento | ✅ Concluído
