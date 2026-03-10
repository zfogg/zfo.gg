# Build stage
FROM oven/bun:latest AS builder

WORKDIR /build

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install

# Copy source
COPY . .

# Build the static site
RUN bun run build

# Runtime stage - Caddy
FROM caddy:2-alpine

# Copy built assets from builder
COPY --from=builder /build/dist /srv

# Copy Caddyfile
COPY Caddyfile /etc/caddy/Caddyfile

# Expose port
EXPOSE 5176

# Start Caddy
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
