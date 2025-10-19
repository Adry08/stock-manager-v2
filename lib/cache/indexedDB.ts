// lib/cache/indexedDB.ts

const DB_NAME = 'stock_manager_cache';
const DB_VERSION = 1;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class IndexedDBCache {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initPromise = this.init();
    }
  }

  private async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store pour les produits
        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products', { keyPath: 'key' });
        }

        // Store pour les settings
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // Store pour les exchange rates
        if (!db.objectStoreNames.contains('exchangeRates')) {
          db.createObjectStore('exchangeRates', { keyPath: 'key' });
        }

        // Store pour les clients
        if (!db.objectStoreNames.contains('clients')) {
          db.createObjectStore('clients', { keyPath: 'key' });
        }

        // Store pour les movements
        if (!db.objectStoreNames.contains('movements')) {
          db.createObjectStore('movements', { keyPath: 'key' });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (this.initPromise) {
      await this.initPromise;
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  async set<T>(
    storeName: string,
    key: string,
    data: T,
    ttlMinutes: number = 60
  ): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMinutes * 60 * 1000,
    };

    return new Promise((resolve, reject) => {
      const request = store.put({ key, ...entry });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(storeName: string, key: string): Promise<T | null> {
    const db = await this.ensureDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result as CacheEntry<T> | undefined;
        
        if (!result) {
          resolve(null);
          return;
        }

        // Vérifier l'expiration
        if (Date.now() > result.expiresAt) {
          this.delete(storeName, key);
          resolve(null);
          return;
        }

        resolve(result.data);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, key: string): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAll(): Promise<void> {
    await Promise.all([
      this.clear('products'),
      this.clear('settings'),
      this.clear('exchangeRates'),
      this.clear('clients'),
      this.clear('movements'),
    ]);
  }

  async getAll<T>(storeName: string): Promise<Array<{ key: string } & CacheEntry<T>>> {
    const db = await this.ensureDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllKeys(storeName: string): Promise<string[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
  }

  async count(storeName: string): Promise<number> {
    const db = await this.ensureDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getSize(): Promise<{ usage: number; quota: number; percentage: number }> {
    if (!('storage' in navigator && 'estimate' in navigator.storage)) {
      return { usage: 0, quota: 0, percentage: 0 };
    }

    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentage = quota > 0 ? (usage / quota) * 100 : 0;

    return { usage, quota, percentage };
  }

  async cleanup(): Promise<void> {
    const stores = ['products', 'settings', 'exchangeRates', 'clients'];
    
    for (const storeName of stores) {
      try {
        const db = await this.ensureDB();
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const items = await this.getAll(storeName);

        const now = Date.now();
        for (const item of items) {
          if ('expiresAt' in item && item.expiresAt < now) {
            await new Promise<void>((resolve, reject) => {
              const deleteRequest = store.delete(item.key);
              deleteRequest.onsuccess = () => resolve();
              deleteRequest.onerror = () => reject(deleteRequest.error);
            });
            console.log(`🧹 Suppression du cache expiré: ${item.key}`);
          }
        }
      } catch (error) {
        console.error(`Erreur nettoyage ${storeName}:`, error);
      }
    }
  }
}

export const cacheDB = new IndexedDBCache();