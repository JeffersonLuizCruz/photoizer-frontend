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
│   ├── AdminLinkPagamentoDialog.tsx  # Insere/remove link de cartão por compra
│   ├── AdminPagamentoConfigDialog.tsx # Configura o PIX global do e-commerce
│   ├── CartSummaryPanel.tsx          # Painel lateral do carrinho
│   ├── CheckoutDialog.tsx            # Checkout multi-step (método pagamento, comprovante)
│   ├── ComparadorFotos.tsx           # Comparação lado a lado de fotos
│   ├── DepoimentosSection.tsx        # Seção de depoimentos + formulário
│   ├── EcommerceAdminResumo.tsx      # Resumo e-commerce por agendamento (admin)
│   ├── FotoViewer.tsx                # Visualizador fullscreen de fotos
│   ├── GaleriaPerformancePanel.tsx   # SLA, funil, extras e série mensal
│   ├── GaleriaPipelinePanel.tsx      # Fila operacional da Central de Galerias
│   ├── MinhasComprasSection.tsx      # Histórico de compras do cliente
│   ├── PhotoGrid.tsx                 # Grid responsivo de fotos (legado)
│   ├── galeria/                      # Experiência editorial da galeria pública
│   │   ├── GaleriaHero.tsx           # Capa, título (customizado ou nome), data e local
│   │   ├── GaleriaRascunhoBanner.tsx # Aviso de seleção reaberta e limpeza do pacote
│   │   ├── GaleriaNav.tsx            # Navegação mínima com favoritos/carrinho
│   │   ├── GaleriaIntro.tsx          # Copy por fase e progresso do pacote
│   │   ├── GaleriaMasonry.tsx        # Grid masonry com favoritos/seleção
│   │   ├── GaleriaDock.tsx           # Barra fixa de ações
│   │   ├── GaleriaTimeline.tsx       # Linha do tempo da seleção/edição
│   │   ├── GaleriaExtraDialog.tsx    # Confirmação ao exceder o pacote
│   │   └── GaleriaConfirmarSelecao.tsx # Envio com pacote, extras e recado
│   └── PurchaseConfirmation.tsx      # Tela de sucesso pós-compra
├── pages/
│   ├── AdminAnalyticsPage.tsx        # Analytics e-commerce (admin)
│   ├── AdminEcommercePage.tsx        # Vendas de extras (aba "Vendas"; embutível)
│   ├── AdminGaleriasPage.tsx         # Central de Galerias (Fila + Vendas)
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
3. Seleciona método de pagamento (PIX/TRANSFERENCIA/CARTAO).
4. PIX/transferência: anexa comprovante. Cartão: o staff insere um link por compra e o cliente paga pelo link.
5. Confirma → `ecommerceService.checkout()`.

### Fluxo 3: Admin — Gerenciamento de Compras
1. `AdminEcommercePage` lista compras com filtro de status.
2. Ações: ver detalhes (`AdminCompraDetalheDialog`), confirmar pagamento, cancelar.
3. Relatório de compras com cards de totais.
4. A aba **Ecommerce** do agendamento (`EcommerceAdminResumo`) é um resumo de contadores e compras de extras, com atalhos para o workspace da galeria (fotos, seleção e compras). A grade de fotos, o override de seleção e a gestão de compras ficam em `/agenda/:id/fotos` (abas Fotos e Compras); o card "Seleção e edição" foi removido por duplicar a navegação por abas.

### Fluxo 4: Admin — Analytics
1. `AdminAnalyticsPage` com queries React Query (`['admin-analytics']`, `['dashboard-ecommerce']`).
2. Cards de métricas + gráficos Recharts + top clientes + fotos populares.

## 5. Regras Específicas
1. **Session ID**: Usa `localStorage` para persistir um UUID de sessão anônima (`photoizer_cart_session`) enviado como header `X-Session-Id` para carrinho antes do login.
2. **Padrão de fetch híbrido**: Alguns componentes usam React Query (páginas admin), outros usam `useState`/`useEffect` direto (galeria, checkout). Não há `api/queries.ts` centralizado.
3. **Hardcoded values**: valores de entrega (`R$ 29,90` / `R$ 49,90`) continuam fixos. O PIX agora vem de `GET /ecommerce/pagamento` (configurável pelo staff) e o cartão usa link por compra.
4. **Sem `index.ts`**: Não há barrel file exportando páginas e hooks publicamente.

## 6. Testes
Não existem testes para este módulo.

## 7. Galeria com seleção e edição

- O fluxo legado `DIRETO` foi desativado. Galerias novas e migradas usam
  `COM_EDICAO` por padrão; `SEM_EDICAO` está disponível para ensaios que não
  precisam de edição. A página mantém fallback de leitura para `DIRETO` apenas
  para linhas antigas não migradas.
- `GaleriaClientePage` passou a respeitar `modoGaleria`, `faseGaleria`, `requerEdicao`, `podeSelecionar`, `podeComprar` e `podeBaixar`.
- No modo `COM_EDICAO`, o cliente seleciona fotos do pacote (e extras no carrinho), envia a seleção e fica em modo leitura até a publicação da edição.
- No modo `SEM_EDICAO`, o cliente seleciona, o staff aprova e o pacote é liberado em versão original; extras só são liberados após a confirmação do pagamento.
- `PhotoGrid`, `FotoViewer`, `CartSummaryPanel` e `FavoritosPanel` recebem os flags de fase.
- Cada foto exibe `#número` e o nome do arquivo; a busca aceita ambos.
- `ecommerce.service.ts` expõe `enviarSelecao`, `selecaoAtiva`, `adminAlterarModoGaleria` e os endpoints administrativos de seleção/galeria.
- Em `SELECAO` (ambos os modos), extras são marcados com "Incluir extra" e o painel vira "Extras da seleção"; a compra só aparece em `COMERCIALIZACAO`.
- A seleção pode ser salva como rascunho antes do envio; após o envio, fica bloqueada.
- O envio da seleção **não recria** a sessão do carrinho quando o servidor a considera inválida: isso perderia os extras silenciosamente. O erro é mostrado e o cliente precisa recarregar/refazer o carrinho. Se a resposta vier com `quantidadeExtras` diferente do carrinho local, a UI avisa o cliente.
- `valoresExtras` (preço congelado por foto) é usado no grid, viewer, favoritos e resumo do carrinho.
- O botão “Baixar pacote” do `GaleriaDock` aparece sempre que `downloadableFotos.length > 0`, inclusive nos fluxos `SEM_EDICAO` e `DIRETO`.
- Favoritos e comparador respeitam `podeSelecionar`/`podeComprar`; não oferecem ações em fases bloqueadas.
- A galeria pública é mobile-first: header compacto com ícones, filtros fora do sticky, barra de ações fixa com safe-area no rodapé, grid de 2 colunas e rodapé fixo no visualizador.
- O `FotoViewer` suporta swipe horizontal (além de setas e teclado) e bloqueia o scroll do fundo enquanto está aberto; o comparador também bloqueia o scroll.
- A experiência editorial usa `GaleriaHero` (capa + título + data + local), `GaleriaMasonry` (masonry, sem nome de arquivo/preço por foto), `GaleriaDock` e `GaleriaIntro` com copy por modo/fase.
- O endpoint público expõe `clienteNome`, `tituloHero`, `dataHoraEnsaio` e `requerEdicao` para personalizar o hero e o texto; `tituloHero` nulo/vazio faz o hero exibir o nome do cliente. A capa é manual (definida pelo staff) com fallback para `destaque` ou primeira foto.
- O texto do hero é editado por galeria na aba **Visão geral** do workspace administrativo (`GaleriaHeroTituloCard`) e salvo em `PUT /admin/agendamentos/{id}/galeria/titulo`.
- Quando o pacote está cheio, o check do grid dá lugar à sacola de extra; o clique abre o `GaleriaExtraDialog` para confirmar a inclusão, em vez de adicionar silenciosamente ao carrinho. Extras só ficam disponíveis depois que o pacote atinge o limite (ou quando a fase de seleção já foi fechada).
- O envio da seleção usa `GaleriaConfirmarSelecao`, que agrupa pacote/extras e aceita o campo `observacao` (já suportado pelo backend).
- Em `SEM_EDICAO`, uma seleção aprovada (`PUBLICADA`) pode ser reaberta pelo admin enquanto nenhuma foto tiver sido baixada ou vendida. O backend expõe `podeReabrir` na seleção; a reabertura volta a galeria para `SELECAO` e cancela o snapshot aprovado, e o cliente envia uma nova seleção.
- O hero usa `capaUrl` (capa manual ou fallback) e faz preload com prioridade alta. A capa é escolhida em `AdminGaleriaPage` no modo “Escolher capa”; o backend congela a versão (`capaVersao`) e devolve a URL já versionada (`?v={fotoId}-{versao}`).
- A galeria pública revalida ao voltar para a aba (`visibilitychange`/`pageshow`) e a cada 60s, sem recarregar a página e sem apagar a seleção local em andamento.
- Quando o staff reabre uma seleção, o backend mantém `selecionadaPacote`: as fotos anteriores voltam como **rascunho** e o cliente vê o `GaleriaRascunhoBanner`. O progresso mostra “Rascunho · X de Y escolhidas” e o dock exibe “Salvar rascunho”/“Rascunho salvo”.
- O banner permite **“Limpar fotos do pacote”** com confirmação. A ação chama `DELETE /ecommerce/galeria/{token}/rascunho` e desmarca somente o pacote; os extras do carrinho permanecem.
- **Extras durante a seleção/edição**: em `SELECAO_ENVIADA`/`EM_EDICAO` (`COM_EDICAO`) e em `SELECAO_ENVIADA` (`SEM_EDICAO`) a sacola continua disponível. O extra entra no snapshot da seleção ativa (backend) e o total é calculado no carrinho; o checkout permanece bloqueado até `COMERCIALIZACAO`.
- **Extras após a publicação (COM_EDICAO)**: fotos restantes aparecem com o selo **“A editar”** e podem ser compradas. Após o pagamento, `MinhasComprasSection` mostra **“Aguardando edição”** até o estúdio liberar a versão editada; o download só aparece com `versaoAtual = EDITADA`.
- **Extras após a aprovação (SEM_EDICAO)**: o extra é baixado em original assim que o pagamento é confirmado, sem passar pela fila de edição.
- `isDownloadable`/`podeBaixarEsta` exigem `versaoAtual = EDITADA` apenas no modo `COM_EDICAO`, evitando liberar download de extra ainda não editado; em `SEM_EDICAO` o original é o entregável.
- `GaleriaTimeline` e `GaleriaIntro` adaptam as etapas e o texto quando `requerEdicao = false` (“Aprovação”/“Liberada”).
- O `CartSummaryPanel` mostra “Extras da seleção” durante a seleção/edição e “Meu Carrinho” na comercialização, com aviso de quando a compra será liberada.
- **PIX do e-commerce**: a chave é global e somente `ADMIN` altera. O controle fica no workspace da galeria (aba Visão geral, `GaleriaPagamentoPixCard`) e em Pedidos → Ecommerce. `MinhasComprasSection` exibe a chave atual para compras PIX pendentes, com botão de copiar; a chave não é congelada na compra, então correções do staff aparecem no polling/“Atualizar”.
- As prévias públicas usam o endpoint de watermark em baixa resolução (**560px**, JPEG ~0.35), com marca d'água da contratada. A UI bloqueia menu de contexto, arraste, seleção e callout de toque longo; o visualizador usa `background-image` com overlay para dificultar salvar a imagem.
- Arquivos editados finais e downloads permanecem em alta qualidade e sem marca d'água.

## 8. Pontos de Atenção
- **Maior módulo do frontend**: 19 arquivos, 7 páginas, 10 componentes, service com 30+ métodos.
- **Violações de isolamento**: Importa `PacoteResponse` de `@/features/pacotes` (3 arquivos) e `useCustomerAuth` + `AgendamentoCliente` de `@/features/auth` (2 arquivos).
- **Hooks parcialmente centralizados**: `api/queries.ts` cobre a fila da Central de Galerias; galeria/checkout ainda usam `useState`/`useEffect`.
- **`CheckoutPage` com `any`**: `PedidoRequest` e `CupomFormState` têm cast `as any` — brecha de type safety.
- **`GaleriaClientePage` (805 linhas)**: Maior arquivo do módulo — mistura dados, UI e lógica de negócio. Forte candidato a refatoração.
- **`ecommerce.service.ts` (282 linhas)**: Segundo maior service do frontend. Agrupa métodos de cliente e admin — poderia ser dividido.
- **Dead code potencial**: `DashboardEcommerceResponse` e `DashboardEcommerceMensalResponse` parecem duplicados do dashboard.

## 9. Central de Galerias

- A rota `/admin/ecommerce` passou a renderizar **`AdminGaleriasPage`** (menu renomeado para **Galerias**), com as abas **Fila de trabalho** e **Vendas**. A rota foi mantida para não quebrar links.
- A aba **Vendas** (e a aba **Desempenho**) só é exibida para `ADMIN`/`FOTOGRAFO`; `EDITOR` vê apenas a fila operacional, sem valores financeiros (o backend também redige esses campos).
- **Fila**: `GaleriaPipelinePanel` consome `GET /admin/galerias/pipeline` e `/resumo`. Os cards do topo filtram por etapa (e por atrasadas), há busca por cliente/pacote/local, ordenação por urgência e paginação.
- Cada item mostra etapa, dias na etapa, prazo do pacote, contadores de fotos/seleção/extras, pendências (pagamento, extra a editar, link expirado) e a **próxima ação** com deep link para o workspace (`?tab=fotos|selecao|visao`).
- O link da galeria pode ser copiado; quando o token expirou, a fila oferece **Novo link** (`adminRegenToken`).
- **Vendas** reutiliza `AdminEcommercePage` com `embedded` (sem `PageTitle`), mantendo compras, confirmação, cancelamento, link de cartão e configuração de PIX.
- Hooks em `api/queries.ts` (`useGaleriaPipeline`, `useGaleriaPipelineResumo`) invalidam por `refetchInterval` de 60s.
- O endpoint público de etapa (`GET /ecommerce/galeria/{token}/status`) alimenta o **acompanhamento do cliente**:
  - `/g/:token` sem fotos publicadas mostra `GaleriaEmPreparacao` (etapa com label de cliente, mensagem, pacote/data, linha do tempo e previsão) em vez da tela vazia; o botão “Atualizar” reconsulta sem derrubar a tela para skeleton.
  - com fotos, o `GaleriaIntro` exibe a previsão de entrega quando o ensaio ainda não foi entregue.
  - `/minha-conta` busca o status por ensaio em background, libera a lista antes dos status e mostra a etapa real, a previsão e o botão **Acompanhar ensaio** mesmo sem fotos publicadas.
  - A timeline adapta “Edição” para “Aprovação” no modo `SEM_EDICAO` e sinaliza previsão vencida.

## 10. Gestão (SLA, funil e exportação)

- A aba **Desempenho** (`Admin`/`Fotografo`) consome `GET /admin/galerias/desempenho?meses=3|6|12` e mostra:
  - tempo médio ensaio → publicação, seleção → publicação e ensaio → entrega;
  - atrasadas no período, receita/ticket/extras por galeria e conversão de extras;
  - funil (publicadas → com seleção → comercializadas → com extras);
  - série mensal (galerias, publicadas, com extras, receita e tempo até publicar).
- A fila exibe um alerta vermelho quando há galerias com prazo vencido e um atalho para filtrar as atrasadas.
- No mobile, os cards de resumo ficam em rolagem horizontal, os controles usam 44px de altura e a ação principal do card ocupa a largura disponível.
- **Exportar CSV** baixa a fila com os filtros atuais (`etapa`, `busca`, `atrasadas`) via `downloadProtected`; o backend responde com BOM UTF-8 e separador `;` para abrir direto no Excel pt-BR.
- A rota antiga `/admin/analytics` redireciona para `?tab=desempenho`; `EDITOR` é direcionado para a fila (não vê indicadores financeiros).
