package com.bulletmarket.config;

import com.bulletmarket.entity.*;
import com.bulletmarket.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductInventoryRepository productInventoryRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    private final Random random = new Random();

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        boolean needsReSeed = true; // Force reseed to apply new categories and prices

            System.out.println("⚙️ 데이터베이스의 기존 영문 더미 데이터를 삭제하고 친숙한 한글 상품명 데이터로 마이그레이션합니다...");
            reviewRepository.deleteAllInBatch();
            productInventoryRepository.deleteAllInBatch();
            productRepository.deleteAllInBatch();
            categoryRepository.deleteAllInBatch();
            seedDatabase();
    }

    private void seedDatabase() {
        // 1. 카테고리 더미 데이터 선적재 (이미지 매핑 호환성을 위해 영문 키값 유지)
        String[] catNames = {"Fashion", "Beauty", "Baby", "Food", "Kitchen", "Home", "Electronics", "Sports", "Pets"};
        List<Category> categoryList = new ArrayList<>();
        for (String catName : catNames) {
            Category category = new Category();
            category.setName(catName);
            categoryList.add(categoryRepository.save(category));
        }

        // 2. 가상 사용자 더미 데이터 적재 (리뷰 작성자용, 존재 시 업데이트 및 재사용하여 고유키 제약 위반 방지)
        List<User> userList = new ArrayList<>();
        for (int i = 1; i <= 5; i++) {
            final String email = "user" + i + "@example.com";
            final int index = i;
            User u = userRepository.findByEmail(email)
                    .orElseGet(() -> {
                        User newUser = new User();
                        newUser.setEmail(email);
                        newUser.setPassword("password123");
                        newUser.setName("구매고객 " + index);
                        return userRepository.save(newUser);
                    });
            u.setName("구매고객 " + index);
            userList.add(userRepository.save(u));
        }

        // 3. 500개 상품 적재
        String[] productPrefixes = {"신선한", "맛있는", "프리미엄", "국내산", "유기농", "가성비", "인기만점", "친환경", "특가", "명품"};
        String[] productNouns = {"세트", "박스", "팩", "모음", "단품", "기획", "종합", "선물세트", "패키지", "대용량"};
        
        List<Product> products = new ArrayList<>();
        for (int i = 1; i <= 500; i++) {
            Category category = categoryList.get(i % categoryList.size());
            
            // 카테고리명을 한국식 네이밍으로 한글 변환 매핑
            String categoryKorean = "";
            switch (category.getName()) {
                case "Fashion": categoryKorean = "패션의류/잡화"; break;
                case "Beauty": categoryKorean = "뷰티/화장품"; break;
                case "Baby": categoryKorean = "출산/유아동"; break;
                case "Food": categoryKorean = "식품"; break;
                case "Kitchen": categoryKorean = "주방/생필품"; break;
                case "Home": categoryKorean = "홈인테리어"; break;
                case "Electronics": categoryKorean = "가전/디지털"; break;
                case "Sports": categoryKorean = "스포츠/레저"; break;
                case "Pets": categoryKorean = "반려동물용품"; break;
                default: categoryKorean = "일반상품";
            }

            String name = productPrefixes[random.nextInt(productPrefixes.length)] + " " +
                         categoryKorean + " " +
                         productNouns[random.nextInt(productNouns.length)] + " #" + i;
            
            // 금액 단위는 원화 정수 형태로 환산 (1,000원 ~ 50,000원 사이 무작위 설정)
            int price = (1 + random.nextInt(50)) * 1000;
            
            Product product = new Product();
            product.setName(name);
            product.setPrice(price);
            product.setCategory(category);
            product.setIsAvailable(true);
            product.setViewCount(0);
            product.setCreatedAt(LocalDateTime.now());
            products.add(product);
        }
        List<Product> savedProducts = productRepository.saveAll(products);

        // 4. 상품별 1:1 재고 데이터 생성 (product_inventories 테이블 분리 구조 연동)
        List<ProductInventory> inventories = new ArrayList<>();
        for (Product product : savedProducts) {
            ProductInventory inv = new ProductInventory();
            inv.setProduct(product);
            inv.setStockQuantity(10 + random.nextInt(140)); // 각 상품별로 10개 ~ 150개 범위 재고 지정
            inv.setVersion(0L);
            inv.setUpdatedAt(LocalDateTime.now());
            inventories.add(inv);
        }
        productInventoryRepository.saveAll(inventories);

        // 5. 상품별 고객 리뷰 데이터 적재
        List<Review> reviews = new ArrayList<>();
        String[] reviewTexts = {
            "정말 훌륭한 상품입니다! 기대 이상으로 만족스럽네요.",
            "가격 대비 아주 괜찮은 구성인데 조금만 더 개선되면 완벽할 것 같아요.",
            "생각보다 품질이 평이하네요. 다음에는 다른 카테고리를 살펴볼 것 같습니다.",
            "디자인도 수려하고 배송이 아주 빨라요. 적극 추천합니다!",
            "그냥 쓸만합니다. 특별히 좋지도 나쁘지도 않은 평범한 수준입니다.",
            "마감이 깔끔하고 설명서대로 기능도 잘 나와서 만족합니다."
        };
        
        for (Product product : savedProducts) {
            int reviewCount = 1 + random.nextInt(2); // 상품당 1개 ~ 2개 리뷰 할당
            for (int r = 0; r < reviewCount; r++) {
                int rating = 1 + random.nextInt(5); // 1점 ~ 5점 무작위 평점
                String content = reviewTexts[random.nextInt(reviewTexts.length)] + " 평점: " + rating + "점 / 5점 만점";
                User randomUser = userList.get(random.nextInt(userList.size())); // 더미 유저 중 한 명을 임의 매핑
                
                Review review = new Review();
                review.setProduct(product);
                review.setUser(randomUser);
                review.setContent(content);
                review.setRating(rating);
                review.setCreatedAt(LocalDateTime.now());
                reviews.add(review);
            }
        }
        reviewRepository.saveAll(reviews);
        
        System.out.println("Supabase 규격 카테고리, 유저, 500개 상품, 재고 및 리뷰 더미 데이터 적재 완료.");
    }
}
