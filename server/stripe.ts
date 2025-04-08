import Stripe from 'stripe';
import { Order, User } from '@shared/schema';

// Initialize Stripe with the API key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export interface StripeService {
  // Customer management
  createCustomer(user: User): Promise<string>;
  getCustomer(customerId: string): Promise<Stripe.Customer | null>;
  
  // Payment intents
  createPaymentIntent(amount: number, customerId?: string, metadata?: Record<string, string>): Promise<Stripe.PaymentIntent>;
  retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent>;
  
  // Payment methods
  listPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]>;
  attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<Stripe.PaymentMethod>;
  detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod>;
  
  // Checkout sessions
  createCheckoutSession(order: Order, successUrl: string, cancelUrl: string): Promise<string>;
}

export class StripePaymentService implements StripeService {
  // Customer management
  async createCustomer(user: User): Promise<string> {
    try {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        phone: user.phone,
        address: user.address ? {
          line1: user.address,
        } : undefined,
        metadata: {
          userId: user.id.toString(),
          role: user.role
        }
      });
      
      return customer.id;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw new Error('Failed to create Stripe customer');
    }
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer | null> {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      // Check if the customer is deleted
      if (customer.deleted) {
        return null;
      }
      return customer as Stripe.Customer;
    } catch (error) {
      console.error('Error retrieving Stripe customer:', error);
      return null;
    }
  }

  // Payment intents
  async createPaymentIntent(
    amount: number, 
    customerId?: string, 
    metadata?: Record<string, string>
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        metadata,
        automatic_payment_methods: {
          enabled: true,
        }
      };

      // Add customer ID if provided
      if (customerId) {
        paymentIntentParams.customer = customerId;
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      console.error('Error retrieving payment intent:', error);
      throw new Error('Failed to retrieve payment intent');
    }
  }

  // Payment methods
  async listPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });
      return paymentMethods.data;
    } catch (error) {
      console.error('Error listing payment methods:', error);
      throw new Error('Failed to list payment methods');
    }
  }

  async attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<Stripe.PaymentMethod> {
    try {
      return await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
    } catch (error) {
      console.error('Error attaching payment method:', error);
      throw new Error('Failed to attach payment method');
    }
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      return await stripe.paymentMethods.detach(paymentMethodId);
    } catch (error) {
      console.error('Error detaching payment method:', error);
      throw new Error('Failed to detach payment method');
    }
  }

  // Checkout sessions
  async createCheckoutSession(order: Order, successUrl: string, cancelUrl: string): Promise<string> {
    try {
      // Get order items
      const orderItems = await fetch(`/api/orders/${order.id}/items`).then(res => res.json());
      
      const lineItems = orderItems.map((item: any) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.product.name,
            description: item.product.description,
            metadata: {
              productId: item.productId,
            },
          },
          unit_amount: Math.round(parseFloat(item.unitPrice) * 100), // Convert to cents
        },
        quantity: item.quantity,
      }));

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        metadata: {
          orderId: order.id.toString(),
          buyerId: order.buyerId.toString(),
          sellerId: order.sellerId.toString(),
        },
      });

      return session.url || '';
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  // Webhooks
  constructEventFromPayload(payload: string, signature: string, webhookSecret: string): Stripe.Event {
    try {
      return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      console.error('Error constructing webhook event:', error);
      throw new Error('Failed to construct webhook event');
    }
  }
}

// Export a singleton instance of the stripe service
export const stripeService = new StripePaymentService();