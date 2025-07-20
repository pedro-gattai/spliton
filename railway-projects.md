# Guia de Deploy no Railway - SplitOn

Este guia explica como configurar e gerenciar os projetos do SplitOn no Railway.

## Estrutura dos Projetos

### 1. Backend (NestJS)
- **Diretório**: `/` (raiz do projeto)
- **Dockerfile**: `Dockerfile`
- **Configuração**: `railway.toml`
- **Porta**: 3000

### 2. Bot do Telegram (Python)
- **Diretório**: `/telegramBot`
- **Dockerfile**: `telegramBot/Dockerfile`
- **Configuração**: `telegramBot/railway.toml`
- **Porta**: 8000 (opcional)

## Passo a Passo Completo

### Passo 1: Preparar o Repositório

1. **Commit e push das alterações:**
```bash
git add .
git commit -m "Add Telegram bot deployment configuration"
git push origin main
```

### Passo 2: Deploy do Backend

1. **Acesse o Railway:**
   - Vá para [railway.app](https://railway.app)
   - Faça login com sua conta GitHub

2. **Criar projeto do Backend:**
   - Clique em "New Project"
   - Selecione "Deploy from GitHub repo"
   - Escolha seu repositório `spliton`
   - **IMPORTANTE**: Deixe o diretório raiz como `/` (padrão)

3. **Configurar variáveis de ambiente:**
   - Vá em "Variables" no projeto
   - Adicione as seguintes variáveis:
     ```
     DATABASE_URL=postgresql://postgres:password@postgres:5432/spliton?schema=public
     NODE_ENV=production
     PORT=3000
     ```

4. **Deploy:**
   - O Railway detectará automaticamente o Dockerfile
   - Aguarde o build e deploy completarem
   - Verifique os logs para confirmar que iniciou corretamente

### Passo 3: Deploy do Bot do Telegram

1. **Criar novo projeto para o bot:**
   - Clique em "New Project" novamente
   - Selecione "Deploy from GitHub repo"
   - Escolha o mesmo repositório `spliton`
   - **IMPORTANTE**: Configure o diretório raiz como `/telegramBot`

2. **Configurar variáveis de ambiente:**
   - Vá em "Variables" no projeto
   - Adicione a variável:
     ```
     BOT_TOKEN=seu_token_do_bot_aqui
     ```

3. **Deploy:**
   - O Railway detectará o Dockerfile na pasta telegramBot
   - Aguarde o build e deploy completarem
   - Verifique os logs para confirmar que o bot iniciou

### Passo 4: Configurar Banco de Dados

1. **Adicionar PostgreSQL:**
   - No projeto do backend, clique em "New"
   - Selecione "Database" → "PostgreSQL"
   - O Railway criará automaticamente um banco PostgreSQL

2. **Configurar DATABASE_URL:**
   - Vá em "Variables" do projeto backend
   - Atualize a `DATABASE_URL` com a URL fornecida pelo Railway
   - Formato: `postgresql://username:password@host:port/database`

3. **Executar migrações:**
   - Vá em "Deployments" → "Latest"
   - Clique em "View Logs"
   - Verifique se as migrações do Prisma foram executadas

### Passo 5: Configurar Domínios

1. **Backend:**
   - No projeto backend, vá em "Settings" → "Domains"
   - O Railway fornecerá um domínio automático
   - Você pode configurar um domínio customizado se desejar

2. **Bot:**
   - O bot não precisa de domínio público
   - Ele funciona internamente via polling do Telegram

## Monitoramento e Logs

### Verificar Status dos Serviços:

1. **Backend:**
   - Acesse o projeto backend no Railway
   - Vá em "Deployments" para ver o status
   - Clique em "View Logs" para ver logs em tempo real

2. **Bot:**
   - Acesse o projeto do bot no Railway
   - Vá em "Deployments" para ver o status
   - Clique em "View Logs" para ver logs em tempo real

### Logs Importantes:

**Backend:**
```
✅ Prisma Client generated
✅ Application is running on: http://0.0.0.0:3000
```

**Bot:**
```
🤖 Bot SplitOn iniciado!
Pressione Ctrl+C para parar.
```

## Troubleshooting

### Problemas Comuns:

1. **Bot não inicia:**
   - Verifique se o `BOT_TOKEN` está configurado corretamente
   - Confirme que o token é válido no @BotFather

2. **Backend não conecta ao banco:**
   - Verifique se a `DATABASE_URL` está correta
   - Confirme se o PostgreSQL está ativo

3. **Build falha:**
   - Verifique se todos os arquivos foram commitados
   - Confirme se o Dockerfile está correto

### Comandos Úteis:

```bash
# Ver logs do Railway CLI
railway logs

# Fazer deploy manual
railway up

# Ver status dos serviços
railway status
```

## Custos e Limites

- **Railway Free Tier:**
  - 500 horas/mês de runtime
  - 1GB de RAM por serviço
  - 1GB de storage

- **PostgreSQL:**
  - 1GB de storage incluído
  - Backup automático

## Próximos Passos

1. **Configurar domínios customizados** (opcional)
2. **Configurar alertas de monitoramento**
3. **Configurar CI/CD automático**
4. **Implementar health checks personalizados** 