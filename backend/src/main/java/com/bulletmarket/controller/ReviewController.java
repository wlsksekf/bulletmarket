package com.bulletmarket.controller;

import com.bulletmarket.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {
    @Autowired
    private ReviewService reviewService;

    @PostMapping("/{reviewId}/like")
    public ResponseEntity<?> toggleHelpful(@PathVariable Long reviewId, @RequestHeader(value = "X-User-Id", defaultValue = "2") Long userId) {
        boolean liked = reviewService.toggleHelpful(reviewId, userId);
        return ResponseEntity.ok().body("{\"status\": \"success\", \"liked\": " + liked + "}");
    }
}
