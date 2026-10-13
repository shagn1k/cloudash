FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:22-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ ./

FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5001

COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
COPY --from=backend-builder /app/backend ./backend

EXPOSE 5001

# The backend expects the frontend dist at ../frontend/dist by default config (or similar)
# Let's check config.js to be sure, but we can set environment variables if needed.
WORKDIR /app/backend
CMD ["node", "src/server.js"]
