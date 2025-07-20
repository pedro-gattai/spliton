# Dockerfile para Backend Spliton - Railway Deploy
FROM node:18-alpine

# Instalar dependências necessárias para Prisma com PostgreSQL
RUN apk add --no-cache openssl

# Criar diretório da aplicação
WORKDIR /app

# Copiar package.json do backend
COPY backend/package.json ./

# Instalar todas as dependências (incluindo dev dependencies para build)
RUN npm install

# Verificar se o NestJS CLI está instalado
RUN npx nest --version

# Copiar código fonte do backend (incluindo prisma)
COPY backend/ ./

# Gerar Prisma Client (após copiar os arquivos)
RUN npx prisma generate

# Verificar se os arquivos estão presentes
RUN ls -la src/
RUN ls -la prisma/

# Build da aplicação
RUN npm run build

# Verificar se o build foi bem-sucedido
RUN ls -la dist/
RUN ls -la dist/main*

# Tornar o script de inicialização executável (se existir)
RUN if [ -f "scripts/start.sh" ]; then chmod +x scripts/start.sh; fi

# Expor porta
EXPOSE 3000

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Comando para iniciar a aplicação (usando npm diretamente)
CMD ["sh", "-c", "ls -la dist/ && npm run start:prod"] 