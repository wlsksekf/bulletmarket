package com.bulletmarket.service;

import com.bulletmarket.dto.OrderItemRequest;
import com.bulletmarket.dto.OrderRequest;
import com.bulletmarket.entity.*;
import com.bulletmarket.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductInventoryRepository productInventoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DeliveryRepository deliveryRepository;

    // 의도적인 동시성 설계 결함: 데이터베이스 잠금(Locking) 없음 및 강제 처리 지연 결합
    // 여러 스레드가 동시에 인벤토리의 stock_quantity 값을 읽어갈 수 있어, 
    // 실제 보유 재고 이상으로 주문이 성립되어버리는 재고 초과 판매(Overselling) 버그를 고의 유발합니다.
    @Transactional
    public Order createOrder(OrderRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Cart cannot be empty for checkout");
        }

        // 1. 회원 정보 식별 및 등록 처리
        // 로그인 및 결제 시 입력받은 이메일을 바탕으로 회원을 조회하고, 
        // 테이블에 없는 신규 유저일 경우 즉시 Guest 용도로 회원가입 처리합니다.
        User user = userRepository.findByEmail(request.getCustomerEmail())
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setEmail(request.getCustomerEmail());
                    newUser.setPassword("guest-12345");
                    newUser.setName(request.getCustomerName());
                    newUser.setUserTier("SILVER");
                    newUser.setStatus("ACTIVE");
                    newUser.setCreatedAt(LocalDateTime.now());
                    return userRepository.save(newUser);
                });

        // 2. 배송(Delivery) 엔티티를 우선 생성 및 DB에 영속화
        Delivery delivery = new Delivery();
        delivery.setAddress("123 Bullet E-commerce St, Seoul");
        delivery.setRecipientName(request.getCustomerName());
        delivery.setStatus("READY");
        delivery.setUpdatedAt(LocalDateTime.now());
        delivery = deliveryRepository.save(delivery);

        // 3. 주문(Order) 준비 작업 개시
        Order order = new Order();
        order.setUser(user);
        order.setDelivery(delivery);
        order.setStatus("ORDERED");
        order.setCreatedAt(LocalDateTime.now());
        
        List<OrderItem> orderItems = new ArrayList<>();
        int totalPrice = 0;

        for (OrderItemRequest itemReq : request.getItems()) {
            // 상품 조회
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found with ID: " + itemReq.getProductId()));

            // 별도 격리된 product_inventories 테이블로부터 재고 레코드 조회
            ProductInventory inventory = productInventoryRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new IllegalStateException("Inventory record missing for product ID: " + itemReq.getProductId()));

            // 재고 수량 정합성 체크
            if (inventory.getStockQuantity() < itemReq.getQuantity()) {
                throw new IllegalStateException("Insufficient stock for product: " + product.getName() 
                    + " (Requested: " + itemReq.getQuantity() + ", Available: " + inventory.getStockQuantity() + ")");
            }

            // 인위적인 지연 삽입 (레이스 컨디션을 강하게 부추기기 위함)
            // 재고 판단은 끝났으나 DB에 갱신(-1)하기 전의 시간차 틈새를 주어 다른 동시 스레드가 똑같은 재고값을 읽어가게 만듭니다.
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }

            // 재고 감소 처리 후 갱신
            inventory.setStockQuantity(inventory.getStockQuantity() - itemReq.getQuantity());
            inventory.setUpdatedAt(LocalDateTime.now());
            productInventoryRepository.save(inventory);

            // 주문 상세(OrderItem) 세부 항목 추가
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(itemReq.getQuantity());
            orderItem.setPrice(product.getPrice()); // 정수 금액
            orderItems.add(orderItem);

            totalPrice += product.getPrice() * itemReq.getQuantity();
        }

        order.setOrderItems(orderItems);

        // 쿠폰 코드 할인 연산 수행 (BULLET10, WELCOME20, DISCOUNT5)
        if (request.getCouponCode() != null && !request.getCouponCode().trim().isEmpty()) {
            String code = request.getCouponCode().trim().toUpperCase();
            if (code.equals("BULLET10")) {
                totalPrice = (int) Math.round(totalPrice * 0.9);
            } else if (code.equals("WELCOME20")) {
                totalPrice = (int) Math.round(totalPrice * 0.8);
            } else if (code.equals("DISCOUNT5")) {
                totalPrice = Math.max(0, totalPrice - 5);
            }
        }

        order.setTotalPrice(totalPrice);

        return orderRepository.save(order);
    }

    @Transactional(readOnly = true)
    public List<Order> getOrdersByUserEmail(String email) {
        return orderRepository.findByUserEmailOrderByCreatedAtDesc(email);
    }
}
