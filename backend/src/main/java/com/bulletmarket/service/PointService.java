package com.bulletmarket.service;

import com.bulletmarket.entity.PointHistory;
import com.bulletmarket.entity.User;
import com.bulletmarket.repository.PointHistoryRepository;
import com.bulletmarket.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PointService {
    @Autowired
    private PointHistoryRepository pointHistoryRepository;
    @Autowired
    private UserRepository userRepository;

    @Transactional
    public void earnPoints(Long userId, int amount, String description) {
        User user = userRepository.findById(userId).orElseThrow();
        user.setPoints(user.getPoints() + amount);
        userRepository.save(user);

        PointHistory history = new PointHistory(null, user, amount, "EARN", description, LocalDateTime.now());
        pointHistoryRepository.save(history);
    }

    @Transactional
    public void spendPoints(Long userId, int amount, String description) {
        User user = userRepository.findById(userId).orElseThrow();
        if (user.getPoints() < amount) {
            throw new IllegalArgumentException("Not enough points");
        }
        user.setPoints(user.getPoints() - amount);
        userRepository.save(user);

        PointHistory history = new PointHistory(null, user, amount, "SPEND", description, LocalDateTime.now());
        pointHistoryRepository.save(history);
    }

    @Transactional(readOnly = true)
    public List<PointHistory> getPointHistory(Long userId) {
        return pointHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
}
