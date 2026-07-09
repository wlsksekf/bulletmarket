# 🖥️ BulletMarket 프로젝트 오라클 VM CI/CD 배포 가이드

**(Oracle Cloud Always Free VM, Docker, GitHub Actions, Docker Hub 기준)**

이 가이드는 **BulletMarket** 프로젝트의 `main` 브랜치 PUSH를 기준으로 오라클 클라우드 VM 서버에 자동으로 빌드 및 배포가 이루어지는 전체 파이프라인 구축 매뉴얼입니다.

---

## 1단계: 🏗️ 인프라 준비 (오라클 VM 서버 및 Docker Hub)

### 1.1. Oracle Cloud Always Free VM 생성 및 설정

1. **인스턴스 생성:**
    - **OS (AMI):** **Oracle Linux 9**를 선택합니다.
    - **인스턴스 유형:** `VM.Standard.A1.Flex` (ARM Ampere, 최대 4 OCPUs, 24GB RAM 무료 할당 사양 지원. 여기서는 **16GB RAM** 사양 기준)
    - **SSH 키 페어:** **(필수)** VM 접속용 암호 키입니다. `ssh-key-2026-07-01.key`와 같은 이름으로 저장하여 로컬 PC에 안전하게 다운로드합니다. 이 키 내용은 `2단계`에서 `SSH_PRIVATE_KEY` 시크릿으로 사용됩니다.
2. **네트워크 (보안 목록) 설정:**
    - 오라클 클라우드 VCN(가상 클라우드 네트워크)의 보안 목록(인바운드 규칙)을 설정합니다.
    - **인바운드 규칙 추가:**
        - `소스: 0.0.0.0/0`, `IP 프로토콜: TCP`, `대상 포트 범위: 22` (SSH 접속용)
        - `소스: 0.0.0.0/0`, `IP 프로토콜: TCP`, `대상 포트 범위: 80` (HTTP 웹 서빙 및 Certbot 인증용)
        - `소스: 0.0.0.0/0`, `IP 프로토콜: TCP`, `대상 포트 범위: 443` (HTTPS 최종 서비스용)
3. **예약된 공인 IP (고정 IP) 할당:**
    - VM 재부팅 시 IP가 변경되지 않도록 **Reserved Public IP**를 생성하여 오라클 VM 인스턴스에 연결합니다. (예: `151.145.66.210`)
    - 이 고정 IP 주소는 `2단계`에서 `SERVER_HOST` 시크릿 값으로 사용됩니다.
4. **오라클 VM 서버 초기 설정 (SSH 접속 후):**
    - 다운로드한 프라이빗 키를 사용해 터미널(PowerShell 등)에서 서버에 접속합니다.
    - PowerShell/Bash
        ```bash
        # 1. 키 파일 권한 변경 (리눅스/맥 접속 시 최초 1회)
        chmod 400 ssh-key-2026-07-01.key
        
        # 2. SSH 접속 (Oracle Linux의 기본 기본 유저명은 'opc' 입니다)
        ssh -i ssh-key-2026-07-01.key opc@151.145.66.210
        ```
    - 서버에 접속한 후, **DNF 패키지 매니저를 사용하여 Docker와 Docker Compose 플러그인을 설치**합니다.
        Bash
        ```bash
        # 3. 시스템 업데이트
        sudo dnf update -y
        
        # 4. 도커 엔진 설치
        sudo dnf install -y docker
        
        # 5. 도커 컴포즈 플러그인 설치 (curl 수동 다운로드 대신 플러그인 권장)
        sudo dnf install -y docker-compose-plugin
        
        # 6. 도커 서비스 활성화 및 시작
        sudo systemctl enable --now docker
        
        # 7. 현 사용자(opc)에게 도커 명령어 실행 권한 부여 (sudo 없이 docker 사용)
        sudo usermod -aG docker opc
        
        # 8. 변경사항 적용을 위해 SSH 세션 종료 후 재접속
        exit
        ```
    - 재접속 후 `docker --version` 및 `docker compose version` 명령어가 정상 동작하는지 확인합니다.

### 🚨 오라클 리눅스 필수 방화벽 개방 명령어
> **[IMPORTANT]**
> 오라클 클라우드는 웹 콘솔(인프라 보안 그룹)에서 포트를 열어주더라도, **VM 내부 리눅스 커널 수준의 방화벽(iptables)이 통신을 한 번 더 잠그고 있습니다.**
> 다음 명령어를 서버 터미널에 반드시 실행해주셔야 Nginx(80, 443) 포트 웹 서빙 및 최초 SSL 인증서(Certbot) 발급이 먹통이 되지 않습니다.
> ```bash
> # 내부 방화벽 규칙에 HTTP(80) 및 HTTPS(443) 허용 추가
> sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
> sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
> 
> # 방화벽 변경 사항 영구 저장 (재부팅 시 풀림 방지)
> sudo iptables-save | sudo tee /etc/sysconfig/iptables
> ```

### 1.2. Docker Hub 계정 및 액세스 토큰 발급
1. **Docker Hub 가입:** 생성한 **ID**가 `2단계`에서 `DOCKER_USERNAME` 시크릿이 됩니다.
2. **액세스 토큰(Access Token) 발급:**
    - `Account Settings > Security > New Access Token`을 클릭합니다.
    - 발급된 토큰 값을 안전하게 복사하여 `2단계`에서 `DOCKER_TOKEN` 시크릿으로 사용합니다.

---

## 2단계: 🔑 GitHub Actions 연동 (시크릿 등록)

깃허브 레포지토리의 **Settings > Secrets and variables > Actions > New repository secret** 메뉴로 이동하여 아래 **7개의 시크릿**을 등록합니다.

- `SERVER_HOST`: 오라클 VM의 공인 IP 주소 (예: `151.145.66.210`)
- `SERVER_USER`: **`opc`** (오라클 리눅스 기본 접속 유저명)
- `SSH_PRIVATE_KEY`: 다운로드한 **`ssh-key-2026-07-01.key` 키 파일 내용물 전체**
- `DOCKER_USERNAME`: Docker Hub ID
- `DOCKER_TOKEN`: Docker Hub Access Token
- `VITE_SUPABASE_URL`: 연동할 Supabase URL 주소
- `VITE_SUPABASE_ANON_KEY`: 연동할 Supabase Anon 공개 키값

---

## 3단계: ⚙️ 배포 구성 파일 명세

### 3.1. `.github/workflows/deploy.yml` (자동화 워크플로우)
깃허브 액션이 도커 빌드 후 Docker Hub에 이미지를 푸시하고, 오라클 VM으로 접속하여 새 이미지를 구동하는 자동 배포 파이프라인 설계서입니다. Target 경로는 오라클 리눅스 규격인 **`/home/opc/bulletmarket`**에 맞춰 자동으로 바인딩됩니다.

### 3.2. `docker-compose.yml` (서비스 구조 조립도)
- **`nginx`:** 호스트의 `80` 및 `443` 포트를 직접 바인딩하며 리버스 프록시 및 SSL 인증서 마운트를 처리하는 최상단 게이트웨이 서비스입니다.
- **`frontend`:** 포트 80을 호스트에 노출하지 않도록 차단하여 격리성을 확보하고, 독립 Nginx를 통해서만 통신을 허용합니다. (Docker Hub의 `${DOCKER_USERNAME}/bulletmarket-frontend` 이미지를 사용합니다.)
- **`backend`:** 스프링 부트 애플리케이션으로, DB 정보가 담긴 `.env`를 자동으로 인젝션받아 동작합니다.

### 3.3. `nginx.conf` (리버스 프록시 및 SSL 관문)
- 포트 80(HTTP)을 가동하여 로컬 및 실서버 최초 기동을 보장합니다.
- 포트 443(HTTPS) 블록이 주석으로 구성되어 있어, Certbot 발급 후 즉시 활성화할 수 있습니다.

---

## 4단계: 🚀 최초 1회 HTTPS(SSL) 설정 및 가동 (Certbot)

최초 배포 시에는 SSL 인증서가 존재하지 않으므로 최상단 Nginx가 가동에 실패합니다. 아래의 수동 발급 과정을 최초 1회 적용해 주어야 합니다.

1. **도메인 IP 매핑:** `bulletmarket.duckdns.org` 도메인이 오라클 고정 IP (`151.145.66.210`)를 가리키도록 DuckDNS 대시보드에서 등록 및 갱신을 완료합니다.
   - 갱신 완료 로그 예시: `duckdns success: ip address for bulletmarket.duckdns.org updated to 151.145.66.210`
2. **임시 Nginx 구성:** 
   - `nginx.conf` 파일에서 80 포트 블록(HTTP)만 활성화하고 443 포트는 주석 상태를 유지합니다.
3. **설정 파일 전송 및 디렉토리 생성 (오라클 VM 터미널):**
   ```bash
   # 오라클 VM에 접속하여 작업 폴더 생성 (ubuntu 대신 opc 경로 사용)
   mkdir -p /home/opc/bulletmarket/certbot-data/conf
   mkdir -p /home/opc/bulletmarket/certbot-data/www
   ```
   - 로컬의 `docker-compose.yml`과 임시 `nginx.conf`를 오라클 VM의 `/home/opc/bulletmarket/` 경로로 전송합니다.
4. **임시 Nginx 실행 (오라클 VM 터미널):**
   ```bash
   cd /home/opc/bulletmarket
   # 별도의 프로필 환경 구분 없이 기본 Nginx 웹 서버만 실행
   docker compose up -d nginx
   ```
5. **Certbot 컨테이너를 통한 인증서 발급 (오라클 VM 터미널):**
   ```bash
   # 볼륨 마운트 시 반드시 /home/opc/bulletmarket 경로를 매핑해야 정상 동작합니다.
   docker run -it --rm \
     -v /home/opc/bulletmarket/certbot-data/conf:/etc/letsencrypt \
     -v /home/opc/bulletmarket/certbot-data/www:/var/www/certbot \
     certbot/certbot certonly --webroot \
     -w /var/www/certbot \
     --email [본인_이메일@gmail.com] \
     -d bulletmarket.duckdns.org \
     --agree-tos --no-eff-email
   ```
6. **정식 Nginx 적용 및 가동:**
   - 인증서 발급이 정상 완료되면 `nginx.conf` 내부의 443 포트 SSL 주석을 해제하고 도메인 경로를 입력합니다.
   - `docker compose down`을 실행한 뒤, 깃허브 레포지토리에 푸시하면 깃허브 Actions 자동 빌드 파이프라인이 최신 운영용 소스 코드를 서버에 완전히 배포하게 됩니다.

---

## 🔄 유용한 도커 트러블슈팅 명령어
```bash
# 컨테이너 가동 상태 확인
docker compose ps

# 백엔드 또는 Nginx 실시간 오류 로그 추적
docker compose logs -f backend
docker compose logs -f nginx

# 컨테이너 및 공유 볼륨(데이터베이스 포함) 전체 정리 후 초기화 가동
docker compose down -v
docker compose up -d --build
```
