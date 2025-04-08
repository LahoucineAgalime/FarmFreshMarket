package com.harvestdirect.app.service;

import com.harvestdirect.app.model.Order;
import com.harvestdirect.app.model.Product;
import com.harvestdirect.app.model.User;
import com.harvestdirect.app.repository.OrderRepository;
import com.harvestdirect.app.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for generating analytics and reports for the application
 */
@Service
public class AnalyticsService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public AnalyticsService(OrderRepository orderRepository, ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    /**
     * Get sales data for a seller over a specific period
     * @param seller the seller user
     * @param startDate the start date
     * @param endDate the end date
     * @return a map of dates to sales amounts
     */
    public Map<LocalDate, BigDecimal> getSellerSalesOverTime(User seller, Date startDate, Date endDate) {
        List<Order> orders = orderRepository.findBySellerAndOrderDateBetweenOrderByOrderDate(
                seller, startDate, endDate);
        
        Map<LocalDate, BigDecimal> salesByDate = new TreeMap<>();
        
        // Initialize all dates in the range with zero sales
        LocalDate start = startDate.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        LocalDate end = endDate.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            salesByDate.put(date, BigDecimal.ZERO);
        }
        
        // Fill in actual sales data
        for (Order order : orders) {
            LocalDate orderDate = order.getOrderDate().toInstant()
                    .atZone(ZoneId.systemDefault()).toLocalDate();
            
            salesByDate.put(orderDate, salesByDate.getOrDefault(orderDate, BigDecimal.ZERO)
                    .add(order.getTotalAmount()));
        }
        
        return salesByDate;
    }

    /**
     * Get total sales amount for a seller over a specific period
     * @param seller the seller user
     * @param startDate the start date
     * @param endDate the end date
     * @return the total sales amount
     */
    public BigDecimal getSellerTotalSales(User seller, Date startDate, Date endDate) {
        List<Order> orders = orderRepository.findBySellerAndOrderDateBetweenOrderByOrderDate(
                seller, startDate, endDate);
        
        return orders.stream()
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Get sales by product category for a seller
     * @param seller the seller user
     * @param startDate the start date
     * @param endDate the end date
     * @return a map of categories to sales amounts
     */
    public Map<String, BigDecimal> getSellerSalesByCategory(User seller, Date startDate, Date endDate) {
        // Get all orders for the seller in the date range
        List<Order> orders = orderRepository.findBySellerAndOrderDateBetweenOrderByOrderDate(
                seller, startDate, endDate);
        
        // Get all products by this seller
        List<Product> sellerProducts = productRepository.findBySeller(seller);
        
        // Create a map of product id to category
        Map<Long, String> productCategories = sellerProducts.stream()
                .collect(Collectors.toMap(Product::getId, Product::getCategory));
        
        // Calculate sales by category
        Map<String, BigDecimal> salesByCategory = new HashMap<>();
        
        for (Order order : orders) {
            // For each order item, get the product category and add sales
            order.getOrderItems().forEach(item -> {
                String category = productCategories.getOrDefault(item.getProduct().getId(), "Other");
                BigDecimal itemTotal = item.getUnitPrice().multiply(new BigDecimal(item.getQuantity()));
                
                salesByCategory.put(category, 
                        salesByCategory.getOrDefault(category, BigDecimal.ZERO).add(itemTotal));
            });
        }
        
        return salesByCategory;
    }

    /**
     * Get top selling products for a seller
     * @param seller the seller user
     * @param startDate the start date
     * @param endDate the end date
     * @param limit the maximum number of products to return
     * @return a list of products with their sales data
     */
    public List<Map<String, Object>> getTopSellingProducts(User seller, Date startDate, Date endDate, int limit) {
        List<Order> orders = orderRepository.findBySellerAndOrderDateBetweenOrderByOrderDate(
                seller, startDate, endDate);
        
        // Aggregate sales by product
        Map<Long, Integer> quantitySold = new HashMap<>();
        Map<Long, BigDecimal> revenue = new HashMap<>();
        Map<Long, Product> products = new HashMap<>();
        
        for (Order order : orders) {
            order.getOrderItems().forEach(item -> {
                Long productId = item.getProduct().getId();
                int quantity = item.getQuantity();
                BigDecimal itemTotal = item.getUnitPrice().multiply(new BigDecimal(quantity));
                
                quantitySold.put(productId, quantitySold.getOrDefault(productId, 0) + quantity);
                revenue.put(productId, revenue.getOrDefault(productId, BigDecimal.ZERO).add(itemTotal));
                products.put(productId, item.getProduct());
            });
        }
        
        // Convert to list of maps for easy access in templates
        List<Map<String, Object>> result = new ArrayList<>();
        for (Long productId : revenue.keySet()) {
            Map<String, Object> productData = new HashMap<>();
            productData.put("product", products.get(productId));
            productData.put("quantitySold", quantitySold.get(productId));
            productData.put("revenue", revenue.get(productId));
            result.add(productData);
        }
        
        // Sort by revenue (descending) and limit results
        result.sort((a, b) -> ((BigDecimal)b.get("revenue")).compareTo((BigDecimal)a.get("revenue")));
        
        if (result.size() > limit) {
            result = result.subList(0, limit);
        }
        
        return result;
    }

    /**
     * Get order count by status for a seller
     * @param seller the seller user
     * @param startDate the start date
     * @param endDate the end date
     * @return a map of order status to count
     */
    public Map<Order.OrderStatus, Long> getOrderCountByStatus(User seller, Date startDate, Date endDate) {
        List<Order> orders = orderRepository.findBySellerAndOrderDateBetweenOrderByOrderDate(
                seller, startDate, endDate);
        
        return orders.stream()
                .collect(Collectors.groupingBy(Order::getStatus, Collectors.counting()));
    }

    /**
     * Get purchase history for a buyer
     * @param buyer the buyer user
     * @param startDate the start date
     * @param endDate the end date
     * @return a map of dates to purchase amounts
     */
    public Map<LocalDate, BigDecimal> getBuyerPurchasesOverTime(User buyer, Date startDate, Date endDate) {
        List<Order> orders = orderRepository.findByBuyerAndOrderDateBetweenOrderByOrderDate(
                buyer, startDate, endDate);
        
        Map<LocalDate, BigDecimal> purchasesByDate = new TreeMap<>();
        
        // Initialize all dates in the range with zero purchases
        LocalDate start = startDate.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        LocalDate end = endDate.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            purchasesByDate.put(date, BigDecimal.ZERO);
        }
        
        // Fill in actual purchase data
        for (Order order : orders) {
            LocalDate orderDate = order.getOrderDate().toInstant()
                    .atZone(ZoneId.systemDefault()).toLocalDate();
            
            purchasesByDate.put(orderDate, purchasesByDate.getOrDefault(orderDate, BigDecimal.ZERO)
                    .add(order.getTotalAmount()));
        }
        
        return purchasesByDate;
    }

    /**
     * Get purchases by category for a buyer
     * @param buyer the buyer user
     * @param startDate the start date
     * @param endDate the end date
     * @return a map of categories to purchase amounts
     */
    public Map<String, BigDecimal> getBuyerPurchasesByCategory(User buyer, Date startDate, Date endDate) {
        List<Order> orders = orderRepository.findByBuyerAndOrderDateBetweenOrderByOrderDate(
                buyer, startDate, endDate);
        
        Map<String, BigDecimal> purchasesByCategory = new HashMap<>();
        
        for (Order order : orders) {
            order.getOrderItems().forEach(item -> {
                String category = item.getProduct().getCategory();
                BigDecimal itemTotal = item.getUnitPrice().multiply(new BigDecimal(item.getQuantity()));
                
                purchasesByCategory.put(category, 
                        purchasesByCategory.getOrDefault(category, BigDecimal.ZERO).add(itemTotal));
            });
        }
        
        return purchasesByCategory;
    }

    /**
     * Get frequently purchased products for a buyer
     * @param buyer the buyer user
     * @param limit the maximum number of products to return
     * @return a list of products with their purchase data
     */
    public List<Map<String, Object>> getFrequentlyPurchasedProducts(User buyer, int limit) {
        List<Order> orders = orderRepository.findByBuyer(buyer);
        
        // Aggregate purchases by product
        Map<Long, Integer> quantityPurchased = new HashMap<>();
        Map<Long, Integer> orderCount = new HashMap<>();
        Map<Long, Product> products = new HashMap<>();
        
        for (Order order : orders) {
            Set<Long> productsInThisOrder = new HashSet<>();
            
            order.getOrderItems().forEach(item -> {
                Long productId = item.getProduct().getId();
                int quantity = item.getQuantity();
                
                quantityPurchased.put(productId, quantityPurchased.getOrDefault(productId, 0) + quantity);
                productsInThisOrder.add(productId);
                products.put(productId, item.getProduct());
            });
            
            // Count number of orders for each product
            for (Long productId : productsInThisOrder) {
                orderCount.put(productId, orderCount.getOrDefault(productId, 0) + 1);
            }
        }
        
        // Convert to list of maps for easy access in templates
        List<Map<String, Object>> result = new ArrayList<>();
        for (Long productId : orderCount.keySet()) {
            Map<String, Object> productData = new HashMap<>();
            productData.put("product", products.get(productId));
            productData.put("orderCount", orderCount.get(productId));
            productData.put("quantityPurchased", quantityPurchased.get(productId));
            result.add(productData);
        }
        
        // Sort by order count (descending) and limit results
        result.sort((a, b) -> ((Integer)b.get("orderCount")).compareTo((Integer)a.get("orderCount")));
        
        if (result.size() > limit) {
            result = result.subList(0, limit);
        }
        
        return result;
    }

    /**
     * Get system-wide analytics for admin
     * @return a map of analytics data
     */
    public Map<String, Object> getAdminAnalytics() {
        Map<String, Object> analytics = new HashMap<>();
        
        // Total users by role
        long farmerCount = 0;
        long fishermanCount = 0;
        long wholesalerCount = 0;
        
        // Total products by category
        Map<String, Long> productsByCategory = productRepository.findAll().stream()
                .collect(Collectors.groupingBy(Product::getCategory, Collectors.counting()));
        
        // Total orders by status
        Map<Order.OrderStatus, Long> ordersByStatus = orderRepository.findAll().stream()
                .collect(Collectors.groupingBy(Order::getStatus, Collectors.counting()));
        
        // Total sales (all time)
        BigDecimal totalSales = orderRepository.findAll().stream()
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        analytics.put("farmerCount", farmerCount);
        analytics.put("fishermanCount", fishermanCount);
        analytics.put("wholesalerCount", wholesalerCount);
        analytics.put("productsByCategory", productsByCategory);
        analytics.put("ordersByStatus", ordersByStatus);
        analytics.put("totalSales", totalSales);
        
        return analytics;
    }
}