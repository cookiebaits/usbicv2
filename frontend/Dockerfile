# Step 1: Install dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* ./
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    else npm install --legacy-peer-deps; fi

# Step 2: Build the application
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p data

# Create .env with build-time placeholders if no .env exists
# All API routes use 'force-dynamic' so Next.js won't evaluate them during build,
# but some edge cases may still need env vars present
RUN if [ ! -f .env ]; then \
    echo 'JWT_SECRET=build-placeholder' > .env && \
    echo 'EMAIL_USER=build@placeholder.com' >> .env && \
    echo 'EMAIL_PASS=build-placeholder' >> .env && \
    echo 'CRYPTO_KEY=build-placeholder' >> .env && \
    echo 'NODE_ENV=production' >> .env; \
    fi

RUN npm run build

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

CMD ["npm", "start"]
