#!/bin/bash

# Script de inicialização para o Backend SplitOn
echo "🚀 Iniciando Backend SplitOn..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: package.json não encontrado!"
    echo "Certifique-se de estar no diretório correto."
    exit 1
fi

# Executar migrações do Prisma se necessário
echo "📊 Executando migrações do Prisma..."
npx prisma migrate deploy

# Gerar Prisma Client
echo "🔧 Gerando Prisma Client..."
npx prisma generate

# Iniciar a aplicação
echo "✅ Iniciando aplicação NestJS..."
npm run start:prod 