import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layouts/sidebar";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/products/product-card";
import { useState } from "react";
import ProductForm from "@/components/products/product-form";
import { Loader2, Plus, Search } from "lucide-react";
import MobileMenu from "@/components/ui/mobile-menu";
import CartDropdown from "@/components/cart/cart-dropdown";
import { Product } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ProductPage() {
  const { user } = useAuth();
  const [showProductForm, setShowProductForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  const isSeller = user?.role === 'farmer' || user?.role === 'fisherman';
  
  // Get user-specific products (for sellers) or all products (for buyers)
  const { data: products, isLoading: isProductsLoading } = useQuery<Product[]>({
    queryKey: [isSeller ? "/api/products/seller" : "/api/products"],
  });

  // Filter products based on search and category
  const filteredProducts = products?.filter(product => {
    const matchesSearch = 
      searchQuery === "" || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === "all" || 
      product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = products 
    ? ["all", ...new Set(products.map(product => product.category))]
    : ["all"];
  
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
              <h1 className="text-2xl font-bold leading-tight text-gray-900">Products</h1>
              <div className="flex items-center space-x-4">
                {user?.role === 'wholesaler' && <CartDropdown />}
              </div>
            </div>
          </header>

          {/* Main content area */}
          <main className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:px-6 lg:px-8">
            <div className="py-4">
              {/* Search and filters */}
              <div className="mb-6 grid gap-4 md:grid-cols-4">
                <div className="md:col-span-2 relative">
                  <Input
                    className="pl-10"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
                <div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category === "all" ? "All Categories" : category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {isSeller && (
                  <div className="flex justify-end">
                    <Button onClick={() => setShowProductForm(true)}>
                      <Plus className="-ml-1 mr-2 h-5 w-5" />
                      Add New Product
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Products listing */}
              {isProductsLoading ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
                </div>
              ) : filteredProducts && filteredProducts.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredProducts.map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      isOwner={isSeller && product.sellerId === user?.id}
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
