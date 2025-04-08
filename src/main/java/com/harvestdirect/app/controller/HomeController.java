package com.harvestdirect.app.controller;

import com.harvestdirect.app.model.Product;
import com.harvestdirect.app.service.ProductService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@Controller
public class HomeController {

    private final ProductService productService;

    public HomeController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping("/")
    public String homePage(Model model) {
        List<Product> featuredProducts = productService.getAvailableProducts();
        model.addAttribute("products", featuredProducts);
        return "home";
    }

    @GetMapping("/products")
    public String productsPage(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            Model model) {
        
        List<Product> products;
        
        if (category != null && !category.isEmpty()) {
            products = productService.getProductsByCategory(category);
            model.addAttribute("categoryFilter", category);
        } else if (search != null && !search.isEmpty()) {
            products = productService.searchProducts(search);
            model.addAttribute("searchQuery", search);
        } else {
            products = productService.getAvailableProducts();
        }
        
        model.addAttribute("products", products);
        return "products";
    }
}