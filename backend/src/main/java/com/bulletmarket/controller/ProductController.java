package com.bulletmarket.controller;

import com.bulletmarket.dto.ProductDto;
import com.bulletmarket.entity.Product;
import com.bulletmarket.entity.Review;
import com.bulletmarket.repository.ReviewRepository;
import com.bulletmarket.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ProductController {

    @Autowired
    private ProductService productService;

    @Autowired
    private ReviewRepository reviewRepository;

    @GetMapping
    public ResponseEntity<List<ProductDto>> getAllProducts(@RequestParam(value = "sort", defaultValue = "latest") String sort) {
        try {
            List<ProductDto> products = productService.getAllProducts(sort);
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            // 배포 환경에서 서비스 레이어 에러 시 404가 나거나 로깅 누락되는 것 방지
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<ProductDto>> searchProducts(@RequestParam("q") String query, @RequestParam(value = "sort", defaultValue = "latest") String sort) {
        return ResponseEntity.ok(productService.searchProducts(query, sort));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> getProductById(@PathVariable("id") Long id) {
        try {
            return ResponseEntity.ok(productService.getProductById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/reviews")
    public ResponseEntity<List<Review>> getProductReviews(@PathVariable("id") Long id) {
        return ResponseEntity.ok(reviewRepository.findByProductId(id));
    }
}