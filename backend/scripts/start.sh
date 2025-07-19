#!/bin/sh

# Ensure the prisma directory exists
mkdir -p /app/prisma

# Generate Prisma client
npx prisma generate

# Push the database schema (creates the database if it doesn't exist)
npx prisma db push

# Start the application
node dist/src/main.js 