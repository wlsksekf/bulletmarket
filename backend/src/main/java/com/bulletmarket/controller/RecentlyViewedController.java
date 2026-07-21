package com.bulletmarket.controller;

import com.bulletmarket.service.RecentlyViewedService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/recently-viewed")
public class RecentlyViewedController {
    @Autowired
    private RecentlyViewedService recentlyViewedService;

    @PostMapping("/{productId}")
    public ResponseEntity<?> addRecentlyViewed(@PathVariable Long productId, @RequestHeader(value = "X-User-Id", defaultValue = "2") Long userId) {
        recentlyViewedService.addRecentlyViewed(userId, productId);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<?> getRecentlyViewed(@RequestHeader(value = "X-User-Id", defaultValue = "2") Long userId) {
        return ResponseEntity.ok(recentlyViewedService.getRecentlyViewed(userId));
    }
}
