package com.bulletmarket.controller;

import com.bulletmarket.service.PointService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/points")
public class PointController {
    @Autowired
    private PointService pointService;

    @GetMapping("/history")
    public ResponseEntity<?> getPointHistory(@RequestHeader(value = "X-User-Id", defaultValue = "2") Long userId) {
        return ResponseEntity.ok(pointService.getPointHistory(userId));
    }
}
