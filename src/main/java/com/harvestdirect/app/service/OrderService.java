package com.harvestdirect.app.service;

import com.harvestdirect.app.model.*;
import com.harvestdirect.app.repository.OrderItemRepository;
import com.harvestdirect.app.repository.OrderRepository;
import com.harvestdirect.app.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final CartService cartService;

    public OrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            ProductRepository productRepository,
            CartService cartService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
        this.cartService = cartService;
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public Optional<Order> getOrderById(Long id) {
        return orderRepository.findById(id);
    }

    public List<Order> getOrdersByBuyer(User buyer) {
        return orderRepository.findByBuyerOrderByOrderDateDesc(buyer);
    }

    public List<Order> getOrdersBySeller(User seller) {
        return orderRepository.findBySellerOrderByOrderDateDesc(seller);
    }

    public List<OrderItem> getOrderItems(Order order) {
        return orderItemRepository.findByOrder(order);
    }

    @Transactional
    public List<Order> createOrdersFromCart(User buyer, String deliveryAddress) {
        List<CartItem> cartItems = cartService.getCartItems(buyer);
        
        if (cartItems.isEmpty()) {
            throw new RuntimeException("Cart is empty");
        }
        
        // Group cart items by seller
        Map<User, List<CartItem>> itemsBySeller = cartItems.stream()
                .collect(Collectors.groupingBy(item -> item.getProduct().getSeller()));
        
        List<Order> createdOrders = new ArrayList<>();
        
        // Create an order for each seller
        for (Map.Entry<User, List<CartItem>> entry : itemsBySeller.entrySet()) {
            User seller = entry.getKey();
            List<CartItem> items = entry.getValue();
            
            // Calculate total amount
            BigDecimal totalAmount = items.stream()
                    .map(item -> item.getProduct().getPrice()
                            .multiply(BigDecimal.valueOf(item.getQuantity())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // Create the order
            Order order = new Order();
            order.setBuyer(buyer);
            order.setSeller(seller);
            order.setTotalAmount(totalAmount);
            order.setDeliveryAddress(deliveryAddress);
            order.setPaymentStatus(Order.PaymentStatus.PENDING);
            order.setStatus(Order.OrderStatus.PENDING);
            
            Order savedOrder = orderRepository.save(order);
            
            // Create order items
            for (CartItem item : items) {
                Product product = item.getProduct();
                
                // Check if product is still available and has enough quantity
                if (!product.getIsAvailable()) {
                    throw new RuntimeException("Product " + product.getName() + " is no longer available");
                }
                
                if (product.getQuantity() < item.getQuantity()) {
                    throw new RuntimeException("Not enough quantity available for " + product.getName());
                }
                
                // Create order item
                OrderItem orderItem = new OrderItem();
                orderItem.setOrder(savedOrder);
                orderItem.setProduct(product);
                orderItem.setQuantity(item.getQuantity());
                orderItem.setUnitPrice(product.getPrice());
                orderItem.setSubtotal(product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
                
                orderItemRepository.save(orderItem);
                
                // Update product quantity
                product.setQuantity(product.getQuantity() - item.getQuantity());
                if (product.getQuantity() <= 0) {
                    product.setIsAvailable(false);
                }
                productRepository.save(product);
            }
            
            createdOrders.add(savedOrder);
        }
        
        // Clear the cart after successful order creation
        cartService.clearCart(buyer);
        
        return createdOrders;
    }

    @Transactional
    public Order updateOrderStatus(Long orderId, Order.OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        order.setStatus(newStatus);
        
        // If order is cancelled, return products to inventory
        if (newStatus == Order.OrderStatus.CANCELLED) {
            List<OrderItem> orderItems = orderItemRepository.findByOrder(order);
            
            for (OrderItem item : orderItems) {
                Product product = item.getProduct();
                product.setQuantity(product.getQuantity() + item.getQuantity());
                product.setIsAvailable(true);
                productRepository.save(product);
            }
        }
        
        return orderRepository.save(order);
    }

    @Transactional
    public Order updatePaymentStatus(Long orderId, Order.PaymentStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        order.setPaymentStatus(newStatus);
        return orderRepository.save(order);
    }
}