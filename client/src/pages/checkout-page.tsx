import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

// Stripe imports
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Make sure to call loadStripe outside of a component's render to avoid recreating
// the Stripe object on every render.
// This is your test publishable API key.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

export default function CheckoutPage() {
  const [orderId, setOrderId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [location] = useLocation();

  useEffect(() => {
    // Extract orderId from URL params
    const params = new URLSearchParams(location.split('?')[1]);
    const id = params.get('orderId');
    if (id) {
      setOrderId(id);
      // Create payment intent
      createPaymentIntent(id);
    } else {
      setError('Order ID is missing');
      setIsLoading(false);
    }
  }, [location]);

  const createPaymentIntent = async (id: string) => {
    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId: id }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent');
      }
      
      setClientSecret(data.clientSecret);
    } catch (err: any) {
      setError(err.message || 'Failed to create payment intent');
      toast({
        title: 'Error',
        description: err.message || 'Failed to create payment intent',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch order details
  const { data: order } = useQuery({
    queryKey: ['/api/orders', orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const res = await apiRequest('GET', `/api/orders/${orderId}`);
      return await res.json();
    },
    enabled: !!orderId,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Preparing your checkout...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <XCircle className="w-16 h-16 text-destructive" />
        <h1 className="mt-4 text-2xl font-bold">Checkout Failed</h1>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <Button className="mt-6" asChild>
          <Link href="/orders">Return to Orders</Link>
        </Button>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Setting up secure payment...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-10">
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-3xl font-bold">Complete Your Purchase</h1>
        <p className="text-muted-foreground mt-2">Secure payment powered by Stripe</p>
      </div>

      {order && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm orderId={orderId!} />
            </Elements>
          </div>
          
          <div className="md:col-span-1">
            <OrderSummary order={order} />
          </div>
        </div>
      )}
    </div>
  );
}

function CheckoutForm({ orderId }: { orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?orderId=${orderId}`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setMessage(error.message || 'Something went wrong with your payment');
      toast({
        title: 'Payment Failed',
        description: error.message || 'Something went wrong with your payment',
        variant: 'destructive',
      });
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Payment succeeded, notify server
      try {
        await apiRequest('POST', '/api/stripe/payment-successful', {
          paymentIntentId: paymentIntent.id,
          orderId,
        });
        toast({
          title: 'Payment Successful',
          description: 'Your order has been placed successfully',
        });
        setLocation('/checkout/success?orderId=' + orderId);
      } catch (err: any) {
        setMessage(err.message || 'Payment received but order processing failed');
        toast({
          title: 'Error',
          description: err.message || 'Payment received but order processing failed',
          variant: 'destructive',
        });
      }
    }

    setIsProcessing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
        <CardDescription>Enter your card details to complete your purchase</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="payment-form" onSubmit={handleSubmit}>
          <PaymentElement id="payment-element" />
          
          {message && (
            <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md">
              {message}
            </div>
          )}
          
          <Button 
            disabled={isProcessing || !stripe || !elements} 
            type="submit"
            className="w-full mt-6"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Pay Now'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function OrderSummary({ order }: { order: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Order #{order.id}</h3>
            <p className="text-sm text-muted-foreground">
              {new Date(order.orderDate).toLocaleDateString()}
            </p>
          </div>

          <Separator />
          
          <div className="space-y-2">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between">
                <div>
                  <p className="font-medium">{item.quantity} x Item</p>
                  <p className="text-sm text-muted-foreground">
                    ${parseFloat(item.unitPrice).toFixed(2)} per {item.unit || 'unit'}
                  </p>
                </div>
                <p className="font-medium">${parseFloat(item.subtotal).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <Separator />
          
          <div className="flex justify-between font-medium">
            <p>Delivery Address</p>
            <p>{order.deliveryAddress}</p>
          </div>
          
          <Separator />

          <div className="flex justify-between items-center">
            <p className="text-lg font-bold">Total</p>
            <p className="text-lg font-bold">${parseFloat(order.totalAmount).toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}