package com.bulletmarket.repository;

import com.bulletmarket.entity.RecentlyViewed;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecentlyViewedRepository extends JpaRepository<RecentlyViewed, Long> {
    List<RecentlyViewed> findByUserIdOrderByViewedAtDesc(Long userId);
    Optional<RecentlyViewed> findByUserIdAndProductId(Long userId, Long productId);
}
