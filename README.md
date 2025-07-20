<img src=".assets/spliton-logo.png"> </img>
# Spliton 
Hack-a-TON 
<img src=".assets/clientRoadMap.png"> </img>

## Features

- Cadastro e autenticação de usuários (login via carteira TON)
- Criação e gerenciamento de grupos de despesas
- Adição de despesas compartilhadas com divisão automática
- Visualização de saldos individuais e totais
- Pagamentos diretos em TON ou tokens suportados (on-chain)
- Notificações de despesas, cobranças e pagamentos
- Histórico de transações e despesas
- Exportação de relatórios (PDF, CSV) -> nice to have (P3)
- Integração com QR Code para pagamentos -> nice to have (P2)
- Sistema de comentários ou anexos em despesas -> nice to have (P1)
- Interface web/mobile responsiva
- **Bot do Telegram** para acesso rápido ao aplicativo

## Project Structure

This is a monorepo containing:
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Shadcn/ui
- **Backend**: NestJS + TypeScript
- **Smart Contracts**: TON blockchain contracts (Tact)
- **Telegram Bot**: Python bot para acesso rápido ao app

## Step-by-step guide

### Prerequisites
- Node.js >= 18.0.0
- npm >= 8.0.0
- Python 3.11+ (para o bot do Telegram)
- Install the Tact Language extension in your IDE (e.g., VSCode)

### Setup

1. **Install all dependencies:**
```bash
npm run install:all
```

2. **Start development servers:**
```bash
# Start both frontend and backend
npm run dev

# Or start them separately:
npm run dev:frontend  # Frontend on http://localhost:5173
npm run dev:backend   # Backend on http://localhost:3000
```

3. **Build for production:**
```bash
npm run build
```

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:frontend` - Start only frontend
- `npm run dev:backend` - Start only backend
- `npm run build` - Build both frontend and backend
- `npm run lint` - Lint both frontend and backend
- `npm run test` - Run tests for both frontend and backend

### Smart Contracts Setup

For the TON smart contracts:

```bash
cd simple-counter
yarn create ton simple-counter --type tact-counter --contractName SimpleCounter
```

## Deploy

### Backend (Railway)

O backend já está configurado para deploy no Railway. Veja o arquivo `railway.toml` para configurações.

### Frontend (Cloudflare Pages)

O frontend está configurado para deploy no Cloudflare Pages.

### Bot do Telegram (Railway)

#### Passo a Passo para Deploy do Bot:

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

#### Comandos do Bot:

- `/start` - Mensagem de boas-vindas com botão para o app
- `/help` - Instruções de uso

#### Desenvolvimento Local do Bot:

```bash
cd telegramBot
pip install -r requirements.txt
cp env.example .env
# Edite o .env com seu BOT_TOKEN
python bot.py
```

### Estrutura de Deploy:

```
Railway (Backend + Bot)
├── Backend (NestJS) - Porta 3000
└── Bot Telegram (Python) - Container separado

Cloudflare Pages (Frontend)
└── React App - Porta 5173
```
