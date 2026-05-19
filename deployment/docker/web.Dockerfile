# Tagent Web Frontend — Multi-stage Production Build
# Build context: repository root
# docker build -f deployment/docker/web.Dockerfile -t tagent/web:latest .

# ---- Stage 1: deps ----
FROM node:26-alpine AS deps
WORKDIR /app
COPY frontend/web/package.json frontend/web/package-lock.json ./
RUN npm ci

# ---- Stage 2: build ----
FROM node:26-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY frontend/web/ ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- Stage 3: runner ----
FROM node:26-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:3000/api/healthz || exit 1

CMD ["node", "server.js"]
