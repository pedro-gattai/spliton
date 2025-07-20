# Guia de Deploy - SplitOn

## 📁 Estrutura Organizada

```
spliton/
├── backend/
│   ├── Dockerfile          # Dockerfile específico do backend
│   └── railway.toml        # Configuração Railway do backend
├── telegramBot/
│   ├── Dockerfile          # Dockerfile específico do bot
│   ├── railway.toml        # Configuração Railway do bot
│   └── bot.py              # Código do bot
├── backend.toml            # Configuração Railway (raiz) → backend/
├── telegram-bot.toml       # Configuração Railway (raiz) → telegramBot/
└── docker-compose.yml      # Desenvolvimento local
```

## 🚀 Deploy no Railway

### **Projeto 1: Backend (NestJS)**

1. **Criar projeto no Railway:**
   - Acesse [railway.app](https://railway.app)
   - Clique em **"New Project"**
   - Selecione **"Deploy from GitHub repo"**
   - Escolha seu repositório `spliton`
   - **Diretório raiz**: `/` (padrão)

2. **Configurar build:**
   - **Builder**: `DOCKERFILE`
   - **Dockerfile Path**: `backend/Dockerfile`
   - O Railway usará o `backend.toml` automaticamente

3. **Configurar variáveis:**
   ```
   DATABASE_URL=postgresql://username:password@host:port/database
   NODE_ENV=production
   PORT=3000
   ```

### **Projeto 2: Bot do Telegram (Python)**

1. **Criar novo projeto no Railway:**
   - Clique em **"New Project"**
   - Selecione **"Deploy from GitHub repo"**
   - Escolha o mesmo repositório `spliton`
   - **Diretório raiz**: `/` (padrão)

2. **Configurar build:**
   - **Builder**: `DOCKERFILE`
   - **Dockerfile Path**: `telegramBot/Dockerfile`
   - O Railway usará o `telegram-bot.toml` automaticamente

3. **Configurar variáveis:**
   ```
   BOT_TOKEN=8002940590:AAEqbgYbZRG2l_obWUfbY5Aa4ODrVHiwMa4
   ```

## 🔧 Configuração Manual

### **Backend:**
```toml
# backend.toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "backend/Dockerfile"

[deploy]
startCommand = "./scripts/start.sh"
healthcheckPath = "/health"
```

### **Bot:**
```toml
# telegram-bot.toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "telegramBot/Dockerfile"

[deploy]
startCommand = "python bot.py"
healthcheckPath = "/"
```

## 📋 Checklist de Deploy

### **Backend:**
- [ ] Projeto criado no Railway
- [ ] Diretório raiz: `/`
- [ ] Dockerfile Path: `backend/Dockerfile`
- [ ] Variáveis configuradas (DATABASE_URL, NODE_ENV, PORT)
- [ ] PostgreSQL adicionado
- [ ] Deploy executado
- [ ] Logs verificados

### **Bot:**
- [ ] Projeto criado no Railway
- [ ] Diretório raiz: `/`
- [ ] Dockerfile Path: `telegramBot/Dockerfile`
- [ ] Variável BOT_TOKEN configurada
- [ ] Deploy executado
- [ ] Logs verificados
- [ ] Bot testado no Telegram

## 🎯 Logs Esperados

### **Backend:**
```
✅ Prisma Client generated
✅ Application is running on: http://0.0.0.0:3000
```

### **Bot:**
```
🤖 Bot SplitOn iniciado!
Pressione Ctrl+C para parar.
```

## 🔍 Troubleshooting

### **Problemas Comuns:**

1. **"Dockerfile not found":**
   - Verifique se o `dockerfilePath` está correto
   - Confirme que os arquivos existem nas pastas

2. **"Build failed":**
   - Verifique os logs de build
   - Confirme que as dependências estão corretas

3. **"Bot not starting":**
   - Verifique se o BOT_TOKEN está configurado
   - Confirme que o token é válido

## 💡 Vantagens da Nova Estrutura

1. **Organização**: Cada serviço tem sua própria pasta
2. **Manutenibilidade**: Arquivos relacionados ficam juntos
3. **Flexibilidade**: Fácil de adicionar novos serviços
4. **Clareza**: Estrutura mais limpa e profissional 