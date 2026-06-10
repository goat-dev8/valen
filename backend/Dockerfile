FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY backend/package.json ./backend/
ENV REDISMS_DISABLE_POSTINSTALL=true
RUN pnpm install --frozen-lockfile --filter backend
COPY backend ./backend
RUN pnpm --filter backend build
RUN pnpm deploy --filter backend --prod /prod/backend

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /prod/backend/ ./
# Runtime attestation reads ../contracts and ../stylus from /app (repo root = /).
COPY contracts/deployments /contracts/deployments
COPY stylus/deployments /stylus/deployments
COPY backend/scripts/render-start.sh ./render-start.sh
RUN chmod +x ./render-start.sh
EXPOSE 3000
CMD ["sh", "./render-start.sh"]
