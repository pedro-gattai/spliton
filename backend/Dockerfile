# Dockerfile para Backend Spliton - Railway Deploy com Migrations Automáticas
FROM node:20-alpine

# Instalar dependências necessárias para Prisma com PostgreSQL
RUN apk add --no-cache openssl bash

# Criar diretório da aplicação
WORKDIR /app

# Copiar package.json do backend
COPY backend/package.json ./

# Instalar todas as dependências (incluindo dev dependencies para build)
RUN npm install

# Copiar código fonte do backend (incluindo prisma)
COPY backend/ ./

# Verificar estrutura de arquivos
RUN echo "📁 Verificando estrutura:" && ls -la

# Criar script de inicialização inline se não existir
RUN if [ ! -f "scripts/start.sh" ]; then \
        echo "⚠️ Script start.sh não encontrado, criando inline..." && \
        mkdir -p scripts && \
        echo '#!/bin/bash' > scripts/start.sh && \
        echo 'echo "🚀 Iniciando Backend SplitOn..."' >> scripts/start.sh && \
        echo 'echo "📊 Executando migrações..."' >> scripts/start.sh && \
        echo 'npx prisma migrate deploy' >> scripts/start.sh && \
        echo 'echo "✅ Iniciando aplicação..."' >> scripts/start.sh && \
        echo 'node dist/src/main.js' >> scripts/start.sh && \
        chmod +x scripts/start.sh; \
    fi

# Verificar se o script existe agora
RUN ls -la scripts/ && cat scripts/start.sh

# Gerar Prisma Client
RUN npx prisma generate

# Build da aplicação
RUN npm run build

# Verificar se o build foi bem-sucedido
RUN ls -la dist/src/

# Expor porta
EXPOSE 3000

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Comando de inicialização com fallback
CMD ["sh", "-c", "if [ -f '/app/scripts/start.sh' ]; then echo '✅ Usando script start.sh' && /app/scripts/start.sh; else echo '⚠️ Fallback: executando diretamente' && npx prisma migrate deploy && node dist/src/main.js; fi"]
