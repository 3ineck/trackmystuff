# Production image. Dev uses Dockerfile.dev (source mounted, tsx watch).
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl tzdata

COPY package.json package-lock.json ./
# Dev deps are kept: the prisma CLI runs `db push` on startup.
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

ENV NODE_ENV=production
USER node
EXPOSE 4000

# No --accept-data-loss: a destructive schema change fails the boot instead
# of silently dropping data.
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/server.js"]
