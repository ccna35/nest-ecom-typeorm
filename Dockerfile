# ---------- Build stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps (better layer caching)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ---------- Production stage ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Only install production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy build output
COPY --from=builder /app/dist ./dist

# If you use migrations/static files, copy them too:
# COPY --from=builder /app/src/migrations ./dist/migrations
# COPY --from=builder /app/some-static ./some-static

EXPOSE 3000

# Important: your app must listen on 0.0.0.0, not localhost
CMD ["node", "dist/main.js"]
