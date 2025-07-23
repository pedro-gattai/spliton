<img src=".assets/spliton-logo.png"> </img>
# SplitOn 
**Hack-a-TON - Divisão Inteligente de Despesas na Blockchain TON**

<img src=".assets/clientRoadMap.png"> </img>

## 🎯 Sobre o Projeto

SplitOn é uma aplicação descentralizada para divisão de despesas de maneira facilitada construída na blockchain TON. Permite que usuários criem grupos, adicionem despesas compartilhadas e realizem pagamentos diretos em TON, tudo de forma transparente e segura.

### 

## ✨ Features Principais

- 🔐 **Autenticação via carteira TON** - Login seguro e descentralizado
- 👥 **Gerenciamento de grupos** - Crie e gerencie grupos de despesas
- 💰 **Divisão automática** - Calcule automaticamente quem deve quanto
- 🏦 **Pagamentos on-chain** - Transações diretas em TON
- 📱 **Interface responsiva** - Funciona em desktop e mobile
- 🤖 **Bot do Telegram** - Acesso rápido via Telegram
- 📊 **Histórico completo** - Visualize todas as transações
- ⚡ **Notificações** - Receba alertas de despesas e pagamentos(Em breve)

## 🏗️ Arquitetura do Projeto

### **Arquitetura do software**
<img src=".assets/arquiteturaSpliton.png"></img>

O usuario acessa a aplicação;

i. por meio da interface web, a interafce web faz requisicoes para o backend que busca informacoes no banco dados para mostrar as informacoes ao usuario, quando ele executa alguma acao o backend atualiza no banco e quando o usuario realiza um pagamento ele executa o smartcontract, sempre salvando as informacoes no banco

ii. por meio do bot do telegram, o bot do telegram envia uma mensagem de boas vindas e um link para abrir o mini app dentro do aplicativo do telegram, o mini app faz requisicoes para o backend que busca informacoes no banco dados para mostrar as informacoes ao usuario, quando ele executa alguma acao o backend atualiza no banco e quando o usuario realiza um pagamento ele executa o smartcontract, sempre salvando as informacoes no banco.

### **Stack Tecnológica**

#### **Frontend**
- **React 18** + **TypeScript** - Interface moderna e tipada
- **Vite** - Build tool rápido
- **Tailwind CSS** - Estilização utilitária
- **Radix UI** - Componentes acessíveis
- **React Router** - Navegação SPA
- **TanStack Query** - Gerenciamento de estado do servidor

#### **Backend**
- **NestJS** - Framework Node.js robusto
- **Prisma ORM** - Banco de dados type-safe
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação
- **Class Validator** - Validação de dados

#### **Blockchain**
- **TON Connect** - Integração com carteiras TON
- **Tact** - Smart contracts (futuro)
- **TON API** - Interação com blockchain

#### **Infraestrutura**
- **Docker** - Containerização
- **Railway** - Deploy automático
- **Cloudflare Pages** - Frontend hosting
- **PostgreSQL** - Banco de dados na nuvem

### **Estrutura de Pastas**

```
spliton/
├── 📁 frontend/                 # Aplicação React
│   ├── 📁 src/
│   │   ├── 📁 components/       # Componentes React
│   │   │   ├── 📁 modals/       # Modais (criar grupo, despesa, etc.)
│   │   │   └── 📁 ui/           # Componentes base (Radix UI)
│   │   ├── 📁 hooks/            # Custom hooks
│   │   ├── 📁 pages/            # Páginas da aplicação
│   │   ├── 📁 lib/              # Utilitários e API
│   │   └── 📁 config/           # Configurações (TON Connect)
│   ├── 📁 public/               # Assets estáticos
│   └── 📄 package.json
│
├── 📁 backend/                  # API NestJS
│   ├── 📁 src/
│   │   ├── 📁 user/             # Módulo de usuários
│   │   ├── 📁 group/            # Módulo de grupos
│   │   ├── 📁 expenses/         # Módulo de despesas
│   │   ├── 📁 payments/         # Módulo de pagamentos
│   │   ├── 📁 wallet/           # Módulo de carteira
│   │   └── 📁 prisma/           # Configuração do banco
│   ├── 📁 prisma/
│   │   ├── 📁 migrations/       # Migrações do banco
│   │   └── 📄 schema.prisma     # Schema do banco
│   └── 📄 package.json
│
├── 📁 telegramBot/              # Bot do Telegram
│   ├── 📄 bot.py                # Lógica do bot
│   └── 📄 requirements.txt
│
├── 📁 contract/                 # Smart contracts (futuro)
│   ├── 📁 contracts/
│   └── 📄 package.json
│
├── 📁 scripts/                  # Scripts de desenvolvimento
│   └── 📄 dev-local.sh          # Script para desenvolvimento local
│
├── 📄 docker-compose.yml        # Configuração Docker local
├── 📄 backend.toml              # Configuração Railway
└── 📄 README.md
```

## 🚀 Como Executar Localmente

### **Pré-requisitos**
- Docker Desktop instalado e rodando
- Node.js 18+ (para desenvolvimento)
- Git

### **Opção 1: Script Automático (Recomendado)**
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/spliton.git
cd spliton

# Execute o script de desenvolvimento
./scripts/dev-local.sh
```

### **Opção 2: Comandos Manuais**
```bash
# Parar containers existentes
docker compose down

# Construir e iniciar
docker compose up -d --build

# Ver logs
docker compose logs -f backend
```

### **URLs de Acesso Local**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Banco PostgreSQL**: localhost:5432
- **Health Check**: http://localhost:3001/health

### **Comandos Úteis**
```bash
# Ver logs em tempo real
docker compose logs -f backend
docker compose logs -f postgres

# Reiniciar backend
docker compose restart backend

# Executar seed (dados de teste)
docker compose exec backend npm run db:seed

# Abrir Prisma Studio
docker compose exec backend npx prisma studio
```

## 🌐 Deploy

### **Railway (Backend + Banco)**
O backend é deployado automaticamente no Railway quando há push para a branch `main`.

**Configuração:**
- **Arquivo**: `backend.toml`
- **Dockerfile**: `backend/Dockerfile`
- **Banco**: PostgreSQL automático
- **URL**: Gerada automaticamente pelo Railway

### **Cloudflare Pages (Frontend)**
O frontend é deployado automaticamente no Cloudflare Pages.

**Configuração:**
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Framework**: Vite

### **Telegram Bot**
O bot do Telegram é deployado separadamente no Railway.

**Configuração:**
- **Arquivo**: `telegram-bot.toml`
- **Dockerfile**: `telegramBot/Dockerfile`

## 🔧 Desenvolvimento

### **Estrutura de Dockerfiles**

#### **Railway (Produção)**
- **Arquivo**: `backend/Dockerfile`
- **Contexto**: Raiz do projeto
- **Comando**: `COPY backend/ ./`
- **Seed**: Desabilitado (`--skip-seed`)

#### **Desenvolvimento Local**
- **Arquivo**: `backend/Dockerfile.local`
- **Contexto**: Pasta `backend/`
- **Comando**: `COPY . ./`
- **Seed**: Habilitado (opcional)

### **Banco de Dados**

#### **Schema Principal**
```prisma
model User {
  id                String   @id @default(uuid())
  telegramId        BigInt   @unique
  username          String   @unique
  email             String?  @unique
  tonWalletAddress  String
  // ... relações
}

model Group {
  id          String   @id @default(uuid())
  name        String
  description String?
  createdBy   String
  inviteCode  String   @unique
  // ... relações
}

model Expense {
  id          String   @id @default(uuid())
  groupId     String
  payerId     String
  description String?
  amount      Float
  category    String?
  // ... relações
}
```

#### **Migrations**
```bash
# Criar nova migration
npx prisma migrate dev --name nome_da_migration

# Aplicar migrations em produção
npx prisma migrate deploy

# Resetar banco (desenvolvimento)
npx prisma migrate reset
```

### **API Endpoints**

#### **Usuários**
- `POST /user` - Criar usuário
- `GET /user/search` - Buscar usuários
- `GET /user/:id` - Obter usuário

#### **Grupos**
- `POST /group` - Criar grupo
- `GET /group` - Listar grupos do usuário
- `GET /group/:id` - Obter detalhes do grupo

#### **Despesas**
- `POST /expenses` - Criar despesa
- `GET /expenses` - Listar despesas
- `GET /expenses/:id` - Obter detalhes da despesa

#### **Pagamentos**
- `POST /payments/calculate` - Calcular liquidações
- `POST /payments/execute` - Executar pagamentos

## 🔐 Autenticação

### **TON Connect**
- Integração com carteiras TON
- Login descentralizado
- Assinatura de transações

### **JWT Tokens**
- Tokens de sessão
- Refresh automático
- Validação de permissões

## 📱 Frontend

### **Componentes Principais**
- **AppHeader** - Header da aplicação
- **BottomNavigation** - Navegação mobile
- **NewGroupModal** - Criar grupo
- **NewExpenseModal** - Criar despesa
- **ParticipantSelector** - Selecionar participantes
- **SettlementButton** - Executar pagamentos

### **Hooks Customizados**
- **useWalletConnection** - Conexão com carteira
- **useGroups** - Gerenciamento de grupos
- **useExpenses** - Gerenciamento de despesas
- **useSettlements** - Cálculo de liquidações

## 🤖 Telegram Bot

### **Funcionalidades**
- Acesso rápido ao aplicativo
- Notificações de despesas
- Comandos básicos de consulta

### **Deploy**
- Railway com Python
- Webhook para Telegram
- Integração com backend

## 🧪 Testes

### **Backend**
```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e

# Cobertura
npm run test:cov
```

### **Frontend**
```bash
# Testes (quando implementados)
npm run test
```

## 📊 Monitoramento

### **Health Checks**
- `GET /health` - Status geral
- `GET /health/db` - Status do banco

### **Logs**
- Logs estruturados
- Níveis de log configuráveis
- Integração com Railway

## 🔧 Troubleshooting

### **Problemas Comuns**

#### **Porta 3000/5432 já em uso**
```bash
# Parar processos
lsof -ti:3000 | xargs kill -9
lsof -ti:5432 | xargs kill -9
```

#### **Containers não iniciam**
```bash
# Limpar tudo
docker compose down -v
docker system prune -f
./scripts/dev-local.sh
```

#### **Erro de migrations**
```bash
# Resetar banco
docker compose exec backend npx prisma migrate reset
```

## 📝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

- **Issues**: [GitHub Issues](https://github.com/seu-usuario/spliton/issues)
- **Documentação**: Este README
- **Telegram**: [@spliton_bot](https://t.me/spliton_bot)

---

**SplitOn** - Divisão inteligente de despesas na blockchain TON 🚀
