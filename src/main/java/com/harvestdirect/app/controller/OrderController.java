package com.harvestdirect.app.controller;

import com.harvestdirect.app.model.CartItem;
import com.harvestdirect.app.model.Order;
import com.harvestdirect.app.model.User;
import com.harvestdirect.app.service.CartService;
import com.harvestdirect.app.service.OrderService;
import com.harvestdirect.app.service.UserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;

@Controller
@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;
    private final CartService cartService;
    private final UserService userService;

    public OrderController(
            OrderService orderService,
            CartService cartService,
            UserService userService) {
        this.orderService = orderService;
        this.cartService = cartService;
        this.userService = userService;
    }

    @GetMapping
    public String viewOrders(Authentication authentication, Model model) {
        String username = authentication.getName();
        User user = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Order> orders;
        if (user.getRole() == User.UserRole.WHOLESALER) {
            orders = orderService.getOrdersByBuyer(user);
        } else {
            orders = orderService.getOrdersBySeller(user);
        }

        model.addAttribute("orders", orders);
        model.addAttribute("user", user);
        
        return "orders/list";
    }

    @GetMapping("/{id}")
    public String viewOrder(@PathVariable Long id, Authentication authentication, Model model) {
        String username = authentication.getName();
        User user = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Order order = orderService.getOrderById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Verify the user has access to this order
        if (!order.getBuyer().getId().equals(user.getId()) && !order.getSeller().getId().equals(user.getId())) {
            throw new RuntimeException("You do not have access to this order");
        }

        model.addAttribute("order", order);
        model.addAttribute("orderItems", orderService.getOrderItems(order));
        model.addAttribute("user", user);
        
        return "orders/view";
    }

    @GetMapping("/checkout")
    @PreAuthorize("hasRole('WHOLESALER')")
    public String checkoutPage(Authentication authentication, Model model) {
        String username = authentication.getName();
        User user = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<CartItem> cartItems = cartService.getCartItems(user);
        
        if (cartItems.isEmpty()) {
            return "redirect:/cart";
        }
        
        model.addAttribute("cartItems", cartItems);
        model.addAttribute("user", user);
        
        return "orders/checkout";
    }

    @PostMapping("/place")
    @PreAuthorize("hasRole('WHOLESALER')")
    public String placeOrder(
            @RequestParam String deliveryAddress,
            Authentication authentication,
            RedirectAttributes redirectAttributes) {
        
        String username = authentication.getName();
        User user = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        try {
            List<Order> orders = orderService.createOrdersFromCart(user, deliveryAddress);
            redirectAttributes.addFlashAttribute("success", 
                    "Your order" + (orders.size() > 1 ? "s have" : " has") + " been placed successfully");
            return "redirect:/orders";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
            return "redirect:/cart";
        }
    }

    @PostMapping("/{id}/update-status")
    public String updateOrderStatus(
            @PathVariable Long id,
            @RequestParam Order.OrderStatus status,
            Authentication authentication,
            RedirectAttributes redirectAttributes) {
        
        String username = authentication.getName();
        User user = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Order order = orderService.getOrderById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Verify the user has access to update this order
        boolean isWholesaler = user.getRole() == User.UserRole.WHOLESALER;
        
        if (isWholesaler && !order.getBuyer().getId().equals(user.getId())) {
            throw new RuntimeException("You are not authorized to update this order");
        }
        
        boolean isSeller = user.getRole() == User.UserRole.FARMER || user.getRole() == User.UserRole.FISHERMAN;
        
        if (isSeller && !order.getSeller().getId().equals(user.getId())) {
            throw new RuntimeException("You are not authorized to update this order");
        }

        // Wholesalers can only cancel orders
        if (isWholesaler && status != Order.OrderStatus.CANCELLED) {
            throw new RuntimeException("Wholesalers can only cancel orders");
        }

        orderService.updateOrderStatus(id, status);
        redirectAttributes.addFlashAttribute("success", "Order status updated successfully");
        
        return "redirect:/orders/" + id;
    }
}