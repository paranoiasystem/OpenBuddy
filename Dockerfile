# ============================================================
# Stage 1: builder
# ============================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --ignore-scripts && npm rebuild better-sqlite3

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src

RUN npm run build

# Copy non-TS assets that tsc does not include in the output
RUN cp -r src/adapters/secondary/slang/workflows dist/adapters/secondary/slang/

# Prune dev dependencies and rebuild native module for production
RUN npm ci --omit=dev --ignore-scripts && npm rebuild better-sqlite3

# ============================================================
# Stage 2: runtime
# ============================================================
FROM node:22-alpine AS runtime

RUN addgroup -S openbuddy && adduser -S openbuddy -G openbuddy

WORKDIR /app

# Copy production node_modules and compiled output
COPY --from=builder --chown=openbuddy:openbuddy /app/node_modules ./node_modules
COPY --from=builder --chown=openbuddy:openbuddy /app/dist ./dist
COPY --from=builder --chown=openbuddy:openbuddy /app/package.json ./

# Ensure the app user owns the working directory
RUN chown openbuddy:openbuddy /app

# SQLite data volume mount point — owned by app user so the volume inherits it
RUN mkdir -p /data && chown openbuddy:openbuddy /data
VOLUME ["/data"]

USER openbuddy

ENV NODE_ENV=production
ENV DB_PATH=/data/openbuddy.sqlite

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "dist/main.js"]
