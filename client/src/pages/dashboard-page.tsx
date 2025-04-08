import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layouts/sidebar";
import StatsCard from "@/components/dashboard/stats-card";
import RecentOrders from "@/components/dashboard/recent-orders";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/products/product-card";
import { useState } from "react";
import ProductForm from "@/components/products/product-form";
import { Loader2, Plus } from "lucide-react";
import MobileMenu from "@/components/ui/mobile-menu";
import CartDropdown from "@/components/cart/cart-dropdown";
import { Product } from "@shared/schema";

export default function DashboardPage() {
  const { user } = useAuth();
  const [showProductForm, setShowProductForm] = useState(false);
  
  const isSeller = user?.role === 'farmer' || user?.role === 'fisherman';
  
  // Get user-specific products (for sellers) or all products (for buyers)
  const { data: products, isLoading: isProductsLoading } = useQuery<Product[]>({
    queryKey: [isSeller ? "/api/products/seller" : "/api/products"],
  });

  // Get orders
  const { data: orders, isLoading: isOrdersLoading } = useQuery({
    queryKey: ["/api/orders"],
  });

  // Stats data calculation
  const pendingOrders = orders?.filter(order => order.status === 'pending').length || 0;
  const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.totalAmount.toString()), 0) || 0;
  const totalProducts = products?.length || 0;
  const productViews = 245; // We don't track this currently, but showing as a placeholder
  
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
              <h1 className="text-2xl font-bold leading-tight text-gray-900">Dashboard</h1>
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm">
                  <svg className="-ml-0.5 mr-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span>Notifications</span>
                </Button>
                {user?.role === 'wholesaler' && <CartDropdown />}
              </div>
            </div>
          </header>

          {/* Main content area */}
          <main className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:px-6 lg:px-8">
            <div className="py-4">
              {/* Dashboard statistics */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard 
                  title="Total Products"
                  value={totalProducts}
                  icon={
                    <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  }
                  linkText="View all"
                  linkHref="/products"
                />
                <StatsCard 
                  title="Pending Orders"
                  value={pendingOrders}
                  icon={
                    <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                  linkText="View all"
                  linkHref="/orders"
                />
                <StatsCard 
                  title="Total Revenue"
                  value={`$${totalRevenue.toFixed(2)}`}
                  icon={
                    <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  linkText="View report"
                  linkHref="/analytics"
                />
                <StatsCard 
                  title="Product Views"
                  value={productViews}
                  icon={
                    <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  }
                  linkText="View analytics"
                  linkHref="/analytics"
                />
              </div>

              {/* Recent Orders */}
              <RecentOrders orders={orders} isLoading={isOrdersLoading} />

              {/* Products Section */}
              <div className="mt-8">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-medium leading-6 text-gray-900">
                    {isSeller ? "Your Products" : "Available Products"}
                  </h2>
                  {isSeller && (
                    <Button onClick={() => setShowProductForm(true)}>
                      <Plus className="-ml-1 mr-2 h-5 w-5" />
                      Add New Product
                    </Button>
                  )}
                </div>
                
                {isProductsLoading ? (
                  <div className="flex justify-center p-12">
                    <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
                  </div>
                ) : products && products.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {products.map((product) => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        isOwner={isSeller}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow p-6 text-center">
                    <p className="text-gray-500">
                      {isSeller 
                        ? "You haven't added any products yet. Add your first product to start selling!" 
                        : "No products available at the moment. Check back later!"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Product Form Modal */}
      <ProductForm 
        isOpen={showProductForm} 
        onClose={() => setShowProductForm(false)} 
      />
    </div>
  );
}
