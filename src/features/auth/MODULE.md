# Módulo: Auth

## 1. Responsabilidade
Gerencia autenticação e autorização de dois perfis: administradores (fotógrafos, editores, agendadores) e clientes (compradores no e-commerce). Fornece contexto de usuário logado, proteção de rotas e stores de sessão persistidas.

## 2. Estrutura Interna
```
features/auth/
├── index.ts                          # Barrel: AuthProvider, useAuth, ProtectedRoute, LoginPage, authService
├── AuthProvider.tsx                  # React Context (admin): user, papel, login/logout, role flags
├── ProtectedRoute.tsx                # Route guard com allowedRoles opcional
├── pages/
│   └── LoginPage.tsx                 # Login admin (email/senha)
├── services/
│   └── auth.service.ts               # Login/logout API + localStorage (token, user)
└── customer/
    ├── index.ts                      # Barrel: CustomerLoginPage, CustomerDashboardPage, useCustomerAuth
    ├── types.ts                      # CustomerUser, AgendamentoCliente
    ├── store.ts                      # Zustand persist store (useCustomerAuth)
    ├── customerProfile.service.ts    # CRUD perfil do cliente
    ├── CustomerLoginPage.tsx         # Login/registro cliente
    ├── CustomerDashboardPage.tsx     # Home do cliente (stats, agendamentos, pedidos)
    ├── CustomerProfilePage.tsx       # Editar perfil do cliente
    ├── CustomerOrderDetailPage.tsx   # Detalhe do pedido
    └── CustomerAgendamentoCard.tsx   # Card de agendamento para cliente
```

## 3. Dependências Externas

### Bibliotecas
- `@tanstack/react-query` — queries (CustomerDashboardPage, CustomerOrderDetailPage)
- `zustand` + `zustand/middleware` — store de autenticação do cliente com persist
- `react-router-dom` — navegação e guards
- `lucide-react` — ícones
- `sonner` — toasts
- `axios` (via `@/shared/api`) — requisições HTTP

### Módulos internos (shared)
- `@/shared/api` — `apiClient`
- `@/shared/constants` — `ROUTES`
- `@/shared/components/ui/*` — button, input, label
- `@/shared/components/layout/*` — (não utilizado diretamente, mas presente via AppLayout)

### Outras features (⚠️ violação da regra de isolamento)
- `@/features/ecommerce/services/ecommerce.service` — `ecommerceService` (em `CustomerDashboardPage.tsx`, `CustomerOrderDetailPage.tsx`)
- `@/features/ecommerce/types/ecommerce.types` — `Pedido` (em `CustomerDashboardPage.tsx`, `CustomerOrderDetailPage.tsx`)

## 4. Fluxos Principais

### Fluxo 1: Login Admin
1. Usuário acessa `/login` → `LoginPage`.
2. Submete email + senha → `authService.login()` → `POST /auth/login`.
3. Resposta: token JWT + dados do usuário (nome, email, papel, userId).
4. Token salvo em `localStorage` (`photoizer_auth_token`), dados em `photoizer_auth_user`.
5. `AuthProvider` atualiza estado → `isAuthenticated = true`.
6. Redireciona para `ROUTES.DASHBOARD` (ou `from` location).

### Fluxo 2: Controle de Acesso (Admin)
- `ProtectedRoute` verifica `useAuth().isAuthenticated`.
- Se não autenticado → redirect `/login`.
- Se `allowedRoles` especificado → verifica `papel`. Se não autorizado → redirect `/dashboard`.
- Role flags: `isAdmin`, `isFotografo`, `isEditor`, `isAgendador`.

### Fluxo 3: Login/Registro Cliente
1. Cliente acessa `/acesso-cliente` → `CustomerLoginPage`.
2. Alterna entre login (`POST /auth/cliente/login`) e registro (`POST /auth/cliente/registro`).
3. Sucesso → `useCustomerAuth().login()` salva token no localStorage via Zustand persist.
4. Redireciona para `/minha-conta`.

### Fluxo 4: Dashboard do Cliente
1. `CustomerDashboardPage` carrega agendamentos e pedidos via `ecommerceService`.
2. Exibe stats (ensaios com fotos, pedidos, concluídos, pendentes).
3. Lista agendamentos como `CustomerAgendamentoCard` com progresso e link para galeria.
4. Lista pedidos com navegação para detalhe.

## 5. Regras Específicas
1. **Dois sistemas de auth separados**: Admin usa React Context (`AuthProvider`), cliente usa Zustand persist (`useCustomerAuth`). Cada um com seu próprio token e fluxo de refresh.
2. **Interceptor compartilhado**: O mesmo `apiClient` anexa o token correto baseado na rota (admin ou customer), definido em `shared/api/interceptors.ts`.
3. **CustomerDashboardPage viola isolamento**: Importa diretamente `ecommerceService` e tipo `Pedido` da feature `ecommerce`. Esses métodos (`listarAgendamentosCliente`, `listarPedidosCliente`) deveriam estar em `shared/` ou na própria feature auth/customer.
4. **Sem React Query queries centralizadas**: Diferente do padrão do projeto, auth não tem `api/queries.ts`. Os hooks `useQuery`/`useMutation` são usados inline nas páginas.
5. **Persistência**: Admin usa `localStorage` diretamente via `authService`. Cliente usa Zustand `persist` middleware (chave `photoizer-customer-auth`).

## 6. Testes
Não existem testes para este módulo.

## 7. Pontos de Atenção
- **Violação de arquitetura**: `CustomerDashboardPage` e `CustomerOrderDetailPage` importam `ecommerceService` e `Pedido` de `@/features/ecommerce`. Isso quebra a regra de isolamento de features.
- **Duplicação de responsabilidade**: Auth contém páginas do cliente (`CustomerDashboardPage`, `CustomerProfilePage`, `CustomerOrderDetailPage`) que são mais de e-commerce do que de autenticação. Seriam melhor alocadas em uma feature `cliente-area` ou similar.
- **`CustomerDashboardPage` usou `ecommerceService` diretamente**: Em vez de criar hooks específicos em `api/queries.ts`, chamou o service diretamente com `useState`/`useEffect`.
- **`LoginPage` sem tratamento de erro refinado**: Exibe apenas mensagem de erro inline sem diferenciar 401 (credenciais) de 500 (servidor).
- **`AuthProvider` lê `localStorage` no mount**: Se o token expirou, não faz validação automática — o erro 401 será tratado pelo interceptor global.
- **Role `FOTOGRAFA` vs `FOTOGRAFO`**: Em `PacoteForm` e provavelmente no backend, há variação de gênero no papel. O frontend trata ambos, mas `AuthProvider` usa apenas `FOTOGRAFO`.
