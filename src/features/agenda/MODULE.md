# Módulo: Agenda

## 1. Responsabilidade
Gerencia o ciclo de vida completo de ensaios fotográficos (agendamentos) e tarefas de pós-produção. É o módulo central do CRM — conecta clientes, pacotes, financeiro, edição e e-commerce através de transições de status.

## 2. Estrutura Interna
```
features/agenda/
├── index.ts                          # Barrel: exporta as 5 páginas
├── types/index.ts                    # Interfaces: Agendamento, Pacote, Pagamento, FotoExtra, VideoExtra, Tarefa, Usuario
├── schemas/agendamento.schema.ts     # Zod schemas: wizardFormSchema (5 steps), editarAgendamentoSchema
├── services/agendamento.service.ts   # Camada HTTP: 18 métodos (CRUD + status + extras + tarefas)
├── api/queries.ts                    # React Query hooks: 18 hooks
├── utils/recibo.ts                   # Helper para gerar texto de recibo de pagamento
├── pages/
│   ├── AgendaPage.tsx                # Tela principal: calendário/lista + filtros
│   ├── NovoAgendamentoPage.tsx       # Wrapper do wizard (recebe ?data= da URL)
│   ├── AgendamentoDetalhesPage.tsx   # Tabs: Resumo, Timeline, Financeiro, Tarefas, Contrato, Ecommerce
│   ├── EditarAgendamentoPage.tsx     # Formulário de edição
│   └── MinhasTarefasPage.tsx         # Lista de tarefas com filtro e ações
├── components/
│   ├── NovoAgendamentoWizard.tsx     # Wizard 5-passos (Cliente > Ensaio > Indicação > Financeiro > Confirmação)
│   ├── StepCliente.tsx               # Step 1: dados do cliente (telefone busca cliente existente)
│   ├── StepEnsaio.tsx                # Step 2: pacote, data/hora, local, editor, taxa
│   ├── StepIndicacao.tsx             # Step 3: dados do indicador (opcional)
│   ├── StepFinanceiro.tsx            # Step 4: comprovante de entrada
│   ├── StepConfirmacao.tsx           # Step 5: revisão e confirmação
│   ├── AgendaCalendar.tsx            # Calendário mensal/semanal com eventos
│   ├── AgendaCalendarEvent.tsx       # Card de evento no calendário
│   ├── AgendamentoList.tsx           # Tabela de agendamentos (TanStack Table)
│   ├── AgendamentoActions.tsx        # Botões de ação contextual por status (máquina de estados)
│   ├── AgendamentoResumo.tsx         # Card de resumo do agendamento
│   ├── AgendamentoTimeline.tsx       # Linha do tempo com eventos + tarefas
│   ├── AgendamentoFinanceiro.tsx     # Tabela financeira + diálogos de pagamento/extras
│   ├── AgendamentoTarefas.tsx        # Lista de tarefas com edição/exclusão
│   ├── AgendamentoContrato.tsx       # Visualização do contrato
│   ├── EditarAgendamentoForm.tsx     # Formulário de edição inline
│   ├── EditarClienteDialog.tsx       # Diálogo para editar dados do cliente no agendamento
│   ├── ReagendarDialog.tsx           # Diálogo de reagendamento
│   ├── RegistrarPagamentoDialog.tsx  # Diálogo de pagamento final
│   └── AdicionarExtrasDialog.tsx     # Diálogo para adicionar fotos/vídeos extras
```

## 3. Dependências Externas

### Bibliotecas
- `@tanstack/react-query` — hooks useQuery/useMutation
- `react-hook-form` + `@hookform/resolvers` + `zod` — formulários e validação
- `react-router-dom` — navegação e parâmetros de URL
- `date-fns` + `date-fns/locale` — formatação de datas (locale ptBR)
- `sonner` — toasts
- `lucide-react` — ícones
- `axios` (via `@/shared/api`) — requisições HTTP

### Módulos internos (shared)
- `@/shared/constants` — `AGENDAMENTO_STATUS`, `TAREFA_STATUS`, `TAREFA_TIPO`, `ROUTES`, `QUERY_KEYS`
- `@/shared/api` — `apiClient`
- `@/shared/lib/cn` — merge de classes Tailwind
- `@/shared/components/ui/*` — button, input, select, badge, dialog, label, tabs
- `@/shared/components/layout/*` — PageTitle, PageLoading, EmptyState, StatusBadge, DateRangePicker, ConfirmDialog, CurrencyInput, DataTable
- `@/shared/hooks/useDebounce` — debounce para busca

### Outras features (⚠️ violação da regra de isolamento)
- `@/features/clientes/types` — `Cliente` (em `agendamento.service.ts:6`)
- `@/features/ecommerce/components/EcommerceAdminResumo` (em `AgendamentoDetalhesPage.tsx:16`)

## 4. Fluxos Principais

### Fluxo 1: Criação de Agendamento (Wizard 5 passos)
1. **Step 1 - Cliente**: Usuário digita telefone → `useBuscarClientePorTelefone()` busca cliente existente (trigger em 14+ dígitos). Se encontrado, preenche dados automaticamente.
2. **Step 2 - Ensaio**: Seleciona pacote → `useFinanceiroPreview()` calcula valores (entrada, restante, total). Define data, hora, local, editor opcional.
3. **Step 3 - Indicação**: Dados do indicador (opcional, para comissão).
4. **Step 4 - Financeiro**: Anexa comprovante de entrada (File, obrigatório).
5. **Step 5 - Confirmação**: Revisão + checkbox de confirmação.
6. Submissão: `useCreateAgendamento()` → `agendamentoService.createFromWizard()` envia `FormData` via `POST /agendamentos`.
7. Sucesso: tela de sucesso com botão "Copiar Resumo WhatsApp" + redirect automático para detalhes.

### Fluxo 2: Ciclo de Vida do Agendamento (Status Machine)
Ações disponíveis por status (mapeamento em `statusActions`):
```
CONFIRMADO             → realizar, reagendar, cancelar
REALIZADO              → pagarFinal, cancelar
AGUARDANDO_PAGAMENTO   → pagarFinal
EM_EDICAO              → enviarSelecao
FOTOS_ENVIADAS_SELECAO → confirmarEntrega
FOTOS_ENTREGUES        → finalizar
```
- `realizar` → `PATCH /agendamentos/:id/status` para `AGUARDANDO_PAGAMENTO_FINAL`
- `reagendar` → abre `ReagendarDialog` → `PATCH /agendamentos/:id/reagendar`
- `pagarFinal` → abre `RegistrarPagamentoDialog` → `POST /agendamentos/:id/pagamento-final` (multipart com comprovante)
- `enviarSelecao` → atualiza status + **cria automaticamente** `Tarefa` do tipo `ENTREGA_FINAL` com prazo de 2 dias para o editor
- `cancelar`/`noShow` → `PATCH /agendamentos/:id/status`

### Fluxo 3: Gerenciamento de Tarefas
- Listagem em `MinhasTarefasPage` (todas) ou `AgendamentoTarefas` (por agendamento).
- Ordenação: atrasadas primeiro, depois pendentes.
- Ações: iniciar (PENDENTE → EM_ANDAMENTO), concluir (→ CONCLUIDA), editar (tipo, responsável, dataLimite), excluir.
- Tarefas com dataLimite passada são marcadas visualmente como atrasadas mesmo se status for PENDENTE.

## 5. Regras Específicas
1. **Wizard com validação parcial**: Cada step valida apenas seus campos via `form.trigger(STEP_FIELDS[index])`. Steps 3 e 4 não validam campos do form — validação manual (comprovante obrigatório, confirmado boolean).
2. **Criação usa FormData**: `createFromWizard()` constrói `FormData` manualmente. Datas formatadas com `date-fns` para `yyyy-MM-dd`. Comprovante anexado como `comprovanteEntrada`.
3. **Busca de cliente por telefone**: Acionada quando telefone atinge 14+ caracteres. Usa `useDebounce(300ms)` no `AgendaPage`, chamada direta no `StepCliente`.
4. **Ações contextuais**: `statusActions` define botões por status. `actionConfig` mapeia label, ícone, variante, título de confirmação e status alvo. Ações que abrem diálogo (reagendar, pagarFinal) vs `ConfirmDialog` (as demais).
5. **Criação automática de tarefas**: Ao avançar de `EM_EDICAO` para `FOTOS_ENVIADAS_PARA_SELECAO`, tarefa `ENTREGA_FINAL` é criada com prazo de 2 dias.
6. **Enums compartilhados**: `AGENDAMENTO_STATUS`, `TAREFA_STATUS`, `TAREFA_TIPO` em `shared/constants`. Interfaces em `types/` importam de lá.
7. **recibo.ts**: Utilitário de texto puro para recibo formatado. Contém emoji no output.

## 6. Testes
Não existem testes para este módulo.

## 7. Pontos de Atenção
- **Violação de arquitetura**: O módulo importa `Cliente` de `@/features/clientes/types` e `EcommerceAdminResumo` de `@/features/ecommerce/components`. Isso quebra a regra de isolamento de features — esses tipos/components deveriam estar em `shared/`.
- **`zodResolver` com `as any`**: `NovoAgendamentoWizard.tsx:92` faz cast com `as any` no resolver. O schema composto via spread pode causar incompatibilidade de tipos.
- **`STEP_FIELDS` por índice numérico**: Mapeia steps (0-4) a campos. Se a ordem dos steps mudar, o mapeamento quebra silenciosamente.
- **`statusActions` vs `actionConfig`**: Duas estruturas separadas. Se uma ação for adicionada em apenas uma delas, não aparece ou quebra.
- **FormData sem Content-Type explícito**: Funciona porque Axios detecta `multipart/form-data` automaticamente, mas não é óbvio.
- **recibo.ts com emoji**: `🧾`, `💰`, `✅`, `📸` no output podem causar problemas de encoding em alguns terminais.
- **`useAgendamentosList` sem staleTime**: Diferente de outras queries do módulo (que usam `staleTime: 5min`), a listagem usa o default (0), refetch a cada montagem.
- **Navegação com `ROUTES`**: Rotas usam placeholders `:id` resolvidos com `.replace(':id', valor)`. Sempre usar `ROUTES` em vez de strings hardcoded.
