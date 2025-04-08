package com.harvestdirect.app.service;

import com.harvestdirect.app.model.Order;
import com.harvestdirect.app.model.Product;
import com.harvestdirect.app.model.User;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

/**
 * Service for exporting analytics data in various formats
 */
@Service
public class AnalyticsExportService {

    private final AnalyticsService analyticsService;

    public AnalyticsExportService(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    /**
     * Export seller analytics data in CSV format
     * @param seller the seller user
     * @param startDate the start date
     * @param endDate the end date
     * @param sections the sections to include in the export
     * @return the CSV content as a byte array
     */
    public byte[] exportSellerAnalyticsCSV(User seller, Date startDate, Date endDate, List<String> sections) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PrintWriter writer = new PrintWriter(out);
        
        writer.println("HarvestDirect Seller Analytics Report");
        writer.println("Seller: " + seller.getName() + " (" + seller.getUsername() + ")");
        writer.println("Period: " + formatDate(startDate) + " to " + formatDate(endDate));
        writer.println("Generated on: " + formatDate(new Date()));
        writer.println();
        
        // Overview section
        if (sections.contains("overview")) {
            writer.println("Overview");
            writer.println("-------------------------------------------------");
            
            BigDecimal totalSales = analyticsService.getSellerTotalSales(seller, startDate, endDate);
            Map<Order.OrderStatus, Long> orderStatusCounts = analyticsService.getOrderCountByStatus(seller, startDate, endDate);
            long totalOrders = orderStatusCounts.values().stream().mapToLong(Long::longValue).sum();
            long completedOrders = orderStatusCounts.getOrDefault(Order.OrderStatus.DELIVERED, 0L);
            double completionRate = totalOrders > 0 ? (double) completedOrders / totalOrders * 100 : 0;
            
            writer.println("Total Sales,$" + totalSales);
            writer.println("Total Orders," + totalOrders);
            writer.println("Completed Orders," + completedOrders);
            writer.println("Completion Rate," + String.format("%.2f%%", completionRate));
            writer.println();
        }
        
        // Sales data section
        if (sections.contains("sales")) {
            writer.println("Sales Over Time");
            writer.println("-------------------------------------------------");
            writer.println("Date,Sales Amount ($)");
            
            Map<LocalDate, BigDecimal> salesOverTime = analyticsService.getSellerSalesOverTime(seller, startDate, endDate);
            salesOverTime.forEach((date, amount) -> {
                writer.println(date + "," + amount);
            });
            writer.println();
            
            writer.println("Sales by Category");
            writer.println("-------------------------------------------------");
            writer.println("Category,Sales Amount ($)");
            
            Map<String, BigDecimal> salesByCategory = analyticsService.getSellerSalesByCategory(seller, startDate, endDate);
            salesByCategory.forEach((category, amount) -> {
                writer.println(category + "," + amount);
            });
            writer.println();
        }
        
        // Product information section
        if (sections.contains("products")) {
            writer.println("Top Selling Products");
            writer.println("-------------------------------------------------");
            writer.println("Rank,Product ID,Product Name,Category,Quantity Sold,Revenue ($)");
            
            List<Map<String, Object>> topProducts = analyticsService.getTopSellingProducts(seller, startDate, endDate, 10);
            int rank = 1;
            for (Map<String, Object> productData : topProducts) {
                Product product = (Product) productData.get("product");
                int quantitySold = (Integer) productData.get("quantitySold");
                BigDecimal revenue = (BigDecimal) productData.get("revenue");
                
                writer.println(rank + "," + product.getId() + "," + product.getName() + "," + 
                               product.getCategory() + "," + quantitySold + "," + revenue);
                rank++;
            }
            writer.println();
        }
        
        // Order details section
        if (sections.contains("orders")) {
            writer.println("Order Status Breakdown");
            writer.println("-------------------------------------------------");
            writer.println("Status,Count,Percentage");
            
            Map<Order.OrderStatus, Long> orderStatusCounts = analyticsService.getOrderCountByStatus(seller, startDate, endDate);
            long totalOrders = orderStatusCounts.values().stream().mapToLong(Long::longValue).sum();
            
            for (Map.Entry<Order.OrderStatus, Long> entry : orderStatusCounts.entrySet()) {
                String status = entry.getKey().name();
                long count = entry.getValue();
                double percentage = totalOrders > 0 ? (double) count / totalOrders * 100 : 0;
                
                writer.println(status + "," + count + "," + String.format("%.2f%%", percentage));
            }
        }
        
        writer.flush();
        return out.toByteArray();
    }

    /**
     * Export buyer analytics data in CSV format
     * @param buyer the buyer user
     * @param startDate the start date
     * @param endDate the end date
     * @param sections the sections to include in the export
     * @return the CSV content as a byte array
     */
    public byte[] exportBuyerAnalyticsCSV(User buyer, Date startDate, Date endDate, List<String> sections) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PrintWriter writer = new PrintWriter(out);
        
        writer.println("HarvestDirect Buyer Analytics Report");
        writer.println("Buyer: " + buyer.getName() + " (" + buyer.getUsername() + ")");
        writer.println("Period: " + formatDate(startDate) + " to " + formatDate(endDate));
        writer.println("Generated on: " + formatDate(new Date()));
        writer.println();
        
        // Overview section
        if (sections.contains("overview")) {
            writer.println("Overview");
            writer.println("-------------------------------------------------");
            
            Map<LocalDate, BigDecimal> purchasesOverTime = analyticsService.getBuyerPurchasesOverTime(buyer, startDate, endDate);
            BigDecimal totalPurchases = purchasesOverTime.values().stream()
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            long orderCount = purchasesOverTime.size();
            BigDecimal averageOrderValue = orderCount > 0 
                    ? totalPurchases.divide(new BigDecimal(orderCount), 2, BigDecimal.ROUND_HALF_UP)
                    : BigDecimal.ZERO;
            
            writer.println("Total Purchases,$" + totalPurchases);
            writer.println("Number of Orders," + orderCount);
            writer.println("Average Order Value,$" + averageOrderValue);
            writer.println();
        }
        
        // Purchases data section
        if (sections.contains("purchases")) {
            writer.println("Purchases Over Time");
            writer.println("-------------------------------------------------");
            writer.println("Date,Purchase Amount ($)");
            
            Map<LocalDate, BigDecimal> purchasesOverTime = analyticsService.getBuyerPurchasesOverTime(buyer, startDate, endDate);
            purchasesOverTime.forEach((date, amount) -> {
                writer.println(date + "," + amount);
            });
            writer.println();
            
            writer.println("Purchases by Category");
            writer.println("-------------------------------------------------");
            writer.println("Category,Purchase Amount ($)");
            
            Map<String, BigDecimal> purchasesByCategory = analyticsService.getBuyerPurchasesByCategory(buyer, startDate, endDate);
            purchasesByCategory.forEach((category, amount) -> {
                writer.println(category + "," + amount);
            });
            writer.println();
        }
        
        // Product information section
        if (sections.contains("products")) {
            writer.println("Frequently Purchased Products");
            writer.println("-------------------------------------------------");
            writer.println("Rank,Product ID,Product Name,Category,Purchase Frequency,Total Quantity");
            
            List<Map<String, Object>> frequentProducts = analyticsService.getFrequentlyPurchasedProducts(buyer, 10);
            int rank = 1;
            for (Map<String, Object> productData : frequentProducts) {
                Product product = (Product) productData.get("product");
                int orderCount = (Integer) productData.get("orderCount");
                int quantityPurchased = (Integer) productData.get("quantityPurchased");
                
                writer.println(rank + "," + product.getId() + "," + product.getName() + "," + 
                               product.getCategory() + "," + orderCount + "," + quantityPurchased);
                rank++;
            }
        }
        
        writer.flush();
        return out.toByteArray();
    }

    /**
     * Export admin analytics data in CSV format
     * @param sections the sections to include in the export
     * @return the CSV content as a byte array
     */
    public byte[] exportAdminAnalyticsCSV(List<String> sections) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PrintWriter writer = new PrintWriter(out);
        
        writer.println("HarvestDirect System Analytics Report");
        writer.println("Generated on: " + formatDate(new Date()));
        writer.println();
        
        Map<String, Object> adminAnalytics = analyticsService.getAdminAnalytics();
        
        // Overview section
        if (sections.contains("overview")) {
            writer.println("System Overview");
            writer.println("-------------------------------------------------");
            
            writer.println("Total Users," + ((Long)adminAnalytics.get("farmerCount") + 
                                           (Long)adminAnalytics.get("fishermanCount") + 
                                           (Long)adminAnalytics.get("wholesalerCount")));
            writer.println("Farmers," + adminAnalytics.get("farmerCount"));
            writer.println("Fishermen," + adminAnalytics.get("fishermanCount"));
            writer.println("Wholesalers," + adminAnalytics.get("wholesalerCount"));
            writer.println("Total Sales,$" + adminAnalytics.get("totalSales"));
            writer.println();
        }
        
        // Products section
        if (sections.contains("products")) {
            writer.println("Products by Category");
            writer.println("-------------------------------------------------");
            writer.println("Category,Count");
            
            @SuppressWarnings("unchecked")
            Map<String, Long> productsByCategory = (Map<String, Long>) adminAnalytics.get("productsByCategory");
            productsByCategory.forEach((category, count) -> {
                writer.println(category + "," + count);
            });
            writer.println();
        }
        
        // Orders section
        if (sections.contains("orders")) {
            writer.println("Orders by Status");
            writer.println("-------------------------------------------------");
            writer.println("Status,Count");
            
            @SuppressWarnings("unchecked")
            Map<Order.OrderStatus, Long> ordersByStatus = (Map<Order.OrderStatus, Long>) adminAnalytics.get("ordersByStatus");
            ordersByStatus.forEach((status, count) -> {
                writer.println(status + "," + count);
            });
        }
        
        writer.flush();
        return out.toByteArray();
    }
    
    /**
     * Format a date for display
     * @param date the date to format
     * @return the formatted date string
     */
    private String formatDate(Date date) {
        return date.toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDate()
                .toString();
    }
}