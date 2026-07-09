package com.bulletmarket.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Coupon {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "coupon_id")
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "discount_amount", nullable = false)
    private Integer discountAmount;

    @Column(name = "max_issuance_limit", nullable = false)
    private Integer maxIssuanceLimit;

    @Column(name = "issued_count")
    private Integer issuedCount = 0;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
}
