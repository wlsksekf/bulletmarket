package com.bulletmarket.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "product_inventories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductInventory {
    @Id
    @Column(name = "product_id")
    private Long productId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity;

    private Long version = 0L;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}
