package com.bulletmarket.controller;

import com.bulletmarket.entity.User;
import com.bulletmarket.repository.OrderRepository;
import com.bulletmarket.repository.ReviewRepository;
import com.bulletmarket.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private ReviewRepository reviewRepository;

    @GetMapping("/stats")
    public ResponseEntity<?> getAdminStats(@RequestHeader(value = "X-User-Id", defaultValue = "1") Long userId) {
        Optional<User> user = userRepository.findById(userId);
        if (user.isEmpty() || !"ADMIN".equals(user.get().getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied: Admin only");
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalOrders", orderRepository.count());
        stats.put("totalReviews", reviewRepository.count());

        return ResponseEntity.ok(stats);
    }
}
