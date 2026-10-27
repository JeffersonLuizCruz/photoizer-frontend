# Módulo: Armazenamento

## 1. Responsabilidade
Painel administrativo (ADMIN) que mede o consumo de disco do diretório de
uploads, mostra o espaço livre do volume e lista as galerias por consumo para
orientar a liberação de espaço.

A operação de expurgo (apagar arquivos de uma galeria finalizada) usa os mesmos
dados desta tela e está disponível no diálogo **Liberar espaço**.

## 2. Estrutura Interna
```
features/armazenamento/
├── index.ts                                   # Barrel: ArmazenamentoPage
├── types/armazenamento.types.ts               # Resumo, galeria, resultado e motivos de bloqueio
├── services/armazenamento.service.ts          # HTTP: resumo, galerias, galeria, expurgar, manifestoUrl
├── api/queries.ts                             # useArmazenamentoResumo, useGaleriasArmazenamento, useGaleriaArmazenamento, useExpurgarGaleria
├── pages/
│   └── ArmazenamentoPage.tsx                  # Página /admin/armazenamento
└── components/
    ├── ResumoArmazenamentoCards.tsx           # Cards por tipo de arquivo + barra do volume
    ├── GaleriasArmazenamentoTable.tsx         # Tabela (desktop) e cards (mobile)
    └── ExpurgarGaleriaDialog.tsx              # Confirmação com digitação + manifesto CSV
```

## 3. Dependências Externas

### Bibliotecas
- `@tanstack/react-query` — queries com polling de 60s
- `react-router-dom` — link para o workspace da galeria
- `date-fns` + `date-fns/locale` — datas em pt-BR
- `lucide-react` — ícones

### Módulos internos (shared)
- `@/shared/api` — `apiClient` e `extractErrorMessage`
- `@/shared/components/layout` — `PageTitle`, `PageLoading`, `EmptyState`
- `@/shared/components/ui` — `Button`, `Input`, `Badge`, `Table`, `Card`
- `@/shared/lib/bytes` — `formatarBytes`, `formatarPercentual`
- `@/shared/constants` — `ROUTES.ARMAZENAMENTO`

## 4. Fluxos Principais

### Fluxo 1: Medição
1. `ArmazenamentoPage` chama `GET /api/v1/admin/armazenamento/resumo` e
   `GET /api/v1/admin/armazenamento/galerias`.
2. Os cards mostram consumo total, originais, derivados/editadas, documentos,
   espaço usado/livre e percentual do volume.
3. Acima de 80% de uso, um aviso orienta a expurgar galerias finalizadas.

### Fluxo 2: Análise por galeria
1. A lista é ordenada pelo backend do maior para o menor consumo.
2. Filtros: todas, elegíveis (ensaio finalizado e sem pendências) e arquivadas.
3. Busca por nome do cliente (sem diferenciar acentos/maiúsculas).
4. O nome da galeria abre `/agenda/:id/fotos`.

## 5. Regras Específicas
1. **Somente ADMIN**: a rota usa `ProtectedRoute allowedRoles={ROLES_ADMIN}` e
   o item do menu declara `roles: ['ADMIN']`.
2. **Estado de arquivamento é derivado**: a galeria só é "arquivada" quando tem
   fotos e todas já tiveram os arquivos expurgados.
3. **Bloqueios exibidos**: `NAO_FINALIZADO`, `JA_ARQUIVADA` e `PENDENCIA`
   (seleção ativa ou compra aguardando comprovante/confirmação).
4. **Nenhuma ação destrutiva fora do diálogo**: "Liberar espaço" abre o
   `ExpurgarGaleriaDialog`, exige digitar `EXPURGAR` e oferece o manifesto CSV.
   O backend reforça todas as regras (ensaio finalizado, pendências e
   `arquivosRemovidos`).

## 6. Testes
- E2E (`e2e/armazenamento.spec.ts`): cards/tabela, elegibilidade, confirmação
  com `EXPURGAR`, envio do POST, análise/limpeza de órfãos e tela de galeria
  arquivada (410).

## 7. Arquivos órfãos e dashboard

- O card **Arquivos órfãos** (`ArquivosOrfaosCard`) analisa sob demanda
  (`GET /admin/armazenamento/orfaos`) e limpa apenas os elegíveis
  (`POST .../orfaos/limpar`). A lista mostra os 20 maiores; o backend limita a
  200 e informa quando truncou.
- Badges: **Elegível** (reconhecido e >24h), **Recente** (reconhecido, mas novo)
  e **Desconhecido** (nunca apagado).
- O dashboard (ADMIN) usa `ArmazenamentoResumo` de `shared/types` e o endpoint
  `/admin/armazenamento/resumo` para exibir o card de volume, com alerta a
  partir de 80% e link para esta página.
