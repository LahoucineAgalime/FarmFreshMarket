import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Order } from "@shared/schema";
import { format } from "date-fns";

interface RecentOrdersProps {
  orders?: Order[];
  isLoading: boolean;
}

export default function RecentOrders({ orders, isLoading }: RecentOrdersProps) {
  const { user } = useAuth();
  const isSeller = user?.role === 'farmer' || user?.role === 'fisherman';

  // Helper function to render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Processing</Badge>;
      case 'shipped':
        return <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100">Shipped</Badge>;
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Delivered</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: Date) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString.toString();
    }
  };

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="mt-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-medium leading-6 text-gray-900">Recent Orders</h2>
          <Link href="/orders">
            <a className="text-sm font-medium text-primary-600 hover:text-primary-500">View all</a>
          </Link>
        </div>
        <div className="-mx-4 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:-mx-6 md:mx-0 md:rounded-lg">
          <div className="min-w-full divide-y divide-gray-300 bg-white">
            <div className="bg-gray-50 px-6 py-3.5">
              <div className="grid grid-cols-6 gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-10" />
              </div>
            </div>
            <div className="divide-y divide-gray-200 bg-white">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="px-6 py-4">
                  <div className="grid grid-cols-6 gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-medium leading-6 text-gray-900">Recent Orders</h2>
        <Link href="/orders">
          <a className="text-sm font-medium text-primary-600 hover:text-primary-500">View all</a>
        </Link>
      </div>
      <div className="-mx-4 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:-mx-6 md:mx-0 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Order ID</th>
              <th scope="col" className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 sm:table-cell">
                {isSeller ? "Customer" : "Seller"}
              </th>
              <th scope="col" className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell">Date</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Amount</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {orders && orders.length > 0 ? (
              orders.slice(0, 4).map((order) => (
                <tr key={order.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    #{order.id.toString().padStart(6, '0')}
                  </td>
                  <td className="hidden whitespace-nowrap px-3 py-4 text-sm text-gray-500 sm:table-cell">
                    {isSeller ? `Customer #${order.buyerId}` : `Seller #${order.sellerId}`}
                  </td>
                  <td className="hidden whitespace-nowrap px-3 py-4 text-sm text-gray-500 lg:table-cell">
                    {formatDate(order.orderDate)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    ${parseFloat(order.totalAmount.toString()).toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {renderStatusBadge(order.status)}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <Link href={`/orders/${order.id}`}>
                      <a className="text-primary-600 hover:text-primary-900">
                        View<span className="sr-only">, order #{order.id.toString().padStart(6, '0')}</span>
                      </a>
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-gray-500">
                  No orders yet. {isSeller ? "Start selling your products!" : "Start buying products!"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
