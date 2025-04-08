package com.harvestdirect.app.config;

import com.harvestdirect.app.model.Product;
import com.harvestdirect.app.model.User;
import com.harvestdirect.app.service.ProductService;
import com.harvestdirect.app.service.UserService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.math.BigDecimal;

@Configuration
public class DataLoader {

    @Bean
    @Profile("!prod")
    public CommandLineRunner loadData(UserService userService, ProductService productService) {
        return args -> {
            // Create test users if they don't exist
            if (!userService.existsByUsername("farmer")) {
                User farmer = new User();
                farmer.setUsername("farmer");
                farmer.setPassword("password123");
                farmer.setName("Test Farmer");
                farmer.setEmail("farmer@example.com");
                farmer.setRole(User.UserRole.FARMER);
                farmer.setAddress("789 Farm Rd");
                farmer.setPhone("555-5678");
                
                User savedFarmer = userService.createUser(farmer);
                System.out.println("Created test farmer: farmer / password123");
                
                // Add products for farmer
                Product apples = new Product();
                apples.setName("Organic Apples");
                apples.setDescription("Fresh organic apples harvested yesterday");
                apples.setPrice(new BigDecimal("2.99"));
                apples.setQuantity(100);
                apples.setCategory("fruits");
                apples.setUnit("kg");
                apples.setSeller(savedFarmer);
                apples.setImageUrl("https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a");
                apples.setIsAvailable(true);
                productService.createProduct(apples);
                
                Product carrots = new Product();
                carrots.setName("Fresh Carrots");
                carrots.setDescription("Locally grown carrots, perfect for salads and cooking");
                carrots.setPrice(new BigDecimal("1.99"));
                carrots.setQuantity(50);
                carrots.setCategory("vegetables");
                carrots.setUnit("kg");
                carrots.setSeller(savedFarmer);
                carrots.setImageUrl("https://images.unsplash.com/photo-1590868309235-58c33a8f7d5b");
                carrots.setIsAvailable(true);
                productService.createProduct(carrots);
                
                System.out.println("Created sample products for farmer");
            }
            
            if (!userService.existsByUsername("fisherman")) {
                User fisherman = new User();
                fisherman.setUsername("fisherman");
                fisherman.setPassword("password123");
                fisherman.setName("Test Fisherman");
                fisherman.setEmail("fisherman@example.com");
                fisherman.setRole(User.UserRole.FISHERMAN);
                fisherman.setAddress("456 Harbor Way");
                fisherman.setPhone("555-4321");
                
                User savedFisherman = userService.createUser(fisherman);
                System.out.println("Created test fisherman: fisherman / password123");
                
                // Add products for fisherman
                Product salmon = new Product();
                salmon.setName("Fresh Salmon");
                salmon.setDescription("Wild-caught salmon, rich in omega-3");
                salmon.setPrice(new BigDecimal("12.99"));
                salmon.setQuantity(30);
                salmon.setCategory("seafood");
                salmon.setUnit("kg");
                salmon.setSeller(savedFisherman);
                salmon.setImageUrl("https://images.unsplash.com/photo-1574781330855-d0db8cc6a79c");
                salmon.setIsAvailable(true);
                productService.createProduct(salmon);
                
                Product shrimp = new Product();
                shrimp.setName("Jumbo Shrimp");
                shrimp.setDescription("Fresh jumbo shrimp caught daily");
                shrimp.setPrice(new BigDecimal("15.99"));
                shrimp.setQuantity(40);
                shrimp.setCategory("seafood");
                shrimp.setUnit("kg");
                shrimp.setSeller(savedFisherman);
                shrimp.setImageUrl("https://images.unsplash.com/photo-1565680018160-d349ffe6fffa");
                shrimp.setIsAvailable(true);
                productService.createProduct(shrimp);
                
                System.out.println("Created sample products for fisherman");
            }
            
            if (!userService.existsByUsername("wholesaler")) {
                User wholesaler = new User();
                wholesaler.setUsername("wholesaler");
                wholesaler.setPassword("password123");
                wholesaler.setName("Test Wholesaler");
                wholesaler.setEmail("wholesaler@example.com");
                wholesaler.setRole(User.UserRole.WHOLESALER);
                wholesaler.setAddress("123 Market St");
                wholesaler.setPhone("555-1234");
                
                userService.createUser(wholesaler);
                System.out.println("Created test wholesaler: wholesaler / password123");
            }
            
            if (!userService.existsByUsername("admin")) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setPassword("admin123");
                admin.setName("Admin User");
                admin.setEmail("admin@example.com");
                admin.setRole(User.UserRole.ADMIN);
                admin.setAddress("Admin HQ");
                admin.setPhone("555-0000");
                
                userService.createUser(admin);
                System.out.println("Created admin user: admin / admin123");
            }
        };
    }
}