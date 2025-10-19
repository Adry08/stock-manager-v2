// hooks/useMovementsWithCache.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { getMovements } from '@/services/api';
import { Movement } from '@/types';
import { cacheDB } from '@/lib/cache/indexedDB';
import { CACHE_CONFIG, getCacheKey } from '@/lib/cache/config';

const CACHE_TTL_MOVEMENTS = 10; // 10 minutes - données historiques

export function useMovementsWithCache() {
  const query = useInfiniteQuery({
    queryKey: ['movements'],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const cacheKey = `movements_page_${pageParam}`;
      
      try {
        // 1. Essayer de charger depuis le cache
        const cached = await cacheDB.get<Movement[]>(
          CACHE_CONFIG.STORES.MOVEMENTS || 'movements',
          cacheKey
        );
        
        if (cached) {
          console.log(`📦 Mouvements page ${pageParam} chargés depuis le cache`);
          
          // Rafraîchir en arrière-plan
          getMovements(pageParam, 10).then(fresh => {
            cacheDB.set(
              CACHE_CONFIG.STORES.MOVEMENTS || 'movements',
              cacheKey,
              fresh,
              CACHE_TTL_MOVEMENTS
            );
          }).catch(err => console.error('Erreur rafraîchissement movements:', err));
          
          return cached;
        }

        // 2. Si pas de cache, charger depuis l'API
        console.log(`🌐 Chargement des mouvements page ${pageParam} depuis l'API`);
        const fresh = await getMovements(pageParam, 10);
        
        // 3. Sauvegarder dans le cache
        await cacheDB.set(
          CACHE_CONFIG.STORES.MOVEMENTS || 'movements',
          cacheKey,
          fresh,
          CACHE_TTL_MOVEMENTS
        );
        
        return fresh;
      } catch (error) {
        console.error('Erreur lors du chargement des mouvements:', error);
        
        // En cas d'erreur, essayer le cache même expiré
        const staleCache = await cacheDB.get<Movement[]>(
          CACHE_CONFIG.STORES.MOVEMENTS || 'movements',
          cacheKey
        );
        
        if (staleCache) {
          console.log(`⚠️ Utilisation du cache expiré pour page ${pageParam}`);
          return staleCache;
        }
        
        throw error;
      }
    },
    getNextPageParam: (lastPage, pages) => 
      lastPage.length > 0 ? pages.length : undefined,
    initialPageParam: 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  return query;
}