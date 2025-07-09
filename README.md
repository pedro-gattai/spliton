<img src="./spliton-logo.png"> </img>
# Spliton 
Hack-a-TON 
<img src="./clientRoadMap.png"> </img>

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

## Project Structure

This is a monorepo containing:
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Shadcn/ui
- **Backend**: NestJS + TypeScript
- **Smart Contracts**: TON blockchain contracts (Tact)

## Step-by-step guide

### Prerequisites
- Node.js >= 18.0.0
- npm >= 8.0.0
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
