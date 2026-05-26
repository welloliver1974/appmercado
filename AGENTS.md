<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-memory -->
# Projeto: Controle de Despesas

## Premissas
- App pessoal, senha compartilhada via `AUTH_PASSWORD` no .env
- Login: server action manual seta cookies `user-id` e `user-email` (7 dias)
- Middleware foi removido; a verificação de cookie agora ocorre nas rotas/API conforme necessário
- `auth()` em `src/auth.ts` lê cookie e busca user no banco (função customizada, sem NextAuth)
- Todas API routes e server actions verificam `auth()` com escopo por `userId`
- Prisma v7 com `@prisma/adapter-libsql` — SQLite local em dev, Turso em produção
- Database: Turso (produção) / SQLite local `file:./dev.db` (desenvolvimento)
- Next.js 16 com Turbopack
- Deploy: Vercel

## Funcionalidades Implementadas

### Autenticação
- Login com senha (server action → cookies manuais) — único método
- Logout — `logoutAction` deleta cookies e redireciona
- Passkey/WebAuthn removido (pesava o bundle, login por senha cobre tudo)

### Páginas
- `/` — Dashboard com gastos, estoque, previsão IA, alertas preço anormal, dicas
- `/nova-nota` — Upload foto + QR code + IA pra extrair dados da nota
- `/notas` — Histórico com busca por mercado e produto, filtro `?mercado=`
- `/notas/[id]` — Detalhe da nota com itens + botão excluir
- `/estoque` — Tabela com +/-, delete, busca por nome
- `/lista-compras` — Itens com estoque ≤ 1, finalizar compras, compartilhar, deletar item
- `/analise` — Comparação de preços por mercado + botão "Preço online" (DuckDuckGo)
- `/relatorios` — CSV mensal
- `/mercados` — Lista + adicionar manual + deletar mercado
- `/config` — Editar nome, info da conta
- `/assistente` — Chat IA sobre gastos
- `/compartilhado/[token]` — Lista pública temporária
- `/offline` — Fallback offline PWA

### IA (src/lib/ai.ts)
- `processReceiptImage` — Ler foto da nota via API (Groq como padrão, fallback OpenRouter)
- `categorizeProduct` — Classificar produto em categoria
- `askAssistant` — Chat com dados do usuário
- `analyzeSpendingTrend` — Previsão de gastos
- `detectPriceAnomaly` — Alertar preço fora da média
- `priceSearch.ts` — Busca preço online via DuckDuckGo HTML search + filtro de domínios de e-commerce brasileiros
- Todas com fallback se API key não configurada
- Modelo Groq visão atual: `meta-llama/llama-4-scout-17b-16e-instruct`
- Modelo Groq chat atual: `llama-3.3-70b-versatile`
- Modelo OpenRouter visão atual: `google/gemini-2.0-flash-exp:free`

### QR Scanner (src/components/QRScanner.tsx)
- Usa `<input type="file" capture="environment">` (câmera nativa, resolução máxima)
- `BarcodeDetector` API nativa (Chrome/Safari) com fallback `jsQR`
- `createImageBitmap` para corrigir orientação EXIF
- **Center Crop 65%** antes de qualquer downsampling — leitura de QR densos em fotos de alta resolução
- Preview da foto capturada + overlay de erro + botão "Tentar novamente"
- Parse da chave NFC-e com correção de índices da data (AAMM)
- Total: só lê valor do QR se `fields.length >= 6`, tenta índices 4 e 5 (evita índice 3 que é tipo de emissão e causava total falso de R$ 1,00)
- Ignora campos que parecem hashes hexadecimais (assinaturas)
- **`handleQRScan`** prioriza `sefaz.totalAmount` sobre valor do QR (`sefaz?.totalAmount || qr.totalAmount`)

### Server Actions
- `processReceiptAction` — Processa imagem com IA (server-side, lê env vars)
- `saveReceiptAction` — Salva nota + itens + atualiza estoque (retorna erro, não throw)
- `deleteReceiptAction` — Deleta nota e itens
- `deleteMarketAction` — Deleta mercado + notas vinculadas
- `deleteProductAction` — Deleta produto da lista de compras
- `fetchQRReceiptAction` — Busca dados da nota direto da página NFCE (SEFAZ)
- `getDashboardData` — Retorna dados da dashboard (usado pelo componente cliente)

### Formatação pt-BR (src/lib/format.ts)
- `formatQty()` — Exibe quantidades no formato brasileiro (1,735 kg em vez de 1.735 kg)
- `formatCurrency()` — Exibe valores monetários no formato brasileiro (R$ 6,99)

### Dashboard (src/app/page.tsx → DashboardClient.tsx)
- Componente cliente com fetch assíncrono — nunca quebra o roteamento
- Loading spinner enquanto carrega
- Estado de erro com botão "Tentar novamente"
- Página estática (○) em vez de dinâmica (ƒ)

### Deploy (Vercel)
- `vercel --prod` faz build + deploy automaticamente
- `npm run build` executa `next build` (bundle padrão Next.js, sem OpenNext)
- Database: Turso (produção) / SQLite local (desenvolvimento)
- Sem Cloudflare, sem OpenNext, sem workarounds de chunk inlining
- Deploy automático via GitHub: push na `main` dispara deploy na Vercel

## Histórico de Migrações

### 2026-05-24 — Cloudflare D1 → Vercel + Turso
- Migrado de Cloudflare Workers (OpenNext) para Vercel (Next.js nativo)
- Removido: `wrangler.jsonc`, `open-next.config.ts`, `scripts/inline-chunks.mjs`, `public/_headers`
- Removidos pacotes: `@opennextjs/cloudflare`, `wrangler`, `@prisma/adapter-d1`
- Substituído D1 por Turso (libSQL remoto) — mesma base SQLite
- Criada migration inicial no Turso via `@libsql/client`
- `src/lib/prisma.ts` simplificado: sempre usa `@prisma/adapter-libsql` com prioridade `TURSO_DATABASE_URL` > `DATABASE_URL`
- Criada página de login (`/login`) com formulário — antes redirecionava em loop
- Corrigido redirect infinito: home (`/`) redireciona para `/login` quando não autenticado
- API login trocou `NextResponse.redirect` por `NextResponse.json` + `window.location.href` no cliente (cookies não persistiam com fetch seguindo redirect 307)
- Env vars configuradas na Vercel: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `AUTH_PASSWORD`, `AUTH_SECRET`, `OPENROUTER_API_KEY`, `GROQ_API_KEY`, `NEXT_PUBLIC_AI_PROVIDER` (agora `groq`)
- URL de produção: https://appmercado-chi.vercel.app

### 2026-05-24 (tarde) — Correções Pós-Migração
- **Server Action `processReceiptAction`** criada em `src/app/actions/ai.ts` — processamento de imagem roda 100% no servidor (onde `OPENROUTER_API_KEY`/`GROQ_API_KEY` existem)
- **QR Scanner**: vídeo stream substituído por `<input type="file" capture>` (câmera nativa, resolução total do celular)

### 2026-05-25 — Melhorias QR Code + Fallback SEFAZ
- **QRScanner**: `parseQRData` agora aceita `chaveNFe` (SP) além de `p`
- **QRScanner (Center Crop)**: `decodeQR` agora tenta primeiro um recorte de 65% na resolução original máxima da foto tirada pela câmera nativa do celular. Evita o borrão e distorção causados pela redução/downsampling de imagens gigantescas tiradas em celulares de alta resolução, permitindo leitura ultra-rápida de QR codes densos e pequenos pelo `jsQR`. Mantém o loop por dimensões menores como fallback secundário.
- **QRScanner**: Preview da foto capturada + overlay de erro + botão "Tentar novamente" sem `alert()`
- **`fetchQRReceiptAction`**: Agora detecta se o layout é da SEFAZ SP/RJ (layout responsivo nacional XSLT 2.05 / versão 4.00) e executa um parser robusto e dedicado. Isso extrai com altíssima fidelidade o nome fantasia do mercado (`.txtTopo`), a data real sem fuso horário, o valor total/pago do cupom (`.totalNumb` dentro de `.linhaShade`) e a lista completa de itens (nome, quantidade decimal, unidade e valor unitário). Se for outro estado ou se o parser SP falhar, reverte automaticamente para os padrões de regex genéricos para máxima segurança.
- **`handleQRScan`**: Fallback universal — sempre extrai data (AAMM) e CNPJ do accessKey, mescla com dados SEFAZ. Se SEFAZ falhar, formulário já vem preenchido
- **CNPJ formatado**: `XX.XXX.XXX/XXXX-XX` no fallback
- **QR parser**: Detecta CAPTCHA/página de erro e aborta fetch
- **Modelos de IA atualizados**:
  - Groq visão: `llama-3.2-11b-vision-preview` (decommissioned) → `meta-llama/llama-4-scout-17b-16e-instruct`
  - Groq chat: `llama-3.1-8b-instant` → `llama-3.3-70b-versatile`
  - OpenRouter visão: `meta-llama/llama-3.2-11b-vision-instruct:free` (404) → `google/gemini-2.0-flash-exp:free`
- **QR data parsing corrigido**:
  - Data: `substring(1,3)` → `substring(2,4)` para ano, `substring(3,5)` → `substring(4,6)` para mês
  - Total: removeu restrição `version===2 && tpEmis===9`; versão inicial tentava fields[4] e [3]
- **Page crash ao salvar**: removido redirect automático (`window.location.href`). Agora mostra tela de sucesso com links manuais
- **`saveReceiptAction`**: mudou de `throw new Error` para retornar `{ error, message }` (previnir Next.js error boundary no mobile)
- **Notas clicáveis**: lista em `/notas` agora com `<Link>` para `/notas/[id]`. Página de detalhe criada com mercado, data, total, itens e botão excluir
- **Imagem comprimida**: 1024px/quality 0.7 (otimizado para legibilidade da IA)
- **Excluir nota**: botão em `/notas/[id]` com confirmação
- **Excluir mercado**: botão em `/mercados` com confirmação (remove mercado + notas)
- **Dashboard crash (mobile)**: convertido para componente cliente com fetch assíncrono (`getDashboardData`). Loading spinner + estado de erro com retry. Página estática.
- **Prompt IA**: reformulado com instruções explícitas sobre formato decimal brasileiro e bom senso de quantidades
- **Formato pt-BR**: criado `formatQty()` e `formatCurrency()` — todas as quantidades agora usam vírgula decimal e formato brasileiro
- **QR SEFAZ**: `fetchQRReceiptAction` — server action que tenta buscar dados da nota direto da página NFCE, com múltiplos padrões de regex para diferentes estados
- **Lista de compras**: botão de deletar item adicionado
- **`deleteProductAction`**: server action para deletar produtos
- **`deleteReceiptAction`** e **`deleteMarketAction`**: ações de deletar nota e mercado

### 2026-05-25 (tarde) — Correções Finais QR + SEFAZ SP
- **QR total falso R$ 1,00 corrigido**: `parseQRData` em `QRScanner.tsx` — agora só lê valor total se `fields.length >= 6` e tenta apenas índices 4 e 5; índice 3 (tipo de emissão = `1`) causava o total falso. Campos com aspecto de hash hexadecimal são descartados
- **Prioridade SEFAZ sobre QR**: `handleQRScan` em `nova-nota/page.tsx` inverteu a ordem: `sefaz?.totalAmount || qr.totalAmount` — o valor real da página da SEFAZ sempre prevalece sobre o valor do QR
- **Estoque em `/compartilhado/[token]`**: quantidade exibia `21.80100000000000` (float cru do SQLite/JS). Corrigido importando e usando `formatQty()` de `@/lib/format` — agora exibe `21,801`
- **`fetchQRReceiptAction` (SEFAZ SP/RJ)**: parser de alta fidelidade para layout nacional responsivo (XSLT 2.05 / v4.00) — extrai nome fantasia (`.txtTopo`), data sem shift de fuso, total real (`.totalNumb` dentro de `.linhaShade`) e lista completa de itens com quantidade fracionária, unidade e preço unitário. Fallback automático para parser genérico se layout for de outro estado
- **QRScanner Center Crop**: `decodeQR` tenta primeiro recorte central de 65% na resolução original máxima antes de qualquer downsampling — resolve borrão em fotos de celulares de alta resolução

### Packages Removidos
- next-auth, @auth/prisma-adapter, @simplewebauthn/server, @simplewebauthn/browser — login só por senha
- @opennextjs/cloudflare, wrangler, @prisma/adapter-d1 — migrado Cloudflare → Vercel
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
TURSO_DATABASE_URL=  # preencher com URL do Turso (ex: libsql://meu-db.turso.io)
TURSO_AUTH_TOKEN=    # preencher com token Turso
OPENROUTER_API_KEY=  # opcional, para IA
GROQ_API_KEY=        # opcional, alternativa OpenRouter
NEXT_PUBLIC_AI_PROVIDER=groq  # groq (padrão) ou openrouter
GOOGLE_API_KEY=      # obrigatório para busca de preços online (/analise)
GOOGLE_SEARCH_CX=    # obrigatório — ID do Programmable Search Engine
```

### 2026-05-25 — Migração Estoque: Quantidade → Presença (0/1)
- **Motivação**: Estoque acumulava float `21.8010000000000002` de peso/kg em vez de contar itens. Usuário quer saber "tem banana?" não "quantos kg de banana?"
- **`saveReceiptAction`**: `stock` agora é sempre `1` (produto existe no estoque), não mais `increment: item.quantity`
- **`updateStockAction`**: `+` → `1`, `-` → `0` (toggle presença)
- **`deleteReceiptAction` / `deleteMarketAction`**: depois de deletar, verifica se produto ainda tem receipt items; se não tiver, `stock = 0`
- **`recalculateStockAction`**: se produto tem `ReceiptItem.count > 0` → `1`, senão `0`
- **`finalizarComprasAction`**: `stock = 1` em vez de `5`
- **`formatQty()`**: agora arredonda com `Math.round(value * 1000) / 1000` antes de formatar (safety net)
- **Todos thresholds**: `stock <= 1` → `stock <= 0` (lista-compras, dashboard, assistente, share)
- **Dashboard stockCount**: `_sum.stock` → `product.count({ where: { items: { some: {} } } })` (conta produtos com nota, não soma float)
- **Dashboard card "Estoque Crítico"**: simplificado — só mostra nome do produto, sem quantidade
- **Lista de compras**: exibe apenas "Faltando", sem quantidade
- **`CriticalStockAlert`**: componente mostra só nome do produto, sem `formatQty`
- **`priceSearch.ts`**: query mudou de `"produto preço"` para `"comprar produto"` (prioriza e-commerces em vez de sites de cotação); adicionados domínios `tendaatacado.com.br`, `assai.com.br`, `samsclub.com.br`
- **Recalcular**: após deploy, acessar `/estoque` e clicar "Recalcular" para normalizar estoque existente

### 2026-05-26 — DuckDuckGo → Google Programmable Search
- DuckDuckGo HTML search removido de `src/lib/priceSearch.ts` (bloqueava scrapers)
- Substituído por Google Custom Search JSON API (`googleapis.com/customsearch/v1`)
- Requer `GOOGLE_API_KEY` e `GOOGLE_SEARCH_CX` no `.env`
- Search engine criado com domínios de e-commerce brasileiros + API Key do Google Cloud
- Gratuito: 100 consultas/dia; $5/1.000 após limite

## Observações Técnicas
- `module.register()` deprecation warning do Turbopack — inofensivo
- HMR warning resolvido via `allowedDevOrigins` no next.config.ts
- Build local: `npm run build` (Turbopack para dev, webpack para produção)
- Migração Turso: `turso db shell meu-db < prisma/migrations/xxx/migration.sql`
- Dashboard é componente cliente (`DashboardClient.tsx`) — página estática, fetch de dados via server action
- Quantidades em formato brasileiro via `formatQty()` / `toLocaleString('pt-BR')` — usar sempre `formatQty()` de `@/lib/format`, nunca exibir floats crus
- ERR_HTTP2_INADEQUATE_TRANSPORT ao rodar projeto local: ignorar, HTTP/2 local instável sem SSL
- **QR total falso**: nunca usar `fields[3]` do parâmetro `p` — é o tipo de emissão (valor `1`); sempre exigir `fields.length >= 6`
- **Prioridade de total**: `sefaz.totalAmount` > `qr.totalAmount` > `0` — respeitar essa ordem em `handleQRScan`
<!-- END:project-memory -->
