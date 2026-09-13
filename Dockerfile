# syntax=docker/dockerfile:1
# Pin this image to an approved digest in your release pipeline.
ARG NODE_IMAGE=node:24-bookworm-slim
FROM ${NODE_IMAGE} AS dependencies
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# No .git exists here, so prepare (lefthook install) cannot run. The current
# dependencies use prebuilt binaries; CI runs the quality gates before this build.
# Revisit this if adding a dependency that requires a native install script.
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM dependencies AS builder
COPY . .
# This project currently has no public assets; keep the copy valid when added.
RUN mkdir -p public && pnpm build

FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
# Node's official image already provides uid/gid 1000 as the non-root node user.
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
RUN mkdir -p .next/cache && chown node:node .next/cache \
    && test ! -d src && test ! -d node_modules/vitest
USER node
EXPOSE 3000
STOPSIGNAL SIGTERM
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health/live').then(r => process.exit(r.status === 200 ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "server.js"]
