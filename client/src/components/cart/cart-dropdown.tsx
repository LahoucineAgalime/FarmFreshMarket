import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ShoppingCart, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

type CartItemWithProduct = {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  addedAt: Date;
  product: {
    id: number;
    name: string;
    price: number;
    unit: string;
    imageUrl?: string;
  };
};

const checkoutSchema = z.object({
  deliveryAddress: z.string().min(5, "Delivery address is required"),
});

export default function CartDropdown() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Fetch cart items
  const { data: cartItems, isLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart"],
  });

  // Remove from cart mutation
  const removeFromCartMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/cart/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove item from cart",
        variant: "destructive",
      });
    },
  });

  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/cart");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart",
      });
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to clear cart",
        variant: "destructive",
      });
    },
  });

  // Checkout form
  const form = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      deliveryAddress: "",
    },
  });

  // Place order mutation
  const placeOrderMutation = useMutation({
    mutationFn: async (values: z.infer<typeof checkoutSchema>) => {
      await apiRequest("POST", "/api/orders", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order placed",
        description: "Your order has been placed successfully",
      });
      setIsCheckoutOpen(false);
      setIsOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to place order",
        variant: "destructive",
      });
    },
  });

  const onCheckoutSubmit = (values: z.infer<typeof checkoutSchema>) => {
    placeOrderMutation.mutate(values);
  };

  // Calculate total items and amount
  const itemCount = cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const totalAmount = cartItems?.reduce(
    (sum, item) => sum + (parseFloat(item.product.price.toString()) * item.quantity),
    0
  ) || 0;

  const handleRemoveItem = (id: number) => {
    removeFromCartMutation.mutate(id);
  };

  const handleClearCart = () => {
    clearCartMutation.mutate();
  };

  const handleProceedToCheckout = () => {
    setIsOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {itemCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Shopping Cart</h3>
            <Button variant="ghost" size="sm" onClick={handleClearCart} disabled={!cartItems?.length}>
              <Trash2 className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
          
          <Separator className="my-2" />
          
          {isLoading ? (
            <div className="flex justify-center py-4">
              <span className="text-sm text-gray-500">Loading cart...</span>
            </div>
          ) : !cartItems?.length ? (
            <div className="flex justify-center py-4">
              <span className="text-sm text-gray-500">Your cart is empty</span>
            </div>
          ) : (
            <div className="max-h-[300px] overflow-auto py-2">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                      {item.product.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="h-full w-full object-cover object-center"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-100">
                          <span className="text-xs text-gray-500">No img</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">{item.product.name}</h4>
                      <p className="text-xs text-gray-500">
                        {item.quantity} × ${parseFloat(item.product.price.toString()).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {cartItems?.length ? (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <span className="text-sm font-medium">Total</span>
                <span className="text-sm font-medium">${totalAmount.toFixed(2)}</span>
              </div>
              <Button className="w-full" onClick={handleProceedToCheckout}>
                Proceed to Checkout
              </Button>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
            <DialogDescription>
              Complete your order by providing delivery details.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onCheckoutSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="deliveryAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St, City, Country" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-3">
                <h4 className="font-medium">Order Summary</h4>
                <div className="rounded-md bg-gray-50 p-4">
                  <div className="max-h-[200px] overflow-auto space-y-2">
                    {cartItems?.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>
                          {item.quantity} × {item.product.name}
                        </span>
                        <span>
                          ${(parseFloat(item.product.price.toString()) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={placeOrderMutation.isPending}
                >
                  {placeOrderMutation.isPending ? "Processing..." : "Place Order"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
