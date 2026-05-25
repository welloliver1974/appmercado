# FIXLOG — Migração Cloudflare D1 → Vercel + Turso

## 2026-05-24

### Problema Original
App rodando no Cloudflare Workers (OpenNext) com 500 error — Turbopack gerava chunks SSR separados que não carregavam no ambiente single-script do workerd.

### Tentativa 1: Inline Chunks (Cloudflare)
Criado `scripts/inline-chunks.mjs` para ler os 81 chunks SSR e embuti-los no `handler.mjs` via `globalThis.__TURBOPACK_CHUNKS__`. Handler passou de 2.1 MiB → 3.58 MiB.

**Resultado:** Wrangler rejeitou o bundle — resolvedores esbuild não encontravam `@prisma/client-{hash}` e `@opentelemetry/api`. Adicionar aliases no `wrangler.jsonc` resolveu parte, mas Prisma exigia `edge.js` inexistente.

**Decisão:** Abandonar Cloudflare/OpenNext.

---

### Migração para Vercel + Turso

#### Arquivos Removidos
- `wrangler.jsonc` — config Cloudflare
- `open-next.config.ts` — config OpenNext
- `scripts/inline-chunks.mjs` — workaround de chunks
- `public/_headers` — headers Cloudflare
- `.dev.vars` — env local Cloudflare

#### Dependências Removidas
- `@opennextjs/cloudflare` — runtime cloudflare
- `wrangler` — CLI cloudflare
- `@prisma/adapter-d1` — adapter D1 (desnecessário)

#### src/lib/prisma.ts (simplificado)
- Removeu `getCloudflareContext()` e `PrismaD1`
- Sempre usa `@prisma/adapter-libsql`
- Prioridade: `TURSO_DATABASE_URL` > `DATABASE_URL` > `file:./dev.db`
- `PrismaLibSql` recebe `{ url, authToken }` — cria client internamente

#### next.config.ts
- Removeu `import('@opennextjs/cloudflare').then(...)` — não precisa mais

#### src/app/page.tsx
- Corrigido redirect: `redirect("/")` → `redirect("/login")` (estava em loop infinito)

#### src/app/login/page.tsx (criado)
- Formulário de login real com email + senha
- Antes: `redirect("/")` apenas (página vazia)
- Agora: formulário estilizado com fetch → `window.location.href`

#### src/app/api/login/route.ts
- Mudou `NextResponse.redirect()` para `NextResponse.json({ success: true })`
- Cookies ainda definidos na response
- Evita problema de redirect seguido por fetch sem cookies

#### Banco de Dados (Turso)
- Database: `appmercado-db` (Turso, região ap-northeast-1)
- Migration inicial rodada via script `@libsql/client`
- 11 tabelas + índices criados

#### Vercel
- Projeto linkado: `welloliver/appmercado`
- Env vars configuradas na dashboard:
  - `TURSO_DATABASE_URL`
  - `TURSO_AUTH_TOKEN`
  - `AUTH_PASSWORD`
  - `AUTH_SECRET`
  - `OPENROUTER_API_KEY`
  - `GROQ_API_KEY`
  - `NEXT_PUBLIC_AI_PROVIDER` (inicialmente `openrouter`, depois alterado para `groq`)
- Deploy automático via GitHub (push na main)
- URL: https://appmercado-chi.vercel.app

#### Build
- `npm run build` → `next build` (Turbopack), sem OpenNext
- Build local ~10s, Vercel ~25s com cache
- Sem limite de 3 MiB, sem chunk inlining, sem workarounds

---

### Correções Pós-Migração (ainda em 24/05)

#### IA — Server Action (separada)
- `processReceiptAction` criada em `src/app/actions/ai.ts`
- Antes: `processReceiptImage` importado direto em componente client → `process.env.*` virava `undefined` no bundle cliente
- Agora: server action chama `processReceiptImage` no servidor onde as envs existem

#### IA — Modelos Descontinuados
- Groq visão: `llama-3.2-11b-vision-preview` (decommissioned) → `meta-llama/llama-4-scout-17b-16e-instruct`
- Groq chat: `llama-3.1-8b-instant` → `llama-3.3-70b-versatile`
- OpenRouter visão: `meta-llama/llama-3.2-11b-vision-instruct:free` (404) → `google/gemini-2.0-flash-exp:free`
- OpenRouter chat: `meta-llama/llama-3.1-70b-instruct:free` → `meta-llama/llama-3.3-70b-instruct:free`

#### QR Code — Data Alucinada (2056 em vez de 2026)
- **Causa:** `handleQRScan` usava `substring(1,3)` para ano e `substring(3,5)` para mês
- **Correção:** `substring(2,4)` para ano, `substring(4,6)` para mês (AAMM começa no índice 2)
- Formato: cUF(2) | AAMM(4) | CNPJ(14) | ...

#### QR Code — Total R$ 0,00
- **Causa:** Restrição `version===2 && tpEmis===9` impedia parse para QR com tpEmis diferente; alguns QR omitem field `cDest` deslocando total para field[3]
- **Correção:** Sempre tenta fields[4] e [3], aceita qualquer valor positivo

#### QR Code — Leitura com câmera
- **Antes:** `getUserMedia` + vídeo stream contínuo (baixa resolução, jsQR não detectava)
- **Depois:** `<input type="file" capture="environment">` (câmera nativa, resolução máxima)
- `BarcodeDetector` API nativa (Chrome/Safari) com fallback `jsQR`
- `createImageBitmap` para corrigir orientação EXIF (fotos de celular em pé)
- Fallback de resolução reduzida para QR densos

#### QR Code — SEFAZ fetch
- Criado `fetchQRReceiptAction` em `src/app/actions/utils.ts`
- Busca dados da nota direto da página NFCE via link do QR
- Múltiplos padrões de regex para diferentes estados
- Fallback para parse dos parâmetros do QR se falhar

#### Page Crash ao Salvar no Mobile
- **Sintoma:** "This page couldn't load" após clicar "Confirmar e Salvar" no celular
- **Causa raiz:** `window.location.href = "/"` causava erro no navegador mobile
- **Correção:** Removeu redirect automático. Agora mostra tela de sucesso com links "Ir para o Início" e "Ver Histórico"
- **Complementar:** `saveReceiptAction` mudou de `throw new Error` para retornar `{ error, message }` — Next.js engole exceções de server actions

#### Dashboard Crash no Mobile
- **Sintoma:** "This page couldn't load" ao acessar a home `/` no celular
- **Causa raiz:** Server component fazia múltiplas chamadas IA (`detectPriceAnomaly` para cada produto) que estouravam timeout de 10s da Vercel
- **Correção:** Convertido para componente cliente (`DashboardClient.tsx`) com fetch assíncrono via `getDashboardData`. Loading spinner + estado de erro com retry. Página estática (○).

#### Notas — Agora Clicáveis
- `src/app/notas/page.tsx`: cada linha virou `<Link href={/notas/${id}}>`
- `src/app/notas/[id]/page.tsx`: criada — mostra mercado, data, total, itens e botão excluir

#### Botão Excluir
- **Nota:** `src/components/DeleteButtons.tsx` — `DeleteReceiptButton` com confirmação, redireciona para `/notas`
- **Mercado:** `DeleteMarketButton` — remove mercado + todas as notas vinculadas
- **Produto (lista):** `DeleteListProductButton` — remove produto da lista de compras

#### Prompt IA — Formato Decimal
- Prompt reformulado com instruções explícitas:
  - "1,735 kg significa UM VÍRGULA SETECENTOS kg (~1.7 kg), não mil setecentos"
  - "Confira se o número faz sentido: uma banana não pesa 2000 kg"
- Imagem comprimida em 1024px / quality 0.7 (melhor legibilidade que 800/0.6)

#### Formato pt-BR
- `src/lib/format.ts` criado com `formatQty()` e `formatCurrency()`
- Todas as páginas agora exibem quantidades com vírgula decimal (1,735 kg) e moeda no formato brasileiro (R$ 6,99)
- Usa `toLocaleString('pt-BR')` internamente

#### Env Vars na Vercel
- `NEXT_PUBLIC_AI_PROVIDER` alterado de `openrouter` para `groq` via CLI da Vercel
- `.env` local atualizado para `NEXT_PUBLIC_AI_PROVIDER=groq`

---

---

## 2026-05-25 — Melhorias QR Code + Extração SEFAZ SP

### QR Code — Leitura mais robusta
- **`parseQRData`**: Agora também aceita parâmetro `chaveNFe` (usado por SP), não só `p`
- **`decodeQR` (jsQR)**: Inverteu a ordem — tenta primeiro com resolução reduzida (1200px), depois 800px, depois 1600px. Antes tentava resolução total (4000×3000) que travava jsQR no celular
- Removeu tentativa de full-res que causava timeout/crash em imagens grandes de câmera moderna

### SEFAZ — Extração específica para SP
- **Detecção de estado**: `fetchQRReceiptAction` agora identifica SP pelo domínio `fazenda.sp.gov.br`
- **Patterns SP**: Adicionados patterns específicos para o HTML do DANFE de SP:
  - Nome do mercado: busca "Razão Social" no HTML renderizado pelo XSLT da SEFAZ SP
  - Itens: parseia `div.tx` (formato do DANFE SP) — agrupa em grupos de 4 (descrição, qtd, un, preço)
  - Total: patterns específicos incluindo "VALOR A PAGAR"
- **Detecção de CAPTCHA**: Se a página retorna CAPTCHA ou "Página não encontrada", já retorna erro imediatamente
- **Validação de dados**: Se o nome do mercado parece genérico ("Mercado CNPJ..."), marca `_partial: true` para o frontend usar fallback do accessKey
- **Fallback inteligente**: `handleQRScan` agora verifica `_partial` e mescla dados do accessKey (data do ano/mês, CNPJ) com o que veio da SEFAZ

### Issues Abertas
- [ ] Testar fluxo completo no celular (foto → IA → salvar → ver nota)
- [ ] Validar extração SEFAZ SP com nota real
- [ ] Validar extração SEFAZ para outros estados (BA, MG, RJ, etc.)
- [ ] Verificar precisão do modelo Groq para leitura de notas fiscais brasileiras
