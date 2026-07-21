package com.bulletmarket.service;

import com.bulletmarket.entity.Product;
import com.bulletmarket.entity.RecentlyViewed;
import com.bulletmarket.entity.User;
import com.bulletmarket.repository.ProductRepository;
import com.bulletmarket.repository.RecentlyViewedRepository;
import com.bulletmarket.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RecentlyViewedService {
    @Autowired
    private RecentlyViewedRepository recentlyViewedRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ProductRepository productRepository;

    @Transactional
    public void addRecentlyViewed(Long userId, Long productId) {
        recentlyViewedRepository.findByUserIdAndProductId(userId, productId).ifPresentOrElse(
            view -> {
                view.setViewedAt(LocalDateTime.now());
                recentlyViewedRepository.save(view);
            },
            () -> {
                User user = userRepository.findById(userId).orElseThrow();
                Product product = productRepository.findById(productId).orElseThrow();
                recentlyViewedRepository.save(new RecentlyViewed(null, user, product, LocalDateTime.now()));
            }
        );
    }

    @Transactional(readOnly = true)
    public List<RecentlyViewed> getRecentlyViewed(Long userId) {
        return recentlyViewedRepository.findByUserIdOrderByViewedAtDesc(userId);
    }
}
