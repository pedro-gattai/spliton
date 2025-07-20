# 🚀 Migrations Automáticas no Railway - SplitOn (CORRIGIDO)

## ✅ Configuração Aplicada

### O que foi configurado:

1. **Dockerfile Atualizado**: 
   - Node.js atualizado para v20 (resolve warnings EBADENGINE)
   - Executa `prisma migrate deploy` automaticamente antes de iniciar a aplicação
   - **CORRIGIDO**: CMD direto para evitar problemas com script não encontrado
2. **Script start.sh Melhorado**: Inclui verificação de saúde do banco e execução segura de migrations
3. **Health Check**: Endpoints `/health` e `/health/db` com tipagem TypeScript correta
4. **Configuração Railway**: `backend.toml` otimizado para execução de migrations

### Correções aplicadas:

- ✅ **Node.js v18 → v20**: Resolve warnings de compatibilidade com dependências
- ✅ **TypeScript**: Tipagem correta para `$queryRaw` (resolve erro TS18046)
- ✅ **Error Handling**: Tratamento de erro melhorado com tipo `any`
- ✅ **Script Error**: Corrigido erro "No such file or directory" no CMD

### Como funciona:

1. **Deploy**: Railway executa o Dockerfile com Node 20
2. **Build**: Aplicação é construída com Prisma Client (sem warnings)
3. **Migrations**: `prisma migrate deploy` é executado automaticamente
4. **Start**: Aplicação inicia após migrations serem aplicadas com sucesso

### Comandos úteis:

```bash
# Verificar status das migrations
npm run migrate:status

# Executar migrations manualmente
npm run migrate:deploy

# Verificar saúde do banco
npm run db:status
```

### Endpoints de Health Check:

- `GET /health` - Status geral da aplicação
- `GET /health/db` - Status específico do banco de dados (com tipagem correta)

### Logs esperados no Railway:

```
🔄 Executando migrations...
✅ Migrations executadas com sucesso!
🚀 Iniciando aplicação...
✅ Application is running on: http://0.0.0.0:3000
```

## 🔧 Próximos Passos:

1. Faça commit das alterações
2. Push para o repositório
3. O Railway fará redeploy automaticamente com Node 20
4. Verifique os logs para confirmar que as migrations foram executadas

## 🚨 Troubleshooting:

- **Migrations falham**: Verifique se DATABASE_URL está correta
- **Timeout**: Aumente healthcheckTimeout no railway.toml
- **Conexão recusada**: Aguarde o PostgreSQL estar totalmente disponível
- **Warnings EBADENGINE**: Corrigido com atualização para Node 20
- **Script não encontrado**: Corrigido com CMD direto no Dockerfile

## 🔧 Correção do Erro "No such file or directory":

**Problema**: Railway não conseguia encontrar o script `./scripts/start.sh`

**Solução**: 
- Removido `startCommand` do `backend.toml` para evitar conflito
- CMD direto no Dockerfile: `["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]`
- Script `start.sh` mantido como backup para uso local

**Resultado**: Migrations executadas diretamente no CMD do container
