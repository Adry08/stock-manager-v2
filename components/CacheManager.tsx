// components/CacheManager.tsx
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, RefreshCw, Database, CheckCircle2, XCircle, Wifi, WifiOff } from 'lucide-react';
import { invalidateAllCache, getCacheStats } from '@/lib/cache/cacheUtils';
import { useOnlineStatus } from '@/lib/cache/useCacheHooks';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function CacheManager() {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const [cacheStats, setCacheStats] = useState({
    hasProducts: false,
    hasSettings: false,
    hasExchangeRates: false,
    hasClients: false,
  });
  const [isClearing, setIsClearing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadCacheStats();
  }, []);

  const loadCacheStats = async () => {
    try {
      const stats = await getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
    }
  };

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await invalidateAllCache();
      queryClient.clear();
      await loadCacheStats();
      toast.success('Cache vidé avec succès !');
    } catch (error) {
      console.error('Erreur lors du vidage du cache:', error);
      toast.error('Erreur lors du vidage du cache');
    } finally {
      setIsClearing(false);
    }
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries();
      await loadCacheStats();
      toast.success('Données rafraîchies avec succès !');
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
      toast.error('Erreur lors du rafraîchissement');
    } finally {
      setIsRefreshing(false);
    }
  };

  const cacheItems = [
    { label: 'Produits', key: 'hasProducts', cached: cacheStats.hasProducts },
    { label: 'Paramètres', key: 'hasSettings', cached: cacheStats.hasSettings },
    { label: 'Taux de change', key: 'hasExchangeRates', cached: cacheStats.hasExchangeRates },
    { label: 'Clients', key: 'hasClients', cached: cacheStats.hasClients },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Gestion du Cache
            </CardTitle>
            <CardDescription className="mt-1">
              Gérez le cache local pour améliorer les performances
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Badge variant="default" className="bg-green-500">
                <Wifi className="w-3 h-3 mr-1" />
                En ligne
              </Badge>
            ) : (
              <Badge variant="destructive">
                <WifiOff className="w-3 h-3 mr-1" />
                Hors ligne
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* État du cache */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            État du cache
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cacheItems.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {item.label}
                </span>
                {item.cached ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleRefreshAll}
            disabled={isRefreshing || !isOnline}
            className="flex-1"
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Rafraîchissement...' : 'Rafraîchir tout'}
          </Button>
          
          <Button
            onClick={handleClearCache}
            disabled={isClearing}
            variant="destructive"
            className="flex-1"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isClearing ? 'Vidage...' : 'Vider le cache'}
          </Button>
        </div>

        {/* Informations */}
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            💡 <strong>Astuce :</strong> Le cache permet d'accéder aux données même hors ligne. 
            Les données sont automatiquement rafraîchies lorsque vous êtes en ligne.
          </p>
        </div>

        {/* Mode hors ligne */}
        {!isOnline && (
          <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
            <p className="text-sm text-orange-800 dark:text-orange-300">
              📵 <strong>Mode hors ligne :</strong> Vous consultez les données en cache. 
              Reconnectez-vous pour synchroniser les dernières modifications.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}