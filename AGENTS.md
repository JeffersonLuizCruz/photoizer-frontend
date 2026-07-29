# 📖 AGENTS.md - Contexto do Projeto para IA

## 1. Visão Geral e Stack Tecnológica
- **Objetivo do Projeto:** CRM para estúdio de fotografia (Photoizer). Gerencia clientes, agendamentos de ensaios, pacotes, edição de fotos, finanças, e-commerce (venda de fotos extras para clientes), comissões e notificações.
- **Linguagens e Frameworks:** TypeScript ~6.0, React 19, Vite 8, React Router DOM 7.
- **Bibliotecas Críticas:**
  - **TanStack React Query 5** — estado servidor (cache, mutations, invalidação).
  - **Zustand 5** — estado global de UI (sidebar, tema) e auth de cliente.
  - **Axios** — cliente HTTP com interceptors para token e erros.
  - **Zod 4** — validação de schemas (formulários e env).
  - **React Hook Form 7 + @hookform/resolvers** — formulários com validação Zod.
  - **Radix UI** — componentes de UI acessíveis (Dialog, Select, Dropdown, Tabs, etc).
  - **Tailwind CSS 4** — estilização via classes utilitárias (sem CSS modules ou styled-components).
  - **class-variance-authority (CVA)** — variantes de componentes (ex: `buttonVariants`).
  - **Sonner** — toasts de notificação.
  - **date-fns + react-day-picker** — manipulação de datas e calendário.
  - **lucide-react** — ícones.
  - **TanStack React Table 8** — tabelas de dados.
  - **Recharts** — gráficos no dashboard.
- **Estilo e Formatação:**
  - Linter: **oxlint** (executado via `npm run lint`).
  - Sem ponto e vírgula (ASI style).
  - Aspas simples.
  - `verbatimModuleSyntax: true` — uso obrigatório de `import type` para tipos.
  - `noUnusedLocals` e `noUnusedParameters` ativos no TSConfig.

## 2. Estrutura de Diretórios
- `/src/app/` — Ponto de entrada (main.tsx + App.tsx com providers).
- `/src/routes/` — Definição de todas as rotas com lazy loading (React Router).
- `/src/providers/` — Providers de contexto (QueryClient, Theme, Auth).
- `/src/stores/` — Stores globais com Zustand (sidebar, tema).
- `/src/shared/` — Código compartilhado entre features:
  - `api/` — Cliente Axios configurado + interceptors.
  - `components/` — Layout (AppLayout, Sidebar, Header) + UI (shadcn-style: button, input, dialog, etc).
  - `config/` — Variáveis de ambiente validadas com Zod.
  - `constants/` — ROTAS, QUERY_KEYS, enums de domínio.
  - `hooks/` — Hooks genéricos (useDebounce).
  - `lib/` — Utilitários (cn para merge de classes Tailwind).
  - `types/` — Tipos genéricos (ApiResponse, PaginatedResponse).
- `/src/styles/` — CSS global (globals.css) com variáveis de tema Tailwind.
- `/src/features/` — Módulos de negócio independentes.

## 3. Entidades e Modelos de Dados Principais
- **Cliente** (`features/clientes/types`): `id, nome, telefone, email, cpf, cidade, estado, origem (INDICACAO|ANUNCIO|OUTROS), observacoes`.
- **Agendamento** (`features/agenda/types`): `id, clienteId, pacoteId, editorId, dataHoraEnsaio, duracaoMinutos, localEnsaio, status (enum complexo com ~10 estados), valorTotal, valorEntrada*, saldoDevedor, urlComprovante*, datas de controle, autorizaUsoImagem, contratoGerado, ensaioDestaque`.
- **Pacote** (`features/pacotes/types`): `id, nome, descricao, quantidadeFotos, quantidadeVideos, valorBase, bloqueiaDiaInteiro, duracaoEstimada, ativo, fotografoId, editorResponsavelId, diasParaEntrega`.
- **Foto (E-commerce)** (`features/ecommerce/types`): `id, agendamentoId, originalUrl, watermarkedUrl, thumbUrl, status (INEDITA|PUBLICADA|AGUARDANDO_*|PAGA), selecionadaPacote, destaque, tags, visivel`.
- **Pedido / Cupom** (`features/ecommerce/types`): `Pedido` (com status, totais, formaPagamento), `Cupom` (codigo, tipoDesconto, valor, validade, usoUnico).
- **Tarefa** (`features/agenda/types`): `id, agendamentoId, tipo (EDITAR_FOTOS|ENVIAR_PARA_SELECAO|ENTREGA_FINAL), responsavelId, dataLimite, status (PENDENTE|EM_ANDAMENTO|CONCLUIDA|ATRASADA)`.
- **Usuario** (`features/auth`): `id, nome, email, papel (ADMIN|FOTOGRAFO|EDITOR|AGENDADOR)`.

## 4. Padrões e Convenções de Código (CRUCIAL)
- **Gerenciamento de Estado:**
  - Estado servidor (dados da API): TanStack React Query. Toda chamada de API passa por hooks `useQuery`/`useMutation` em `features/*/api/queries.ts`. Mutations invalidam queries via `queryClient.invalidateQueries`.
  - Estado global de UI: Zustand (sidebar.store, theme.store com persist middleware).
  - Estado de autenticação admin: React Context (`AuthProvider`).
  - Estado de autenticação cliente: Zustand com persist (`useCustomerAuth`).
- **Chamadas de API:**
  - Cliente Axios singleton em `shared/api/client.ts` com baseURL vinda de `env.VITE_API_URL`.
  - Interceptors em `shared/api/interceptors.ts` — anexam token JWT (admin ou customer) automaticamente.
  - Tratamento centralizado de erros HTTP: 401 → logout + redirect, 403/400/422/409/500 → toast via Sonner.
  - Serviços organizados em `features/*/services/*.service.ts` (objetos com métodos CRUD).
  - Queries em `features/*/api/queries.ts` (hooks que chamam os services).
- **Estilização:**
  - Apenas classes Tailwind. NUNCA crie arquivos CSS separados.
  - Use `cn()` de `@/shared/lib/cn` para merge condicional de classes.
  - Componentes de UI seguem o padrão shadcn/ui: Radix primitives + CVA variants + `forwardRef` + `cn()`. Exemplo: `shared/components/ui/button.tsx`.
  - Tema claro/escuro via classe `.dark` no `<html>` controlado por Zustand + persist.
- **Tratamento de Erros:**
  - Erros de API tratados globalmente no interceptor do Axios (toast automático).
  - Em mutations, `onError` do React Query exibe toast com a mensagem do erro.
  - `ErrorBoundary` no topo da árvore (App.tsx).
- **Nomenclatura:**
  - Componentes React: **PascalCase** (Button, ClientesListPage).
  - Arquivos: **kebab-case** (cliente.schema.ts, sidebar.store.ts).
  - Hooks customizados: prefixo `use` (useClientesList, useDebounce).
  - Stores Zustand: `*.store.ts` (sidebar.store.ts).
  - Schemas Zod: `*.schema.ts` (cliente.schema.ts).
  - Constantes e tipos exportados: PascalCase para tipos/interfaces, UPPER_SNAKE para enums.
- **Organização de Features:**
  - Features NÃO importam outras features. Código compartilhado entre features deve ir para `shared/`.
  - Cada feature expõe publicamente via `index.ts` apenas páginas e hooks.
  - Estrutura padrão de feature: `api/queries.ts`, `services/*.service.ts`, `types/`, `schemas/`, `components/`, `pages/`, `index.ts`.
- **Validação de Formulários:**
  - Schema Zod → tipo inferido → react-hook-form com `zodResolver` do `@hookform/resolvers`.
  - Nunca use validação manual inline.
- **Rotas:**
  - Constantes de rota centralizadas em `ROUTES` no `shared/constants/index.ts`.
  - Pages são lazy-loaded com `React.lazy()` (code-splitting por rota).
  - Rotas admin são aninhadas dentro de `<ProtectedRoute><AppLayout/></ProtectedRoute>`.
- **Tipagem:**
  - `verbatimModuleSyntax` → obrigatório usar `import type` para importações de tipos.
  - Tipos genéricos de API: `ApiResponse<T>`, `PaginatedResponse<T>` em `shared/types`.
  - Tipos de entidades ficam dentro da feature (`features/*/types/`).

## 5. Fluxos Principais e Pontos de Entrada
- **Ponto de Entrada:** `src/app/main.tsx` → renderiza `<App/>`.
- **Provedores (ordem no App.tsx):** `ErrorBoundary > ThemeProvider > QueryProvider > AuthProvider > AppRoutes > Toaster`.
- **Roteamento:** React Router DOM v7 com `BrowserRouter` em `AppRoutes.tsx`:
  - Rotas públicas: galeria do cliente (`/g/:token`), login admin (`/login`), login cliente (`/acesso-cliente`), pacotes, checkout.
  - Rotas protegidas (admin): aninhadas em `<ProtectedRoute><AppLayout/></ProtectedRoute>` (renderiza Sidebar + Header + `<Outlet/>`).
  - Lazy loading: todas as páginas via `React.lazy()`.
- **Autenticação Admin:**
  - Login via `authService.login()` → POST `/auth/login` → recebe token JWT.
  - Token em localStorage (`photoizer_auth_token`). Dados do usuário em `photoizer_auth_user`.
  - Interceptor do Axios anexa `Authorization: Bearer <token>`.
  - 401 → logout + redirect `/login`.
  - Papéis: ADMIN, FOTOGRAFO, EDITOR, AGENDADOR.
- **Autenticação Cliente (E-commerce):**
  - Store Zustand com persist (`useCustomerAuth`).
  - Token anexado automaticamente pelo interceptor.
  - 401 → logout + redirect `/acesso-cliente`.
- **Proxy dev:** `/api` → `http://localhost:8080` (vite.config.ts).

## 6. Comandos Úteis
- `npm run dev` — Inicia servidor de desenvolvimento Vite.
- `npm run build` — TypeScript check + Vite build.
- `npm run preview` — Preview do build de produção.
- `npm run lint` — Executa oxlint.
