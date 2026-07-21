package com.bulletmarket.controller;

import com.bulletmarket.service.WishlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wishlists")
public class WishlistController {
    @Autowired
    private WishlistService wishlistService;

    // For simplicity, assuming user 1 (testuser1) in headers or hardcoded if no auth
    @PostMapping("/{productId}")
    public ResponseEntity<?> toggleWishlist(@PathVariable Long productId, @RequestHeader(value = "X-User-Id", defaultValue = "2") Long userId) {
        boolean added = wishlistService.toggleWishlist(userId, productId);
        return ResponseEntity.ok().body("{\"status\": \"success\", \"added\": " + added + "}");
    }

    @GetMapping
    public ResponseEntity<?> getUserWishlist(@RequestHeader(value = "X-User-Id", defaultValue = "2") Long userId) {
        return ResponseEntity.ok(wishlistService.getUserWishlist(userId));
    }
}
