# ============================================================================
# Stage 1: Builder
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml* .npmrc ./

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY . .

# Build the Next.js app
RUN pnpm build

# ============================================================================
# Stage 2: Production Runner
# ============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

ENV NODE_ENV=production

# Copy package files
COPY package.json pnpm-lock.yaml* .npmrc ./

# Install ONLY production dependencies
RUN pnpm install --prod --no-frozen-lockfile

# Copy Next.js build output
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy other necessary files
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/app ./app

# Create reports directory
RUN mkdir -p /shared/report-framework/reports

EXPOSE 3000

CMD ["pnpm", "start"]
