package com.bulletmarket.service;

import com.bulletmarket.entity.Review;
import com.bulletmarket.entity.ReviewLike;
import com.bulletmarket.entity.User;
import com.bulletmarket.repository.ReviewLikeRepository;
import com.bulletmarket.repository.ReviewRepository;
import com.bulletmarket.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class ReviewService {
    @Autowired
    private ReviewRepository reviewRepository;
    @Autowired
    private ReviewLikeRepository reviewLikeRepository;
    @Autowired
    private UserRepository userRepository;

    @Transactional
    public boolean toggleHelpful(Long reviewId, Long userId) {
        return reviewLikeRepository.findByReviewIdAndUserId(reviewId, userId)
            .map(like -> {
                reviewLikeRepository.delete(like);
                Review review = reviewRepository.findById(reviewId).orElseThrow();
                review.setHelpfulCount(Math.max(0, review.getHelpfulCount() - 1));
                reviewRepository.save(review);
                return false; // unliked
            })
            .orElseGet(() -> {
                User user = userRepository.findById(userId).orElseThrow();
                Review review = reviewRepository.findById(reviewId).orElseThrow();
                reviewLikeRepository.save(new ReviewLike(null, review, user, LocalDateTime.now()));
                review.setHelpfulCount(review.getHelpfulCount() + 1);
                reviewRepository.save(review);
                return true; // liked
            });
    }
}
