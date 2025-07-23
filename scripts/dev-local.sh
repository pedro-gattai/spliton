#!/bin/bash

# Script para desenvolvimento local do SplitOn
echo "🚀 Iniciando SplitOn - Desenvolvimento Local"

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Inicie o Docker e tente novamente."
    exit 1
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker compose down

# Construir e iniciar containers
echo "🔨 Construindo e iniciando containers..."
docker compose up -d --build

# Aguardar banco estar pronto
echo "⏳ Aguardando banco de dados estar pronto..."
sleep 10

# Verificar status dos containers
echo "📊 Status dos containers:"
docker compose ps

echo ""
echo "✅ SplitOn iniciado com sucesso!"
echo "🌐 Backend: http://localhost:3000"
echo "🗄️  Banco: localhost:5432"
echo ""
echo "📋 Comandos úteis:"
echo "  docker compose logs -f backend    # Ver logs do backend"
echo "  docker compose logs -f postgres   # Ver logs do banco"
echo "  docker compose down               # Parar todos os containers"
echo "  docker compose restart backend    # Reiniciar apenas o backend" 