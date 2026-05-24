# syntax=docker/dockerfile:1.7

# ---- Stage 1: build Vue + Vite app ----
FROM node:22-alpine AS build

WORKDIR /app

# package.json + lockfile만 먼저 복사해 npm ci 캐시 활용
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Stage 2: serve with nginx ----
FROM nginx:1.27-alpine AS runtime

# SPA history 모드 라우팅용 nginx 설정
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# 빌드 산출물 복사
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# nginx alpine 이미지의 기본 CMD 사용
