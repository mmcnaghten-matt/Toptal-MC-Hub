# Stage 1: Build Vite app
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production=false


# 1. Change ENV to ARG so they can be injected securely via Cloud Build
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY

# 2. Tell Docker to assign the Arguments to the Environment for Vite
ENV VITE_SUPABASE_URL="https://upivmjklhgpmvhpqnjml.supabase.co"
ENV  VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_2n7ztvmIj6vG-lnOjPUpgw_0EntQmni"

COPY . .
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
