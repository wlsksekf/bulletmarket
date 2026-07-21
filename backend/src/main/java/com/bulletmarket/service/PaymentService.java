package com.bulletmarket.service;

import com.bulletmarket.entity.Order;
import com.bulletmarket.entity.Payment;
import com.bulletmarket.repository.OrderRepository;
import com.bulletmarket.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class PaymentService {
    @Autowired
    private PaymentRepository paymentRepository;
    @Autowired
    private OrderRepository orderRepository;

    @Transactional
    public Payment processPayment(Long orderId, String pgProvider, String transactionId, int amount) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (order.getTotalPrice() != amount) {
            throw new IllegalArgumentException("Amount mismatch");
        }

        Payment payment = new Payment(null, order, pgProvider, transactionId, amount, "SUCCESS", LocalDateTime.now());
        paymentRepository.save(payment);

        order.setStatus("PAID");
        orderRepository.save(order);

        return payment;
    }
}
