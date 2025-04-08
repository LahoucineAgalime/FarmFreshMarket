import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema, Product } from "@shared/schema";
import { z } from "zod";
import { Loader2, Upload } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { useMutation } from "@tanstack/react-query";

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
}

// Extend the product schema for form validation
const formSchema = insertProductSchema.extend({
  price: z.string().min(1, "Price is required"), // Handle as string for input
  quantity: z.string().min(1, "Quantity is required"), // Handle as string for input
});

type FormValues = z.infer<typeof formSchema>;

export default function ProductForm({ isOpen, onClose, product }: ProductFormProps) {
  const { toast } = useToast();
  const [isImageUploading, setIsImageUploading] = useState(false);
  const isEditing = !!product;

  // Convert product values for the form
  const defaultValues: FormValues = {
    name: product?.name || "",
    description: product?.description || "",
    price: product ? product.price.toString() : "",
    quantity: product ? product.quantity.toString() : "",
    category: product?.category || "",
    unit: product?.unit || "kg",
    imageUrl: product?.imageUrl || "",
    isAvailable: product?.isAvailable ?? true,
    sellerId: 0, // This will be set by the server
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Create or update product mutation
  const productMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Convert string values to numbers for submission
      const productData = {
        ...values,
        price: parseFloat(values.price),
        quantity: parseInt(values.quantity),
      };

      if (isEditing) {
        await apiRequest("PUT", `/api/products/${product.id}`, productData);
      } else {
        await apiRequest("POST", "/api/products", productData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products/seller"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: isEditing ? "Product updated" : "Product created",
        description: isEditing
          ? "Your product has been updated successfully"
          : "Your product has been created successfully",
      });
      onClose();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditing ? "update" : "create"} product`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    productMutation.mutate(values);
  };

  // In a real app, this would handle image uploads to a service like AWS S3 or Cloudinary
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImageUploading(true);

    // Simulate image upload
    setTimeout(() => {
      // This is a placeholder URL - in a real app, this would be the URL returned by your image hosting service
      const mockImageUrl = `https://source.unsplash.com/random/300x200?${encodeURIComponent(form.getValues("category") || "product")}`;
      form.setValue("imageUrl", mockImageUrl);
      setIsImageUploading(false);
      
      toast({
        title: "Image uploaded",
        description: "Your product image has been uploaded successfully",
      });
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Product" : "Add New Product"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update your product information below"
              : "Fill in the details below to add a new product to your inventory"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Fresh Organic Tomatoes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your product..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Include details like growing conditions and harvest date.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <FormControl>
                        <Input
                          className="pl-7"
                          placeholder="0.00"
                          type="number"
                          step="0.01"
                          min="0"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="kg">Kilogram (kg)</SelectItem>
                        <SelectItem value="lb">Pound (lb)</SelectItem>
                        <SelectItem value="item">Item</SelectItem>
                        <SelectItem value="bunch">Bunch</SelectItem>
                        <SelectItem value="dozen">Dozen</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity Available</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="e.g. 100"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fruits">Fruits</SelectItem>
                        <SelectItem value="vegetables">Vegetables</SelectItem>
                        <SelectItem value="dairy">Dairy Products</SelectItem>
                        <SelectItem value="grains">Grains</SelectItem>
                        <SelectItem value="seafood">Seafood</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isAvailable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Product Availability</FormLabel>
                    <FormDescription>
                      Make this product available for purchase
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Image</FormLabel>
                  <div className="mt-1">
                    {field.value ? (
                      <div className="relative mb-4">
                        <img
                          src={field.value}
                          alt="Product preview"
                          className="h-40 w-full rounded-md object-cover"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="absolute right-2 top-2"
                          onClick={() => form.setValue("imageUrl", "")}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pb-6 pt-5">
                        <div className="space-y-1 text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <div className="flex text-sm text-gray-600">
                            <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-medium text-primary-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 hover:text-primary-500">
                              <span>Upload a file</span>
                              <input 
                                id="file-upload" 
                                name="file-upload" 
                                type="file" 
                                className="sr-only" 
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={isImageUploading}
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                          {isImageUploading && (
                            <div className="mt-2 flex items-center justify-center text-sm text-gray-500">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <FormControl>
                    <Input type="hidden" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={productMutation.isPending || isImageUploading}
              >
                {productMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  isEditing ? "Update Product" : "Add Product"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
