package com.harvestdirect.app.controller;

import com.harvestdirect.app.model.Order;
import com.harvestdirect.app.model.Product;
import com.harvestdirect.app.model.User;
import com.harvestdirect.app.service.OrderService;
import com.harvestdirect.app.service.ProductService;
import com.harvestdirect.app.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@Controller
@RequestMapping("/dashboard")
public class DashboardController {

    private final ProductService productService;
    private final OrderService orderService;
    private final UserService userService;

    public DashboardController(
            ProductService productService,
            OrderService orderService,
            UserService userService) {
        this.productService = productService;
        this.orderService = orderService;
        this.userService = userService;
    }

    @GetMapping
    public String dashboard(Authentication authentication, Model model) {
        String username = authentication.getName();
        User user = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        model.addAttribute("user", user);

        if (user.getRole() == User.UserRole.FARMER || user.getRole() == User.UserRole.FISHERMAN) {
            // Seller dashboard
            List<Product> products = productService.getProductsBySeller(user);
            List<Order> recentOrders = orderService.getOrdersBySeller(user);

            model.addAttribute("products", products);
            model.addAttribute("orders", recentOrders);
            return "dashboard/seller";
        } else if (user.getRole() == User.UserRole.WHOLESALER) {
            // Buyer dashboard
            List<Order> recentOrders = orderService.getOrdersByBuyer(user);

            model.addAttribute("orders", recentOrders);
            return "dashboard/buyer";
        } else {
            // Admin dashboard
            List<User> users = userService.getAllUsers();
            List<Product> products = productService.getAllProducts();
            List<Order> orders = orderService.getAllOrders();

            model.addAttribute("users", users);
            model.addAttribute("products", products);
            model.addAttribute("orders", orders);
            return "dashboard/admin";
        }
    }
}