
# syntax=docker/dockerfile:1

# ----------------------------------
# Base
# ----------------------------------
FROM oven/bun:1-slim AS base

WORKDIR /app

# ----------------------------------
# Install dependencies
# ----------------------------------
FROM base AS deps

COPY package.json bun.lock ./

RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# ----------------------------------
# Build SvelteKit
# ----------------------------------
FROM deps AS builder

COPY . .

ENV NODE_ENV=production

RUN bun run build

# ----------------------------------
# Production dependencies
# ----------------------------------
FROM base AS prod-deps

COPY package.json bun.lock ./

RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --production

# ----------------------------------
# Production runtime
# ----------------------------------
FROM oven/bun:1-slim AS runner

WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

COPY --from=builder --chown=bun:bun /app/build ./build
COPY --from=prod-deps --chown=bun:bun /app/node_modules ./node_modules
COPY --from=builder --chown=bun:bun /app/package.json ./package.json

USER bun

EXPOSE 3000

STOPSIGNAL SIGTERM

CMD ["bun", "./build"]
