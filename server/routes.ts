import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertProductSchema, insertCartItemSchema, insertOrderSchema, insertOrderItemSchema } from "@shared/schema";
import { z } from "zod";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Create test users if they don't exist
  // Hash password helper function
  const hashPassword = async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await promisify(scrypt)(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  };

  // Create wholesaler test user
  const testWholesaler = await storage.getUserByUsername("wholesaler");
  if (!testWholesaler) {
    const hashedPassword = await hashPassword("password123");
    
    await storage.createUser({
      username: "wholesaler",
      password: hashedPassword,
      name: "Test Wholesaler",
      email: "wholesaler@example.com",
      role: "wholesaler",
      address: "456 Market St",
      phone: "555-1234"
    });
    
    console.log("Created test wholesaler: wholesaler / password123");
  }
  
  // Create farmer test user
  const testFarmer = await storage.getUserByUsername("farmer");
  if (!testFarmer) {
    const hashedPassword = await hashPassword("password123");
    
    const farmer = await storage.createUser({
      username: "farmer",
      password: hashedPassword,
      name: "Test Farmer",
      email: "farmer@example.com",
      role: "farmer",
      address: "789 Farm Rd",
      phone: "555-5678"
    });
    
    // Add some sample products for the farmer
    await storage.createProduct({
      name: "Organic Apples",
      description: "Fresh organic apples harvested yesterday",
      price: 2.99,
      quantity: 100,
      category: "fruits",
      unit: "kg",
      sellerId: farmer.id,
      imageUrl: "https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
      isAvailable: true
    });
    
    await storage.createProduct({
      name: "Fresh Carrots",
      description: "Locally grown carrots, perfect for salads and cooking",
      price: 1.99,
      quantity: 50,
      category: "vegetables",
      unit: "kg",
      sellerId: farmer.id,
      imageUrl: "https://images.unsplash.com/photo-1590868309235-58c33a8f7d5b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
      isAvailable: true
    });
    
    console.log("Created test farmer: farmer / password123 with sample products");
  }

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to get products" });
    }
  });

  app.get("/api/products/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }
      const products = await storage.searchProducts(query);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to search products" });
    }
  });

  app.get("/api/products/category/:category", async (req, res) => {
    try {
      const category = req.params.category;
      const products = await storage.getProductsByCategory(category);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to get products by category" });
    }
  });

  app.get("/api/products/seller", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const products = await storage.getProductsBySeller(req.user!.id);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to get seller products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to get product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!["farmer", "fisherman"].includes(req.user!.role)) {
      return res.status(403).json({ error: "Only farmers and fishermen can create products" });
    }

    try {
      const productData = insertProductSchema.parse({
        ...req.body,
        sellerId: req.user!.id
      });
      
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      if (product.sellerId !== req.user!.id) {
        return res.status(403).json({ error: "You can only update your own products" });
      }

      const updatedProduct = await storage.updateProduct(id, req.body);
      res.json(updatedProduct);
    } catch (error) {
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      if (product.sellerId !== req.user!.id) {
        return res.status(403).json({ error: "You can only delete your own products" });
      }

      await storage.deleteProduct(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Cart routes
  app.get("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const cartItems = await storage.getCartItemWithProduct(req.user!.id);
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to get cart items" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const cartItemData = insertCartItemSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      // Check product availability
      const product = await storage.getProduct(cartItemData.productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      if (!product.isAvailable) {
        return res.status(400).json({ error: "Product is not available" });
      }
      
      if (product.quantity < cartItemData.quantity) {
        return res.status(400).json({ error: "Not enough quantity available" });
      }

      const cartItem = await storage.addToCart(cartItemData);
      res.status(201).json(cartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to add to cart" });
    }
  });

  app.put("/api/cart/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid cart item ID" });
      }

      const quantity = req.body.quantity;
      if (typeof quantity !== 'number' || quantity <= 0) {
        return res.status(400).json({ error: "Invalid quantity" });
      }

      const updatedItem = await storage.updateCartItem(id, quantity);
      if (!updatedItem) {
        return res.status(404).json({ error: "Cart item not found" });
      }

      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid cart item ID" });
      }

      await storage.removeFromCart(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to remove from cart" });
    }
  });

  app.delete("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      await storage.clearCart(req.user!.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to clear cart" });
    }
  });

  // Order routes
  app.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      let orders;
      if (req.user!.role === 'wholesaler') {
        // Wholesalers see orders they placed
        orders = await storage.getOrdersByBuyer(req.user!.id);
      } else {
        // Farmers/fishermen see orders they received
        orders = await storage.getOrdersBySeller(req.user!.id);
      }
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to get orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid order ID" });
      }

      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Verify the user has access to this order
      if (order.buyerId !== req.user!.id && order.sellerId !== req.user!.id) {
        return res.status(403).json({ error: "You don't have access to this order" });
      }

      const orderItems = await storage.getOrderItems(id);
      res.json({ ...order, items: orderItems });
    } catch (error) {
      res.status(500).json({ error: "Failed to get order" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (req.user!.role !== 'wholesaler') {
      return res.status(403).json({ error: "Only wholesalers can place orders" });
    }

    try {
      // Get the cart items
      const cartItems = await storage.getCartItemWithProduct(req.user!.id);
      if (cartItems.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
      }

      // Group cart items by seller
      const itemsBySeller = cartItems.reduce((acc, item) => {
        const sellerId = item.product.sellerId;
        if (!acc[sellerId]) {
          acc[sellerId] = [];
        }
        acc[sellerId].push(item);
        return acc;
      }, {} as Record<number, (typeof cartItems)[number][]>);

      const orders = [];

      // Create an order for each seller
      for (const [sellerId, items] of Object.entries(itemsBySeller)) {
        const sid = parseInt(sellerId);
        
        // Calculate total amount
        const totalAmount = items.reduce((sum, item) => {
          return sum + parseFloat(item.product.price.toString()) * item.quantity;
        }, 0);

        // Create the order
        const orderData = insertOrderSchema.parse({
          buyerId: req.user!.id,
          sellerId: sid,
          totalAmount,
          deliveryAddress: req.body.deliveryAddress,
          paymentStatus: "pending",
          status: "pending"
        });
        
        const order = await storage.createOrder(orderData);

        // Create order items
        for (const item of items) {
          const orderItemData = insertOrderItemSchema.parse({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.product.price,
            subtotal: parseFloat(item.product.price.toString()) * item.quantity
          });
          
          await storage.createOrderItem(orderItemData);
          
          // Update product quantity
          const product = await storage.getProduct(item.productId);
          if (product) {
            await storage.updateProduct(item.productId, {
              quantity: product.quantity - item.quantity
            });
          }
        }
        
        orders.push(order);
      }

      // Clear the cart after successful order creation
      await storage.clearCart(req.user!.id);

      res.status(201).json(orders);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.put("/api/orders/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid order ID" });
      }

      const { status } = req.body;
      if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Verify the user has access to update this order
      if (req.user!.role === 'wholesaler' && order.buyerId !== req.user!.id) {
        return res.status(403).json({ error: "You don't have access to update this order" });
      }

      if (['farmer', 'fisherman'].includes(req.user!.role) && order.sellerId !== req.user!.id) {
        return res.status(403).json({ error: "You don't have access to update this order" });
      }

      // Buyers can only cancel orders
      if (req.user!.role === 'wholesaler' && status !== 'cancelled') {
        return res.status(403).json({ error: "Wholesalers can only cancel orders" });
      }

      const updatedOrder = await storage.updateOrderStatus(id, status);
      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  // User routes for admin
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const users = await storage.getAllUsers();
      // Don't return passwords
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ error: "Failed to get users" });
    }
  });

  // Create admin account for testing
  app.get("/api/create-admin", async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: "Not available in production" });
    }

    try {
      const admin = await storage.createUser({
        username: "admin",
        password: "adminpassword",
        name: "Admin",
        email: "admin@example.com",
        role: "admin",
        address: "Admin HQ",
        phone: "1234567890"
      });
      res.json({ message: "Admin created", id: admin.id });
    } catch (error) {
      res.status(500).json({ error: "Failed to create admin" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
