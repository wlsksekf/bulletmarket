# 1단계: 빌드 환경
FROM node:22-alpine AS build
WORKDIR /app

# 빌드 인자(Args) 받기
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# 환경 변수로 주입
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# 2단계: 실행 환경 (순수 Nginx 기본 세팅 활용)
FROM nginx:1.25-alpine

# 빌드된 정적 리소스를 알파인 이미지 기본 서빙 경로로 주입
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]