import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layouts/sidebar";
import MobileMenu from "@/components/ui/mobile-menu";
import CartDropdown from "@/components/cart/cart-dropdown";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Loader2, Mail, Phone, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function CustomersPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  // For sellers, get orders to extract customer info
  // For wholesalers, get farmers/fishermen they've bought from
  const { data: orders, isLoading } = useQuery({
    queryKey: ["/api/orders"],
  });

  // Get all users (we could create a specific API for this, but using existing data for now)
  const { data: products } = useQuery({
    queryKey: ["/api/products"],
  });

  // Extract unique customers or suppliers
  let contacts: {
    id: number;
    name: string;
    role: string;
    email?: string;
    phone?: string;
    totalOrders: number;
  }[] = [];

  if (orders && products) {
    // Create a map of user IDs to their info
    const userMap = new Map();
    
    // For sellers, extract buyers from orders
    if (user?.role === 'farmer' || user?.role === 'fisherman') {
      orders.forEach(order => {
        if (order.sellerId === user.id) {
          if (!userMap.has(order.buyerId)) {
            userMap.set(order.buyerId, {
              id: order.buyerId,
              name: "Wholesaler", // We don't have the name from orders
              role: "wholesaler",
              totalOrders: 1
            });
          } else {
            const existing = userMap.get(order.buyerId);
            userMap.set(order.buyerId, {
              ...existing,
              totalOrders: existing.totalOrders + 1
            });
          }
        }
      });
    }
    
    // For wholesalers, extract sellers from orders and products
    if (user?.role === 'wholesaler') {
      // First get sellers from orders
      orders.forEach(order => {
        if (order.buyerId === user.id) {
          if (!userMap.has(order.sellerId)) {
            userMap.set(order.sellerId, {
              id: order.sellerId,
              name: "Supplier", // Default name
              role: "supplier",
              totalOrders: 1
            });
          } else {
            const existing = userMap.get(order.sellerId);
            userMap.set(order.sellerId, {
              ...existing,
              totalOrders: existing.totalOrders + 1
            });
          }
        }
      });
      
      // Add product seller info
      products.forEach(product => {
        if (userMap.has(product.sellerId)) {
          const existing = userMap.get(product.sellerId);
          if (!existing.name || existing.name === "Supplier") {
            userMap.set(product.sellerId, {
              ...existing,
              role: "supplier"
            });
          }
        }
      });
    }
    
    contacts = Array.from(userMap.values());
  }

  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (contact.phone && contact.phone.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
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
              <h1 className="text-2xl font-bold leading-tight text-gray-900">
                {user?.role === 'wholesaler' ? 'Suppliers' : 'Customers'}
              </h1>
              <div className="flex items-center space-x-4">
                {user?.role === 'wholesaler' && <CartDropdown />}
              </div>
            </div>
          </header>

          {/* Main content area */}
          <main className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:px-6 lg:px-8">
            <div className="py-4">
              {/* Search */}
              <div className="mb-6 relative max-w-md">
                <Input
                  className="pl-10"
                  placeholder={`Search ${user?.role === 'wholesaler' ? 'suppliers' : 'customers'}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              
              {/* Contacts Grid */}
              {isLoading ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
                </div>
              ) : filteredContacts.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredContacts.map((contact) => (
                    <Card key={contact.id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary-100 text-primary-800">
                              {contact.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{contact.name}</h3>
                            <p className="text-sm text-gray-500 capitalize">{contact.role}</p>
                          </div>
                        </div>
                        
                        <div className="mt-4 space-y-2">
                          {contact.email && (
                            <div className="flex items-center text-sm">
                              <Mail className="mr-2 h-4 w-4 text-gray-400" />
                              <span>{contact.email}</span>
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="mr-2 h-4 w-4 text-gray-400" />
                              <span>{contact.phone}</span>
                            </div>
                          )}
                          <div className="text-sm text-gray-500">
                            Total Orders: {contact.totalOrders}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <p className="text-gray-500">
                    {user?.role === 'wholesaler' 
                      ? "You haven't purchased from any suppliers yet." 
                      : "You don't have any customers yet."}
                  </p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
