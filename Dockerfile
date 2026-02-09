FROM node:22-alpine AS base

RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

FROM base AS dev
ENV NODE_ENV=development
EXPOSE 3001
CMD ["pnpm", "start:dev"]

FROM base AS builder
RUN pnpm prisma generate
RUN pnpm build

FROM node:22-alpine AS runner

RUN corepack enable
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001
CMD ["node", "dist/main.js"]
