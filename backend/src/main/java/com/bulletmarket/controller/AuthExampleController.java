package com.bulletmarket.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class AuthExampleController {

    @GetMapping("/protected-data")
    public Map<String, Object> getProtectedData(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getClaimAsString("sub");
        String role = jwt.getClaimAsString("role"); 
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Success");
        response.put("user_id", userId);
        response.put("role", role);
        
        return response;
    }
}
