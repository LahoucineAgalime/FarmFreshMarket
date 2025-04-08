import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Package, Receipt, ShoppingBag } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function CheckoutSuccessPage() {
  const [orderId, setOrderId] = useState<string | null>(null);
  const [location] = useLocation();

  useEffect(() => {
    // Extract orderId from URL params
    const params = new URLSearchParams(location.split('?')[1]);
    const id = params.get('orderId');
    if (id) {
      setOrderId(id);
    }
  }, [location]);

  // Fetch order details
  const { data: order, isLoading, error } = useQuery({
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
        <p className="mt-4 text-lg text-muted-foreground">Loading order information...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="text-destructive">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-16 h-16">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="mt-4 text-2xl font-bold">Order Not Found</h1>
        <p className="mt-2 text-muted-foreground">We couldn't find the order information</p>
        <Button className="mt-6" asChild>
          <Link href="/orders">View Your Orders</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-10">
      <div className="flex flex-col items-center mb-8 text-center">
        <CheckCircle className="w-16 h-16 text-primary mb-4" />
        <h1 className="text-3xl font-bold">Payment Successful!</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Thank you for your purchase. Your order has been successfully placed and is being processed.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Order Number</p>
                    <p className="font-medium">{order.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{new Date(order.orderDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Status</p>
                    <div className="flex items-center">
                      <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                      <p className="font-medium capitalize">{order.paymentStatus}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Order Status</p>
                    <p className="font-medium capitalize">{order.status}</p>
                  </div>
                </div>

                <Separator />
                
                <div>
                  <h3 className="font-medium mb-3">Order Items</h3>
                  <div className="space-y-4">
                    {order.items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded bg-secondary flex items-center justify-center mr-3">
                            <Package className="h-5 w-5 text-secondary-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">Item: {item.productId}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.quantity} × ${parseFloat(item.unitPrice).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <p className="font-medium">${parseFloat(item.subtotal).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />
                
                <div>
                  <h3 className="font-medium mb-3">Delivery Information</h3>
                  <p>{order.deliveryAddress}</p>
                </div>

                <Separator />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount</span>
                  <span>${parseFloat(order.totalAmount).toFixed(2)}</span>
                </div>
                
                {order.paymentReceiptUrl && (
                  <div className="flex justify-center mt-4">
                    <Button asChild variant="outline">
                      <a href={order.paymentReceiptUrl} target="_blank" rel="noopener noreferrer">
                        <Receipt className="mr-2 h-4 w-4" />
                        View Receipt
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex">
                  <div className="mr-4 mt-0.5">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium">Order Confirmation</h3>
                    <p className="text-sm text-muted-foreground">
                      Your order has been confirmed and is being prepared
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="mr-4 mt-0.5">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium">Order Processing</h3>
                    <p className="text-sm text-muted-foreground">
                      The seller will be notified and will process your order
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="mr-4 mt-0.5">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <ShoppingBag className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium">Delivery</h3>
                    <p className="text-sm text-muted-foreground">
                      Your order will be delivered to the provided address
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex flex-col gap-2">
                  <Button asChild>
                    <Link href="/orders">
                      View Your Orders
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/">
                      Continue Shopping
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}