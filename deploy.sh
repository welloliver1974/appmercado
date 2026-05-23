#!/usr/bin/env bash
set -e

echo "🧹 Limpando .open-next ..."
rm -rf .open-next

echo "🔨 Executando npm run build ..."
npm run build

# Garante que o config está no local esperado
if [ -f .open-next/open-next.config.mjs ]; then
  echo "✅ Config já está no lugar"
else
  echo "⚠️ Copiando config manualmente"
  cp .open-next/.build/open-next.config.mjs .open-next/open-next.config.mjs
fi

echo "🚀 Fazendo deploy..."
npx wrangler deploy

echo "✅ Deploy concluído"
