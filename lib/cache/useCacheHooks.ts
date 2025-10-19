// lib/cache/useCacheHooks.ts
"use client";

import { useState, useEffect } from 'react';

/**
 * Hook pour vérifier l'état de la connexion
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' && typeof navigator !== 'undefined' 
      ? navigator.onLine 
      : true
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook pour obtenir la taille du cache
 */
export function useCacheSize() {
  const [cacheSize, setCacheSize] = useState<{
    usage: number;
    quota: number;
    percentage: number;
    formatted: string;
  } | null>(null);

  useEffect(() => {
    const getCacheSize = async () => {
      if (!('storage' in navigator && 'estimate' in navigator.storage)) {
        return null;
      }

      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentage = quota > 0 ? (usage / quota) * 100 : 0;

      const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
      };

      return {
        usage,
        quota,
        percentage,
        formatted: `${formatBytes(usage)} / ${formatBytes(quota)} (${Math.round(percentage)}%)`,
      };
    };

    getCacheSize().then(setCacheSize);
  }, []);

  return cacheSize;
}