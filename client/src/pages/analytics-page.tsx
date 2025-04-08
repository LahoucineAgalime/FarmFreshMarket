import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layouts/sidebar";
import MobileMenu from "@/components/ui/mobile-menu";
import CartDropdown from "@/components/cart/cart-dropdown";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function AnalyticsPage() {
  const { user } = useAuth();
  
  // Get orders
  const { data: orders, isLoading: isOrdersLoading } = useQuery({
    queryKey: ["/api/orders"],
  });

  // Get products
  const { data: products, isLoading: isProductsLoading } = useQuery({
    queryKey: [user?.role === 'wholesaler' ? "/api/products" : "/api/products/seller"],
  });

  const isLoading = isOrdersLoading || isProductsLoading;

  // Dummy data for charts
  // In a real app, we would process real data from orders and products
  
  // Sample revenue data (by month)
  const revenueData = [
    { name: 'Jan', revenue: 1000 },
    { name: 'Feb', revenue: 1500 },
    { name: 'Mar', revenue: 2000 },
    { name: 'Apr', revenue: 2500 },
    { name: 'May', revenue: 3000 },
    { name: 'Jun', revenue: 2700 },
  ];
  
  // Sample order status data
  const orderStatusData = [
    { name: 'Pending', value: orders?.filter(order => order.status === 'pending').length || 2 },
    { name: 'Processing', value: orders?.filter(order => order.status === 'processing').length || 3 },
    { name: 'Shipped', value: orders?.filter(order => order.status === 'shipped').length || 4 },
    { name: 'Delivered', value: orders?.filter(order => order.status === 'delivered').length || 8 },
  ];

  // Sample product categories data
  let categoryData = [
    { name: 'Fruits', value: 12 },
    { name: 'Vegetables', value: 18 },
    { name: 'Dairy', value: 6 },
    { name: 'Seafood', value: 9 },
    { name: 'Other', value: 3 },
  ];

  // Process real product data if available
  if (products && products.length > 0) {
    // Count products by category
    const categoryCounts = products.reduce((acc: Record<string, number>, product) => {
      if (!acc[product.category]) {
        acc[product.category] = 0;
      }
      acc[product.category]++;
      return acc;
    }, {});
    
    // Convert to format needed for chart
    categoryData = Object.entries(categoryCounts).map(([name, value]) => ({
      name,
      value
    }));
  }

  // Colors for pie charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
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
              <h1 className="text-2xl font-bold leading-tight text-gray-900">Analytics</h1>
              <div className="flex items-center space-x-4">
                {user?.role === 'wholesaler' && <CartDropdown />}
              </div>
            </div>
          </header>

          {/* Main content area */}
          <main className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
              </div>
            ) : (
              <div className="py-4 space-y-6">
                {/* Revenue Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Over Time</CardTitle>
                    <CardDescription>Monthly revenue statistics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={revenueData}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                          <Area type="monotone" dataKey="revenue" stroke="#38A169" fill="#C6F6D5" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Status and Category Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Status Distribution</CardTitle>
                      <CardDescription>Current order status breakdown</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={orderStatusData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {orderStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [value, 'Orders']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Product Categories</CardTitle>
                      <CardDescription>Distribution by product category</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [value, 'Products']} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Product Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Products Performance</CardTitle>
                    <CardDescription>Products with the highest order volumes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={products?.slice(0, 5).map(product => ({
                            name: product.name,
                            sales: Math.floor(Math.random() * 50) + 10, // Placeholder data
                          })) || []}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="sales" fill="#38A169" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
