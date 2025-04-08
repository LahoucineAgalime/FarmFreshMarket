import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Home, 
  Package, 
  ShoppingBag, 
  Users, 
  BarChart, 
  Settings, 
  LogOut 
} from "lucide-react";

export default function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  
  const handleLogout = () => {
    logoutMutation.mutate();
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
    <div className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex w-64 flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
          <div className="flex flex-1 flex-col overflow-y-auto pb-4 pt-5">
            <div className="flex flex-shrink-0 items-center px-4">
              <svg className="h-8 w-8 text-primary-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3L4 9V21H20V9L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 14C8 12.8954 8.89543 12 10 12H14C15.1046 12 16 12.8954 16 14V21H8V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 21V17H15V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="ml-2 text-lg font-bold text-gray-800">HarvestDirect</span>
            </div>
            <nav className="mt-5 flex-1 space-y-1 px-2">
              {navItems.map((item) => (
                <Link 
                  key={item.path} 
                  href={item.path}
                >
                  <a
                    className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${
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
          <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
            <div className="group block w-full flex-shrink-0">
              <div className="flex items-center">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary-100 text-primary-800">
                    {user?.name?.substring(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700 capitalize">
                    {user?.role || "Guest"}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  title="Logout"
                >
                  <LogOut className="h-5 w-5 text-gray-400" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
