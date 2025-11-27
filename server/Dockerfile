# Multi-stage build for Digital FlipBoard Server

# Stage 1: Dependencies
FROM node:18-alpine as builder

WORKDIR /app

COPY server/package*.json ./server/

RUN cd server && npm ci --only=production

# Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

# Copy built dependencies from builder
COPY --from=builder /app/server/node_modules ./server/node_modules

# Copy application code
COPY server ./server
COPY package.json package-lock.json ./

# Create logs directory
RUN mkdir -p logs

# Environment
ENV NODE_ENV=production
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health/live || exit 1

# Expose port
EXPOSE 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start server
CMD ["node", "server/index.js"]
