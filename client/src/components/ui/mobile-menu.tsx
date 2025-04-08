import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  Home, 
  Package, 
  ShoppingBag, 
  Users, 
  BarChart, 
  Settings, 
  LogOut,
  Menu
} from "lucide-react";
import CartDropdown from "../cart/cart-dropdown";

export default function MobileMenu() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  const handleLogout = () => {
    logoutMutation.mutate();
    setIsOpen(false);
  };

  const isActive = (path: string) => {
    return location === path;
  };

  const navItems = [
    { 
      path: "/", 
      label: "Dashboard", 
      icon: <Home className="mr-3 h-5 w-5" /> 
    },
    { 
      path: "/products", 
      label: "Products", 
      icon: <Package className="mr-3 h-5 w-5" /> 
    },
    { 
      path: "/orders", 
      label: "Orders", 
      icon: <ShoppingBag className="mr-3 h-5 w-5" /> 
    },
    { 
      path: "/customers", 
      label: user?.role === 'wholesaler' ? "Suppliers" : "Customers", 
      icon: <Users className="mr-3 h-5 w-5" /> 
    },
    { 
      path: "/analytics", 
      label: "Analytics", 
      icon: <BarChart className="mr-3 h-5 w-5" /> 
    },
    { 
      path: "/settings", 
      label: "Settings", 
      icon: <Settings className="mr-3 h-5 w-5" /> 
    },
  ];
  
  return (
    <div className="flex items-center justify-between bg-white px-4 py-3 shadow">
      <div className="flex items-center space-x-2">
        <svg className="h-8 w-8 text-primary-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 3L4 9V21H20V9L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 14C8 12.8954 8.89543 12 10 12H14C15.1046 12 16 12.8954 16 14V21H8V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 21V17H15V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-lg font-bold text-gray-800">HarvestDirect</span>
      </div>
      <div className="flex items-center space-x-2">
        {user?.role === 'wholesaler' && <CartDropdown />}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle className="flex items-center">
                <svg className="mr-2 h-8 w-8 text-primary-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 3L4 9V21H20V9L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 14C8 12.8954 8.89543 12 10 12H14C15.1046 12 16 12.8954 16 14V21H8V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 21V17H15V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                HarvestDirect
              </SheetTitle>
            </SheetHeader>
            <div className="flex h-full flex-col justify-between py-4">
              <div>
                <div className="flex items-center px-2 py-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary-100 text-primary-800">
                      {user?.name?.substring(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <p className="font-medium">{user?.name || "User"}</p>
                    <p className="text-sm text-gray-500 capitalize">{user?.role || "Guest"}</p>
                  </div>
                </div>
                <nav className="mt-4 space-y-2 px-2">
                  {navItems.map((item) => (
                    <Link 
                      key={item.path} 
                      href={item.path}
                      onClick={() => setIsOpen(false)}
                    >
                      <a
                        className={`flex items-center rounded-md px-2 py-3 text-sm font-medium ${
                          isActive(item.path)
                            ? "bg-primary-50 text-primary-700"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        {React.cloneElement(item.icon, {
                          className: `${
                            isActive(item.path)
                              ? "text-primary-500"
                              : "text-gray-400 group-hover:text-gray-500"
                          } mr-3 h-5 w-5`,
                        })}
                        {item.label}
                      </a>
                    </Link>
                  ))}
                </nav>
              </div>
              <div className="px-2 pt-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="mr-3 h-5 w-5 text-gray-400" />
                  Logout
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
