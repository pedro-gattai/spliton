# Script para configurar o banco de dados PostgreSQL
Write-Host "=== Configuração do Banco de Dados Spliton ===" -ForegroundColor Green

# Verificar se o PostgreSQL está instalado
Write-Host "Verificando se o PostgreSQL está instalado..." -ForegroundColor Yellow
try {
    $pgVersion = psql --version 2>$null
    if ($pgVersion) {
        Write-Host "PostgreSQL encontrado: $pgVersion" -ForegroundColor Green
    } else {
        Write-Host "PostgreSQL não encontrado. Por favor, instale o PostgreSQL primeiro." -ForegroundColor Red
        Write-Host "Download: https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
        exit 1
    }
} catch {
    Write-Host "PostgreSQL não encontrado. Por favor, instale o PostgreSQL primeiro." -ForegroundColor Red
    Write-Host "Download: https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    exit 1
}

# Criar banco de dados (se não existir)
Write-Host "Criando banco de dados 'spliton'..." -ForegroundColor Yellow
try {
    psql -U postgres -c "CREATE DATABASE spliton;" 2>$null
    Write-Host "Banco de dados 'spliton' criado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "Banco de dados 'spliton' já existe ou erro na criação." -ForegroundColor Yellow
}

# Instalar dependências do Prisma
Write-Host "Instalando dependências do Prisma..." -ForegroundColor Yellow
npm install

# Gerar cliente Prisma
Write-Host "Gerando cliente Prisma..." -ForegroundColor Yellow
npx prisma generate

# Aplicar schema ao banco
Write-Host "Aplicando schema ao banco de dados..." -ForegroundColor Yellow
npx prisma db push

Write-Host "=== Configuração concluída! ===" -ForegroundColor Green
Write-Host "Para abrir o Prisma Studio: npm run prisma:studio" -ForegroundColor Cyan
Write-Host "Para iniciar o servidor: npm run start:dev" -ForegroundColor Cyan 