// hooks/useProductsWithCache.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Product } from '@/types';
import { getProducts, updateProductStatus, addProduct, updateProduct, deleteProduct } from '@/services/api';
import { cacheDB } from '@/lib/cache/indexedDB';

const CACHE_KEY_PRODUCTS = 'all_products';
const CACHE_TTL_MINUTES = 30; // 30 minutes de cache

export function useProductsWithCache() {
  const queryClient = useQueryClient();

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      try {
        // 1. Essayer de charger depuis le cache
        const cached = await cacheDB.get<Product[]>('products', CACHE_KEY_PRODUCTS);
        
        if (cached) {
          console.log('📦 Produits chargés depuis le cache');
          
          // Charger les données fraîches en arrière-plan
          getProducts().then(fresh => {
            cacheDB.set('products', CACHE_KEY_PRODUCTS, fresh, CACHE_TTL_MINUTES);
            queryClient.setQueryData(['products'], fresh);
          }).catch(err => console.error('Erreur lors du rafraîchissement:', err));
          
          return cached;
        }

        // 2. Si pas de cache, charger depuis l'API
        console.log('🌐 Chargement des produits depuis l\'API');
        const fresh = await getProducts();
        
        // 3. Sauvegarder dans le cache
        await cacheDB.set('products', CACHE_KEY_PRODUCTS, fresh, CACHE_TTL_MINUTES);
        
        return fresh;
      } catch (error) {
        console.error('Erreur lors du chargement des produits:', error);
        
        // En cas d'erreur réseau, essayer le cache même expiré
        const staleCache = await cacheDB.get<Product[]>('products', CACHE_KEY_PRODUCTS);
        if (staleCache) {
          console.log('⚠️ Utilisation du cache expiré (mode hors ligne)');
          return staleCache;
        }
        
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // Considérer les données comme fraîches pendant 5 minutes
    gcTime: 30 * 60 * 1000, // Garder en mémoire pendant 30 minutes
  });

  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Product['status'] }) => 
      updateProductStatus({ id, status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      // Supprimer le cache pour forcer un rechargement
      await cacheDB.delete('products', CACHE_KEY_PRODUCTS);
    },
  });

  const addProductMutation = useMutation({
    mutationFn: (newProduct: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => 
      addProduct(newProduct),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await cacheDB.delete('products', CACHE_KEY_PRODUCTS);
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: (product: Product) => updateProduct(product),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await cacheDB.delete('products', CACHE_KEY_PRODUCTS);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await cacheDB.delete('products', CACHE_KEY_PRODUCTS);
    },
  });

  return { 
    products, 
    isLoading,
    error,
    changeStatus, 
    addProduct: addProductMutation,
    updateProduct: updateProductMutation,
    deleteProduct: deleteProductMutation
  };
}