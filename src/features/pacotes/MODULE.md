# Módulo: Pacotes

## 1. Responsabilidade
Gerencia os pacotes de ensaio fotográfico — CRUD completo com definição de fotos, vídeos, valor, duração, fotógrafo/editor responsável e prazos de entrega.

## 2. Estrutura Interna
```
features/pacotes/
├── index.ts                          # Barrel: PacotesListPage, PacoteFormPage
├── types/
│   ├── index.ts                      # Pacote, UsuarioRef
│   └── pacotes.types.ts              # PacoteResponse (não utilizado — dead code?)
├── schemas/pacote.schema.ts          # Zod schema: pacoteSchema → PacoteFormData
├── services/pacote.service.ts        # HTTP: listUsuarios, list, getById, create, update, delete
├── api/queries.ts                    # 6 hooks: 3 queries + 3 mutations (5min staleTime)
├── components/
│   ├── PacoteForm.tsx                # Formulário RHF + Zod (create/edit)
│   └── PacoteList.tsx                # DataTable com colunas, status e ações
└── pages/
    ├── PacotesListPage.tsx           # Lista com search, delete, "Novo Pacote"
    └── PacoteFormPage.tsx            # Create/Edit (via :id na URL)
```

## 3. Dependências Externas

### Bibliotecas
- `@tanstack/react-query` — hooks useQuery/useMutation
- `@tanstack/react-table` — ColumnDef (type only)
- `react-hook-form` + `@hookform/resolvers` + `zod` — formulários e validação
- `react-router-dom` — navegação
- `lucide-react` — ícones
- `sonner` — toasts
- `axios` (via `@/shared/api`) — requisições HTTP

### Módulos internos (shared)
- `@/shared/api` — `apiClient`
- `@/shared/constants` — `ROUTES`, `QUERY_KEYS`
- `@/shared/components/layout/*` — PageTitle, PageLoading, ConfirmDialog, DataTable, StatusBadge
- `@/shared/components/ui/*` — button, input, label, select

### Outras features
Nenhuma — módulo 100% isolado.

## 4. Fluxos Principais

### Fluxo 1: Listagem de Pacotes
1. `PacotesListPage` carrega pacotes via `usePacotesList()`.
2. Search client-side por nome/descrição (case-insensitive).
3. `PacoteList` usa DataTable com colunas: Nome, Fotos, Vídeos, Valor Base, Duração, Fotógrafo, Editor, Prazo, Status (Ativo/Inativo).
4. Ações: editar, excluir (com `ConfirmDialog`).

### Fluxo 2: Criação/Edição
1. `PacoteFormPage` detecta modo via `:id` na URL.
2. Modo edição: `usePacote(id)` → mapeia para `defaultValues`.
3. `PacoteForm` com `react-hook-form` + `zodResolver(pacoteSchema)`.
4. Campos: Nome, Descrição, Qtde Fotos, Qtde Vídeos, Valor Base, Bloqueia Dia Inteiro, Duração, Ativo, Fotógrafo (select via `useUsuariosList`), Editor (select), Dias para Entrega.
5. Submit → `useCreatePacote()` ou `useUpdatePacote(id)` → invalida `['pacotes']` → toast → navega para listagem.

## 5. Regras Específicas
1. **5 minutos staleTime**: `usePacotesList` e `useUsuariosList` têm `staleTime: 5min` — dados de pacote mudam com pouca frequência.
2. **Filtro de role com variação de gênero**: `PacoteForm` busca usuários e filtra fotógrafos por `papel === 'FOTOGRAFA' || papel === 'FOTOGRAFO'` — trata ambos os gêneros.
3. **`PacoteResponse` não utilizado**: O tipo em `types/pacotes.types.ts` (com `precoFotoExtra`, `imagemCapa`, `beneficios`, `valorTotalMinimo`) parece ser de uma versão anterior da API ou para outro contexto (e-commerce).

## 6. Testes
Não existem testes para este módulo.

## 7. Pontos de Atenção
- **Módulo exemplar**: Único módulo frontend completamente isolado (sem imports de outras features) e que segue todos os padrões do projeto (barrel, api/queries.ts, schemas/, types/, services/).
- **`PacoteResponse` dead code**: Tipo com 19 campos versus `Pacote` com 15. Se não for usado, deve ser removido.
- **`as any` no zodResolver**: `PacoteForm.tsx` faz cast `as any` no resolver (mesmo padrão de `ClienteForm`) para contornar incompatibilidade entre Zod 4 e `@hookform/resolvers`.
- **`diasParaEntrega` opcional**: O schema aceita `number | '' | undefined`, mas o tipo `Pacote` declara `number | null` — pequena divergência de tipos.
- **Gênero do papel**: A verificação `'FOTOGRAFA'` e `'FOTOGRAFO'` sugere que o backend pode retornar variações de gênero. Isso deve ser padronizado ou documentado.
