# Step 1: Install dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile || yarn install

# Step 2: Build the application
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p data

# Provide dummy env vars for build so Next.js can compile all routes
# Real values are injected at runtime via Dokploy environment variables
ENV JWT_SECRET=build-placeholder
ENV EMAIL_USER=build@placeholder.com
ENV EMAIL_PASS=build-placeholder
ENV CRYPTO_KEY=build-placeholder
ENV NODE_ENV=production

RUN yarn build

# Step 3: Production runtime
FROM node:18-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/data ./data
COPY --from=builder /app/scripts ./scripts

EXPOSE 3000

VOLUME ["/app/data"]

CMD ["yarn", "start"]
