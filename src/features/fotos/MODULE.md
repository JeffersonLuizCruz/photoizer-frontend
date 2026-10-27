# Módulo: Fotos

## 1. Responsabilidade
Gerencia as fotos de um agendamento no contexto administrativo — upload, publicação na galeria, edição de metadados (título, tags, categoria, destaque), substituição de imagem e controle de visibilidade/status.

## 2. Estrutura Interna
```
features/fotos/
├── index.ts                          # Barrel: AdminGaleriaPage + workspace
├── types/foto.types.ts               # Re-exporta FotoEnsaio de @/features/ecommerce/types
├── services/foto.service.ts          # HTTP: 13 métodos (CRUD fotos + metadados + lote + comentários)
├── api/queries.ts                    # Hooks: fotos, seleções, workspace e mutations
├── pages/
│   ├── AdminGaleriaWorkspacePage.tsx # Workspace único (Visão geral/Fotos/Seleção/Compras)
│   ├── AdminGaleriaPage.tsx          # Aba Fotos (grid, upload, capa, metadados)
│   └── AdminSelecoesPage.tsx         # Aba Seleção + fila /admin/selecoes
└── components/
    └── galeria-admin/
        ├── GaleriaVisaoGeral.tsx     # Cards e stepper da galeria
        └── GaleriaComprasPanel.tsx   # Compras de extras e confirmações
```

## 3. Dependências Externas

### Bibliotecas
- `@tanstack/react-query` — hooks useQuery/useMutation
- `react-router-dom` — navegação
- `lucide-react` — ícones
- `sonner` — toasts
- `axios` (via `@/shared/api`) — requisições HTTP

### Módulos internos (shared)
- `@/shared/api` — `apiClient`
- `@/shared/constants` — `ROUTES`, `AGENDAMENTO_STATUS`, `AgendamentoStatus`
- `@/shared/components/layout/*` — PageTitle, PageLoading, ConfirmDialog
- `@/shared/components/ui/*` — button, AuthImage, dialog, input, label, checkbox, select

### Outras features (⚠️ violação da regra de isolamento)
- `@/features/ecommerce/types/ecommerce.types` — `FotoEnsaio` (foto.types.ts e AdminGaleriaPage.tsx)

## 4. Fluxos Principais

### Fluxo 1: Admin — Gerenciamento de Fotos
1. Admin acessa `/agenda/:agendamentoId/fotos` → `AdminGaleriaPage`.
2. Carrega agendamento (`useAgendamento`) e lista de fotos (`useFotosList`).
3. Upload e publicação liberados após o pagamento final, quando o status do agendamento for `EM_EDICAO` ou `FINALIZADO`.
4. Upload em **lotes de ~50MB/5 arquivos** (`fotoService.upload`), enviados em sequência com timeout próprio (`VITE_UPLOAD_TIMEOUT`, default 10 min). A tela mostra progresso por lote.
5. Em falha no meio, os lotes já enviados permanecem salvos e a seleção mantém **apenas os arquivos restantes** (evita duplicar no retry).
6. Grid de fotos com thumbnail, status badge, visibilidade, categoria, destaque.
7. Ações por foto: editar metadados (diálogo inline), publicar/despublicar, toggle visibilidade, substituir imagem, deletar.
8. **Seleção em lote**: botão "Selecionar fotos" ativa checkboxes nos cards; a barra de ações permite selecionar todas, limpar e remover as selecionadas com confirmação. A remoção é atômica via `POST /agendamentos/{id}/fotos/remover-lote`.
9. **Fotos protegidas**: fotos com `compraExtraId`, `selecionadaPacote`, `emSelecaoEdicao`, `temVersaoEditada`, `downloadada` ou status `PAGA`/`AGUARDANDO_*` não podem ser selecionadas, removidas, despublicadas, ocultadas ou substituídas (ícone de cadeado), para preservar download, carrinho e histórico do cliente. Exibir uma foto oculta continua permitido.

### Fluxo 2: Edição de Metadados
1. `FotoMetadataDialog` (inline) permite editar: título, tags, categoria, destaque.
2. Submit → `useUpdateFotoMetadata()` → invalida query → atualiza grid.

## 5. Regras Específicas
1. **Upload condicional por status**: A área de upload só aparece se o agendamento estiver em um conjunto específico de status (edição/seleção/entrega/finalizado).
2. **Link de galeria pública**: Gera URL `${window.location.origin}/g/${tokenGaleria}` e copia para clipboard.
3. **Re-export de tipo**: `foto.types.ts` apenas re-exporta `FotoEnsaio` de `@/features/ecommerce` — não define tipos próprios.

## 6. Testes
Não existes testes para este módulo.

## 7. Seleção, numeração e edição

- `AdminGaleriaPage` exibe `#número` + nome do arquivo e permite renumerar a galeria. O modo da galeria (`COM_EDICAO`/`SEM_EDICAO`) é escolhido na Visão geral do workspace; `DIRETO` permanece apenas como leitura legada.
- `AdminSelecoesPage` (`/agenda/:id/selecoes` e `/admin/selecoes`) lista a fila de seleções, mostra número/nome das fotos, baixa o ZIP de originais e envia versões editadas (individual ou em lote) no modo `COM_EDICAO`. No modo `SEM_EDICAO`, o botão vira **Aprovar seleção** e não exige edição.
- O upload editado usa `fotoService.uploadEditada` e mantém o número/nome original.
- Em `COM_EDICAO`, a publicação exige 100% dos itens editados; em `SEM_EDICAO`, a aprovação não exige itens editados.
- Em `SEM_EDICAO`, o botão **Reabrir seleção** continua disponível para a seleção aprovada enquanto `selecao.podeReabrir` for verdadeiro (sem download/venda). Em `COM_EDICAO`, a seleção publicada permanece imutável.
- Estados exibidos: `ENVIADA`, `EM_EDICAO`, `CONCLUIDA`, `PUBLICADA`, `CANCELADA`.
- Após reabrir, a seleção vira `CANCELADA`: a página mostra o histórico e aguarda uma nova seleção; upload/publicação/reabertura só ficam disponíveis para seleções ativas.
- O upload em lote continua após erros individuais, aceita sufixos `-edit`/`-editada` e também casa pelo `fotoId`.
- `AdminGaleriaPage` tem o modo **“Escolher capa”**: o staff clica na foto que deve ir ao topo da galeria do cliente. A capa atual aparece na Visão geral; o toolbar tem **Escolher/Remover capa** e o menu de ações tem **Usar como capa**.
- A capa é salva via `PUT /admin/agendamentos/{id}/galeria/capa`; fotos já publicadas/selecionadas continuam protegidas normalmente. `AGENDADOR` não altera a capa. Fotos ocultas/não publicadas aparecem como “Indisponível para capa”.
- **Galeria arquivada (V17)**: fotos com `arquivosRemovidos` exibem o placeholder “Arquivos expurgados”, entram em `fotoProtegida` (não podem ser selecionadas, removidas, substituídas ou ter status/visibilidade alterados) e não podem ser capa. A galeria mostra o aviso de arquivamento com link para `/admin/armazenamento`; upload, publicar, renumerar e “Escolher capa” ficam ocultos.

## 8. Pontos de Atenção
- **Violação de isolamento**: O tipo `FotoEnsaio` é importado de `@/features/ecommerce/types`. Este tipo deveria estar em `shared/types/`, já que é usado por múltiplas features (fotos, ecommerce, agenda indiretamente).
- **Componentes de galeria**: `FotoMetadataDialog` continua inline em `AdminGaleriaPage`; os componentes do workspace estão em `components/galeria-admin/`.
- **Re-export desnecessário**: `foto.types.ts` existe apenas para re-exportar. `AdminGaleriaPage.tsx` importa direto do ecommerce em vez de usar o re-export local.
- **Workspace em evolução**: a Fase 1 unifica navegação e visão geral; a Fase 2 adiciona filtros, selos e menu de ações na grade. As fases seguintes separam pacote/extras na aba Seleção, refinam compras e removem duplicações com `EcommerceAdminResumo`.

## 9. Workspace administrativo da galeria (Fase 1)

- `/agenda/:id/fotos` agora renderiza `AdminGaleriaWorkspacePage`, com as abas **Visão geral**, **Fotos**, **Seleção** e **Compras**.
- `/agenda/:id/selecoes` redireciona para `/agenda/:id/fotos?tab=selecao`, preservando links antigos. `/admin/selecoes` continua como fila de seleções pendentes.
- A aba **Visão geral** mostra cliente/pacote, link da galeria, seletor de modo (ADMIN), stepper da fase adaptado a `COM_EDICAO`/`SEM_EDICAO`, cards de total/publicadas/**no pacote**/**extras**/aguardando edição ou aprovação/compras pendentes e os atalhos para as abas Fotos, Seleção e Compras.
- A Visão geral também exibe o card **Pagamento PIX** (`GaleriaPagamentoPixCard`): chave/tipo atuais, aviso de que a chave é global para todas as galerias e botão **Editar PIX** apenas para `ADMIN` (reutiliza `AdminPagamentoConfigDialog`). Os demais papéis veem a chave em modo leitura.
- A aba **Fotos** renderiza `AdminGaleriaPage` diretamente, sem `PageTitle` duplicado, com barra de ações (selecionar, capa, renumerar, publicar) e upload compacto.
- A aba **Seleção** renderiza `AdminSelecoesPage` diretamente: mostra pacote e extras com o selo `Extra`, permite baixar originais, enviar editadas, reabrir e publicar em `COM_EDICAO`; em `SEM_EDICAO` permite reabrir e **aprovar** a seleção (sem upload de editadas).
- A aba **Compras** (`GaleriaComprasPanel`) lista compras de extras, permite confirmar/recusar pagamento e definir link de cartão. Visível para `ADMIN` e `FOTOGRAFO`. É o único lugar de gestão de compras; a aba Ecommerce do agendamento virou resumo com CTAs.
- O menu de ações da foto (aba Fotos) tem **Incluir/Remover do pacote** para `ADMIN`/`FOTOGRAFO` quando a seleção está editável (`DIRETO` ou fase `SELECAO`), preservando o override que existia na grade antiga do Ecommerce.
- A contagem de **favoritos por foto** (que aparecia na grade antiga do Ecommerce) agora é exibida na faixa de informações do card na aba Fotos, usando `favoritosPorFoto` do resumo.
- `useGaleriaWorkspace` agrega fotos, configuração da galeria, seleções e resumo do e-commerce com os mesmos query keys dos hooks existentes, evitando chamadas duplicadas.
- O botão **Atualizar** no workspace refaz as queries; a aba Seleção tem atualização própria e invalida `fotos`, `selecoes-ensaio`, `galeria-ensaio` e `admin-ecommerce` após upload/publicação/reabertura.
- As queries administrativas fazem polling de 60s (quando a aba está ativa) para refletir envio de seleção/compras feitas pelo cliente.
- A miniatura usa `fotoThumbUrl()` (`?v={editadaEm|updatedAt}`) para o `AuthImage` refazer a busca após edição/substituição; o `AuthImage` carrega sob demanda via `IntersectionObserver` (exceto `priority`, usado na capa).
- **Papéis**: `ADMIN` vê tudo; `FOTOGRAFO`/`EDITOR` gerenciam fotos e seleção; `AGENDADOR` não acessa a galeria (rota protegida por `ROLES_SEM_AGENDADOR`). A aba Compras fica restrita a `ADMIN`/`FOTOGRAFO`.
- **Mobile-first**: abas roláveis, cards em 2 colunas e ações em barras que quebram linha, sem depender de hover.

## 10. Grade de fotos (Fase 2)

- A aba **Fotos** recebe `tipoPorFoto` do workspace e mostra os selos **Pacote** (azul) e **Extra** (laranja) sobre a miniatura e na faixa de informações.
- Barra de filtros com busca por número (`#003`)/nome/título/tag, categoria e chips:
  **Todas**, **Pacote**, **Extras**, **Sem seleção**, **Em edição**, **Publicadas**, **Inéditas** e **Ocultas**, com contadores.
- A seleção em lote respeita o filtro atual: “Selecionar todas” marca apenas as fotos visíveis no filtro (exceto protegidas).
- As ações por foto deixaram de ser uma fileira de botões sobre a imagem e passaram para um **menu “...”** que abre um `Sheet` (bottom sheet no mobile, lateral no desktop):
  editar metadados, publicar/despublicar, ocultar/exibir, comentários, substituir imagem, usar como capa e remover.
- Comentários não lidos aparecem como badge no botão de ações.
- Status traduzidos (`Paga`, `Aguard. comprovante`, `Aguard. confirmação`) e badges de proteção/capa.
- O menu é acessível por toque, com alvos de 44px no mobile, sem depender de hover.
- Quando já existem fotos, a área de upload vira uma barra compacta (“Enviar fotos”) que abre o seletor direto; o dropzone completo aparece quando não há fotos ou ao expandir.
- A capa é exibida na Visão geral e gerenciada pelo toolbar (“Escolher capa”/“Remover capa”) e pelo menu de ações (“Usar como capa”); a aba Fotos não repete o painel de capa.
- O bloco “Fluxo da galeria” (com o seletor de modo) aparece na aba Fotos apenas para `ADMIN`; para os demais o contexto fica na Visão geral.
- “Publicar Galeria” some quando todas as fotos já estão publicadas, pagas ou aguardando pagamento.

## 11. Aba Seleção (Fase 3)

- A seleção atual é exibida em duas seções: **Fotos do pacote** e **Fotos extras**, cada uma com contador, progresso de edição e barra própria.
- A seção de extras mostra o **valor congelado por foto** e o **total dos extras**.
- O resumo da seleção mostra status, data de envio, pacote, extras, editadas/total e uma barra de progresso geral; abaixo, o aviso “Faltam X foto(s) para liberar a publicação”.
- **Upload individual** por card: “Enviar editada”/“Substituir editada”, com estado “Enviando...” e data da última edição.
- **Upload em lote** com progresso dedicado; o matching continua por nome normalizado, `fotoId` ou número da galeria. Falhas individuais não interrompem o lote.
- Para seleções **publicadas/canceladas**, os cards ficam somente leitura (“Editada”/“Aguardando edição”) e as ações de upload/publicação/reabertura somem.
- O **histórico** lista seleções anteriores (incluindo canceladas) e abre um `Sheet` com status, observação, seções de pacote/extras e os cards de cada foto. O histórico também aparece quando não há seleção ativa.

## 12. Extras comprados com edição sob demanda

- A aba **Seleção** e a fila `/admin/selecoes` mostram a seção
  `ExtrasCompraPendentesSection`: compras `PAGA` com fotos em
  `versaoAtual = ORIGINAL` (extras compradas depois da publicação).
- Cada card permite **Enviar edição** (`PUT .../editada-compra`) e, após o
  upload, **Liberar edição** (`POST .../editada-compra/publicar`). A liberação
  troca `versaoAtual` para `EDITADA` e habilita o download no cliente.
- A fila consulta `GET /api/v1/admin/ecommerce/extras/pendentes-edicao` e é
  acessível a `ADMIN`, `FOTOGRAFO` e `EDITOR`, mantendo a edição no workspace
  de fotos (a aba Compras continua restrita a `ADMIN`/`FOTOGRAFO`).
- A seção some quando não há pendências e exibe erro com retry quando a
  consulta falha.

## 13. Polimento e estados (Fase 5)

- **Loading**: skeleton na grade de fotos, spinner na visão geral/compras e `PageLoading` na seleção.
- **Erro + retry**: visão geral, grade de fotos, seleção, compras e resumo Ecommerce mostram mensagem amigável e “Tentar novamente” (React Query `refetch` ou `carregar`).
- **Vazio**: sem fotos, filtro sem resultado, seção sem itens, sem seleção ativa e sem compras têm estados próprios, sem tela em branco.
- **Acessibilidade**: chips de filtro com `aria-pressed`, botões de ícone com `aria-label`, foco visível nos controles customizados (chips, menu da foto, ações do sheet, histórico e tabela de compras), alvos de 44px no mobile e títulos em todos os `Sheet`.
- **Código morto removido**: `AdminGaleriaPage` e `AdminSelecoesPage` deixaram de ter os ramos não embutidos/`PageTitle` antigos; o workspace é o único ponto de entrada.
- **E2E**: `e2e/galeria-admin.spec.ts` cobre visão geral, filtros/ações da aba Fotos, seções/histórico da aba Seleção, aba Compras e estado de erro com retry, sempre checando overflow horizontal no mobile. A suíte completa (`npx playwright test`) permanece verde.
