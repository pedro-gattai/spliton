# Bot Telegram SplitOn

Bot do Telegram para o aplicativo SplitOn - divida contas com seus amigos de forma fácil!

## Configuração Local

1. Instale as dependências:
```bash
pip install -r requirements.txt
```

2. Configure as variáveis de ambiente:
```bash
cp env.example .env
# Edite o arquivo .env com seu BOT_TOKEN
```

3. Execute o bot:
```bash
python bot.py
```

## Deploy no Railway

### Passo a Passo:

1. **Criar novo projeto no Railway:**
   - Acesse [railway.app](https://railway.app)
   - Clique em "New Project"
   - Selecione "Deploy from GitHub repo"
   - Conecte seu repositório GitHub

2. **Configurar o projeto:**
   - Selecione a pasta `telegramBot` como diretório raiz
   - O Railway detectará automaticamente o Dockerfile

3. **Configurar variáveis de ambiente:**
   - Vá em "Variables" no projeto
   - Adicione a variável:
     - `BOT_TOKEN`: Seu token do bot (obtido no @BotFather)

4. **Deploy:**
   - O Railway fará o deploy automaticamente
   - Monitore os logs para verificar se o bot iniciou corretamente

### Comandos Disponíveis:

- `/start` - Mensagem de boas-vindas com botão para o app
- `/help` - Instruções de uso

### Logs e Monitoramento:

- Acesse a aba "Deployments" para ver os logs
- O bot será reiniciado automaticamente em caso de falha
- Configure alertas para monitorar a saúde do serviço

## Estrutura do Projeto:

```
telegramBot/
├── bot.py              # Código principal do bot
├── requirements.txt    # Dependências Python
├── Dockerfile         # Configuração Docker
├── railway.toml       # Configuração Railway
├── env.example        # Exemplo de variáveis de ambiente
└── README.md          # Este arquivo
``` 