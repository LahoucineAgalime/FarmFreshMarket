package com.harvestdirect.app.controller;

import com.harvestdirect.app.model.Product;
import com.harvestdirect.app.model.User;
import com.harvestdirect.app.service.ProductService;
import com.harvestdirect.app.service.UserService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/products")
public class ProductController {

    private final ProductService productService;
    private final UserService userService;

    public ProductController(ProductService productService, UserService userService) {
        this.productService = productService;
        this.userService = userService;
    }

    @GetMapping("/{id}")
    public String viewProduct(@PathVariable Long id, Model model) {
        Product product = productService.getProductById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        model.addAttribute("product", product);
        return "products/view";
    }

    @GetMapping("/add")
    @PreAuthorize("hasAnyRole('FARMER', 'FISHERMAN')")
    public String addProductForm(Model model) {
        model.addAttribute("product", new Product());
        return "products/form";
    }

    @PostMapping("/add")
    @PreAuthorize("hasAnyRole('FARMER', 'FISHERMAN')")
    public String addProduct(
            @Valid @ModelAttribute Product product,
            BindingResult result,
            Authentication authentication,
            RedirectAttributes redirectAttributes) {
        
        if (result.hasErrors()) {
            return "products/form";
        }

        String username = authentication.getName();
        User seller = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        product.setSeller(seller);
        productService.createProduct(product);

        redirectAttributes.addFlashAttribute("success", "Product added successfully");
        return "redirect:/dashboard";
    }

    @GetMapping("/edit/{id}")
    @PreAuthorize("hasAnyRole('FARMER', 'FISHERMAN')")
    public String editProductForm(@PathVariable Long id, Model model, Authentication authentication) {
        Product product = productService.getProductById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        String username = authentication.getName();
        User seller = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if the user is the owner of the product
        if (!product.getSeller().getId().equals(seller.getId())) {
            throw new RuntimeException("You are not authorized to edit this product");
        }

        model.addAttribute("product", product);
        return "products/form";
    }

    @PostMapping("/edit/{id}")
    @PreAuthorize("hasAnyRole('FARMER', 'FISHERMAN')")
    public String updateProduct(
            @PathVariable Long id,
            @Valid @ModelAttribute Product product,
            BindingResult result,
            Authentication authentication,
            RedirectAttributes redirectAttributes) {
        
        if (result.hasErrors()) {
            return "products/form";
        }

        Product existingProduct = productService.getProductById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        String username = authentication.getName();
        User seller = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if the user is the owner of the product
        if (!existingProduct.getSeller().getId().equals(seller.getId())) {
            throw new RuntimeException("You are not authorized to edit this product");
        }

        // Update only editable fields
        existingProduct.setName(product.getName());
        existingProduct.setDescription(product.getDescription());
        existingProduct.setPrice(product.getPrice());
        existingProduct.setQuantity(product.getQuantity());
        existingProduct.setCategory(product.getCategory());
        existingProduct.setUnit(product.getUnit());
        existingProduct.setImageUrl(product.getImageUrl());
        existingProduct.setIsAvailable(product.getIsAvailable());

        productService.updateProduct(existingProduct);

        redirectAttributes.addFlashAttribute("success", "Product updated successfully");
        return "redirect:/dashboard";
    }

    @PostMapping("/delete/{id}")
    @PreAuthorize("hasAnyRole('FARMER', 'FISHERMAN')")
    public String deleteProduct(
            @PathVariable Long id,
            Authentication authentication,
            RedirectAttributes redirectAttributes) {
        
        Product product = productService.getProductById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        String username = authentication.getName();
        User seller = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if the user is the owner of the product
        if (!product.getSeller().getId().equals(seller.getId())) {
            throw new RuntimeException("You are not authorized to delete this product");
        }

        productService.deleteProduct(id);

        redirectAttributes.addFlashAttribute("success", "Product deleted successfully");
        return "redirect:/dashboard";
    }
}