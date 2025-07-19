# Dockerfile para Backend Spliton - Deploy Simples
FROM node:18-alpine

# Criar diretório da aplicação
WORKDIR /app

# Copiar package.json
COPY backend/package.json ./

# Instalar dependências (usando npm install já que não há package-lock.json)
RUN npm install --omit=dev --no-audit

# Instalar dependências de build temporariamente
RUN npm install @nestjs/cli typescript --no-save

# Copiar código fonte
COPY backend/ ./

# Gerar Prisma Client
RUN npx prisma generate

# Build da aplicação
RUN npm run build

# Remover dependências de build desnecessárias
RUN npm uninstall @nestjs/cli typescript
RUN npm prune --omit=dev

# Expor porta
EXPOSE 3000

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Comando para iniciar a aplicação
CMD ["node", "dist/src/main.js"] 