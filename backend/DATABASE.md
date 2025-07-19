# Configuração do Banco de Dados

Este projeto usa PostgreSQL com Prisma como ORM.

## Pré-requisitos

1. **PostgreSQL** instalado e rodando localmente
2. **Node.js** e **npm** instalados

## Configuração Inicial

### 1. Instalar PostgreSQL

- **Windows**: Baixe e instale do [site oficial](https://www.postgresql.org/download/windows/)
- **macOS**: `brew install postgresql`
- **Linux**: `sudo apt-get install postgresql postgresql-contrib`

### 2. Criar o Banco de Dados

```sql
CREATE DATABASE spliton;
CREATE USER postgres WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE spliton TO postgres;
```

### 3. Configurar Variáveis de Ambiente

O arquivo `.env` já está configurado com:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/spliton?schema=public"
```

Ajuste as credenciais conforme necessário.

## Comandos do Prisma

### Gerar Cliente Prisma
```bash
npm run prisma:generate
```

### Executar Migrações
```bash
npm run prisma:migrate
```

### Aplicar Schema sem Migração (Desenvolvimento)
```bash
npm run db:push
```

### Abrir Prisma Studio (Interface Visual)
```bash
npm run prisma:studio
```

### Resetar Banco de Dados
```bash
npm run prisma:reset
```

## Estrutura do Banco

### Tabelas Principais

1. **users** - Usuários do sistema
2. **groups** - Grupos de despesas
3. **group_members** - Membros dos grupos
4. **expenses** - Despesas
5. **expense_participants** - Participantes das despesas
6. **settlements** - Liquidações de dívidas
7. **balances** - Saldos dos usuários

### Relacionamentos

- Um usuário pode criar múltiplos grupos
- Um grupo pode ter múltiplos membros
- Uma despesa pertence a um grupo
- Uma despesa pode ter múltiplos participantes
- Liquidações são feitas entre usuários de um grupo

## Uso no Código

### Injetar PrismaService

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MeuService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany();
  }
}
```

### Exemplos de Queries

```typescript
// Buscar usuário por ID
const user = await this.prisma.user.findUnique({
  where: { id: 'user-id' }
});

// Buscar usuário com grupos
const userWithGroups = await this.prisma.user.findUnique({
  where: { id: 'user-id' },
  include: {
    createdGroups: true,
    groupMembers: {
      include: {
        group: true
      }
    }
  }
});

// Criar usuário
const newUser = await this.prisma.user.create({
  data: {
    telegramId: BigInt(123456789),
    firstName: 'João',
    lastName: 'Silva',
    tonWalletAddress: 'EQD...'
  }
});
```

## Desenvolvimento

### Adicionar Nova Migração

1. Modifique o schema em `prisma/schema.prisma`
2. Execute: `npm run prisma:migrate`
3. O Prisma irá gerar uma nova migração

### Verificar Schema

Use o Prisma Studio para visualizar e editar dados:
```bash
npm run prisma:studio
```

## Produção

Para produção, certifique-se de:

1. Usar variáveis de ambiente seguras
2. Configurar pool de conexões adequado
3. Fazer backup regular do banco
4. Monitorar performance das queries 