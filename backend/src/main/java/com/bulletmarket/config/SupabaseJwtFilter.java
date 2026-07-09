package com.bulletmarket.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Base64;

/**
 * Supabase JWT(액세스 토큰) 토큰 파싱을 위한 사전 구현 인터셉터 필터입니다.
 */
@Component
public class SupabaseJwtFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String path = httpRequest.getRequestURI();
        String method = httpRequest.getMethod();

        // 1️⃣ [우회 방어망] 상품 조회(GET /api/products) 및 로그인/회원가입은 필터 가동 없이 무조건 안전하게 패스
        if ((path.startsWith("/api/products") && "GET".equalsIgnoreCase(method)) || path.startsWith("/api/auth/")) {
            chain.doFilter(request, response);
            return;
        }

        String authHeader = httpRequest.getHeader("Authorization");

        // Authorization 헤더가 있고 Bearer 토큰 형식인지 검사
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                // 2️⃣ [충돌 패치] 서블릿 컨텍스트 내장 키워드와 꼬이지 않도록 변수명을 'jwtSections'로 완전 안전하게 격리 변경
                String[] jwtSections = token.split("\\.");
                if (jwtSections.length >= 2) {
                    // 2번째 파트가 회원 UUID, 이메일, 권한 메타데이터가 담긴 JSON 클레임 영역입니다.
                    String payload = jwtSections[1];
                    byte[] decodedBytes = Base64.getUrlDecoder().decode(payload);
                    String decodedJson = new String(decodedBytes);
                    
                    // 해독된 원시 JSON 스트링을 request 속성에 밀어 넣어 백엔드 컨트롤러 등에서 꺼내 쓸 수 있도록 지원합니다.
                    httpRequest.setAttribute("supabaseClaims", decodedJson);
                }
            } catch (Exception e) {
                // 토큰 형식이 잘못되었거나 해독 중 예외가 발생한 경우 로그만 남기고 요청은 그대로 통과시킵니다.
                System.err.println("인증 JWT 토큰 복호화 실패: " + e.getMessage());
            }
        }

        chain.doFilter(request, response);
    }
}