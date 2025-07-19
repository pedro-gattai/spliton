# Dockerfile para Backend Spliton - Railway Deploy
FROM node:18-alpine

# Instalar dependências necessárias para Prisma com PostgreSQL
RUN apk add --no-cache openssl

# Criar diretório da aplicação
WORKDIR /app

# Copiar package.json
COPY backend/package.json ./

# Instalar todas as dependências (incluindo dev dependencies para build)
RUN npm install

# Copiar código fonte
COPY backend/ ./

# Gerar Prisma Client
RUN npx prisma generate

# Build da aplicação
RUN npm run build

# Tornar o script de inicialização executável
RUN chmod +x scripts/start.sh

# Expor porta
EXPOSE 3000

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Comando para iniciar a aplicação
CMD ["./scripts/start.sh"] 