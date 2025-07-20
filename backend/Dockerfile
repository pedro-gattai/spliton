# Dockerfile para Backend Spliton - Railway Deploy com Migrations Automáticas
FROM node:20-alpine

# Instalar dependências necessárias para Prisma com PostgreSQL
RUN apk add --no-cache openssl

# Criar diretório da aplicação
WORKDIR /app

# Copiar package.json do backend
COPY backend/package.json ./

# Instalar todas as dependências (incluindo dev dependencies para build)
RUN npm install

# Copiar código fonte do backend (incluindo prisma)
COPY backend/ ./

# Gerar Prisma Client
RUN npx prisma generate

# Build da aplicação
RUN npm run build

# Tornar o script de inicialização executável
RUN chmod +x scripts/start.sh

# Verificar se o script existe
RUN ls -la scripts/start.sh

# Expor porta
EXPOSE 3000

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# ✅ NOVO: Comando que executa migrations e inicia a aplicação
# Usar o script de inicialização com caminho absoluto
CMD ["/app/scripts/start.sh"]
