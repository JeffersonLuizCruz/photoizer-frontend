# Módulo: Comissões

## 1. Responsabilidade
Gerencia comissões de indicação (indicação de clientes). Permite consultar comissões por indicador, listar indicadores cadastrados e gerenciar (CRUD) indicadores.

## 2. Estrutura Interna
```
features/comissoes/
├── index.ts                          # Barrel: ComissoesConsultaPage
├── types.ts                          # IndicacaoResponse, ConsultaComissoesResponse, IndicadorListagem, IndicadorRequest, IndicadorResponse
├── services/
│   ├── comissoes.service.ts          # HTTP: consultar (por telefone), listarIndicadores
│   └── indicador.service.ts          # HTTP: CRUD indicadores (listar, criar, atualizar, remover)
├── pages/
│   └── ComissoesConsultaPage.tsx     # Lista de indicadores com expansão e detalhes
└── components/
    └── IndicadorDialog.tsx           # Diálogo criar/editar indicador
```

## 3. Dependências Externas

### Bibliotecas
- `@tanstack/react-query` — useQuery, useMutation (inline)
- `react-router-dom` — navegação
- `lucide-react` — ícones
- `sonner` — toasts
- `axios` (via `@/shared/api`) — requisições HTTP

### Módulos internos (shared)
- `@/shared/api` — `apiClient`
- `@/shared/components/layout/PageTitle` — título de página
- `@/shared/components/ui/*` — button, input, label
- `@/shared/components/ui/dialog` — Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
- `@/shared/lib/cn` — merge de classes Tailwind

### Outras features
Nenhuma — módulo 100% isolado.

## 4. Fluxos Principais

### Fluxo 1: Consulta de Comissões
1. `ComissoesConsultaPage` carrega lista de indicadores via `comissoesService.listarIndicadores()`.
2. Cada indicador é renderizado como `IndicadorRow` (componente interno).
3. Ao expandir uma linha, dispara `comissoesService.consultar(telefone)` para carregar detalhes.
4. Detalhes mostram origem (PACOTE/FOTO_EXTRA/VIDEO_EXTRA), valores, status (PENDENTE/PAGA/CANCELADA).

### Fluxo 2: Gerenciamento de Indicadores
1. Botão "Novo Indicador" abre `IndicadorDialog` (create).
2. Botão de editar na linha abre `IndicadorDialog` com dados preenchidos (edit).
3. Formulário manual (sem react-hook-form): campos nome, telefone, observações.
4. Delete:两步 — busca ID por telefone → chama `indicadorService.remover(id)`.

## 5. Regras Específicas
1. **Sem `api/queries.ts`**: Todos os hooks `useQuery`/`useMutation` são escritos inline nas páginas/componentes, não em um arquivo centralizado.
2. **Sem Zod**: O formulário do `IndicadorDialog` usa validação manual (`!nome.trim() || !telefone.trim()`) em vez de `react-hook-form` + `zodResolver`.
3. **Delete em dois passos**: A mutation de delete primeiro lista indicadores para achar o ID pelo telefone, depois chama `remover(id)`. Isso é frágil — homônimos podem causar deleção errada. O endpoint deveria aceitar telefone diretamente.

## 6. Testes
Não existem testes para este módulo.

## 7. Pontos de Atenção
- **`api/queries.ts` ausente**: Foge do padrão do projeto. Hooks deveriam estar centralizados para reuso e consistência.
- **`schemas/` ausente**: Sem validação Zod, o formulário não se beneficia de inferência de tipos e erros padronizados.
- **Delete em dois passos**: Risco de race condition — se a lista mudar entre a busca e a deleção, o ID pode estar desatualizado.
- **Estrutura enxuta**: Apenas 6 arquivos para 1 página funcional. O módulo é pequeno e bem focado.
