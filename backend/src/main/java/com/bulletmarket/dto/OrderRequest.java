package com.bulletmarket.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderRequest {
    private String customerName;
    private String customerEmail;
    private List<OrderItemRequest> items;
    private String couponCode;
}
