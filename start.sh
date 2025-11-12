#!/bin/sh
set -e

# Start script for Railway deployment with Next.js standalone output

# Check if standalone build exists
if [ -d ".next/standalone" ] && [ -f ".next/standalone/server.js" ]; then
  echo "Starting from standalone build..."
  cd .next/standalone
  
  # Copy necessary files if they don't exist
  if [ -d "../../public" ] && [ ! -d "public" ]; then
    cp -r ../../public ./public
  fi
  
  if [ -d "../../drizzle" ] && [ ! -d "drizzle" ]; then
    cp -r ../../drizzle ./drizzle
  fi
  
  mkdir -p data uploads
  
  # Start the server
  exec node server.js
else
  echo "Standalone build not found, using regular next start..."
  # Ensure dependencies are installed
  if [ ! -d "node_modules" ]; then
    npm install --production=false
  fi
  exec npm run start
fi
