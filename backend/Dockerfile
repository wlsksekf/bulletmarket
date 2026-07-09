# ==============================================================================
# 1단계: Gradle 빌드 스테이지 (실행 파일 jar 추출)
# ==============================================================================
FROM gradle:8.7-jdk21 AS build
WORKDIR /app

# 🔹 실제 프로젝트에 존재하는 build.gradle 파일 명세만 정확히 복사 (kts 제거)
COPY backend/build.gradle backend/settings.gradle* ./
COPY backend/gradlew ./
COPY backend/gradle/ ./gradle/

# gradlew 실행 권한 부여 및 의존성 라이브러리 사전 로드
RUN chmod +x ./gradlew
RUN ./gradlew dependencies --no-daemon || true

# 실제 백엔드 소스코드 복사
COPY backend/src ./src

# 부트 자르(bootJar) 파일 컴파일 빌드
RUN ./gradlew clean bootJar -x test --no-daemon

# ==============================================================================
# 2단계: 경량화 가동 스테이지 (운영 환경 런타임)
# ==============================================================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8080

ENV TZ=Asia/Seoul
ENTRYPOINT ["java", "-Duser.timezone=Asia/Seoul", "-jar", "app.jar"]