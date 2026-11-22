# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies for better-sqlite3 native compilation
RUN apk add --no-cache python3 make g++

COPY package*.json tsconfig.json ./
RUN npm ci

COPY src/ ./src/
RUN npm run build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

# Install runtime dependencies for SQLite if required
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

# Create persistent storage directory for SQLite
RUN mkdir -p /app/data && chown -R node:node /app

USER node

ENV PORT=3000 \
    HOST=0.0.0.0 \
    NODE_ENV=production \
    DATABASE_PATH=/app/data/urls.db \
    BASE_URL=http://localhost:3000

EXPOSE 3000

VOLUME ["/app/data"]

CMD ["node", "dist/index.js"]
