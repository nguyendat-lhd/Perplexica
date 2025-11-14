FROM node:24.5.0-slim AS builder

WORKDIR /app

# Copy package files
COPY package.json ./
RUN npm install --frozen-lockfile

# Copy source files
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

FROM node:24.5.0-slim

WORKDIR /app

# Copy built files and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/v1/sse', (r) => { process.exit(r.statusCode === 404 ? 0 : 1) })" || exit 1

# Start server
CMD ["node", "dist/http-server.js"]

