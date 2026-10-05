# ---- build ----
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# URL relativa: o Nginx faz proxy de /api para o backend (same-domain).
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- runtime ----
FROM nginx:1.27-alpine AS runtime

# O entrypoint do Nginx processa /etc/nginx/templates/*.template com envsubst.
# Restringe a substituicao a BACKEND_URL (preserva variaveis nativas do Nginx).
ENV NGINX_ENVSUBST_FILTER=BACKEND_URL \
    BACKEND_URL=http://photoizer-backend:8080

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://localhost/ || exit 1
