package com.harvestdirect.app.controller;

import com.harvestdirect.app.model.User;
import com.harvestdirect.app.service.AnalyticsExportService;
import com.harvestdirect.app.service.UserService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.io.IOException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.Date;
import java.util.List;

@Controller
@RequestMapping("/analytics/export")
public class AnalyticsExportController {

    private final AnalyticsExportService analyticsExportService;
    private final UserService userService;

    public AnalyticsExportController(AnalyticsExportService analyticsExportService, UserService userService) {
        this.analyticsExportService = analyticsExportService;
        this.userService = userService;
    }

    @GetMapping("/download")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> downloadAnalyticsData(
            Authentication authentication,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false, defaultValue = "csv") String format,
            @RequestParam(required = false, defaultValue = "overview,sales,products,orders,purchases") List<String> sections) throws IOException {
        
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
        
        // Prepare the response headers
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(getContentType(format));
        headers.setContentDispositionFormData("attachment", getFilename(user, format));
        
        // Generate the export data based on user role
        byte[] data;
        if (user.getRole() == User.UserRole.FARMER || user.getRole() == User.UserRole.FISHERMAN) {
            data = analyticsExportService.exportSellerAnalyticsCSV(user, start, end, sections);
        } else if (user.getRole() == User.UserRole.WHOLESALER) {
            data = analyticsExportService.exportBuyerAnalyticsCSV(user, start, end, sections);
        } else if (user.getRole() == User.UserRole.ADMIN) {
            data = analyticsExportService.exportAdminAnalyticsCSV(sections);
        } else {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        
        return new ResponseEntity<>(data, headers, HttpStatus.OK);
    }
    
    private MediaType getContentType(String format) {
        return switch (format.toLowerCase()) {
            case "xlsx" -> MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            case "pdf" -> MediaType.APPLICATION_PDF;
            case "json" -> MediaType.APPLICATION_JSON;
            default -> MediaType.TEXT_PLAIN;
        };
    }
    
    private String getFilename(User user, String format) {
        String userType = switch (user.getRole()) {
            case FARMER, FISHERMAN -> "seller";
            case WHOLESALER -> "buyer";
            case ADMIN -> "admin";
            default -> "user";
        };
        
        String timestamp = LocalDate.now().toString();
        return "harvestdirect_" + userType + "_analytics_" + timestamp + "." + format.toLowerCase();
    }
}