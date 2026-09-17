# Single-service image: the Express API also serves the built React app,
# so the frontend, API, refresh cookie and WebSocket all share one origin.

# ---- 1. Build the React client ----
FROM node:22-slim AS client
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- 2. Install production API dependencies ----
FROM node:22-slim AS server-deps
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev

# ---- 3. Runtime ----
FROM node:22-slim
ENV NODE_ENV=production \
    PORT=5000 \
    SERVE_CLIENT=true \
    CLIENT_DIST_PATH=../frontend/dist
WORKDIR /app/backend

COPY --from=server-deps --chown=node:node /app/backend/node_modules ./node_modules
COPY --chown=node:node backend/package*.json ./
COPY --chown=node:node backend/src ./src
COPY --from=client --chown=node:node /app/frontend/dist ../frontend/dist

USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 5000) + '/api/v1/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "src/index.js"]
