import { Product } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useMutation } from "@tanstack/react-query";
import ProductForm from "./product-form";

interface ProductCardProps {
  product: Product;
  isOwner?: boolean;
}

export default function ProductCard({ product, isOwner = false }: ProductCardProps) {
  const { toast } = useToast();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/products/${product.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products/seller"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product deleted",
        description: "Your product has been deleted successfully",
      });
      setShowDeleteDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/cart", {
        productId: product.id,
        quantity: 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add product to cart",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    deleteProductMutation.mutate();
  };

  const handleAddToCart = () => {
    addToCartMutation.mutate();
  };

  return (
    <>
      <Card className="overflow-hidden bg-white shadow">
        <div className="relative h-48">
          {product.imageUrl ? (
            <img 
              className="h-full w-full object-cover" 
              src={product.imageUrl} 
              alt={product.name} 
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100">
              <svg 
                className="h-12 w-12 text-gray-400" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
            <Badge className={product.isAvailable ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-red-100 text-red-800 hover:bg-red-100"}>
              {product.isAvailable ? "In Stock" : "Out of Stock"}
            </Badge>
          </div>
          <p className="mb-2 text-sm text-gray-500">{product.description}</p>
          <div className="mb-4 flex items-center text-sm text-gray-700">
            <span className="font-medium">${parseFloat(product.price.toString()).toFixed(2)}</span>
            <span className="ml-1 text-xs">/ {product.unit}</span>
          </div>
          <div className="flex justify-between">
            {isOwner ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setShowEditForm(true)}>
                  <Edit className="mr-2 h-4 w-4 text-gray-400" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDelete}
                  disabled={deleteProductMutation.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4 text-gray-400" />
                  Delete
                </Button>
              </>
            ) : (
              <Button 
                className="w-full" 
                onClick={handleAddToCart}
                disabled={addToCartMutation.isPending || !product.isAvailable}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Edit Form Modal */}
      <ProductForm 
        isOpen={showEditForm} 
        onClose={() => setShowEditForm(false)} 
        product={product}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your product and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteProductMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
