# 1단계: Build stage
FROM node:20-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# 의존성 설치를 위해 package.json 및 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# 소스 코드 복사
COPY . .

# 프로덕션 빌드 실행
RUN npm run build

# 2단계: Production stage
FROM nginx:alpine

# 빌드된 정적 파일들을 Nginx의 서빙 경로로 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# 작성한 Nginx 설정 파일을 컨테이너 내부의 기본 설정 경로에 덮어쓰기
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 80번 포트 노출
EXPOSE 80

# Nginx를 포그라운드에서 실행
CMD ["nginx", "-g", "daemon off;"]