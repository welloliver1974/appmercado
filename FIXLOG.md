# FIXLOG - Controle de Despesas

Este log detalha todas as etapas de desenvolvimento, funcionalidades implementadas e a estrutura do projeto **Controle de Despesas**.

## 🚀 Visão Geral
O Controle de Despesas é um web app completo para gerenciamento de gastos, compras e despesas, focado em automação via IA, controle de estoque e análise financeira.

---

## 🛠️ Tecnologias Utilizadas
- **Framework**: Next.js 16 (App Router)
- **Estilização**: Tailwind CSS (Tema Dark Premium: Preto e Azul)
- **Banco de Dados**: SQLite com Prisma ORM v7
- **Autenticação**: Auth.js v5 (next-auth) com Passkeys (WebAuthn/biometria)
- **IA/Visão**: OpenRouter / Groq (Modelo Llama 3.2 Vision)
- **Ícones**: Lucide React

---

## ✨ Funcionalidades Implementadas

### 1. Dashboard Inteligente
- Resumo de gastos mensais automáticos.
- Indicadores de estoque crítico.
- Atalhos rápidos para entrada de dados.
- Feed de compras recentes com dados reais do banco.

### 2. Cadastro de Notas via IA
- Upload de foto da nota fiscal.
- Processamento via IA (Groq/OpenRouter) para extração automática de:
  - Nome do Mercado
  - Data da Compra
  - Lista de Itens (Nome, Qtd, Preço Unitário, Preço Total)
- Validação manual antes de salvar.

### 3. Gestão de Estoque
- Atualização automática de estoque ao salvar uma nota.
- Controle manual de entrada e saída (+/-).
- Alertas visuais para itens que estão acabando.
- Exclusão de produtos e categorias.

### 4. Histórico de Compras (Minhas Notas)
- Listagem organizada de todos os recibos salvos.
- Detalhamento de valores totais e quantidade de itens por compra.

### 5. Análise de Preços Comparativa
- Rastreamento histórico de preços por produto.
- Identificação automática do "Melhor Mercado" para cada item.
- Cálculo de preço médio e variação percentual entre estabelecimentos.

### 6. Lista de Compras Automática
- Geração de lista baseada exclusivamente no que está em falta no estoque.
- Cálculo de custo estimado total para a próxima ida ao mercado.

---

## 📁 Estrutura de Arquivos Principal

- `src/app/page.tsx`: Dashboard principal.
- `src/app/nova-nota/page.tsx`: Interface de captura e IA.
- `src/app/estoque/page.tsx`: Gerenciamento de estoque.
- `src/app/notas/page.tsx`: Histórico de recibos.
- `src/app/analise/page.tsx`: Comparador de preços.
- `src/app/lista-compras/page.tsx`: Lista automática.
- `src/app/config/page.tsx`: Configurações (editar nome).
- `src/app/relatorios/page.tsx`: Exportar relatório CSV mensal.
- `src/app/compartilhado/[token]/page.tsx`: Página pública de lista compartilhada.
- `src/lib/ai.ts`: Configuração do motor de IA (OpenRouter/Groq).
- `src/app/actions/`: Lógica de servidor para DB (Salvar notas, atualizar estoque, compartilhar).
- `prisma/schema.prisma`: Modelagem do banco de dados.

---

## 🔧 Configuração Necessária
Para o funcionamento da IA, as seguintes variáveis devem estar no arquivo `.env`:
- `OPENROUTER_API_KEY` ou `GROQ_API_KEY`
- `NEXT_PUBLIC_AI_PROVIDER` (definido como 'openrouter' ou 'groq')

---
---

## 🐛 Correções de Bugs (22/05/2026)

### 4. Login com senha não funcionava (Credentials + Server Action)
- **Causa 1**: `@libsql/client` não aceita caminho relativo (`./dev.db`). O `prisma.ts` removia o prefixo `file:` com `replace("file:", "")`, gerando URL inválida.
- **Causa 2**: Mesmo após conectar ao banco, as tabelas não existiam — necessário rodar `npx prisma db push`.
- **Causa 3**: O `proxy.ts` usava `NextAuth().auth` que verificava sessão JWT do Auth.js. Como o server action setava cookies manuais (`user-id`, `user-email`), o middleware não reconhecia e redirecionava de volta ao `/login`.
- **Causa 4**: O `auth()` do Auth.js era chamado nas páginas (ex: `page.tsx`) e retornava `null` por não encontrar sessão JWT, fazendo o dashboard renderizar vazio.
- **Solução**:
  - `src/lib/prisma.ts`: usar `resolve()` + prefixo `file:` para gerar URL absoluta (`file:C:\...\dev.db`).
  - Rodar `npx prisma db push` para criar as tabelas.
  - `src/proxy.ts`: reescrito para verificar cookie `user-id` diretamente, sem depender do Auth.js.
  - `src/auth.ts`: `auth()` substituído por função que lê o cookie `user-id` e busca o usuário no banco.

### 1. Login com biometria quebrado (Passkey + WebAuthn)
- **Causa**: O `middleware.ts` criava instância separada do Auth.js **sem o PrismaAdapter**, mas o WebAuthn exige adapter → `MissingAdapter` error na inicialização.
- **Causa 2**: O login usava `signIn` de `"next-auth/react"`, que não executa o fluxo WebAuthn (não ativa fingerprint/FaceID).
- **Causa 3**: Prisma v7 mudou o engine padrão para `"client"`, que exige um driver adapter no `PrismaClient` — o `new PrismaClient()` simples parou de funcionar.
- **Solução**:
  - `src/proxy.ts`: Config separada sem provider Passkey (middleware não precisa de adapter).
  - `src/app/login/page.tsx`: Import `signIn` trocado para `"next-auth/webauthn"`.
  - `src/lib/prisma.ts`: Instalado `@prisma/adapter-libsql` + `@libsql/client` para adaptar o SQLite ao Prisma v7.

### 2. Middleware renomeado para Proxy (Next.js 16)
- O arquivo `middleware.ts` foi renomeado para `proxy.ts` conforme nova convenção do Next.js 16.

### 3. Login sem biometria (Notebook)
- **Problema**: Notebook não tem biometria, mas o login só oferecia "Entrar com Biometria".
- **Solução**:
  - Adicionado provider `Credentials` em `auth.config.ts` com senha compartilhada via `.env` (`AUTH_PASSWORD`).
  - Tela de login agora tem abas "Digital" e "Senha" para alternar entre os métodos.
  - Detecta suporte a WebAuthn (`window.PublicKeyCredential`) e exibe mensagem apropriada.
  - Se o navegador não suportar biometria, a aba Digital ainda aparece mas com aviso para usar Senha.

---

## 🔐 Autenticação - Como Funciona
- **Provider 1**: Passkey (WebAuthn) via `next-auth/providers/passkey` — para celular com biometria
- **Provider 2**: Credentials (senha) manual via server action — fallback para notebook
- **Biometria**: Auth.js gerencia o cerimonial completo — registro e login via fingerprint/FaceID
- **Senha**: Senha compartilhada em `AUTH_PASSWORD` no `.env`. Server action valida e cria usuário no banco.
- **Sessão**: Cookies manuais (`user-id`, `user-email`) definidos pelo server action, com 7 dias de validade.
- **Middleware/Proxy**: Verifica cookie `user-id` diretamente, sem depender do Auth.js.
- **Auth()**: Função customizada em `auth.ts` que lê o cookie e busca o usuário no banco.
- **Login**: Tela em `/login` com abas para escolher entre Digital (biometria) e Senha (credenciais)

---

## ✨ Novas Funcionalidades (22/05/2026)

### 7. Relatório Mensal CSV
- Página `/relatorios` lista meses com compras registradas.
- Botão "CSV" exporta relatório detalhado (mercado, data, produto, qtd, preços) + total gasto no mês.
- Arquivo baixado com encoding UTF-8 (acentuação correta no Excel/Google Sheets).

### 8. Notificações de Estoque Crítico
- Componente `CriticalStockAlert` exibe banner no dashboard com itens em falta.
- Envia notificação do navegador (API Notification) automaticamente se permitido.
- Link direto pra página de estoque.

### 9. Análise de Preços por Mercado (Multi-mercado)
- Página `/analise` agora exibe tabela de preços por mercado para cada produto.
- Destaque visual para o mercado com menor preço (tag "MELHOR").
- Ordenação automática do mais barato ao mais caro.

### 10. Compartilhar Lista de Compras
- Botão "Compartilhar" na página `/lista-compras` gera link único com validade de 7 dias.
- Link copiado automaticamente para a área de transferência.
- Página pública `/compartilhado/[token]` exibe a lista sem login.
- Modelo `SharedList` no banco com token único e expiração.

### 11. Previsão de Gastos (Estatística)
- Dashboard exibe previsão de gastos para o próximo mês baseada na média dos últimos 3 meses.
- Indicador de tendência (alta/queda/estável) compara o último mês com o anterior.
- Cálculo usa dados reais do banco, sem depender de API externa.

### 12. Modo Offline (PWA)
- `manifest.json` com ícones e configuração de app instalável.
- Service Worker (`sw.js`) com cache de assets e fallback offline.
- Metatags para suporte a iOS (apple-mobile-web-app) e Android.
- Script de registro automático do service worker no layout.

---

## 🐛 Correções Pós-Lançamento (22/05/2026)

### Página /mercados
- Criada página de listagem de mercados com total de notas e gastos.
- Botão "Novo Mercado" com modal para cadastro manual (sem precisar de nota).

### Página /config
- Criada página de configurações com informações da conta e instruções PWA.
- Formulário de alteração de nome: HTML nativo POST para `/api/update-name`.
- API route lê cookie manualmente do header (sem depender de `auth()`).
- Retorna redirect 302 para `/config` após atualizar.

### Dashboard
- Saudação dinâmica (Bom dia / Boa tarde / Boa noite).
- Nome extraído do email automaticamente no cadastro.

### Config
- `next.config.ts`: adicionado `allowedDevOrigins` para IP 100.112.32.71 (rede local).
- API route `/api/update-name` criada em path separado para evitar interceptação do Next.js.
- Lê cookie `user-id` manualmente do header HTTP.

### Leitor de QR Code da Nota (NFC-e/DANFE)
- Componente `QRScanner` com câmera + `jsqr` para escanear QR.
- Extrai chave de acesso (44 dígitos), CNPJ, data e total (modo contingência).
- Preenche formulário automaticamente na página `/nova-nota`.

### AI / Nova Nota
- `ai.ts`: inicialização lazy do OpenAI client (não quebra sem API key).
- Mensagem amigável quando API não configurada.
- Botão de QR Code removido e reimplementado funcional.

---

---

## 🐛 Correções e Melhorias (23/05/2026)

### Finalizar Compras
- Botão "FINALIZAR COMPRAS" em `/lista-compras` agora funcional.
- `finalizarComprasAction` zera o estoque de itens com stock ≤ 1 para 5 unidades.

### Busca/Filtro em Notas e Estoque
- Componente `SearchInput` com `?q=` na URL para busca em tempo real.
- `/notas`: busca por nome do mercado E por nome do produto dentro dos itens.
- `/estoque`: busca por nome do produto.
- `/notas?mercado=XXX`: filtro por mercado específico (link vindo de `/mercados`).

### Login Digital (Passkey) corrigido
- O `jwt` callback do NextAuth agora seta o cookie `user-id` após autenticação bem-sucedida.
- O proxy/middleware reconhece o cookie e permite o acesso normalmente.
- Aba "Digital" agora deve funcionar em dispositivos com biometria.

### manifest.json corrigido
- Ícones trocados de `.png` para `.svg` (arquivos existentes no `public/`).

### Página /offline criada
- Service worker não quebra mais tentando cachear rota inexistente.

### Ícone de notificação corrigido
- `CriticalStockAlert` agora usa `/icon-192.svg` em vez de `/icon.png` (inexistente).

### Migration regenerada
- `prisma/migrations/` recriada do zero, 100% consistente com `schema.prisma`.
- Novo setup: `npx prisma migrate dev` funciona direto (sem precisar de `db push`).

### Botão Sair corrigido
- `signOut` do `next-auth/react` só limpava cookie do NextAuth, não os cookies manuais.
- Criado `logoutAction` server action que deleta `user-id` e `user-email` e redireciona para `/login`.
- Sidebar agora usa form com server action em vez de `signOut()`.

---

## ✨ Novas Funcionalidades com IA (23/05/2026)

### Categorização Automática de Produtos
- `ai.ts`: nova função `categorizeProduct()` que identifica a categoria de um produto pelo nome.
- Ao salvar uma nota, cada produto recebe categoria automática (Hortifrúti, Laticínios, Carnes, etc.).
- Cria categorias novas no banco conforme necessário.
- Fallback para "Geral" se IA não configurada.

### Assistente IA (Chat)
- Nova página `/assistente` com interface de chat.
- API route `/api/assistente` que busca dados reais do usuário (gastos, estoque, compras recentes) e envia para IA.
- Perguntas em linguagem natural: "quanto gastei esse mês?", "qual mercado mais barato?".
- Fallback amigável se IA não configurada.

### Previsão Inteligente de Gastos
- Dashboard agora usa IA (`analyzeSpendingTrend`) para analisar tendência dos últimos meses.
- Se IA não configurada, usa média simples (fallback).
- Card mostra insight textual explicando a tendência.

### Detecção de Preço Anormal
- Dashboard analisa produtos com histórico de preços.
- IA (`detectPriceAnomaly`) identifica variações acima de 15% da média.
- Card "Preços Anormais" exibe alertas no dashboard.
- Fallback silencioso se IA não configurada.

### Busca de Preços Online (DuckDuckGo HTML Search)
- Novo botão "Preço online" em cada produto na página `/analise`.
- `priceSearch.ts` consulta DuckDuckGo HTML search (gratuito, sem API key).
- Filtro de domínios: só exibe resultados de e-commerces brasileiros conhecidos (MercadoLivre, Carrefour, Amazon, Shopee, Magalu, etc.).
- API route `/api/pesquisar-preco` faz a busca no servidor.
- Componente `PriceSearchButton` exibe resultados (loja + preço) com link externo.
- Substituiu Google Custom Search API (não aceita mais novos cadastros) e Brave Search API (exige cartão de crédito).

---

## 🐛 Correções e Melhorias (23/05/2026 — tarde)

### Compressão de imagem no upload de nota
- `handleFileChange` em `/nova-nota` agora comprime a foto via Canvas API antes de enviar pra IA.
- Redimensiona pra max 1024px de largura, qualidade JPEG 0.7.
- Reduz drasticamente tokens gastos em chamadas de visão (foto de 8MB → ~100-200KB).

*Log atualizado em 23/05/2026*
