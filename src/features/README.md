# Features

Cada pasta representa um módulo de negócio independente.

## 🚨 Regra Fundamental

**Features NÃO importam outras Features.**

Se um código precisa ser compartilhado entre duas ou mais features, ele deve ser movido para `shared/`.

### Exceções

- Componentes de UI genéricos → `shared/components/ui/`
- Hooks genéricos → `shared/hooks/`
- Tipos compartilhados → `shared/types/`
- Constantes (rotas, enums) → `shared/constants/`
