# 🚀 Migrations Automáticas no Railway - SplitOn

## ✅ Configuração Aplicada

### O que foi configurado:

1. **Dockerfile Atualizado**: Agora executa `prisma migrate deploy` automaticamente antes de iniciar a aplicação
2. **Script start.sh Melhorado**: Inclui verificação de saúde do banco e execução segura de migrations
3. **Health Check**: Endpoint `/health` para Railway monitorar a aplicação
4. **Configuração Railway**: `backend.toml` otimizado para execução de migrations

### Como funciona:

1. **Deploy**: Railway executa o Dockerfile
2. **Build**: Aplicação é construída com Prisma Client
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
- `GET /health/db` - Status específico do banco de dados

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
3. O Railway fará redeploy automaticamente
4. Verifique os logs para confirmar que as migrations foram executadas

## 🚨 Troubleshooting:

- **Migrations falham**: Verifique se DATABASE_URL está correta
- **Timeout**: Aumente healthcheckTimeout no railway.toml
- **Conexão recusada**: Aguarde o PostgreSQL estar totalmente disponível
