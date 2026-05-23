<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-memory -->
# Projeto: Controle de Despesas

## Premissas
- App pessoal, senha compartilhada via `AUTH_PASSWORD` no .env
- Login: server action manual seta cookies `user-id` e `user-email` (7 dias)
- Middleware (`src/middleware.ts`) verifica cookie `user-id` diretamente (Edge runtime)
- `auth()` em `src/auth.ts` lê cookie e busca user no banco (função customizada, sem NextAuth)
- Todas API routes e server actions verificam `auth()` com escopo por `userId`
- Prisma v7 com lazy init via Proxy — usa `@prisma/adapter-d1` no Cloudflare, `@prisma/adapter-libsql` local
- Database: Cloudflare D1 (produção) / SQLite local `file:./dev.db` (desenvolvimento)
- Next.js 16 com Turbopack

## Funcionalidades Implementadas

### Autenticação
- Login com senha (server action → cookies manuais) — único método
- Logout — `logoutAction` deleta cookies e redireciona
- Passkey/WebAuthn removido (pesava o bundle, login por senha cobre tudo)

### Páginas
- `/` — Dashboard com gastos, estoque, previsão IA, alertas preço anormal, dicas
- `/nova-nota` — Upload foto + QR code + IA pra extrair dados da nota
- `/notas` — Histórico com busca por mercado e produto, filtro `?mercado=`
- `/estoque` — Tabela com +/-, delete, busca por nome
- `/lista-compras` — Itens com estoque ≤ 1, finalizar compras, compartilhar
- `/analise` — Comparação de preços por mercado + botão "Preço online" (DuckDuckGo)
- `/relatorios` — CSV mensal
- `/mercados` — Lista + adicionar manual
- `/config` — Editar nome, info da conta
- `/assistente` — Chat IA sobre gastos
- `/compartilhado/[token]` — Lista pública temporária
- `/offline` — Fallback offline PWA

### IA (src/lib/ai.ts)
- `processReceiptImage` — Ler foto da nota (OpenRouter/Groq, apenas server-side)
- `categorizeProduct` — Classificar produto em categoria
- `askAssistant` — Chat com dados do usuário
- `analyzeSpendingTrend` — Previsão de gastos
- `detectPriceAnomaly` — Alertar preço fora da média
- `priceSearch.ts` — Busca preço online via DuckDuckGo HTML search + filtro de domínios de e-commerce brasileiros
- Todas com fallback se API key não configurada

### Cloudflare Deploy
- `npm run deploy` executa `opennextjs-cloudflare build && opennextjs-cloudflare deploy`
- `npm run build` executa `next build` (OpenNext já chama build internamente)
- Middleware: `src/middleware.ts` (Edge runtime, necessário para Cloudflare)
- Prisma adapter: `@prisma/adapter-d1` (Cloudflare) / `@prisma/adapter-libsql` (local), lazy init via Proxy
- Database: Cloudflare D1 (produção, binding `appmercado_db`) / SQLite local (desenvolvimento, `file:./dev.db`)
- Worker size: ~700 KiB gzip (dentro do limite free de 3 MiB)
- Configs versionadas: `wrangler.jsonc`, `open-next.config.ts`, `public/_headers`

### Packages Removidos
- next-auth, @auth/prisma-adapter, @simplewebauthn/server, @simplewebauthn/browser — login só por senha
- @google/generative-ai, better-sqlite3, clsx, date-fns, tailwind-merge — não usados

### PWA
- `public/manifest.json` com ícones .svg
- `public/sw.js` com cache e falloffline
- Registro automático no layout

### Banco (Prisma)
- Models: User, Account, Session, VerificationToken, Authenticator, SharedList, Market, Category, Product, Receipt, ReceiptItem
- Uniques: `Market(name, userId)`, `Product(name, userId)`, `Category(name)`, `User(email)`

## Para Configurar (`.env`)
```
AUTH_PASSWORD=123456
AUTH_SECRET=qualquer_coisa
DATABASE_URL="file:./dev.db"
OPENROUTER_API_KEY=  # opcional, para IA
GROQ_API_KEY=        # opcional, alternativa OpenRouter
NEXT_PUBLIC_AI_PROVIDER=openrouter  # ou groq
```

## Secrets Cloudflare (setar via `wrangler secret put` ou dashboard)
```
AUTH_PASSWORD=
AUTH_SECRET=
OPENROUTER_API_KEY=  # opcional
GROQ_API_KEY=        # opcional
```

## Observações Técnicas
- `module.register()` deprecation warning do Turbopack — inofensivo
- HMR warning resolvido via `allowedDevOrigins` no next.config.ts
- Build local: `npx next build` (sem `--turbo` para build de produção)
- D1 database: `appmercado-db` (ID `531c28d7-acff-4e8d-a8d0-4d42a6e98ba6`)
- Migração D1: `npx wrangler d1 execute appmercado-db --remote --file=prisma/migrations/xxx/migration.sql`
- Deploy falha se `database_id` no `wrangler.jsonc` não corresponder ao D1 real
<!-- END:project-memory -->
