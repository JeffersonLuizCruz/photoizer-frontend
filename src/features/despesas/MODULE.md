# Módulo: Despesas

## 1. Responsabilidade
Gerencia o registro de despesas manuais do estúdio (manutenção, compras). É um módulo minimalista — serve apenas como fornecedor de um diálogo reutilizável para outras features (dashboard).

## 2. Estrutura Interna
```
features/despesas/
├── components/
│   └── AdicionarDespesaDialog.tsx    # Diálogo para registrar despesa manual
├── services/
│   └── despesa.service.ts            # HTTP: listar, criar, atualizar, remover
└── types/
    └── despesa.types.ts              # DespesaRequest, DespesaResponse
```

## 3. Dependências Externas

### Bibliotecas
- `@tanstack/react-query` — useMutation (inline)
- `sonner` — toasts
- `axios` (via `@/shared/api`) — requisições HTTP

### Módulos internos (shared)
- `@/shared/api` — `apiClient`
- `@/shared/components/ui/*` — button, input, label, select
- `@/shared/components/ui/dialog` — Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter

### Outras features
Nenhuma importação direta. Porém, a mutation invalida query keys de outras features:
- `['despesas']` — própria feature
- `['dashboard']` — feature dashboard
- `['financeiro']` — feature financeiro

## 4. Fluxos Principais

### Fluxo 1: Registro de Despesa
1. `AdicionarDespesaDialog` é aberto por componente pai (ex: `GraficoMensal` do dashboard).
2. Formulário manual (sem react-hook-form): descrição, valor, categoria (MANUTENCAO/COMPRA), data, observação.
3. Submit → `despesaService.criar()` → invalida 3 query keys → toast → fecha diálogo.

## 5. Regras Específicas
1. **Sem `index.ts`**: Não há barrel file — o componente é importado diretamente pelo caminho completo.
2. **Sem `api/queries.ts`**: Mutation inline no componente.
3. **Sem `pages/`**: Não tem rota própria — é apenas um diálogo embutido em outras features.
4. **Validação inline**: Verifica manualmente `descricao`, `valor > 0` e `data` antes de submit.
5. **Invalidação cruzada**: Conhece e invalida query keys de outras features (`dashboard`, `financeiro`) — acoplamento implícito.

## 6. Testes
Não existem testes para este módulo.

## 7. Pontos de Atenção
- **Módulo incompleto**: Apenas 3 arquivos, sem barrel, sem queries centralizadas, sem páginas. Parece ser um módulo iniciado e não finalizado.
- **Sem `index.ts`**: Foge da convenção do projeto. Features devem expor barrel.
- **Sem `schemas/`**: Validação manual em vez de Zod + react-hook-form.
- **Invalidação de queries alheias**: A string `['dashboard']` e `['financeiro']` são hardcoded — se essas features mudarem suas query keys, a invalidação silenciosamente para de funcionar.
- **Categoria limitada**: Apenas `MANUTENCAO` e `COMPRA` — se o backend aceitar outras, o select está desatualizado.
