FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

FROM node:20-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* values are inlined at build time. Placeholders until Supabase is configured.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-slim AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
