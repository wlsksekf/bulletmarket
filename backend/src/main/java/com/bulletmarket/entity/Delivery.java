package com.bulletmarket.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "deliveries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Delivery {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "delivery_id")
    private Long id;

    @Column(nullable = false)
    private String address;

    @Column(name = "recipient_name", nullable = false)
    private String recipientName;

    @Column(name = "status")
    private String status = "READY";

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}
