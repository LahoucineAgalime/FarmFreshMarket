package com.harvestdirect.app.repository;

import com.harvestdirect.app.model.Order;
import com.harvestdirect.app.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByBuyer(User buyer);
    List<Order> findBySeller(User seller);
    List<Order> findByBuyerOrderByOrderDateDesc(User buyer);
    List<Order> findBySellerOrderByOrderDateDesc(User seller);
    
    // Added methods for analytics
    List<Order> findBySellerAndOrderDateBetweenOrderByOrderDate(User seller, Date startDate, Date endDate);
    List<Order> findByBuyerAndOrderDateBetweenOrderByOrderDate(User buyer, Date startDate, Date endDate);
    
    @Query("SELECT o FROM Order o WHERE o.seller = ?1 AND FUNCTION('MONTH', o.orderDate) = ?2 AND FUNCTION('YEAR', o.orderDate) = ?3")
    List<Order> findBySellerAndMonth(User seller, int month, int year);
    
    @Query("SELECT o FROM Order o WHERE o.buyer = ?1 AND FUNCTION('MONTH', o.orderDate) = ?2 AND FUNCTION('YEAR', o.orderDate) = ?3")
    List<Order> findByBuyerAndMonth(User buyer, int month, int year);
}