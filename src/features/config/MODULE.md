# Módulo: Config

## 1. Responsabilidade
Gerencia configurações globais do sistema — valores padrão para fotos extras, comissões, entrada, taxa de deslocamento e notificações automáticas.

## 2. Estrutura Interna
```
features/config/
├── index.ts                          # Barrel: ConfigPage
├── pages/
│   └── ConfigPage.tsx                # Página única de configurações (formulário de valores)
└── services/
    └── config.service.ts             # HTTP: get, update + interface ConfigValues
```

## 3. Dependências Externas

### Bibliotecas
- `@tanstack/react-query` — useQuery, useMutation (inline)
- `lucide-react` — ícones
- `sonner` — toasts
- `axios` (via `@/shared/api`) — requisições HTTP

### Módulos internos (shared)
- `@/shared/api` — `apiClient`
- `@/shared/components/layout/PageTitle` — título de página
- `@/shared/components/ui/*` — button, input, label, switch, skeleton

### Outras features
Nenhuma — módulo 100% isolado.

## 4. Fluxos Principais

### Fluxo 1: Visualização e Edição
1. `ConfigPage` carrega configurações via `configService.get()` → `GET /config`.
2. Exibe 5 campos numéricos: valor foto extra, valor vídeo extra, % comissão, % entrada, taxa deslocamento.
3. Toggle para notificação automática (envio de agenda do dia seguinte ao fotógrafo).
4. Botão "Salvar" → `configService.update()` → `PUT /config` → invalida query → toast.

## 5. Regras Específicas
1. **Tipos no service file**: `ConfigValues` é definido no próprio `config.service.ts` em vez de um `types/index.ts` separado.
2. **`notificarAutomaticamente` como string**: O campo chega como `'true'`/`'false'` (string), não boolean — provável decisão do backend. O frontend converte via `=== 'true'`.
3. **Valores fallback**: Se o campo vier `null`/`undefined`, usa defaults hardcoded (`'15.00'`, `'50.00'`, etc.).
4. **Sem `api/queries.ts`**: Hook `useQuery` e `useMutation` escritos inline na página, não em arquivo separado.

## 6. Testes
Não existem testes para este módulo.

## 7. Pontos de Atenção
- **Módulo mínimo**: Apenas 3 arquivos, 1 página. É o menor módulo do frontend.
- **`api/queries.ts` ausente**: Foge do padrão do projeto de centralizar hooks.
- **`schemas/` ausente**: Não há validação Zod (aceitável, pois os campos são numéricos com `type="number"` e `min="0"`).
- **`types/` ausente**: Interface `ConfigValues` co-localizada no service.
- **Fallbacks hardcoded**: Se o backend mudar os defaults, o frontend mantém valores antigos.
