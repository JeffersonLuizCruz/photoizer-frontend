# Módulo: Fotos

## 1. Responsabilidade
Gerencia as fotos de um agendamento no contexto administrativo — upload, publicação na galeria, edição de metadados (título, tags, categoria, destaque), substituição de imagem e controle de visibilidade/status.

## 2. Estrutura Interna
```
features/fotos/
├── index.ts                          # Barrel: AdminGaleriaPage
├── types/foto.types.ts               # Re-exporta FotoEnsaio de @/features/ecommerce/types
├── services/foto.service.ts          # HTTP: 9 métodos (CRUD fotos + metadados)
├── api/queries.ts                    # 9 hooks: 2 queries + 7 mutations
├── pages/
│   └── AdminGaleriaPage.tsx          # Galeria admin com grid, upload, edição de metadados
└── components/                       # (vazio — FotoMetadataDialog é inline na page)
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
3. Upload permite adicionar fotos se status do agendamento for compatível (`EM_EDICAO`, `SELECAO_DAS_FOTOS`, etc.).
4. Grid de fotos com thumbnail, status badge, visibilidade, categoria, destaque.
5. Ações por foto: editar metadados (diálogo inline), publicar/despublicar, toggle visibilidade, substituir imagem, deletar.

### Fluxo 2: Edição de Metadados
1. `FotoMetadataDialog` (inline) permite editar: título, tags, categoria, destaque.
2. Submit → `useUpdateFotoMetadata()` → invalida query → atualiza grid.

## 5. Regras Específicas
1. **Upload condicional por status**: A área de upload só aparece se o agendamento estiver em um conjunto específico de status (edição/seleção/entrega/finalizado).
2. **Link de galeria pública**: Gera URL `${window.location.origin}/g/${tokenGaleria}` e copia para clipboard.
3. **Re-export de tipo**: `foto.types.ts` apenas re-exporta `FotoEnsaio` de `@/features/ecommerce` — não define tipos próprios.

## 6. Testes
Não existes testes para este módulo.

## 7. Pontos de Atenção
- **Violação de isolamento**: O tipo `FotoEnsaio` é importado de `@/features/ecommerce/types`. Este tipo deveria estar em `shared/types/`, já que é usado por múltiplas features (fotos, ecommerce, agenda indiretamente).
- **`components/` vazio**: O único componente (`FotoMetadataDialog`) está definido inline na página — não reutilizável.
- **Re-export desnecessário**: `foto.types.ts` existe apenas para re-exportar. `AdminGaleriaPage.tsx` importa direto do ecommerce em vez de usar o re-export local.
- **Módulo pequeno e focado**: 5 arquivos, 1 página, 9 hooks bem organizados em `api/queries.ts`.
