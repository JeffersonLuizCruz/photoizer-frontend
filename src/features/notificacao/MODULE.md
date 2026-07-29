# Módulo: Notificação

## 1. Responsabilidade
Gerencia notificações do sistema — sino no header com contagem de não lidas, dropdown das 5 mais recentes e página completa de listagem com ações de marcar como lida.

## 2. Estrutura Interna
```
features/notificacao/
├── index.ts                          # Barrel: NotificacaoSino, NotificacoesPage
├── types/index.ts                    # Notificacao (id, userId, titulo, mensagem, lida, link, createdAt)
├── services/notificacao.service.ts   # HTTP: listar, countNaoLidas, marcarComoLida, marcarTodasComoLidas
├── components/
│   └── NotificacaoSino.tsx           # Sino com badge + dropdown menu
└── pages/
    └── NotificacoesPage.tsx          # Página completa de notificações
```

## 3. Dependências Externas

### Bibliotecas
- `@tanstack/react-query` — useQuery, useMutation (inline)
- `react-router-dom` — navegação
- `lucide-react` — ícones (Bell, CheckCheck, Loader2)
- `date-fns` + `date-fns/locale` — formatação de datas
- `axios` (via `@/shared/api`) — requisições HTTP

### Módulos internos (shared)
- `@/shared/api` — `apiClient`
- `@/shared/constants` — `ROUTES`
- `@/shared/components/layout/PageTitle` — título de página
- `@/shared/components/ui/*` — button, badge
- `@/shared/components/ui/dropdown-menu` — DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger

### Outras features
Nenhuma — módulo 100% isolado.

## 4. Fluxos Principais

### Fluxo 1: Sino de Notificações (Header)
1. `NotificacaoSino` é renderizado no Header (AppLayout).
2. Auto-polling a cada 5 minutos (`refetchInterval: 1000 * 60 * 5`).
3. Badge vermelho com contagem de não lidas.
4. Dropdown mostra as 5 notificações mais recentes.
5. Clicar em uma notificação → marca como lida + navega para `link`.
6. "Ver todas" → navega para `/notificacoes`.

### Fluxo 2: Página de Notificações
1. `NotificacoesPage` lista todas as notificações.
2. Cada card mostra título, mensagem, timestamp e indicador de não lida.
3. Clicar → marca como lida + navega para `link`.
4. Botão "Marcar todas como lidas" no header quando há não lidas.

## 5. Regras Específicas
1. **Auto-polling**: O sino faz polling a cada 5 minutos para atualizar notificações e contagem.
2. **Query key duplicada**: A string `'notificacoes'` é hardcoded tanto no `NotificacaoSino` quanto no `NotificacoesPage` — elas compartilham o mesmo cache do React Query por coincidência.
3. **Sem `api/queries.ts`**: Hooks inline em vez de centralizados.
4. **NotificacaoSino como componente de layout**: É o único componente de feature que é renderizado diretamente no layout compartilhado (Header), o que o torna efetivamente um componente cross-cutting.

## 6. Testes
Não existem testes para este módulo.

## 7. Pontos de Atenção
- **Módulo bem isolado**: Não importa nenhuma outra feature — exemplo de boa prática de isolamento.
- **`api/queries.ts` ausente**: Hooks inline e query key hardcoded — frágil para manutenção.
- **`QUERY_KEYS` não utilizado**: O projeto tem constantes `QUERY_KEYS` em `shared/constants`, mas o módulo não as usa.
- **NotificacaoSino como cross-cutting**: Por ser renderizado no Header, qualquer mudança no componente afeta todas as páginas. Idealmente, a lógica de polling poderia ser extraída para um hook compartilhado.
