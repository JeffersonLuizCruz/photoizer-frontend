# Módulo: Edição

## 1. Responsabilidade
Gerencia o fluxo de edição de fotos — upload de RAW, workspace de edição, revisão/aprovação de fotos editadas e publicação na loja (e-commerce). Conecta fotógrafos (enviam RAW) e editores (editam e devolvem).

## 2. Estrutura Interna
```
features/edicao/
├── index.ts                          # Barrel: EdicaoListPage, UploadRawPage, EdicaoGaleriaPage, EdicaoRevisaoPage
├── types/index.ts                    # StatusEdicao, StatusFotoEdicao, EdicaoProcesso, FotoEdicao, ZipJob
├── utils/edicao.utils.ts             # formatEdicaoStatus — label humano para status
├── services/edicao.service.ts        # HTTP: 13 métodos (CRUD processos + fotos + ZIP)
├── api/queries.ts                    # 12 hooks: 3 queries + 9 mutations (query key factory)
├── components/
│   ├── EdicaoGaleriaGrid.tsx         # Grid de fotos com ações (download, reorder, delete)
│   ├── EdicaoRevisaoGrid.tsx         # Comparação lado a lado RAW vs Editado + approve/reject
│   ├── EdicaoStatusBadge.tsx         # Badge de status do processo
│   ├── EdicaoUploader.tsx            # Upload drag-and-drop com preview e progresso
│   └── FotoEdicaoStatusBadge.tsx     # Badge de status da foto
└── pages/
    ├── EdicaoListPage.tsx            # Lista de processos com filtro por status
    ├── UploadRawPage.tsx             # Upload de RAW (com progress tracking)
    ├── EdicaoGaleriaPage.tsx         # Workspace de edição (upload editadas, concluir, publicar)
    └── EdicaoRevisaoPage.tsx         # Revisão e aprovação de fotos editadas
```

## 3. Dependências Externas

### Bibliotecas
- `@tanstack/react-query` — hooks useQuery/useMutation (centralizado em api/queries.ts)
- `react-router-dom` — navegação
- `lucide-react` — ícones
- `sonner` — toasts
- `axios` (via `@/shared/api`) — requisições HTTP

### Módulos internos (shared)
- `@/shared/api` — `apiClient`
- `@/shared/components/ui/*` — button, badge, textarea, AuthImage, alert-dialog, skeleton, tabs
- `@/shared/components/layout/*` — PageTitle, PageLoading, EmptyState
- `@/shared/lib/cn` — merge de classes Tailwind

### Outras features (⚠️ violação da regra de isolamento)
- `@/features/auth/AuthProvider` — `useAuth` (em `EdicaoListPage.tsx` e `EdicaoGaleriaPage.tsx`)

## 4. Fluxos Principais

### Fluxo 1: Upload de RAW (Fotógrafo)
1. Fotógrafo acessa `/edicao/:agendamentoId/upload-raw` → `UploadRawPage`.
2. Arrasta/sol arquivos RAW no `EdicaoUploader`.
3. Upload com progress tracking via `edicaoService.uploadRawWithProgress()` (uso direto do service, bypassando o hook).
4. Status do processo avança para `RAW_ENVIADOS`.

### Fluxo 2: Workspace de Edição (Editor)
1. Editor acessa `/edicao/:agendamentoId` → `EdicaoGaleriaPage`.
2. Visualiza fotos RAW no `EdicaoGaleriaGrid`.
3. Envia fotos editadas via `EdicaoUploader` → `useUploadEditadas()`.
4. Gerencia observações, reordenação, exclusão de fotos.
5. Conclui edição → `useConcluirEdicao()` → status `EDICAO_CONCLUIDA`.
6. Publica no e-commerce → `usePublicarNoEcommerce()`.

### Fluxo 3: Revisão e Aprovação (Admin/Fotógrafo)
1. Admin acessa `/edicao/:agendamentoId/revisao` → `EdicaoRevisaoPage`.
2. `EdicaoRevisaoGrid` mostra RAW vs Editado lado a lado.
3. Aprova/rejeita cada foto com comentário opcional.
4. Salva individualmente ou "Salvar tudo".
5. Botão "Publicar na Loja" → `usePublicarLoja()` → fotos vão para o e-commerce.

### Fluxo 4: Listagem de Processos
1. `EdicaoListPage` com tabs de filtro (Todos, Aguardando RAW, RAW Enviados, Em Edição, Concluídos).
2. Cards com botões de ação por status (Upload RAW, Abrir Workspace, Revisar).
3. Visibilidade baseada em papel: admin/fotógrafo vê upload RAW, admin/editor vê workspace.

## 5. Regras Específicas
1. **Query Key Factory**: Usa padrão `EDICAO_KEYS` com `all`, `list(status?)`, `agendamento(id)`, `fotos(id)` para consistência.
2. **UploadRawPage bypassa hook**: Usa `edicaoService.uploadRawWithProgress()` diretamente em vez de `useUploadRaw` mutation, porque o hook não suporta progress tracking.
3. **Duas mutations de publicação**: `usePublicarLoja` e `usePublicarNoEcommerce` chamam endpoints diferentes (`/publicar-loja` e `/publicar`) — parece haver dois fluxos de publicação ou artefato de refatoração.
4. **Componente de upload reutilizável**: `EdicaoUploader` é o único uploader drag-and-drop do sistema, com preview, progresso e validação de arquivos.

## 6. Testes
Não existem testes para este módulo.

## 7. Pontos de Atenção
- **Violação de isolamento**: `EdicaoListPage` e `EdicaoGaleriaPage` importam `useAuth` de `@/features/auth/AuthProvider`. O contexto de auth é tratado como cross-cutting no projeto inteiro (também usado em Header, Sidebar, interceptors, rotas), o que sugere que ele deveria estar em `shared/providers` em vez de `features/auth`.
- **`usePublicarLoja` vs `usePublicarNoEcommerce`**: Duas mutations com comportamento similar — possível dead code ou endpoints distintos não documentados.
- **`UploadRawPage` bypassa camada de queries**: Usa `edicaoService` diretamente em vez do hook `useUploadRaw`, quebrando o padrão de centralização.
- **Role check com string `'FOTOGRAFA'`**: Em `PacoteForm` há verificação para `'FOTOGRAFA'` e `'FOTOGRAFO'`, mas em `EdicaoListPage` a verificação é presumivelmente apenas `'FOTOGRAFO'` — inconsistência de gênero.
- **Sem schemas/**: Não há Zod schemas (aceitável, pois não há formulários — apenas upload de arquivos).
