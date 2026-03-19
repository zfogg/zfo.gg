# Build stage
FROM node:20-slim AS builder

ARG SOURCE_COMMIT=unknown

SHELL ["/bin/bash", "-c"]

WORKDIR /build

RUN apt-get update && apt-get install -y git curl && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm

RUN curl -fsSL "https://vite.plus" | bash && cp ~/.vite-plus/bin/vp /usr/local/bin/vp

# Copy package files from root
COPY package.json pnpm-lock.yaml ./

# Copy client source
COPY client ./client

# Install dependencies
RUN pnpm install --frozen-lockfile

# Run checks from client directory where vite-plus is installed
RUN cd /build/client && NODE_PATH=/build/node_modules /usr/local/bin/vp check

# Build the static site
RUN SOURCE_COMMIT=$SOURCE_COMMIT pnpm -C client build

# Copy Caddyfile to builder for later use
COPY client/Caddyfile /build/client/Caddyfile

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
