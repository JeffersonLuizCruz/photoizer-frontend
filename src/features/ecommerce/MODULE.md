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
│   ├── CheckoutDialog.tsx            # PIX: total, chave, comprovante e envio único
│   ├── DepoimentosSection.tsx        # Seção de depoimentos + formulário
│   ├── EcommerceAdminResumo.tsx      # Resumo e-commerce por agendamento (admin)
│   ├── FotoViewer.tsx                # Visualizador fullscreen de fotos
│   ├── GaleriaPerformancePanel.tsx   # SLA, funil, extras e série mensal
│   ├── GaleriaPipelinePanel.tsx      # Fila operacional da Central de Galerias
│   ├── MinhasComprasSection.tsx      # Histórico de compras do cliente
│   ├── galeria/                      # Experiência editorial da galeria pública
│   │   ├── GaleriaHero.tsx           # Capa, título (customizado ou nome), data e local
│   │   ├── GaleriaRascunhoBanner.tsx # Aviso de seleção reaberta e limpeza do pacote
│   │   ├── GaleriaNav.tsx            # Navegação mínima com carrinho
│   │   ├── GaleriaIntro.tsx          # Copy por fase e progresso do pacote
│   │   ├── GaleriaGrid.tsx           # Grid alinhado (linha a linha) com seleção/extras
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
- `canvas-confetti` — explosão de confete ao completar o pacote

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
2. Carrega fotos e carrinho via service (sem React Query — `useState`/`useEffect`).
3. Cliente pode: selecionar fotos do pacote e adicionar extras ao carrinho.
4. Carrinho lateral (`CartSummaryPanel`) com resumo e botão de checkout.

### Fluxo 2: Checkout
1. `CartSummaryPanel` mostra o carrinho e o botão **“Pagar extras com PIX”**.
2. `CheckoutDialog` mostra o total (`ecommerceService.calcular()`), a chave PIX e o campo de comprovante.
3. O cliente paga e anexa o comprovante; o botão único **“Enviar comprovante e finalizar”** chama
   `ecommerceService.checkoutPix()`, que cria a compra e anexa o comprovante na mesma transação.
4. Se o cliente fechar/atualizar antes de enviar o comprovante, nenhuma compra é criada e o carrinho
   permanece. O `CheckoutPage` de pacote virou captação de lead (sem pagamento).

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
  `COM_EDICAO` por padrão; `ENTREGA_DIRETA` está disponível para ensaios que não
  têm etapa de edição depois da seleção. A página mantém fallback de leitura para
  `DIRETO` apenas para linhas antigas não migradas.
- `GaleriaClientePage` passou a respeitar `modoGaleria`, `faseGaleria`, `requerEdicao`, `podeSelecionar`, `podeComprar` e `podeBaixar`.
- No modo `COM_EDICAO`, o cliente seleciona fotos do pacote (e extras no carrinho), envia a seleção e fica em modo leitura até a publicação da edição.
- No modo `ENTREGA_DIRETA`, o cliente seleciona, o staff aprova e o pacote é liberado com o arquivo já publicado na galeria (que pode ter sido editado antes do upload); extras só são liberados após a confirmação do pagamento.
- `FotoViewer`, `CartSummaryPanel` e `GaleriaGrid` recebem os flags de fase.
- Cada foto exibe `#número` e o nome do arquivo; a busca aceita ambos.
- `ecommerce.service.ts` expõe `enviarSelecao`, `selecaoAtiva`, `adminAlterarModoGaleria` e os endpoints administrativos de seleção/galeria.
- Em `SELECAO` (ambos os modos), extras são marcados com "Incluir extra" e o painel vira "Extras da seleção"; a compra só aparece em `COMERCIALIZACAO`.
- A seleção pode ser salva como rascunho antes do envio; após o envio, fica bloqueada.
- O envio da seleção **não recria** a sessão do carrinho quando o servidor a considera inválida: isso perderia os extras silenciosamente. O erro é mostrado e o cliente precisa recarregar/refazer o carrinho. Se a resposta vier com `quantidadeExtras` diferente do carrinho local, a UI avisa o cliente.
- `valoresExtras` (preço congelado por foto) é usado no grid, viewer e resumo do carrinho.
- O botão “Baixar pacote” do `GaleriaDock` aparece sempre que `downloadableFotos.length > 0`, inclusive nos fluxos `ENTREGA_DIRETA` e `DIRETO`.
- Favoritos e comparação foram removidos da galeria. O filtro **Extras** substitui o antigo filtro Favoritas e lista o que é extra para o cliente: fotos no carrinho, extras compradas/pendentes (`compraExtraId`/`PAGA`) e extras anexadas à seleção ativa (`emSelecaoEdicao`). O carrinho continua sendo a fonte do checkout; o filtro não some depois que o pagamento esvazia o carrinho.
- A galeria pública é mobile-first: header compacto com ícones, filtros fora do sticky, barra de ações fixa com safe-area no rodapé, grid de 2 colunas e rodapé fixo no visualizador.
- O `FotoViewer` suporta swipe horizontal (além de setas e teclado) e bloqueia o scroll do fundo enquanto está aberto.
- A experiência editorial usa `GaleriaHero` (capa + título + data + local), `GaleriaGrid` (grid alinhado, sem nome de arquivo/preço por foto), `GaleriaDock` e `GaleriaIntro` com copy por modo/fase.
- O endpoint público expõe `clienteNome`, `tituloHero`, `dataHoraEnsaio` e `requerEdicao` para personalizar o hero e o texto; `tituloHero` nulo/vazio faz o hero exibir o nome do cliente. A capa é manual (definida pelo staff) com fallback para `destaque` ou primeira foto.
- O texto do hero é editado por galeria na aba **Visão geral** do workspace administrativo (`GaleriaHeroTituloCard`) e salvo em `PUT /admin/agendamentos/{id}/galeria/titulo`.
- Quando o pacote está cheio, o check do grid dá lugar à sacola de extra; o clique abre o `GaleriaExtraDialog` para confirmar a inclusão, em vez de adicionar silenciosamente ao carrinho. Extras só ficam disponíveis depois que o pacote atinge o limite (ou quando a fase de seleção já foi fechada).
- O envio da seleção usa `GaleriaConfirmarSelecao`, que agrupa pacote/extras e aceita o campo `observacao` (já suportado pelo backend).
- Em `ENTREGA_DIRETA`, uma seleção aprovada (`PUBLICADA`) pode ser reaberta pelo admin enquanto nenhuma foto tiver sido baixada ou vendida. O backend expõe `podeReabrir` na seleção; a reabertura volta a galeria para `SELECAO` e cancela o snapshot aprovado, e o cliente envia uma nova seleção.
- O hero usa `capaUrl` (capa manual ou fallback) e faz preload com prioridade alta. A capa é escolhida em `AdminGaleriaPage` no modo “Escolher capa”; o backend congela a versão (`capaVersao`) e devolve a URL já versionada (`?v={fotoId}-{versao}`).
- A galeria pública revalida ao voltar para a aba (`visibilitychange`/`pageshow`) e a cada 60s, sem recarregar a página e sem apagar a seleção local em andamento.
- Quando o staff reabre uma seleção, o backend mantém `selecionadaPacote`: as fotos anteriores voltam como **rascunho** e o cliente vê o `GaleriaRascunhoBanner`. O progresso mostra “Rascunho · X de Y escolhidas” e o dock exibe “Salvar rascunho”/“Rascunho salvo”.
- Ao marcar a **última foto do pacote**, `GaleriaClientePage` dispara uma explosão de confete (`@/shared/lib/confetti`) **uma vez por carregamento da galeria**. O gatilho fica no evento de seleção (não em `useEffect`), então abrir uma galeria já completa não dispara. O efeito usa `canvas-confetti`, as cores do tema e respeita `prefers-reduced-motion`; o canvas não bloqueia cliques.
- Quando o pacote fica completo em `SELECAO`, `GaleriaPacoteCompletoAviso` conduz o cliente ao envio: banner na página, CTA compacto no `FotoViewer` (fecha o visualizador e abre `GaleriaConfirmarSelecao`) e badge “Pacote completo” no `GaleriaDock`. O CTA aparece sempre que a seleção está cheia, inclusive ao voltar para a galeria; não substitui o botão de remover do pacote.
- **Aviso de retenção**: `GaleriaAvisoRetencao` usa `DIAS_RETENCAO_FOTOS = 7` e aparece como card na galeria (após o intro), no card de espera pós-envio, no rodapé de `GaleriaConfirmarSelecao` e de forma compacta em “Minhas compras”. O texto informa que as fotos ficam disponíveis para download por 7 dias e que a galeria será encerrada depois. É uma comunicação da política do estúdio; o expurgo dos arquivos continua manual no painel de armazenamento (não existe job automático de 7 dias).
- O banner permite **“Limpar fotos do pacote”** com confirmação. A ação chama `DELETE /ecommerce/galeria/{token}/rascunho` e desmarca somente o pacote; os extras do carrinho permanecem.
- **Extras durante a seleção/edição**: em `SELECAO_ENVIADA`/`EM_EDICAO` (`COM_EDICAO`) e em `SELECAO_ENVIADA` (`ENTREGA_DIRETA`) a sacola continua disponível. O extra entra no snapshot da seleção ativa (backend), o total é calculado no carrinho e o pagamento PIX pode ser feito nessa fase.
- **Extras após a publicação (COM_EDICAO)**: fotos restantes aparecem com o selo **“A editar”** e podem ser compradas. Após o pagamento, `MinhasComprasSection` mostra **“Aguardando edição”** até o estúdio liberar a versão editada; o download só aparece com `versaoAtual = EDITADA`.
- **Extras após a aprovação (ENTREGA_DIRETA)**: o extra é baixado com o arquivo já publicado assim que o pagamento é confirmado, sem passar pela fila de edição.
- `isDownloadable`/`podeBaixarEsta` exigem `versaoAtual = EDITADA` apenas no modo `COM_EDICAO`, evitando liberar download de extra ainda não editado; em `ENTREGA_DIRETA` o arquivo publicado é o entregável.
- `GaleriaTimeline` e `GaleriaIntro` adaptam as etapas e o texto quando `requerEdicao = false` (“Aprovação”/“Liberada”).
- O `CartSummaryPanel` mostra “Extras da seleção” durante a seleção/edição e “Meu Carrinho” na comercialização, com aviso de quando a compra será liberada.
- **PIX do e-commerce**: a chave é global e somente `ADMIN` altera. O controle fica no workspace da galeria (aba Visão geral, `GaleriaPagamentoPixCard`) e em Pedidos → Ecommerce. `MinhasComprasSection` exibe a chave atual para compras PIX pendentes, com botão de copiar; a chave não é congelada na compra, então correções do staff aparecem no polling/“Atualizar”.
- As prévias públicas usam o endpoint de watermark em resolução reduzida (**800px**, JPEG ~0.60), com marca d'água da contratada. A UI bloqueia menu de contexto, arraste, seleção e callout de toque longo; o visualizador usa `<img>` com overlay para dificultar salvar a imagem.
- No visualizador, toque/clique alterna o zoom (2,5x no ponto tocado), a pinça ajusta a escala continuamente (até 4x) e o arrasto move a imagem. O swipe horizontal só navega entre fotos quando a imagem está em 1x.
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
- **Sem fotos no CRM**: galerias com 0 fotos ficam fora da fila por padrão (as fotos podem ter sido entregues por outro canal). O link “Mostrar galerias sem fotos (N)” usa `semFotos=true` e o contador `semFotosNoCrm` do resumo.
- **Etapas novas**: `COMPRA_EXTRA_PENDENTE` (compra aguardando comprovante/aprovação, com contadores separados por item) e `CLIENTE_BAIXOU` (todas as fotos do pacote baixadas; terminal, fora de “Atrasadas”). A visão geral do workspace mostra o card “Baixadas pelo cliente”.
- Cada item mostra etapa, dias na etapa, prazo do pacote, contadores de fotos/seleção/extras, pendências (compra a aprovar, aguardando comprovante, extra a editar, link expirado) e a **próxima ação** com deep link para o workspace (`?tab=fotos|selecao|compras|visao`).
- O botão de copiar leva a **mensagem completa** de envio ao cliente (`GET /admin/galerias/mensagem-link`), com o link da galeria e as redes sociais configuradas em `app.social.*`; quando o token expirou, a fila oferece **Novo link** (`adminRegenToken`).
- **Vendas** reutiliza `AdminEcommercePage` com `embedded` (sem `PageTitle`), mantendo compras, confirmação, cancelamento, link de cartão e configuração de PIX.
- Hooks em `api/queries.ts` (`useGaleriaPipeline`, `useGaleriaPipelineResumo`) invalidam por `refetchInterval` de 60s.
- O endpoint público de etapa (`GET /ecommerce/galeria/{token}/status`) alimenta o **acompanhamento do cliente**:
  - `/g/:token` sem fotos publicadas mostra `GaleriaEmPreparacao` (etapa com label de cliente, mensagem, pacote/data, linha do tempo e previsão) em vez da tela vazia; o botão “Atualizar” reconsulta sem derrubar a tela para skeleton.
  - com fotos, o `GaleriaIntro` exibe a previsão de entrega quando o ensaio ainda não foi entregue.
  - `/minha-conta` busca o status por ensaio em background, libera a lista antes dos status e mostra a etapa real, a previsão e o botão **Acompanhar ensaio** mesmo sem fotos publicadas.
  - A timeline adapta “Edição” para “Aprovação” no modo `ENTREGA_DIRETA` e sinaliza previsão vencida.

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

## 11. Compra de extras após o envio da seleção

- `GaleriaClientePage` usa `podePagarExtras` (novo campo da galeria) para liberar o checkout de extras
  em `SELECAO_ENVIADA`/`EM_EDICAO`; em `SELECAO` o botão fica desabilitado com a mensagem
  “Envie sua seleção para liberar o pagamento das extras”.
- O carrinho deixou de ser derivado de `fotos`: `GaleriaClientePage` guarda `CarrinhoItemResponse[]`
  e `CartSummaryPanel` renderiza os itens reais do servidor. Isso evita botão desabilitado quando a
  foto saiu da lista pública (oculta/PAGA) e permite remover o item.
- `carrinhoCount` é derivado de `carrinhoItens.length`; após cada mutação o frontend recarrega o
  carrinho para reconciliar com a sessão assinada.
- O checkout é somente PIX e tem **uma única finalização**: o `CheckoutDialog` mostra total + chave
  PIX + comprovante e o botão “Enviar comprovante e finalizar”. Não existe mais “Finalizar via PIX”
  antes do comprovante.
- `ecommerceService.checkoutPix()` envia `multipart/form-data` para `/checkout-pix`; a compra só é
  criada (e o carrinho limpo) junto com o comprovante. Fechar/atualizar antes disso mantém o carrinho.
- Após `enviarSelecao` com extras, o diálogo PIX abre automaticamente; fechar sem enviar o
  comprovante não cria compra.
- `MinhasComprasSection` recebe `refreshKey` e busca a compra recém-criada.
- CRM: `useGaleriaWorkspace` marca como `EXTRA` também as fotos com `compraExtraId`/`PAGA` fora da
  seleção; a aba Seleção mostra selo “Pago/Aguardando pagamento/A pagar” nas extras.
- `ExtrasCompraPendentesSection` não duplica extras da seleção ativa (backend filtra
  `emSelecaoEdicao = false`).

## 12. Leads de pacotes

- `CheckoutPage` virou captação de lead: dados do cliente, entrega, forma de pagamento de interesse,
  extras (passo 1) e observação; envia `POST /ecommerce/leads` e não simula pagamento.
- `AdminLeadsPage` (`/admin/leads`) lista leads, filtra por status, atualiza o status e oferece
  contato por WhatsApp. Rota/menu para ADMIN/FOTOGRAFO/AGENDADOR.
