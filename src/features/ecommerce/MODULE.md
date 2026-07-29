# Módulo: E-commerce

## 1. Responsabilidade
Gerencia a venda de fotos extras e pacotes para clientes — galeria pública, carrinho, checkout, pedidos, cupons, analytics, depoimentos. É o maior módulo do frontend em complexidade e número de arquivos.

## 2. Estrutura Interna
```
features/ecommerce/
├── types/ecommerce.types.ts          # 25+ interfaces: FotoEnsaio, Pedido, Cupom, CarrinhoItem, etc.
├── services/ecommerce.service.ts     # HTTP: 30+ métodos (galeria, carrinho, checkout, admin, pedidos, cupons)
├── components/
│   ├── AdminCompraDetalheDialog.tsx   # Detalhes da compra (admin)
│   ├── CartSummaryPanel.tsx          # Painel lateral do carrinho
│   ├── CheckoutDialog.tsx            # Checkout multi-step (método pagamento, comprovante)
│   ├── ComparadorFotos.tsx           # Comparação lado a lado de fotos
│   ├── DepoimentosSection.tsx        # Seção de depoimentos + formulário
│   ├── EcommerceAdminResumo.tsx      # Resumo e-commerce por agendamento (admin)
│   ├── FotoViewer.tsx                # Visualizador fullscreen de fotos
│   ├── MinhasComprasSection.tsx      # Histórico de compras do cliente
│   ├── PhotoGrid.tsx                 # Grid responsivo de fotos
│   └── PurchaseConfirmation.tsx      # Tela de sucesso pós-compra
├── pages/
│   ├── AdminAnalyticsPage.tsx        # Analytics e-commerce (admin)
│   ├── AdminCuponsPage.tsx           # Gerenciamento de cupons (admin)
│   ├── AdminEcommercePage.tsx        # Compras pendentes (admin)
│   ├── AdminPedidosPage.tsx          # Pedidos do e-commerce (admin)
│   ├── CheckoutPage.tsx              # Checkout completo (5 steps)
│   ├── GaleriaClientePage.tsx        # Galeria pública do cliente
│   └── PackageCatalogPage.tsx        # Catálogo de pacotes (público)
```

## 3. Dependências Externas

### Bibliotecas
- `@tanstack/react-query` — queries e mutações (parcialmente inline)
- `@tanstack/react-table` — tabela de compras (AdminEcommercePage)
- `react-router-dom` — navegação
- `lucide-react` — ícones
- `sonner` — toasts
- `recharts` — gráficos (AdminAnalyticsPage)
- `axios` (via `@/shared/api`) — requisições HTTP

### Módulos internos (shared)
- `@/shared/api` — `apiClient`
- `@/shared/config/env` — variáveis de ambiente
- `@/shared/constants` — `ROUTES`
- `@/shared/components/layout/*` — PageTitle, DataTable, StatusBadge, ConfirmDialog
- `@/shared/components/ui/*` — button, textarea, AuthImage

### Outras features (⚠️ violação da regra de isolamento)
- `@/features/pacotes/types/pacotes.types` — `PacoteResponse` (service, CheckoutPage, PackageCatalogPage)
- `@/features/auth/customer/types` — `AgendamentoCliente` (service)
- `@/features/auth/customer` — `useCustomerAuth` (CheckoutPage)

## 4. Fluxos Principais

### Fluxo 1: Galeria do Cliente
1. Cliente acessa `/g/:token` → `GaleriaClientePage`.
2. Carrega fotos, carrinho, favoritos via service (sem React Query — `useState`/`useEffect`).
3. Cliente pode: selecionar fotos do pacote, adicionar ao carrinho, favoritar, comparar (até 4).
4. Carrinho lateral (`CartSummaryPanel`) com resumo e botão de checkout.

### Fluxo 2: Checkout
1. `CheckoutDialog` (galeria) ou `CheckoutPage` (pacote): 4-5 steps.
2. Calcula valores via `ecommerceService.calcular()`.
3. Seleciona método de pagamento (PIX/TRANSFERENCIA/DINHEIRO).
4. Anexa comprovante de pagamento (upload).
5. Confirma → `ecommerceService.checkout()`.

### Fluxo 3: Admin — Gerenciamento de Compras
1. `AdminEcommercePage` lista compras com filtro de status.
2. Ações: ver detalhes (`AdminCompraDetalheDialog`), confirmar pagamento, cancelar.
3. Relatório de compras com cards de totais.

### Fluxo 4: Admin — Analytics
1. `AdminAnalyticsPage` com queries React Query (`['admin-analytics']`, `['dashboard-ecommerce']`).
2. Cards de métricas + gráficos Recharts + top clientes + fotos populares.

## 5. Regras Específicas
1. **Session ID**: Usa `localStorage` para persistir um UUID de sessão anônima (`photoizer_cart_session`) enviado como header `X-Session-Id` para carrinho antes do login.
2. **Padrão de fetch híbrido**: Alguns componentes usam React Query (páginas admin), outros usam `useState`/`useEffect` direto (galeria, checkout). Não há `api/queries.ts` centralizado.
3. **Hardcoded values**: Chave PIX (`photoizer@email.com`), valores de entrega (`R$ 29,90` / `R$ 49,90`), métodos de pagamento (não inclui cartão de crédito no diálogo) estão hardcoded.
4. **Sem `index.ts`**: Não há barrel file exportando páginas e hooks publicamente.

## 6. Testes
Não existem testes para este módulo.

## 7. Pontos de Atenção
- **Maior módulo do frontend**: 19 arquivos, 7 páginas, 10 componentes, service com 30+ métodos.
- **Violações de isolamento**: Importa `PacoteResponse` de `@/features/pacotes` (3 arquivos) e `useCustomerAuth` + `AgendamentoCliente` de `@/features/auth` (2 arquivos).
- **Sem `api/queries.ts`**: Hooks espalhados entre páginas e componentes — difícil de manter e reusar.
- **`CheckoutPage` com `any`**: `PedidoRequest` e `CupomFormState` têm cast `as any` — brecha de type safety.
- **`GaleriaClientePage` (485 linhas)**: Maior arquivo do módulo — mistura dados, UI e lógica de negócio. Forte candidato a refatoração.
- **`ecommerce.service.ts` (282 linhas)**: Segundo maior service do frontend. Agrupa métodos de cliente e admin — poderia ser dividido.
- **Dead code potencial**: `DashboardEcommerceResponse` e `DashboardEcommerceMensalResponse` parecem duplicados do dashboard.
