# ─────────────────────────────────────────────────────────
# Frontend Dockerfile — React (Multi-Stage Build)
# Stage 1: Build React app
# Stage 2: Serve with Nginx
# ─────────────────────────────────────────────────────────

# ── Stage 1: Build ──────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Copy and install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci --silent

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Serve ──────────────────────────────────────
FROM nginx:alpine

# Copy built React files to Nginx's web root
COPY --from=builder /app/build /usr/share/nginx/html

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
