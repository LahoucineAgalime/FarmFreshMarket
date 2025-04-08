package com.harvestdirect.app.repository;

import com.harvestdirect.app.model.Product;
import com.harvestdirect.app.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findBySeller(User seller);
    List<Product> findByCategory(String category);
    
    @Query("SELECT p FROM Product p WHERE " +
           "p.name LIKE %:query% OR " +
           "p.description LIKE %:query% OR " +
           "p.category LIKE %:query%")
    List<Product> searchProducts(@Param("query") String query);
    
    List<Product> findByIsAvailableTrue();
}