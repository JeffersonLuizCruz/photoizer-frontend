# Photoizer CRM (frontend)

SPA do CRM Photoizer. Stack: React 19 · TypeScript · Vite · React Router 7 ·
TanStack React Query · Zustand · Tailwind CSS 4.

---

## Pré-requisitos

- **Node.js 24+** e **npm**.
- **Backend rodando** em <http://localhost:8080> (ver `photoizer-backend/README.md`).
  Não há mocks: o frontend consome a API real.

---

## Como executar

Dentro de `photoizer-frontend/`:

```bash
npm install
npm run dev
```

Acesse <http://localhost:5173>.

Em desenvolvimento o Vite faz **proxy de `/api` para `http://localhost:8080`**
(`vite.config.ts`), então o backend precisa estar no ar. A variável `VITE_API_URL`
(o default é `/api/v1`) é validada com Zod em `src/shared/config/env.ts`.

### Autenticação (login)

Use um dos usuários semeados pelo backend (senha `dev123`). ADMIN e AGENDADOR são
semeados em todos os ambientes; os demais são exclusivos de `dev`:

| Papel | E-mail | Ambiente |
|-------|--------|----------|
| ADMIN | `admin@photoizer.com` | todos |
| AGENDADOR | `agendamento@photoizer.com` | todos |
| FOTOGRAFO | `fotografo.teste@photoizer.com` | dev |
| EDITOR | `editor.teste@photoizer.com` | dev |

- **Login da equipe:** rota `/login`.
- **Login do cliente (e-commerce):** rota `/acesso-cliente` (autorregistro público).

> O papel `AGENDADOR` não enxerga as métricas financeiras internas do estúdio
> (Dashboard, Financeiro, Comissões, Repasses). O menu e as rotas já refletem essa
> restrição, e o backend também a aplica.

---

## Build e verificação

```bash
npm run lint    # oxlint
npm run build   # typecheck real (tsc -b) + vite build
npm run preview # serve o build de produção localmente
```

Ordem recomendada: `npm run lint` → `npm run build`.

---

## Alternativa: frontend em container

O `Dockerfile` faz o build do Vite e serve o resultado via Nginx, com proxy de `/api`
para o backend:

```bash
docker build -t photoizer-frontend .
docker run --rm -p 8081:80 -e BACKEND_URL=http://host.docker.internal:8080 photoizer-frontend
```

Acesse <http://localhost:8081>.
