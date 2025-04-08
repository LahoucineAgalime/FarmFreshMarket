import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layouts/sidebar";
import MobileMenu from "@/components/ui/mobile-menu";
import CartDropdown from "@/components/cart/cart-dropdown";
import OrderTable from "@/components/orders/order-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function OrdersPage() {
  const { user } = useAuth();
  
  // Get orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ["/api/orders"],
  });

  // Count orders by status
  const pendingCount = orders?.filter(order => order.status === 'pending').length || 0;
  const processingCount = orders?.filter(order => order.status === 'processing').length || 0;
  const shippedCount = orders?.filter(order => order.status === 'shipped').length || 0;
  const deliveredCount = orders?.filter(order => order.status === 'delivered').length || 0;
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile menu */}
      <div className="lg:hidden">
        <MobileMenu />
      </div>

      <div className="flex h-screen overflow-hidden bg-gray-100">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top navigation */}
          <header className="bg-white shadow">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
              <h1 className="text-2xl font-bold leading-tight text-gray-900">Orders</h1>
              <div className="flex items-center space-x-4">
                {user?.role === 'wholesaler' && <CartDropdown />}
              </div>
            </div>
          </header>

          {/* Main content area */}
          <main className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:px-6 lg:px-8">
            <div className="py-4">
              {/* Order Summary Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Pending</p>
                        <p className="text-3xl font-bold">{pendingCount}</p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Processing</p>
                        <p className="text-3xl font-bold">{processingCount}</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Processing</Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Shipped</p>
                        <p className="text-3xl font-bold">{shippedCount}</p>
                      </div>
                      <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100">Shipped</Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Delivered</p>
                        <p className="text-3xl font-bold">{deliveredCount}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Delivered</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Orders Table */}
              {isLoading ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
                </div>
              ) : (
                <OrderTable orders={orders || []} />
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
