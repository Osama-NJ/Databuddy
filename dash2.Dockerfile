# Build stage
FROM oven/bun:1-slim AS builder


# Copy dependency files
COPY package.json bun.lock turbo.json /build/
COPY apps/dash2 /build/apps/dash2
COPY packages/ /build/packages

WORKDIR /build
# Install dependencies
RUN bun install 

WORKDIR /build/packages/sdk

RUN bun run build

# build dash2
WORKDIR /build/apps/dash2
ENV NODE_ENV=production 
ENV REDIS_URL=redis://localhost
ENV DATABASE_URL=postgres://localhost
ENV CLICKHOUSE_URL=https://localhost
ENV NEXT_PUBLIC_API_URL=https://localhost
ENV PORT=3000
ENV BUN_ENV=production 
RUN bun install 
RUN bun run build

# Production stage
FROM oven/bun:1-slim

# Copy built files from builder
COPY --from=builder /build/apps/dash2 /app
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production 
ENV REDIS_URL=redis://localhost
ENV DATABASE_URL=postgres://localhost
ENV CLICKHOUSE_URL=https://localhost
ENV NEXT_PUBLIC_API_URL=https://localhost

# Expose port
EXPOSE 3000
# Start API
CMD ["bun", "run", "start"]