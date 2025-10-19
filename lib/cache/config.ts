// lib/cache/config.ts

/**
 * Configuration centralisée du cache pour Stock Manager v2
 */

export const CACHE_CONFIG = {
  // Durées de vie du cache (en minutes)
  TTL: {
    PRODUCTS: 30,           // 30 minutes - données fréquemment modifiées
    SETTINGS: 60,           // 1 heure - changent rarement
    EXCHANGE_RATES: 720,    // 12 heures - très stable
    CLIENTS: 15,            // 15 minutes
    MOVEMENTS: 10,          // 10 minutes - historique
  },

  // Durées stale pour React Query (en millisecondes)
  STALE_TIME: {
    PRODUCTS: 5 * 60 * 1000,        // 5 minutes
    SETTINGS: 10 * 60 * 1000,       // 10 minutes
    EXCHANGE_RATES: 6 * 60 * 60 * 1000,  // 6 heures
    CLIENTS: 3 * 60 * 1000,         // 3 minutes
    MOVEMENTS: 2 * 60 * 1000,       // 2 minutes
  },

  // Durées de garbage collection (en millisecondes)
  GC_TIME: {
    PRODUCTS: 30 * 60 * 1000,       // 30 minutes
    SETTINGS: 60 * 60 * 1000,       // 1 heure
    EXCHANGE_RATES: 24 * 60 * 60 * 1000,  // 24 heures
    CLIENTS: 20 * 60 * 1000,        // 20 minutes
    MOVEMENTS: 15 * 60 * 1000,      // 15 minutes
  },

  // Noms des stores IndexedDB
  STORES: {
    PRODUCTS: 'products',
    SETTINGS: 'settings',
    EXCHANGE_RATES: 'exchangeRates',
    CLIENTS: 'clients',
    MOVEMENTS: 'movements',
  },

  // Clés de cache
  KEYS: {
    ALL_PRODUCTS: 'all_products',
    SETTINGS_PREFIX: 'settings_',
    EXCHANGE_RATES: 'rates',
    ALL_CLIENTS: 'all_clients',
    PRODUCT_CLIENTS_PREFIX: 'clients_product_',
  },

  // Options
  OPTIONS: {
    ENABLE_BACKGROUND_SYNC: true,
    RETRY_ATTEMPTS: 2,
    RETRY_DELAY: 1000,
    MAX_RETRY_DELAY: 30000,
  },
} as const;

// Types utiles
export type CacheStore = typeof CACHE_CONFIG.STORES[keyof typeof CACHE_CONFIG.STORES];
export type CacheKey = string;

// Fonction helper pour générer des clés de cache
export const getCacheKey = {
  products: () => CACHE_CONFIG.KEYS.ALL_PRODUCTS,
  settings: (userId: string) => `${CACHE_CONFIG.KEYS.SETTINGS_PREFIX}${userId}`,
  exchangeRates: () => CACHE_CONFIG.KEYS.EXCHANGE_RATES,
  clients: () => CACHE_CONFIG.KEYS.ALL_CLIENTS,
  productClients: (productId: string) => `${CACHE_CONFIG.KEYS.PRODUCT_CLIENTS_PREFIX}${productId}`,
};