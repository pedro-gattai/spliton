#!/bin/bash

# Script de inicialização para o Backend SplitOn com Migrations Automáticas
echo "🚀 Iniciando Backend SplitOn..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: package.json não encontrado!"
    echo "Certifique-se de estar no diretório correto."
    exit 1
fi

# Aguardar banco de dados estar disponível (importante para Railway)
echo "⏳ Aguardando banco de dados estar disponível..."
for i in {1..3}; do
    if npx prisma db status > /dev/null 2>&1; then
        echo "✅ Banco de dados disponível!"
        break
    fi
    echo "⏳ Tentativa $i/30 - Aguardando banco..."
    sleep 5
done

# Executar migrações do Prisma de forma segura
echo "📊 Executando migrações do Prisma..."
npx prisma migrate deploy

# Verificar se as migrações foram bem-sucedidas
if [ $? -eq 0 ]; then
    echo "✅ Migrações executadas com sucesso!"
else
    echo "❌ Erro ao executar migrações!"
    exit 1
fi

# Gerar Prisma Client
echo "🔧 Gerando Prisma Client..."
npx prisma generate

# Iniciar a aplicação
echo "✅ Iniciando aplicação NestJS..."
node dist/src/main.js
