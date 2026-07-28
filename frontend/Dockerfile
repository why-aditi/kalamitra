# syntax=docker/dockerfile:1

# ---------------------------------------------------------------- build stage
FROM node:20-slim AS builder

WORKDIR /app

# package-lock.json is the real lockfile here (the 96-byte pnpm-lock.yaml was a
# stub and has been removed), so install reproducibly with npm ci.
COPY package.json package-lock.json ./
RUN npm ci

# NEXT_PUBLIC_* values are inlined at build time, so they must be present now.
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
# No NEXT_PUBLIC_GEMINI_API_KEY. It was passed through here and inlined into the
# bundle; the Gemini call now goes to the backend, which holds the key.
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL} \
    NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY} \
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN} \
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID} \
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET} \
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID} \
    NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID} \
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=${NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID}

# No `COPY .env .env`. That baked real secrets into a distributable image layer;
# .dockerignore now excludes every .env variant so `COPY . .` cannot pick one up.
COPY . .

RUN npm run build

# ----------------------------------------------------------- production stage
FROM node:20-slim AS production

WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./

# node:20-slim ships an unprivileged `node` user; the image ran as root before.
RUN chown -R node:node /app
USER node

EXPOSE 3000

# /api/health now exists (app/api/health/route.ts); this check used to always fail.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS http://localhost:3000/api/health || exit 1

CMD ["npm", "run", "start"]
