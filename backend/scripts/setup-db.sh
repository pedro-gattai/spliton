#!/bin/bash

echo "=== Configuração do Banco de Dados Spliton ==="

# Verificar se o PostgreSQL está instalado
echo "Verificando se o PostgreSQL está instalado..."
if command -v psql &> /dev/null; then
    echo "PostgreSQL encontrado: $(psql --version)"
else
    echo "PostgreSQL não encontrado. Por favor, instale o PostgreSQL primeiro."
    echo "Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    echo "macOS: brew install postgresql"
    exit 1
fi

# Criar banco de dados (se não existir)
echo "Criando banco de dados 'spliton'..."
psql -U postgres -c "CREATE DATABASE spliton;" 2>/dev/null || echo "Banco de dados 'spliton' já existe ou erro na criação."

# Instalar dependências do Prisma
echo "Instalando dependências do Prisma..."
npm install

# Gerar cliente Prisma
echo "Gerando cliente Prisma..."
npx prisma generate

# Aplicar schema ao banco
echo "Aplicando schema ao banco de dados..."
npx prisma db push

echo "=== Configuração concluída! ==="
echo "Para abrir o Prisma Studio: npm run prisma:studio"
echo "Para iniciar o servidor: npm run start:dev" 