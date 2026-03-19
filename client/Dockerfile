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

# Run all checks
RUN vp check client/

# Build the static site
RUN SOURCE_COMMIT=$SOURCE_COMMIT pnpm -C client build

# Runtime stage - Caddy
FROM caddy:2-alpine

# Copy built assets from builder
COPY --from=builder /build/client/dist /srv

# Copy Caddyfile
COPY client/Caddyfile /etc/caddy/Caddyfile

# Expose port
EXPOSE 80

# Start Caddy
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
