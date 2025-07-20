# Dockerfile para Backend Spliton - Railway Deploy
FROM node:18-alpine

# Instalar dependências necessárias para Prisma com PostgreSQL
RUN apk add --no-cache openssl

# Criar diretório da aplicação
WORKDIR /app

# Copiar package.json
COPY package.json ./

# Instalar todas as dependências (incluindo dev dependencies para build)
RUN npm install

# Copiar código fonte
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Build da aplicação
RUN npm run build

# Verificar se o build foi bem-sucedido
RUN ls -la dist/

# Tornar o script de inicialização executável (se existir)
RUN if [ -f "scripts/start.sh" ]; then chmod +x scripts/start.sh; fi

# Expor porta
EXPOSE 3000

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Comando para iniciar a aplicação (usando npm diretamente)
CMD ["npm", "run", "start:prod"] 