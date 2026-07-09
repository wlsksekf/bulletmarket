package com.bulletmarket.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Base64;

/**
 * Supabase JWT(액세스 토큰) 토큰 파싱을 위한 사전 구현 인터셉터 필터입니다.
 * 
 * Supabase 인증 서비스를 백엔드와 연동하는 흐름:
 * 1. React 프론트엔드가 Supabase 로그인 세션으로부터 JWT 액세스 토큰을 획득합니다.
 * 2. 프론트엔드가 백엔드 API를 호출할 때 헤더에 "Authorization: Bearer <JWT>" 형태로 실어 보냅니다.
 * 3. 이 필터가 해당 요청을 가로채어 헤더에서 JWT를 추출하고 Base64로 해독하여 클레임 페이로드(UUID, 이메일 등)를 복원합니다.
 * 4. 복원된 회원 정보 JSON 스트링은 컨트롤러 등에서 참조할 수 있도록 HttpServletRequest 속성("supabaseClaims")에 바인딩됩니다.
 * 
 * 주의: 실 서비스 배포 시에는 pom.xml에 JWT 검증 라이브러리(jjwt, java-jwt 등)를 추가하여
 * Supabase 대시보드에서 발급받은 JWT Secret 키를 사용해 암호화 서명(Signature)을 반드시 검증해야 안전합니다.
 */
@Component
public class SupabaseJwtFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String authHeader = httpRequest.getHeader("Authorization");

        // Authorization 헤더가 있고 Bearer 토큰 형식인지 검사
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                // JWT는 헤더(Header).페이로드(Payload).서명(Signature) 구조로 점(.)으로 구분되어 있습니다.
                String[] parts = token.split("\\.");
                if (parts.length >= 2) {
                    // 2번째 파트가 회원 UUID, 이메일, 권한 메타데이터가 담긴 JSON 클레임 영역입니다.
                    String payload = parts[1];
                    byte[] decodedBytes = Base64.getUrlDecoder().decode(payload);
                    String decodedJson = new String(decodedBytes);
                    
                    // 해독된 원시 JSON 스트링을 request 속성에 밀어 넣어 백엔드 컨트롤러 등에서 꺼내 쓸 수 있도록 지원합니다.
                    httpRequest.setAttribute("supabaseClaims", decodedJson);
                }
            } catch (Exception e) {
                // 토큰 형식이 잘못되었거나 해독 중 예외가 발생한 경우 로그만 남기고 요청은 그대로 통과시킵니다.
                // 보안을 강화하여 미인증 요청을 거부하려면 여기서 401 Unauthorized(SC_UNAUTHORIZED) 응답을 내보내면 됩니다.
                System.err.println("인증 JWT 토큰 복호화 실패: " + e.getMessage());
            }
        }

        chain.doFilter(request, response);
    }
}
