# Configuração do Cloudflare Pages (Otimizada)

## Configurações no Dashboard do Cloudflare Pages:

### Build & Deployments:
- **Build command**: `npm run build:cf`
- **Build output directory**: `frontend/dist`
- **Root directory**: (deixar vazio)

### Environment Variables (opcional):
NODE_VERSION=20
NPM_CONFIG_LEGACY_PEER_DEPS=true
NPM_CONFIG_PREFER_OFFLINE=true

### Build System Version:
- Use v2 (padrão) ou v3 se disponível

## Comandos alternativos se houver problema:

### Comando simples:
cd frontend && npm ci --legacy-peer-deps && npm run build

### Comando com dependências nativas:
cd frontend && npm ci --legacy-peer-deps && npm install @rollup/rollup-linux-x64-gnu @swc/core-linux-x64-gnu --save-dev && npm run build

### Comando com limpeza completa:
cd frontend && rm -rf node_modules package-lock.json && npm install --legacy-peer-deps && npm run build

## Estrutura criada:
- ✅ wrangler.toml
- ✅ .nvmrc (Node.js 20)
- ✅ package.json atualizado
- ✅ frontend/package.json com overrides e dependências nativas
- ✅ Build testado localmente

## Próximos passos:
1. Commit e push das mudanças
2. Deploy no Cloudflare Pages
3. Se der erro, tente as configurações alternativas acima

## Solução de Problemas:

### Erro de dependências nativas:
O script `build:cf:cloudflare` instala automaticamente as dependências nativas corretas para Linux.

### Erro de SWC:
Se houver erro com SWC, o script instala `@swc/core-linux-x64-gnu` automaticamente.

### Erro de Rollup:
Se houver erro com Rollup, o script instala `@rollup/rollup-linux-x64-gnu` automaticamente.
