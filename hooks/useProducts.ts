import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Product } from '@/types';
import { getProducts, updateProductStatus, addProduct, updateProduct, deleteProduct } from '@/services/api';

export function useProducts() {
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts
  });

  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Product['status'] }) => 
      updateProductStatus({ id, status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  const addProductMutation = useMutation({
    mutationFn: (newProduct: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => 
      addProduct(newProduct),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  const updateProductMutation = useMutation({
    mutationFn: (product: Product) => updateProduct(product),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  return { 
    products, 
    isLoading, 
    changeStatus, 
    addProduct: addProductMutation,
    updateProduct: updateProductMutation,
    deleteProduct: deleteProductMutation
  };
}