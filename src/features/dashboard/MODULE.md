# Módulo: Dashboard

## 1. Responsabilidade
Tela inicial do sistema administrativo. Agrega dados de múltiplos módulos (agenda, financeiro, e-commerce, despesas) em cards de resumo, alertas e gráficos mensais.

## 2. Estrutura Interna
```
features/dashboard/
├── index.ts                          # Barrel: DashboardPage, DashboardDetalhesPage
├── api/queries.ts                    # 3 hooks: useFinanceiroMensal, useDashboardEcommerce, useDashboardEcommerceMensal
├── services/dashboard.service.ts     # HTTP: financeiroMensal, ecommerce, ecommerceMensal + interfaces de resposta
├── pages/
│   ├── DashboardPage.tsx             # Visão geral com cards, alertas, gráficos
│   └── DashboardDetalhesPage.tsx     # Detalhamento (pagamentos pendentes + alertas)
└── components/
    ├── AgendaDoDia.tsx               # Card: ensaios de hoje
    ├── Alertas.tsx                   # Banner compacto de alertas
    ├── DashboardDetalhesAlertas.tsx   # Tabela detalhada de alertas
    ├── DashboardDetalhesPagamentos.tsx # Tabela detalhada de pagamentos pendentes
    ├── EcommerceDashboardCards.tsx    # Resumo e-commerce (4 cards)
    ├── EntregasPendentes.tsx         # Card: entregas pendentes
    ├── GraficoMensal.tsx             # Gráfico financeiro mensal (Recharts)
    ├── GraficoVendasExtras.tsx       # Gráfico vendas extras (Recharts)
    └── PagamentosPendentes.tsx       # Card: pagamentos pendentes
```

## 3. Dependências Externas

### Bibliotecas
- `@tanstack/react-query` — hooks useQuery/useMutation
- `recharts` — gráficos (ComposedChart, BarChart, etc.)
- `date-fns` + `date-fns/locale` — formatação de datas
- `react-router-dom` — navegação
- `lucide-react` — ícones
- `axios` (via `@/shared/api`) — requisições HTTP

### Módulos internos (shared)
- `@/shared/api` — `apiClient`
- `@/shared/constants` — `QUERY_KEYS`, `ROUTES`, `AGENDAMENTO_STATUS`
- `@/shared/components/layout/PageTitle` — título de página
- `@/shared/components/ui/*` — button, input, tabs

### Outras features (⚠️ violação da regra de isolamento)
- `@/features/agenda/api/queries` — `useAgendamentosList`, `useTarefasList`
- `@/features/agenda/types` — `Agendamento`, `Tarefa`
- `@/features/agenda/components/RegistrarPagamentoDialog` — diálogo de pagamento
- `@/features/despesas/components/AdicionarDespesaDialog` — diálogo de despesa

## 4. Fluxos Principais

### Fluxo 1: Dashboard Principal
1. `DashboardPage` carrega agendamentos e tarefas via hooks da agenda.
2. Deriva 5 listas memoizadas: `agendaHoje`, `pagamentosPendentes`, `entregasPendentes`, `tarefasAtrasadas`, `ensaiosAmanha`.
3. Renderiza grid 2x2 de cards + gráficos mensais + e-commerce.
4. Cards clicáveis navegam para `DashboardDetalhesPage`.

### Fluxo 2: Dashboard de Detalhes
1. `DashboardDetalhesPage` com abas: "Pagamentos Pendentes" e "Alertas".
2. Pagamentos: tabela com search e diálogo de registro de pagamento.
3. Alertas: tabela de tarefas atrasadas + ensaios de amanhã.

### Fluxo 3: Gráficos
- `GraficoMensal`: ComposedChart (barras + linha) com toggle de período e cards de métricas. Usa `useFinanceiroMensal()`.
- `GraficoVendasExtras`: BarChart de vendas e-commerce 6 meses. Usa `useDashboardEcommerceMensal()`.

## 5. Regras Específicas
1. **StaleTime de 2 minutos**: As queries do dashboard têm `staleTime: 2min` para evitar refetch excessivo.
2. **Integração com agenda**: O dashboard é o maior "orquestrador" — importa hooks, tipos e componentes diretamente da agenda e despesas.
3. **Cálculos local-side**: `pagamentosPendentes` e `entregasPendentes` são filtrados client-side a partir da lista completa de agendamentos.

## 6. Testes
Não existem testes para este módulo.

## 7. Pontos de Atenção
- **Violação massiva de isolamento**: O dashboard importa de 2 outras features (agenda, despesas). É o módulo com mais violações do frontend. Idealmente, esses dados deveriam vir de um backend que já retorna o dashboard montado, ou via props injetadas por um layout superior.
- **`useAgendamentosList` sem `staleTime`**: Diferente das queries próprias do dashboard (que têm 2min), a query da agenda usa staleTime default (0), causando refetch a cada montagem do dashboard.
- **`EcommerceDashboardCards` autônomo**: Faz suas próprias queries (`useDashboardEcommerce`) sem receber props — significa que o dado é buscado de forma independente do estado da página.
- **`GraficoMensal` integra `AdicionarDespesaDialog`**: O diálogo de despesas é importado diretamente de `@/features/despesas/components`, violando isolamento.
- **Tipos co-localizados no service**: `DashboardMensalResponse`, `DashboardEcommerceResponse`, etc. estão em `services/dashboard.service.ts` em vez de `types/index.ts`.
