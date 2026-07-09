package com.bulletmarket.service;

import com.bulletmarket.dto.ProductDto;
import com.bulletmarket.entity.Product;
import com.bulletmarket.entity.ProductInventory;
import com.bulletmarket.entity.Review;
import com.bulletmarket.repository.ProductInventoryRepository;
import com.bulletmarket.repository.ProductRepository;
import com.bulletmarket.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductInventoryRepository productInventoryRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Transactional(readOnly = true)
    public List<ProductDto> getAllProducts() {
        List<Product> products = productRepository.findAll();
        
        // 의도적인 성능 결함: N+1 쿼리 루프 문제
        // 조회된 상품 전체를 반복하며 개별 상품의 평점 정보(쿼리 1)와 리뷰 수(쿼리 2), 
        // 그리고 분리된 재고 테이블(product_inventories)의 재고값(쿼리 3)을 매번 던집니다.
        // 500개 상품 로드 시 데이터베이스 호출이 폭증하는 병목 상태를 고의 재현합니다.
        return products.stream().map(product -> {
            List<Review> reviews = reviewRepository.findByProductId(product.getId()); // 쿼리 1
            int count = reviewRepository.countByProductId(product.getId());          // 쿼리 2
            
            Integer stock = productInventoryRepository.findById(product.getId())      // 쿼리 3 (재고테이블 조회)
                    .map(ProductInventory::getStockQuantity)
                    .orElse(0);
            
            double averageRating = reviews.stream()
                    .mapToInt(Review::getRating)
                    .average()
                    .orElse(0.0);
            
            // Supabase 데이터베이스 테이블에 저장 공간이 없는 이미지 주소와 상품 설명은
            // 카테고리 정보 및 상품 명을 활용하여 자바 서비스 계층에서 동적으로 합성(Synthetic) 처리합니다.
            // 이를 통해 DB 테이블 용량은 최소화하면서 프론트엔드 UI/UX 뷰와의 완벽한 호환성을 지킵니다.
            String categoryName = product.getCategory() != null ? product.getCategory().getName() : "all";
            String imageUrl = "/images/" + categoryName.toLowerCase() + ".jpg";
            String description = "Premium quality " + product.getName() + " under category " + categoryName + ". Designed for everyday use.";

            return new ProductDto(
                    product.getId(),
                    product.getName(),
                    description,
                    product.getPrice().doubleValue(),
                    stock,
                    imageUrl,
                    averageRating,
                    count
            );
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductDto> searchProducts(String keyword) {
        List<Product> products = productRepository.findByNameContainingIgnoreCase(keyword);
        
        // 의도적인 성능 결함: 검색 조회 시에도 동일하게 N+1 데이터베이스 쿼리를 루프로 때림
        return products.stream().map(product -> {
            List<Review> reviews = reviewRepository.findByProductId(product.getId());
            int count = reviewRepository.countByProductId(product.getId());
            
            Integer stock = productInventoryRepository.findById(product.getId())
                    .map(ProductInventory::getStockQuantity)
                    .orElse(0);
            
            double averageRating = reviews.stream()
                    .mapToInt(Review::getRating)
                    .average()
                    .orElse(0.0);
            
            String categoryName = product.getCategory() != null ? product.getCategory().getName() : "all";
            String imageUrl = "/images/" + categoryName.toLowerCase() + ".jpg";
            String description = "Premium quality " + product.getName() + " under category " + categoryName + ". Designed for everyday use.";

            return new ProductDto(
                    product.getId(),
                    product.getName(),
                    description,
                    product.getPrice().doubleValue(),
                    stock,
                    imageUrl,
                    averageRating,
                    count
            );
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductDto getProductById(Long id) {
        // 의도적인 UX 결함: 상품 상세 클릭 시 300ms의 인위적 지연을 추가
        // API 통신 지연 속에서 사용자가 나쁜 로딩 피드백을 체감하도록 시뮬레이션합니다.
        try {
            Thread.sleep(300);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with ID: " + id));

        List<Review> reviews = reviewRepository.findByProductId(product.getId());
        int count = reviewRepository.countByProductId(product.getId());
        
        Integer stock = productInventoryRepository.findById(product.getId())
                .map(ProductInventory::getStockQuantity)
                .orElse(0);
        
        double averageRating = reviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);
        
        String categoryName = product.getCategory() != null ? product.getCategory().getName() : "all";
        String imageUrl = "/images/" + categoryName.toLowerCase() + ".jpg";
        String description = "Premium quality " + product.getName() + " under category " + categoryName + ". Designed for everyday use.";

        return new ProductDto(
                product.getId(),
                product.getName(),
                description,
                product.getPrice().doubleValue(),
                stock,
                imageUrl,
                averageRating,
                count
        );
    }
}
