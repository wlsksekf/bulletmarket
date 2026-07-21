package com.bulletmarket.controller;

import com.bulletmarket.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    @Autowired
    private PaymentService paymentService;

    @PostMapping
    public ResponseEntity<?> processPayment(@RequestBody Map<String, Object> payload) {
        Long orderId = ((Number) payload.get("orderId")).longValue();
        String pgProvider = (String) payload.get("pgProvider");
        String transactionId = (String) payload.get("transactionId");
        int amount = ((Number) payload.get("amount")).intValue();

        return ResponseEntity.ok(paymentService.processPayment(orderId, pgProvider, transactionId, amount));
    }
}
