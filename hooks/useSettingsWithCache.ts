// hooks/useSettingsWithCache.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings, createSettings } from '@/services/api';
import { Settings } from '@/types';
import { cacheDB } from '@/lib/cache/indexedDB';

const CACHE_TTL_SETTINGS = 60; // 1 heure pour les settings

export function useSettingsWithCache(userId?: string) {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ['settings', userId],
    queryFn: async () => {
      if (!userId) throw new Error('userId manquant');

      const cacheKey = `settings_${userId}`;

      try {
        // Essayer le cache d'abord
        const cached = await cacheDB.get<Settings>('settings', cacheKey);
        
        if (cached) {
          console.log('⚙️ Settings chargés depuis le cache');
          
          // Rafraîchir en arrière-plan
          getSettings(userId).then(fresh => {
            cacheDB.set('settings', cacheKey, fresh, CACHE_TTL_SETTINGS);
            queryClient.setQueryData(['settings', userId], fresh);
          }).catch(err => console.error('Erreur rafraîchissement settings:', err));
          
          return cached;
        }

        console.log('🌐 Chargement des settings depuis l\'API');
        const fresh = await getSettings(userId);
        await cacheDB.set('settings', cacheKey, fresh, CACHE_TTL_SETTINGS);
        return fresh;
      } catch (error) {
        const staleCache = await cacheDB.get<Settings>('settings', cacheKey);
        if (staleCache) {
          console.log('⚠️ Utilisation du cache settings expiré');
          return staleCache;
        }
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 heure
  });

  const update = useMutation({
    mutationFn: async (newSettings: Partial<Settings>) => {
      if (!userId) throw new Error('userId manquant');
      return await updateSettings(userId, newSettings);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings', userId] });
      if (userId) {
        await cacheDB.delete('settings', `settings_${userId}`);
      }
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('userId manquant');
      return await createSettings(userId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings', userId] });
      if (userId) {
        await cacheDB.delete('settings', `settings_${userId}`);
      }
    },
  });

  return {
    settings,
    isLoading,
    update,
    create,
  };
}