import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertProductSchema, insertCartItemSchema, insertOrderSchema, insertOrderItemSchema } from "@shared/schema";
import { z } from "zod";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { stripeService } from "./stripe";

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

  // Stripe Payment Routes
  app.post("/api/stripe/create-customer", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      // Check if user already has a Stripe customer ID
      if (req.user!.stripeCustomerId) {
        return res.status(400).json({ error: "User already has a Stripe customer" });
      }

      // Create Stripe customer
      const stripeCustomerId = await stripeService.createCustomer(req.user!);
      
      // Update user with Stripe customer ID
      const updatedUser = await storage.updateStripeCustomerId(req.user!.id, stripeCustomerId);
      
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to update user with Stripe customer ID" });
      }
      
      // Return updated user (without password)
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating Stripe customer:", error);
      res.status(500).json({ error: "Failed to create Stripe customer" });
    }
  });

  app.post("/api/stripe/create-payment-intent", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { orderId } = req.body;
      
      if (!orderId) {
        return res.status(400).json({ error: "Order ID is required" });
      }
      
      const order = await storage.getOrder(parseInt(orderId));
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Ensure user is the buyer
      if (order.buyerId !== req.user!.id) {
        return res.status(403).json({ error: "You can only pay for your own orders" });
      }
      
      // Check if order is already paid
      if (order.paymentStatus === "paid") {
        return res.status(400).json({ error: "Order is already paid" });
      }
      
      // Create or retrieve Stripe customer
      let customerId = req.user!.stripeCustomerId;
      if (!customerId) {
        customerId = await stripeService.createCustomer(req.user!);
        await storage.updateStripeCustomerId(req.user!.id, customerId);
      }
      
      // Create a payment intent
      const paymentIntent = await stripeService.createPaymentIntent(
        parseFloat(order.totalAmount.toString()),
        customerId,
        { orderId: order.id.toString() }
      );
      
      // Update order with payment intent ID
      await storage.updateOrderPaymentInfo(order.id, { 
        paymentIntentId: paymentIntent.id 
      });
      
      // Return the client secret
      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });

  app.post("/api/stripe/payment-successful", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { paymentIntentId, paymentMethodId } = req.body;
      
      if (!paymentIntentId) {
        return res.status(400).json({ error: "Payment intent ID is required" });
      }
      
      // Get payment intent
      const paymentIntent = await stripeService.retrievePaymentIntent(paymentIntentId);
      
      // Check that payment intent is succeeded
      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({ error: "Payment not successful" });
      }
      
      // Get order ID from metadata
      const orderId = paymentIntent.metadata?.orderId;
      if (!orderId) {
        return res.status(500).json({ error: "Order ID not found in payment intent metadata" });
      }
      
      // Get order
      const order = await storage.getOrder(parseInt(orderId));
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Ensure user is the buyer
      if (order.buyerId !== req.user!.id) {
        return res.status(403).json({ error: "You can only handle payments for your own orders" });
      }
      
      // Update order payment status
      const updatedOrder = await storage.updateOrderPaymentInfo(order.id, {
        paymentStatus: "paid",
        paymentMethodId: paymentMethodId,
        paymentReceiptUrl: paymentIntent.charges.data[0]?.receipt_url || null
      });
      
      // Update order status if it's still pending
      if (order.status === "pending") {
        await storage.updateOrderStatus(order.id, "processing");
      }
      
      res.json({ success: true, order: updatedOrder });
    } catch (error) {
      console.error("Error handling successful payment:", error);
      res.status(500).json({ error: "Failed to process successful payment" });
    }
  });

  app.get("/api/stripe/payment-methods", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const customerId = req.user!.stripeCustomerId;
      
      if (!customerId) {
        return res.json([]);
      }
      
      const paymentMethods = await stripeService.listPaymentMethods(customerId);
      res.json(paymentMethods);
    } catch (error) {
      console.error("Error listing payment methods:", error);
      res.status(500).json({ error: "Failed to list payment methods" });
    }
  });

  app.post("/api/stripe/attach-payment-method", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { paymentMethodId } = req.body;
      
      if (!paymentMethodId) {
        return res.status(400).json({ error: "Payment method ID is required" });
      }
      
      // Get or create customer
      let customerId = req.user!.stripeCustomerId;
      if (!customerId) {
        customerId = await stripeService.createCustomer(req.user!);
        await storage.updateStripeCustomerId(req.user!.id, customerId);
      }
      
      const paymentMethod = await stripeService.attachPaymentMethod(paymentMethodId, customerId);
      res.json(paymentMethod);
    } catch (error) {
      console.error("Error attaching payment method:", error);
      res.status(500).json({ error: "Failed to attach payment method" });
    }
  });

  app.post("/api/stripe/detach-payment-method", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { paymentMethodId } = req.body;
      
      if (!paymentMethodId) {
        return res.status(400).json({ error: "Payment method ID is required" });
      }
      
      const paymentMethod = await stripeService.detachPaymentMethod(paymentMethodId);
      res.json(paymentMethod);
    } catch (error) {
      console.error("Error detaching payment method:", error);
      res.status(500).json({ error: "Failed to detach payment method" });
    }
  });

  // Set up Stripe webhook to receive events
  app.post("/api/stripe/webhook", async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    if (!process.env.STRIPE_WEBHOOK_SECRET || !sig) {
      return res.status(400).json({ error: "Stripe webhook signature or secret missing" });
    }
    
    try {
      const event = stripeService.constructEventFromPayload(
        req.body.toString(),
        sig as string,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      
      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as any;
          const orderId = paymentIntent.metadata?.orderId;
          
          if (orderId) {
            const order = await storage.getOrder(parseInt(orderId));
            if (order) {
              await storage.updateOrderPaymentInfo(order.id, {
                paymentStatus: "paid",
                paymentReceiptUrl: paymentIntent.charges?.data[0]?.receipt_url
              });
              
              // Update order status if it's still pending
              if (order.status === "pending") {
                await storage.updateOrderStatus(order.id, "processing");
              }
            }
          }
          break;
          
        case 'payment_intent.payment_failed':
          // Handle failed payment
          const failedPayment = event.data.object as any;
          const failedOrderId = failedPayment.metadata?.orderId;
          
          if (failedOrderId) {
            const order = await storage.getOrder(parseInt(failedOrderId));
            if (order) {
              await storage.updateOrderPaymentInfo(order.id, {
                paymentStatus: "failed"
              });
            }
          }
          break;
          
        // ... handle other event types as needed
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
      
      // Return a response to acknowledge receipt of the event
      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).json({ error: "Webhook signature verification failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
