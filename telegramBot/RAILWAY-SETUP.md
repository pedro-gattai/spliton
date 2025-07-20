# Configuração do Bot no Railway - Guia Visual

## Passo a Passo na Interface do Railway

### 1. Criar Novo Projeto

1. **Acesse Railway:**
   - Vá para [railway.app](https://railway.app)
   - Clique em **"New Project"**

2. **Selecionar Repositório:**
   - Escolha **"Deploy from GitHub repo"**
   - Selecione seu repositório `spliton`

3. **Configurar Diretório:**
   - **IMPORTANTE**: Configure o diretório raiz como `/telegramBot`
   - Isso fará o Railway usar apenas a pasta do bot

### 2. Configurar Build (Seção que você está vendo)

Na seção **"Build"**:

1. **Builder:**
   - Clique no dropdown onde está "Nixpacks"
   - Selecione **"Dockerfile"**
   - O Railway detectará automaticamente o `Dockerfile` na pasta

2. **Custom Build Command:**
   - Deixe vazio (não precisa)

3. **Watch Paths:**
   - Deixe vazio (deploy automático)

### 3. Configurar Deploy

Na seção **"Deploy"**:

1. **Start Command:**
   - Deixe vazio (o Dockerfile já define: `python bot.py`)

2. **Health Check:**
   - Deixe vazio (bot não precisa de health check)

### 4. Configurar Variáveis de Ambiente

1. **Acessar Variables:**
   - Clique em **"Variables"** no menu lateral
   - Clique em **"+ New Variable"**

2. **Adicionar BOT_TOKEN:**
   - **Nome**: `BOT_TOKEN`
   - **Valor**: `8002940590:AAEqbgYbZRG2l_obWUfbY5Aa4ODrVHiwMa4`

### 5. Deploy

1. **Fazer Deploy:**
   - Clique em **"Deploy"** ou aguarde o deploy automático
   - Monitore os logs na aba "Deployments"

2. **Verificar Logs:**
   - Vá em **"Deployments"** → **"Latest"**
   - Clique em **"View Logs"**
   - Deve aparecer: `🤖 Bot SplitOn iniciado!`

## Configurações Alternativas

### Se o Dockerfile não for detectado:

1. **Usar railway-simple.toml:**
   - Renomeie `railway-simple.toml` para `railway.toml`
   - Faça commit e push
   - O Railway usará essa configuração mais simples

### Se precisar de configuração manual:

1. **Na seção Build:**
   - Builder: `DOCKERFILE`
   - Dockerfile Path: `Dockerfile`

2. **Na seção Deploy:**
   - Start Command: `python bot.py`

## Troubleshooting

### Problemas Comuns:

1. **"No Dockerfile found":**
   - Verifique se está no diretório `/telegramBot`
   - Confirme que o `Dockerfile` existe na pasta

2. **"Build failed":**
   - Verifique os logs de build
   - Confirme que o `requirements.txt` está correto

3. **"Bot not starting":**
   - Verifique se o `BOT_TOKEN` está configurado
   - Confirme que o token é válido

### Logs Esperados:

```
✅ Build successful
🤖 Bot SplitOn iniciado!
Pressione Ctrl+C para parar.
```

## Estrutura Final

```
Railway Project: spliton-bot
├── Diretório: /telegramBot
├── Builder: Dockerfile
├── Start Command: python bot.py
└── Variables:
    └── BOT_TOKEN=seu_token_aqui
```

## Teste do Bot

Após o deploy:

1. **No Telegram:**
   - Procure seu bot
   - Digite `/start`
   - Deve aparecer a mensagem de boas-vindas

2. **No Railway:**
   - Monitore os logs em tempo real
   - Verifique se há erros 