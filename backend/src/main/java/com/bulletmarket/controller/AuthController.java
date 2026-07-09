package com.bulletmarket.controller;

import com.bulletmarket.dto.AuthResponse;
import com.bulletmarket.dto.LoginRequest;
import com.bulletmarket.dto.SignupRequest;
import com.bulletmarket.entity.User;
import com.bulletmarket.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody SignupRequest request, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            Map<String, String> response = new HashMap<>();
            response.put("message", bindingResult.getFieldError().getDefaultMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Email address already registered");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword()); // Plain text storage for mock/before simplicity
        user.setName(request.getName());
        userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "User registered successfully");
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            Map<String, String> response = new HashMap<>();
            response.put("message", bindingResult.getFieldError().getDefaultMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + request.getEmail()));

        if (!user.getPassword().equals(request.getPassword())) {
            throw new IllegalArgumentException("Invalid password credentials provided.");
        }

        // Generate a mock token for local auth simulation
        String mockToken = "bulletmarket-mock-jwt-token-header." + 
                           java.util.Base64.getEncoder().encodeToString(user.getEmail().getBytes()) + 
                           ".signature";

        AuthResponse authResponse = new AuthResponse(
                user.getEmail(),
                user.getName(),
                mockToken
        );

        return ResponseEntity.ok(authResponse);
    }
}
