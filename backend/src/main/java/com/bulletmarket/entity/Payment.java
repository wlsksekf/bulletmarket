package com.bulletmarket.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "pg_provider", nullable = false)
    private String pgProvider;

    @Column(name = "pg_transaction_id", nullable = false)
    private String pgTransactionId;

    @Column(nullable = false)
    private Integer amount;

    @Column(name = "status")
    private String status = "SUCCESS";

    @Column(name = "paid_at")
    private LocalDateTime paidAt = LocalDateTime.now();
}
