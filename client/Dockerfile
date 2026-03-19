# Build stage
FROM node:20-slim AS builder

ARG SOURCE_COMMIT=unknown

SHELL ["/bin/bash", "-c"]

WORKDIR /build

RUN apt-get update && apt-get install -y git curl && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm vite-plus

# Copy package files from root (parent dir, since build context is client/)
COPY ../package.json ../pnpm-lock.yaml ./

# Copy client source (current dir is client/)
COPY . ./client

# Install dependencies
RUN pnpm install --frozen-lockfile

# Link root node_modules to client for access to shared dependencies
RUN ln -sf /build/node_modules /build/client/node_modules

# Build the static site (skip lint in Docker, run vite build directly)
RUN cd /build/client && SOURCE_COMMIT=$SOURCE_COMMIT npx vite build && cp dist/index.html dist/404.html

# Copy Caddyfile to builder for later use (build context is client/)
COPY Caddyfile /build/client/Caddyfile

# Runtime stage - Caddy
FROM caddy:2-alpine

# Copy built assets from builder
COPY --from=builder /build/client/dist /srv

# Copy Caddyfile from builder stage
COPY --from=builder /build/client/Caddyfile /etc/caddy/Caddyfile

# Expose port
EXPOSE 80

# Start Caddy
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
