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
@CrossOrigin(origins = "*")
public class ProductController {

    @Autowired
    private ProductService productService;

    @Autowired
    private ReviewRepository reviewRepository;

    @GetMapping
    public ResponseEntity<List<ProductDto>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/search")
    public ResponseEntity<List<ProductDto>> searchProducts(@RequestParam("q") String query) {
        return ResponseEntity.ok(productService.searchProducts(query));
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
