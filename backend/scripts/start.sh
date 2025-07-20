#!/bin/sh

echo "🚀 Starting Spliton Backend with PostgreSQL..."

# Show current directory and files
echo "📁 Current directory: $(pwd)"
echo "📁 Directory contents:"
ls -la

# Show environment variables
echo "🔧 Environment variables:"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "DATABASE_URL: $DATABASE_URL"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Push the database schema (creates the database if it doesn't exist)
echo "🗄️ Pushing database schema..."
npx prisma db push

# Show the built files
echo "📁 Built files:"
ls -la dist/
ls -la dist/src/

# Start the application
echo "🚀 Starting NestJS application..."
exec node dist/src/main.js 