package com.harvestdirect.app.controller;

import com.harvestdirect.app.model.User;
import com.harvestdirect.app.service.AnalyticsService;
import com.harvestdirect.app.service.UserService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.Map;

@Controller
@RequestMapping("/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final UserService userService;

    public AnalyticsController(AnalyticsService analyticsService, UserService userService) {
        this.analyticsService = analyticsService;
        this.userService = userService;
    }

    @GetMapping
    public String getAnalyticsDashboard(
            Authentication authentication,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Model model) {
        
        String username = authentication.getName();
        User user = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Set default date range if not provided
        if (startDate == null) {
            startDate = LocalDate.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }
        
        // Convert LocalDate to Date for service methods
        Date start = Date.from(startDate.atStartOfDay(ZoneId.systemDefault()).toInstant());
        Date end = Date.from(endDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant());
        
        model.addAttribute("user", user);
        model.addAttribute("startDate", startDate);
        model.addAttribute("endDate", endDate);
        
        // Different analytics based on user role
        if (user.getRole() == User.UserRole.FARMER || user.getRole() == User.UserRole.FISHERMAN) {
            // Seller analytics
            Map<LocalDate, BigDecimal> salesOverTime = analyticsService.getSellerSalesOverTime(user, start, end);
            BigDecimal totalSales = analyticsService.getSellerTotalSales(user, start, end);
            Map<String, BigDecimal> salesByCategory = analyticsService.getSellerSalesByCategory(user, start, end);
            Map<String, Object> topProducts = Map.of("products", analyticsService.getTopSellingProducts(user, start, end, 5));
            Map<String, Object> orderStatusData = Map.of("statusCounts", analyticsService.getOrderCountByStatus(user, start, end));
            
            model.addAttribute("salesOverTime", salesOverTime);
            model.addAttribute("totalSales", totalSales);
            model.addAttribute("salesByCategory", salesByCategory);
            model.addAttribute("topProducts", topProducts);
            model.addAttribute("orderStatusData", orderStatusData);
            
            return "analytics/seller";
        }
        else if (user.getRole() == User.UserRole.WHOLESALER) {
            // Buyer analytics
            Map<LocalDate, BigDecimal> purchasesOverTime = analyticsService.getBuyerPurchasesOverTime(user, start, end);
            Map<String, BigDecimal> purchasesByCategory = analyticsService.getBuyerPurchasesByCategory(user, start, end);
            Map<String, Object> frequentProducts = Map.of("products", analyticsService.getFrequentlyPurchasedProducts(user, 5));
            
            model.addAttribute("purchasesOverTime", purchasesOverTime);
            model.addAttribute("purchasesByCategory", purchasesByCategory);
            model.addAttribute("frequentProducts", frequentProducts);
            
            return "analytics/buyer";
        }
        else if (user.getRole() == User.UserRole.ADMIN) {
            // Admin analytics
            model.addAttribute("adminAnalytics", analyticsService.getAdminAnalytics());
            return "analytics/admin";
        }
        
        return "redirect:/dashboard";
    }
    
    @GetMapping("/export")
    @PreAuthorize("isAuthenticated()")
    public String exportAnalyticsData(
            Authentication authentication,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false, defaultValue = "csv") String format,
            Model model) {
        
        String username = authentication.getName();
        User user = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Set default date range if not provided
        if (startDate == null) {
            startDate = LocalDate.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }
        
        model.addAttribute("user", user);
        model.addAttribute("startDate", startDate);
        model.addAttribute("endDate", endDate);
        model.addAttribute("format", format);
        
        return "analytics/export";
    }
}