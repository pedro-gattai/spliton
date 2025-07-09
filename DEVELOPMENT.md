# Development Guide

## Project Structure

```
spliton/
├── frontend/          # React + TypeScript + Vite + Tailwind CSS
├── backend/           # NestJS + TypeScript
├── simple-counter/    # TON Smart Contracts (Tact)
├── scripts/           # Development scripts
└── package.json       # Root package.json for monorepo management
```

## Quick Start

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Start development servers:**
   ```bash
   npm run dev
   # or
   npm start
   ```

3. **Access the applications:**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000

## Development Workflow

### Frontend Development
- Located in `frontend/`
- Uses React 18, TypeScript, Vite, Tailwind CSS, and Shadcn/ui
- Hot reload enabled
- Run with: `npm run dev:frontend`

### Backend Development
- Located in `backend/`
- Uses NestJS with TypeScript
- Auto-restart on file changes
- Run with: `npm run dev:backend`

### Smart Contracts
- Located in `simple-counter/`
- Uses TON blockchain with Tact language
- Separate development workflow

## Available Commands

### Root Level (Monorepo)
- `npm run dev` - Start both frontend and backend
- `npm run build` - Build both frontend and backend
- `npm run lint` - Lint both frontend and backend
- `npm run test` - Test both frontend and backend
- `npm run install:all` - Install all dependencies

### Frontend Only
- `npm run dev:frontend` - Start frontend development server
- `npm run build:frontend` - Build frontend for production
- `npm run lint:frontend` - Lint frontend code

### Backend Only
- `npm run dev:backend` - Start backend development server
- `npm run build:backend` - Build backend for production
- `npm run lint:backend` - Lint backend code

## Environment Variables

### Frontend
Create `frontend/.env.local` for local development:
```env
VITE_API_URL=http://localhost:3000
```

### Backend
Create `backend/.env` for local development:
```env
PORT=3000
NODE_ENV=development
```

## Git Workflow

- All code is now in a single repository
- Frontend and backend are in separate directories
- Shared configuration in root directory
- Use conventional commits for better changelog

## Troubleshooting

### Port Conflicts
If ports are already in use:
- Frontend: Change port in `frontend/vite.config.ts`
- Backend: Change port in `backend/src/main.ts`

### Dependencies Issues
```bash
# Clean install
rm -rf node_modules frontend/node_modules backend/node_modules
npm run install:all
```

### Build Issues
```bash
# Clean build
rm -rf frontend/dist backend/dist
npm run build
``` 