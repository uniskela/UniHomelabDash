FROM node:24-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_PATH=/app/data/unihomelabdash.sqlite
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
LABEL org.opencontainers.image.title="UniHomelabDash" \
  org.opencontainers.image.description="A self-hosted mobile-first homelab dashboard PWA for manual services, health checks, and future control-plane integrations." \
  org.opencontainers.image.source="https://github.com/uniskela/UniHomelabDash" \
  org.opencontainers.image.documentation="https://github.com/uniskela/UniHomelabDash#readme" \
  org.opencontainers.image.licenses="MIT" \
  org.opencontainers.image.vendor="Uniskela" \
  org.opencontainers.image.url="https://github.com/uniskela/UniHomelabDash"
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
RUN mkdir -p /app/data && chown -R nextjs:nextjs /app/data
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
