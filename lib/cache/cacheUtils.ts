// lib/cache/cacheUtils.ts
import { cacheDB } from './indexedDB';

/**
 * Fonction utilitaire pour gérer le cache avec stale-while-revalidate
 */
export async function getCachedOrFetch<T>(
  storeName: string,
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttlMinutes: number = 30
): Promise<T> {
  try {
    // 1. Vérifier le cache
    const cached = await cacheDB.get<T>(storeName, cacheKey);
    
    if (cached) {
      console.log(`📦 Données chargées depuis le cache: ${cacheKey}`);
      
      // Rafraîchir en arrière-plan (stale-while-revalidate)
      fetchFn()
        .then(fresh => {
          cacheDB.set(storeName, cacheKey, fresh, ttlMinutes);
        })
        .catch(err => {
          console.error(`Erreur lors du rafraîchissement de ${cacheKey}:`, err);
        });
      
      return cached;
    }

    // 2. Pas de cache, charger depuis l'API
    console.log(`🌐 Chargement depuis l'API: ${cacheKey}`);
    const fresh = await fetchFn();
    
    // 3. Sauvegarder dans le cache
    await cacheDB.set(storeName, cacheKey, fresh, ttlMinutes);
    
    return fresh;
  } catch (error) {
    console.error(`Erreur lors du chargement de ${cacheKey}:`, error);
    
    // En cas d'erreur, essayer de récupérer le cache même expiré
    const staleCache = await cacheDB.get<T>(storeName, cacheKey);
    if (staleCache) {
      console.log(`⚠️ Utilisation du cache expiré pour ${cacheKey} (mode hors ligne)`);
      return staleCache;
    }
    
    throw error;
  }
}

/**
 * Invalider le cache d'une clé spécifique
 */
export async function invalidateCache(storeName: string, cacheKey: string): Promise<void> {
  await cacheDB.delete(storeName, cacheKey);
  console.log(`🗑️ Cache invalidé: ${cacheKey}`);
}

/**
 * Invalider tout le cache d'un store
 */
export async function invalidateStoreCache(storeName: string): Promise<void> {
  await cacheDB.clear(storeName);
  console.log(`🗑️ Store cache invalidé: ${storeName}`);
}

/**
 * Invalider tout le cache
 */
export async function invalidateAllCache(): Promise<void> {
  await cacheDB.clearAll();
  console.log('🗑️ Tout le cache a été invalidé');
}

/**
 * Pré-charger des données dans le cache
 */
export async function prefetchToCache<T>(
  storeName: string,
  cacheKey: string,
  data: T,
  ttlMinutes: number = 30
): Promise<void> {
  await cacheDB.set(storeName, cacheKey, data, ttlMinutes);
  console.log(`💾 Données pré-chargées dans le cache: ${cacheKey}`);
}

/**
 * Vérifier si une clé existe dans le cache (non expirée)
 */
export async function isCached(storeName: string, cacheKey: string): Promise<boolean> {
  const cached = await cacheDB.get(storeName, cacheKey);
  return cached !== null;
}

/**
 * Obtenir les statistiques du cache
 */
export async function getCacheStats(): Promise<{
  hasProducts: boolean;
  hasSettings: boolean;
  hasExchangeRates: boolean;
  hasClients: boolean;
}> {
  return {
    hasProducts: await isCached('products', 'all_products'),
    hasSettings: await isCached('settings', 'settings_'),
    hasExchangeRates: await isCached('exchangeRates', 'rates'),
    hasClients: await isCached('clients', 'all_clients'),
  };
}