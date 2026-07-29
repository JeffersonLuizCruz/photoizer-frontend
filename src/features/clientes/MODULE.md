# Módulo: Clientes

## 1. Responsabilidade
Gerencia o cadastro de clientes do estúdio — CRUD completo, busca por telefone, visualização de detalhes com agendamentos e financeiro do cliente.

## 2. Estrutura Interna
```
features/clientes/
├── index.ts                          # Barrel: ClientesListPage, ClienteFormPage, ClienteDetalhesPage
├── types/index.ts                    # Cliente, Origem, ClienteListParams, ClienteListResponse, payloads
├── schemas/cliente.schema.ts         # Zod schema: clienteSchema → ClienteFormData
├── services/cliente.service.ts       # HTTP: list, getById, create, update, delete, listarAgendamentos
├── api/queries.ts                    # 6 hooks: useClientesList, useCliente, useCreateCliente, etc.
├── components/
│   ├── ClienteForm.tsx               # Formulário RHF + Zod (reutilizável create/edit)
│   ├── ClienteList.tsx               # DataTable com colunas e ações
│   └── ClienteDeleteDialog.tsx       # ConfirmDialog para exclusão
├── pages/
│   ├── ClientesListPage.tsx          # Lista com search, paginação, delete
│   ├── ClienteFormPage.tsx           # Create (/:id? → edit)
│   └── ClienteDetalhesPage.tsx       # Tabs: Resumo, Agendamentos, Financeiro
├── hooks/                            # (vazio)
└── utils/                            # (vazio)
```

## 3. Dependências Externas

### Bibliotecas
- `@tanstack/react-query` — hooks useQuery/useMutation
- `@tanstack/react-table` — tabela de dados
- `react-hook-form` + `@hookform/resolvers` + `zod` — formulários e validação
- `react-router-dom` — navegação
- `date-fns` + `date-fns/locale` — formatação de datas
- `sonner` — toasts
- `lucide-react` — ícones
- `axios` (via `@/shared/api`) — requisições HTTP

### Módulos internos (shared)
- `@/shared/constants` — `ROUTES`, `QUERY_KEYS`, `AGENDAMENTO_STATUS`
- `@/shared/api` — `apiClient`
- `@/shared/hooks/useDebounce` — debounce para busca
- `@/shared/components/layout/*` — PageTitle, PageLoading, ConfirmDialog, DataTable, StatusBadge
- `@/shared/components/ui/*` — button, input, label, select, tabs, skeleton

### Outras features (⚠️ violação da regra de isolamento)
- `@/features/agenda/types` — `Agendamento` (em `ClienteDetalhesPage.tsx` e `cliente.service.ts`)

## 4. Fluxos Principais

### Fluxo 1: Listagem e Busca
1. `ClientesListPage` renderiza `ClienteList` com DataTable.
2. Search com `useDebounce(400ms)` → `useClientesList({ search })`.
3. Paginação server-side via `page` e `perPage`.
4. Ações por linha: editar (navega para `/clientes/:id/editar`), excluir (abre `ClienteDeleteDialog`).

### Fluxo 2: Criação/Edição
1. `ClienteFormPage` detecta modo via `:id` na URL.
2. Modo edição: `useCliente(id)` → mapeia para `defaultValues`.
3. `ClienteForm` com `react-hook-form` + `zodResolver(clienteSchema)`.
4. Campos: Nome, Telefone (máscara), Email, CPF (máscara), Origem (Select), Cidade, Estado, Observações.
5. Submit → `useCreateCliente()` ou `useUpdateCliente(id)` → invalida `['clientes']` → toast → navega para listagem.

### Fluxo 3: Detalhes do Cliente
1. `ClienteDetalhesPage` com 3 abas:
   - **Resumo**: métricas (Total Gasto, Ensaios Realizados, Último Ensaio, Saldo Pendente) + dados cadastrais.
   - **Agendamentos**: DataTable com status, valores, link para detalhes.
   - **Financeiro**: métricas financeiras + tabela de dados financeiros.
2. Sidebar com link "Novo Agendamento" (`?clienteId=`).

## 5. Regras Específicas
1. **Máscaras inline**: Formatação de telefone `(XX) XXXXX-XXXX` e CPF `XXX.XXX.XXX-XX` feita via `onChange` no `ClienteForm` — sem biblioteca de máscara.
2. **Schema de validação**: `telefone` obrigatório com regex, `email` e `cpf` opcionais com formato validado se preenchidos.
3. **`listarAgendamentos` em português vs métodos em inglês**: O service tem `listarAgendamentos` em PT enquanto os demais métodos (`list`, `getById`, `create`) estão em EN — provável artefato de refatoração.
4. **`import()` dinâmico no service**: `cliente.service.ts` usa `import('@/features/agenda/types')` inline em vez de `import type` no topo — violação "stealth" de isolamento.

## 6. Testes
Não existem testes para este módulo.

## 7. Pontos de Atenção
- **Violação de arquitetura**: O módulo importa o tipo `Agendamento` de `@/features/agenda/types` em 2 arquivos. Esse tipo deveria estar em `shared/types/`.
- **`ClienteForm` não expõe hooks publicamente**: `useClientesList` e outros hooks não são re-exportados no `index.ts`, diferentemente da convenção que diz "exporta páginas e hooks".
- **`hooks/` e `utils/` vazios**: Diretórios existem mas não contêm arquivos — podem ser removidos.
- **`as any` no `zodResolver`**: O resolver passa por `as any` para contornar incompatibilidade entre Zod 4 e `@hookform/resolvers`.
- **Validação de CPF apenas de formato**: A regex valida apenas o formato `XXX.XXX.XXX-XX`, não o dígito verificador.
