#!/bin/bash

echo "🚀 Configurando Spliton para deploy no Cloudflare Pages (Otimizado)..."
echo "Node.js local: $(node -v)"

# 1. Criar wrangler.toml
cat > wrangler.toml << 'EOF'
name = "spliton"
compatibility_date = "2024-07-19"

[env.production]
name = "spliton"

[build]
command = "npm run build:cf"
cwd = ""
watch_dir = "frontend"

[build.environment_variables]
NODE_VERSION = "20"
NPM_CONFIG_LEGACY_PEER_DEPS = "true"
NPM_CONFIG_PREFER_OFFLINE = "true"
EOF

# 2. Criar .nvmrc para Cloudflare usar Node.js 20
echo "20" > .nvmrc

# 3. Ajustar package.json root
npm pkg set scripts.build:cf="cd frontend && npm run build:cf:cloudflare"
npm pkg set engines.node=">=18.0.0"

# 4. Navegar para frontend e configurar
cd frontend

# Adicionar overrides para resolver problemas de dependências nativas
npm pkg set overrides.rollup="^4.21.3"
npm pkg set overrides."@rollup/rollup-linux-x64-gnu"="4.21.3"
npm pkg set overrides."@swc/core-linux-x64-gnu"="1.4.8"

# Adicionar scripts otimizados
npm pkg set scripts.build:cf:cloudflare="npm ci --legacy-peer-deps --prefer-offline && npm install @rollup/rollup-linux-x64-gnu @swc/core-linux-x64-gnu --save-dev && npm run build"
npm pkg set scripts.build:prod="npm ci --legacy-peer-deps --prefer-offline && vite build"
npm pkg set scripts.build:clean="rm -rf node_modules package-lock.json && npm install --legacy-peer-deps"

# 5. Limpar e reinstalar dependências
echo "🧹 Limpando dependências antigas..."
rm -rf node_modules package-lock.json

echo "📦 Reinstalando dependências com configurações otimizadas..."
npm install --legacy-peer-deps

# 6. Instalar dependências nativas específicas para desenvolvimento local
echo "🔧 Instalando dependências nativas para desenvolvimento local..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    if [[ $(uname -m) == "arm64" ]]; then
        npm install @rollup/rollup-darwin-arm64 @swc/core-darwin-arm64 --save-dev
    else
        npm install @rollup/rollup-darwin-x64 @swc/core-darwin-x64 --save-dev
    fi
else
    npm install @rollup/rollup-linux-x64-gnu @swc/core-linux-x64-gnu --save-dev
fi

# 7. Testar build
echo "🔨 Testando build local..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build local funcionou!"
else
    echo "❌ Erro no build local - verifique as dependências"
    cd ..
    exit 1
fi

cd ..

# 8. Criar arquivo de instruções
cat > CLOUDFLARE_SETUP.md << 'EOF'
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
EOF

# 9. Mostrar resumo
echo ""
echo "🎉 Configuração otimizada completa para Cloudflare Pages!"
echo ""
echo "📁 Arquivos criados/modificados:"
echo "   ✅ wrangler.toml"
echo "   ✅ .nvmrc"
echo "   ✅ package.json (scripts atualizados)"
echo "   ✅ frontend/package.json (overrides + dependências nativas)"
echo "   ✅ CLOUDFLARE_SETUP.md (instruções)"
echo ""
echo "📋 Configuração para Cloudflare Pages:"
echo "   Build command: npm run build:cf"
echo "   Build output directory: frontend/dist"
echo "   Node.js version: 20 (automático via .nvmrc)"
echo ""
echo "🔧 Script otimizado:"
echo "   build:cf:cloudflare - Instala dependências nativas automaticamente"
echo ""
echo "📖 Leia CLOUDFLARE_SETUP.md para instruções completas"
echo ""
echo "🚀 Agora faça commit e push, depois configure no Cloudflare Pages!"

# 10. Verificar se tudo está funcionando
echo ""
echo "🔍 Verificação final:"
echo "   Node.js para Cloudflare: $(cat .nvmrc)"
echo "   Wrangler.toml: $([ -f wrangler.toml ] && echo "✅ Criado" || echo "❌ Erro")"
echo "   Frontend build: $([ -d frontend/dist ] && echo "✅ Funcionou" || echo "❌ Verificar")"
echo "   Dependências nativas: $([ -f frontend/node_modules/@rollup/rollup-darwin-arm64/package.json ] && echo "✅ Instaladas" || echo "❌ Verificar")"
echo ""
echo "✨ Configuração otimizada finalizada com sucesso!" 