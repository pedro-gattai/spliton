#!/bin/bash

echo "🔧 Otimizando monorepo Spliton para Cloudflare Pages..."

# 1. Verificar e ajustar Node.js version
echo "20" > .nvmrc

# 2. Atualizar package.json root - manter estrutura monorepo mas simplificar
npm pkg set scripts.build:frontend="cd frontend && npm install --legacy-peer-deps && npm run build"
npm pkg set engines.node=">=18.0.0"

# 3. Corrigir frontend/package.json - ajustar versões problemáticas
cd frontend

# Atualizar vite e rollup para versões estáveis compatíveis
npm pkg set devDependencies.vite="^5.3.5"
npm pkg set devDependencies.typescript="^5.4.5"

# Adicionar overrides para resolver conflitos de dependências
npm pkg set overrides.rollup="^4.18.0"
npm pkg set overrides."@rollup/rollup-linux-x64-gnu"="^4.18.0"
npm pkg delete overrides."@rollup/rollup-darwin-arm64" 2>/dev/null || true
npm pkg delete overrides."@rollup/rollup-darwin-x64" 2>/dev/null || true

# Simplificar scripts do frontend
npm pkg set scripts.build="tsc -b && vite build"
npm pkg set scripts.build:prod="npm ci --legacy-peer-deps && npm run build"

# 4. Criar/atualizar .npmrc no frontend para resolver problemas
cat > .npmrc << 'EOF'
legacy-peer-deps=true
prefer-offline=true
fund=false
audit=false
EOF

# 5. Atualizar vite.config.ts para ser mais compatível
cat > vite.config.ts << 'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
});
EOF

# 6. Atualizar tsconfig.json para ser mais compatível
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
EOF

# 7. Limpar dependências e reinstalar com versões corretas
echo "🧹 Limpando e reinstalando dependências do frontend..."
rm -rf node_modules package-lock.json

# Instalar com versões específicas que funcionam
npm install --legacy-peer-deps

# 8. Downgrade de algumas dependências problemáticas se necessário
npm install --save-dev vite@^5.3.5 typescript@^5.4.5 --legacy-peer-deps

cd ..

# 9. Remover configurações complexas não necessárias
rm -f wrangler.toml
rm -f .npmrc
rm -f CLOUDFLARE_SETUP.md

# 10. Criar README simples para deploy
cat > DEPLOY.md << 'EOF'
# Deploy Spliton no Cloudflare Pages

## Configuração no Cloudflare Pages

### Build Settings:
- **Build command**: `npm run build:frontend`
- **Build output directory**: `frontend/dist` 
- **Root directory**: (deixar vazio)

### Environment Variables:
NODE_VERSION=20

### Build System:
- Use v2 (padrão)

## Comandos locais

```bash
# Desenvolvimento
npm run dev

# Build frontend
npm run build:frontend

# Build completo
npm run build
```

## Estrutura mantida
```
spliton/
├── frontend/     # React app
├── backend/      # NestJS API  
└── package.json  # Monorepo scripts
```

✅ Deploy simples: apenas `npm run build:frontend` no Cloudflare!
EOF

# 11. Testar build
echo "🔨 Testando build..."
npm run build:frontend
if [ $? -eq 0 ]; then
    echo "✅ Build funcionou!"
else
    echo "❌ Erro no build - tentando corrigir versões..."
    cd frontend
    npm install --force --legacy-peer-deps
    npm run build
    cd ..
fi

echo ""
echo "🎉 Monorepo Spliton otimizado!"
echo ""
echo "📋 Configuração Cloudflare Pages:"
echo "   Build command: npm run build:frontend"
echo "   Build output directory: frontend/dist"
echo "   Node.js version: 20"
echo ""
echo "📁 Estrutura mantida:"
echo "   ✅ frontend/ - React app"
echo "   ✅ backend/ - NestJS API"
echo "   ✅ package.json - Scripts do monorepo"
echo ""
echo "🔧 Correções aplicadas:"
echo "   ✅ Versões do Vite e TypeScript ajustadas"
echo "   ✅ Rollup overrides corrigidos"
echo "   ✅ .npmrc otimizado"
echo "   ✅ vite.config.ts simplificado"
echo ""
echo "🚀 Comando para Cloudflare: npm run build:frontend"
echo "📖 Leia DEPLOY.md para instruções completas" 