# Módulo: Financeiro

## 1. Responsabilidade
Exibe relatórios financeiros do estúdio — resumo de entradas, despesas, saldo líquido e tabela detalhada de agendamentos com valores. Apenas leitura (sem mutações).

## 2. Estrutura Interna
```
features/financeiro/
├── index.ts                          # Barrel: FinanceiroDashboardPage, RelatoriosPage
├── api/queries.ts                    # 2 hooks: useFinanceiroResumo, useFinanceiroRelatorios
├── services/financeiro.service.ts    # HTTP: resumo, relatorios + interfaces FinanceiroResumo, RelatoriosTotais, FinanceiroRelatorios
├── components/
│   ├── FiltroPeriodo.tsx            # Wrapper do DateRangePicker
│   ├── FinanceiroResumo.tsx         # Grid de 7 cards de métricas
│   └── FinanceiroTabela.tsx         # Tabela de agendamentos com colunas financeiras
└── pages/
    ├── FinanceiroDashboardPage.tsx   # Dashboard financeiro com filtro e tabela
    └── RelatoriosPage.tsx            # Relatórios com exportação CSV
```

## 3. Dependências Externas

### Bibliotecas
- `@tanstack/react-query` — hooks useQuery
- `date-fns` + `date-fns/locale` — formatação de datas
- `react-router-dom` — navegação
- `lucide-react` — ícones
- `axios` (via `@/shared/api`) — requisições HTTP

### Módulos internos (shared)
- `@/shared/api` — `apiClient`
- `@/shared/constants` — `QUERY_KEYS`, `ROUTES`, `AGENDAMENTO_STATUS`
- `@/shared/components/layout/*` — PageTitle, DateRangePicker
- `@/shared/components/ui/*` — button, badge, table

### Outras features (⚠️ violação da regra de isolamento)
- `@/features/agenda/types` — `Agendamento` (service, FinanceiroTabela, RelatoriosPage)
- `@/features/agenda/api/queries` — `useAgendamentosList` (FinanceiroDashboardPage)

## 4. Fluxos Principais

### Fluxo 1: Dashboard Financeiro
1. `FinanceiroDashboardPage` carrega resumo via `useFinanceiroResumo(dataInicio, dataFim)`.
2. Carrega agendamentos via `useAgendamentosList()` (da agenda) para exibir na tabela.
3. Filtra client-side: remove CANCELADO e NO_SHOW.
4. `FinanceiroResumo` exibe 7 cards: Entradas, Pagamentos Finais, Extras, Faturamento, Despesas (deslocamento/comissão), Saldo Líquido.
5. `FinanceiroTabela` exibe agendamentos com colunas: Data, Cliente, Local, Status, Valor Total, Entrada, Restante, Extras, Total Final.
6. Linhas clicáveis navegam para `/agenda/:id`.

### Fluxo 2: Relatórios com CSV
1. `RelatoriosPage` carrega `useFinanceiroRelatorios(dataInicio, dataFim)`.
2. Exibe cards de totais + tabela de agendamentos.
3. Botão de exportação gera CSV client-side via `gerarCSV()` + `exportarCSV()` (blob download).

## 5. Regras Específicas
1. **Apenas leitura**: Não há mutações — todas as operações são queries `useQuery`.
2. **StaleTime de 2 minutos**: `useFinanceiroResumo` tem `staleTime: 2min` para evitar refetch excessivo. `useFinanceiroRelatorios` usa o default (0).
3. **Filtragem cliente-side**: O dashboard filtra agendamentos cancelados/no-show no frontend após receber a lista completa da agenda.
4. **CSV export client-side**: A geração de CSV é feita inteiramente no frontend — não há endpoint de exportação.
5. **`despesasManuais` não exibida**: O campo `despesasManuais` existe na interface `FinanceiroResumo` mas não é renderizado em nenhum card.

## 6. Testes
Não existem testes para este módulo.

## 7. Pontos de Atenção
- **Violações de isolamento**: Importa `Agendamento` de `@/features/agenda/types` (3 arquivos) e `useAgendamentosList` de `@/features/agenda/api/queries` (1 arquivo). O tipo `Agendamento` deveria estar em `shared/types/`.
- **`FinanceiroDashboardPage` duplica fetching**: Busca agendamentos via `useAgendamentosList()` da agenda mesmo quando `useFinanceiroRelatorios()` já retorna agendamentos. Isso sugere que os dados podem divergir ou que a query de relatórios não retorna todos os campos necessários.
- **`RelatoriosPage` usa `<table>` HTML puro**: Em vez do componente `Table` do shared, usa `<table>` nativo — inconsistência de UI.
- **Breadcrumb hardcoded**: `RelatoriosPage` usa string `'/financeiro'` em vez da constante `ROUTES.FINANCEIRO`.
- **`types/` e `schemas/` ausentes**: Tipos co-localizados no service, sem Zod schemas.
