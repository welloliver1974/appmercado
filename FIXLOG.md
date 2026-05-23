# FIXLOG - AppMercado 🛒

Este log detalha todas as etapas de desenvolvimento, funcionalidades implementadas e a estrutura do projeto **AppMercado**.

## 🚀 Visão Geral
O AppMercado é um web app completo para gerenciamento de compras de supermercado, focado em automação via IA, controle de estoque e análise financeira.

---

## 🛠️ Tecnologias Utilizadas
- **Framework**: Next.js 15 (App Router)
- **Estilização**: Tailwind CSS (Tema Dark Premium: Preto e Azul)
- **Banco de Dados**: SQLite com Prisma ORM
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
- `src/lib/ai.ts`: Configuração do motor de IA (OpenRouter/Groq).
- `src/app/actions/`: Lógica de servidor para DB (Salvar notas, atualizar estoque).
- `prisma/schema.prisma`: Modelagem do banco de dados.

---

## 🔧 Configuração Necessária
Para o funcionamento da IA, as seguintes variáveis devem estar no arquivo `.env`:
- `OPENROUTER_API_KEY` ou `GROQ_API_KEY`
- `NEXT_PUBLIC_AI_PROVIDER` (definido como 'openrouter' ou 'groq')

---
*Log gerado em 22/05/2026*
