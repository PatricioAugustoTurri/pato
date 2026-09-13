# syntax=docker/dockerfile:1

# La imagen de produccion de la tienda, en tres etapas: se instalan las
# dependencias, se compila, y al final se copia SOLO el resultado. Las dos
# primeras etapas se descartan, asi el `node_modules` de 601 MB y el codigo
# fuente no viajan al servidor.

FROM node:22-alpine AS base
# sharp (el que optimiza las fotografias) pide esto en Alpine.
RUN apk add --no-cache libc6-compat


# --- Dependencias -----------------------------------------------------------
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci


# --- Build ------------------------------------------------------------------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# `/`, `/shop`, `/about` y el sitemap se PRERENDERIZAN durante el build y los
# cuatro consultan Postgres. Sin una base accesible aca, el build falla: no es
# opcional, es la condicion para que compile.
ARG DATABASE_URL

# Las NEXT_PUBLIC_* se hornean dentro del JavaScript que baja el navegador, y
# eso pasa en el build, no al arrancar. Si se pasan solo como variables de
# runtime llegan vacias al cliente.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

ENV DATABASE_URL=$DATABASE_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build


# --- Runtime ----------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# La app no corre como root: si alguien escapa del proceso, no es dueño de nada.
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# `standalone` no se lleva `public` ni `.next/static` por su cuenta.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Aca vive el cache de ISR. Montale un volumen desde Coolify para que las
# paginas regeneradas sobrevivan a los reinicios.
RUN mkdir -p .next/cache && chown -R nextjs:nodejs .next

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
