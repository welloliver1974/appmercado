<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-memory -->
# Projeto: Controle de Despesas

## Premissas
- App pessoal, senha compartilhada via `AUTH_PASSWORD` no .env
- Login: server action manual seta cookies `user-id` e `user-email` (7 dias)
- Middleware (`src/proxy.ts`) verifica cookie `user-id` diretamente (NÃO usa NextAuth session)
- `auth()` em `src/auth.ts` lê cookie e busca user no banco (função customizada, não NextAuth)
- Todas API routes e server actions verificam `auth()` com escopo por `userId`
- Prisma v7 com `@prisma/adapter-libsql` + `@libsql/client` — URL do banco usa `path.resolve` + prefixo `file:`
- Usar `npx prisma db push` para sincronizar schema (migration regenerada em 23/05)
- Next.js 16 com Turbopack (`--turbo`)

## Funcionalidades Implementadas

### Autenticação
- Login com senha (server action → cookies manuais) — funciona
- Login Digital (Passkey/WebAuthn) — corrigido via `jwt` callback que também seta cookie `user-id`
- Logout — `logoutAction` deleta cookies e redireciona

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
- `priceSearch.ts` — Buscar preço online via DuckDuckGo HTML search + filtro de domínios de e-commerce brasileiros (gratuito, sem API key)
- Todas com fallback se API key não configurada

### Cloudflare Deploy
- `npm run deploy` executa `opennextjs-cloudflare build && opennextjs-cloudflare deploy`
- Build local: `npx next build` (sem `--turbo`)
- Middleware: `src/middleware.ts` (Edge runtime, necessário para Cloudflare)
- Prisma adapter: `@prisma/adapter-libsql` + `@libsql/client` com lazy init via Proxy
- Database: SQLite local (`file:./dev.db`) — não D1
- Worker size limit: 3 MiB (free tier)

### Packages Removidos
- next-auth, @auth/prisma-adapter, @simplewebauthn/server, @simplewebauthn/browser (login só por senha)

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

## Próximos Passos Possíveis
- Configurar chaves de IA (OpenRouter/Groq)
- Melhorias sugeridas pelo usuário (perguntar)

## Observações Técnicas
- `module.register()` deprecation warning do Turbopack — inofensivo
- HMR warning resolved via `allowedDevOrigins` no next.config.ts
- Build: `npx next build` (sem `--turbo` para build de produção)
<!-- END:project-memory -->
