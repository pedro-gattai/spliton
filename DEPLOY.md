# Deploy Spliton no Cloudflare Pages

## Configuração no Cloudflare Pages

### Build Settings:
- **Build command**: `npm run build:cloudflare`
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

# Build para Cloudflare
npm run build:cloudflare

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
