# vector
> Tasks & projetos — Proddyt Labs
> Marca: `( · )` | Cor: `#FBB024` (amber)

## Stack
- Vue 3 + TypeScript + Vite (frontend)
- Node + Express + TypeScript (backend)
- Prisma + PostgreSQL
- Auth: Gate SSO (sso.proddyt.site)

## Estrutura
```
vector/
├── backend/    Express + Prisma + TS
├── frontend/   Vue 3 + Vite + Tailwind
├── compose.dev.yml   postgres pra dev local (porta 5434)
└── README.md
```

## Setup

### 1. DB
```bash
docker compose -f compose.dev.yml up -d
```

### 2. Backend
```bash
cd backend
cp .env.example .env
npm install
npx prisma db push
npm run dev          # roda na porta 3002
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev          # roda na porta 5175
```

## Auth
Mesmo padrão do `punch` e `nexo`:
- `localStorage["auth_token"]` guarda o JWT
- Bearer token validado via `GET sso.proddyt.site/oauth/userinfo`
- User criado/encontrado via `gateId` no primeiro login
- Logout global via `/auth/logout` no Gate (destrói sessão SSO)

Pra testar local, registra o cliente no Gate:
```sql
INSERT INTO clients (id, name, secret, redirect_uri)
VALUES (gen_random_uuid(), 'vector', '<secret>', 'http://localhost:5175/auth/callback');
```
